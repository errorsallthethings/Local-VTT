import path from "node:path";
import type { Asset, Campaign } from "../src/shared/localvtt.js";
import { requireCampaignRelativePath } from "./assetFiles.js";

export interface ImportedAssetInput {
  assetId: string;
  kind: Asset["kind"];
  mediaType: Asset["mediaType"];
  sourcePath: string;
  relativePath: string;
  destination: string;
  campaignPath: string;
  thumbnailRelativePath?: string;
  createdAt: string;
}

export interface StagedTokenImportInput {
  assetId: string;
  sourcePath: string;
  finalRelativePath: string;
  campaignPath: string;
  createdAt: string;
}

export function createImportedAsset(input: ImportedAssetInput): Asset {
  const sourceName = path.basename(input.sourcePath);

  return {
    id: input.assetId,
    name: sourceName,
    kind: input.kind,
    mediaType: input.mediaType,
    relativePath: input.relativePath,
    thumbnailRelativePath: input.thumbnailRelativePath,
    originalFileName: sourceName,
    createdAt: input.createdAt,
    absolutePath: input.destination,
    thumbnailAbsolutePath: input.thumbnailRelativePath ? requireCampaignRelativePath(input.campaignPath, input.thumbnailRelativePath) : undefined
  };
}

export function createStagedTokenImportAsset(input: StagedTokenImportInput): Asset {
  const sourceName = path.basename(input.sourcePath);
  return {
    id: input.assetId,
    name: sourceName,
    kind: "token",
    mediaType: "image",
    relativePath: input.finalRelativePath,
    originalFileName: sourceName,
    createdAt: input.createdAt,
    absolutePath: input.sourcePath
  };
}

export function addImportedAssetToCampaign(campaign: Campaign, asset: Asset, updatedAt: string): Campaign {
  return {
    ...campaign,
    assets: [...campaign.assets, asset],
    updatedAt
  };
}
