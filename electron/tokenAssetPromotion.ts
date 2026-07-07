import { copyFile } from "node:fs/promises";

import type { Asset, Campaign, ThumbnailRegenerationFailure } from "../src/shared/localvtt.js";
import { buildTokenAssetRelativePath, requireCampaignRelativePath } from "./assetFiles.js";
import { createThumbnailRegenerationFailure } from "./thumbnailDiagnostics.js";

export type CopyFile = (source: string, destination: string) => Promise<void>;

export interface TokenAssetPromotionPlan {
  campaign: Campaign;
  promoted: number;
  skipped: number;
  failed: ThumbnailRegenerationFailure[];
  replacedPaths: Map<string, string[]>;
}

export function shouldPromoteTokenAsset(asset: Pick<Asset, "kind" | "relativePath" | "thumbnailRelativePath">): boolean {
  return asset.kind === "token" && Boolean(asset.thumbnailRelativePath) && asset.thumbnailRelativePath !== asset.relativePath;
}

export async function promoteTokenAssetThumbnails(
  campaignPath: string,
  campaign: Campaign,
  copy: CopyFile = copyFile
): Promise<TokenAssetPromotionPlan> {
  const failed: ThumbnailRegenerationFailure[] = [];
  const replacedPaths = new Map<string, string[]>();
  let promoted = 0;
  let skipped = 0;

  const assets: Asset[] = [];
  for (const asset of campaign.assets) {
    if (!shouldPromoteTokenAsset(asset)) {
      skipped += 1;
      assets.push(asset);
      continue;
    }

    const thumbnailRelativePath = asset.thumbnailRelativePath;
    if (!thumbnailRelativePath) {
      skipped += 1;
      assets.push(asset);
      continue;
    }

    const nextRelativePath = buildTokenAssetRelativePath(asset.id);
    try {
      const sourcePath = requireCampaignRelativePath(campaignPath, thumbnailRelativePath);
      const destinationPath = requireCampaignRelativePath(campaignPath, nextRelativePath);
      await copy(sourcePath, destinationPath);
      promoted += 1;
      replacedPaths.set(asset.id, [asset.relativePath, thumbnailRelativePath]);
      assets.push({
        ...asset,
        relativePath: nextRelativePath,
        thumbnailRelativePath: nextRelativePath
      });
    } catch (caught) {
      failed.push(createThumbnailRegenerationFailure(asset, caught instanceof Error ? caught.message : "Token thumbnail could not be promoted."));
      assets.push(asset);
    }
  }

  return {
    campaign: {
      ...campaign,
      assets,
      updatedAt: promoted > 0 ? new Date().toISOString() : campaign.updatedAt
    },
    promoted,
    skipped,
    failed,
    replacedPaths
  };
}
