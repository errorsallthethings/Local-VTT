import type { MetadataBackupEntry } from "../src/shared/localvtt.js";

export function createBackupTimestamp(now = new Date()): string {
  return now.toISOString().replace(/[:.]/g, "-");
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
