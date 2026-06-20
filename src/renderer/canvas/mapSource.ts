import type { Scene } from "../../shared/localvtt";
import { resolveMapTransform } from "./mapRenderer";

const LARGE_MAP_CACHE_MAX_EDGE = 4096;
const LARGE_MAP_CACHE_MAX_PIXELS = 16_000_000;
const GM_FULL_QUALITY_MAP_SCALE_THRESHOLD = 1.12;
const MEDIA_HAVE_METADATA_READY_STATE = 1;

export interface LoadedMap {
  assetId: string;
  originalSource: HTMLImageElement;
  optimizedSource: CanvasImageSource | null;
  sourceWidth: number;
  sourceHeight: number;
  optimizedScale: number;
  animate: boolean;
  mediaType: "image" | "video";
  ready: boolean;
}

export interface ReadyMapSource {
  source: CanvasImageSource;
  width: number;
  height: number;
}

export interface PreparedLoadedImageMap {
  optimizedSource: CanvasImageSource | null;
  optimizedScale: number;
}

export function getLargeMapCacheScale(width: number, height: number): number {
  const edgeScale = Math.min(1, LARGE_MAP_CACHE_MAX_EDGE / Math.max(width, height));
  const pixelScale = Math.min(1, Math.sqrt(LARGE_MAP_CACHE_MAX_PIXELS / Math.max(1, width * height)));
  return Math.min(edgeScale, pixelScale);
}

export async function prepareLoadedImageMap(image: HTMLImageElement, assetPath: string): Promise<PreparedLoadedImageMap> {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const isAnimatedImage = assetPath.toLowerCase().endsWith(".gif");
  if (isAnimatedImage || sourceWidth <= 0 || sourceHeight <= 0 || typeof createImageBitmap !== "function") {
    return { optimizedSource: null, optimizedScale: 1 };
  }

  const resizeScale = getLargeMapCacheScale(sourceWidth, sourceHeight);
  if (resizeScale >= 1) {
    return { optimizedSource: null, optimizedScale: 1 };
  }

  const resizeWidth = Math.max(1, Math.round(sourceWidth * resizeScale));
  const resizeHeight = Math.max(1, Math.round(sourceHeight * resizeScale));
  const optimizedSource = await createImageBitmap(image, {
    resizeWidth,
    resizeHeight,
    resizeQuality: "high"
  });
  return { optimizedSource, optimizedScale: resizeScale };
}

export function closeCanvasImageSource(source: CanvasImageSource | null) {
  if (source && "close" in source && typeof source.close === "function") {
    source.close();
  }
}

export function getMapDrawSource(
  loadedMap: LoadedMap,
  scene: Scene,
  viewportWidth: number,
  viewportHeight: number,
  cameraZoom: number,
  mode: "gm" | "player"
): CanvasImageSource {
  if (mode === "player" || loadedMap.animate || !loadedMap.optimizedSource) {
    return loadedMap.originalSource;
  }

  const transform = resolveMapTransform(scene, loadedMap.sourceWidth, loadedMap.sourceHeight, viewportWidth, viewportHeight);
  const effectiveMapScale = Math.abs(transform.scale * cameraZoom);
  if (effectiveMapScale > loadedMap.optimizedScale * GM_FULL_QUALITY_MAP_SCALE_THRESHOLD) {
    return loadedMap.originalSource;
  }
  return loadedMap.optimizedSource;
}

export function getReadyMapSourceForFit(loadedMap: LoadedMap | null, mapAssetId: string, activeVideo: HTMLVideoElement | null, isVideoMap: boolean): ReadyMapSource | null {
  if (!isVideoMap) {
    return loadedMap?.ready && loadedMap.assetId === mapAssetId
      ? { source: loadedMap.originalSource, width: loadedMap.sourceWidth, height: loadedMap.sourceHeight }
      : null;
  }
  if (
    activeVideo?.dataset.mapAssetId === mapAssetId &&
    activeVideo.readyState >= MEDIA_HAVE_METADATA_READY_STATE &&
    activeVideo.videoWidth > 0 &&
    activeVideo.videoHeight > 0
  ) {
    return { source: activeVideo, width: activeVideo.videoWidth, height: activeVideo.videoHeight };
  }
  return null;
}
