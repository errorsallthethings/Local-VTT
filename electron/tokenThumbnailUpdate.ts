import type { Campaign } from "../src/shared/localvtt.js";

export function tokenThumbnailVariant(timestamp: number): string {
  return `crop-${timestamp}`;
}

export function updateTokenThumbnailInCampaign(
  campaign: Campaign,
  assetId: string,
  thumbnailRelativePath: string,
  updatedAt: string
): Campaign {
  return {
    ...campaign,
    assets: campaign.assets.map((candidate) => (candidate.id === assetId ? { ...candidate, thumbnailRelativePath } : candidate)),
    updatedAt
  };
}
