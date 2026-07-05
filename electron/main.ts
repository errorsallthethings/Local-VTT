import { app, BrowserWindow, dialog, ipcMain, net, protocol, screen, shell } from "electron";
import type { WebContents } from "electron";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import {
  Campaign,
  CampaignSummary,
  AssetPruneResult,
  SquareCropRect,
  TokenAssetPromotionResult,
  ThumbnailRegenerationProgress,
  ThumbnailRegenerationResult
} from "../src/shared/localvtt.js";
import {
  createAssetProtocolFileResponse,
  getAssetProtocolStatFailureResponse,
  getAssetProtocolStatResultFailureResponse,
  resolveAssetProtocolRequest
} from "./assetProtocol.js";
import { sceneFile } from "./campaignPaths.js";
import { assertInsidePath } from "./campaignPathSafety.js";
import {
  ensureCampaignFolders,
  readCampaignMetadata,
  readSceneMetadata,
  writeCampaign,
  writeScene
} from "./campaignMetadataFiles.js";
import { inspectCampaignHealth } from "./campaignHealth.js";
import { CampaignSessionRegistry } from "./campaignSessionRegistry.js";
import {
  createImageMapThumbnail,
  createSquareImageThumbnail
} from "./assets.js";
import { buildTokenAssetRelativePath, hydrateCampaignAssetPaths, requireCampaignRelativePath } from "./assetFiles.js";
import {
  assertAssetImportCandidate,
  copyAssetImportToCampaign
} from "./assetImportFiles.js";
import { removeCampaignAssetFiles } from "./assetFileRemoval.js";
import { mapMediaType } from "./assetImportValidation.js";
import {
  chooseDirectory,
  chooseMapFile,
  chooseTokenFile
} from "./fileDialogOptions.js";
import { unlinkIfExists } from "./fileOperations.js";
import { backupExistingMetadataFile } from "./metadataBackupFiles.js";
import { listCampaignMetadataBackups } from "./metadataBackupListing.js";
import {
  previewMetadataBackup,
  restoreMetadataBackup
} from "./metadataBackupRestore.js";
import {
  sceneBackupFolder
} from "./metadataBackups.js";
import { openMetadataBackupsFolder } from "./metadataBackupsFolder.js";
import { hydrateSceneSummaries } from "./campaignSceneSummaries.js";
import {
  consumeMapReplacementToken,
  createMapReplacementToken,
  type MapReplacementTokenStore
} from "./mapReplacementTokens.js";
import { removeMapAssetFromCampaign, removeMapAssetFromScene, replaceSceneMapAsset } from "./mapAssetMutations.js";
import { ensureMapThumbnails, type MapThumbnailResult } from "./mapThumbnailRepair.js";
import { getMapReplacementPreview } from "./mapReplacementPreview.js";
import { getMapAssetSceneNames, mapAssetUsedByOtherScenes } from "./mapAssetUsage.js";
import { createThumbnailImportFailureDiagnostic } from "./thumbnailDiagnostics.js";
import { removeThumbnailIfUnused, writeAssetThumbnail } from "./thumbnailFiles.js";
import { regenerateThumbnailAssets } from "./thumbnailRegeneration.js";
import { getTokenAssetUsage } from "./tokenAssetUsage.js";
import { removeAssetFromCampaign } from "./tokenAssetMutations.js";
import { pauseCampaignTurnOrders } from "./campaignTurnOrderPause.js";
import { registerPlayerViewIpc } from "./playerViewIpc.js";
import { getGmCloseRequestAction, getUnsavedChangesDialogAction } from "./gmWindowClose.js";
import { getLinuxGraphicsSwitches } from "./linuxGraphicsSwitches.js";
import { runSmokeTest } from "./smokeTestRunner.js";
import {
  assertIpcBoolean,
  assertIpcSafeId,
  assertSquareCropRect
} from "./ipcPayloadValidation.js";
import { addImportedAssetToCampaign, createImportedAsset, createStagedTokenImportAsset } from "./importedAssets.js";
import { tokenThumbnailVariant, updateTokenThumbnailInCampaign } from "./tokenThumbnailUpdate.js";
import { removeTokenAssetFromCampaignScenes } from "./tokenAssetSceneCleanup.js";
import { promoteTokenAssetThumbnails } from "./tokenAssetPromotion.js";
import { pruneUnreferencedAssets } from "./unreferencedAssetPruning.js";
import { assertSceneUsesMapAsset, requireCurrentMapAsset } from "./mapReplacementValidation.js";
import { findCampaignAsset, requireCampaignAsset, requireTokenAssetWithAbsolutePath } from "./campaignAssetLookup.js";
import { createAppWindowOptions, createWindowLoadTarget } from "./windowConfig.js";
import { createCampaignForFolder, resolveCurrentCampaignPath } from "./campaignOpenState.js";
import { createVideoMapThumbnailWithFallback } from "./videoThumbnailFallback.js";
import { registerSceneIpc } from "./sceneIpc.js";
import { registerCampaignIpc } from "./campaignIpc.js";

