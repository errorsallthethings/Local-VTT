import { useMemo } from "react";
import type { Asset, Campaign, CampaignSceneEntry, Scene } from "../../shared/localvtt";
import { buildAssetsById, buildAssetsByKind, buildSceneThumbnailAssets } from "../lib/assets";

const EMPTY_ASSETS: Asset[] = [];
const EMPTY_SCENE_ENTRIES: CampaignSceneEntry[] = [];

export interface GmCampaignAssetModel {
  activeMapIsVideo: boolean;
  assetsById: Map<string, Asset>;
  campaignAssets: Asset[];
  campaignScenes: CampaignSceneEntry[];
  mapAsset: Asset | null;
  sceneThumbnailAssets: Map<string, Asset | null>;
  tokenAssets: Map<string, Asset>;
  tokenLibraryAssets: Asset[];
}

export function getGmCampaignAssetModel(
  campaign: Campaign | null,
  activeScene: Scene | null,
  sceneDrafts: Record<string, Scene>
): GmCampaignAssetModel {
  const campaignAssets = campaign?.assets ?? EMPTY_ASSETS;
  const campaignScenes = campaign?.scenes ?? EMPTY_SCENE_ENTRIES;
  const assetsById = buildAssetsById(campaignAssets);
  const mapAsset = activeScene?.mapAssetId ? (assetsById.get(activeScene.mapAssetId) ?? null) : null;
  const tokenAssets = buildAssetsByKind(campaignAssets, "token");

  return {
    activeMapIsVideo: mapAsset?.mediaType === "video",
    assetsById,
    campaignAssets,
    campaignScenes,
    mapAsset,
    sceneThumbnailAssets: buildSceneThumbnailAssets(campaignScenes, sceneDrafts, activeScene, assetsById),
    tokenAssets,
    tokenLibraryAssets: [...tokenAssets.values()]
  };
}

export function useGmCampaignAssets(
  campaign: Campaign | null,
  activeScene: Scene | null,
  sceneDrafts: Record<string, Scene>
): GmCampaignAssetModel {
  return useMemo(
    () => getGmCampaignAssetModel(campaign, activeScene, sceneDrafts),
    [activeScene, campaign, sceneDrafts]
  );
}
