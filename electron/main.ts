import { app, BrowserWindow, dialog, ipcMain, net, protocol, screen, shell } from "electron";
import type { WebContents } from "electron";
import { copyFile, mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import {
  Asset,
  Campaign,
  CampaignSummary,
  DEFAULT_LAYERS,
  MetadataBackupEntry,
  MetadataBackupPreview,
  MetadataBackupRef,
  MetadataBackupRestoreResult,
  Scene,
  SquareCropRect,
  ThumbnailRegenerationFailure,
  ThumbnailRegenerationProgress,
  ThumbnailRegenerationResult,
  assertValidScene,
  createDefaultCampaign,
  createDefaultScene,
  duplicateScene,
  isLiveTableEvent,
  isPlayerIdleState,
  normalizeCampaign,
  normalizeScene,
  type PlayerSceneProjection
} from "../src/shared/localvtt.js";
import {
  createAssetProtocolErrorResponse,
  LOCALVTT_ASSET_MISSING_MESSAGE,
  LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE
} from "./assetProtocol.js";
import { findMissingCampaignAssetFiles } from "./campaignAssetRecovery.js";
import {
  createImageMapThumbnail,
  createSquareImageThumbnail,
  createVideoMapThumbnail,
  readMapMediaDimensions,
  type MediaDimensions,
  type ThumbnailCreationResult
} from "./assets.js";
import { formatMetadataReadError, formatMetadataWriteError } from "./metadataErrors.js";
import {
  hydrateCampaignSceneEntry,
  parseCampaignMetadata,
  parseSceneMetadata,
  toPortableCampaignMetadata,
  toPortableSceneMetadata
} from "./persistenceCodecs.js";

const isSmokeTest = process.env.LOCALVTT_SMOKE_TEST === "1";
const isDev = !app.isPackaged && !isSmokeTest;
const devServerUrl = "http://127.0.0.1:5173";
const MAX_METADATA_BACKUPS = 10;
const appWindowIconPath = path.join(app.getAppPath(), "build", "icon.ico");

interface MapThumbnailResult {
  thumbnailRelativePath?: string;
  failureReason?: string;
}

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
const openedCampaignPaths = new Set<string>();
const knownAssetPaths = new Set<string>();

function configureLinuxGraphicsSwitches(): void {
  if (process.platform !== "linux") {
    return;
  }

  const ozonePlatform = process.env.LOCALVTT_OZONE_PLATFORM;
  if (ozonePlatform === "wayland" || ozonePlatform === "x11") {
    app.commandLine.appendSwitch("ozone-platform", ozonePlatform);
  } else if (ozonePlatform === "auto") {
    app.commandLine.appendSwitch("ozone-platform-hint", "auto");
  }

  if (process.env.LOCALVTT_DISABLE_VULKAN === "1") {
    app.commandLine.appendSwitch("disable-features", "Vulkan");
  } else if (process.env.LOCALVTT_ENABLE_VULKAN === "1") {
    app.commandLine.appendSwitch("enable-features", "Vulkan");
  }
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

async function ensureCampaignFolders(campaignPath: string): Promise<void> {
  await mkdir(campaignPath, { recursive: true });
  await mkdir(path.join(campaignPath, "assets", "maps"), { recursive: true });
  await mkdir(path.join(campaignPath, "assets", "tokens"), { recursive: true });
  await mkdir(path.join(campaignPath, "assets", "overlays"), { recursive: true });
  await mkdir(path.join(campaignPath, "assets", "effects"), { recursive: true });
  await mkdir(path.join(campaignPath, "assets", "handouts"), { recursive: true });
  await mkdir(path.join(campaignPath, "assets", "thumbnails"), { recursive: true });
  await mkdir(path.join(campaignPath, "scenes"), { recursive: true });
}

function campaignFile(campaignPath: string): string {
  return path.join(campaignPath, "campaign.json");
}

function sceneFile(campaignPath: string, sceneId: string): string {
  return path.join(campaignPath, "scenes", `${sceneId}.scene.json`);
}

function campaignBackupFolder(campaignPath: string): string {
  return path.join(campaignPath, "backups", "campaign");
}

function sceneBackupFolder(campaignPath: string, sceneId: string): string {
  return path.join(campaignPath, "backups", "scenes", sceneId);
}

function resolveAssetPaths(campaignPath: string, campaign: Campaign): Campaign {
  // Saved JSON stays portable with relative paths; absolute paths are runtime-only conveniences for renderers.
  const normalizedCampaign = normalizeCampaign(campaign);
  const resolvedCampaign = {
    ...normalizedCampaign,
    assets: normalizedCampaign.assets.map((asset) => ({
      ...asset,
      absolutePath: path.resolve(campaignPath, asset.relativePath),
      thumbnailAbsolutePath: asset.thumbnailRelativePath ? path.resolve(campaignPath, asset.thumbnailRelativePath) : undefined
    }))
  };
  registerAssetPaths(resolvedCampaign);
  return resolvedCampaign;
}

function assertInsideCampaign(campaignPath: string, candidatePath: string): void {
  const root = path.resolve(campaignPath);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(root, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path is outside the selected campaign folder.");
  }
}

function registerCampaignPath(campaignPath: string): void {
  openedCampaignPaths.add(path.resolve(campaignPath));
}

function registerAssetPaths(campaign: Campaign): void {
  for (const asset of normalizeCampaign(campaign).assets) {
    if (asset.absolutePath) {
      knownAssetPaths.add(path.resolve(asset.absolutePath));
    }
    if (asset.thumbnailAbsolutePath) {
      knownAssetPaths.add(path.resolve(asset.thumbnailAbsolutePath));
    }
  }
}

function assertKnownCampaignPath(campaignPath: string): void {
  if (!openedCampaignPaths.has(path.resolve(campaignPath))) {
    throw new Error("Campaign folder is not open.");
  }
}

function isInsideOpenedCampaign(candidatePath: string): boolean {
  return [...openedCampaignPaths].some((campaignPath) => {
    try {
      assertInsideCampaign(campaignPath, candidatePath);
      return true;
    } catch {
      return false;
    }
  });
}

function isKnownAssetPath(candidatePath: string): boolean {
  return knownAssetPaths.has(path.resolve(candidatePath));
}

async function loadCampaignFromPath(campaignPath: string): Promise<CampaignSummary> {
  const parsed = await readCampaignMetadata(campaignPath);
  await ensureCampaignFolders(campaignPath);
  const campaignWithSceneSummaries = await hydrateSceneSummaries(campaignPath, parsed);
  const campaignWithThumbnails = await ensureMapThumbnails(campaignPath, campaignWithSceneSummaries);
  if (campaignWithThumbnails !== campaignWithSceneSummaries) {
    await writeCampaign(campaignPath, campaignWithThumbnails);
  }
  return {
    campaignPath,
    campaign: resolveAssetPaths(campaignPath, campaignWithThumbnails),
    missingAssets: (await findMissingCampaignAssetFiles(campaignPath, campaignWithThumbnails.assets)).map((asset) => asset.relativePath)
  };
}

async function readCampaignMetadata(campaignPath: string): Promise<Campaign> {
  try {
    const raw = await readFile(campaignFile(campaignPath), "utf8");
    return parseCampaignMetadata(raw);
  } catch (caught) {
    throw formatMetadataReadError("campaign", campaignBackupFolder(campaignPath), caught);
  }
}

async function readSceneMetadata(campaignPath: string, sceneId: string): Promise<Scene> {
  const filePath = sceneFile(campaignPath, sceneId);
  assertInsideCampaign(campaignPath, filePath);
  try {
    const raw = await readFile(filePath, "utf8");
    return parseSceneMetadata(raw);
  } catch (caught) {
    throw formatMetadataReadError("scene", sceneBackupFolder(campaignPath, sceneId), caught);
  }
}

async function hydrateSceneSummaries(campaignPath: string, campaign: Campaign): Promise<Campaign> {
  const normalizedCampaign = normalizeCampaign(campaign);
  const scenes = await Promise.all(
    normalizedCampaign.scenes.map(async (entry) => {
      if (entry.mapAssetId && entry.weather) {
        return entry;
      }
      try {
        const filePath = path.resolve(campaignPath, entry.file);
        assertInsideCampaign(campaignPath, filePath);
        const raw = await readFile(filePath, "utf8");
        const scene = JSON.parse(raw) as unknown;
        assertValidScene(scene);
        return hydrateCampaignSceneEntry(entry, scene);
      } catch {
        return entry;
      }
    })
  );
  return { ...normalizedCampaign, scenes };
}

async function ensureMapThumbnails(campaignPath: string, campaign: Campaign): Promise<Campaign> {
  let changed = false;
  const assets = await Promise.all(
    normalizeCampaign(campaign).assets.map(async (asset) => {
      if (asset.kind !== "map") {
        return asset;
      }
      if (asset.thumbnailRelativePath) {
        const thumbnailPath = path.resolve(campaignPath, asset.thumbnailRelativePath);
        try {
          assertInsideCampaign(campaignPath, thumbnailPath);
          await stat(thumbnailPath);
          return asset;
        } catch {
          // Regenerate missing thumbnails below.
        }
      }
      try {
        const sourcePath = path.resolve(campaignPath, asset.relativePath);
        assertInsideCampaign(campaignPath, sourcePath);
        await stat(sourcePath);
        const thumbnailResult = await createMapThumbnail(campaignPath, sourcePath, asset.id);
        if (!thumbnailResult.thumbnailRelativePath) {
          return asset;
        }
        changed = true;
        return { ...asset, thumbnailRelativePath: thumbnailResult.thumbnailRelativePath };
      } catch {
        return asset;
      }
    })
  );
  return changed ? { ...campaign, assets, updatedAt: new Date().toISOString() } : campaign;
}

async function regenerateCampaignThumbnails(
  campaignPath: string,
  onProgress?: (progress: ThumbnailRegenerationProgress) => void,
  rendererWebContents?: WebContents
): Promise<ThumbnailRegenerationResult> {
  const summary = await loadCampaignFromPath(campaignPath);
  const failures: ThumbnailRegenerationFailure[] = [];
  const previousThumbnailPaths = new Map(summary.campaign.assets.map((asset) => [asset.id, asset.thumbnailRelativePath]));
  const normalizedAssets = normalizeCampaign(summary.campaign).assets;
  const eligibleAssetCount = normalizedAssets.filter((asset) => asset.kind === "map" || asset.kind === "token").length;
  let regenerated = 0;
  let skipped = 0;
  let processed = 0;

  const assets = [];
  onProgress?.({ current: 0, total: eligibleAssetCount, assetName: null, message: "Preparing thumbnail regeneration." });
  for (const asset of normalizedAssets) {
    if (asset.kind !== "map" && asset.kind !== "token") {
      skipped += 1;
      assets.push(asset);
      continue;
    }

    onProgress?.({ current: processed, total: eligibleAssetCount, assetName: asset.name, message: `Regenerating ${asset.name}.` });
    const sourcePath = path.resolve(campaignPath, asset.relativePath);
    try {
      assertInsideCampaign(campaignPath, sourcePath);
      await stat(sourcePath);
      const thumbnailResult =
        asset.kind === "map"
          ? await createMapThumbnail(campaignPath, sourcePath, asset.id, rendererWebContents)
          : { thumbnailRelativePath: await createTokenThumbnail(campaignPath, sourcePath, asset.id) };
      if (!thumbnailResult.thumbnailRelativePath) {
        failures.push(createThumbnailFailure(asset, thumbnailResult.failureReason ?? "Thumbnail could not be generated."));
        assets.push(asset);
        continue;
      }
      regenerated += 1;
      assets.push({ ...asset, thumbnailRelativePath: thumbnailResult.thumbnailRelativePath });
    } catch (caught) {
      failures.push(createThumbnailFailure(asset, caught instanceof Error ? caught.message : "Asset could not be read."));
      assets.push(asset);
    }
    processed += 1;
    onProgress?.({ current: processed, total: eligibleAssetCount, assetName: asset.name, message: `Processed ${asset.name}.` });
  }

  const campaign: Campaign = {
    ...summary.campaign,
    assets,
    updatedAt: regenerated > 0 ? new Date().toISOString() : summary.campaign.updatedAt
  };
  if (regenerated > 0) {
    await writeCampaign(campaignPath, campaign);
    for (const asset of assets) {
      await removeThumbnailIfUnused(campaignPath, previousThumbnailPaths.get(asset.id), assets);
    }
  }

  return {
    campaignSummary: await loadCampaignFromPath(campaignPath),
    regenerated,
    skipped,
    failed: failures
  };
}

function createThumbnailFailure(asset: Asset, reason: string): ThumbnailRegenerationFailure {
  return {
    assetId: asset.id,
    assetName: asset.name,
    kind: asset.kind,
    relativePath: asset.relativePath,
    reason
  };
}

async function writeCampaign(campaignPath: string, campaign: Campaign): Promise<void> {
  try {
    await ensureCampaignFolders(campaignPath);
    await backupExistingMetadataFile(campaignPath, campaignFile(campaignPath), campaignBackupFolder(campaignPath), "campaign.json");
    const portable = toPortableCampaignMetadata(campaign);
    await writeFile(campaignFile(campaignPath), `${JSON.stringify(portable, null, 2)}\n`, "utf8");
  } catch (caught) {
    throw formatMetadataWriteError("campaign", caught);
  }
}

async function writeScene(campaignPath: string, scene: Scene): Promise<void> {
  try {
    await ensureCampaignFolders(campaignPath);
    await backupExistingMetadataFile(campaignPath, sceneFile(campaignPath, scene.id), sceneBackupFolder(campaignPath, scene.id), `${scene.id}.scene.json`);
    const normalizedScene = toPortableSceneMetadata(scene);
    await writeFile(sceneFile(campaignPath, normalizedScene.id), `${JSON.stringify(normalizedScene, null, 2)}\n`, "utf8");
  } catch (caught) {
    throw formatMetadataWriteError("scene", caught);
  }
}

async function pauseActiveTurnOrders(campaignPath: string): Promise<void> {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
  for (const entry of summary.campaign.scenes) {
    try {
      const raw = await readFile(sceneFile(campaignPath, entry.id), "utf8");
      const scene = JSON.parse(raw) as unknown;
      assertValidScene(scene);
      const normalized = normalizeScene(scene);
      if (!normalized.turnOrder.active && !normalized.turnOrder.playerViewVisible) {
        continue;
      }
      await writeScene(
        campaignPath,
        normalizeScene({
          ...normalized,
          turnOrder: {
            ...normalized.turnOrder,
            active: false,
            playerViewVisible: false
          },
          updatedAt: new Date().toISOString()
        })
      );
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

async function backupExistingMetadataFile(campaignPath: string, sourcePath: string, backupFolder: string, backupName: string): Promise<void> {
  assertInsideCampaign(campaignPath, sourcePath);
  assertInsideCampaign(campaignPath, backupFolder);
  try {
    await stat(sourcePath);
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  await mkdir(backupFolder, { recursive: true });
  const backupPath = path.join(backupFolder, `${createBackupTimestamp()}.${backupName}`);
  assertInsideCampaign(campaignPath, backupPath);
  await copyFile(sourcePath, backupPath);
  await pruneMetadataBackups(backupFolder);
}

async function pruneMetadataBackups(backupFolder: string): Promise<void> {
  const entries = await readdir(backupFolder);
  const backupFiles = entries.filter((entry) => entry.endsWith(".json")).sort().reverse();
  for (const entry of backupFiles.slice(MAX_METADATA_BACKUPS)) {
    await unlink(path.join(backupFolder, entry));
  }
}

function createBackupTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function listMetadataBackups(campaignPath: string): Promise<MetadataBackupEntry[]> {
  const summary = await loadCampaignFromPath(campaignPath);
  const sceneNames = new Map(summary.campaign.scenes.map((scene) => [scene.id, scene.name]));
  const entries: MetadataBackupEntry[] = [];
  entries.push(...(await listBackupFolder(campaignPath, campaignBackupFolder(campaignPath), "campaign")));

  const scenesRoot = path.join(campaignPath, "backups", "scenes");
  assertInsideCampaign(campaignPath, scenesRoot);
  try {
    const sceneFolders = await readdir(scenesRoot, { withFileTypes: true });
    for (const folder of sceneFolders) {
      if (!folder.isDirectory()) {
        continue;
      }
      const sceneId = folder.name;
      entries.push(...(await listBackupFolder(campaignPath, sceneBackupFolder(campaignPath, sceneId), "scene", sceneId, sceneNames.get(sceneId))));
    }
  } catch (caught) {
    if ((caught as NodeJS.ErrnoException).code !== "ENOENT") {
      throw caught;
    }
  }

  return entries.sort((left, right) => right.fileName.localeCompare(left.fileName));
}

async function listBackupFolder(campaignPath: string, backupFolder: string, kind: MetadataBackupEntry["kind"], sceneId?: string, sceneName?: string): Promise<MetadataBackupEntry[]> {
  assertInsideCampaign(campaignPath, backupFolder);
  try {
    const entries = await readdir(backupFolder);
    const backups: MetadataBackupEntry[] = [];
    for (const fileName of entries.filter((entry) => entry.endsWith(".json"))) {
      const backupPath = path.join(backupFolder, fileName);
      assertInsideCampaign(campaignPath, backupPath);
      const stats = await stat(backupPath);
      backups.push(createMetadataBackupEntry(kind, fileName, stats.size, sceneId, sceneName));
    }
    return backups;
  } catch (caught) {
    if ((caught as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw caught;
  }
}

function createMetadataBackupEntry(kind: MetadataBackupEntry["kind"], fileName: string, sizeBytes: number, sceneId?: string, sceneName?: string): MetadataBackupEntry {
  const timestamp = parseBackupTimestamp(fileName);
  const label = kind === "campaign" ? "Campaign metadata" : sceneName ? `Scene metadata: ${sceneName}` : `Scene metadata: ${sceneId ?? "Unknown scene"}`;
  return {
    id: kind === "campaign" ? `campaign::${fileName}` : `scene:${sceneId ?? ""}:${fileName}`,
    kind,
    sceneId,
    fileName,
    timestamp,
    label,
    sizeBytes
  };
}

function parseBackupTimestamp(fileName: string): string | null {
  const timestamp = fileName.replace(/\.(campaign|[^.]+\.scene)\.json$/, "");
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3}Z)$/.exec(timestamp);
  if (!match) {
    return null;
  }
  return `${match[1]}:${match[2]}:${match[3]}.${match[4]}`;
}

function backupPathFromRef(campaignPath: string, ref: MetadataBackupRef): string {
  const backupFolder = ref.kind === "campaign" ? campaignBackupFolder(campaignPath) : sceneBackupFolder(campaignPath, requireSceneBackupId(ref));
  const backupPath = path.join(backupFolder, path.basename(ref.fileName));
  assertInsideCampaign(campaignPath, backupPath);
  return backupPath;
}

function requireSceneBackupId(ref: MetadataBackupRef): string {
  if (!ref.sceneId) {
    throw new Error("Scene backup selection is missing a scene id.");
  }
  return ref.sceneId;
}

async function previewMetadataBackup(campaignPath: string, ref: MetadataBackupRef): Promise<MetadataBackupPreview> {
  const backupPath = backupPathFromRef(campaignPath, ref);
  const raw = await readFile(backupPath, "utf8");
  const stats = await stat(backupPath);
  if (ref.kind === "campaign") {
    const campaign = parseCampaignMetadata(raw);
    return {
      ...createMetadataBackupEntry("campaign", path.basename(backupPath), stats.size),
      summary: `${campaign.name} - ${campaign.scenes.length} scene${campaign.scenes.length === 1 ? "" : "s"}, ${campaign.assets.length} asset${campaign.assets.length === 1 ? "" : "s"}`,
      json: JSON.stringify(toPortableCampaignMetadata(campaign), null, 2)
    };
  }

  const scene = parseSceneMetadata(raw);
  const sceneId = requireSceneBackupId(ref);
  if (scene.id !== sceneId) {
    throw new Error("Scene backup does not match the selected scene.");
  }
  return {
    ...createMetadataBackupEntry("scene", path.basename(backupPath), stats.size, sceneId, scene.name),
    summary: `${scene.name} - ${scene.tokens.length} token${scene.tokens.length === 1 ? "" : "s"}, ${scene.layers.length} layer${scene.layers.length === 1 ? "" : "s"}`,
    json: JSON.stringify(toPortableSceneMetadata(scene), null, 2)
  };
}

async function restoreMetadataBackup(campaignPath: string, ref: MetadataBackupRef): Promise<MetadataBackupRestoreResult> {
  const preview = await previewMetadataBackup(campaignPath, ref);
  const raw = await readFile(backupPathFromRef(campaignPath, ref), "utf8");
  if (ref.kind === "campaign") {
    const campaign = toPortableCampaignMetadata(parseCampaignMetadata(raw));
    await backupExistingMetadataFile(campaignPath, campaignFile(campaignPath), campaignBackupFolder(campaignPath), "campaign.json");
    await writeFile(campaignFile(campaignPath), `${JSON.stringify(campaign, null, 2)}\n`, "utf8");
    return { campaignSummary: await loadCampaignFromPath(campaignPath), restored: preview };
  }

  const scene = toPortableSceneMetadata(parseSceneMetadata(raw));
  const sceneId = requireSceneBackupId(ref);
  if (scene.id !== sceneId) {
    throw new Error("Scene backup does not match the selected scene.");
  }
  await backupExistingMetadataFile(campaignPath, sceneFile(campaignPath, sceneId), sceneBackupFolder(campaignPath, sceneId), `${sceneId}.scene.json`);
  await writeFile(sceneFile(campaignPath, sceneId), `${JSON.stringify(scene, null, 2)}\n`, "utf8");
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene: normalizeScene(scene), restored: preview };
}

async function getTokenAssetUsage(campaignPath: string, campaign: Campaign, assetId: string): Promise<Array<{ sceneId: string; sceneName: string; count: number }>> {
  const usage = [];
  for (const entry of campaign.scenes) {
    try {
      const raw = await readFile(sceneFile(campaignPath, entry.id), "utf8");
      const scene = JSON.parse(raw) as unknown;
      assertValidScene(scene);
      const count = scene.tokens.filter((token) => token.assetId === assetId).length;
      if (count > 0) {
        usage.push({ sceneId: entry.id, sceneName: entry.name, count });
      }
    } catch {
      // Missing or invalid scenes are reported elsewhere by scene loading.
    }
  }
  return usage;
}

async function chooseDirectory(title: string, createDirectory = false): Promise<string | null> {
  const options: Electron.OpenDialogOptions = {
    title,
    properties: createDirectory ? ["openDirectory", "createDirectory"] : ["openDirectory"]
  };
  const result = gmWindow ? await dialog.showOpenDialog(gmWindow, options) : await dialog.showOpenDialog(options);
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
}

async function chooseMapFile(): Promise<string | null> {
  const options: Electron.OpenDialogOptions = {
    title: "Import a battle map",
    properties: ["openFile"],
    filters: [
      { name: "Battle maps", extensions: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm"] },
      { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
      { name: "Videos", extensions: ["mp4", "webm"] }
    ]
  };
  const result = gmWindow ? await dialog.showOpenDialog(gmWindow, options) : await dialog.showOpenDialog(options);
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
}

async function chooseTokenFile(): Promise<string | null> {
  const options: Electron.OpenDialogOptions = {
    title: "Import a token image",
    properties: ["openFile"],
    filters: [
      { name: "Token images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
      { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] }
    ]
  };
  const result = gmWindow ? await dialog.showOpenDialog(gmWindow, options) : await dialog.showOpenDialog(options);
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
}

function safeAssetName(originalPath: string): string {
  const parsed = path.parse(originalPath);
  const cleanBase = parsed.name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "asset";
  return `${cleanBase}-${Date.now()}-${randomUUID().slice(0, 8)}${parsed.ext.toLowerCase()}`;
}

function allowedMapExtension(filePath: string): boolean {
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm"].includes(path.extname(filePath).toLowerCase());
}

function allowedTokenExtension(filePath: string): boolean {
  return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(path.extname(filePath).toLowerCase());
}

function mapMediaType(filePath: string): Asset["mediaType"] {
  return [".mp4", ".webm"].includes(path.extname(filePath).toLowerCase()) ? "video" : "image";
}

function getDimensionDifferenceWarning(currentDimensions: MediaDimensions | undefined, nextDimensions: MediaDimensions | undefined): string | null {
  if (!currentDimensions || !nextDimensions) {
    return null;
  }

  const widthRatio = getLargestRatio(currentDimensions.width, nextDimensions.width);
  const heightRatio = getLargestRatio(currentDimensions.height, nextDimensions.height);
  const currentAspect = currentDimensions.width / currentDimensions.height;
  const nextAspect = nextDimensions.width / nextDimensions.height;
  const aspectRatio = getLargestRatio(currentAspect, nextAspect);
  if (widthRatio < 1.25 && heightRatio < 1.25 && aspectRatio < 1.12) {
    return null;
  }

  return [
    `Current map: ${currentDimensions.width} x ${currentDimensions.height}`,
    `Replacement map: ${nextDimensions.width} x ${nextDimensions.height}`,
    "The scene keeps its current grid, calibration, fog, drawings, tokens, and effects. Review alignment after replacing the map."
  ].join("\n");
}

function getLargestRatio(first: number, second: number): number {
  if (first <= 0 || second <= 0) {
    return 1;
  }
  return Math.max(first, second) / Math.min(first, second);
}

async function getMapReplacementWarning(currentPath: string, currentMediaType: Asset["mediaType"], nextPath: string, nextMediaType: Asset["mediaType"]): Promise<{
  currentDimensions?: MediaDimensions;
  nextDimensions?: MediaDimensions;
  warning?: string;
}> {
  const [currentDimensions, nextDimensions] = await Promise.all([
    readMapMediaDimensions(currentPath, currentMediaType),
    readMapMediaDimensions(nextPath, nextMediaType)
  ]);
  return { currentDimensions, nextDimensions, warning: getDimensionDifferenceWarning(currentDimensions, nextDimensions) ?? undefined };
}

async function mapAssetUsedByOtherScenes(campaignPath: string, campaign: Campaign, assetId: string, sceneId: string): Promise<boolean> {
  for (const entry of campaign.scenes) {
    if (entry.id === sceneId) {
      continue;
    }
    try {
      const scene = await readSceneMetadata(campaignPath, entry.id);
      if (scene.mapAssetId === assetId) {
        return true;
      }
    } catch {
      // Missing or invalid scenes are reported elsewhere by scene loading.
    }
  }
  return false;
}

async function deleteMapAssetFiles(campaignPath: string, asset: Asset): Promise<void> {
  const assetPath = path.resolve(campaignPath, asset.relativePath);
  assertInsideCampaign(campaignPath, assetPath);
  try {
    await unlink(assetPath);
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
  if (asset.thumbnailRelativePath) {
    const thumbnailPath = path.resolve(campaignPath, asset.thumbnailRelativePath);
    assertInsideCampaign(campaignPath, thumbnailPath);
    try {
      await unlink(thumbnailPath);
    } catch (caught) {
      const error = caught as NodeJS.ErrnoException;
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
}

async function createMapThumbnail(campaignPath: string, sourcePath: string, assetId: string, rendererWebContents?: WebContents): Promise<MapThumbnailResult> {
  const mediaType = mapMediaType(sourcePath);
  const thumbnailResult = mediaType === "video" ? await createVideoMapThumbnailWithFallback(sourcePath, assetId, rendererWebContents) : { thumbnail: createImageMapThumbnail(sourcePath) };
  const thumbnail = thumbnailResult.thumbnail;
  if (!thumbnail) {
    return { failureReason: thumbnailResult.failureReason ?? "Image file could not be decoded by Electron." };
  }

  const relativePath = path.join("assets", "thumbnails", `${assetId}.jpg`).replaceAll(path.sep, "/");
  const destination = path.resolve(campaignPath, relativePath);
  assertInsideCampaign(campaignPath, destination);
  await writeFile(destination, thumbnail);
  return { thumbnailRelativePath: relativePath };
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

  const primaryReason = primaryResult.failureReason ?? "Electron could not generate a video thumbnail.";
  const fallbackReason = fallbackResult.failureReason ?? "Renderer capture did not return a thumbnail.";
  return { failureReason: `${primaryReason} Renderer fallback also failed: ${fallbackReason}` };
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

async function createTokenThumbnail(campaignPath: string, sourcePath: string, assetId: string): Promise<string | undefined> {
  const thumbnail = await createSquareImageThumbnail(sourcePath);
  if (!thumbnail) {
    return undefined;
  }
  return writeTokenThumbnail(campaignPath, assetId, thumbnail);
}

async function writeTokenThumbnail(campaignPath: string, assetId: string, thumbnail: Buffer, variant = ""): Promise<string> {
  const safeVariant = variant.replace(/[^a-zA-Z0-9_-]/g, "");
  const fileStem = safeVariant ? `${assetId}-${safeVariant}` : assetId;
  const relativePath = path.join("assets", "thumbnails", `${fileStem}.jpg`).replaceAll(path.sep, "/");
  const destination = path.resolve(campaignPath, relativePath);
  assertInsideCampaign(campaignPath, destination);
  await writeFile(destination, thumbnail);
  return relativePath;
}

async function removeThumbnailIfUnused(campaignPath: string, relativePath: string | undefined, assets: readonly Asset[]): Promise<void> {
  if (!relativePath || assets.some((asset) => asset.thumbnailRelativePath === relativePath)) {
    return;
  }
  const thumbnailPath = path.resolve(campaignPath, relativePath);
  assertInsideCampaign(campaignPath, thumbnailPath);
  try {
    await unlink(thumbnailPath);
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

app.whenReady().then(() => {
  protocol.handle("localvtt", async (request) => {
    const url = new URL(request.url);
    if (url.hostname !== "asset") {
      return new Response("Unknown LocalVTT resource.", { status: 404 });
    }

    const filePath = path.resolve(decodeURIComponent(url.pathname.slice(1)));
    if (!isInsideOpenedCampaign(filePath) || !isKnownAssetPath(filePath)) {
      return createAssetProtocolErrorResponse(LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE, 403);
    }
    try {
      await stat(filePath);
    } catch (caught) {
      const error = caught as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        return createAssetProtocolErrorResponse(LOCALVTT_ASSET_MISSING_MESSAGE, 404);
      }
      throw error;
    }
    const response = await net.fetch(pathToFileURL(filePath).toString());
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Range");
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
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
    if (forceCloseGmWindow) {
      return;
    }

    event.preventDefault();
    if (!gmHasUnsavedChanges) {
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

    if (choice === 1) {
      win.webContents.send("app:saveBeforeClose");
    } else if (choice === 2) {
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
  }, 15000);

  const finish = () => {
    if (completed) {
      return;
    }
    completed = true;
    void win.webContents
      .executeJavaScript(
        `(async () => {
          const playerOpenResult = await window.localVtt.openPlayerView({ fullscreen: false });
          const playerIdleDelivered = await window.localVtt.showPlayerIdle("Smoke Test", "Player View IPC is available.", "hold");
          const lastPlayerState = await window.localVtt.getLastPlayerState();
          const displays = await window.localVtt.getDisplays();
          return {
            hash: window.location.hash,
            hasPreloadBridge: Boolean(window.localVtt),
            hasCreateCampaign: typeof window.localVtt?.createCampaign === "function",
            hasPlayerBridge: typeof window.localVtt?.openPlayerView === "function",
            playerOpenResult,
            playerIdleDelivered,
            lastPlayerState,
            displayCount: displays.length,
            title: document.title,
            bodyText: document.body.innerText.slice(0, 500)
          };
        })()`
      )
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
  const backupsPath = path.join(campaignPath, "backups");
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
  return restoreMetadataBackup(campaignPath, ref);
});

ipcMain.handle("scene:create", async (_event, campaignPath: string, sceneName: string) => {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
  const scene = createDefaultScene(sceneName || "Untitled Scene");
  await writeScene(campaignPath, scene);

  const campaign: Campaign = {
    ...summary.campaign,
    scenes: [...summary.campaign.scenes, { id: scene.id, name: scene.name, file: `scenes/${scene.id}.scene.json`, weather: scene.weather }],
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene };
});

ipcMain.handle("scene:duplicate", async (_event, campaignPath: string, sourceScene: Scene, sceneName: string, afterSceneId: string, folderId?: string) => {
  assertKnownCampaignPath(campaignPath);
  assertValidScene(sourceScene);
  const summary = await loadCampaignFromPath(campaignPath);
  const scene = duplicateScene(sourceScene, sceneName || `${sourceScene.name} Copy`);
  await writeScene(campaignPath, scene);

  const duplicateEntry = {
    id: scene.id,
    name: scene.name,
    file: `scenes/${scene.id}.scene.json`,
    mapAssetId: scene.mapAssetId,
    weather: scene.weather,
    folderId
  };
  const sourceIndex = summary.campaign.scenes.findIndex((entry) => entry.id === afterSceneId);
  const scenes = [...summary.campaign.scenes];
  scenes.splice(sourceIndex >= 0 ? sourceIndex + 1 : scenes.length, 0, duplicateEntry);
  const campaign: Campaign = {
    ...summary.campaign,
    scenes,
    updatedAt: new Date().toISOString()
  };
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
  const updated = normalizeScene({ ...scene, updatedAt: new Date().toISOString() });
  await writeScene(campaignPath, updated);

  const summary = await loadCampaignFromPath(campaignPath);
  const campaign: Campaign = {
    ...summary.campaign,
    scenes: summary.campaign.scenes.map((entry) =>
      entry.id === scene.id ? { ...entry, name: scene.name, mapAssetId: updated.mapAssetId, weather: updated.weather } : entry
    ),
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene: updated };
});

ipcMain.handle("scene:rename", async (_event, campaignPath: string, sceneId: string, sceneName: string) => {
  assertKnownCampaignPath(campaignPath);
  const name = sceneName.trim();
  if (!name) {
    throw new Error("Scene name cannot be empty.");
  }

  const filePath = sceneFile(campaignPath, sceneId);
  assertInsideCampaign(campaignPath, filePath);
  const scene = await readSceneMetadata(campaignPath, sceneId);
  if (scene.id !== sceneId) {
    throw new Error("Invalid scene file.");
  }

  const updatedScene = normalizeScene({ ...scene, name, updatedAt: new Date().toISOString() });
  await writeScene(campaignPath, updatedScene);

  const summary = await loadCampaignFromPath(campaignPath);
  const campaign: Campaign = {
    ...summary.campaign,
    scenes: summary.campaign.scenes.map((entry) => (entry.id === sceneId ? { ...entry, name } : entry)),
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene: updatedScene };
});

ipcMain.handle("scene:delete", async (_event, campaignPath: string, sceneId: string) => {
  assertKnownCampaignPath(campaignPath);
  const filePath = sceneFile(campaignPath, sceneId);
  assertInsideCampaign(campaignPath, filePath);
  await backupSceneBeforeDelete(campaignPath, sceneId);
  try {
    await unlink(filePath);
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const summary = await loadCampaignFromPath(campaignPath);
  const campaign: Campaign = {
    ...summary.campaign,
    scenes: summary.campaign.scenes.filter((entry) => entry.id !== sceneId),
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  return loadCampaignFromPath(campaignPath);
});

ipcMain.handle("asset:importMap", async (event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  const sourcePath = await chooseMapFile();
  if (!sourcePath) {
    return null;
  }

  if (!allowedMapExtension(sourcePath)) {
    throw new Error("Unsupported map type. Use jpg, jpeg, png, webp, gif, mp4, or webm.");
  }

  const summary = await loadCampaignFromPath(campaignPath);
  const fileName = safeAssetName(sourcePath);
  const relativePath = path.join("assets", "maps", fileName).replaceAll(path.sep, "/");
  const destination = path.resolve(campaignPath, relativePath);
  assertInsideCampaign(campaignPath, destination);
  await copyFile(sourcePath, destination);
  knownAssetPaths.add(destination);

  const assetId = randomUUID();
  const thumbnailResult = await createMapThumbnail(campaignPath, destination, assetId, event.sender);
  const thumbnailRelativePath = thumbnailResult.thumbnailRelativePath;
  const imported: Asset = {
    id: assetId,
    name: path.basename(sourcePath),
    kind: "map",
    mediaType: mapMediaType(sourcePath),
    relativePath,
    thumbnailRelativePath,
    originalFileName: path.basename(sourcePath),
    createdAt: new Date().toISOString(),
    absolutePath: destination,
    thumbnailAbsolutePath: thumbnailRelativePath ? path.resolve(campaignPath, thumbnailRelativePath) : undefined
  };

  const campaign: Campaign = {
    ...summary.campaign,
    assets: [...summary.campaign.assets, imported],
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), asset: imported };
});

ipcMain.handle("asset:previewMapReplacement", async (_event, campaignPath: string, sceneId: string, currentAssetId: string) => {
  assertKnownCampaignPath(campaignPath);
  const sourcePath = await chooseMapFile();
  if (!sourcePath) {
    return null;
  }

  if (!allowedMapExtension(sourcePath)) {
    throw new Error("Unsupported map type. Use jpg, jpeg, png, webp, gif, mp4, or webm.");
  }

  const summary = await loadCampaignFromPath(campaignPath);
  const currentAsset = summary.campaign.assets.find((candidate) => candidate.id === currentAssetId && candidate.kind === "map");
  if (!currentAsset) {
    throw new Error("Current map asset was not found in this campaign.");
  }

  const currentScene = await readSceneMetadata(campaignPath, sceneId);
  if (currentScene.mapAssetId !== currentAssetId) {
    throw new Error("The selected scene no longer uses this map asset.");
  }

  const currentAssetPath = path.resolve(campaignPath, currentAsset.relativePath);
  assertInsideCampaign(campaignPath, currentAssetPath);
  const nextMediaType = mapMediaType(sourcePath);
  const dimensions = await getMapReplacementWarning(currentAssetPath, currentAsset.mediaType, sourcePath, nextMediaType);

  return {
    sourcePath,
    sourceName: path.basename(sourcePath),
    currentAssetName: currentAsset.name,
    currentDimensions: dimensions.currentDimensions,
    nextDimensions: dimensions.nextDimensions,
    warning: dimensions.warning
  };
});

ipcMain.handle("asset:replaceMap", async (event, campaignPath: string, sceneId: string, currentAssetId: string, sourcePath: string) => {
  assertKnownCampaignPath(campaignPath);
  if (!allowedMapExtension(sourcePath)) {
    throw new Error("Unsupported map type. Use jpg, jpeg, png, webp, gif, mp4, or webm.");
  }

  const summary = await loadCampaignFromPath(campaignPath);
  const currentAsset = summary.campaign.assets.find((candidate) => candidate.id === currentAssetId && candidate.kind === "map");
  if (!currentAsset) {
    throw new Error("Current map asset was not found in this campaign.");
  }

  const currentScene = await readSceneMetadata(campaignPath, sceneId);
  if (currentScene.mapAssetId !== currentAssetId) {
    throw new Error("The selected scene no longer uses this map asset.");
  }

  const fileName = safeAssetName(sourcePath);
  const relativePath = path.join("assets", "maps", fileName).replaceAll(path.sep, "/");
  const destination = path.resolve(campaignPath, relativePath);
  assertInsideCampaign(campaignPath, destination);
  await copyFile(sourcePath, destination);
  knownAssetPaths.add(destination);

  const assetId = randomUUID();
  const thumbnailResult = await createMapThumbnail(campaignPath, destination, assetId, event.sender);
  const thumbnailRelativePath = thumbnailResult.thumbnailRelativePath;
  const imported: Asset = {
    id: assetId,
    name: path.basename(sourcePath),
    kind: "map",
    mediaType: mapMediaType(sourcePath),
    relativePath,
    thumbnailRelativePath,
    originalFileName: path.basename(sourcePath),
    createdAt: new Date().toISOString(),
    absolutePath: destination,
    thumbnailAbsolutePath: thumbnailRelativePath ? path.resolve(campaignPath, thumbnailRelativePath) : undefined
  };

  const updatedScene = normalizeScene({ ...currentScene, mapAssetId: imported.id, updatedAt: new Date().toISOString() });
  await writeScene(campaignPath, updatedScene);

  const keepCurrentAsset = await mapAssetUsedByOtherScenes(campaignPath, summary.campaign, currentAsset.id, sceneId);
  const campaign: Campaign = {
    ...summary.campaign,
    assets: keepCurrentAsset ? [...summary.campaign.assets, imported] : [...summary.campaign.assets.filter((asset) => asset.id !== currentAsset.id), imported],
    scenes: summary.campaign.scenes.map((entry) => (entry.id === sceneId ? { ...entry, mapAssetId: imported.id } : entry)),
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  if (!keepCurrentAsset) {
    await deleteMapAssetFiles(campaignPath, currentAsset);
  }
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene: updatedScene, asset: imported };
});

ipcMain.handle("asset:importToken", async (_event, campaignPath: string) => {
  assertKnownCampaignPath(campaignPath);
  const sourcePath = await chooseTokenFile();
  if (!sourcePath) {
    return null;
  }

  if (!allowedTokenExtension(sourcePath)) {
    throw new Error("Unsupported token type. Use jpg, jpeg, png, webp, or gif.");
  }

  const summary = await loadCampaignFromPath(campaignPath);
  const fileName = safeAssetName(sourcePath);
  const relativePath = path.join("assets", "tokens", fileName).replaceAll(path.sep, "/");
  const destination = path.resolve(campaignPath, relativePath);
  assertInsideCampaign(campaignPath, destination);
  await copyFile(sourcePath, destination);

  const assetId = randomUUID();
  const thumbnailRelativePath = await createTokenThumbnail(campaignPath, sourcePath, assetId);
  const imported: Asset = {
    id: assetId,
    name: path.basename(sourcePath),
    kind: "token",
    mediaType: "image",
    relativePath,
    thumbnailRelativePath,
    originalFileName: path.basename(sourcePath),
    createdAt: new Date().toISOString(),
    absolutePath: destination,
    thumbnailAbsolutePath: thumbnailRelativePath ? path.resolve(campaignPath, thumbnailRelativePath) : undefined
  };

  const campaign: Campaign = {
    ...summary.campaign,
    assets: [...summary.campaign.assets, imported],
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), asset: imported };
});

ipcMain.handle("asset:updateTokenThumbnail", async (_event, campaignPath: string, assetId: string, crop: SquareCropRect) => {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
  const asset = summary.campaign.assets.find((candidate) => candidate.id === assetId && candidate.kind === "token");
  if (!asset?.absolutePath) {
    throw new Error("Token asset was not found in this campaign.");
  }

  assertInsideCampaign(campaignPath, asset.absolutePath);
  const thumbnail = await createSquareImageThumbnail(asset.absolutePath, crop);
  if (!thumbnail) {
    throw new Error("Unable to generate token thumbnail.");
  }
  const thumbnailRelativePath = await writeTokenThumbnail(campaignPath, assetId, thumbnail, `crop-${Date.now()}`);
  const nextAssets = summary.campaign.assets.map((candidate) => (candidate.id === assetId ? { ...candidate, thumbnailRelativePath } : candidate));
  const campaign: Campaign = {
    ...summary.campaign,
    assets: nextAssets,
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  await removeThumbnailIfUnused(campaignPath, asset.thumbnailRelativePath, nextAssets);
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
  const asset = summary.campaign.assets.find((candidate) => candidate.id === assetId && candidate.kind === "token");
  if (!asset) {
    return summary;
  }

  const pathsToRemove = [asset.absolutePath, asset.thumbnailAbsolutePath].filter((candidate): candidate is string => Boolean(candidate));
  for (const assetPath of pathsToRemove) {
    assertInsideCampaign(campaignPath, assetPath);
    try {
      await unlink(assetPath);
    } catch (caught) {
      const error = caught as NodeJS.ErrnoException;
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  const campaign: Campaign = {
    ...summary.campaign,
    assets: summary.campaign.assets.filter((candidate) => candidate.id !== assetId),
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  return loadCampaignFromPath(campaignPath);
});

ipcMain.handle("asset:getTokenUsage", async (_event, campaignPath: string, assetId: string) => {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
  return getTokenAssetUsage(campaignPath, summary.campaign, assetId);
});

ipcMain.handle("asset:deleteToken", async (_event, campaignPath: string, assetId: string) => {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
  const asset = summary.campaign.assets.find((candidate) => candidate.id === assetId && candidate.kind === "token");
  if (!asset) {
    throw new Error("Token asset was not found in this campaign.");
  }

  const changedScenes: Scene[] = [];
  for (const entry of summary.campaign.scenes) {
    try {
      const raw = await readFile(sceneFile(campaignPath, entry.id), "utf8");
      const scene = JSON.parse(raw) as unknown;
      assertValidScene(scene);
      if (!scene.tokens.some((token) => token.assetId === assetId)) {
        continue;
      }
      const updatedScene = normalizeScene({
        ...scene,
        tokens: scene.tokens.filter((token) => token.assetId !== assetId),
        updatedAt: new Date().toISOString()
      });
      await writeScene(campaignPath, updatedScene);
      changedScenes.push(updatedScene);
    } catch {
      // Missing or invalid scenes are reported elsewhere by scene loading.
    }
  }

  const pathsToRemove = [asset.absolutePath ?? path.resolve(campaignPath, asset.relativePath), asset.thumbnailAbsolutePath ?? (asset.thumbnailRelativePath ? path.resolve(campaignPath, asset.thumbnailRelativePath) : undefined)].filter((candidate): candidate is string => Boolean(candidate));
  for (const assetPath of pathsToRemove) {
    assertInsideCampaign(campaignPath, assetPath);
    try {
      await unlink(assetPath);
    } catch (caught) {
      const error = caught as NodeJS.ErrnoException;
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  const campaign: Campaign = {
    ...summary.campaign,
    assets: summary.campaign.assets.filter((candidate) => candidate.id !== assetId),
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scenes: changedScenes };
});

ipcMain.handle("asset:deleteMap", async (_event, campaignPath: string, sceneId: string, assetId: string) => {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
  const asset = summary.campaign.assets.find((candidate) => candidate.id === assetId && candidate.kind === "map");
  if (!asset) {
    throw new Error("Map asset was not found in this campaign.");
  }

  const otherSceneNames: string[] = [];
  for (const entry of summary.campaign.scenes) {
    if (entry.id === sceneId) {
      continue;
    }
    try {
      const raw = await readFile(sceneFile(campaignPath, entry.id), "utf8");
      const scene = JSON.parse(raw) as unknown;
      assertValidScene(scene);
      if (scene.mapAssetId === assetId) {
        otherSceneNames.push(entry.name);
      }
    } catch {
      // Missing or invalid scenes are reported elsewhere by scene loading.
    }
  }

  if (otherSceneNames.length > 0) {
    throw new Error(`This map asset is still used by: ${otherSceneNames.join(", ")}.`);
  }

  const assetPath = path.resolve(campaignPath, asset.relativePath);
  assertInsideCampaign(campaignPath, assetPath);
  try {
    await unlink(assetPath);
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
  if (asset.thumbnailRelativePath) {
    const thumbnailPath = path.resolve(campaignPath, asset.thumbnailRelativePath);
    assertInsideCampaign(campaignPath, thumbnailPath);
    try {
      await unlink(thumbnailPath);
    } catch (caught) {
      const error = caught as NodeJS.ErrnoException;
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  const currentScene = await readSceneMetadata(campaignPath, sceneId);
  const updatedScene = normalizeScene(
    currentScene.mapAssetId === assetId ? { ...currentScene, mapAssetId: undefined, updatedAt: new Date().toISOString() } : currentScene
  );
  await writeScene(campaignPath, updatedScene);

  const campaign: Campaign = {
    ...summary.campaign,
    scenes: summary.campaign.scenes.map((entry) => (entry.mapAssetId === assetId ? { ...entry, mapAssetId: undefined } : entry)),
    assets: summary.campaign.assets.filter((candidate) => candidate.id !== assetId),
    updatedAt: new Date().toISOString()
  };
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
  const targetDisplay = typeof options?.displayId === "number" ? screen.getAllDisplays().find((display) => display.id === options.displayId) : null;
  if (targetDisplay && (createdPlayerWindow || !playerWindow.isFullScreen())) {
    playerWindow.setFullScreen(false);
    playerWindow.setBounds(targetDisplay.bounds);
  }
  playerWindow.show();
  playerWindow.focus();
  if (options?.fullscreen && targetDisplay) {
    playerWindow.setFullScreen(true);
  }
  if (lastPlayerProjection) {
    sendToPlayerWhenReady(lastPlayerProjection);
  }
  return { ok: true, displayFound: typeof options?.displayId === "number" ? Boolean(targetDisplay) : true };
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
  const sentFromPlayer = Boolean(playerWindow && !playerWindow.isDestroyed() && ipcEvent.sender.id === playerWindow.webContents.id);
  let delivered = false;
  if (sentFromPlayer) {
    if (gmWindow && !gmWindow.isDestroyed()) {
      gmWindow.webContents.send("player:liveTableEvent", event);
      delivered = true;
    }
    return delivered;
  }
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.webContents.send("player:liveTableEvent", event);
    delivered = true;
  }
  return delivered;
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

ipcMain.handle("app:getDisplays", async () => {
  return screen.getAllDisplays().map((display) => ({
    id: display.id,
    label: display.label,
    bounds: display.bounds,
    workArea: display.workArea,
    nativeResolution: {
      width: Math.round(display.bounds.width * display.scaleFactor),
      height: Math.round(display.bounds.height * display.scaleFactor)
    },
    scaleFactor: display.scaleFactor,
    rotation: display.rotation
  }));
});

ipcMain.on("app:setUnsavedChanges", (_event, hasUnsavedChanges: boolean) => {
  gmHasUnsavedChanges = hasUnsavedChanges;
});

ipcMain.on("app:closeAfterSave", () => {
  if (!gmWindow || gmWindow.isDestroyed()) {
    return;
  }
  void closeGmWindowAfterPausing(gmWindow);
});
