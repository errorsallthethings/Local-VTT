import { formatDefaultFogShapeName, type EnvironmentEffectMask, type Scene } from "../../../shared/localvtt";
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

export function getWeatherMaskDragCommit(scene: Scene, drag: WeatherMaskDrag, id: string) {
  if (!isMeaningfulWeatherMaskDrag(drag)) {
    return null;
  }
  return getWeatherMaskFromDrag(drag, id, formatDefaultWeatherMaskName(scene.weather.masks.length));
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
