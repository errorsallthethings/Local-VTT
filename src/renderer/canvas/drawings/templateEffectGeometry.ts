import type { DrawingElement, GridSettings, Point } from "../../../shared/localvtt";
import { distanceBetweenPoints } from "./drawingGeometry";
import { getLineTemplateEffectWidthPixels } from "./templateLabels";

export function getLineTemplateCorridorPoints(drawing: DrawingElement, scale = 1, grid?: GridSettings): Point[] | null {
  const [start, end] = drawing.points;
  if (!start || !end) {
    return null;
  }
  const length = distanceBetweenPoints(start, end);
  if (length <= 0.001) {
    return null;
  }
  const halfWidth = (getLineTemplateEffectWidthPixels(drawing, grid) / 2) * scale;
  if (halfWidth <= 0) {
    return null;
  }
  const normal = { x: (-(end.y - start.y) / length) * halfWidth, y: ((end.x - start.x) / length) * halfWidth };
  return [
    { x: start.x + normal.x, y: start.y + normal.y },
    { x: end.x + normal.x, y: end.y + normal.y },
    { x: end.x - normal.x, y: end.y - normal.y },
    { x: start.x - normal.x, y: start.y - normal.y }
  ];
}

export function getRectanglePathPoints(points: Point[]): Point[] {
  const [start, end] = points;
  if (!start || !end) {
    return [];
  }
  return [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x, y: end.y }
  ];
}

export function scalePointsToCenter(points: Point[], scale: number): Point[] {
  if (points.length === 0) {
    return [];
  }
  const center = {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length
  };
  return points.map((point) => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale
  }));
}

export function pointsSeed(points: Point[]): string {
  return points.map((point) => `${Math.round(point.x * 10)},${Math.round(point.y * 10)}`).join("|");
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}
