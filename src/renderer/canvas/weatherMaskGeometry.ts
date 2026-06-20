import type { Point, WeatherMask } from "../../shared/localvtt";
import { distanceBetween } from "./tokenGeometry";
import type { ScreenRect } from "./viewportGeometry";

export type WeatherMaskShapeKind = WeatherMask["kind"];

export interface WeatherMaskDrag {
  pointerId: number;
  kind: WeatherMaskShapeKind;
  start: Point;
  current: Point;
}

export type WeatherPolygonDraft = {
  points: Point[];
  current?: Point;
};

export function isMeaningfulWeatherMaskDrag(drag: WeatherMaskDrag): boolean {
  if (drag.kind === "circle") {
    return distanceBetween(drag.start, drag.current) >= 4;
  }
  return Math.abs(drag.current.x - drag.start.x) >= 4 && Math.abs(drag.current.y - drag.start.y) >= 4;
}

export function getWeatherMaskDragRect(drag: WeatherMaskDrag): ScreenRect {
  return {
    x: Math.min(drag.start.x, drag.current.x),
    y: Math.min(drag.start.y, drag.current.y),
    width: Math.abs(drag.current.x - drag.start.x),
    height: Math.abs(drag.current.y - drag.start.y)
  };
}

export function getWeatherMaskRect(mask: WeatherMask): ScreenRect | null {
  if (mask.kind !== "rectangle" || mask.points.length < 2) {
    return null;
  }
  return {
    x: Math.min(mask.points[0].x, mask.points[1].x),
    y: Math.min(mask.points[0].y, mask.points[1].y),
    width: Math.abs(mask.points[1].x - mask.points[0].x),
    height: Math.abs(mask.points[1].y - mask.points[0].y)
  };
}

export function getWeatherMaskFromDrag(drag: WeatherMaskDrag, id: string, name: string): WeatherMask {
  return {
    id,
    name,
    kind: drag.kind,
    points: drag.kind === "circle" ? [drag.start] : [drag.start, drag.current],
    radius: drag.kind === "circle" ? distanceBetween(drag.start, drag.current) : undefined,
    visible: true
  };
}

export function getWeatherMaskFromPolygonDraft(draft: WeatherPolygonDraft, id: string, name: string): WeatherMask {
  return {
    id,
    name,
    kind: "polygon",
    points: draft.points,
    visible: true
  };
}

export function getVisibleWeatherMasks(masks: WeatherMask[]): WeatherMask[] {
  return masks.filter((mask) => mask.visible !== false);
}
