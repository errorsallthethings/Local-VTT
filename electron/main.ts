import { app, BrowserWindow, dialog, ipcMain, net, protocol, screen, shell } from "electron";
import type { WebContents } from "electron";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  Campaign,
  CampaignSummary,
} from "../src/shared/localvtt.js";
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
import { hydrateCampaignAssetPaths } from "./assetFiles.js";
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
import type { MapReplacementTokenStore } from "./mapReplacementTokens.js";
import { ensureMapThumbnails, type MapThumbnailResult } from "./mapThumbnailRepair.js";
import { createThumbnailImportFailureDiagnostic } from "./thumbnailDiagnostics.js";
import { writeAssetThumbnail } from "./thumbnailFiles.js";
import { pauseCampaignTurnOrders } from "./campaignTurnOrderPause.js";
import { registerPlayerViewIpc } from "./playerViewIpc.js";
import {
  closeGmWindowAfterPausing as closeGmWindowAfterPausingWithState,
  getGmCloseRequestAction,
  getUnsavedChangesDialogAction
} from "./gmWindowClose.js";
import { getLinuxGraphicsSwitches } from "./linuxGraphicsSwitches.js";
import { runSmokeTest } from "./smokeTestRunner.js";
import { createCampaignForFolder, resolveCurrentCampaignPath } from "./campaignOpenState.js";
import { createVideoMapThumbnailWithFallback } from "./videoThumbnailFallback.js";
import { registerSceneIpc } from "./sceneIpc.js";
import { registerCampaignIpc } from "./campaignIpc.js";
import { registerMapAssetIpc } from "./mapAssetIpc.js";
import { registerTokenAssetIpc } from "./tokenAssetIpc.js";
import { registerAssetMaintenanceIpc } from "./assetMaintenanceIpc.js";
import { registerAppLifecycleIpc } from "./appLifecycleIpc.js";
import { registerLocalAssetProtocol } from "./assetProtocolRegistration.js";
import { createLocalVttWindow } from "./appWindowFactory.js";
import { createAssetMaintenanceServices } from "./assetMaintenanceServices.js";

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
const assetMaintenanceServices = createAssetMaintenanceServices({
  createMapThumbnail,
  createTokenThumbnail,
  loadCampaignFromPath,
  writeCampaign
});

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
  return createLocalVttWindow({
    BrowserWindowClass: BrowserWindow,
    appPath: app.getAppPath(),
    appWindowIconPath,
    devServerUrl,
    hash,
    isDev
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
  registerLocalAssetProtocol({
    fetchFile: (url) => net.fetch(url),
    isInsideOpenedCampaign,
    isKnownAssetPath,
    isTemporaryExternalAssetPath,
    protocol
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
  await closeGmWindowAfterPausingWithState({
    currentCampaignPath,
    pauseActiveTurnOrders,
    setForceCloseGmWindow: (forceClose) => {
      forceCloseGmWindow = forceClose;
    },
    setGmHasUnsavedChanges: (hasUnsavedChanges) => {
      gmHasUnsavedChanges = hasUnsavedChanges;
    },
    win
  });
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

registerMapAssetIpc(ipcMain, {
  assertKnownCampaignPath,
  createAssetId: randomUUID,
  createMapThumbnail,
  dialogs: {
    chooseMapFile: (owner) => chooseMapFile(dialog, owner)
  },
  getGmWindow: () => gmWindow,
  getTimestamp: () => new Date().toISOString(),
  loadCampaignFromPath,
  logThumbnailImportFailure,
  mapReplacementTokens,
  readSceneMetadata,
  registerAssetPath: (destination) => campaignSessions.registerAssetPath(destination),
  removeCampaignAssetFiles,
  writeCampaign,
  writeScene
});

registerTokenAssetIpc(ipcMain, {
  assertInsideCampaign,
  assertKnownCampaignPath,
  createAssetId: randomUUID,
  createSquareImageThumbnail,
  dialogs: {
    chooseTokenFile: (owner) => chooseTokenFile(dialog, owner)
  },
  getGmWindow: () => gmWindow,
  getTimestamp: () => new Date().toISOString(),
  loadCampaignFromPath,
  readSceneMetadata,
  registerTemporaryExternalAssetPath: (sourcePath) => campaignSessions.registerTemporaryExternalAssetPath(sourcePath),
  removeCampaignAssetFiles,
  unregisterTemporaryExternalAssetPath: (sourcePath) => campaignSessions.unregisterTemporaryExternalAssetPath(sourcePath),
  writeCampaign,
  writeScene
});

registerAssetMaintenanceIpc(ipcMain, {
  assertKnownCampaignPath,
  promoteCampaignTokenAssets: assetMaintenanceServices.promoteCampaignTokenAssets,
  pruneCampaignUnreferencedAssets: assetMaintenanceServices.pruneCampaignUnreferencedAssets,
  regenerateCampaignThumbnails: assetMaintenanceServices.regenerateCampaignThumbnails
});

registerAppLifecycleIpc(ipcMain, {
  closeAfterSave: () => {
    if (!gmWindow || gmWindow.isDestroyed()) {
      return;
    }
    void closeGmWindowAfterPausing(gmWindow);
  },
  setUnsavedChanges: (hasUnsavedChanges) => {
    gmHasUnsavedChanges = hasUnsavedChanges;
  }
});
