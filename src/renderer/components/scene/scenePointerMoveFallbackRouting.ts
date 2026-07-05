import type { DrawingTool } from "../../canvas/drawings";
import type { FogTool } from "../../canvas/fog";
import type { EnvironmentEffectTool, WeatherMaskTool } from "../tools";

export type ScenePointerMoveFallbackRoute =
  | "drawing-polygon-draft"
  | "fog-polygon-draft"
  | "weather-polygon-draft"
  | "environment-polygon-draft"
  | "fog-brush-hover"
  | "drawing-freehand-hover"
  | "hover-and-snap";

export interface ScenePointerMoveFallbackRoutingOptions {
  drawingPolygonDraftActive: boolean;
  drawingTool: DrawingTool | null | undefined;
  environmentEffectTool: EnvironmentEffectTool | null | undefined;
  environmentPolygonDraftActive: boolean;
  fogPolygonDraftActive: boolean;
  fogTool: FogTool | null | undefined;
  hasScene: boolean;
  mode: "gm" | "player";
  weatherMaskTool: WeatherMaskTool | null | undefined;
  weatherPolygonDraftActive: boolean;
}

export function getScenePointerMoveFallbackRoute(options: ScenePointerMoveFallbackRoutingOptions): ScenePointerMoveFallbackRoute {
  if (options.drawingTool === "polygon" && options.drawingPolygonDraftActive) {
    return "drawing-polygon-draft";
  }
  if (options.fogPolygonDraftActive) {
    return "fog-polygon-draft";
  }
  if (options.weatherMaskTool === "polygon" && options.weatherPolygonDraftActive) {
    return "weather-polygon-draft";
  }
  if (options.environmentEffectTool === "polygon" && options.environmentPolygonDraftActive) {
    return "environment-polygon-draft";
  }
  if (options.mode === "gm" && Boolean(options.fogTool?.includes("brush")) && options.hasScene) {
    return "fog-brush-hover";
  }
  if (options.mode === "gm" && options.drawingTool === "freehand" && options.hasScene) {
    return "drawing-freehand-hover";
  }
  return "hover-and-snap";
}
