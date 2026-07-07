export interface RendererVideoThumbnailPlan {
  baseAssetUrl: string;
  thumbnailAssetUrl: string;
  maxWidth: number;
  maxHeight: number;
  timeoutMs: number;
}

export interface RendererVideoThumbnailResult {
  dataUrl?: string;
  failureReason?: string;
}

export function createRendererVideoThumbnailPlan(sourcePath: string, assetId: string): RendererVideoThumbnailPlan {
  const baseAssetUrl = `localvtt://asset/${encodeURIComponent(sourcePath)}`;
  void assetId;
  return {
    baseAssetUrl,
    thumbnailAssetUrl: `${baseAssetUrl}?thumbnail=1#t=0.05`,
    maxWidth: 180,
    maxHeight: 112,
    timeoutMs: 12000
  };
}