const isSmokeTest = process.env.LOCALVTT_SMOKE_TEST === "1";
const isVisualSmokeTest = process.env.LOCALVTT_VISUAL_SMOKE_TEST === "1";
const isDev = !app.isPackaged && !isSmokeTest;
const devServerUrl = "http://127.0.0.1:5173";
const appWindowIconPath = path.join(app.getAppPath(), "build", "icon.ico");

configureLinuxGraphicsSwitches();

if (isSmokeTest) {
  app.disableHardwareAcceleration();
  app.setPath("userData", path.join(app.getPath("temp"), "local-vtt-smoke-test"));
}

let gmWindow: BrowserWindow | null = null;
let playerWindow: BrowserWindow | null = null;
let lastPlayerProjection: unknown = null;
let gmHasUnsavedChanges = false;
let forceCloseGmWindow = false;
let currentCampaignPath: string | null = null;
const campaignSessions = new CampaignSessionRegistry();
const mapReplacementTokens: MapReplacementTokenStore = new Map();
const stagedTokenImports = new Map<string, { campaignPath: string; sourcePath: string; assetId: string; finalRelativePath: string; createdAt: string }>();

function configureLinuxGraphicsSwitches(): void {
  getLinuxGraphicsSwitches(process.platform, process.env).forEach((commandLineSwitch) => {
    app.commandLine.appendSwitch(commandLineSwitch.name, commandLineSwitch.value);
  });
}

// localvtt://asset URLs let renderer code display campaign files without exposing arbitrary filesystem access.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "localvtt",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: false
    }
  }
]);

function createWindow(hash: "gm" | "player"): BrowserWindow {
  const appPath = app.getAppPath();
  const win = new BrowserWindow(createAppWindowOptions(hash, appPath, appWindowIconPath));

  installWindowDiagnostics(win, hash);

  const loadTarget = createWindowLoadTarget(hash, isDev, devServerUrl, appPath);
  if (loadTarget.kind === "url") {
    void win.loadURL(loadTarget.value);
  } else {
    void win.loadFile(loadTarget.value, { hash: loadTarget.hash });
  }

  return win;
}

function installWindowDiagnostics(win: BrowserWindow, hash: "gm" | "player"): void {
  const label = hash === "gm" ? "GM" : "Player";

  win.webContents.on("render-process-gone", (_event, details) => {
    console.error(`LOCALVTT_${label}_RENDER_PROCESS_GONE`, details.reason, details.exitCode);
  });

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame) {
      console.error(`LOCALVTT_${label}_DID_FAIL_LOAD`, errorCode, errorDescription, validatedURL);
    }
  });

  win.webContents.on("console-message", (details) => {
    if (details.level === "warning" || details.level === "error") {
      if (isDev && details.message.includes("Electron Security Warning")) {
        return;
      }
      const log = details.level === "error" ? console.error : console.warn;
      log(`LOCALVTT_${label}_CONSOLE`, details.message, `${details.sourceId}:${details.lineNumber}`);
    }
  });

  win.on("unresponsive", () => {
    console.warn(`LOCALVTT_${label}_WINDOW_UNRESPONSIVE`);
  });

  win.on("responsive", () => {
    console.info(`LOCALVTT_${label}_WINDOW_RESPONSIVE`);
  });
}

function resolveAssetPaths(campaignPath: string, campaign: Campaign): Campaign {
  // Saved JSON stays portable with relative paths; absolute paths are runtime-only conveniences for renderers.
  const resolvedCampaign = hydrateCampaignAssetPaths(campaignPath, campaign);
  registerAssetPaths(resolvedCampaign);
  return resolvedCampaign;
}

