import type { EnvironmentEffectMask, Scene } from "../../../shared/localvtt";
import {
  getDrawingDragCommitAction,
  getEnvironmentEffectDragCommitAction,
  getFogDragCommitAction,
  getWeatherMaskDragCommitAction
} from "../../canvas/scene";
import type { DrawingPreview } from "../../canvas/drawings";
import type { EnvironmentEffectDrag } from "../../canvas/effects";
import type { FogDrag } from "../../canvas/fog";
import type { WeatherMaskDrag } from "../../canvas/weather";
import { addEnvironmentEffect, addSceneDrawing, addSceneFogShape, addSceneWeatherMask } from "../../lib/scene";

export function getSceneAfterDrawingDragCommit(scene: Scene, preview: DrawingPreview, id: string): Scene | null {
  const action = getDrawingDragCommitAction(scene, preview, id);
  return action.kind === "commit-drawing" ? addSceneDrawing(scene, action.drawing) : null;
}

export function getSceneAfterWeatherMaskDragCommit(scene: Scene, drag: WeatherMaskDrag, id: string): Scene | null {
  const action = getWeatherMaskDragCommitAction(scene, drag, id);
  return action.kind === "commit-weather-mask" ? addSceneWeatherMask(scene, action.mask) : null;
}

export function getSceneAfterEnvironmentEffectDragCommit(
  scene: Scene,
  drag: EnvironmentEffectDrag,
  id: string,
  fallbackTuning: Partial<EnvironmentEffectMask> = {}
): Scene | null {
  const action = getEnvironmentEffectDragCommitAction(scene, drag, id, fallbackTuning);
  return action.kind === "commit-environment-effect" ? addEnvironmentEffect(scene, action.effect) : null;
}

export function getSceneAfterFogDragCommit(scene: Scene, drag: FogDrag, id: string): Scene | null {
  const action = getFogDragCommitAction(scene, drag, id);
  return action.kind === "commit-fog" ? addSceneFogShape(scene, action.shape, action.fogPatch) : null;
}
