import { normalizeScene, type Campaign, type Scene } from "../src/shared/localvtt.js";

export function removeAssetFromCampaign(campaign: Campaign, assetId: string, timestamp = new Date().toISOString()): Campaign {
  return {
    ...campaign,
    assets: campaign.assets.filter((candidate) => candidate.id !== assetId),
    updatedAt: timestamp
  };
}

export function removeTokenAssetFromScene(scene: Scene, assetId: string, timestamp = new Date().toISOString()): Scene | null {
  if (!scene.tokens.some((token) => token.assetId === assetId)) {
    return null;
  }

  return normalizeScene({
    ...scene,
    tokens: scene.tokens.filter((token) => token.assetId !== assetId),
    updatedAt: timestamp
  });
}
