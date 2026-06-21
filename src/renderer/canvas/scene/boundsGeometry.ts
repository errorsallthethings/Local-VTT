import type { EnvironmentEffectMask, Point, WeatherMask } from "../../../shared/localvtt";

export interface BoundsRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getPointBounds(points: Point[]): BoundsRect {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export function getEnvironmentEffectBounds(effect: EnvironmentEffectMask): BoundsRect | null {
  if (effect.kind === "circle" && effect.points[0] && effect.radius) {
    return {
      x: effect.points[0].x - effect.radius,
      y: effect.points[0].y - effect.radius,
      width: effect.radius * 2,
      height: effect.radius * 2
    };
  }
  if (effect.points.length === 0) {
    return null;
  }
  return getPointBounds(effect.points);
}

export function getWeatherMaskBounds(mask: WeatherMask): BoundsRect | null {
  if (mask.kind === "circle" && mask.points[0] && mask.radius) {
    return {
      x: mask.points[0].x - mask.radius,
      y: mask.points[0].y - mask.radius,
      width: mask.radius * 2,
      height: mask.radius * 2
    };
  }
  if (mask.kind === "rectangle" && mask.points.length >= 2) {
    return {
      x: Math.min(mask.points[0].x, mask.points[1].x),
      y: Math.min(mask.points[0].y, mask.points[1].y),
      width: Math.max(1, Math.abs(mask.points[1].x - mask.points[0].x)),
      height: Math.max(1, Math.abs(mask.points[1].y - mask.points[0].y))
    };
  }
  if (mask.points.length === 0) {
    return null;
  }
  const bounds = getPointBounds(mask.points);
  return {
    ...bounds,
    width: Math.max(1, bounds.width),
    height: Math.max(1, bounds.height)
  };
}
