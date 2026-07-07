import type { Point, Scene } from "../../../../shared/localvtt";
import {
  getDrawingPreviewFromPoint,
  getUpdatedDrawingPreview,
  type DrawingPreview,
  type DrawingPreviewStyle,
  type DrawingTool
} from "../../../canvas/drawings";
import type { DrawingTemplateSize } from "../../tools";

export interface DrawingPointerStartOptions {
  button: number;
  hasScene: boolean;
  mode: "gm" | "player";
  onSceneChangeAvailable: boolean;
  point: Point;
  pointerId: number;
  style: DrawingPreviewStyle;
  tool: DrawingTool | null | undefined;
}

export function getDrawingPointerStart(options: DrawingPointerStartOptions): DrawingPreview | null {
  if (options.mode !== "gm" || !options.tool || options.tool === "polygon" || !options.hasScene || !options.onSceneChangeAvailable || options.button !== 0) {
    return null;
  }

  return getDrawingPreviewFromPoint(options.pointerId, options.tool, options.point, options.style);
}

export function getDrawingPointerMove(
  activePreview: DrawingPreview | null,
  pointerId: number,
  point: Point,
  scene: Scene | null,
  templateSize: DrawingTemplateSize,
  squareConstrained: boolean
): DrawingPreview | null {
  if (!activePreview || activePreview.pointerId !== pointerId) {
    return null;
  }

  return getUpdatedDrawingPreview(activePreview, point, scene, templateSize, squareConstrained);
}

export type DrawingPointerMoveAction =
  | { kind: "set-preview"; preview: DrawingPreview }
  | { kind: "none" };

export function getDrawingPointerMoveAction(preview: DrawingPreview | null): DrawingPointerMoveAction {
  if (!preview) {
    return { kind: "none" };
  }
  return { kind: "set-preview", preview };
}
