import type { LocalVttApi } from "../../electron/preload";
import {
  createDefaultCampaign,
  createDefaultScene,
  type Asset,
  type Campaign,
  type CampaignSummary,
  type LiveTableEvent,
  type MetadataBackupEntry,
  type MetadataBackupPreview,
  type MetadataBackupRef,
  type MetadataBackupRestoreResult,
  type PlayerIdleState,
  type PlayerSceneProjection,
  type Scene,
  type SquareCropRect,
  type ThumbnailRegenerationProgress,
  type ThumbnailRegenerationResult
} from "../shared/localvtt";

const DEV_CAMPAIGN_PATH = "dev://local-vtt/browser-campaign";
const DEV_MAP_DATA_URL = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="5000" height="1600" viewBox="0 0 5000 1600">
  <rect width="5000" height="1600" fill="#151922"/>
  <rect x="0" y="0" width="5000" height="1600" fill="none" stroke="#f5c542" stroke-width="12"/>
  <path d="M0 800H5000M2500 0V1600" stroke="#7aa2f7" stroke-width="8"/>
  <circle cx="800" cy="520" r="180" fill="#9ece6a"/>
  <rect x="3400" y="320" width="900" height="520" rx="48" fill="#f7768e"/>
  <text x="160" y="220" fill="#dfe6ef" font-family="Arial, sans-serif" font-size="96" font-weight="700">Dev Map 5000 x 1600</text>
</svg>`)}`;

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
  const thumbnailProgressListeners = new Set<(progress: ThumbnailRegenerationProgress) => void>();
  const devBackup: MetadataBackupEntry = {
    id: "campaign::dev-backup.campaign.json",
    kind: "campaign",
    fileName: "dev-backup.campaign.json",
    timestamp: new Date().toISOString(),
    label: "Campaign metadata",
    sizeBytes: 0
  };

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
    listMetadataBackups: async () => [devBackup],
    previewMetadataBackup: async (_campaignPath: string, ref: MetadataBackupRef): Promise<MetadataBackupPreview> => ({
      ...devBackup,
      ...ref,
      summary: `${campaign.name} - ${campaign.scenes.length} scenes, ${campaign.assets.length} assets`,
      json: JSON.stringify(campaign, null, 2)
    }),
    restoreMetadataBackup: async (): Promise<MetadataBackupRestoreResult> => ({
      campaignSummary: getSummary(),
      restored: devBackup
    }),
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
    importMap: async () => {
      const now = new Date().toISOString();
      const asset: Asset = {
        id: crypto.randomUUID(),
        name: "Dev Map 5000 x 1600",
        kind: "map",
        mediaType: "image",
        relativePath: "dev/maps/dev-map-5000x1600.svg",
        thumbnailRelativePath: "dev/maps/dev-map-5000x1600.svg",
        originalFileName: "dev-map-5000x1600.svg",
        createdAt: now,
        absolutePath: DEV_MAP_DATA_URL,
        thumbnailAbsolutePath: DEV_MAP_DATA_URL
      };
      campaign = {
        ...campaign,
        assets: [...campaign.assets, asset],
        updatedAt: now
      };
      return { campaignSummary: getSummary(), asset };
    },
    previewMapReplacement: async () => null,
    replaceMap: async () => {
      throw new Error("Map replacement is unavailable in the dev fallback.");
    },
    importToken: async () => null,
    updateTokenThumbnail: async (_campaignPath: string, assetId: string, _crop: SquareCropRect) => {
      const asset = campaign.assets.find((candidate) => candidate.id === assetId);
      if (!asset) {
        throw new Error("Dev asset not found.");
      }
      return { campaignSummary: getSummary(), asset };
    },
    regenerateThumbnails: async (): Promise<ThumbnailRegenerationResult> => {
      const eligibleAssets = campaign.assets.filter((asset) => asset.kind === "map" || asset.kind === "token");
      thumbnailProgressListeners.forEach((listener) =>
        listener({ current: 0, total: eligibleAssets.length, assetName: null, message: "Preparing thumbnail regeneration." })
      );
      eligibleAssets.forEach((asset, index) => {
        thumbnailProgressListeners.forEach((listener) =>
          listener({ current: index + 1, total: eligibleAssets.length, assetName: asset.name, message: `Processed ${asset.name}.` })
        );
      });
      return {
        campaignSummary: getSummary(),
        regenerated: eligibleAssets.length,
        skipped: campaign.assets.filter((asset) => asset.kind !== "map" && asset.kind !== "token").length,
        failed: []
      };
    },
    onThumbnailRegenerationProgress: (callback: (progress: ThumbnailRegenerationProgress) => void) => {
      thumbnailProgressListeners.add(callback);
      return () => thumbnailProgressListeners.delete(callback);
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
    showPlayerTestPattern: async (state: PlayerIdleState) => {
      lastPlayerState = state;
      playerStateListeners.forEach((listener) => listener(state));
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
