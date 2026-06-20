import type { Point } from "../../shared/localvtt";
import type { Camera } from "./camera";

export interface MapCalibrationBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapCalibrationDrag {
  pointerId: number;
  mode: "draw" | "move" | "resize";
  start: Point;
  current: Point;
  box?: MapCalibrationBox;
  offset?: Point;
}

export function getVisibleMapCalibrationBox(drag: MapCalibrationDrag | null, fallback: MapCalibrationBox | null): MapCalibrationBox | null {
  if (!drag) {
    return fallback;
  }
  if (drag.mode === "move" && drag.box && drag.offset) {
    return {
      ...drag.box,
      x: drag.current.x - drag.offset.x,
      y: drag.current.y - drag.offset.y
    };
  }
  return getSquareCalibrationBox(drag.start, drag.current);
}

export function getSquareCalibrationBox(start: Point, current: Point): MapCalibrationBox {
  const width = current.x - start.x;
  const height = current.y - start.y;
  const size = Math.max(Math.abs(width), Math.abs(height));
  const endX = start.x + Math.sign(width || 1) * size;
  const endY = start.y + Math.sign(height || 1) * size;
  const x = Math.min(start.x, endX);
  const y = Math.min(start.y, endY);
  return {
    x,
    y,
    width: size,
    height: size
  };
}

export function getMapCalibrationBoxHit(point: Point, box: MapCalibrationBox, camera: Camera): "move" | "resize" | null {
  const handleSize = 14 / Math.max(0.1, camera.zoom);
  const handleLeft = box.x + box.width - handleSize / 2;
  const handleTop = box.y + box.height - handleSize / 2;
  if (point.x >= handleLeft && point.x <= handleLeft + handleSize && point.y >= handleTop && point.y <= handleTop + handleSize) {
    return "resize";
  }
  if (point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height) {
    return "move";
  }
  return null;
}
