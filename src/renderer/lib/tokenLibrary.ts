import type { Asset } from "../../shared/localvtt";

export type TokenLibrarySort = "name-asc" | "newest" | "oldest";

export function filterTokenLibraryAssets(assets: Asset[], query: string, sort: TokenLibrarySort): Asset[] {
  const normalizedQuery = query.trim().toLowerCase();
  return [...assets]
    .filter((asset) => !normalizedQuery || `${asset.name} ${asset.originalFileName}`.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => sortTokenAssets(a, b, sort));
}

export function getSelectedTokenLibraryAssetIds(selectedTokenAssetId: string | undefined, selectedTokenAssetIds: string[]): Set<string> {
  return new Set(selectedTokenAssetIds.length > 0 ? selectedTokenAssetIds : selectedTokenAssetId ? [selectedTokenAssetId] : []);
}

export function getSelectedTokenLibraryAsset(assets: Asset[], selectedTokenAssetId: string | undefined): Asset | null {
  return selectedTokenAssetId ? (assets.find((asset) => asset.id === selectedTokenAssetId) ?? null) : null;
}

function sortTokenAssets(a: Asset, b: Asset, sort: TokenLibrarySort): number {
  if (sort === "newest" || sort === "oldest") {
    const direction = sort === "newest" ? -1 : 1;
    const dateDelta = (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * direction;
    if (dateDelta !== 0) {
      return dateDelta;
    }
  }
  return getAssetLabel(a).localeCompare(getAssetLabel(b), undefined, { sensitivity: "base" });
}

function getAssetLabel(asset: Asset): string {
  return asset.name || asset.originalFileName || "Token";
}
