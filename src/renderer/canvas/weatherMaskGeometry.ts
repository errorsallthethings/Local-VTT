import type { Point, WeatherMask } from "../../shared/localvtt";
import { distanceBetween } from "./tokenGeometry";

export type WeatherMaskShapeKind = WeatherMask["kind"];

export interface WeatherMaskDrag {
  pointerId: number;
  kind: WeatherMaskShapeKind;
  start: Point;
  current: Point;
}

export function isMeaningfulWeatherMaskDrag(drag: WeatherMaskDrag): boolean {
  if (drag.kind === "circle") {
    return distanceBetween(drag.start, drag.current) >= 4;
  }
  return Math.abs(drag.current.x - drag.start.x) >= 4 && Math.abs(drag.current.y - drag.start.y) >= 4;
}
