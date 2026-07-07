import type { Point, Scene } from "../../../shared/localvtt";
import { getMovedPointSnapshotForMove, getProjectedSnapAnchor, type DrawingPointSnapshot, type PointSnapshotMove } from "../drawings";
import { getNearestSceneSnapPoint } from "./sceneSnapping";

export type SceneMovePreview = {
  points: DrawingPointSnapshot;
  snapPoint: Point | null;
};

export function getSnapAwarePointSnapshotMovePreview(
  scene: Scene | null,
  move: PointSnapshotMove,
  current: Point,
  snapEnabled: boolean
): SceneMovePreview {
  const projectedAnchor = move.snapAnchor ? getProjectedSnapAnchor(move.start, move.snapAnchor, current) : current;
  const snapPoint = scene && snapEnabled && move.snapAnchor ? getNearestSceneSnapPoint(projectedAnchor, scene) : null;
  return {
    points: getMovedPointSnapshotForMove(move, current, snapPoint),
    snapPoint
  };
}
