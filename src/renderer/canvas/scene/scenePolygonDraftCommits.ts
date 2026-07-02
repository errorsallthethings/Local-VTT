import { formatDefaultFogShapeName, type EnvironmentEffectMask, type EnvironmentEffectType, type Scene } from "../../../shared/localvtt";
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

export function getDrawingPolygonDraftCommit(scene: Scene, draft: { points: Scene["drawings"][number]["points"] }, id: string, style: DrawingPolygonElementStyle) {
  if (!isMeaningfulPolygon(draft.points)) {
    return null;
  }
  return getDrawingPolygonElementFromDraft(draft.points, id, scene.drawings.length, style);
}

export function getWeatherPolygonDraftCommit(scene: Scene, draft: WeatherPolygonDraft, id: string) {
  if (!isMeaningfulPolygon(draft.points)) {
    return null;
  }
  return getWeatherMaskFromPolygonDraft(draft, id, formatDefaultWeatherMaskName(scene.weather.masks.length));
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
