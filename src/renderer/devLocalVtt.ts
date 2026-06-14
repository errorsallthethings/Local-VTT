import type { LocalVttApi } from "../../electron/preload";
import {
  createDefaultCampaign,
  createDefaultScene,
  type Campaign,
  type CampaignSummary,
  type LiveTableEvent,
  type PlayerIdleState,
  type PlayerSceneProjection,
  type Scene,
  type SquareCropRect
} from "../shared/localvtt";

const DEV_CAMPAIGN_PATH = "dev://local-vtt/browser-campaign";

export function installDevLocalVtt() {
  const viteEnv = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env;
  if (!viteEnv?.DEV || window.localVtt) {
    return;
  }

  let campaign = createDevCampaign();
  const scenes = new Map<string, Scene>();
  let lastPlayerState: PlayerIdleState | PlayerSceneProjection = {
    type: "idle",
    variant: "hold",
    title: "Waiting for GM View",
    message: "The GM is preparing the next map."
  };
  const playerStateListeners = new Set<(state: unknown) => void>();
  const liveTableEventListeners = new Set<(event: unknown) => void>();

  const getSummary = (): CampaignSummary => ({
    campaignPath: DEV_CAMPAIGN_PATH,
    campaign,
    missingAssets: []
  });

  const upsertScene = (scene: Scene) => {
    scenes.set(scene.id, scene);
    campaign = {
      ...campaign,
      updatedAt: new Date().toISOString(),
      scenes: campaign.scenes.some((entry) => entry.id === scene.id)
        ? campaign.scenes.map((entry) => (entry.id === scene.id ? { ...entry, name: scene.name, mapAssetId: scene.mapAssetId } : entry))
        : [...campaign.scenes, { id: scene.id, name: scene.name, file: `${scene.id}.json`, mapAssetId: scene.mapAssetId }]
    };
  };

  const api: LocalVttApi = {
    createCampaign: async () => {
      campaign = createDevCampaign();
      scenes.clear();
      const scene = createDefaultScene("Dev Scene");
      upsertScene(scene);
      return getSummary();
    },
    openCampaign: async () => getSummary(),
    openRecentCampaign: async () => getSummary(),
    saveCampaign: async (_campaignPath: string, nextCampaign: Campaign) => {
      campaign = nextCampaign;
      return getSummary();
    },
    openBackupsFolder: async () => false,
    createScene: async (_campaignPath: string, sceneName: string) => {
      const scene = createDefaultScene(sceneName || "Dev Scene");
      upsertScene(scene);
      return { campaignSummary: getSummary(), scene };
    },
    duplicateScene: async (_campaignPath: string, sourceScene: Scene, sceneName: string) => {
      const scene = { ...structuredClone(sourceScene), id: crypto.randomUUID(), name: sceneName, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      upsertScene(scene);
      return { campaignSummary: getSummary(), scene };
    },
    loadScene: async (_campaignPath: string, sceneId: string) => {
      const scene = scenes.get(sceneId) ?? createDefaultScene("Dev Scene");
      upsertScene(scene);
      return scene;
    },
    saveScene: async (_campaignPath: string, scene: Scene) => {
      upsertScene(scene);
      return { campaignSummary: getSummary(), scene };
    },
    renameScene: async (_campaignPath: string, sceneId: string, sceneName: string) => {
      const scene = { ...(scenes.get(sceneId) ?? createDefaultScene(sceneName)), id: sceneId, name: sceneName, updatedAt: new Date().toISOString() };
      upsertScene(scene);
      return { campaignSummary: getSummary(), scene };
    },
    deleteScene: async (_campaignPath: string, sceneId: string) => {
      scenes.delete(sceneId);
      campaign = { ...campaign, scenes: campaign.scenes.filter((scene) => scene.id !== sceneId), updatedAt: new Date().toISOString() };
      return getSummary();
    },
    importMap: async () => null,
    importToken: async () => null,
    updateTokenThumbnail: async (_campaignPath: string, assetId: string, _crop: SquareCropRect) => {
      const asset = campaign.assets.find((candidate) => candidate.id === assetId);
      if (!asset) {
        throw new Error("Dev asset not found.");
      }
      return { campaignSummary: getSummary(), asset };
    },
    discardTokenImport: async () => getSummary(),
    getTokenAssetUsage: async () => [],
    deleteTokenAsset: async (_campaignPath: string, assetId: string) => {
      campaign = { ...campaign, assets: campaign.assets.filter((asset) => asset.id !== assetId), updatedAt: new Date().toISOString() };
      return { campaignSummary: getSummary(), scenes: Array.from(scenes.values()) };
    },
    deleteMapAsset: async (_campaignPath: string, sceneId: string) => {
      const scene = scenes.get(sceneId) ?? createDefaultScene("Dev Scene");
      const nextScene = { ...scene, mapAssetId: undefined, updatedAt: new Date().toISOString() };
      upsertScene(nextScene);
      return { campaignSummary: getSummary(), scene: nextScene };
    },
    openPlayerView: async () => ({ ok: true, displayFound: true }),
    sendSceneToPlayer: async (projection: PlayerSceneProjection) => {
      lastPlayerState = projection;
      playerStateListeners.forEach((listener) => listener(projection));
      return true;
    },
    updatePlayerSceneIfOpen: async (projection: PlayerSceneProjection) => {
      lastPlayerState = projection;
      playerStateListeners.forEach((listener) => listener(projection));
      return true;
    },
    showPlayerIdle: async (title: string, message: string, variant: PlayerIdleState["variant"] = "hold") => {
      const idleState: PlayerIdleState = { type: "idle", variant, title, message };
      lastPlayerState = idleState;
      playerStateListeners.forEach((listener) => listener(idleState));
      return true;
    },
    sendLiveTableEvent: async (event: LiveTableEvent) => {
      liveTableEventListeners.forEach((listener) => listener(event));
      return true;
    },
    setPlayerFullscreen: async () => true,
    closePlayerView: async () => true,
    getLastPlayerState: async () => lastPlayerState,
    getDisplays: async () => [
      {
        id: 1,
        label: "Browser Preview",
        bounds: { x: 0, y: 0, width: window.screen.width, height: window.screen.height },
        workArea: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
        nativeResolution: { width: window.screen.width, height: window.screen.height },
        scaleFactor: window.devicePixelRatio || 1,
        rotation: 0
      }
    ],
    setUnsavedChanges: () => undefined,
    closeAfterSave: () => undefined,
    onSaveBeforeClose: () => () => undefined,
    onPlayerState: (callback: (state: unknown) => void) => {
      playerStateListeners.add(callback);
      return () => playerStateListeners.delete(callback);
    },
    onLiveTableEvent: (callback: (event: unknown) => void) => {
      liveTableEventListeners.add(callback);
      return () => liveTableEventListeners.delete(callback);
    },
    toAssetUrl: (absolutePath: string) => {
      if (/^(blob|data|https?):/i.test(absolutePath)) {
        return absolutePath;
      }
      return `file:///${absolutePath.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1:")}`;
    }
  };

  window.localVtt = api;
}

function createDevCampaign(): Campaign {
  return {
    ...createDefaultCampaign("Dev Browser Campaign"),
    id: "dev-browser-campaign",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
