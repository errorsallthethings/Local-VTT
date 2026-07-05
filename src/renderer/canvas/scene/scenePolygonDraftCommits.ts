import {
  formatDefaultFogShapeName,
  type DrawingElement,
  type EnvironmentEffectMask,
  type EnvironmentEffectType,
  type FogShape,
  type Scene,
  type WeatherMask
} from "../../../shared/localvtt";
import { getDrawingPolygonElementFromDraft, type DrawingPolygonElementStyle } from "../drawings";
import { getEnvironmentEffectFromPolygonDraft, type EnvironmentPolygonDraft } from "../effects";
import { getFogShapeFromPolygonDraft, getFogVisibilityPatchForNewShape, isMeaningfulPolygon, type FogPolygonDraft } from "../fog";
import { getWeatherMaskFromPolygonDraft, type WeatherPolygonDraft } from "../weather";
import { formatDefaultEnvironmentEffectName, formatDefaultWeatherMaskName } from "./sceneContextLabels";

export function getFogPolygonDraftCommit(scene: Scene, draft: FogPolygonDraft, id: string) {
  if (!isMeaningfulPolygon(draft.points)) {
    return null;
  }
  return {
    shape: getFogShapeFromPolygonDraft(
      draft,
      id,
      formatDefaultFogShapeName(draft.operation, "polygon", scene.fog.shapes.length),
      scene.fog.newShapesVisibleInPlayer
    ),
    fogPatch: getFogVisibilityPatchForNewShape(scene.fog, draft.operation)
  };
}

export type FogPolygonDraftCommitAction =
  | { kind: "commit-fog"; shape: FogShape; fogPatch: Partial<Scene["fog"]> }
  | { kind: "none" };

export function getFogPolygonDraftCommitAction(scene: Scene, draft: FogPolygonDraft, id: string): FogPolygonDraftCommitAction {
  const commit = getFogPolygonDraftCommit(scene, draft, id);
  return commit ? { kind: "commit-fog", shape: commit.shape, fogPatch: commit.fogPatch } : { kind: "none" };
}

export function getDrawingPolygonDraftCommit(scene: Scene, draft: { points: Scene["drawings"][number]["points"] }, id: string, style: DrawingPolygonElementStyle) {
  if (!isMeaningfulPolygon(draft.points)) {
    return null;
  }
  return getDrawingPolygonElementFromDraft(draft.points, id, scene.drawings.length, style);
}

export type DrawingPolygonDraftCommitAction =
  | { kind: "commit-drawing"; drawing: DrawingElement }
  | { kind: "none" };

export function getDrawingPolygonDraftCommitAction(
  scene: Scene,
  draft: { points: Scene["drawings"][number]["points"] },
  id: string,
  style: DrawingPolygonElementStyle
): DrawingPolygonDraftCommitAction {
  const drawing = getDrawingPolygonDraftCommit(scene, draft, id, style);
  return drawing ? { kind: "commit-drawing", drawing } : { kind: "none" };
}

export function getWeatherPolygonDraftCommit(scene: Scene, draft: WeatherPolygonDraft, id: string) {
  if (!isMeaningfulPolygon(draft.points)) {
    return null;
  }
  return getWeatherMaskFromPolygonDraft(draft, id, formatDefaultWeatherMaskName(scene.weather.masks.length));
}

export type WeatherPolygonDraftCommitAction =
  | { kind: "commit-weather-mask"; mask: WeatherMask }
  | { kind: "none" };

export function getWeatherPolygonDraftCommitAction(scene: Scene, draft: WeatherPolygonDraft, id: string): WeatherPolygonDraftCommitAction {
  const mask = getWeatherPolygonDraftCommit(scene, draft, id);
  return mask ? { kind: "commit-weather-mask", mask } : { kind: "none" };
}

export function getEnvironmentPolygonDraftCommit(
  scene: Scene,
  draft: EnvironmentPolygonDraft,
  id: string,
  effectType: EnvironmentEffectType,
  feather: number,
  fallbackTuning: Partial<EnvironmentEffectMask> = {}
) {
  if (!isMeaningfulPolygon(draft.points)) {
    return null;
  }
  return getEnvironmentEffectFromPolygonDraft(
    draft,
    id,
    formatDefaultEnvironmentEffectName(effectType, scene.environment.effects.length),
    effectType,
    feather,
    fallbackTuning
  );
}

export type EnvironmentPolygonDraftCommitAction =
  | { kind: "commit-environment-effect"; effect: EnvironmentEffectMask }
  | { kind: "none" };

export function getEnvironmentPolygonDraftCommitAction(
  scene: Scene,
  draft: EnvironmentPolygonDraft,
  id: string,
  effectType: EnvironmentEffectType,
  feather: number,
  fallbackTuning: Partial<EnvironmentEffectMask> = {}
): EnvironmentPolygonDraftCommitAction {
  const effect = getEnvironmentPolygonDraftCommit(scene, draft, id, effectType, feather, fallbackTuning);
  return effect ? { kind: "commit-environment-effect", effect } : { kind: "none" };
}