function assertInsideCampaign(campaignPath: string, candidatePath: string): void {
  assertInsidePath(campaignPath, candidatePath);
}

function registerCampaignPath(campaignPath: string): void {
  campaignSessions.registerCampaignPath(campaignPath);
}

function registerAssetPaths(campaign: Campaign): void {
  campaignSessions.registerAssetPaths(campaign);
}

function registerStagedTokenImport(stagedImport: { assetId: string; sourcePath: string; campaignPath: string; finalRelativePath: string; createdAt: string }): void {
  stagedTokenImports.set(stagedImport.assetId, stagedImport);
  campaignSessions.registerTemporaryExternalAssetPath(stagedImport.sourcePath);
}

function consumeStagedTokenImport(assetId: string): { campaignPath: string; sourcePath: string; assetId: string; finalRelativePath: string; createdAt: string } | null {
  const stagedImport = stagedTokenImports.get(assetId) ?? null;
  if (stagedImport) {
    stagedTokenImports.delete(assetId);
    campaignSessions.unregisterTemporaryExternalAssetPath(stagedImport.sourcePath);
  }
  return stagedImport;
}

function discardStagedTokenImport(assetId: string): boolean {
  return Boolean(consumeStagedTokenImport(assetId));
}

function assertKnownCampaignPath(campaignPath: string): void {
  campaignSessions.assertKnownCampaignPath(campaignPath);
}

function isInsideOpenedCampaign(candidatePath: string): boolean {
  return campaignSessions.isInsideOpenedCampaign(candidatePath);
}

function isKnownAssetPath(candidatePath: string): boolean {
  return campaignSessions.isKnownAssetPath(candidatePath);
}

function isTemporaryExternalAssetPath(candidatePath: string): boolean {
  return campaignSessions.isTemporaryExternalAssetPath(candidatePath);
}

async function loadCampaignFromPath(campaignPath: string): Promise<CampaignSummary> {
  const parsed = await readCampaignMetadata(campaignPath);
  await ensureCampaignFolders(campaignPath);
  const campaignWithSceneSummaries = await hydrateSceneSummaries(campaignPath, parsed);
  const campaignWithThumbnails = await ensureMapThumbnails(campaignPath, campaignWithSceneSummaries, createMapThumbnail);
  if (campaignWithThumbnails !== campaignWithSceneSummaries) {
    await writeCampaign(campaignPath, campaignWithThumbnails);
  }
  const health = await inspectCampaignHealth(campaignPath, campaignWithThumbnails);
  return {
    campaignPath,
    campaign: resolveAssetPaths(campaignPath, campaignWithThumbnails),
    missingAssets: health.missingAssetFiles.map((asset) => asset.relativePath),
    health
  };
}

async function regenerateCampaignThumbnails(
  campaignPath: string,
  onProgress?: (progress: ThumbnailRegenerationProgress) => void,
  rendererWebContents?: WebContents
): Promise<ThumbnailRegenerationResult> {
  const summary = await loadCampaignFromPath(campaignPath);
  const plan = await regenerateThumbnailAssets(
    campaignPath,
    summary.campaign,
    (asset, sourcePath) =>
      asset.kind === "map"
        ? createMapThumbnail(campaignPath, sourcePath, asset.id, rendererWebContents)
        : createTokenThumbnail(campaignPath, sourcePath, asset.id),
    onProgress
  );
  const campaign = plan.campaign;
  if (plan.regenerated > 0) {
    await writeCampaign(campaignPath, campaign);
    for (const asset of campaign.assets) {
      await removeThumbnailIfUnused(campaignPath, plan.previousThumbnailPaths.get(asset.id), campaign.assets);
    }
  }

  return {
    campaignSummary: await loadCampaignFromPath(campaignPath),
    regenerated: plan.regenerated,
    skipped: plan.skipped,
    failed: plan.failed
  };
}

