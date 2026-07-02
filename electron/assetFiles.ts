import path from "node:path";
import type { Asset } from "../src/shared/localvtt.js";

export function getAssetFileRemovalPaths(campaignPath: string, asset: Pick<Asset, "relativePath" | "thumbnailRelativePath" | "absolutePath" | "thumbnailAbsolutePath">): string[] {
  return dedupePaths([
    asset.absolutePath ?? path.resolve(campaignPath, asset.relativePath),
    asset.thumbnailAbsolutePath ?? (asset.thumbnailRelativePath ? path.resolve(campaignPath, asset.thumbnailRelativePath) : undefined)
  ]);
}

function dedupePaths(paths: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const candidate of paths) {
    if (!candidate) {
      continue;
    }
    const normalized = path.resolve(candidate);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(candidate);
  }
  return result;
}
