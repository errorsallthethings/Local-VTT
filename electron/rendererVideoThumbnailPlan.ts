export interface RendererVideoThumbnailCaptureRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RendererVideoThumbnailPlan {
  baseAssetUrl: string;
  thumbnailAssetUrl: string;
  captureSurfaceId: string;
  captureRect: RendererVideoThumbnailCaptureRect;
  timeoutMs: number;
}

export interface RendererVideoThumbnailPreparationResult {
  captureRect?: RendererVideoThumbnailCaptureRect;
  failureReason?: string;
}

export function createRendererVideoThumbnailPlan(sourcePath: string, assetId: string): RendererVideoThumbnailPlan {
  const baseAssetUrl = `localvtt://asset/${encodeURIComponent(sourcePath)}`;
  return {
    baseAssetUrl,
    thumbnailAssetUrl: `${baseAssetUrl}?thumbnail=1#t=0.05`,
    captureSurfaceId: `localvtt-video-thumbnail-${assetId}`,
    captureRect: { x: 24, y: 24, width: 180, height: 112 },
    timeoutMs: 12000
  };
}

export function getRendererVideoThumbnailCaptureRect(
  result: RendererVideoThumbnailPreparationResult | null
): RendererVideoThumbnailCaptureRect | string {
  return result?.captureRect ?? result?.failureReason ?? "Renderer video frame could not be prepared for capture.";
}

export function createRendererVideoThumbnailCleanupScript(captureSurfaceId: string): string {
  return `
        (() => {
          const captureSurface = document.getElementById(${JSON.stringify(captureSurfaceId)});
          captureSurface?.querySelectorAll("video").forEach((video) => {
            video.removeAttribute("src");
            video.load();
          });
          captureSurface?.remove();
        })()
      `;
}
