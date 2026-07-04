import type { DrawingTool } from "../../canvas/drawings";
import type { FogTool } from "../../canvas/fog";
import type { EnvironmentEffectTool, MouseBehavior, WeatherMaskTool } from "../tools";

export type ScenePointerDownRoute =
  | "pan"
  | "ignore-ping"
  | "map-calibration"
  | "ruler"
  | "laser"
  | "drawing-polygon"
  | "drawing"
  | "fog"
  | "weather-mask"
  | "environment-effect"
  | "marquee-additive"
  | "selector"
  | "marquee"
  | "none";

export interface ScenePointerDownRoutingOptions {
  authoringToolActive: boolean;
  button: number;
  canvasTool: "ruler" | "ping" | "laser" | null | undefined;
  drawingTool: DrawingTool | null | undefined;
  environmentEffectTool: EnvironmentEffectTool | null | undefined;
  hasMapCalibrationTool: boolean;
  hasScene: boolean;
  mode: "gm" | "player";
  mouseBehavior: MouseBehavior;
  onSceneChangeAvailable: boolean;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  weatherMaskTool: WeatherMaskTool | null | undefined;
  fogTool: FogTool | null | undefined;
}

export function getScenePointerDownRoute(options: ScenePointerDownRoutingOptions): ScenePointerDownRoute {
  if (options.button !== 0) {
    return "pan";
  }
  if (options.mode === "gm" && options.canvasTool === "ping" && options.hasScene) {
    return "ignore-ping";
  }
  if (options.mode === "gm" && options.hasScene && options.hasMapCalibrationTool) {
    return "map-calibration";
  }
  if (options.mode === "gm" && options.canvasTool === "ruler" && options.hasScene) {
    return "ruler";
  }
  if (options.mode === "gm" && options.canvasTool === "laser" && options.hasScene) {
    return "laser";
  }
  if (options.mode === "gm" && options.drawingTool === "polygon" && options.hasScene && options.onSceneChangeAvailable) {
    return "drawing-polygon";
  }
  if (options.mode === "gm" && options.drawingTool && options.hasScene && options.onSceneChangeAvailable) {
    return "drawing";
  }
  if (options.mode === "gm" && options.fogTool && options.hasScene && options.onSceneChangeAvailable) {
    return "fog";
  }
  if (options.mode === "gm" && options.weatherMaskTool && options.hasScene && options.onSceneChangeAvailable) {
    return "weather-mask";
  }
  if (options.mode === "gm" && options.environmentEffectTool && options.hasScene && options.onSceneChangeAvailable) {
    return "environment-effect";
  }
  if (
    options.mode === "gm" &&
    options.mouseBehavior === "selector" &&
    options.hasScene &&
    !options.authoringToolActive &&
    (options.shiftKey || options.ctrlKey || options.metaKey)
  ) {
    return "marquee-additive";
  }
  if (options.mode === "gm" && options.hasScene && options.onSceneChangeAvailable) {
    return "selector";
  }
  if (options.mode === "gm" && options.mouseBehavior === "selector" && options.hasScene && !options.authoringToolActive) {
    return "marquee";
  }
  if (options.mode === "gm" && options.mouseBehavior === "grabber") {
    return "pan";
  }
  return "none";
}
