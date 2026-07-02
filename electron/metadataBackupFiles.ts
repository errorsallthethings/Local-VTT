import { copyFile, mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

import type { MetadataBackupEntry } from "../src/shared/localvtt.js";
import { assertInsidePath } from "./campaignPathSafety.js";
import { createBackupTimestamp, createMetadataBackupEntry } from "./metadataBackups.js";

export const DEFAULT_MAX_METADATA_BACKUPS = 10;

interface BackupExistingMetadataFileOptions {
  createTimestamp?: () => string;
  maxBackups?: number;
}

export async function backupExistingMetadataFile(
  campaignPath: string,
  sourcePath: string,
  backupFolder: string,
  backupName: string,
  options: BackupExistingMetadataFileOptions = {}
): Promise<void> {
  assertInsidePath(campaignPath, sourcePath);
  assertInsidePath(campaignPath, backupFolder);
  try {
    await stat(sourcePath);
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  await mkdir(backupFolder, { recursive: true });
  const timestamp = options.createTimestamp?.() ?? createBackupTimestamp();
  const backupPath = path.join(backupFolder, `${timestamp}.${backupName}`);
  assertInsidePath(campaignPath, backupPath);
  await copyFile(sourcePath, backupPath);
  await pruneMetadataBackups(backupFolder, options.maxBackups ?? DEFAULT_MAX_METADATA_BACKUPS);
}

export async function listMetadataBackupFolder(
  campaignPath: string,
  backupFolder: string,
  kind: MetadataBackupEntry["kind"],
  sceneId?: string,
  sceneName?: string
): Promise<MetadataBackupEntry[]> {
  assertInsidePath(campaignPath, backupFolder);
  try {
    const entries = await readdir(backupFolder);
    const backups: MetadataBackupEntry[] = [];
    for (const fileName of entries.filter((entry) => entry.endsWith(".json"))) {
      const backupPath = path.join(backupFolder, fileName);
      assertInsidePath(campaignPath, backupPath);
      const stats = await stat(backupPath);
      backups.push(createMetadataBackupEntry(kind, fileName, stats.size, sceneId, sceneName));
    }
    return backups;
  } catch (caught) {
    if ((caught as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw caught;
  }
}

async function pruneMetadataBackups(backupFolder: string, maxBackups: number): Promise<void> {
  const entries = await readdir(backupFolder);
  const backupFiles = entries.filter((entry) => entry.endsWith(".json")).sort().reverse();
  for (const entry of backupFiles.slice(maxBackups)) {
    await unlinkIfExists(path.join(backupFolder, entry));
  }
}

async function unlinkIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (caught) {
    if ((caught as NodeJS.ErrnoException).code !== "ENOENT") {
      throw caught;
    }
  }
}
