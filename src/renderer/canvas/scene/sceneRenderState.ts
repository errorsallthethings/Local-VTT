import type { EnvironmentEffectMask, Point, Scene, WeatherMask } from "../../../shared/localvtt";
import { getEnvironmentEffectsWithPointOverrides, isEnvironmentEffectVisibleForMode } from "../effects/environmentEffectGeometry";
import { getWeatherMasksWithPointOverrides } from "../weather/weatherMaskGeometry";

export interface SceneEffectRenderState {
  environmentEffects: EnvironmentEffectMask[];
  weatherMasks: WeatherMask[];
  selectedEnvironmentEffect: EnvironmentEffectMask | null;
  selectedWeatherMasks: WeatherMask[];
}

export interface SceneEffectRenderStateOptions {
  scene: Scene | null | undefined;
  mode: "gm" | "player";
  environmentEffectPoints: Map<string, Point[]> | null;
  weatherMaskPoints: Map<string, Point[]> | null;
  selectedEnvironmentEffectId?: string | null;
  selectedWeatherMaskIds?: readonly string[];
}

const EMPTY_EFFECT_RENDER_STATE: SceneEffectRenderState = {
  environmentEffects: [],
  weatherMasks: [],
  selectedEnvironmentEffect: null,
  selectedWeatherMasks: []
};

export function getSceneEffectRenderState({
  scene,
  mode,
  environmentEffectPoints,
  weatherMaskPoints,
  selectedEnvironmentEffectId,
  selectedWeatherMaskIds = []
}: SceneEffectRenderStateOptions): SceneEffectRenderState {
  if (!scene) {
    return EMPTY_EFFECT_RENDER_STATE;
  }

  const environmentEffects = getEnvironmentEffectsWithPointOverrides(scene, environmentEffectPoints);
  const weatherMasks = getWeatherMasksWithPointOverrides(scene, weatherMaskPoints);
  const selectedEnvironmentEffect = selectedEnvironmentEffectId
    ? environmentEffects.find((effect) => effect.id === selectedEnvironmentEffectId && isEnvironmentEffectVisibleForMode(effect, mode)) ?? null
    : null;

  if (mode !== "gm" || selectedWeatherMaskIds.length === 0) {
    return {
      environmentEffects,
      weatherMasks,
      selectedEnvironmentEffect,
      selectedWeatherMasks: []
    };
  }

  const selectedWeatherMaskIdSet = new Set(selectedWeatherMaskIds);
  return {
    environmentEffects,
    weatherMasks,
    selectedEnvironmentEffect,
    selectedWeatherMasks: weatherMasks.filter((mask) => selectedWeatherMaskIdSet.has(mask.id) && (mask.visible ?? true))
  };
}
