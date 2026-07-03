import path from "node:path";
import type { Asset, ThumbnailRegenerationFailure } from "../src/shared/localvtt.js";

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

export function createThumbnailRegenerationFailure(asset: Asset, reason: string): ThumbnailRegenerationFailure {
  return {
    assetId: asset.id,
    assetName: asset.name,
    kind: asset.kind,
    relativePath: asset.relativePath,
    reason
  };
}

export function createVideoThumbnailFallbackFailure(primaryReason: string | undefined, fallbackReason: string | undefined): string {
  const normalizedPrimaryReason = primaryReason ?? "Electron could not generate a video thumbnail.";
  const normalizedFallbackReason = fallbackReason ?? "Renderer fallback did not return a thumbnail.";
  return `${normalizedPrimaryReason} Renderer fallback also failed: ${normalizedFallbackReason}`;
}
