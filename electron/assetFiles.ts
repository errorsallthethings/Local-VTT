import path from "node:path";
import { normalizeCampaign, type Asset, type Campaign } from "../src/shared/localvtt.js";

export function hydrateCampaignAssetPaths(campaignPath: string, campaign: Campaign): Campaign {
  const normalizedCampaign = normalizeCampaign(campaign);
  return {
    ...normalizedCampaign,
    assets: normalizedCampaign.assets.map((asset) => ({
      ...asset,
      absolutePath: path.resolve(campaignPath, asset.relativePath),
      thumbnailAbsolutePath: asset.thumbnailRelativePath ? path.resolve(campaignPath, asset.thumbnailRelativePath) : undefined
    }))
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
  const safeVariant = variant.replace(/[^a-zA-Z0-9_-]/g, "");
  const fileStem = safeVariant ? `${assetId}-${safeVariant}` : assetId;
  return path.join("assets", "thumbnails", `${fileStem}.jpg`).replaceAll(path.sep, "/");
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
