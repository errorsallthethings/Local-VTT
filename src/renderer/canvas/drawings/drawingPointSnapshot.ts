import type { Point, Scene } from "../../../shared/localvtt";

export type DrawingPointSnapshot = Map<string, Point[]>;
export type PointSnapshotMove = {
  start: Point;
  snapAnchor?: Point;
  groupStartPoints: DrawingPointSnapshot;
};

export function getDrawingPointSnapshot(drawings: Scene["drawings"], drawingIds: string[], options: { includeTemplates?: boolean } = {}): DrawingPointSnapshot {
  const ids = new Set(drawingIds);
  return new Map(
    drawings
      .filter((drawing) => ids.has(drawing.id) && (options.includeTemplates || !drawing.measurementLabelVisible))
      .map((drawing) => [drawing.id, drawing.points.map((point) => ({ ...point }))])
  );
}

export function getMovedDrawingPointSnapshot(groupStartPoints: DrawingPointSnapshot, delta: Point): DrawingPointSnapshot {
  return getMovedPointSnapshot(groupStartPoints, delta);
}

export function getMovedPointSnapshot(groupStartPoints: DrawingPointSnapshot, delta: Point): DrawingPointSnapshot {
  return new Map(
    [...groupStartPoints.entries()].map(([drawingId, points]) => [
      drawingId,
      points.map((point) => ({
        x: point.x + delta.x,
        y: point.y + delta.y
      }))
    ])
  );
}

export function getProjectedSnapAnchor(start: Point, snapAnchor: Point, current: Point): Point {
  return {
    x: snapAnchor.x + current.x - start.x,
    y: snapAnchor.y + current.y - start.y
  };
}

export function getDrawingMoveDelta(start: Point, snapAnchor: Point, current: Point, snappedPoint: Point | null): Point {
  const pointerDelta = {
    x: current.x - start.x,
    y: current.y - start.y
  };
  return snappedPoint
    ? {
        x: snappedPoint.x - snapAnchor.x,
        y: snappedPoint.y - snapAnchor.y
      }
    : pointerDelta;
}

export function getPointSnapshotMoveDelta(move: Pick<PointSnapshotMove, "start" | "snapAnchor">, current: Point, snappedPoint: Point | null = null): Point {
  if (move.snapAnchor) {
    return getDrawingMoveDelta(move.start, move.snapAnchor, current, snappedPoint);
  }
  return {
    x: current.x - move.start.x,
    y: current.y - move.start.y
  };
}

export function getMovedPointSnapshotForMove(move: PointSnapshotMove, current: Point, snappedPoint: Point | null = null): DrawingPointSnapshot {
  return getMovedPointSnapshot(move.groupStartPoints, getPointSnapshotMoveDelta(move, current, snappedPoint));
}
