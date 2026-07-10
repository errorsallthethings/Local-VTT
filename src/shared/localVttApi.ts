import type {
  Asset,
  AssetPruneResult,
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
  ThumbnailRegenerationResult,
  TokenAssetPromotionResult
} from "./localvtt.js";

export interface MapReplacementPreview {
  replacementId: string;
  sourceName: string;
  currentAssetName: string;
  currentDimensions?: { width: number; height: number };
  nextDimensions?: { width: number; height: number };
  warning?: string;
}

export interface PlayerViewOpenOptions {
  displayId?: number;
  fullscreen?: boolean;
}

export interface PlayerViewOpenResult {
  ok: boolean;
  displayFound: boolean;
}

export interface PlayerDisplaySummary {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  nativeResolution: { width: number; height: number };
  scaleFactor: number;
  rotation: number;
}

export interface LocalVttApi {
  isVisualSmokeTest: boolean;
  createCampaign: () => Promise<CampaignSummary | null>;
  openCampaign: () => Promise<CampaignSummary | null>;
  openRecentCampaign: (campaignPath: string) => Promise<CampaignSummary>;
  saveCampaign: (campaignPath: string, campaign: Campaign) => Promise<CampaignSummary>;
  refreshCampaign: (campaignPath: string) => Promise<CampaignSummary>;
  openBackupsFolder: (campaignPath: string) => Promise<boolean>;
  listMetadataBackups: (campaignPath: string) => Promise<MetadataBackupEntry[]>;
  previewMetadataBackup: (campaignPath: string, ref: MetadataBackupRef) => Promise<MetadataBackupPreview>;
  restoreMetadataBackup: (campaignPath: string, ref: MetadataBackupRef) => Promise<MetadataBackupRestoreResult>;
  createScene: (campaignPath: string, sceneName: string) => Promise<{ campaignSummary: CampaignSummary; scene: Scene }>;
  duplicateScene: (
    campaignPath: string,
    sourceScene: Scene,
    sceneName: string,
    afterSceneId: string,
    folderId?: string
  ) => Promise<{ campaignSummary: CampaignSummary; scene: Scene }>;
  loadScene: (campaignPath: string, sceneId: string) => Promise<Scene>;
  saveScene: (campaignPath: string, scene: Scene) => Promise<{ campaignSummary: CampaignSummary; scene: Scene }>;
  renameScene: (campaignPath: string, sceneId: string, sceneName: string) => Promise<{ campaignSummary: CampaignSummary; scene: Scene }>;
  deleteScene: (campaignPath: string, sceneId: string) => Promise<CampaignSummary>;
  importMap: (campaignPath: string) => Promise<{ campaignSummary: CampaignSummary; asset: Asset } | null>;
  previewMapReplacement: (campaignPath: string, sceneId: string, currentAssetId: string) => Promise<MapReplacementPreview | null>;
  replaceMap: (campaignPath: string, sceneId: string, currentAssetId: string, replacementId: string) => Promise<{ campaignSummary: CampaignSummary; scene: Scene; asset: Asset }>;
  previewMapVariant: (campaignPath: string, sceneId: string, currentAssetId: string) => Promise<MapReplacementPreview | null>;
  addMapVariant: (campaignPath: string, sceneId: string, currentAssetId: string, replacementId: string) => Promise<{ campaignSummary: CampaignSummary; scene: Scene; asset: Asset }>;
  importToken: (campaignPath: string) => Promise<{ campaignSummary: CampaignSummary; asset: Asset } | null>;
  updateTokenThumbnail: (campaignPath: string, assetId: string, crop: SquareCropRect) => Promise<{ campaignSummary: CampaignSummary; asset: Asset }>;
  regenerateThumbnails: (campaignPath: string) => Promise<ThumbnailRegenerationResult>;
  promoteTokenAssets: (campaignPath: string) => Promise<TokenAssetPromotionResult>;
  pruneUnreferencedAssets: (campaignPath: string) => Promise<AssetPruneResult>;
  onThumbnailRegenerationProgress: (callback: (progress: ThumbnailRegenerationProgress) => void) => () => void;
  discardTokenImport: (campaignPath: string, assetId: string) => Promise<CampaignSummary>;
  getTokenAssetUsage: (campaignPath: string, assetId: string) => Promise<Array<{ sceneId: string; sceneName: string; count: number }>>;
  deleteTokenAsset: (campaignPath: string, assetId: string) => Promise<{ campaignSummary: CampaignSummary; scenes: Scene[] }>;
  deleteMapAsset: (campaignPath: string, sceneId: string, assetId: string) => Promise<{ campaignSummary: CampaignSummary; scene: Scene }>;
  openPlayerView: (options?: PlayerViewOpenOptions) => Promise<PlayerViewOpenResult>;
  sendSceneToPlayer: (projection: PlayerSceneProjection) => Promise<boolean>;
  updatePlayerSceneIfOpen: (projection: PlayerSceneProjection) => Promise<boolean>;
  showPlayerIdle: (title: string, message: string, variant?: PlayerIdleState["variant"]) => Promise<boolean>;
  showPlayerTestPattern: (state: PlayerIdleState) => Promise<boolean>;
  sendLiveTableEvent: (event: LiveTableEvent) => Promise<boolean>;
  setPlayerFullscreen: (fullscreen: boolean) => Promise<boolean>;
  closePlayerView: () => Promise<boolean>;
  getLastPlayerState: () => Promise<unknown>;
  getDisplays: () => Promise<PlayerDisplaySummary[]>;
  setUnsavedChanges: (hasUnsavedChanges: boolean) => void;
  closeAfterSave: () => void;
  onSaveBeforeClose: (callback: () => void) => () => void;
  onPlayerState: (callback: (state: unknown) => void) => () => void;
  onLiveTableEvent: (callback: (event: unknown) => void) => () => void;
  toAssetUrl: (absolutePath: string) => string;
}
