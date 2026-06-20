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

export interface MapCalibrationGridDraft {
  boxColumns: number;
  boxRows: number;
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

export function getBoxCalibrationGridPatch(draft: MapCalibrationGridDraft, box: MapCalibrationBox | null): { sizePx: number; offsetX: number; offsetY: number } | null {
  if (!box || draft.boxColumns <= 0 || draft.boxRows <= 0) {
    return null;
  }
  const cellWidth = box.width / draft.boxColumns;
  const cellHeight = box.height / draft.boxRows;
  if (!Number.isFinite(cellWidth) || !Number.isFinite(cellHeight) || cellWidth <= 0 || cellHeight <= 0) {
    return null;
  }
  const sizePx = Math.max(1, Math.round(((cellWidth + cellHeight) / 2) * 100) / 100);
  return {
    sizePx,
    offsetX: positiveModulo(box.x, sizePx),
    offsetY: positiveModulo(box.y, sizePx)
  };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
