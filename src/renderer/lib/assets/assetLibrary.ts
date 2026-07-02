import type { Asset, AssetKind, CampaignSceneEntry, Scene } from "../../../shared/localvtt";

export function buildAssetsById(assets: readonly Asset[]): Map<string, Asset> {
  return new Map(assets.map((asset) => [asset.id, asset]));
}

export function buildAssetsByKind(assets: readonly Asset[], kind: AssetKind): Map<string, Asset> {
  return new Map(assets.filter((asset) => asset.kind === kind).map((asset) => [asset.id, asset]));
}

export function getAssetThumbnailPreviewPath(asset: Asset | null | undefined): string | null {
  return asset?.thumbnailAbsolutePath ?? null;
}

export function getAssetThumbnailPreviewMessage(asset: Asset | null | undefined): string | null {
  if (!asset) {
    return null;
  }
  if (asset.thumbnailAbsolutePath) {
    return null;
  }
  if (asset.thumbnailRelativePath) {
    return "Thumbnail preview is missing. Run Campaign Maintenance > Regenerate Thumbnails.";
  }
  return "No thumbnail preview has been generated. Run Campaign Maintenance > Regenerate Thumbnails.";
}

export function getAssetThumbnailPreviewLabel(asset: Asset | null | undefined): string {
  return getAssetThumbnailPreviewMessage(asset) ? "Missing preview" : "No preview";
}

export function buildSceneThumbnailAssets(
  scenes: readonly CampaignSceneEntry[],
  sceneDrafts: Record<string, Scene>,
  activeScene: Scene | null,
  assetsById: ReadonlyMap<string, Asset>
): Map<string, Asset | null> {
  return new Map(
    scenes.map((sceneEntry) => {
      const draftScene = sceneDrafts[sceneEntry.id] ?? (activeScene?.id === sceneEntry.id ? activeScene : null);
      const mapAssetId = draftScene?.mapAssetId ?? sceneEntry.mapAssetId;
      return [sceneEntry.id, mapAssetId ? (assetsById.get(mapAssetId) ?? null) : null];
    })
  );
}
