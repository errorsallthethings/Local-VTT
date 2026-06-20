import type { Asset, Token } from "../../shared/localvtt";

export type TokenImageSource = {
  id: string;
  path: string;
};

export function getTokenAssetIds(tokens: readonly Token[] | undefined): string {
  // Keep image loading keyed by asset identity, not token presentation/position changes.
  return [...new Set(tokens?.map((token) => token.assetId).filter(Boolean) ?? [])].join("|");
}

export function getTokenImageAssets(assets: readonly Asset[] | undefined, tokenAssetIds: string): Asset[] {
  if (!assets) {
    return [];
  }
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  return tokenAssetIds
    .split("|")
    .filter(Boolean)
    .map((assetId) => assetsById.get(assetId) ?? null)
    .filter((asset): asset is Asset => Boolean(asset?.absolutePath));
}

export function getTokenImageSourceKey(assets: readonly Asset[]): string {
  const sources = assets
    .map((asset) => ({
      id: asset.id,
      path: asset.thumbnailAbsolutePath ?? asset.absolutePath
    }))
    .filter((source): source is TokenImageSource => Boolean(source.path));
  return JSON.stringify(sources);
}

export function parseTokenImageSourceKey(key: string): TokenImageSource[] {
  try {
    const parsed = JSON.parse(key);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (source): source is TokenImageSource =>
        typeof source?.id === "string" && source.id.length > 0 && typeof source?.path === "string" && source.path.length > 0
    );
  } catch {
    return [];
  }
}
