import type { Point } from "../../../shared/localvtt";
import { distanceBetweenPoints } from "./drawingGeometry";

export type Rect = { left: number; top: number; right: number; bottom: number };

export function doesRectIntersectCircle(rect: Rect, center: Point, radius: number): boolean {
  const closestX = Math.max(rect.left, Math.min(center.x, rect.right));
  const closestY = Math.max(rect.top, Math.min(center.y, rect.bottom));
  return distanceBetweenPoints(center, { x: closestX, y: closestY }) < radius - 0.0001;
}

export function doRectsIntersect(a: Rect, b: Rect): boolean {
  return a.left < b.right - 0.0001 && a.right > b.left + 0.0001 && a.top < b.bottom - 0.0001 && a.bottom > b.top + 0.0001;
}

export function doesRectIntersectPolygon(rect: Rect, polygon: Point[]): boolean {
  return getPolygonArea(clipPolygonToRect(polygon, rect)) > 0.01;
}

function clipPolygonToRect(polygon: Point[], rect: Rect): Point[] {
  return clipPolygonEdge(
    clipPolygonEdge(
      clipPolygonEdge(
        clipPolygonEdge(polygon, (point) => point.x > rect.left, (start, end) => getLineIntersectionWithVertical(start, end, rect.left)),
        (point) => point.x < rect.right,
        (start, end) => getLineIntersectionWithVertical(start, end, rect.right)
      ),
      (point) => point.y > rect.top,
      (start, end) => getLineIntersectionWithHorizontal(start, end, rect.top)
    ),
    (point) => point.y < rect.bottom,
    (start, end) => getLineIntersectionWithHorizontal(start, end, rect.bottom)
  );
}

function clipPolygonEdge(polygon: Point[], isInside: (point: Point) => boolean, getIntersection: (start: Point, end: Point) => Point): Point[] {
  if (polygon.length === 0) {
    return [];
  }
  const result: Point[] = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentInside = isInside(current);
    const previousInside = isInside(previous);
    if (currentInside) {
      if (!previousInside) {
        result.push(getIntersection(previous, current));
      }
      result.push(current);
    } else if (previousInside) {
      result.push(getIntersection(previous, current));
    }
  }
  return result;
}

function getLineIntersectionWithVertical(start: Point, end: Point, x: number): Point {
  const t = (x - start.x) / getSafeDelta(end.x - start.x);
  return { x, y: start.y + (end.y - start.y) * t };
}

function getLineIntersectionWithHorizontal(start: Point, end: Point, y: number): Point {
  const t = (y - start.y) / getSafeDelta(end.y - start.y);
  return { x: start.x + (end.x - start.x) * t, y };
}

function getSafeDelta(delta: number): number {
  if (Math.abs(delta) >= 0.0001) {
    return delta;
  }
  return delta < 0 ? -0.0001 : 0.0001;
}

function getPolygonArea(points: Point[]): number {
  if (points.length < 3) {
    return 0;
  }
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}
