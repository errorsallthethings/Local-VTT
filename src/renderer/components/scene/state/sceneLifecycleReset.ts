export type SceneLifecycleResetAction =
  | "clear-fog-polygon-draft"
  | "clear-drawing-polygon-draft"
  | "clear-weather-polygon-draft"
  | "clear-environment-polygon-draft"
  | "clear-fog-preview"
  | "clear-drawing-preview"
  | "clear-weather-preview"
  | "clear-environment-preview"
  | "cancel-weather-move"
  | "cancel-environment-move"
  | "clear-token-drag"
  | "clear-pan-drag"
  | "clear-selection-drag"
  | "clear-brush-hover"
  | "clear-snap-point"
  | "clear-scene-item-hover"
  | "clear-ruler-drag"
  | "clear-released-ruler"
  | "clear-laser-drag"
  | "emit-ruler-clear";

export function getSceneOrFogToolResetActions(): SceneLifecycleResetAction[] {
  return [
    "clear-fog-polygon-draft",
    "clear-drawing-polygon-draft",
    "clear-weather-polygon-draft",
    "clear-environment-polygon-draft",
    "clear-fog-preview",
    "clear-drawing-preview",
    "clear-brush-hover",
    "clear-snap-point",
    "clear-scene-item-hover"
  ];
}

export function getDrawingToolResetActions(): SceneLifecycleResetAction[] {
  return ["clear-drawing-preview", "clear-brush-hover", "clear-snap-point"];
}

export function getCanvasToolResetActions(hasRulerDrag: boolean): SceneLifecycleResetAction[] {
  return [
    ...(hasRulerDrag ? (["emit-ruler-clear"] as const) : []),
    "clear-ruler-drag",
    "clear-released-ruler",
    "clear-laser-drag"
  ];
}

export function getModeOrSceneResetActions(): SceneLifecycleResetAction[] {
  return [
    "clear-token-drag",
    "clear-pan-drag",
    "clear-weather-preview",
    "clear-environment-preview",
    "cancel-weather-move",
    "cancel-environment-move",
    "clear-selection-drag",
    "clear-snap-point",
    "clear-brush-hover"
  ];
}

export function getWeatherToolResetActions(): SceneLifecycleResetAction[] {
  return ["clear-weather-preview", "clear-weather-polygon-draft"];
}

export function getEnvironmentToolResetActions(): SceneLifecycleResetAction[] {
  return ["clear-environment-preview", "clear-environment-polygon-draft"];
}
