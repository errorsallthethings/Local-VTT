import type { MapTransform } from "../../../../shared/localvtt";

export function getManualMapScalePatch(scale: number): Partial<MapTransform> {
  return {
    scale,
    scaleX: scale,
    scaleY: scale,
    fitMode: "manual"
  };
}
