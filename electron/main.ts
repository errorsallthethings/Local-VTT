import { app, BrowserWindow, dialog, ipcMain, net, protocol, screen, shell } from "electron";
import type { WebContents } from "electron";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import {
  Campaign,
  CampaignSummary,
  MetadataBackupRef,
  Scene,
  SquareCropRect,
  TokenAssetPromotionResult,
  ThumbnailRegenerationProgress,
  ThumbnailRegenerationResult,
  assertValidScene,
  isLiveTableEvent,
  isPlayerIdleState,
  type PlayerSceneProjection
} from "../src/shared/localvtt.js";
import {
  createAssetProtocolFileResponse,
  getAssetProtocolStatFailureResponse,
  getAssetProtocolStatResultFailureResponse,
  resolveAssetProtocolRequest
} from "./assetProtocol.js";
import { campaignFile, sceneFile } from "./campaignPaths.js";
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
  directoryDialogOptions,
  mapFileDialogOptions,
  selectedDialogPath,
  tokenFileDialogOptions
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
import { createPlayerOpenPlan, liveTableEventRoute, summarizeDisplay } from "./playerViewIpc.js";
import { getGmCloseRequestAction, getUnsavedChangesDialogAction } from "./gmWindowClose.js";
import { getLinuxGraphicsSwitches } from "./linuxGraphicsSwitches.js";
import { createSmokeTestScript, getSmokeTestTimeoutMs } from "./smokeTestPlan.js";
import { addImportedAssetToCampaign, createImportedAsset, createStagedTokenImportAsset } from "./importedAssets.js";
import { tokenThumbnailVariant, updateTokenThumbnailInCampaign } from "./tokenThumbnailUpdate.js";
import { removeTokenAssetFromCampaignScenes } from "./tokenAssetSceneCleanup.js";
import { promoteTokenAssetThumbnails } from "./tokenAssetPromotion.js";
import { assertSceneUsesMapAsset, requireCurrentMapAsset } from "./mapReplacementValidation.js";
import { findCampaignAsset, requireCampaignAsset, requireTokenAssetWithAbsolutePath } from "./campaignAssetLookup.js";
import { createAppWindowOptions, createWindowLoadTarget } from "./windowConfig.js";
import { prepareLoadedScene } from "./sceneLoadDefaults.js";
import { createCampaignForFolder, resolveCurrentCampaignPath } from "./campaignOpenState.js";
import { createVideoMapThumbnailWithFallback } from "./videoThumbnailFallback.js";
import {
  createSceneForCampaign,
  deleteSceneFromCampaign,
  duplicateSceneForCampaign,
  renameSceneInCampaign,
  saveSceneInCampaign
} from "./sceneLifecycle.js";

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

function sendToPlayerWhenReady(payload: unknown): void {
  if (!playerWindow || playerWindow.isDestroyed()) {
    return;
  }

  if (playerWindow.webContents.isLoading()) {
    // Scene sends can happen immediately after opening Player View; queue once instead of dropping the first scene.
    playerWindow.webContents.once("did-finish-load", () => {
      playerWindow?.webContents.send("player:state", payload);
    });
    return;
  }

  playerWindow.webContents.send("player:state", payload);
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
  campaignSessions.registerAssetPath(stagedImport.sourcePath);
}

