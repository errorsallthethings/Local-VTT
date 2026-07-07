import type { Point, Scene } from "../../../shared/localvtt";
import type { Camera } from "../core/camera";
import type { DrawingResizeHandle } from "../core/canvasInteraction";
import { getDrawingBounds, type DrawingBounds } from "./drawingBounds";
import { distanceBetween } from "../tokens/tokenGeometry";
import {
  getDrawingPointSnapshot,
  type DrawingPointSnapshot
} from "./drawingPointSnapshot";
import { getDrawingResizeHandles, resizeDrawingPoints, rotateDrawingPoints } from "./drawingTransformGeometry";

export type DrawingTransformDragStart =
  | {
      kind: "rotate";
      state: {
        pointerId: number;
        center: Point;
        startAngle: number;
        groupStartPoints: DrawingPointSnapshot;
      };
      preview: DrawingPointSnapshot;
    }
  | {
      kind: "resize";
      state: {
        pointerId: number;
        handle: DrawingResizeHandle;
        bounds: DrawingBounds;
        groupStartPoints: DrawingPointSnapshot;
      };
      preview: DrawingPointSnapshot;
    };

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

export function getDrawingTransformDragStart(
  drawings: Scene["drawings"],
  selectedDrawingIds: string[],
  point: Point,
  camera: Camera,
  pointerId: number
): DrawingTransformDragStart | null {
  const rotateTarget = getDrawingRotationHandleAtPoint(drawings, selectedDrawingIds, point, camera);
  if (rotateTarget) {
    const groupStartPoints = getDrawingPointSnapshot(drawings, selectedDrawingIds);
    return {
      kind: "rotate",
      state: {
        pointerId,
        center: rotateTarget.center,
        startAngle: Math.atan2(point.y - rotateTarget.center.y, point.x - rotateTarget.center.x),
        groupStartPoints
      },
      preview: groupStartPoints
    };
  }

  const resizeTarget = getDrawingResizeHandleAtPoint(drawings, selectedDrawingIds, point, camera);
  if (resizeTarget) {
    const groupStartPoints = getDrawingPointSnapshot(drawings, selectedDrawingIds);
    return {
      kind: "resize",
      state: {
        pointerId,
        handle: resizeTarget.handle,
        bounds: resizeTarget.bounds,
        groupStartPoints
      },
      preview: groupStartPoints
    };
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

export function getResizedDrawingPointSnapshot(
  drawings: Scene["drawings"],
  groupStartPoints: DrawingPointSnapshot,
  bounds: DrawingBounds,
  handle: DrawingResizeHandle,
  current: Point,
  aspectLocked: boolean
): DrawingPointSnapshot {
  return new Map(
    [...groupStartPoints.entries()].flatMap(([drawingId, points]) => {
      const drawing = drawings.find((candidate) => candidate.id === drawingId);
      return drawing
        ? [
            [
              drawingId,
              resizeDrawingPoints({ ...drawing, points }, bounds, handle, current, aspectLocked)
            ] as const
          ]
        : [];
    })
  );
}

export function getRotatedDrawingPointSnapshot(
  drawings: Scene["drawings"],
  groupStartPoints: DrawingPointSnapshot,
  center: Point,
  startAngle: number,
  current: Point
): DrawingPointSnapshot {
  const currentAngle = Math.atan2(current.y - center.y, current.x - center.x);
  const angle = currentAngle - startAngle;
  return new Map(
    [...groupStartPoints.entries()].flatMap(([drawingId, points]) => {
      const drawing = drawings.find((candidate) => candidate.id === drawingId);
      return drawing
        ? [
            [
              drawingId,
              rotateDrawingPoints({ ...drawing, points }, center, angle)
            ] as const
          ]
        : [];
    })
  );
}

function getCombinedDrawingBounds(bounds: DrawingBounds[]): DrawingBounds {
  return {
    left: Math.min(...bounds.map((drawingBounds) => drawingBounds.left)),
    top: Math.min(...bounds.map((drawingBounds) => drawingBounds.top)),
    right: Math.max(...bounds.map((drawingBounds) => drawingBounds.right)),
    bottom: Math.max(...bounds.map((drawingBounds) => drawingBounds.bottom))
  };
}

export { getDrawingResizeHandles, getEllipseAxisPoints, getRectangleDrawingPoints, getTriangleDrawingPoints, resizeDrawingPoints, rotateDrawingPoints, rotatePoints } from "./drawingTransformGeometry";
export {
  getDrawingMoveDelta,
  getDrawingPointSnapshot,
  getMovedDrawingPointSnapshot,
  getMovedPointSnapshot,
  getMovedPointSnapshotForMove,
  getPointSnapshotMoveDelta,
  getProjectedSnapAnchor,
  type DrawingPointSnapshot,
  type PointSnapshotMove
} from "./drawingPointSnapshot";
