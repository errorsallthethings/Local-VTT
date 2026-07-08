import { addSceneMapVariant, normalizeScene, removeSceneMapVariant, type Asset, type Campaign, type Scene } from "../src/shared/localvtt.js";

export function removeMapAssetFromScene(scene: Scene, assetId: string, timestamp = new Date().toISOString()): Scene {
  const normalizedScene = normalizeScene(scene);
  const variant = normalizedScene.mapVariants.find((candidate) => candidate.assetId === assetId);
  if (variant) {
    return removeSceneMapVariant(normalizedScene, variant.id, timestamp);
  }
  return normalizeScene(normalizedScene.mapAssetId === assetId ? { ...normalizedScene, mapAssetId: undefined, updatedAt: timestamp } : normalizedScene);
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
  importedAsset: Asset,
  keepCurrentAsset: boolean,
  timestamp = new Date().toISOString()
): { campaign: Campaign; scene: Scene } {
  const normalizedScene = normalizeScene(scene);
  const updatedScene = normalizeScene({
    ...normalizedScene,
    mapAssetId: normalizedScene.mapAssetId === currentAssetId ? importedAsset.id : normalizedScene.mapAssetId,
    mapVariants: normalizedScene.mapVariants.map((variant) => (variant.assetId === currentAssetId ? { ...variant, assetId: importedAsset.id } : variant)),
    updatedAt: timestamp
  });

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

export function addMapVariantToScene(
  campaign: Campaign,
  scene: Scene,
  importedAsset: Asset,
  variantName: string,
  timestamp = new Date().toISOString()
): { campaign: Campaign; scene: Scene } {
  const updatedScene = addSceneMapVariant(
    scene,
    {
      id: importedAsset.id,
      name: variantName.trim() || importedAsset.name,
      assetId: importedAsset.id,
      createdAt: timestamp
    },
    timestamp
  );
  return {
    scene: updatedScene,
    campaign: {
      ...campaign,
      assets: [...campaign.assets, importedAsset],
      scenes: campaign.scenes.map((entry) => (entry.id === scene.id ? { ...entry, mapAssetId: updatedScene.mapAssetId } : entry)),
      updatedAt: timestamp
    }
  };
}
