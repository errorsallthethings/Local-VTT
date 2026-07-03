import type { Point } from "../../../shared/localvtt";
import type { Camera } from "../../canvas/core";
import {
  getCompletedMapCalibrationBox,
  getMapCalibrationDragFromPoint,
  getUpdatedMapCalibrationDrag,
  type MapCalibrationBox,
  type MapCalibrationDrag
} from "../../canvas/map";

export interface MapCalibrationPointerStartOptions {
  button: number;
  camera: Camera;
  draftBox: MapCalibrationBox | null;
  existingBox: MapCalibrationBox | null;
  hasScene: boolean;
  mode: "gm" | "player";
  point: Point;
  pointerId: number;
  toolActive: boolean;
}

export function getMapCalibrationPointerStart(options: MapCalibrationPointerStartOptions): MapCalibrationDrag | null {
  if (options.mode !== "gm" || !options.hasScene || !options.toolActive || options.button !== 0) {
    return null;
  }

  return getMapCalibrationDragFromPoint(options.pointerId, options.point, options.draftBox ?? options.existingBox, options.camera);
}

export function getMapCalibrationPointerMove(
  activeDrag: MapCalibrationDrag | null,
  pointerId: number,
  point: Point
): { drag: MapCalibrationDrag; draftBox: MapCalibrationBox } | null {
  if (!activeDrag || activeDrag.pointerId !== pointerId) {
    return null;
  }

  return getUpdatedMapCalibrationDrag(activeDrag, point);
}

export function getMapCalibrationPointerComplete(
  activeDrag: MapCalibrationDrag | null,
  pointerId: number,
  fallback: MapCalibrationBox | null
): MapCalibrationBox | null {
  if (!activeDrag || activeDrag.pointerId !== pointerId) {
    return null;
  }

  return getCompletedMapCalibrationBox(activeDrag, fallback);
}
