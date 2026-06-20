import type { Layer } from "../../shared/localvtt";

export type SceneLayerRenderMode = "gm" | "player";

export interface SceneLayerVisibility {
  mapLayer?: Layer;
  gridLayer?: Layer;
  fogLayer?: Layer;
  drawingLayer?: Layer;
  effectsLayer?: Layer;
  tokenLayer?: Layer;
  canShowMap?: boolean;
  canShowGrid?: boolean;
  canShowFog?: boolean;
  canShowDrawings?: boolean;
  canShowWeather?: boolean;
  canShowTokens?: boolean;
}

function isLayerVisibleForMode(layer: Layer | undefined, mode: SceneLayerRenderMode): boolean | undefined {
  return mode === "gm" ? layer?.visibleInGm : layer?.visibleInPlayer;
}

export function getSceneLayerVisibility(layers: readonly Layer[] | undefined, mode: SceneLayerRenderMode): SceneLayerVisibility {
  const mapLayer = layers?.find((layer) => layer.id === "map");
  const gridLayer = layers?.find((layer) => layer.id === "grid");
  const fogLayer = layers?.find((layer) => layer.id === "fog");
  const drawingLayer = layers?.find((layer) => layer.id === "drawing");
  const effectsLayer =
    layers?.find((layer) => layer.id === "effects") ??
    layers?.find((layer) => layer.id === "weather");
  const tokenLayer = layers?.find((layer) => layer.id === "token");

  return {
    mapLayer,
    gridLayer,
    fogLayer,
    drawingLayer,
    effectsLayer,
    tokenLayer,
    canShowMap: isLayerVisibleForMode(mapLayer, mode),
    canShowGrid: isLayerVisibleForMode(gridLayer, mode),
    canShowFog: isLayerVisibleForMode(fogLayer, mode),
    canShowDrawings: isLayerVisibleForMode(drawingLayer, mode),
    canShowWeather: isLayerVisibleForMode(effectsLayer, mode),
    canShowTokens: isLayerVisibleForMode(tokenLayer, mode)
  };
}
