import { stat as statFile } from "node:fs/promises";

import { normalizeCampaign, type Asset, type Campaign, type ThumbnailRegenerationFailure, type ThumbnailRegenerationProgress } from "../src/shared/localvtt.js";
import { requireCampaignRelativePath } from "./assetFiles.js";
import type { MapThumbnailResult } from "./mapThumbnailRepair.js";
import { createThumbnailRegenerationFailure } from "./thumbnailDiagnostics.js";

export interface ThumbnailRegenerationPlan {
  campaign: Campaign;
  previousThumbnailPaths: Map<string, string | undefined>;
  regenerated: number;
  skipped: number;
  failed: ThumbnailRegenerationFailure[];
}

export type CreateAssetThumbnail = (asset: Asset, sourcePath: string) => Promise<MapThumbnailResult>;
export type StatFile = (filePath: string) => Promise<unknown>;

export function isManualTokenCropThumbnail(asset: Pick<Asset, "kind" | "thumbnailRelativePath">): boolean {
  return asset.kind === "token" && /(^|\/)[^/]+-crop-[^/]+\.jpg$/i.test(asset.thumbnailRelativePath ?? "");
}

export function shouldRegenerateAssetThumbnail(asset: Pick<Asset, "kind" | "relativePath" | "thumbnailRelativePath">): boolean {
  if (asset.kind === "map") {
    return true;
  }
  if (asset.kind !== "token") {
    return false;
  }
  if (asset.thumbnailRelativePath === asset.relativePath) {
    return false;
  }
  return !isManualTokenCropThumbnail(asset);
}

export async function regenerateThumbnailAssets(
  campaignPath: string,
  campaign: Campaign,
  createThumbnail: CreateAssetThumbnail,
  onProgress?: (progress: ThumbnailRegenerationProgress) => void,
  stat: StatFile = statFile
): Promise<ThumbnailRegenerationPlan> {
  const failures: ThumbnailRegenerationFailure[] = [];
  const previousThumbnailPaths = new Map(campaign.assets.map((asset) => [asset.id, asset.thumbnailRelativePath]));
  const normalizedAssets = normalizeCampaign(campaign).assets;
  const eligibleAssetCount = normalizedAssets.filter((asset) => shouldRegenerateAssetThumbnail(asset)).length;
  let regenerated = 0;
  let skipped = 0;
  let processed = 0;

  const assets = [];
  onProgress?.({ current: 0, total: eligibleAssetCount, assetName: null, message: "Preparing thumbnail regeneration." });
  for (const asset of normalizedAssets) {
    if (!shouldRegenerateAssetThumbnail(asset)) {
      skipped += 1;
      assets.push(asset);
      continue;
    }

    onProgress?.({ current: processed, total: eligibleAssetCount, assetName: asset.name, message: `Regenerating ${asset.name}.` });
    const sourcePath = requireCampaignRelativePath(campaignPath, asset.relativePath);
    try {
      await stat(sourcePath);
      const thumbnailResult = await createThumbnail(asset, sourcePath);
      if (!thumbnailResult.thumbnailRelativePath) {
        failures.push(createThumbnailRegenerationFailure(asset, thumbnailResult.failureReason ?? "Thumbnail could not be generated."));
        assets.push(asset);
        continue;
      }
      regenerated += 1;
      assets.push({ ...asset, thumbnailRelativePath: thumbnailResult.thumbnailRelativePath });
    } catch (caught) {
      failures.push(createThumbnailRegenerationFailure(asset, caught instanceof Error ? caught.message : "Asset could not be read."));
      assets.push(asset);
    }
    processed += 1;
    onProgress?.({ current: processed, total: eligibleAssetCount, assetName: asset.name, message: `Processed ${asset.name}.` });
  }

  return {
    campaign: {
      ...campaign,
      assets,
      updatedAt: regenerated > 0 ? new Date().toISOString() : campaign.updatedAt
    },
    previousThumbnailPaths,
    regenerated,
    skipped,
    failed: failures
  };
}
