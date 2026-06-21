import type { EnvironmentEffectMask, Point, Scene, WeatherMask } from "../../../shared/localvtt";
import { distanceBetween, isPointInsideFogShape } from "../tokens/tokenGeometry";

export type MaskHit =
  | { kind: "weather"; mask: WeatherMask }
  | { kind: "fog"; shape: Scene["fog"]["shapes"][number] };

export function isMaskHitVisibleForLayers(maskHit: MaskHit | null, canShowWeather: boolean | undefined, canShowFog: boolean | undefined): boolean {
  return Boolean((maskHit?.kind === "weather" && canShowWeather) || (maskHit?.kind === "fog" && canShowFog));
}

export function getMaskHitAtPoint(scene: Scene, point: Point): MaskHit | null {
  for (const mask of [...scene.weather.masks].reverse()) {
    if ((mask.visible ?? true) && isPointInsideWeatherMask(point, mask)) {
      return { kind: "weather", mask };
    }
  }
  for (const shape of [...scene.fog.shapes].reverse()) {
    if ((shape.visibleInGm ?? shape.visible ?? true) && isPointInsideFogShape(point, shape)) {
      return { kind: "fog", shape };
    }
  }
  return null;
}

export function getEnvironmentEffectAtPoint(scene: Scene, point: Point): EnvironmentEffectMask | null {
  for (const effect of [...scene.environment.effects].reverse()) {
    if ((effect.visibleInGm ?? true) && isPointInsideEnvironmentEffect(point, effect)) {
      return effect;
    }
  }
  return null;
}

export function isPointInsideEnvironmentEffect(point: Point, effect: EnvironmentEffectMask): boolean {
  if (effect.kind === "circle") {
    return Boolean(effect.points[0] && distanceBetween(point, effect.points[0]) <= (effect.radius ?? 0));
  }
  if (effect.kind === "rectangle") {
    if (effect.points.length < 2) {
      return false;
    }
    return isPointInsideAxisAlignedRect(point, effect.points[0], effect.points[1]);
  }
  return isPointInsidePolygon(point, effect.points);
}

export function isPointInsideWeatherMask(point: Point, mask: WeatherMask): boolean {
  if (mask.kind === "circle") {
    return Boolean(mask.points[0] && distanceBetween(point, mask.points[0]) <= (mask.radius ?? 0));
  }
  if (mask.kind === "rectangle") {
    if (mask.points.length < 2) {
      return false;
    }
    return isPointInsideAxisAlignedRect(point, mask.points[0], mask.points[1]);
  }
  return isPointInsidePolygon(point, mask.points);
}

function isPointInsideAxisAlignedRect(point: Point, start: Point, end: Point): boolean {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

export function isPointInsidePolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) {
    return false;
  }
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    if ((current.y > point.y) !== (previous.y > point.y) && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x) {
      inside = !inside;
    }
  }
  return inside;
}
