import { contextBridge, ipcRenderer } from "electron";
import type { Asset, Campaign, CampaignSummary, Scene } from "../src/shared/localvtt.js";

const api = {
  createCampaign: () => ipcRenderer.invoke("campaign:create") as Promise<CampaignSummary | null>,
  openCampaign: () => ipcRenderer.invoke("campaign:open") as Promise<CampaignSummary | null>,
  saveCampaign: (campaignPath: string, campaign: Campaign) =>
    ipcRenderer.invoke("campaign:save", campaignPath, campaign) as Promise<CampaignSummary>,
  createScene: (campaignPath: string, sceneName: string) =>
    ipcRenderer.invoke("scene:create", campaignPath, sceneName) as Promise<{ campaignSummary: CampaignSummary; scene: Scene }>,
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
  deleteMapAsset: (campaignPath: string, sceneId: string, assetId: string) =>
    ipcRenderer.invoke("asset:deleteMap", campaignPath, sceneId, assetId) as Promise<{ campaignSummary: CampaignSummary; scene: Scene }>,
  openPlayerView: (options?: { displayId?: number; fullscreen?: boolean }) =>
    ipcRenderer.invoke("player:open", options) as Promise<{ ok: boolean; displayFound: boolean }>,
  sendSceneToPlayer: (campaign: Campaign, scene: Scene) =>
    ipcRenderer.invoke("player:sendScene", campaign, scene) as Promise<boolean>,
  updatePlayerSceneIfOpen: (campaign: Campaign, scene: Scene) =>
    ipcRenderer.invoke("player:updateSceneIfOpen", campaign, scene) as Promise<boolean>,
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
  toAssetUrl: (absolutePath: string) => `localvtt://asset/${encodeURIComponent(absolutePath)}`
};

contextBridge.exposeInMainWorld("localVtt", api);

export type LocalVttApi = typeof api;
