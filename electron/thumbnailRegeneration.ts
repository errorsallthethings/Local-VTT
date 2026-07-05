import { stat as statFile } from "node:fs/promises";

import { normalizeCampaign, type Asset, type Campaign, type ThumbnailRegenerationFailure, type ThumbnailRegenerationProgress } from "../src/shared/localvtt.js";
import { requireCampaignRelativePath } from "./assetFiles.js";
import { MAP_ASSET_MAX_BYTES, TOKEN_ASSET_MAX_BYTES } from "./assetImportValidation.js";
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
export type ThumbnailSourceStat = {
  isFile?: () => boolean;
  size?: number;
};
export type StatFile = (filePath: string) => Promise<ThumbnailSourceStat>;

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
      const sourceStats = await stat(sourcePath);
      const sourceIssue = getThumbnailSourceIssue(asset, sourceStats);
      if (sourceIssue) {
        failures.push(createThumbnailRegenerationFailure(asset, sourceIssue));
        assets.push(asset);
        processed += 1;
        onProgress?.({ current: processed, total: eligibleAssetCount, assetName: asset.name, message: `Processed ${asset.name}.` });
        continue;
      }
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

export function getThumbnailSourceIssue(asset: Pick<Asset, "kind">, sourceStats: ThumbnailSourceStat): string | null {
  if (sourceStats.isFile && !sourceStats.isFile()) {
    return "Asset source path is not a file.";
  }

  if (typeof sourceStats.size === "number" && Number.isFinite(sourceStats.size)) {
    if (sourceStats.size <= 0) {
      return "Asset source file is empty or could not be read.";
    }
    if (asset.kind !== "map" && asset.kind !== "token") {
      return null;
    }
    const maxBytes = asset.kind === "map" ? MAP_ASSET_MAX_BYTES : TOKEN_ASSET_MAX_BYTES;
    if (sourceStats.size > maxBytes) {
      return asset.kind === "map"
        ? "Map asset is too large to regenerate a thumbnail."
        : "Token asset is too large to regenerate a thumbnail.";
    }
  }

  return null;
}
