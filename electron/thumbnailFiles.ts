import { writeFile } from "node:fs/promises";

import type { Asset } from "../src/shared/localvtt.js";
import { buildAssetThumbnailRelativePath, requireCampaignRelativePath } from "./assetFiles.js";
import { unlinkIfExists } from "./fileOperations.js";

export async function writeAssetThumbnail(campaignPath: string, assetId: string, thumbnail: Buffer, variant = ""): Promise<string> {
  const relativePath = buildAssetThumbnailRelativePath(assetId, variant);
  const destination = requireCampaignRelativePath(campaignPath, relativePath);
  await writeFile(destination, thumbnail);
  return relativePath;
}

export async function removeThumbnailIfUnused(campaignPath: string, relativePath: string | undefined, assets: readonly Pick<Asset, "thumbnailRelativePath">[]): Promise<void> {
  if (!relativePath || assets.some((asset) => asset.thumbnailRelativePath === relativePath)) {
    return;
  }
  const thumbnailPath = requireCampaignRelativePath(campaignPath, relativePath);
  await unlinkIfExists(thumbnailPath);
}
