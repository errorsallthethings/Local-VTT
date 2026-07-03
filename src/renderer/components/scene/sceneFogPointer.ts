import type { Point } from "../../../shared/localvtt";
import { getFogDragFromPoint, getUpdatedFogDrag, isPolygonTool, type FogDrag, type FogTool } from "../../canvas/fog";

export type FogPointerStart =
  | { kind: "polygon"; point: Point; tool: FogTool }
  | { kind: "drag"; drag: FogDrag };

export interface FogPointerStartOptions {
  brushSize: number;
  button: number;
  hasScene: boolean;
  mode: "gm" | "player";
  onSceneChangeAvailable: boolean;
  point: Point;
  pointerId: number;
  tool: FogTool | null | undefined;
}

export function getFogPointerStart(options: FogPointerStartOptions): FogPointerStart | null {
  if (options.mode !== "gm" || !options.tool || !options.hasScene || !options.onSceneChangeAvailable || options.button !== 0) {
    return null;
  }

  if (isPolygonTool(options.tool)) {
    return { kind: "polygon", point: options.point, tool: options.tool };
  }

  return {
    kind: "drag",
    drag: getFogDragFromPoint(options.pointerId, options.tool, options.point, options.brushSize)
  };
}

export function getFogPointerMove(activeDrag: FogDrag | null, pointerId: number, point: Point, squareConstrained: boolean): FogDrag | null {
  if (!activeDrag || activeDrag.pointerId !== pointerId) {
    return null;
  }

  return getUpdatedFogDrag(activeDrag, point, squareConstrained);
}
