import { normalizeScene, type Campaign, type Scene } from "../src/shared/localvtt.js";

export function removeMapAssetFromScene(scene: Scene, assetId: string, timestamp = new Date().toISOString()): Scene {
  return normalizeScene(scene.mapAssetId === assetId ? { ...scene, mapAssetId: undefined, updatedAt: timestamp } : scene);
}

export function removeMapAssetFromCampaign(campaign: Campaign, assetId: string, timestamp = new Date().toISOString()): Campaign {
  return {
    ...campaign,
    scenes: campaign.scenes.map((entry) => (entry.mapAssetId === assetId ? { ...entry, mapAssetId: undefined } : entry)),
    assets: campaign.assets.filter((candidate) => candidate.id !== assetId),
    updatedAt: timestamp
  };
}

export function replaceSceneMapAsset(
  campaign: Campaign,
  scene: Scene,
  currentAssetId: string,
  importedAsset: Campaign["assets"][number],
  keepCurrentAsset: boolean,
  timestamp = new Date().toISOString()
): { campaign: Campaign; scene: Scene } {
  const updatedScene = normalizeScene({ ...scene, mapAssetId: importedAsset.id, updatedAt: timestamp });

  return {
    scene: updatedScene,
    campaign: {
      ...campaign,
      assets: keepCurrentAsset ? [...campaign.assets, importedAsset] : [...campaign.assets.filter((asset) => asset.id !== currentAssetId), importedAsset],
      scenes: campaign.scenes.map((entry) => (entry.id === scene.id ? { ...entry, mapAssetId: importedAsset.id } : entry)),
      updatedAt: timestamp
    }
  };
}