function consumeStagedTokenImport(assetId: string): { campaignPath: string; sourcePath: string; assetId: string; finalRelativePath: string; createdAt: string } | null {
  const stagedImport = stagedTokenImports.get(assetId) ?? null;
  if (stagedImport) {
    stagedTokenImports.delete(assetId);
    campaignSessions.unregisterAssetPath(stagedImport.sourcePath);
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

async function chooseDirectory(title: string, createDirectory = false): Promise<string | null> {
  const options = directoryDialogOptions(title, createDirectory);
  const result = gmWindow ? await dialog.showOpenDialog(gmWindow, options) : await dialog.showOpenDialog(options);
  return selectedDialogPath(result);
}

async function chooseMapFile(): Promise<string | null> {
  const options = mapFileDialogOptions();
  const result = gmWindow ? await dialog.showOpenDialog(gmWindow, options) : await dialog.showOpenDialog(options);
  return selectedDialogPath(result);
}

async function chooseTokenFile(): Promise<string | null> {
  const options = tokenFileDialogOptions();
  const result = gmWindow ? await dialog.showOpenDialog(gmWindow, options) : await dialog.showOpenDialog(options);
  return selectedDialogPath(result);
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
    const resolvedRequest = resolveAssetProtocolRequest(request.url, isInsideOpenedCampaign, isKnownAssetPath);
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
    runSmokeTest(gmWindow);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      gmWindow = createGmWindow();
      if (isSmokeTest) {
        runSmokeTest(gmWindow);
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

function runSmokeTest(win: BrowserWindow): void {
  let completed = false;
  const timeout = setTimeout(() => {
    if (completed) {
      return;
    }
    completed = true;
    console.error("LOCALVTT_SMOKE_ERROR GM window did not finish loading in time.");
    app.exit(1);
  }, getSmokeTestTimeoutMs(isVisualSmokeTest));

  const finish = () => {
    if (completed) {
      return;
    }
    completed = true;
    void win.webContents
      .executeJavaScript(createSmokeTestScript())
      .then(async (result: unknown) => {
        if (isVisualSmokeTest) {
          const { runVisualSmokeTest } = await import("./visualSmokeTest.js");
          return {
            ...(result as Record<string, unknown>),
            visualSmoke: await runVisualSmokeTest(win, {
              getPlayerWindow: () => playerWindow,
              registerAssetPaths
            })
          };
        }
        return result;
      })
      .then((result: unknown) => {
        clearTimeout(timeout);
        console.log(`LOCALVTT_SMOKE_RESULT ${JSON.stringify(result)}`);
        app.exit(0);
      })
      .catch((caught: unknown) => {
        clearTimeout(timeout);
        console.error("LOCALVTT_SMOKE_ERROR", caught);
        app.exit(1);
      });
  };

  win.webContents.once("did-fail-load", (_event, errorCode, errorDescription) => {
    if (completed) {
      return;
    }
    completed = true;
    clearTimeout(timeout);
    console.error(`LOCALVTT_SMOKE_ERROR GM window failed to load: ${errorCode} ${errorDescription}`);
    app.exit(1);
  });

  if (win.webContents.isLoading()) {
    win.webContents.once("did-finish-load", finish);
  } else {
    queueMicrotask(finish);
  }
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

ipcMain.handle("campaign:create", async () => {
  const campaignPath = await chooseDirectory("Choose a folder for the new Local VTT campaign", true);
  if (!campaignPath) {
    return null;
  }

  const campaign = createCampaignForFolder(campaignPath);
  registerCampaignPath(campaignPath);
  currentCampaignPath = resolveCurrentCampaignPath(campaignPath);
  await writeCampaign(campaignPath, campaign);
  return loadCampaignFromPath(campaignPath);
});

ipcMain.handle("campaign:open", async () => {
  const campaignPath = await chooseDirectory("Open Local VTT campaign folder");
  if (!campaignPath) {
    return null;
  }

  return loadCampaignWithPausedTurnOrders(campaignPath);
});

ipcMain.handle("campaign:openRecent", async (_event, campaignPath: string) => {
  await stat(campaignFile(campaignPath));
  return loadCampaignWithPausedTurnOrders(campaignPath);
});

ipcMain.handle("campaign:save", async (_event, campaignPath: string, campaign: Campaign) => {
  assertKnownCampaignPath(campaignPath);
  await writeCampaign(campaignPath, campaign);
  return loadCampaignFromPath(campaignPath);
});

ipcMain.handle("campaign:refresh", async (_event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  return loadCampaignFromPath(campaignPath);
});

ipcMain.handle("campaign:openBackupsFolder", async (_event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  return openMetadataBackupsFolder(campaignPath, shell.openPath);
});

ipcMain.handle("campaign:listMetadataBackups", async (_event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  return listMetadataBackups(campaignPath);
});

ipcMain.handle("campaign:previewMetadataBackup", async (_event, campaignPath: string, ref: MetadataBackupRef) => {
  assertKnownCampaignPath(campaignPath);
  return previewMetadataBackup(campaignPath, ref);
});

ipcMain.handle("campaign:restoreMetadataBackup", async (_event, campaignPath: string, ref: MetadataBackupRef) => {
  assertKnownCampaignPath(campaignPath);
  return restoreMetadataBackup(campaignPath, ref, loadCampaignFromPath);
});

ipcMain.handle("scene:create", async (_event, campaignPath: string, sceneName: string) => {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
  const { campaign, scene } = createSceneForCampaign(summary.campaign, sceneName);
  await writeScene(campaignPath, scene);
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene };
});

ipcMain.handle("scene:duplicate", async (_event, campaignPath: string, sourceScene: Scene, sceneName: string, afterSceneId: string, folderId?: string) => {
  assertKnownCampaignPath(campaignPath);
  assertValidScene(sourceScene);
  const summary = await loadCampaignFromPath(campaignPath);
  const { campaign, scene } = duplicateSceneForCampaign(summary.campaign, sourceScene, sceneName, afterSceneId, folderId);
  await writeScene(campaignPath, scene);
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene };
});

ipcMain.handle("scene:load", async (_event, campaignPath: string, sceneId: string) => {
  assertKnownCampaignPath(campaignPath);
  const scene = await readSceneMetadata(campaignPath, sceneId);
  return prepareLoadedScene(scene);
});

ipcMain.handle("scene:save", async (_event, campaignPath: string, scene: Scene) => {
  assertKnownCampaignPath(campaignPath);
  assertInsideCampaign(campaignPath, sceneFile(campaignPath, scene.id));
  const summary = await loadCampaignFromPath(campaignPath);
  const { campaign, scene: updated } = saveSceneInCampaign(summary.campaign, scene);
  await writeScene(campaignPath, updated);

  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene: updated };
});

ipcMain.handle("scene:rename", async (_event, campaignPath: string, sceneId: string, sceneName: string) => {
  assertKnownCampaignPath(campaignPath);
  const filePath = sceneFile(campaignPath, sceneId);
  assertInsideCampaign(campaignPath, filePath);
  const scene = await readSceneMetadata(campaignPath, sceneId);
  const summary = await loadCampaignFromPath(campaignPath);
  const { campaign, scene: updatedScene } = renameSceneInCampaign(summary.campaign, scene, sceneId, sceneName);
  await writeScene(campaignPath, updatedScene);

  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene: updatedScene };
});

ipcMain.handle("scene:delete", async (_event, campaignPath: string, sceneId: string) => {
  assertKnownCampaignPath(campaignPath);
  const filePath = sceneFile(campaignPath, sceneId);
  assertInsideCampaign(campaignPath, filePath);
  await backupSceneBeforeDelete(campaignPath, sceneId);
  await unlinkIfExists(filePath);

  const summary = await loadCampaignFromPath(campaignPath);
  const campaign = deleteSceneFromCampaign(summary.campaign, sceneId);
  await writeCampaign(campaignPath, campaign);
  return loadCampaignFromPath(campaignPath);
});

ipcMain.handle("asset:importMap", async (event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  const sourcePath = await chooseMapFile();
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
  const sourcePath = await chooseMapFile();
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
  const sourcePath = await chooseTokenFile();
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

ipcMain.handle("asset:discardTokenImport", async (_event, campaignPath: string, assetId: string) => {
  assertKnownCampaignPath(campaignPath);
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
  const summary = await loadCampaignFromPath(campaignPath);
  return getTokenAssetUsage(summary.campaign, assetId, (sceneId) => readSceneMetadata(campaignPath, sceneId));
});

ipcMain.handle("asset:deleteToken", async (_event, campaignPath: string, assetId: string) => {
  assertKnownCampaignPath(campaignPath);
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

ipcMain.handle("player:open", async (_event, options?: { displayId?: number; fullscreen?: boolean }) => {
  if (playerWindow?.isDestroyed()) {
    playerWindow = null;
  }
  const createdPlayerWindow = !playerWindow;
  if (!playerWindow) {
    playerWindow = createWindow("player");
    playerWindow.on("closed", () => {
      playerWindow = null;
    });
  }
  const openPlan = createPlayerOpenPlan(options, { created: createdPlayerWindow, fullscreen: playerWindow.isFullScreen() }, screen.getAllDisplays());
  if (openPlan.targetDisplay && openPlan.shouldSetBounds) {
    playerWindow.setFullScreen(false);
    playerWindow.setBounds(openPlan.targetDisplay.bounds);
  }
  playerWindow.show();
  playerWindow.focus();
  if (openPlan.shouldSetFullscreen) {
    playerWindow.setFullScreen(true);
  }
  if (lastPlayerProjection) {
    sendToPlayerWhenReady(lastPlayerProjection);
  }
  return { ok: true, displayFound: openPlan.displayFound };
});

ipcMain.handle("player:sendScene", async (_event, projection: PlayerSceneProjection) => {
  lastPlayerProjection = projection;
  if (!playerWindow || playerWindow.isDestroyed()) {
    playerWindow = createWindow("player");
  }
  sendToPlayerWhenReady(lastPlayerProjection);
  return true;
});

ipcMain.handle("player:updateSceneIfOpen", async (_event, projection: PlayerSceneProjection) => {
  if (!playerWindow || playerWindow.isDestroyed()) {
    return false;
  }
  lastPlayerProjection = projection;
  sendToPlayerWhenReady(lastPlayerProjection);
  return true;
});

ipcMain.handle("player:showIdle", async (_event, state: unknown) => {
  if (!isPlayerIdleState(state)) {
    throw new Error("Invalid Player View idle state.");
  }
  lastPlayerProjection = state;
  if (!playerWindow || playerWindow.isDestroyed()) {
    playerWindow = null;
    return false;
  }
  sendToPlayerWhenReady(lastPlayerProjection);
  return true;
});

ipcMain.handle("player:liveTableEvent", async (ipcEvent, event: unknown) => {
  if (!isLiveTableEvent(event)) {
    throw new Error("Invalid live table event.");
  }

  const route = liveTableEventRoute(
    ipcEvent.sender.id,
    {
      exists: Boolean(playerWindow),
      destroyed: playerWindow?.isDestroyed() ?? true,
      webContentsId: playerWindow?.webContents.id
    },
    Boolean(gmWindow && !gmWindow.isDestroyed())
  );

  if (route === "gm") {
    gmWindow?.webContents.send("player:liveTableEvent", event);
    return true;
  }

  if (route === "player") {
    playerWindow?.webContents.send("player:liveTableEvent", event);
    return true;
  }

  return false;
});

ipcMain.handle("player:setFullscreen", async (_event, fullscreen: boolean) => {
  if (!playerWindow || playerWindow.isDestroyed()) {
    playerWindow = createWindow("player");
  }
  playerWindow.setFullScreen(fullscreen);
  return playerWindow.isFullScreen();
});

ipcMain.handle("player:close", async () => {
  lastPlayerProjection = null;
  if (!playerWindow || playerWindow.isDestroyed()) {
    playerWindow = null;
    return false;
  }

  playerWindow.close();
  playerWindow = null;
  return true;
});

ipcMain.handle("player:getLastState", async () => lastPlayerProjection);

ipcMain.handle("app:getDisplays", async () => screen.getAllDisplays().map(summarizeDisplay));

ipcMain.on("app:setUnsavedChanges", (_event, hasUnsavedChanges: boolean) => {
  gmHasUnsavedChanges = hasUnsavedChanges;
});

ipcMain.on("app:closeAfterSave", () => {
  if (!gmWindow || gmWindow.isDestroyed()) {
    return;
  }
  void closeGmWindowAfterPausing(gmWindow);
});