async function promoteCampaignTokenAssets(campaignPath: string): Promise<TokenAssetPromotionResult> {
  const summary = await loadCampaignFromPath(campaignPath);
  const plan = await promoteTokenAssetThumbnails(campaignPath, summary.campaign);
  if (plan.promoted > 0) {
    await writeCampaign(campaignPath, plan.campaign);
    for (const replacedPaths of plan.replacedPaths.values()) {
      for (const replacedPath of replacedPaths) {
        if (plan.campaign.assets.some((asset) => asset.relativePath === replacedPath || asset.thumbnailRelativePath === replacedPath)) {
          continue;
        }
        await unlinkIfExists(requireCampaignRelativePath(campaignPath, replacedPath));
      }
    }
  }

  return {
    campaignSummary: await loadCampaignFromPath(campaignPath),
    promoted: plan.promoted,
    skipped: plan.skipped,
    failed: plan.failed
  };
}

async function pruneCampaignUnreferencedAssets(campaignPath: string): Promise<AssetPruneResult> {
  const summary = await loadCampaignFromPath(campaignPath);
  const health = await inspectCampaignHealth(campaignPath, summary.campaign);
  const unreferencedAssetIds = new Set(health.unreferencedAssets.map((asset) => asset.assetId));
  const plan = await pruneUnreferencedAssets(campaignPath, summary.campaign, unreferencedAssetIds);
  if (plan.pruned > 0) {
    await writeCampaign(campaignPath, plan.campaign);
  }

  return {
    campaignSummary: await loadCampaignFromPath(campaignPath),
    pruned: plan.pruned,
    skipped: plan.skipped,
    removedFiles: plan.removedFiles,
    failed: plan.failed
  };
}

function logThumbnailImportFailure(kind: "map" | "token", sourcePath: string, reason: string | undefined): void {
  const diagnostic = createThumbnailImportFailureDiagnostic(kind, sourcePath, reason);
  console.warn(diagnostic.label, diagnostic.kind, diagnostic.fileName, diagnostic.reason);
}

async function pauseActiveTurnOrders(campaignPath: string): Promise<void> {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
  await pauseCampaignTurnOrders(
    summary.campaign,
    (sceneId) => readSceneMetadata(campaignPath, sceneId),
    (scene) => writeScene(campaignPath, scene)
  );
}

async function loadCampaignWithPausedTurnOrders(campaignPath: string): Promise<CampaignSummary> {
  registerCampaignPath(campaignPath);
  currentCampaignPath = resolveCurrentCampaignPath(campaignPath);
  await pauseActiveTurnOrders(campaignPath);
  return loadCampaignFromPath(campaignPath);
}

async function backupSceneBeforeDelete(campaignPath: string, sceneId: string): Promise<void> {
  await backupExistingMetadataFile(campaignPath, sceneFile(campaignPath, sceneId), sceneBackupFolder(campaignPath, sceneId), `${sceneId}.scene.json`);
}

async function listMetadataBackups(campaignPath: string) {
  return listCampaignMetadataBackups(campaignPath, loadCampaignFromPath);
}

async function createMapThumbnail(campaignPath: string, sourcePath: string, assetId: string, rendererWebContents?: WebContents): Promise<MapThumbnailResult> {
  const mediaType = mapMediaType(sourcePath);
  const thumbnailResult = mediaType === "video" ? await createVideoMapThumbnailWithFallback(sourcePath, assetId, rendererWebContents) : { thumbnail: createImageMapThumbnail(sourcePath) };
  const thumbnail = thumbnailResult.thumbnail;
  if (!thumbnail) {
    return { failureReason: thumbnailResult.failureReason ?? "Image file could not be decoded by Electron." };
  }

  return { thumbnailRelativePath: await writeAssetThumbnail(campaignPath, assetId, thumbnail) };
}

async function createTokenThumbnail(campaignPath: string, sourcePath: string, assetId: string): Promise<MapThumbnailResult> {
  const thumbnail = await createSquareImageThumbnail(sourcePath);
  if (!thumbnail) {
    return { failureReason: "Image file could not be decoded by Electron." };
  }
  return { thumbnailRelativePath: await writeAssetThumbnail(campaignPath, assetId, thumbnail) };
}

