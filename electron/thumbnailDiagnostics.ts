import path from "node:path";

export interface ThumbnailImportFailureDiagnostic {
  label: "LOCALVTT_ASSET_THUMBNAIL_FAILED";
  kind: "map" | "token";
  fileName: string;
  reason: string;
}

export function createThumbnailImportFailureDiagnostic(kind: "map" | "token", sourcePath: string, reason: string | undefined): ThumbnailImportFailureDiagnostic {
  return {
    label: "LOCALVTT_ASSET_THUMBNAIL_FAILED",
    kind,
    fileName: path.basename(sourcePath),
    reason: reason ?? "Thumbnail could not be generated."
  };
}
