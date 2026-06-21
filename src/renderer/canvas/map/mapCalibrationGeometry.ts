import type { Point } from "../../../shared/localvtt";
import type { Camera } from "../core/camera";

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

export function getCompletedMapCalibrationBox(drag: MapCalibrationDrag, fallback: MapCalibrationBox | null, minimumSize = 4): MapCalibrationBox | null {
  const box = getVisibleMapCalibrationBox(drag, fallback);
  return box && box.width >= minimumSize && box.height >= minimumSize ? box : null;
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

export function getMapCalibrationDragFromPoint(pointerId: number, point: Point, editableBox: MapCalibrationBox | null, camera: Camera): MapCalibrationDrag {
  const hit = editableBox ? getMapCalibrationBoxHit(point, editableBox, camera) : null;
  if (hit === "resize" && editableBox) {
    return {
      pointerId,
      mode: "resize",
      start: { x: editableBox.x, y: editableBox.y },
      current: point,
      box: editableBox
    };
  }
  if (hit === "move" && editableBox) {
    return {
      pointerId,
      mode: "move",
      start: point,
      current: point,
      box: editableBox,
      offset: { x: point.x - editableBox.x, y: point.y - editableBox.y }
    };
  }
  return {
    pointerId,
    mode: "draw",
    start: point,
    current: point
  };
}

export function getUpdatedMapCalibrationDrag(drag: MapCalibrationDrag, point: Point): { drag: MapCalibrationDrag; draftBox: MapCalibrationBox } {
  const nextDrag = { ...drag, current: point };
  if (nextDrag.mode === "move" && nextDrag.box && nextDrag.offset) {
    return {
      drag: nextDrag,
      draftBox: {
        ...nextDrag.box,
        x: point.x - nextDrag.offset.x,
        y: point.y - nextDrag.offset.y
      }
    };
  }

  return {
    drag: nextDrag,
    draftBox: getSquareCalibrationBox(nextDrag.start, point)
  };
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
