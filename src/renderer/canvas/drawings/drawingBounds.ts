import type { DrawingElement, GridSettings, Point } from "../../../shared/localvtt";
import { distanceBetweenPoints, getConeTriangle, getTriangle } from "./drawingGeometry";
import { getLineTemplateCorridorPoints } from "./templateEffectGeometry";

export type DrawingBounds = { left: number; top: number; right: number; bottom: number };

export function getDrawingBounds(drawing: DrawingElement, grid?: GridSettings): DrawingBounds | null {
  const points = drawing.measurementLabelVisible && drawing.kind === "line" ? (getLineTemplateCorridorPoints(drawing, 1, grid) ?? drawing.points) : getShapePoints(drawing);
  if (points.length === 0) {
    return null;
  }
  const strokeInset = Math.max(0, drawing.strokeWidth / 2);
  if (drawing.kind === "circle" && drawing.points[0] && drawing.points[1]) {
    const radiusX = distanceBetweenPoints(drawing.points[0], drawing.points[1]);
    const radiusY = radiusX;
    return {
      left: drawing.points[0].x - radiusX - strokeInset,
      top: drawing.points[0].y - radiusY - strokeInset,
      right: drawing.points[0].x + radiusX + strokeInset,
      bottom: drawing.points[0].y + radiusY + strokeInset
    };
  }
  return {
    left: Math.min(...points.map((point) => point.x)) - strokeInset,
    top: Math.min(...points.map((point) => point.y)) - strokeInset,
    right: Math.max(...points.map((point) => point.x)) + strokeInset,
    bottom: Math.max(...points.map((point) => point.y)) + strokeInset
  };
}

function getShapePoints(drawing: DrawingElement): Point[] {
  if (drawing.kind === "ellipse" && drawing.points[0] && drawing.points[1]) {
    return getEllipseBoundsPoints(drawing.points);
  }
  if (drawing.kind === "cone") {
    return getConeTriangle(drawing.points) ?? drawing.points;
  }
  if (drawing.kind === "triangle") {
    return getTriangle(drawing.points) ?? drawing.points;
  }
  return drawing.points;
}

function getEllipseBoundsPoints(points: Point[]): Point[] {
  const [center, edge, axis] = points;
  const radiusX = Math.max(0.5, Math.hypot(edge.x - center.x, edge.y - center.y));
  const radiusY = axis ? Math.max(0.5, Math.hypot(axis.x - center.x, axis.y - center.y)) : Math.max(0.5, Math.abs(edge.y - center.y));
  const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const samples: Point[] = [];
  for (let index = 0; index < 16; index += 1) {
    const angle = (Math.PI * 2 * index) / 16;
    const x = Math.cos(angle) * radiusX;
    const y = Math.sin(angle) * radiusY;
    samples.push({
      x: center.x + x * cos - y * sin,
      y: center.y + x * sin + y * cos
    });
  }
  return samples;
}
