import type { Point, Scene, Token, WeatherMask } from "../../shared/localvtt";

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function pointsToSelectionRect(start: Point, end: Point): SelectionRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  };
}

export function isPointInSelectionRect(point: Point, rect: SelectionRect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

export function isTokenInSelectionRect(token: Token, rect: SelectionRect): boolean {
  const center = { x: token.position.x + token.size.width / 2, y: token.position.y + token.size.height / 2 };
  return isPointInSelectionRect(center, rect);
}

export function isDrawingInSelectionRect(drawing: { points: Point[] }, rect: SelectionRect): boolean {
  return drawing.points.some((point) => isPointInSelectionRect(point, rect));
}

export function isWeatherMaskInSelectionRect(mask: WeatherMask, rect: SelectionRect): boolean {
  if (mask.kind === "circle" && mask.points[0]) {
    return isPointInSelectionRect(mask.points[0], rect);
  }
  return mask.points.some((point) => isPointInSelectionRect(point, rect));
}

export function isFogShapeInSelectionRect(shape: Scene["fog"]["shapes"][number], rect: SelectionRect): boolean {
  return shape.points.some((point) => isPointInSelectionRect(point, rect));
}
