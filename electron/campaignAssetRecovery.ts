import { stat } from "node:fs/promises";
import type { CampaignHealthAssetKind, CampaignHealthMissingAssetFile } from "../src/shared/campaignHealth.js";
import type { Asset } from "../src/shared/localvtt.js";
import { resolveCampaignRelativePath } from "./assetFiles.js";

export type MissingCampaignAssetKind = CampaignHealthAssetKind;
export type MissingCampaignAssetFile = CampaignHealthMissingAssetFile;

type FileExists = (absolutePath: string) => Promise<boolean>;

export async function findMissingCampaignAssetFiles(
  campaignPath: string,
  assets: readonly Asset[],
  fileExists: FileExists = pathExists
): Promise<MissingCampaignAssetFile[]> {
  const missing: MissingCampaignAssetFile[] = [];

  for (const asset of assets) {
    if (!(await campaignAssetFileExists(campaignPath, asset.relativePath, fileExists))) {
      missing.push({
        assetId: asset.id,
        assetName: asset.name,
        kind: asset.kind,
        relativePath: asset.relativePath
      });
    }

    if (asset.thumbnailRelativePath && !(await campaignAssetFileExists(campaignPath, asset.thumbnailRelativePath, fileExists))) {
      missing.push({
        assetId: asset.id,
        assetName: asset.name,
        kind: "thumbnail",
        relativePath: asset.thumbnailRelativePath
      });
    }
  }

  return missing;
}

async function campaignAssetFileExists(campaignPath: string, relativePath: string, fileExists: FileExists): Promise<boolean> {
  const candidatePath = resolveCampaignRelativePath(campaignPath, relativePath);
  if (!candidatePath) {
    return false;
  }
  return fileExists(candidatePath);
}

async function pathExists(absolutePath: string): Promise<boolean> {
  try {
    return (await stat(absolutePath)).isFile();
  } catch {
    return false;
  }
}
