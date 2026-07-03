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
