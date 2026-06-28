import { stat } from "node:fs/promises";
import path from "node:path";
import type { Asset } from "../src/shared/localvtt.js";

export type MissingCampaignAssetKind = Asset["kind"] | "thumbnail";

export interface MissingCampaignAssetFile {
  assetId: string;
  assetName: string;
  kind: MissingCampaignAssetKind;
  relativePath: string;
}

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
  const candidatePath = path.resolve(campaignPath, relativePath);
  if (!isInsideCampaignPath(campaignPath, candidatePath)) {
    return false;
  }
  return fileExists(candidatePath);
}

function isInsideCampaignPath(campaignPath: string, candidatePath: string): boolean {
  const root = path.resolve(campaignPath);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(root, candidate);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function pathExists(absolutePath: string): Promise<boolean> {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
}
