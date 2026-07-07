import { useMemo } from "react";
import type { Asset, Campaign, Scene } from "../../../../shared/localvtt";
import { getTokenAssetIds, getTokenImageAssets, getTokenImageSourceKey } from "../../../canvas/tokens";

export interface SceneCanvasAssetModel {
  assetUrl: string | null;
  mapAsset: Asset | null;
  tokenAssetIds: string;
  tokenAssets: Asset[];
  tokenImageSourceKey: string;
}

export function getSceneCanvasAssetModel(
  campaign: Campaign | null,
  scene: Scene | null,
  toAssetUrl: (absolutePath: string) => string
): SceneCanvasAssetModel {
  const campaignAssets = campaign?.assets;
  const mapAsset = campaign && scene?.mapAssetId
    ? campaign.assets.find((asset) => asset.id === scene.mapAssetId) ?? null
    : null;
  const assetUrl = mapAsset?.absolutePath ? toAssetUrl(mapAsset.absolutePath) : null;
  const tokenAssetIds = getTokenAssetIds(scene?.tokens);
  const tokenAssets = getTokenImageAssets(campaignAssets, tokenAssetIds);

  return {
    assetUrl,
    mapAsset,
    tokenAssetIds,
    tokenAssets,
    tokenImageSourceKey: getTokenImageSourceKey(tokenAssets)
  };
}

export function useSceneCanvasAssets(campaign: Campaign | null, scene: Scene | null): SceneCanvasAssetModel {
  return useMemo(
    () => getSceneCanvasAssetModel(campaign, scene, window.localVtt.toAssetUrl),
    [campaign, scene]
  );
}
