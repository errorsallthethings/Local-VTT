import type { Asset, Scene } from "../../../shared/localvtt";
import type { Camera } from "../core";
import { getRenderCamera } from "../core";
import type { LoadedMap } from "../map";
import { getMapDrawSource } from "../map";

const MEDIA_HAVE_METADATA_READY_STATE = 1;

export interface SceneCanvasRenderPlanOptions {
  activeVideo: HTMLVideoElement | null;
  camera: Camera;
  canShowGrid: boolean | undefined;
  canShowMap: boolean | undefined;
  height: number;
  loadedMap: LoadedMap | null;
  mapAsset: Asset | null;
  mode: "gm" | "player";
  outputPixelRatio?: number;
  playerDisplayScale: number;
  scene: Scene;
  width: number;
}

export interface SceneCanvasRenderPlan {
  mapDrawSource: CanvasImageSource | null;
  renderCamera: Camera;
  showGrid: boolean;
  weatherMapReady: boolean;
  weatherMapDimensions: { width: number; height: number } | null;
  weatherMapSource: CanvasImageSource | null;
}

export function getSceneCanvasRenderPlan({
  activeVideo,
  camera,
  canShowGrid,
  canShowMap,
  height,
  loadedMap,
  mapAsset,
  mode,
  outputPixelRatio = 1,
  playerDisplayScale,
  scene,
  width
}: SceneCanvasRenderPlanOptions): SceneCanvasRenderPlan {
  const renderCamera = getRenderCamera(camera, playerDisplayScale);
  const mapDrawSource = loadedMap?.ready
    ? getMapDrawSource(loadedMap, scene, width, height, renderCamera.zoom, mode, outputPixelRatio)
    : null;
  const readyVideoSource =
    activeVideo && activeVideo.readyState >= MEDIA_HAVE_METADATA_READY_STATE ? activeVideo : null;
  const weatherMapSource = loadedMap?.ready ? loadedMap.originalSource : readyVideoSource;
  const weatherMapDimensions = loadedMap?.ready
    ? { width: loadedMap.sourceWidth, height: loadedMap.sourceHeight }
    : readyVideoSource
      ? { width: readyVideoSource.videoWidth, height: readyVideoSource.videoHeight }
      : null;

  return {
    mapDrawSource,
    renderCamera,
    showGrid: Boolean(canShowGrid) && (mode === "gm" ? scene.grid.showOnGm : scene.grid.showOnPlayer),
    weatherMapDimensions,
    weatherMapReady: !canShowMap || !mapAsset || Boolean(weatherMapSource),
    weatherMapSource
  };
}
