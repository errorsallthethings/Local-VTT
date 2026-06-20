import type { Point, Scene } from "../../shared/localvtt";
import type { Camera } from "./camera";
import type { DrawingResizeHandle } from "./canvasInteraction";
import { getDrawingBounds } from "./drawingRenderer";
import { distanceBetween } from "./tokenGeometry";

export type DrawingBounds = { left: number; top: number; right: number; bottom: number };
export type DrawingPointSnapshot = Map<string, Point[]>;

export function getDrawingRotationHandleAtPoint(
  drawings: Scene["drawings"],
  selectedDrawingIds: string[],
  point: Point,
  camera: Camera
): { bounds: DrawingBounds; center: Point } | null {
  const bounds = getSelectedResizableDrawingBounds(drawings, selectedDrawingIds);
  if (!bounds) {
    return null;
  }
  const handlePoint = getDrawingRotationHandle(bounds, camera);
  const hitRadius = Math.max(9, 9 / Math.max(0.1, camera.zoom));
  if (distanceBetween(handlePoint, point) > hitRadius) {
    return null;
  }
  return {
    bounds,
    center: {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2
    }
  };
}

export function getDrawingResizeHandleAtPoint(
  drawings: Scene["drawings"],
  selectedDrawingIds: string[],
  point: Point,
  camera: Camera
): { handle: DrawingResizeHandle; bounds: DrawingBounds } | null {
  const bounds = getSelectedResizableDrawingBounds(drawings, selectedDrawingIds);
  if (!bounds) {
    return null;
  }
  const hitRadius = Math.max(8, 8 / Math.max(0.1, camera.zoom));
  for (const handle of getDrawingResizeHandles(bounds)) {
    if (distanceBetween(handle.point, point) <= hitRadius) {
      return { handle: handle.handle, bounds };
    }
  }
  return null;
}

export function getDrawingRotationHandle(bounds: DrawingBounds, camera: Camera): Point {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: bounds.top - 30 / Math.max(0.1, camera.zoom)
  };
}

export function getSelectedResizableDrawingBounds(drawings: Scene["drawings"], selectedDrawingIds: string[]): DrawingBounds | null {
  const selectedIds = new Set(selectedDrawingIds);
  const bounds = drawings
    .filter((drawing) => selectedIds.has(drawing.id) && !drawing.measurementLabelVisible)
    .map((drawing) => getDrawingBounds(drawing))
    .filter((drawingBounds): drawingBounds is DrawingBounds => Boolean(drawingBounds));
  if (bounds.length === 0) {
    return null;
  }
  return getCombinedDrawingBounds(bounds);
}

export function getDrawingGroupBounds(drawings: Scene["drawings"]): DrawingBounds | null {
  const bounds = drawings.map((drawing) => getDrawingBounds(drawing)).filter((drawingBounds): drawingBounds is DrawingBounds => Boolean(drawingBounds));
  if (bounds.length === 0) {
    return null;
  }
  return getCombinedDrawingBounds(bounds);
}

export function getDrawingPointSnapshot(drawings: Scene["drawings"], drawingIds: string[], options: { includeTemplates?: boolean } = {}): DrawingPointSnapshot {
  const ids = new Set(drawingIds);
  return new Map(
    drawings
      .filter((drawing) => ids.has(drawing.id) && (options.includeTemplates || !drawing.measurementLabelVisible))
      .map((drawing) => [drawing.id, drawing.points.map((point) => ({ ...point }))])
  );
}

export function getDrawingGroupSnapAnchor(drawings: Scene["drawings"], drawingIds: string[], fallback: Point): Point {
  const ids = new Set(drawingIds);
  const bounds = getDrawingGroupBounds(drawings.filter((drawing) => ids.has(drawing.id)));
  return bounds
    ? {
        x: (bounds.left + bounds.right) / 2,
        y: (bounds.top + bounds.bottom) / 2
      }
    : fallback;
}

