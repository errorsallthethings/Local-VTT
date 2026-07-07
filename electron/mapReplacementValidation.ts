import type { Asset, Campaign, Scene } from "../src/shared/localvtt.js";

export function requireCurrentMapAsset(campaign: Campaign, currentAssetId: string): Asset {
  const currentAsset = campaign.assets.find((candidate) => candidate.id === currentAssetId && candidate.kind === "map");
  if (!currentAsset) {
    throw new Error("Current map asset was not found in this campaign.");
  }
  return currentAsset;
}

export function assertSceneUsesMapAsset(scene: Scene, currentAssetId: string): void {
  if (scene.mapAssetId !== currentAssetId) {
    throw new Error("The selected scene no longer uses this map asset.");
  }
}