app.whenReady().then(() => {
  protocol.handle("localvtt", async (request) => {
    const resolvedRequest = resolveAssetProtocolRequest(request.url, isInsideOpenedCampaign, isKnownAssetPath, isTemporaryExternalAssetPath);
    if (!resolvedRequest.ok) {
      return resolvedRequest.response;
    }
    const filePath = resolvedRequest.filePath;
    try {
      const stats = await stat(filePath);
      const failureResponse = getAssetProtocolStatResultFailureResponse(stats);
      if (failureResponse) {
        return failureResponse;
      }
    } catch (caught) {
      const failureResponse = getAssetProtocolStatFailureResponse(caught);
      if (failureResponse) {
        return failureResponse;
      }
      throw caught;
    }
    return createAssetProtocolFileResponse(await net.fetch(pathToFileURL(filePath).toString()));
  });

  gmWindow = createGmWindow();
  if (isSmokeTest) {
    runAppSmokeTest(gmWindow);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      gmWindow = createGmWindow();
      if (isSmokeTest) {
        runAppSmokeTest(gmWindow);
      }
    }
  });
});

app.on("before-quit", () => {
  closePlayerWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function closePlayerWindow(): void {
  if (!playerWindow || playerWindow.isDestroyed()) {
    playerWindow = null;
    return;
  }
  playerWindow.close();
  playerWindow = null;
}

function createGmWindow(): BrowserWindow {
  const win = createWindow("gm");
  win.on("close", (event) => {
    const closeAction = getGmCloseRequestAction(forceCloseGmWindow, gmHasUnsavedChanges);
    if (closeAction === "allow-close") {
      return;
    }

    event.preventDefault();
    if (closeAction === "close-after-pausing") {
      void closeGmWindowAfterPausing(win);
      return;
    }

    const choice = dialog.showMessageBoxSync(win, {
      type: "warning",
      title: "Unsaved Local VTT changes",
      message: "You have unsaved Local VTT changes.",
      detail: "Choose Save to write unsaved scene and campaign changes before closing.",
      buttons: ["Cancel", "Save", "Close Without Saving"],
      defaultId: 0,
      cancelId: 0,
      noLink: true
    });

    const dialogAction = getUnsavedChangesDialogAction(choice);
    if (dialogAction === "save-before-close") {
      win.webContents.send("app:saveBeforeClose");
    } else if (dialogAction === "close-after-pausing") {
      void closeGmWindowAfterPausing(win);
    }
  });
  win.on("closed", () => {
    closePlayerWindow();
    gmWindow = null;
    forceCloseGmWindow = false;
  });
  return win;
}

function runAppSmokeTest(win: BrowserWindow): void {
  runSmokeTest({
    app,
    getPlayerWindow: () => playerWindow,
    isVisualSmokeTest,
    registerAssetPaths,
    win
  });
}

async function closeGmWindowAfterPausing(win: BrowserWindow): Promise<void> {
  try {
    if (currentCampaignPath) {
      await pauseActiveTurnOrders(currentCampaignPath);
    }
  } catch (caught) {
    console.error("Could not pause turn orders before closing.", caught);
  }
  forceCloseGmWindow = true;
  gmHasUnsavedChanges = false;
  win.close();
}

registerPlayerViewIpc(ipcMain, {
  createPlayerWindow: () => createWindow("player"),
  getDisplays: () => screen.getAllDisplays(),
  getGmWindow: () => gmWindow,
  getLastPlayerProjection: () => lastPlayerProjection,
  getPlayerWindow: () => playerWindow,
  setLastPlayerProjection: (projection) => {
    lastPlayerProjection = projection;
  },
  setPlayerWindow: (win) => {
    playerWindow = win;
  }
});

registerSceneIpc(ipcMain, {
  assertInsideCampaign,
  assertKnownCampaignPath,
  backupSceneBeforeDelete,
  loadCampaignFromPath,
  readSceneMetadata,
  unlinkIfExists,
  writeCampaign,
  writeScene
});

registerCampaignIpc(ipcMain, {
  assertKnownCampaignPath,
  createCampaignForFolder,
  dialogs: {
    chooseDirectory: (owner, title, createDirectory) => chooseDirectory(dialog, owner, title, createDirectory)
  },
  getGmWindow: () => gmWindow,
  listMetadataBackups,
  loadCampaignFromPath,
  loadCampaignWithPausedTurnOrders,
  openMetadataBackupsFolder: (campaignPath) => openMetadataBackupsFolder(campaignPath, shell.openPath),
  previewMetadataBackup,
  registerCampaignPath,
  resolveCurrentCampaignPath,
  restoreMetadataBackup: (campaignPath, ref) => restoreMetadataBackup(campaignPath, ref, loadCampaignFromPath),
  setCurrentCampaignPath: (campaignPath) => {
    currentCampaignPath = campaignPath;
  },
  writeCampaign
});

ipcMain.handle("asset:importMap", async (event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  const sourcePath = await chooseMapFile(dialog, gmWindow);
  if (!sourcePath) {
    return null;
  }

  await assertAssetImportCandidate(sourcePath, "map");

  const summary = await loadCampaignFromPath(campaignPath);
  const { relativePath, destination } = await copyAssetImportToCampaign(campaignPath, sourcePath, "map");
  campaignSessions.registerAssetPath(destination);

  const assetId = randomUUID();
  const thumbnailResult = await createMapThumbnail(campaignPath, destination, assetId, event.sender);
  const thumbnailRelativePath = thumbnailResult.thumbnailRelativePath;
  if (!thumbnailRelativePath) {
    logThumbnailImportFailure("map", sourcePath, thumbnailResult.failureReason);
  }
  const updatedAt = new Date().toISOString();
  const imported = createImportedAsset({
    assetId,
    kind: "map",
    mediaType: mapMediaType(sourcePath),
    sourcePath,
    relativePath,
    destination,
    campaignPath,
    thumbnailRelativePath,
    createdAt: updatedAt
  });

  const campaign = addImportedAssetToCampaign(summary.campaign, imported, updatedAt);
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), asset: imported };
});