function getCombinedDrawingBounds(bounds: DrawingBounds[]): DrawingBounds {
  return {
    left: Math.min(...bounds.map((drawingBounds) => drawingBounds.left)),
    top: Math.min(...bounds.map((drawingBounds) => drawingBounds.top)),
    right: Math.max(...bounds.map((drawingBounds) => drawingBounds.right)),
    bottom: Math.max(...bounds.map((drawingBounds) => drawingBounds.bottom))
  };
}

export function getDrawingResizeHandles(bounds: DrawingBounds): Array<{ handle: DrawingResizeHandle; point: Point }> {
  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;
  return [
    { handle: "nw", point: { x: bounds.left, y: bounds.top } },
    { handle: "n", point: { x: centerX, y: bounds.top } },
    { handle: "ne", point: { x: bounds.right, y: bounds.top } },
    { handle: "e", point: { x: bounds.right, y: centerY } },
    { handle: "se", point: { x: bounds.right, y: bounds.bottom } },
    { handle: "s", point: { x: centerX, y: bounds.bottom } },
    { handle: "sw", point: { x: bounds.left, y: bounds.bottom } },
    { handle: "w", point: { x: bounds.left, y: centerY } }
  ];
}

export function resizeDrawingPoints(drawing: Scene["drawings"][number], bounds: DrawingBounds, handle: DrawingResizeHandle, current: Point, aspectLocked: boolean): Point[] {
  if (drawing.kind === "circle" || drawing.kind === "ellipse" || drawing.kind === "triangle") {
    return resizeCenterLockedDrawingPoints(drawing, handle, current, aspectLocked);
  }
  const points = drawing.points;
  const anchorX = handle.includes("w") ? bounds.right : handle.includes("e") ? bounds.left : (bounds.left + bounds.right) / 2;
  const anchorY = handle.includes("n") ? bounds.bottom : handle.includes("s") ? bounds.top : (bounds.top + bounds.bottom) / 2;
  const originalWidth = Math.max(1, bounds.right - bounds.left);
  const originalHeight = Math.max(1, bounds.bottom - bounds.top);
  let scaleX = handle === "n" || handle === "s" ? 1 : (current.x - anchorX) / ((handle.includes("w") ? bounds.left : bounds.right) - anchorX || 1);
  let scaleY = handle === "e" || handle === "w" ? 1 : (current.y - anchorY) / ((handle.includes("n") ? bounds.top : bounds.bottom) - anchorY || 1);

  if (aspectLocked && handle.length === 2) {
    const magnitude = Math.max(Math.abs(scaleX), Math.abs(scaleY));
    scaleX = Math.sign(scaleX || 1) * magnitude;
    scaleY = Math.sign(scaleY || 1) * magnitude;
  }

  const minScaleX = 12 / originalWidth;
  const minScaleY = 12 / originalHeight;
  if (Math.abs(scaleX) < minScaleX) {
    scaleX = Math.sign(scaleX || 1) * minScaleX;
  }
  if (Math.abs(scaleY) < minScaleY) {
    scaleY = Math.sign(scaleY || 1) * minScaleY;
  }

  return points.map((point) => ({
    x: anchorX + (point.x - anchorX) * scaleX,
    y: anchorY + (point.y - anchorY) * scaleY
  }));
}

function resizeCenterLockedDrawingPoints(drawing: Scene["drawings"][number], handle: DrawingResizeHandle, current: Point, aspectLocked: boolean): Point[] {
  const bounds = getDrawingBounds(drawing);
  if (!bounds) {
    return drawing.points;
  }
  const center = {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2
  };
  if (drawing.kind === "circle" && drawing.points[0] && drawing.points[1]) {
    const originalRadius = Math.max(1, distanceBetween(drawing.points[0], drawing.points[1]));
    const radius =
      handle === "n" || handle === "s"
        ? Math.abs(current.y - center.y)
        : handle === "e" || handle === "w"
          ? Math.abs(current.x - center.x)
          : Math.max(Math.abs(current.x - center.x), Math.abs(current.y - center.y));
    const safeRadius = Math.max(6, radius || originalRadius);
    return [center, { x: center.x + safeRadius, y: center.y }];
  }

  if (drawing.kind === "ellipse" && drawing.points[0] && drawing.points[1]) {
    const resizedPoints = resizeCenterLockedPoints(getEllipseAxisPoints(drawing.points), bounds, handle, current, aspectLocked);
    return [center, resizedPoints[1] ?? drawing.points[1], resizedPoints[2] ?? { x: center.x, y: drawing.points[1].y }];
  }

  if (drawing.kind === "triangle") {
    const trianglePoints = getTriangleDrawingPoints(drawing.points);
    return trianglePoints ? resizeCenterLockedPoints(trianglePoints, bounds, handle, current, aspectLocked) : drawing.points;
  }

  return resizeCenterLockedPoints(drawing.points, bounds, handle, current, aspectLocked);
}

