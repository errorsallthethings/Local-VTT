import type { GridSettings, GridType, Layer, Scene } from "../../../../shared/localvtt";

export type EnvironmentShapeKind = "rectangle" | "polygon" | "circle";

export function formatLayerPanelPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatLayerPanelMultiplier(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatEnvironmentShapeLabel(kind: EnvironmentShapeKind): string {
  return kind === "circle" ? "Radius" : kind === "polygon" ? "Polygon" : "Rectangle";
}

export function formatLayerPanelNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function getLayerItemCount(layerId: Layer["id"], scene: Scene): number | null {
  if (layerId === "fog") {
    return scene.fog.shapes.length;
  }
  if (layerId === "token") {
    return scene.tokens.length;
  }
  if (isEffectsLayerId(layerId)) {
    return scene.weather.masks.length + scene.environment.effects.length;
  }
  if (layerId === "drawing") {
    return scene.drawings.length;
  }
  return null;
}

export function isEffectsLayerId(layerId: string): boolean {
  return layerId === "effects" || layerId === "weather";
}

export function getReservedLayerGuidance(layer: Layer): string | null {
  switch (layer.id) {
    case "gm":
      return "Reserved for future GM-only notes, markers, and private scene tools.";
    case "foreground":
      return "Reserved for future foreground overlays that sit above tokens.";
    case "object":
      return "Reserved for future placed scene objects and props.";
    case "lighting":
      return "Reserved for future walls, lights, and line-of-sight tools.";
    default:
      return null;
  }
}

export function getGridFootprint(grid: GridSettings): { width: number; height: number } {
  return {
    width: Math.round(Math.max(1, grid.mapGridColumns) * Math.max(1, grid.sizePx)),
    height: Math.round(Math.max(1, grid.mapGridRows) * Math.max(1, grid.sizePx))
  };
}

export function getGridTypeLabel(gridType: GridType): string {
  switch (gridType) {
    case "gridless":
      return "Gridless";
    case "square":
      return "Square";
    case "hex":
      return "Hex";
  }
}
