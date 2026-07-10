import type { Point, TableToolSettings } from "../../../../shared/localvtt";
import { createArrowPointerDragStart, createArrowPointerLiveTableEvent, getUpdatedArrowPointerDrag } from "../../../canvas/live-table";
import type { ArrowPointerDragState } from "../../../canvas/scene";

export interface ArrowPointerStartOptions {
  button: number;
  canvasTool: "ruler" | "ping" | "laser" | "arrow" | null | undefined;
  eventId: string;
  hasScene: boolean;
  mode: "gm" | "player";
  point: Point;
  pointerId: number;
  settings: TableToolSettings;
  visibleInPlayer: boolean;
  now?: number;
}

export function getArrowPointerStart(options: ArrowPointerStartOptions): { drag: ArrowPointerDragState; event: ReturnType<typeof createArrowPointerLiveTableEvent> } | null {
  if (options.mode !== "gm" || options.canvasTool !== "arrow" || !options.hasScene || options.button !== 0) {
    return null;
  }

  const drag = createArrowPointerDragStart(options.pointerId, options.eventId, options.point, options.now);
  return {
    drag,
    event: createArrowPointerLiveTableEvent(drag, options.settings, options.visibleInPlayer, options.now)
  };
}

export function getArrowPointerMove(activeDrag: ArrowPointerDragState | null, pointerId: number, point: Point): ArrowPointerDragState | null {
  if (!activeDrag || activeDrag.pointerId !== pointerId) {
    return null;
  }
  return getUpdatedArrowPointerDrag(activeDrag, point);
}

export type ArrowPointerMoveAction =
  | { kind: "emit"; drag: ArrowPointerDragState }
  | { kind: "none" };

export function getArrowPointerMoveAction(drag: ArrowPointerDragState | null): ArrowPointerMoveAction {
  if (!drag) {
    return { kind: "none" };
  }
  return { kind: "emit", drag };
}

export function shouldEndArrowPointer(activeDrag: ArrowPointerDragState | null, pointerId: number): activeDrag is ArrowPointerDragState {
  return Boolean(activeDrag && activeDrag.pointerId === pointerId);
}
