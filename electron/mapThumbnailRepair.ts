import { stat as statFile } from "node:fs/promises";

import { normalizeCampaign, type Campaign } from "../src/shared/localvtt.js";
import { requireCampaignRelativePath } from "./assetFiles.js";

export interface MapThumbnailResult {
  thumbnailRelativePath?: string;
  failureReason?: string;
}

export type CreateMapThumbnail = (campaignPath: string, sourcePath: string, assetId: string) => Promise<MapThumbnailResult>;
export type StatFile = (filePath: string) => Promise<unknown>;

export async function ensureMapThumbnails(
  campaignPath: string,
  campaign: Campaign,
  createMapThumbnail: CreateMapThumbnail,
  stat: StatFile = statFile
): Promise<Campaign> {
  let changed = false;
  const assets = await Promise.all(
    normalizeCampaign(campaign).assets.map(async (asset) => {
      if (asset.kind !== "map") {
        return asset;
      }
      if (asset.thumbnailRelativePath) {
        const thumbnailPath = requireCampaignRelativePath(campaignPath, asset.thumbnailRelativePath);
        try {
          await stat(thumbnailPath);
          return asset;
        } catch {
          // Regenerate missing thumbnails below.
        }
      }
      try {
        const sourcePath = requireCampaignRelativePath(campaignPath, asset.relativePath);
        await stat(sourcePath);
        const thumbnailResult = await createMapThumbnail(campaignPath, sourcePath, asset.id);
        if (!thumbnailResult.thumbnailRelativePath) {
          return asset;
        }
        changed = true;
        return { ...asset, thumbnailRelativePath: thumbnailResult.thumbnailRelativePath };
      } catch {
        return asset;
      }
    })
  );
  return changed ? { ...campaign, assets, updatedAt: new Date().toISOString() } : campaign;
}