ipcMain.handle("asset:previewMapReplacement", async (_event, campaignPath: string, sceneId: string, currentAssetId: string) => {
  assertKnownCampaignPath(campaignPath);
  assertIpcSafeId(sceneId, "Scene id");
  assertIpcSafeId(currentAssetId, "Asset id");
  const sourcePath = await chooseMapFile(dialog, gmWindow);
  if (!sourcePath) {
    return null;
  }

  await assertAssetImportCandidate(sourcePath, "map");

  const summary = await loadCampaignFromPath(campaignPath);
  const currentAsset = requireCurrentMapAsset(summary.campaign, currentAssetId);
  const currentScene = await readSceneMetadata(campaignPath, sceneId);
  assertSceneUsesMapAsset(currentScene, currentAssetId);

  const currentAssetPath = requireCampaignRelativePath(campaignPath, currentAsset.relativePath);
  const nextMediaType = mapMediaType(sourcePath);
  const dimensions = await getMapReplacementPreview(currentAssetPath, currentAsset.mediaType, sourcePath, nextMediaType);
  const replacementToken = createMapReplacementToken(mapReplacementTokens, {
    campaignPath,
    sceneId,
    currentAssetId,
    sourcePath
  });

  return {
    replacementId: replacementToken.id,
    sourceName: path.basename(sourcePath),
    currentAssetName: currentAsset.name,
    currentDimensions: dimensions.currentDimensions,
    nextDimensions: dimensions.nextDimensions,
    warning: dimensions.warning
  };
});

ipcMain.handle("asset:replaceMap", async (event, campaignPath: string, sceneId: string, currentAssetId: string, replacementId: string) => {
  assertKnownCampaignPath(campaignPath);
  assertIpcSafeId(sceneId, "Scene id");
  assertIpcSafeId(currentAssetId, "Asset id");
  assertIpcSafeId(replacementId, "Map replacement id");
  const sourcePath = consumeMapReplacementToken(mapReplacementTokens, replacementId, {
    campaignPath,
    sceneId,
    currentAssetId
  });
  await assertAssetImportCandidate(sourcePath, "map");

  const summary = await loadCampaignFromPath(campaignPath);
  const currentAsset = requireCurrentMapAsset(summary.campaign, currentAssetId);
  const currentScene = await readSceneMetadata(campaignPath, sceneId);
  assertSceneUsesMapAsset(currentScene, currentAssetId);

  const { relativePath, destination } = await copyAssetImportToCampaign(campaignPath, sourcePath, "map");
  campaignSessions.registerAssetPath(destination);

  const assetId = randomUUID();
  const thumbnailResult = await createMapThumbnail(campaignPath, destination, assetId, event.sender);
  const thumbnailRelativePath = thumbnailResult.thumbnailRelativePath;
  if (!thumbnailRelativePath) {
    logThumbnailImportFailure("map", sourcePath, thumbnailResult.failureReason);
  }
  const updatedAt = new Date().toISOString();
  const imported = createImportedAsset({
    assetId,
    kind: "map",
    mediaType: mapMediaType(sourcePath),
    sourcePath,
    relativePath,
    destination,
    campaignPath,
    thumbnailRelativePath,
    createdAt: updatedAt
  });

  const keepCurrentAsset = await mapAssetUsedByOtherScenes(summary.campaign, currentAsset.id, sceneId, (candidateSceneId) =>
    readSceneMetadata(campaignPath, candidateSceneId)
  );
  const { campaign, scene: updatedScene } = replaceSceneMapAsset(summary.campaign, currentScene, currentAsset.id, imported, keepCurrentAsset, updatedAt);
  await writeScene(campaignPath, updatedScene);
  await writeCampaign(campaignPath, campaign);
  if (!keepCurrentAsset) {
    await removeCampaignAssetFiles(campaignPath, currentAsset);
  }
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene: updatedScene, asset: imported };
});

