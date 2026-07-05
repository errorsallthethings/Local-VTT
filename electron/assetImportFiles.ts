import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

import { buildAssetImportRelativePath, requireCampaignRelativePath } from "./assetFiles.js";
import {
  safeAssetName,
  validateAssetImportCandidate,
  type AssetImportKind
} from "./assetImportValidation.js";

export interface ImportedAssetFile {
  fileName: string;
  relativePath: string;
  destination: string;
}

export async function assertAssetImportCandidate(sourcePath: string, kind: AssetImportKind): Promise<void> {
  let sourceStats;
  try {
    sourceStats = await stat(sourcePath);
  } catch {
    throw new Error("Selected asset file could not be read. It may have been moved or deleted.");
  }

  validateAssetImportCandidate({
    sourcePath,
    kind,
    sizeBytes: sourceStats.size,
    isFile: sourceStats.isFile()
  });
}

export async function copyAssetImportToCampaign(campaignPath: string, sourcePath: string, kind: AssetImportKind): Promise<ImportedAssetFile> {
  const fileName = safeAssetName(sourcePath);
  const relativePath = buildAssetImportRelativePath(kind, fileName);
  const destination = requireCampaignRelativePath(campaignPath, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(sourcePath, destination);
  return { fileName, relativePath, destination };
}
