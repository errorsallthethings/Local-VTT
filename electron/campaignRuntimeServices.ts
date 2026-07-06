import type { Campaign, CampaignSummary, Scene } from "../src/shared/localvtt.js";
import type { CampaignSessionRegistry } from "./campaignSessionRegistry.js";
import { resolveCurrentCampaignPath } from "./campaignOpenState.js";
import type { MapThumbnailResult } from "./mapThumbnailRepair.js";

export interface CampaignRuntimeServices {
  assertKnownCampaignPath: (campaignPath: string) => void;
  isInsideOpenedCampaign: (candidatePath: string) => boolean;
  isKnownAssetPath: (candidatePath: string) => boolean;
  isTemporaryExternalAssetPath: (candidatePath: string) => boolean;
  loadCampaignFromPath: (campaignPath: string) => Promise<CampaignSummary>;
  loadCampaignWithPausedTurnOrders: (campaignPath: string) => Promise<CampaignSummary>;
  pauseActiveTurnOrders: (campaignPath: string) => Promise<void>;
  registerAssetPath: (destination: string) => void;
  registerAssetPaths: (campaign: Campaign) => void;
  registerCampaignPath: (campaignPath: string) => void;
  registerTemporaryExternalAssetPath: (sourcePath: string) => void;
  unregisterTemporaryExternalAssetPath: (sourcePath: string) => void;
}

export interface CreateCampaignRuntimeServicesOptions {
  campaignSessions: CampaignSessionRegistry;
  createMapThumbnail: (campaignPath: string, sourcePath: string, assetId: string) => Promise<MapThumbnailResult>;
  ensureCampaignFolders: (campaignPath: string) => Promise<void>;
  ensureMapThumbnails: (
    campaignPath: string,
    campaign: Campaign,
    createThumbnail: (campaignPath: string, sourcePath: string, assetId: string) => Promise<MapThumbnailResult>
  ) => Promise<Campaign>;
  hydrateCampaignAssetPaths: (campaignPath: string, campaign: Campaign) => Campaign;
  hydrateSceneSummaries: (campaignPath: string, campaign: Campaign) => Promise<Campaign>;
  inspectCampaignHealth: (campaignPath: string, campaign: Campaign) => Promise<CampaignSummary["health"]>;
  pauseCampaignTurnOrders: (
    campaign: Campaign,
    readScene: (sceneId: string) => Promise<Scene>,
    writeScene: (scene: Scene) => Promise<void>
  ) => Promise<unknown>;
  readCampaignMetadata: (campaignPath: string) => Promise<Campaign>;
  readSceneMetadata: (campaignPath: string, sceneId: string) => Promise<Scene>;
  setCurrentCampaignPath: (campaignPath: string | null) => void;
  writeCampaign: (campaignPath: string, campaign: Campaign) => Promise<void>;
  writeScene: (campaignPath: string, scene: Scene) => Promise<void>;
}

export function createCampaignRuntimeServices({
  campaignSessions,
  createMapThumbnail,
  ensureCampaignFolders,
  ensureMapThumbnails,
  hydrateCampaignAssetPaths,
  hydrateSceneSummaries,
  inspectCampaignHealth,
  pauseCampaignTurnOrders,
  readCampaignMetadata,
  readSceneMetadata,
  setCurrentCampaignPath,
  writeCampaign,
  writeScene
}: CreateCampaignRuntimeServicesOptions): CampaignRuntimeServices {
  const registerCampaignPath = (campaignPath: string): void => {
    campaignSessions.registerCampaignPath(campaignPath);
  };

  const registerAssetPaths = (campaign: Campaign): void => {
    campaignSessions.registerAssetPaths(campaign);
  };

  const loadCampaignFromPath = async (campaignPath: string): Promise<CampaignSummary> => {
    const parsed = await readCampaignMetadata(campaignPath);
    await ensureCampaignFolders(campaignPath);
    const campaignWithSceneSummaries = await hydrateSceneSummaries(campaignPath, parsed);
    const campaignWithThumbnails = await ensureMapThumbnails(campaignPath, campaignWithSceneSummaries, createMapThumbnail);
    if (campaignWithThumbnails !== campaignWithSceneSummaries) {
      await writeCampaign(campaignPath, campaignWithThumbnails);
    }
    const health = await inspectCampaignHealth(campaignPath, campaignWithThumbnails);
    const resolvedCampaign = hydrateCampaignAssetPaths(campaignPath, campaignWithThumbnails);
    registerAssetPaths(resolvedCampaign);
    return {
      campaignPath,
      campaign: resolvedCampaign,
      missingAssets: health.missingAssetFiles.map((asset) => asset.relativePath),
      health
    };
  };

  const assertKnownCampaignPath = (campaignPath: string): void => {
    campaignSessions.assertKnownCampaignPath(campaignPath);
  };

  const pauseActiveTurnOrders = async (campaignPath: string): Promise<void> => {
    assertKnownCampaignPath(campaignPath);
    const summary = await loadCampaignFromPath(campaignPath);
    await pauseCampaignTurnOrders(
      summary.campaign,
      (sceneId) => readSceneMetadata(campaignPath, sceneId),
      (scene) => writeScene(campaignPath, scene)
    );
  };

  const loadCampaignWithPausedTurnOrders = async (campaignPath: string): Promise<CampaignSummary> => {
    registerCampaignPath(campaignPath);
    setCurrentCampaignPath(resolveCurrentCampaignPath(campaignPath));
    await pauseActiveTurnOrders(campaignPath);
    return loadCampaignFromPath(campaignPath);
  };

  return {
    assertKnownCampaignPath,
    isInsideOpenedCampaign: (candidatePath) => campaignSessions.isInsideOpenedCampaign(candidatePath),
    isKnownAssetPath: (candidatePath) => campaignSessions.isKnownAssetPath(candidatePath),
    isTemporaryExternalAssetPath: (candidatePath) => campaignSessions.isTemporaryExternalAssetPath(candidatePath),
    loadCampaignFromPath,
    loadCampaignWithPausedTurnOrders,
    pauseActiveTurnOrders,
    registerAssetPath: (destination) => campaignSessions.registerAssetPath(destination),
    registerAssetPaths,
    registerCampaignPath,
    registerTemporaryExternalAssetPath: (sourcePath) => campaignSessions.registerTemporaryExternalAssetPath(sourcePath),
    unregisterTemporaryExternalAssetPath: (sourcePath) => campaignSessions.unregisterTemporaryExternalAssetPath(sourcePath)
  };
}
