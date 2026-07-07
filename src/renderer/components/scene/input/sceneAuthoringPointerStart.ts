import type { EnvironmentEffectMask, EnvironmentEffectType, Point } from "../../../../shared/localvtt";
import type { DrawingPreviewStyle, DrawingTool } from "../../../canvas/drawings";
import type { FogTool } from "../../../canvas/fog";
import type { EnvironmentEffectTool, WeatherMaskTool } from "../../tools";
import { getDrawingPointerStart } from "./sceneDrawingPointer";
import { getEnvironmentEffectPointerStart, type EnvironmentEffectPointerStart } from "./sceneEnvironmentEffectPointer";
import { getFogPointerStart, type FogPointerStart } from "./sceneFogPointer";
import type { ScenePointerDownRoute } from "./scenePointerDownRouting";
import { getWeatherMaskPointerStart, type WeatherMaskPointerStart } from "./sceneWeatherMaskPointer";

export type SceneAuthoringPointerStart =
  | { kind: "drawing-polygon"; point: Point }
  | { kind: "drawing"; preview: NonNullable<ReturnType<typeof getDrawingPointerStart>> }
  | { kind: "fog"; start: FogPointerStart }
  | { kind: "weather-mask"; start: WeatherMaskPointerStart }
  | { kind: "environment-effect"; start: EnvironmentEffectPointerStart };

export interface SceneAuthoringPointerStartOptions {
  activeFogBrushSize: number;
  button: number;
  drawingStyle: DrawingPreviewStyle;
  drawingTool: DrawingTool | null | undefined;
  environmentEffectFeather: number;
  environmentEffectTool: EnvironmentEffectTool | null | undefined;
  environmentEffectType: EnvironmentEffectType;
  fogTool: FogTool | null | undefined;
  hasScene: boolean;
  mode: "gm" | "player";
  onSceneChangeAvailable: boolean;
  pointerId: number;
  route: ScenePointerDownRoute;
  toolPoint: Point;
  weatherMaskTool: WeatherMaskTool | null | undefined;
  environmentEffectTuning: Partial<EnvironmentEffectMask>;
}

export function getSceneAuthoringPointerStart(options: SceneAuthoringPointerStartOptions): SceneAuthoringPointerStart | null {
  if (options.route === "drawing-polygon") {
    return options.drawingTool ? { kind: "drawing-polygon", point: options.toolPoint } : null;
  }

  if (options.route === "drawing") {
    const preview = getDrawingPointerStart({
      button: options.button,
      hasScene: options.hasScene,
      mode: options.mode,
      onSceneChangeAvailable: options.onSceneChangeAvailable,
      point: options.toolPoint,
      pointerId: options.pointerId,
      style: options.drawingStyle,
      tool: options.drawingTool
    });
    return preview ? { kind: "drawing", preview } : null;
  }

  if (options.route === "fog") {
    const start = getFogPointerStart({
      brushSize: options.activeFogBrushSize,
      button: options.button,
      hasScene: options.hasScene,
      mode: options.mode,
      onSceneChangeAvailable: options.onSceneChangeAvailable,
      point: options.toolPoint,
      pointerId: options.pointerId,
      tool: options.fogTool
    });
    return start ? { kind: "fog", start } : null;
  }

  if (options.route === "weather-mask") {
    const start = getWeatherMaskPointerStart({
      button: options.button,
      hasScene: options.hasScene,
      mode: options.mode,
      onSceneChangeAvailable: options.onSceneChangeAvailable,
      point: options.toolPoint,
      pointerId: options.pointerId,
      tool: options.weatherMaskTool
    });
    return start ? { kind: "weather-mask", start } : null;
  }

  if (options.route === "environment-effect") {
    const start = getEnvironmentEffectPointerStart({
      button: options.button,
      effect: options.environmentEffectType,
      fallbackTuning: options.environmentEffectTuning,
      feather: options.environmentEffectFeather,
      hasScene: options.hasScene,
      mode: options.mode,
      onSceneChangeAvailable: options.onSceneChangeAvailable,
      point: options.toolPoint,
      pointerId: options.pointerId,
      tool: options.environmentEffectTool
    });
    return start ? { kind: "environment-effect", start } : null;
  }

  return null;
}
