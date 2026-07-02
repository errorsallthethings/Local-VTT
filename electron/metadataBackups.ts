import path from "node:path";

import type { MetadataBackupEntry, MetadataBackupRef } from "../src/shared/localvtt.js";
import { assertSafePathSegment } from "./safePathSegments.js";

export function createBackupTimestamp(now = new Date()): string {
  return now.toISOString().replace(/[:.]/g, "-");
}

export function campaignBackupFolder(campaignPath: string): string {
  return path.join(metadataBackupsRootFolder(campaignPath), "campaign");
}

export function metadataBackupsRootFolder(campaignPath: string): string {
  return path.join(campaignPath, "backups");
}

export function sceneBackupFolder(campaignPath: string, sceneId: string): string {
  assertSafePathSegment(sceneId, "Unsafe backup scene id.");
  return path.join(metadataBackupsRootFolder(campaignPath), "scenes", sceneId);
}

export function metadataBackupPathFromRef(campaignPath: string, ref: MetadataBackupRef): string {
  const backupFolder = ref.kind === "campaign" ? campaignBackupFolder(campaignPath) : sceneBackupFolder(campaignPath, requireSceneBackupId(ref));
  return path.join(backupFolder, path.basename(ref.fileName));
}

export function requireSceneBackupId(ref: MetadataBackupRef): string {
  if (!ref.sceneId) {
    throw new Error("Scene backup selection is missing a scene id.");
  }
  assertSafePathSegment(ref.sceneId, "Unsafe backup scene id.");
  return ref.sceneId;
}

export function createMetadataBackupEntry(
  kind: MetadataBackupEntry["kind"],
  fileName: string,
  sizeBytes: number,
  sceneId?: string,
  sceneName?: string
): MetadataBackupEntry {
  const timestamp = parseBackupTimestamp(fileName);
  const label = kind === "campaign" ? "Campaign metadata" : sceneName ? `Scene metadata: ${sceneName}` : `Scene metadata: ${sceneId ?? "Unknown scene"}`;
  return {
    id: kind === "campaign" ? `campaign::${fileName}` : `scene:${sceneId ?? ""}:${fileName}`,
    kind,
    sceneId,
    fileName,
    timestamp,
    label,
    sizeBytes
  };
}

export function parseBackupTimestamp(fileName: string): string | null {
  const timestamp = fileName.replace(/\.(campaign|[^.]+\.scene)\.json$/, "");
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3}Z)$/.exec(timestamp);
  if (!match) {
    return null;
  }
  return `${match[1]}:${match[2]}:${match[3]}.${match[4]}`;
}
