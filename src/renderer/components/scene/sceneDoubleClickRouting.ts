import type { FogTool } from "../../canvas/fog";
import type { DrawingTool } from "../../canvas/drawings";
import type { EnvironmentEffectTool, WeatherMaskTool } from "../tools";

export type SceneDoubleClickAction =
  | "suppress-ping"
  | "commit-fog-polygon"
  | "commit-drawing-polygon"
  | "commit-weather-polygon"
  | "commit-environment-polygon";

export interface SceneDoubleClickRoutingOptions {
  canvasTool?: "ruler" | "ping" | "laser" | null;
  drawingTool?: DrawingTool | null;
  environmentEffectTool?: EnvironmentEffectTool | null;
  fogTool?: FogTool | null;
  hasDrawingPolygonDraft: boolean;
  hasEnvironmentPolygonDraft: boolean;
  hasFogPolygonDraft: boolean;
  hasScene: boolean;
  hasWeatherPolygonDraft: boolean;
  mode: "gm" | "player";
  weatherMaskTool?: WeatherMaskTool | null;
}

export function getSceneDoubleClickActions(options: SceneDoubleClickRoutingOptions): SceneDoubleClickAction[] {
  if (options.mode === "gm" && options.canvasTool === "ping" && options.hasScene) {
    return ["suppress-ping"];
  }

  const actions: SceneDoubleClickAction[] = [];
  if (options.hasFogPolygonDraft) {
    actions.push("commit-fog-polygon");
  }
  if (options.drawingTool === "polygon" && options.hasDrawingPolygonDraft) {
    actions.push("commit-drawing-polygon");
  }
  if (options.weatherMaskTool === "polygon" && options.hasWeatherPolygonDraft) {
    actions.push("commit-weather-polygon");
  }
  if (options.environmentEffectTool === "polygon" && options.hasEnvironmentPolygonDraft) {
    actions.push("commit-environment-polygon");
  }
  return actions;
}
