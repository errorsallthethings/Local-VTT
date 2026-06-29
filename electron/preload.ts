import { contextBridge, ipcRenderer } from "electron";
import type {
  Asset,
  Campaign,
  CampaignSummary,
  LiveTableEvent,
  MetadataBackupEntry,
  MetadataBackupPreview,
  MetadataBackupRef,
  MetadataBackupRestoreResult,
  PlayerIdleState,
  PlayerSceneProjection,
  Scene,
  SquareCropRect,
  ThumbnailRegenerationProgress,
  ThumbnailRegenerationResult
} from "../src/shared/localvtt.js";

const api = {
  createCampaign: () => ipcRenderer.invoke("campaign:create") as Promise<CampaignSummary | null>,
  openCampaign: () => ipcRenderer.invoke("campaign:open") as Promise<CampaignSummary | null>,
  openRecentCampaign: (campaignPath: string) => ipcRenderer.invoke("campaign:openRecent", campaignPath) as Promise<CampaignSummary>,
  saveCampaign: (campaignPath: string, campaign: Campaign) =>
    ipcRenderer.invoke("campaign:save", campaignPath, campaign) as Promise<CampaignSummary>,
  openBackupsFolder: (campaignPath: string) => ipcRenderer.invoke("campaign:openBackupsFolder", campaignPath) as Promise<boolean>,
  listMetadataBackups: (campaignPath: string) => ipcRenderer.invoke("campaign:listMetadataBackups", campaignPath) as Promise<MetadataBackupEntry[]>,
  previewMetadataBackup: (campaignPath: string, ref: MetadataBackupRef) =>
    ipcRenderer.invoke("campaign:previewMetadataBackup", campaignPath, ref) as Promise<MetadataBackupPreview>,
  restoreMetadataBackup: (campaignPath: string, ref: MetadataBackupRef) =>
    ipcRenderer.invoke("campaign:restoreMetadataBackup", campaignPath, ref) as Promise<MetadataBackupRestoreResult>,
  createScene: (campaignPath: string, sceneName: string) =>
    ipcRenderer.invoke("scene:create", campaignPath, sceneName) as Promise<{ campaignSummary: CampaignSummary; scene: Scene }>,
  duplicateScene: (campaignPath: string, sourceScene: Scene, sceneName: string, afterSceneId: string, folderId?: string) =>
    ipcRenderer.invoke("scene:duplicate", campaignPath, sourceScene, sceneName, afterSceneId, folderId) as Promise<{ campaignSummary: CampaignSummary; scene: Scene }>,
  loadScene: (campaignPath: string, sceneId: string) =>
    ipcRenderer.invoke("scene:load", campaignPath, sceneId) as Promise<Scene>,
  saveScene: (campaignPath: string, scene: Scene) =>
    ipcRenderer.invoke("scene:save", campaignPath, scene) as Promise<{ campaignSummary: CampaignSummary; scene: Scene }>,
  renameScene: (campaignPath: string, sceneId: string, sceneName: string) =>
    ipcRenderer.invoke("scene:rename", campaignPath, sceneId, sceneName) as Promise<{ campaignSummary: CampaignSummary; scene: Scene }>,
  deleteScene: (campaignPath: string, sceneId: string) =>
    ipcRenderer.invoke("scene:delete", campaignPath, sceneId) as Promise<CampaignSummary>,
  importMap: (campaignPath: string) =>
    ipcRenderer.invoke("asset:importMap", campaignPath) as Promise<{ campaignSummary: CampaignSummary; asset: Asset } | null>,
  previewMapReplacement: (campaignPath: string, sceneId: string, currentAssetId: string) =>
    ipcRenderer.invoke("asset:previewMapReplacement", campaignPath, sceneId, currentAssetId) as Promise<{
      sourcePath: string;
      sourceName: string;
      currentAssetName: string;
      currentDimensions?: { width: number; height: number };
      nextDimensions?: { width: number; height: number };
      warning?: string;
    } | null>,
  replaceMap: (campaignPath: string, sceneId: string, currentAssetId: string, sourcePath: string) =>
    ipcRenderer.invoke("asset:replaceMap", campaignPath, sceneId, currentAssetId, sourcePath) as Promise<{ campaignSummary: CampaignSummary; scene: Scene; asset: Asset }>,
  importToken: (campaignPath: string) =>
    ipcRenderer.invoke("asset:importToken", campaignPath) as Promise<{ campaignSummary: CampaignSummary; asset: Asset } | null>,
  updateTokenThumbnail: (campaignPath: string, assetId: string, crop: SquareCropRect) =>
    ipcRenderer.invoke("asset:updateTokenThumbnail", campaignPath, assetId, crop) as Promise<{ campaignSummary: CampaignSummary; asset: Asset }>,
  regenerateThumbnails: (campaignPath: string) =>
    ipcRenderer.invoke("asset:regenerateThumbnails", campaignPath) as Promise<ThumbnailRegenerationResult>,
  onThumbnailRegenerationProgress: (callback: (progress: ThumbnailRegenerationProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ThumbnailRegenerationProgress) => callback(progress);
    ipcRenderer.on("asset:thumbnailRegenerationProgress", listener);
    return () => {
      ipcRenderer.removeListener("asset:thumbnailRegenerationProgress", listener);
    };
  },
  discardTokenImport: (campaignPath: string, assetId: string) =>
    ipcRenderer.invoke("asset:discardTokenImport", campaignPath, assetId) as Promise<CampaignSummary>,
  getTokenAssetUsage: (campaignPath: string, assetId: string) =>
    ipcRenderer.invoke("asset:getTokenUsage", campaignPath, assetId) as Promise<Array<{ sceneId: string; sceneName: string; count: number }>>,
  deleteTokenAsset: (campaignPath: string, assetId: string) =>
    ipcRenderer.invoke("asset:deleteToken", campaignPath, assetId) as Promise<{ campaignSummary: CampaignSummary; scenes: Scene[] }>,
  deleteMapAsset: (campaignPath: string, sceneId: string, assetId: string) =>
    ipcRenderer.invoke("asset:deleteMap", campaignPath, sceneId, assetId) as Promise<{ campaignSummary: CampaignSummary; scene: Scene }>,
  openPlayerView: (options?: { displayId?: number; fullscreen?: boolean }) =>
    ipcRenderer.invoke("player:open", options) as Promise<{ ok: boolean; displayFound: boolean }>,
  sendSceneToPlayer: (projection: PlayerSceneProjection) =>
    ipcRenderer.invoke("player:sendScene", projection) as Promise<boolean>,
  updatePlayerSceneIfOpen: (projection: PlayerSceneProjection) =>
    ipcRenderer.invoke("player:updateSceneIfOpen", projection) as Promise<boolean>,
  showPlayerIdle: (title: string, message: string, variant: PlayerIdleState["variant"] = "hold") =>
    ipcRenderer.invoke("player:showIdle", { type: "idle", variant, title, message }) as Promise<boolean>,
  sendLiveTableEvent: (event: LiveTableEvent) =>
    ipcRenderer.invoke("player:liveTableEvent", event) as Promise<boolean>,
  setPlayerFullscreen: (fullscreen: boolean) =>
    ipcRenderer.invoke("player:setFullscreen", fullscreen) as Promise<boolean>,
  closePlayerView: () => ipcRenderer.invoke("player:close") as Promise<boolean>,
  getLastPlayerState: () => ipcRenderer.invoke("player:getLastState") as Promise<unknown>,
  getDisplays: () => ipcRenderer.invoke("app:getDisplays") as Promise<
    Array<{
      id: number;
      label: string;
      bounds: { x: number; y: number; width: number; height: number };
      workArea: { x: number; y: number; width: number; height: number };
      nativeResolution: { width: number; height: number };
      scaleFactor: number;
      rotation: number;
    }>
  >,
  setUnsavedChanges: (hasUnsavedChanges: boolean) => {
    ipcRenderer.send("app:setUnsavedChanges", hasUnsavedChanges);
  },
  closeAfterSave: () => {
    ipcRenderer.send("app:closeAfterSave");
  },
  onSaveBeforeClose: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("app:saveBeforeClose", listener);
    return () => {
      ipcRenderer.removeListener("app:saveBeforeClose", listener);
    };
  },
  onPlayerState: (callback: (state: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: unknown) => callback(state);
    ipcRenderer.on("player:state", listener);
    return () => {
      ipcRenderer.removeListener("player:state", listener);
    };
  },
  onLiveTableEvent: (callback: (event: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, tableEvent: unknown) => callback(tableEvent);
    ipcRenderer.on("player:liveTableEvent", listener);
    return () => {
      ipcRenderer.removeListener("player:liveTableEvent", listener);
    };
  },
  toAssetUrl: (absolutePath: string) => `localvtt://asset/${encodeURIComponent(absolutePath)}`
};

contextBridge.exposeInMainWorld("localVtt", api);

export type LocalVttApi = typeof api;
