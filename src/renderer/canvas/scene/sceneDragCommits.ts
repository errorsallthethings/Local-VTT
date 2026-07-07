import {
  formatDefaultFogShapeName,
  type DrawingElement,
  type EnvironmentEffectMask,
  type FogShape,
  type Scene,
  type WeatherMask
} from "../../../shared/localvtt";
import { getDrawingElementFromPreview, isMeaningfulDrawingPreview, type DrawingPreview } from "../drawings";
import { getEnvironmentEffectFromDrag, isMeaningfulEnvironmentEffectDrag, type EnvironmentEffectDrag } from "../effects";
import { getFogShapeFromDrag, getFogVisibilityPatchForNewShape, isMeaningfulFogDrag, type FogDrag } from "../fog";
import { getWeatherMaskFromDrag, isMeaningfulWeatherMaskDrag, type WeatherMaskDrag } from "../weather";
import { formatDefaultEnvironmentEffectName, formatDefaultWeatherMaskName } from "./sceneContextLabels";

export function getDrawingDragCommit(scene: Scene, preview: DrawingPreview, id: string) {
  if (!isMeaningfulDrawingPreview(preview)) {
    return null;
  }
  return getDrawingElementFromPreview(preview, id, scene.drawings.length);
}

export type DrawingDragCommitAction =
  | { kind: "commit-drawing"; drawing: DrawingElement }
  | { kind: "none" };

export function getDrawingDragCommitAction(scene: Scene, preview: DrawingPreview, id: string): DrawingDragCommitAction {
  const drawing = getDrawingDragCommit(scene, preview, id);
  return drawing ? { kind: "commit-drawing", drawing } : { kind: "none" };
}

export function getWeatherMaskDragCommit(scene: Scene, drag: WeatherMaskDrag, id: string) {
  if (!isMeaningfulWeatherMaskDrag(drag)) {
    return null;
  }
  return getWeatherMaskFromDrag(drag, id, formatDefaultWeatherMaskName(scene.weather.masks.length));
}

export type WeatherMaskDragCommitAction =
  | { kind: "commit-weather-mask"; mask: WeatherMask }
  | { kind: "none" };

export function getWeatherMaskDragCommitAction(scene: Scene, drag: WeatherMaskDrag, id: string): WeatherMaskDragCommitAction {
  const mask = getWeatherMaskDragCommit(scene, drag, id);
  return mask ? { kind: "commit-weather-mask", mask } : { kind: "none" };
}

export function getEnvironmentEffectDragCommit(scene: Scene, drag: EnvironmentEffectDrag, id: string, fallbackTuning: Partial<EnvironmentEffectMask> = {}) {
  if (!isMeaningfulEnvironmentEffectDrag(drag)) {
    return null;
  }
  return getEnvironmentEffectFromDrag(
    drag,
    id,
    formatDefaultEnvironmentEffectName(drag.effect, scene.environment.effects.length),
    fallbackTuning
  );
}

export type EnvironmentEffectDragCommitAction =
  | { kind: "commit-environment-effect"; effect: EnvironmentEffectMask }
  | { kind: "none" };

export function getEnvironmentEffectDragCommitAction(
  scene: Scene,
  drag: EnvironmentEffectDrag,
  id: string,
  fallbackTuning: Partial<EnvironmentEffectMask> = {}
): EnvironmentEffectDragCommitAction {
  const effect = getEnvironmentEffectDragCommit(scene, drag, id, fallbackTuning);
  return effect ? { kind: "commit-environment-effect", effect } : { kind: "none" };
}

export function getFogDragCommit(scene: Scene, drag: FogDrag, id: string) {
  if (!isMeaningfulFogDrag(drag)) {
    return null;
  }
  return {
    shape: getFogShapeFromDrag(
      drag,
      id,
      formatDefaultFogShapeName(drag.operation, drag.kind, scene.fog.shapes.length),
      scene.fog.newShapesVisibleInPlayer
    ),
    fogPatch: getFogVisibilityPatchForNewShape(scene.fog, drag.operation)
  };
}

export type FogDragCommitAction =
  | { kind: "commit-fog"; shape: FogShape; fogPatch: Partial<Scene["fog"]> }
  | { kind: "none" };

export function getFogDragCommitAction(scene: Scene, drag: FogDrag, id: string): FogDragCommitAction {
  const commit = getFogDragCommit(scene, drag, id);
  return commit ? { kind: "commit-fog", shape: commit.shape, fogPatch: commit.fogPatch } : { kind: "none" };
}
