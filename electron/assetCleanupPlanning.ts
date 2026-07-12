import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type {
  Asset,
  AssetCleanupPreviewAsset,
  AssetCleanupPreviewOrphanedFile,
  Campaign
} from "../src/shared/localvtt.js";
import type { CampaignHealthReport } from "../src/shared/campaignHealth.js";
import { getAssetFileRemovalPaths, requireCampaignRelativePath } from "./assetFiles.js";
import { assertInsidePath } from "./campaignPathSafety.js";
import { unlinkIfExists } from "./fileOperations.js";

export interface AssetCleanupPlan {
  unreferencedAssets: AssetCleanupPreviewAsset[];
  staleThumbnailReferences: Array<{
    assetId: string;
    assetName: string;
    relativePath: string;
  }>;
  orphanedFiles: AssetCleanupPreviewOrphanedFile[];
  retainedAssetCount: number;
  totalFilesToRemove: number;
  totalBytesToRemove: number;
}

export type RemoveCleanupFile = (filePath: string) => Promise<void>;

const CLEANUP_ASSET_FOLDERS: Array<{ relativePath: string; kind: Asset["kind"] | "thumbnail" }> = [
  { relativePath: "assets/maps", kind: "map" },
  { relativePath: "assets/tokens", kind: "token" },
  { relativePath: "assets/thumbnails", kind: "thumbnail" }
];

export async function createAssetCleanupPlan(campaignPath: string, campaign: Campaign, health: CampaignHealthReport): Promise<AssetCleanupPlan> {
  const unreferencedAssetIds = new Set(health.unreferencedAssets.map((asset) => asset.assetId));
  const unreferencedAssets = campaign.assets
    .filter((asset) => unreferencedAssetIds.has(asset.id))
    .map((asset) => toCleanupAsset(campaignPath, asset));
  const orphanedFiles = await findOrphanedAssetFiles(campaignPath, campaign);
  const totalFilesToRemove =
    new Set([
      ...unreferencedAssets.flatMap((asset) => asset.fileRelativePaths),
      ...orphanedFiles.map((file) => file.relativePath)
    ]).size;

  return {
    unreferencedAssets,
    staleThumbnailReferences: health.staleThumbnailReferences.map((reference) => ({
      assetId: reference.assetId,
      assetName: reference.assetName,
      relativePath: reference.relativePath
    })),
    orphanedFiles,
    retainedAssetCount: campaign.assets.length - unreferencedAssets.length,
    totalFilesToRemove,
    totalBytesToRemove: orphanedFiles.reduce((total, file) => total + file.sizeBytes, 0)
  };
}

export async function removeOrphanedAssetFiles(
  campaignPath: string,
  orphanedFiles: readonly AssetCleanupPreviewOrphanedFile[],
  removeFile: RemoveCleanupFile = unlinkIfExists
): Promise<{ removed: number; failed: Array<{ relativePath: string; reason: string }> }> {
  let removed = 0;
  const failed: Array<{ relativePath: string; reason: string }> = [];
  for (const file of orphanedFiles) {
    try {
      const absolutePath = requireCampaignRelativePath(campaignPath, file.relativePath);
      assertInsideCleanupFolder(campaignPath, absolutePath);
      await removeFile(absolutePath);
      removed += 1;
    } catch (caught) {
      failed.push({
        relativePath: file.relativePath,
        reason: caught instanceof Error ? caught.message : "Orphaned file could not be removed."
      });
    }
  }
  return { removed, failed };
}

async function findOrphanedAssetFiles(campaignPath: string, campaign: Campaign): Promise<AssetCleanupPreviewOrphanedFile[]> {
  const referencedRelativePaths = new Set(
    campaign.assets
      .flatMap((asset) => [asset.relativePath, asset.thumbnailRelativePath])
      .filter((candidate): candidate is string => Boolean(candidate))
      .map(normalizeRelativePath)
  );
  const files: AssetCleanupPreviewOrphanedFile[] = [];
  for (const folder of CLEANUP_ASSET_FOLDERS) {
    const folderPath = requireCampaignRelativePath(campaignPath, folder.relativePath);
    for (const absolutePath of await listFilesIfPresent(folderPath)) {
      assertInsideCleanupFolder(campaignPath, absolutePath);
      const relativePath = normalizeRelativePath(path.relative(campaignPath, absolutePath));
      if (referencedRelativePaths.has(relativePath)) {
        continue;
      }
      const stats = await stat(absolutePath);
      files.push({ relativePath, kind: folder.kind, sizeBytes: stats.size });
    }
  }
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

async function listFilesIfPresent(folderPath: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(folderPath, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesIfPresent(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}

function toCleanupAsset(campaignPath: string, asset: Asset): AssetCleanupPreviewAsset {
  return {
    assetId: asset.id,
    assetName: asset.name,
    kind: asset.kind,
    relativePath: asset.relativePath,
    fileRelativePaths: getAssetFileRemovalPaths(campaignPath, asset).map((assetPath) => normalizeRelativePath(path.relative(campaignPath, assetPath))),
    usageCount: 0
  };
}

function assertInsideCleanupFolder(campaignPath: string, absolutePath: string): void {
  assertInsidePath(campaignPath, absolutePath);
  if (!CLEANUP_ASSET_FOLDERS.some((folder) => {
    const folderPath = requireCampaignRelativePath(campaignPath, folder.relativePath);
    return absolutePath === folderPath || absolutePath.startsWith(`${folderPath}${path.sep}`);
  })) {
    throw new Error("Cleanup file is outside campaign asset folders.");
  }
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replaceAll(path.sep, "/");
}
