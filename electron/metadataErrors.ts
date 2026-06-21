export type MetadataKind = "campaign" | "scene";

export function formatMetadataReadError(kind: MetadataKind, backupsPath: string, caught: unknown): Error {
  const message = caught instanceof Error ? caught.message : "Unknown metadata error.";
  const label = kind === "campaign" ? "Campaign" : "Scene";
  return new Error(`${label} metadata could not be read. Metadata backups may exist in ${backupsPath}. ${message}`, {
    cause: caught
  });
}

export function formatMetadataWriteError(kind: MetadataKind, caught: unknown): Error {
  const message = caught instanceof Error ? caught.message : "Unknown save error.";
  const label = kind === "campaign" ? "Campaign" : "Scene";
  return new Error(`${label} metadata could not be saved. ${message}`, {
    cause: caught
  });
}
