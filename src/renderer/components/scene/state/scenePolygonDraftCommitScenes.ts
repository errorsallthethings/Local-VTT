import type { EnvironmentEffectMask, EnvironmentEffectType, Scene } from "../../../../shared/localvtt";
import {
  getDrawingPolygonDraftCommitAction,
  getEnvironmentPolygonDraftCommitAction,
  getFogPolygonDraftCommitAction,
  getWeatherPolygonDraftCommitAction
} from "../../../canvas/scene";
import type { DrawingPolygonElementStyle } from "../../../canvas/drawings";
import type { EnvironmentPolygonDraft } from "../../../canvas/effects";
import type { FogPolygonDraft } from "../../../canvas/fog";
import type { WeatherPolygonDraft } from "../../../canvas/weather";
import { addEnvironmentEffect, addSceneDrawing, addSceneFogShape, addSceneWeatherMask } from "../../../lib/scene";

export function getSceneAfterFogPolygonDraftCommit(scene: Scene, draft: FogPolygonDraft, id: string): Scene | null {
  const action = getFogPolygonDraftCommitAction(scene, draft, id);
  return action.kind === "commit-fog" ? addSceneFogShape(scene, action.shape, action.fogPatch) : null;
}

export function getSceneAfterDrawingPolygonDraftCommit(
  scene: Scene,
  draft: { points: Scene["drawings"][number]["points"] },
  id: string,
  style: DrawingPolygonElementStyle
): Scene | null {
  const action = getDrawingPolygonDraftCommitAction(scene, draft, id, style);
  return action.kind === "commit-drawing" ? addSceneDrawing(scene, action.drawing) : null;
}

export function getSceneAfterWeatherPolygonDraftCommit(scene: Scene, draft: WeatherPolygonDraft, id: string): Scene | null {
  const action = getWeatherPolygonDraftCommitAction(scene, draft, id);
  return action.kind === "commit-weather-mask" ? addSceneWeatherMask(scene, action.mask) : null;
}

export function getSceneAfterEnvironmentPolygonDraftCommit(
  scene: Scene,
  draft: EnvironmentPolygonDraft,
  id: string,
  effectType: EnvironmentEffectType,
  feather: number,
  fallbackTuning: Partial<EnvironmentEffectMask> = {}
): Scene | null {
  const action = getEnvironmentPolygonDraftCommitAction(scene, draft, id, effectType, feather, fallbackTuning);
  return action.kind === "commit-environment-effect" ? addEnvironmentEffect(scene, action.effect) : null;
}
