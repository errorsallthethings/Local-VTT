import type { Asset, Campaign } from "../src/shared/localvtt.js";

export function findCampaignAsset(campaign: Campaign, assetId: string, kind: Asset["kind"]): Asset | undefined {
  return campaign.assets.find((candidate) => candidate.id === assetId && candidate.kind === kind);
}

export function requireCampaignAsset(campaign: Campaign, assetId: string, kind: Asset["kind"], message: string): Asset {
  const asset = findCampaignAsset(campaign, assetId, kind);
  if (!asset) {
    throw new Error(message);
  }
  return asset;
}

export function requireTokenAssetWithAbsolutePath(campaign: Campaign, assetId: string): Asset & { absolutePath: string } {
  const asset = requireCampaignAsset(campaign, assetId, "token", "Token asset was not found in this campaign.");
  if (!asset.absolutePath) {
    throw new Error("Token asset was not found in this campaign.");
  }
  return asset as Asset & { absolutePath: string };
}
