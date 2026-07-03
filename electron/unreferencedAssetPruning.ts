import path from "node:path";

import type { Asset, Campaign, ThumbnailRegenerationFailure } from "../src/shared/localvtt.js";
import { getAssetFileRemovalPaths } from "./assetFiles.js";
import { assertInsidePath } from "./campaignPathSafety.js";
import { unlinkIfExists } from "./fileOperations.js";
import { createThumbnailRegenerationFailure } from "./thumbnailDiagnostics.js";

export type RemoveFile = (filePath: string) => Promise<void>;

export interface UnreferencedAssetPrunePlan {
  campaign: Campaign;
  pruned: number;
  skipped: number;
  removedFiles: number;
  failed: ThumbnailRegenerationFailure[];
}

export async function pruneUnreferencedAssets(
  campaignPath: string,
  campaign: Campaign,
  unreferencedAssetIds: ReadonlySet<string>,
  removeFile: RemoveFile = unlinkIfExists
): Promise<UnreferencedAssetPrunePlan> {
  const assetsToPrune = campaign.assets.filter((asset) => unreferencedAssetIds.has(asset.id));
  const retainedAssets = campaign.assets.filter((asset) => !unreferencedAssetIds.has(asset.id));
  const failedAssetIds = new Set<string>();
  const failed: ThumbnailRegenerationFailure[] = [];
  let removedFiles = 0;

  for (const asset of assetsToPrune) {
    try {
      removedFiles += await removeAssetFilesUnusedByRetainedAssets(campaignPath, asset, retainedAssets, removeFile);
    } catch (caught) {
      failedAssetIds.add(asset.id);
      failed.push(createThumbnailRegenerationFailure(asset, caught instanceof Error ? caught.message : "Asset files could not be removed."));
    }
  }

  const assets = campaign.assets.filter((asset) => !unreferencedAssetIds.has(asset.id) || failedAssetIds.has(asset.id));
  const pruned = assetsToPrune.length - failedAssetIds.size;

  return {
    campaign: {
      ...campaign,
      assets,
      updatedAt: pruned > 0 ? new Date().toISOString() : campaign.updatedAt
    },
    pruned,
    skipped: campaign.assets.length - assetsToPrune.length + failedAssetIds.size,
    removedFiles,
    failed
  };
}

async function removeAssetFilesUnusedByRetainedAssets(
  campaignPath: string,
  asset: Asset,
  retainedAssets: readonly Asset[],
  removeFile: RemoveFile
): Promise<number> {
  const retainedFilePaths = new Set(
    retainedAssets.flatMap((retainedAsset) => getAssetFileRemovalPaths(campaignPath, retainedAsset)).map((filePath) => path.resolve(filePath))
  );
  let removed = 0;
  for (const assetPath of getAssetFileRemovalPaths(campaignPath, asset)) {
    const resolvedPath = path.resolve(assetPath);
    if (retainedFilePaths.has(resolvedPath)) {
      continue;
    }
    assertInsidePath(campaignPath, resolvedPath);
    await removeFile(resolvedPath);
    removed += 1;
  }
  return removed;
}
