import type { EnvironmentEffectMask, EnvironmentEffectType, Point } from "../../../shared/localvtt";
import { getEnvironmentEffectDragFromPoint, getUpdatedEnvironmentEffectDrag, type EnvironmentEffectDrag } from "../../canvas/effects";
import type { EnvironmentEffectTool } from "../tools";

export type EnvironmentEffectPointerStart =
  | { kind: "polygon"; point: Point }
  | { kind: "drag"; drag: EnvironmentEffectDrag };

export interface EnvironmentEffectPointerStartOptions {
  button: number;
  effect: EnvironmentEffectType;
  fallbackTuning: Partial<EnvironmentEffectMask>;
  feather: number;
  hasScene: boolean;
  mode: "gm" | "player";
  onSceneChangeAvailable: boolean;
  point: Point;
  pointerId: number;
  tool: EnvironmentEffectTool | null | undefined;
}

export function getEnvironmentEffectPointerStart(options: EnvironmentEffectPointerStartOptions): EnvironmentEffectPointerStart | null {
  if (options.mode !== "gm" || !options.tool || !options.hasScene || !options.onSceneChangeAvailable || options.button !== 0) {
    return null;
  }

  if (options.tool === "polygon") {
    return { kind: "polygon", point: options.point };
  }

  return {
    kind: "drag",
    drag: getEnvironmentEffectDragFromPoint(options.pointerId, options.tool, options.point, options.effect, options.feather, options.fallbackTuning)
  };
}

export function getEnvironmentEffectPointerMove(activeDrag: EnvironmentEffectDrag | null, pointerId: number, point: Point, squareConstrained: boolean): EnvironmentEffectDrag | null {
  if (!activeDrag || activeDrag.pointerId !== pointerId) {
    return null;
  }

  return getUpdatedEnvironmentEffectDrag(activeDrag, point, squareConstrained);
}