ipcMain.handle("asset:importToken", async (_event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  const sourcePath = await chooseTokenFile(dialog, gmWindow);
  if (!sourcePath) {
    return null;
  }

  await assertAssetImportCandidate(sourcePath, "token");

  const assetId = randomUUID();
  const updatedAt = new Date().toISOString();
  const finalRelativePath = buildTokenAssetRelativePath(assetId);
  registerStagedTokenImport({
    assetId,
    sourcePath,
    campaignPath,
    finalRelativePath,
    createdAt: updatedAt
  });
  const stagedAsset = createStagedTokenImportAsset({
    assetId,
    sourcePath,
    finalRelativePath,
    campaignPath,
    createdAt: updatedAt
  });

  return { campaignSummary: await loadCampaignFromPath(campaignPath), asset: stagedAsset };
});

ipcMain.handle("asset:updateTokenThumbnail", async (_event, campaignPath: string, assetId: string, crop: SquareCropRect) => {
  assertKnownCampaignPath(campaignPath);
  assertIpcSafeId(assetId, "Asset id");
  assertSquareCropRect(crop);
  const summary = await loadCampaignFromPath(campaignPath);
  const stagedImport = stagedTokenImports.get(assetId);

  if (stagedImport) {
    if (path.resolve(stagedImport.campaignPath) !== path.resolve(campaignPath)) {
      throw new Error("Token import belongs to a different campaign.");
    }
    const thumbnail = await createSquareImageThumbnail(stagedImport.sourcePath, crop);
    if (!thumbnail) {
      throw new Error("Unable to generate token thumbnail.");
    }
    const destination = requireCampaignRelativePath(campaignPath, stagedImport.finalRelativePath);
    await writeFile(destination, thumbnail);
    const updatedAt = new Date().toISOString();
    const imported = createImportedAsset({
      assetId,
      kind: "token",
      mediaType: "image",
      sourcePath: stagedImport.sourcePath,
      relativePath: stagedImport.finalRelativePath,
      destination,
      campaignPath,
      thumbnailRelativePath: stagedImport.finalRelativePath,
      createdAt: updatedAt
    });
    const campaign = addImportedAssetToCampaign(summary.campaign, imported, updatedAt);
    await writeCampaign(campaignPath, campaign);
    consumeStagedTokenImport(assetId);
    const campaignSummary = await loadCampaignFromPath(campaignPath);
    const updatedAsset = campaignSummary.campaign.assets.find((candidate) => candidate.id === assetId);
    if (!updatedAsset) {
      throw new Error("Token asset was not available after importing token.");
    }
    return { campaignSummary, asset: updatedAsset };
  }

  const asset = requireTokenAssetWithAbsolutePath(summary.campaign, assetId);

  assertInsideCampaign(campaignPath, asset.absolutePath);
  const thumbnail = await createSquareImageThumbnail(asset.absolutePath, crop);
  if (!thumbnail) {
    throw new Error("Unable to generate token thumbnail.");
  }
  const thumbnailRelativePath = await writeAssetThumbnail(campaignPath, assetId, thumbnail, tokenThumbnailVariant(Date.now()));
  const campaign = updateTokenThumbnailInCampaign(summary.campaign, assetId, thumbnailRelativePath, new Date().toISOString());
  await writeCampaign(campaignPath, campaign);
  await removeThumbnailIfUnused(campaignPath, asset.thumbnailRelativePath, campaign.assets);
  const campaignSummary = await loadCampaignFromPath(campaignPath);
  const updatedAsset = campaignSummary.campaign.assets.find((candidate) => candidate.id === assetId);
  if (!updatedAsset) {
    throw new Error("Token asset was not available after updating thumbnail.");
  }
  return { campaignSummary, asset: updatedAsset };
});

