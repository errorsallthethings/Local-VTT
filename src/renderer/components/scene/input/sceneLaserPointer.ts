import type { Point, TableToolSettings } from "../../../../shared/localvtt";
import { createLaserDragStart, getUpdatedLaserDrag } from "../../../canvas/live-table";
import type { LaserDragState } from "../../../canvas/scene";

export interface LaserPointerStartOptions {
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

export function getLaserPointerStart(options: LaserPointerStartOptions): ReturnType<typeof createLaserDragStart> | null {
  if (options.mode !== "gm" || options.canvasTool !== "laser" || !options.hasScene || options.button !== 0) {
    return null;
  }

  return createLaserDragStart(options.pointerId, options.eventId, options.point, options.settings, options.visibleInPlayer, options.now);
}

export function getLaserPointerMove(
  activeDrag: LaserDragState | null,
  pointerId: number,
  point: Point,
  now = Date.now()
): LaserDragState | null {
  if (!activeDrag || activeDrag.pointerId !== pointerId) {
    return null;
  }

  return getUpdatedLaserDrag(activeDrag, point, now);
}

export type LaserPointerMoveAction =
  | { kind: "emit"; drag: LaserDragState }
  | { kind: "none" };

export function getLaserPointerMoveAction(drag: LaserDragState | null): LaserPointerMoveAction {
  if (!drag) {
    return { kind: "none" };
  }
  return { kind: "emit", drag };
}

export function shouldEndLaserPointer(activeDrag: LaserDragState | null, pointerId: number): boolean {
  return Boolean(activeDrag && activeDrag.pointerId === pointerId);
}
