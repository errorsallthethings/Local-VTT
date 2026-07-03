import type { Point } from "../../../shared/localvtt";
import { createRulerDrag, type RulerPointerDrag } from "../../canvas/live-table";

export interface RulerPointerStartOptions {
  button: number;
  canvasTool: "ruler" | "ping" | "laser" | null | undefined;
  hasScene: boolean;
  mode: "gm" | "player";
  point: Point;
  pointerId: number;
}

export function getRulerPointerStart(options: RulerPointerStartOptions): RulerPointerDrag | null {
  if (options.mode !== "gm" || options.canvasTool !== "ruler" || !options.hasScene || options.button !== 0) {
    return null;
  }

  return createRulerDrag(options.pointerId, options.point);
}

export function getUpdatedRulerPointerDrag(activeDrag: RulerPointerDrag | null, pointerId: number, point: Point): RulerPointerDrag | null {
  if (!activeDrag || activeDrag.pointerId !== pointerId) {
    return null;
  }

  return {
    ...activeDrag,
    current: point
  };
}