ipcMain.handle("asset:regenerateThumbnails", async (event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  return regenerateCampaignThumbnails(campaignPath, (progress) => {
    event.sender.send("asset:thumbnailRegenerationProgress", progress);
  }, event.sender);
});

ipcMain.handle("asset:promoteTokenAssets", async (_event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  return promoteCampaignTokenAssets(campaignPath);
});

ipcMain.handle("asset:pruneUnreferencedAssets", async (_event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  return pruneCampaignUnreferencedAssets(campaignPath);
});

ipcMain.handle("asset:discardTokenImport", async (_event, campaignPath: string, assetId: string) => {
  assertKnownCampaignPath(campaignPath);
  assertIpcSafeId(assetId, "Asset id");
  if (discardStagedTokenImport(assetId)) {
    return loadCampaignFromPath(campaignPath);
  }
  const summary = await loadCampaignFromPath(campaignPath);
  const asset = findCampaignAsset(summary.campaign, assetId, "token");
  if (!asset) {
    return summary;
  }

  await removeCampaignAssetFiles(campaignPath, asset);

  const campaign = removeAssetFromCampaign(summary.campaign, assetId);
  await writeCampaign(campaignPath, campaign);
  return loadCampaignFromPath(campaignPath);
});

ipcMain.handle("asset:getTokenUsage", async (_event, campaignPath: string, assetId: string) => {
  assertKnownCampaignPath(campaignPath);
  assertIpcSafeId(assetId, "Asset id");
  const summary = await loadCampaignFromPath(campaignPath);
  return getTokenAssetUsage(summary.campaign, assetId, (sceneId) => readSceneMetadata(campaignPath, sceneId));
});

ipcMain.handle("asset:deleteToken", async (_event, campaignPath: string, assetId: string) => {
  assertKnownCampaignPath(campaignPath);
  assertIpcSafeId(assetId, "Asset id");
  const summary = await loadCampaignFromPath(campaignPath);
  const asset = requireCampaignAsset(summary.campaign, assetId, "token", "Token asset was not found in this campaign.");

  const changedScenes = await removeTokenAssetFromCampaignScenes(
    summary.campaign,
    assetId,
    (sceneId) => readSceneMetadata(campaignPath, sceneId),
    (scene) => writeScene(campaignPath, scene)
  );

  await removeCampaignAssetFiles(campaignPath, asset);

  const campaign = removeAssetFromCampaign(summary.campaign, assetId);
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scenes: changedScenes };
});

ipcMain.handle("asset:deleteMap", async (_event, campaignPath: string, sceneId: string, assetId: string) => {
  assertKnownCampaignPath(campaignPath);
  assertIpcSafeId(sceneId, "Scene id");
  assertIpcSafeId(assetId, "Asset id");
  const summary = await loadCampaignFromPath(campaignPath);
  const asset = requireCampaignAsset(summary.campaign, assetId, "map", "Map asset was not found in this campaign.");

  const otherSceneNames = await getMapAssetSceneNames(summary.campaign, assetId, sceneId, (candidateSceneId) =>
    readSceneMetadata(campaignPath, candidateSceneId)
  );

  if (otherSceneNames.length > 0) {
    throw new Error(`This map asset is still used by: ${otherSceneNames.join(", ")}.`);
  }

  await removeCampaignAssetFiles(campaignPath, asset);

  const currentScene = await readSceneMetadata(campaignPath, sceneId);
  const updatedScene = removeMapAssetFromScene(currentScene, assetId);
  await writeScene(campaignPath, updatedScene);

  const campaign = removeMapAssetFromCampaign(summary.campaign, assetId);
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene: updatedScene };
});

ipcMain.on("app:setUnsavedChanges", (_event, hasUnsavedChanges: boolean) => {
  assertIpcBoolean(hasUnsavedChanges, "Unsaved changes state");
  gmHasUnsavedChanges = hasUnsavedChanges;
});

ipcMain.on("app:closeAfterSave", () => {
  if (!gmWindow || gmWindow.isDestroyed()) {
    return;
  }
  void closeGmWindowAfterPausing(gmWindow);
});
