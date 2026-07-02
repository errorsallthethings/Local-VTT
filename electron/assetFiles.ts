import path from "node:path";
import { normalizeCampaign, type Asset, type Campaign } from "../src/shared/localvtt.js";

export function hydrateCampaignAssetPaths(campaignPath: string, campaign: Campaign): Campaign {
  const normalizedCampaign = normalizeCampaign(campaign);
  return {
    ...normalizedCampaign,
    assets: normalizedCampaign.assets.map((asset) => {
      const absolutePath = resolveCampaignRelativePath(campaignPath, asset.relativePath);
      const thumbnailAbsolutePath = asset.thumbnailRelativePath
        ? resolveCampaignRelativePath(campaignPath, asset.thumbnailRelativePath)
        : undefined;
      return {
        ...asset,
        absolutePath,
        thumbnailAbsolutePath
      };
    })
  };
}

export function getKnownAssetPaths(campaign: Campaign): string[] {
  return dedupePaths(
    normalizeCampaign(campaign).assets.flatMap((asset) => [
      asset.absolutePath,
      asset.thumbnailAbsolutePath
    ])
  );
}

export function getAssetFileRemovalPaths(campaignPath: string, asset: Pick<Asset, "relativePath" | "thumbnailRelativePath" | "absolutePath" | "thumbnailAbsolutePath">): string[] {
  return dedupePaths([
    asset.absolutePath ?? path.resolve(campaignPath, asset.relativePath),
    asset.thumbnailAbsolutePath ?? (asset.thumbnailRelativePath ? path.resolve(campaignPath, asset.thumbnailRelativePath) : undefined)
  ]);
}

export function buildAssetThumbnailRelativePath(assetId: string, variant = ""): string {
  assertSafePathSegment(assetId, "asset id");
  const safeVariant = variant.replace(/[^a-zA-Z0-9_-]/g, "");
  const fileStem = safeVariant ? `${assetId}-${safeVariant}` : assetId;
  return path.join("assets", "thumbnails", `${fileStem}.jpg`).replaceAll(path.sep, "/");
}

export function buildAssetImportRelativePath(kind: Asset["kind"], fileName: string): string {
  assertSafePathSegment(fileName, "asset file name");
  const folder = kind === "map" ? "maps" : "tokens";
  return path.join("assets", folder, fileName).replaceAll(path.sep, "/");
}

function assertSafePathSegment(value: string, label: string): void {
  if (
    value.trim() === "" ||
    value === "." ||
    value === ".." ||
    path.isAbsolute(value) ||
    value.includes("/") ||
    value.includes("\\")
  ) {
    throw new Error(`Unsafe ${label}.`);
  }
}

function resolveCampaignRelativePath(campaignPath: string, relativePath: string): string | undefined {
  const resolvedPath = path.resolve(campaignPath, relativePath);
  return isInsidePath(campaignPath, resolvedPath) ? resolvedPath : undefined;
}

function isInsidePath(rootPath: string, candidatePath: string): boolean {
  const relative = path.relative(path.resolve(rootPath), path.resolve(candidatePath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
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
