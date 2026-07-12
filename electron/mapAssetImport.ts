import type { WebContents } from "electron";
import type { Asset } from "../src/shared/localvtt.js";
import { copyAssetImportToCampaign } from "./assetImportFiles.js";
import { mapMediaType } from "./assetImportValidation.js";
import { createImportedAsset } from "./importedAssets.js";
import type { MapThumbnailResult } from "./mapThumbnailRepair.js";

export interface CreateCopiedMapAssetOptions {
  createAssetId: () => string;
  createMapThumbnail: (campaignPath: string, sourcePath: string, assetId: string, rendererWebContents?: WebContents) => Promise<MapThumbnailResult>;
  getTimestamp: () => string;
  logThumbnailImportFailure: (kind: "map", sourcePath: string, reason: string | undefined) => void;
  registerAssetPath: (destination: string) => void;
}

export async function createCopiedMapAsset(
  campaignPath: string,
  sourcePath: string,
  rendererWebContents: WebContents,
  options: CreateCopiedMapAssetOptions
): Promise<Asset> {
  const { relativePath, destination } = await copyAssetImportToCampaign(campaignPath, sourcePath, "map");
  options.registerAssetPath(destination);

  const assetId = options.createAssetId();
  const thumbnailResult = await options.createMapThumbnail(campaignPath, destination, assetId, rendererWebContents);
  const thumbnailRelativePath = thumbnailResult.thumbnailRelativePath;
  if (!thumbnailRelativePath) {
    options.logThumbnailImportFailure("map", sourcePath, thumbnailResult.failureReason);
  }
  const updatedAt = options.getTimestamp();
  return createImportedAsset({
    assetId,
    kind: "map",
    mediaType: mapMediaType(sourcePath),
    sourcePath,
    relativePath,
    destination,
    campaignPath,
    thumbnailRelativePath,
    createdAt: updatedAt
  });
}
