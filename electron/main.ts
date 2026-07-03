import { app, BrowserWindow, dialog, ipcMain, net, protocol, screen, shell } from "electron";
import type { WebContents } from "electron";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import {
  Campaign,
  CampaignSummary,
  DEFAULT_LAYERS,
  MetadataBackupEntry,
  MetadataBackupRef,
  Scene,
  SquareCropRect,
  ThumbnailRegenerationProgress,
  ThumbnailRegenerationResult,
  assertValidScene,
  createDefaultCampaign,
  isLiveTableEvent,
  isPlayerIdleState,
  normalizeScene,
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
  createSquareImageThumbnail,
  createVideoMapThumbnail,
  type ThumbnailCreationResult
} from "./assets.js";
import { hydrateCampaignAssetPaths, requireCampaignRelativePath } from "./assetFiles.js";
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
import {
  backupExistingMetadataFile,
  listMetadataBackupFolder
} from "./metadataBackupFiles.js";
import {
  previewMetadataBackup,
  restoreMetadataBackup
} from "./metadataBackupRestore.js";
import {
  campaignBackupFolder,
  metadataBackupsRootFolder,
  sceneBackupsRootFolder,
  sceneBackupFolder
} from "./metadataBackups.js";
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
import { createThumbnailImportFailureDiagnostic, createVideoThumbnailFallbackFailure } from "./thumbnailDiagnostics.js";
import { removeThumbnailIfUnused, writeAssetThumbnail } from "./thumbnailFiles.js";
import { regenerateThumbnailAssets } from "./thumbnailRegeneration.js";
import { getTokenAssetUsage } from "./tokenAssetUsage.js";
import { removeAssetFromCampaign } from "./tokenAssetMutations.js";
import { pauseSceneTurnOrder } from "./turnOrderPause.js";
import { createPlayerOpenPlan, liveTableEventRoute, summarizeDisplay } from "./playerViewIpc.js";
import { getGmCloseRequestAction, getUnsavedChangesDialogAction } from "./gmWindowClose.js";
import { getLinuxGraphicsSwitches } from "./linuxGraphicsSwitches.js";
import { createSmokeTestScript, getSmokeTestTimeoutMs } from "./smokeTestPlan.js";
import { addImportedAssetToCampaign, createImportedAsset } from "./importedAssets.js";
import { tokenThumbnailVariant, updateTokenThumbnailInCampaign } from "./tokenThumbnailUpdate.js";
import { removeTokenAssetFromCampaignScenes } from "./tokenAssetSceneCleanup.js";
import { assertSceneUsesMapAsset, requireCurrentMapAsset } from "./mapReplacementValidation.js";
import { findCampaignAsset, requireCampaignAsset, requireTokenAssetWithAbsolutePath } from "./campaignAssetLookup.js";
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
  const win = new BrowserWindow({
    width: hash === "gm" ? 1440 : 1280,
    height: hash === "gm" ? 960 : 720,
    title: hash === "gm" ? "Local VTT - GM View" : "Local VTT - Player View",
    icon: appWindowIconPath,
    backgroundColor: hash === "gm" ? "#101318" : "#000000",
    webPreferences: {
      preload: path.join(app.getAppPath(), "dist-electron", "electron", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  installWindowDiagnostics(win, hash);

  if (isDev) {
    void win.loadURL(`${devServerUrl}/#/${hash}`);
  } else {
    void win.loadFile(path.join(app.getAppPath(), "dist", "index.html"), {
      hash: `/${hash}`
    });
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

function logThumbnailImportFailure(kind: "map" | "token", sourcePath: string, reason: string | undefined): void {
  const diagnostic = createThumbnailImportFailureDiagnostic(kind, sourcePath, reason);
  console.warn(diagnostic.label, diagnostic.kind, diagnostic.fileName, diagnostic.reason);
}

async function pauseActiveTurnOrders(campaignPath: string): Promise<void> {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
  for (const entry of summary.campaign.scenes) {
    try {
      const normalized = await readSceneMetadata(campaignPath, entry.id);
      const paused = pauseSceneTurnOrder(normalized);
      if (!paused) {
        continue;
      }
      await writeScene(campaignPath, paused);
    } catch {
      // Missing or invalid scenes are reported by the normal campaign loading flow.
    }
  }
}

async function loadCampaignWithPausedTurnOrders(campaignPath: string): Promise<CampaignSummary> {
  registerCampaignPath(campaignPath);
  currentCampaignPath = path.resolve(campaignPath);
  await pauseActiveTurnOrders(campaignPath);
  return loadCampaignFromPath(campaignPath);
}

async function backupSceneBeforeDelete(campaignPath: string, sceneId: string): Promise<void> {
  await backupExistingMetadataFile(campaignPath, sceneFile(campaignPath, sceneId), sceneBackupFolder(campaignPath, sceneId), `${sceneId}.scene.json`);
}

async function listMetadataBackups(campaignPath: string): Promise<MetadataBackupEntry[]> {
  const summary = await loadCampaignFromPath(campaignPath);
  const sceneNames = new Map(summary.campaign.scenes.map((scene) => [scene.id, scene.name]));
  const entries: MetadataBackupEntry[] = [];
  entries.push(...(await listMetadataBackupFolder(campaignPath, campaignBackupFolder(campaignPath), "campaign")));

  const scenesRoot = sceneBackupsRootFolder(campaignPath);
  assertInsideCampaign(campaignPath, scenesRoot);
  try {
    const sceneFolders = await readdir(scenesRoot, { withFileTypes: true });
    for (const folder of sceneFolders) {
      if (!folder.isDirectory()) {
        continue;
      }
      const sceneId = folder.name;
      entries.push(...(await listMetadataBackupFolder(campaignPath, sceneBackupFolder(campaignPath, sceneId), "scene", sceneId, sceneNames.get(sceneId))));
    }
  } catch (caught) {
    if ((caught as NodeJS.ErrnoException).code !== "ENOENT") {
      throw caught;
    }
  }

  return entries.sort((left, right) => right.fileName.localeCompare(left.fileName));
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

async function createVideoMapThumbnailWithFallback(sourcePath: string, assetId: string, rendererWebContents?: WebContents): Promise<ThumbnailCreationResult> {
  const primaryResult = await createVideoMapThumbnail(sourcePath);
  if (primaryResult.thumbnail || !rendererWebContents || rendererWebContents.isDestroyed()) {
    return primaryResult;
  }

  const fallbackResult = await createRendererVideoMapThumbnail(sourcePath, assetId, rendererWebContents);
  if (fallbackResult.thumbnail) {
    return fallbackResult;
  }

  return { failureReason: createVideoThumbnailFallbackFailure(primaryResult.failureReason, fallbackResult.failureReason) };
}

async function createRendererVideoMapThumbnail(sourcePath: string, assetId: string, rendererWebContents: WebContents): Promise<ThumbnailCreationResult> {
  const baseAssetUrl = `localvtt://asset/${encodeURIComponent(sourcePath)}`;
  const thumbnailAssetUrl = `${baseAssetUrl}?thumbnail=1#t=0.05`;
  const captureSurfaceId = `localvtt-video-thumbnail-${assetId}`;
  try {
    const result = (await rendererWebContents.executeJavaScript(
      `
        new Promise((resolve) => {
          let captureSurface = null;
          let createdVideo = null;
          let readinessIntervalId = null;
          let completed = false;
          const describeVideos = () => {
            const videos = Array.from(document.querySelectorAll("video"));
            const descriptions = videos.map((candidate, index) => {
              const source = candidate.currentSrc || candidate.src || "";
              return [
                "#" + index,
                "assetId=" + (candidate.dataset.mapAssetId || "none"),
                "ready=" + candidate.readyState,
                "size=" + candidate.videoWidth + "x" + candidate.videoHeight,
                "paused=" + candidate.paused,
                "srcMatches=" + String(source.startsWith(${JSON.stringify(baseAssetUrl)}))
              ].join(" ");
            });
            return descriptions.length > 0 ? descriptions.join("; ") : "no video elements mounted";
          };
          const finish = (value) => {
            if (completed) {
              return;
            }
            completed = true;
            clearTimeout(timeoutId);
            if (readinessIntervalId !== null) {
              clearInterval(readinessIntervalId);
            }
            if (createdVideo && !value?.captureRect) {
              createdVideo.removeAttribute("src");
              createdVideo.load();
            }
            if (captureSurface && !value?.captureRect) {
              captureSurface.remove();
            }
            resolve(value);
          };
          const finishAfterPaint = () => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                finish({ captureRect: { x: 24, y: 24, width: 180, height: 112 } });
              });
            });
          };
          const capture = (sourceVideo) => {
            if (!sourceVideo.videoWidth || !sourceVideo.videoHeight) {
              finish({ failureReason: "Renderer video frame was not available." });
              return;
            }
            if (!captureSurface) {
              captureSurface = document.createElement("div");
              captureSurface.id = ${JSON.stringify(captureSurfaceId)};
              captureSurface.style.cssText = [
                "position:fixed",
                "left:24px",
                "top:24px",
                "width:180px",
                "height:112px",
                "overflow:hidden",
                "background:#101318",
                "z-index:2147483647",
                "pointer-events:none"
              ].join(";");
              document.body.append(captureSurface);
            }
            if (sourceVideo === createdVideo) {
              sourceVideo.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;";
              captureSurface.replaceChildren(sourceVideo);
              finishAfterPaint();
              return;
            }
            const capturedVideo = sourceVideo.cloneNode(true);
            capturedVideo.muted = true;
            capturedVideo.pause();
            capturedVideo.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;";
            captureSurface.replaceChildren(capturedVideo);
            if (capturedVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              finishAfterPaint();
              return;
            }
            capturedVideo.addEventListener("loadeddata", finishAfterPaint, { once: true });
            capturedVideo.addEventListener("canplay", finishAfterPaint, { once: true });
            capturedVideo.addEventListener("error", () => finish({ failureReason: "Renderer capture surface could not load the video frame." }), { once: true });
            capturedVideo.load();
          };
          const timeoutId = setTimeout(() => {
            finish({ failureReason: "Renderer video metadata timed out. Mounted videos: " + describeVideos() });
          }, 12000);
          const matchesAsset = (candidate) => {
            const currentSource = candidate.currentSrc || candidate.src || "";
            return candidate.dataset.mapAssetId === ${JSON.stringify(assetId)} || currentSource.startsWith(${JSON.stringify(baseAssetUrl)});
          };
          const sceneVideos = Array.from(document.querySelectorAll("video"));
          const matchingSceneVideo = sceneVideos.find(matchesAsset);
          const readySceneVideo = sceneVideos.find((candidate) =>
            matchesAsset(candidate) &&
            candidate.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            candidate.videoWidth > 0 &&
            candidate.videoHeight > 0
          );
          if (readySceneVideo) {
            capture(readySceneVideo);
            return;
          }
          if (matchingSceneVideo) {
            const captureWhenReady = () => {
              if (
                matchingSceneVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
                matchingSceneVideo.videoWidth > 0 &&
                matchingSceneVideo.videoHeight > 0
              ) {
                capture(matchingSceneVideo);
              }
            };
            matchingSceneVideo.addEventListener("loadeddata", captureWhenReady, { once: true });
            matchingSceneVideo.addEventListener("canplay", captureWhenReady, { once: true });
            matchingSceneVideo.addEventListener("playing", captureWhenReady, { once: true });
          }
          const captureReadyVideo = (candidate) => {
            if (
              candidate.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
              candidate.videoWidth > 0 &&
              candidate.videoHeight > 0
            ) {
              capture(candidate);
              return true;
            }
            return false;
          };
          const video = document.createElement("video");
          createdVideo = video;
          video.muted = true;
          video.preload = "auto";
          video.playsInline = true;
          video.style.cssText = "position:absolute;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;";
          video.addEventListener("error", () => finish({ failureReason: "Renderer could not decode the video map." }), { once: true });
          video.addEventListener("loadedmetadata", () => {
            const seekTime = Number.isFinite(video.duration) && video.duration > 0.1 ? 0.05 : 0;
            if (seekTime === 0) {
              if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                capture(video);
              } else {
                video.addEventListener("loadeddata", () => capture(video), { once: true });
              }
            } else {
              video.addEventListener("seeked", () => capture(video), { once: true });
              video.currentTime = seekTime;
            }
          }, { once: true });
          document.body.append(video);
          video.src = ${JSON.stringify(thumbnailAssetUrl)};
          video.load();
          readinessIntervalId = setInterval(() => {
            const latestReadySceneVideo = Array.from(document.querySelectorAll("video")).find((candidate) => matchesAsset(candidate) && captureReadyVideo(candidate));
            if (latestReadySceneVideo) {
              return;
            }
            captureReadyVideo(video);
          }, 100);
        })
      `,
      true
    )) as { captureRect?: { x: number; y: number; width: number; height: number }; failureReason?: string } | null;
    if (!result?.captureRect) {
      return { failureReason: result?.failureReason ?? "Renderer video frame could not be prepared for capture." };
    }
    const image = await rendererWebContents.capturePage(result.captureRect);
    await rendererWebContents.executeJavaScript(
      `
        (() => {
          const captureSurface = document.getElementById(${JSON.stringify(captureSurfaceId)});
          captureSurface?.querySelectorAll("video").forEach((video) => {
            video.removeAttribute("src");
            video.load();
          });
          captureSurface?.remove();
        })()
      `,
      true
    );
    const thumbnail = image.isEmpty() ? undefined : image.toJPEG(78);
    if (!thumbnail) {
      return { failureReason: "Renderer video frame could not be captured." };
    }
    return { thumbnail };
  } catch {
    return { failureReason: "Renderer video thumbnail capture failed." };
  }
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

  const campaign = createDefaultCampaign(path.basename(campaignPath) || "Local VTT Campaign");
  registerCampaignPath(campaignPath);
  currentCampaignPath = path.resolve(campaignPath);
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

ipcMain.handle("campaign:openBackupsFolder", async (_event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  const backupsPath = metadataBackupsRootFolder(campaignPath);
  assertInsideCampaign(campaignPath, backupsPath);
  await mkdir(backupsPath, { recursive: true });
  const errorMessage = await shell.openPath(backupsPath);
  if (errorMessage) {
    throw new Error(`Could not open backups folder. ${errorMessage}`);
  }
  return true;
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
  if (scene.layers.length === 0) {
    scene.layers = DEFAULT_LAYERS.map((layer) => ({ ...layer }));
  }
  return normalizeScene(scene);
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

  const summary = await loadCampaignFromPath(campaignPath);
  const { relativePath, destination } = await copyAssetImportToCampaign(campaignPath, sourcePath, "token");

  const assetId = randomUUID();
  const thumbnailResult = await createTokenThumbnail(campaignPath, sourcePath, assetId);
  const thumbnailRelativePath = thumbnailResult.thumbnailRelativePath;
  if (!thumbnailRelativePath) {
    logThumbnailImportFailure("token", sourcePath, thumbnailResult.failureReason);
  }
  const updatedAt = new Date().toISOString();
  const imported = createImportedAsset({
    assetId,
    kind: "token",
    mediaType: "image",
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

ipcMain.handle("asset:updateTokenThumbnail", async (_event, campaignPath: string, assetId: string, crop: SquareCropRect) => {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
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

ipcMain.handle("asset:discardTokenImport", async (_event, campaignPath: string, assetId: string) => {
  assertKnownCampaignPath(campaignPath);
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
