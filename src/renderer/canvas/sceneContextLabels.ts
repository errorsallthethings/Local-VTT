import type { DrawingElement, EnvironmentEffectMask, FogShape, WeatherMask } from "../../shared/localvtt";
import { formatDefaultDrawingName, formatDefaultFogShapeName } from "../../shared/localvtt";
import { formatEnvironmentEffectOptionLabel } from "../lib/environmentEffectOptions";

export function getDrawingContextLabel(drawing: DrawingElement, index: number): string {
  return drawing.name?.trim() || formatDefaultDrawingName(drawing.kind, Math.max(0, index));
}

export function getFogShapeContextLabel(shape: FogShape, index: number): string {
  return shape.name?.trim() || formatDefaultFogShapeName(shape.operation, shape.kind, Math.max(0, index));
}

export function formatDefaultWeatherMaskName(index: number): string {
  return `Weather Effect Mask ${Math.max(0, index) + 1}`;
}

export function getWeatherMaskContextLabel(mask: WeatherMask): string {
  return mask.name?.trim() || "Weather Effect Mask";
}

export function formatDefaultEnvironmentEffectName(effect: EnvironmentEffectMask["effect"], index: number): string {
  return `${formatEnvironmentEffectOptionLabel(effect)} Effect ${Math.max(0, index) + 1}`;
}

export function getEnvironmentEffectContextLabel(effect: EnvironmentEffectMask, index: number): string {
  return effect.name?.trim() || formatDefaultEnvironmentEffectName(effect.effect, index);
}
