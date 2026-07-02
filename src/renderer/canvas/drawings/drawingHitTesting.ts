import type { DrawingElement, GridSettings, Point } from "../../../shared/localvtt";
import { distanceBetweenPoints, distanceToSegment, getConeTriangle, getTriangle, isPointInPolygon, isPointInTriangle } from "./drawingGeometry";
import { getLineTemplateCorridorPoints } from "./templateEffectGeometry";

export function getDrawingAtPoint(drawings: DrawingElement[], point: Point, hitRadius = 8, grid?: GridSettings): DrawingElement | null {
  for (const drawing of [...drawings].reverse()) {
    if (!isDrawingVisible(drawing, "gm")) {
      continue;
    }
    if (isPointNearDrawing(drawing, point, hitRadius, grid)) {
      return drawing;
    }
  }
  return null;
}

export function isDrawingVisible(drawing: DrawingElement, mode: "gm" | "player"): boolean {
  return mode === "gm" ? drawing.visibleInGm !== false : drawing.visibleInPlayer !== false;
}

function isPointNearDrawing(drawing: DrawingElement, point: Point, hitRadius: number, grid?: GridSettings): boolean {
  const points = drawing.points;
  if (points.length < 2) {
    return false;
  }
  const visualHitRadius = Math.max(hitRadius, drawing.strokeWidth / 2 + hitRadius);
  if (drawing.kind === "circle") {
    const radius = distanceBetweenPoints(points[0], points[1]);
    return Math.abs(distanceBetweenPoints(points[0], point) - radius) <= visualHitRadius || distanceBetweenPoints(points[0], point) <= radius;
  }
  if (drawing.kind === "ellipse") {
    return isPointNearEllipse(drawing, point, visualHitRadius);
  }
  if (drawing.kind === "rectangle") {
    if (points.length >= 4) {
      return isPointInPolygon(point, points);
    }
    const minX = Math.min(points[0].x, points[1].x) - visualHitRadius;
    const maxX = Math.max(points[0].x, points[1].x) + visualHitRadius;
    const minY = Math.min(points[0].y, points[1].y) - visualHitRadius;
    const maxY = Math.max(points[0].y, points[1].y) + visualHitRadius;
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(points);
    return triangle ? isPointInTriangle(point, triangle[0], triangle[1], triangle[2]) : false;
  }
  if (drawing.kind === "triangle") {
    const triangle = getTriangle(points);
    return triangle ? isPointInTriangle(point, triangle[0], triangle[1], triangle[2]) : false;
  }
  if (drawing.kind === "polygon") {
    return isPointInPolygon(point, points);
  }
  if (drawing.measurementLabelVisible && drawing.kind === "line") {
    const corridor = getLineTemplateCorridorPoints(drawing, 1, grid);
    if (corridor) {
      return isPointInPolygon(point, corridor);
    }
  }
  return points.some((candidate, index) => {
    const next = points[index + 1];
    return next ? distanceToSegment(point, candidate, next) <= visualHitRadius : false;
  });
}

function isPointNearEllipse(drawing: DrawingElement, point: Point, hitRadius: number): boolean {
  const [center, edge, axis] = drawing.points;
  if (!center || !edge) {
    return false;
  }
  const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const deltaX = point.x - center.x;
  const deltaY = point.y - center.y;
  const localX = deltaX * cos - deltaY * sin;
  const localY = deltaX * sin + deltaY * cos;
  const radiusX = Math.max(0.5, Math.hypot(edge.x - center.x, edge.y - center.y));
  const radiusY = axis ? Math.max(0.5, Math.hypot(axis.x - center.x, axis.y - center.y)) : Math.max(0.5, Math.abs(edge.y - center.y));
  const normalizedX = localX / radiusX;
  const normalizedY = localY / radiusY;
  const normalizedDistance = normalizedX ** 2 + normalizedY ** 2;
  const tolerance = Math.max(hitRadius / radiusX, hitRadius / radiusY);
  return normalizedDistance <= 1 || Math.abs(normalizedDistance - 1) <= tolerance;
}