export function getTriangleDrawingPoints(points: Point[]): [Point, Point, Point] | null {
  if (points.length >= 3) {
    return [points[0], points[1], points[2]];
  }
  if (points.length < 2) {
    return null;
  }
  const [start, end] = points;
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return [
    start,
    end,
    {
      x: midpoint.x - dy * 0.866,
      y: midpoint.y + dx * 0.866
    }
  ];
}

export function rotatePoints(points: Point[], center: Point, angle: number): Point[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map((point) => {
    const x = point.x - center.x;
    const y = point.y - center.y;
    return {
      x: center.x + x * cos - y * sin,
      y: center.y + x * sin + y * cos
    };
  });
}

export function rotateDrawingPoints(drawing: Scene["drawings"][number], center: Point, angle: number): Point[] {
  if (drawing.kind === "rectangle" && drawing.points.length === 2) {
    return rotatePoints(getRectangleDrawingPoints(drawing.points), center, angle);
  }
  if (drawing.kind === "ellipse" && drawing.points[0] && drawing.points[1]) {
    return rotatePoints(getEllipseAxisPoints(drawing.points), center, angle);
  }
  if (drawing.kind === "triangle") {
    const trianglePoints = getTriangleDrawingPoints(drawing.points);
    return trianglePoints ? rotatePoints(trianglePoints, center, angle) : drawing.points;
  }
  return rotatePoints(drawing.points, center, angle);
}

export function getRectangleDrawingPoints(points: Point[]): Point[] {
  const [start, end] = points;
  return [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x, y: end.y }
  ];
}

export function getEllipseAxisPoints(points: Point[]): Point[] {
  const [center, edge, axis] = points;
  if (axis) {
    return [center, edge, axis];
  }
  return [
    center,
    { x: edge.x, y: center.y },
    { x: center.x, y: edge.y }
  ];
}

function resizeCenterLockedPoints(points: Point[], bounds: DrawingBounds, handle: DrawingResizeHandle, current: Point, aspectLocked: boolean): Point[] {
  const center = {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2
  };
  const originalWidth = Math.max(1, bounds.right - bounds.left);
  const originalHeight = Math.max(1, bounds.bottom - bounds.top);
  let scaleX = handle === "n" || handle === "s" ? 1 : ((current.x - center.x) * 2) / ((handle.includes("w") ? bounds.left : bounds.right) - center.x || 1);
  let scaleY = handle === "e" || handle === "w" ? 1 : ((current.y - center.y) * 2) / ((handle.includes("n") ? bounds.top : bounds.bottom) - center.y || 1);
  if (aspectLocked && handle.length === 2) {
    const magnitude = Math.max(Math.abs(scaleX), Math.abs(scaleY));
    scaleX = Math.sign(scaleX || 1) * magnitude;
    scaleY = Math.sign(scaleY || 1) * magnitude;
  }

  const minScaleX = 12 / originalWidth;
  const minScaleY = 12 / originalHeight;
  if (Math.abs(scaleX) < minScaleX) {
    scaleX = Math.sign(scaleX || 1) * minScaleX;
  }
  if (Math.abs(scaleY) < minScaleY) {
    scaleY = Math.sign(scaleY || 1) * minScaleY;
  }

  return points.map((point) => ({
    x: center.x + (point.x - center.x) * scaleX,
    y: center.y + (point.y - center.y) * scaleY
  }));
}
