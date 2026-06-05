import { app, BrowserWindow, dialog, ipcMain, nativeImage, net, protocol, screen } from "electron";
import { copyFile, mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import {
  Asset,
  Campaign,
  CampaignSummary,
  DEFAULT_LAYERS,
  Scene,
  assertValidCampaign,
  assertValidScene,
  createDefaultCampaign,
  createDefaultScene,
  normalizeCampaign,
  normalizeScene,
  projectSceneForPlayer
} from "../src/shared/localvtt.js";

const isDev = !app.isPackaged;
const devServerUrl = "http://127.0.0.1:5173";

let gmWindow: BrowserWindow | null = null;
let playerWindow: BrowserWindow | null = null;
let lastPlayerProjection: unknown = null;
let gmHasUnsavedChanges = false;
let forceCloseGmWindow = false;
const openedCampaignPaths = new Set<string>();
const knownAssetPaths = new Set<string>();

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
    backgroundColor: hash === "gm" ? "#101318" : "#000000",
    webPreferences: {
      preload: path.join(app.getAppPath(), "dist-electron", "electron", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    void win.loadURL(`${devServerUrl}/#/${hash}`);
  } else {
    void win.loadFile(path.join(app.getAppPath(), "dist", "index.html"), {
      hash: `/${hash}`
    });
  }

  return win;
}

function sendToPlayerWhenReady(payload: unknown): void {
  if (!playerWindow || playerWindow.isDestroyed()) {
    return;
  }

  if (playerWindow.webContents.isLoading()) {
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

function resolveAssetPaths(campaignPath: string, campaign: Campaign): Campaign {
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
  const raw = await readFile(campaignFile(campaignPath), "utf8");
  const parsed = JSON.parse(raw) as unknown;
  assertValidCampaign(parsed);

  await ensureCampaignFolders(campaignPath);
  const campaignWithSceneMapIds = await hydrateSceneMapAssetIds(campaignPath, parsed);
  const campaignWithThumbnails = await ensureMapThumbnails(campaignPath, campaignWithSceneMapIds);
  if (campaignWithThumbnails !== campaignWithSceneMapIds) {
    await writeCampaign(campaignPath, campaignWithThumbnails);
  }
  return {
    campaignPath,
    campaign: resolveAssetPaths(campaignPath, campaignWithThumbnails),
    missingAssets: await findMissingAssets(campaignPath, campaignWithThumbnails.assets)
  };
}

async function hydrateSceneMapAssetIds(campaignPath: string, campaign: Campaign): Promise<Campaign> {
  const normalizedCampaign = normalizeCampaign(campaign);
  const scenes = await Promise.all(
    normalizedCampaign.scenes.map(async (entry) => {
      if (entry.mapAssetId) {
        return entry;
      }
      try {
        const filePath = path.resolve(campaignPath, entry.file);
        assertInsideCampaign(campaignPath, filePath);
        const raw = await readFile(filePath, "utf8");
        const scene = JSON.parse(raw) as unknown;
        assertValidScene(scene);
        return scene.mapAssetId ? { ...entry, mapAssetId: scene.mapAssetId } : entry;
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
      if (asset.kind !== "map" || asset.mediaType !== "image") {
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
        const thumbnailRelativePath = await createMapThumbnail(campaignPath, sourcePath, asset.id);
        if (!thumbnailRelativePath) {
          return asset;
        }
        changed = true;
        return { ...asset, thumbnailRelativePath };
      } catch {
        return asset;
      }
    })
  );
  return changed ? { ...campaign, assets, updatedAt: new Date().toISOString() } : campaign;
}

async function writeCampaign(campaignPath: string, campaign: Campaign): Promise<void> {
  await ensureCampaignFolders(campaignPath);
  const normalizedCampaign = normalizeCampaign(campaign);
  const portable: Campaign = {
    ...normalizedCampaign,
    assets: normalizedCampaign.assets.map(({ absolutePath: _absolutePath, thumbnailAbsolutePath: _thumbnailAbsolutePath, ...asset }) => asset)
  };
  await writeFile(campaignFile(campaignPath), `${JSON.stringify(portable, null, 2)}\n`, "utf8");
}

async function findMissingAssets(campaignPath: string, assets: Asset[]): Promise<string[]> {
  const missing: string[] = [];
  for (const asset of assets) {
    const assetPath = path.resolve(campaignPath, asset.relativePath);
    try {
      assertInsideCampaign(campaignPath, assetPath);
      await stat(assetPath);
    } catch {
      missing.push(asset.relativePath);
    }
  }
  return missing;
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

function safeAssetName(originalPath: string): string {
  const parsed = path.parse(originalPath);
  const cleanBase = parsed.name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "asset";
  return `${cleanBase}-${Date.now()}-${randomUUID().slice(0, 8)}${parsed.ext.toLowerCase()}`;
}

function allowedMapExtension(filePath: string): boolean {
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm"].includes(path.extname(filePath).toLowerCase());
}

function mapMediaType(filePath: string): Asset["mediaType"] {
  return [".mp4", ".webm"].includes(path.extname(filePath).toLowerCase()) ? "video" : "image";
}

async function createMapThumbnail(campaignPath: string, sourcePath: string, assetId: string): Promise<string | undefined> {
  if (mapMediaType(sourcePath) !== "image") {
    return undefined;
  }

  const image = nativeImage.createFromPath(sourcePath);
  const sourceSize = image.getSize();
  if (image.isEmpty() || sourceSize.width <= 0 || sourceSize.height <= 0) {
    return undefined;
  }

  const maxWidth = 180;
  const maxHeight = 112;
  const scale = Math.min(maxWidth / sourceSize.width, maxHeight / sourceSize.height, 1);
  const thumbnail = image.resize({
    width: Math.max(1, Math.round(sourceSize.width * scale)),
    height: Math.max(1, Math.round(sourceSize.height * scale)),
    quality: "best"
  });
  const relativePath = path.join("assets", "thumbnails", `${assetId}.jpg`).replaceAll(path.sep, "/");
  const destination = path.resolve(campaignPath, relativePath);
  assertInsideCampaign(campaignPath, destination);
  await writeFile(destination, thumbnail.toJPEG(78));
  return relativePath;
}

app.whenReady().then(() => {
  protocol.handle("localvtt", async (request) => {
    const url = new URL(request.url);
    if (url.hostname !== "asset") {
      return new Response("Unknown LocalVTT resource.", { status: 404 });
    }

    const filePath = path.resolve(decodeURIComponent(url.pathname.slice(1)));
    if (!isInsideOpenedCampaign(filePath) || !isKnownAssetPath(filePath)) {
      return new Response("LocalVTT asset is not registered for an opened campaign.", { status: 403 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });

  gmWindow = createGmWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      gmWindow = createGmWindow();
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
    if (forceCloseGmWindow || !gmHasUnsavedChanges) {
      return;
    }

    event.preventDefault();
    const choice = dialog.showMessageBoxSync(win, {
      type: "warning",
      title: "Unsaved Local VTT changes",
      message: "You have unsaved scene or campaign changes.",
      detail: "Close without saving? Unsaved changes will not be saved.",
      buttons: ["Cancel", "Save", "Close Without Saving"],
      defaultId: 0,
      cancelId: 0,
      noLink: true
    });

    if (choice === 1) {
      win.webContents.send("app:saveBeforeClose");
    } else if (choice === 2) {
      forceCloseGmWindow = true;
      gmHasUnsavedChanges = false;
      win.close();
    }
  });
  win.on("closed", () => {
    closePlayerWindow();
    gmWindow = null;
    forceCloseGmWindow = false;
  });
  return win;
}

ipcMain.handle("campaign:create", async () => {
  const campaignPath = await chooseDirectory("Choose a folder for the new Local VTT campaign", true);
  if (!campaignPath) {
    return null;
  }

  const campaign = createDefaultCampaign(path.basename(campaignPath) || "Local VTT Campaign");
  registerCampaignPath(campaignPath);
  await writeCampaign(campaignPath, campaign);
  return loadCampaignFromPath(campaignPath);
});

ipcMain.handle("campaign:open", async () => {
  const campaignPath = await chooseDirectory("Open Local VTT campaign folder");
  if (!campaignPath) {
    return null;
  }

  const summary = await loadCampaignFromPath(campaignPath);
  registerCampaignPath(campaignPath);
  return summary;
});

ipcMain.handle("campaign:save", async (_event, campaignPath: string, campaign: Campaign) => {
  assertKnownCampaignPath(campaignPath);
  await writeCampaign(campaignPath, campaign);
  return loadCampaignFromPath(campaignPath);
});

ipcMain.handle("scene:create", async (_event, campaignPath: string, sceneName: string) => {
  assertKnownCampaignPath(campaignPath);
  const summary = await loadCampaignFromPath(campaignPath);
  const scene = createDefaultScene(sceneName || "Untitled Scene");
  await writeFile(sceneFile(campaignPath, scene.id), `${JSON.stringify(scene, null, 2)}\n`, "utf8");

  const campaign: Campaign = {
    ...summary.campaign,
    scenes: [...summary.campaign.scenes, { id: scene.id, name: scene.name, file: `scenes/${scene.id}.scene.json` }],
    updatedAt: new Date().toISOString()
  };
  await writeCampaign(campaignPath, campaign);
  return { campaignSummary: await loadCampaignFromPath(campaignPath), scene };
});

ipcMain.handle("scene:load", async (_event, campaignPath: string, sceneId: string) => {
  assertKnownCampaignPath(campaignPath);
  assertInsideCampaign(campaignPath, sceneFile(campaignPath, sceneId));
  const raw = await readFile(sceneFile(campaignPath, sceneId), "utf8");
  const scene = JSON.parse(raw) as unknown;
  assertValidScene(scene);
  if (scene.layers.length === 0) {
    scene.layers = DEFAULT_LAYERS.map((layer) => ({ ...layer }));
  }
  return normalizeScene(scene);
});

ipcMain.handle("scene:save", async (_event, campaignPath: string, scene: Scene) => {
  assertKnownCampaignPath(campaignPath);
  assertInsideCampaign(campaignPath, sceneFile(campaignPath, scene.id));
  const updated = normalizeScene({ ...scene, updatedAt: new Date().toISOString() });
  await writeFile(sceneFile(campaignPath, scene.id), `${JSON.stringify(updated, null, 2)}\n`, "utf8");

  const summary = await loadCampaignFromPath(campaignPath);
  const campaign: Campaign = {
    ...summary.campaign,
    scenes: summary.campaign.scenes.map((entry) => (entry.id === scene.id ? { ...entry, name: scene.name, mapAssetId: updated.mapAssetId } : entry)),
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
  const raw = await readFile(filePath, "utf8");
  const scene = JSON.parse(raw) as unknown;
  assertValidScene(scene);
  if (scene.id !== sceneId) {
    throw new Error("Invalid scene file.");
  }

  const updatedScene = normalizeScene({ ...scene, name, updatedAt: new Date().toISOString() });
  await writeFile(filePath, `${JSON.stringify(updatedScene, null, 2)}\n`, "utf8");

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

ipcMain.handle("asset:importMap", async (_event, campaignPath: string) => {
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

  const assetId = randomUUID();
  const thumbnailRelativePath = await createMapThumbnail(campaignPath, sourcePath, assetId);
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

  const currentRaw = await readFile(sceneFile(campaignPath, sceneId), "utf8");
  const currentScene = JSON.parse(currentRaw) as unknown;
  assertValidScene(currentScene);
  const updatedScene = normalizeScene(
    currentScene.mapAssetId === assetId ? { ...currentScene, mapAssetId: undefined, updatedAt: new Date().toISOString() } : currentScene
  );
  await writeFile(sceneFile(campaignPath, sceneId), `${JSON.stringify(updatedScene, null, 2)}\n`, "utf8");

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
  if (!playerWindow) {
    playerWindow = createWindow("player");
    playerWindow.on("closed", () => {
      playerWindow = null;
    });
  }
  const targetDisplay = typeof options?.displayId === "number" ? screen.getAllDisplays().find((display) => display.id === options.displayId) : null;
  if (targetDisplay) {
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

ipcMain.handle("player:sendScene", async (_event, campaign: Campaign, scene: Scene) => {
  lastPlayerProjection = projectSceneForPlayer(campaign, scene);
  if (!playerWindow || playerWindow.isDestroyed()) {
    playerWindow = createWindow("player");
  }
  sendToPlayerWhenReady(lastPlayerProjection);
  return true;
});

ipcMain.handle("player:updateSceneIfOpen", async (_event, campaign: Campaign, scene: Scene) => {
  if (!playerWindow || playerWindow.isDestroyed()) {
    return false;
  }
  lastPlayerProjection = projectSceneForPlayer(campaign, scene);
  sendToPlayerWhenReady(lastPlayerProjection);
  return true;
});

ipcMain.handle("player:setFullscreen", async (_event, fullscreen: boolean) => {
  if (!playerWindow || playerWindow.isDestroyed()) {
    playerWindow = createWindow("player");
  }
  playerWindow.setFullScreen(fullscreen);
  return playerWindow.isFullScreen();
});

ipcMain.handle("player:close", async () => {
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
  forceCloseGmWindow = true;
  gmHasUnsavedChanges = false;
  gmWindow.close();
});
