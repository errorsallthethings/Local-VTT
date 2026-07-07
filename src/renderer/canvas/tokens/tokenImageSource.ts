import type { Asset, Token } from "../../../shared/localvtt";

export type TokenImageSource = {
  id: string;
  path: string;
};

export function getReusableTokenImageState<TImage>(
  previousImages: ReadonlyMap<string, TImage>,
  previousImagePaths: ReadonlyMap<string, string>,
  previousFailedIds: ReadonlySet<string>,
  previousFailedPaths: ReadonlyMap<string, string>,
  nextSources: readonly TokenImageSource[]
): {
  loadedImages: Map<string, TImage>;
  loadedImagePaths: Map<string, string>;
  failedIds: Set<string>;
  failedPaths: Map<string, string>;
  pendingSources: TokenImageSource[];
} {
  const loadedImages = new Map<string, TImage>();
  const loadedImagePaths = new Map<string, string>();
  const failedIds = new Set<string>();
  const failedPaths = new Map<string, string>();
  const pendingSources: TokenImageSource[] = [];

  for (const source of nextSources) {
    const previousImage = previousImages.get(source.id);
    if (previousImage && previousImagePaths.get(source.id) === source.path) {
      loadedImages.set(source.id, previousImage);
      loadedImagePaths.set(source.id, source.path);
      continue;
    }
    if (previousFailedIds.has(source.id) && previousFailedPaths.get(source.id) === source.path) {
      failedIds.add(source.id);
      failedPaths.set(source.id, source.path);
      continue;
    }
    pendingSources.push(source);
  }

  return { loadedImages, loadedImagePaths, failedIds, failedPaths, pendingSources };
}

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

export function getRequiredTokenImageAssetIds(tokenImageSourceKey: string): string[] {
  return parseTokenImageSourceKey(tokenImageSourceKey).map((source) => source.id);
}

export function areTokenImagesReady(
  canShowTokens: boolean | undefined,
  tokenImageSourceKey: string,
  loadedTokenImages: ReadonlyMap<string, unknown>,
  failedTokenImageIds: ReadonlySet<string>
): boolean {
  if (!canShowTokens) {
    return true;
  }
  return getRequiredTokenImageAssetIds(tokenImageSourceKey).every((assetId) => loadedTokenImages.has(assetId) || failedTokenImageIds.has(assetId));
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
