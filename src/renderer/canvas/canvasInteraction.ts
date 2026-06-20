import type { Point, Scene } from "../../shared/localvtt";
import type { Camera } from "./camera";
import { getDrawingAtPoint, getDrawingHitRadius } from "./drawingRenderer";
import { getDrawingResizeHandleAtPoint, getDrawingRotationHandleAtPoint } from "./drawingTransform";
import { getMaskHitAtPoint, isMaskHitVisibleForLayers } from "./sceneHitTesting";
import { getTokenAtPoint } from "./tokenGeometry";

export type DrawingResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
export type DrawingTransformHover = DrawingResizeHandle | "rotate" | null;

export interface CanvasInteractionState {
  canvasTool: "ruler" | "ping" | "laser" | null;
  mouseBehavior: "selector" | "grabber";
  drawingTool: string | null;
  fogTool: string | null;
  weatherMaskTool: "rectangle" | "circle" | "polygon" | null;
  environmentEffectTool: "rectangle" | "circle" | "polygon" | null;
  isPanning: boolean;
  tokenDragPreview: unknown | null;
  drawingTransformHover: DrawingTransformHover;
  sceneItemHover: boolean;
}

export function getCanvasInteractionClass({
  canvasTool,
  mouseBehavior,
  drawingTool,
  fogTool,
  weatherMaskTool,
  environmentEffectTool,
  isPanning,
  tokenDragPreview,
  drawingTransformHover,
  sceneItemHover
}: CanvasInteractionState): string {
  if (isPanning) {
    return "scene-canvas-panning";
  }
  if (tokenDragPreview) {
    return "scene-canvas-token-dragging";
  }
  if (drawingTransformHover === "rotate") {
    return "scene-canvas-transform-rotate";
  }
  if (drawingTransformHover === "n" || drawingTransformHover === "s") {
    return "scene-canvas-transform-resize-y";
  }
  if (drawingTransformHover === "e" || drawingTransformHover === "w") {
    return "scene-canvas-transform-resize-x";
  }
  if (drawingTransformHover === "nw" || drawingTransformHover === "se") {
    return "scene-canvas-transform-resize-nwse";
  }
  if (drawingTransformHover === "ne" || drawingTransformHover === "sw") {
    return "scene-canvas-transform-resize-nesw";
  }
  if (canvasTool === "ruler") {
    return "scene-canvas-tool-ruler";
  }
  if (canvasTool === "ping") {
    return "scene-canvas-tool-ping";
  }
  if (canvasTool === "laser") {
    return "scene-canvas-tool-laser";
  }
  if (drawingTool === "freehand") {
    return "scene-canvas-tool-brush";
  }
  if (drawingTool === "line" || drawingTool === "template-line") {
    return "scene-canvas-tool-line";
  }
  if (drawingTool === "circle" || drawingTool === "template-circle") {
    return "scene-canvas-tool-circle";
  }
  if (drawingTool === "rectangle" || drawingTool === "template-rectangle") {
    return "scene-canvas-tool-rectangle";
  }
  if (drawingTool === "triangle" || drawingTool === "polygon" || drawingTool === "template-cone") {
    return "scene-canvas-tool-polygon";
  }
  if (weatherMaskTool === "circle" || environmentEffectTool === "circle") {
    return "scene-canvas-tool-circle";
  }
  if (weatherMaskTool === "rectangle" || environmentEffectTool === "rectangle") {
    return "scene-canvas-tool-rectangle";
  }
  if (weatherMaskTool === "polygon" || environmentEffectTool === "polygon") {
    return "scene-canvas-tool-polygon";
  }
  if (fogTool?.includes("brush")) {
    return "scene-canvas-tool-brush";
  }
  if (fogTool?.includes("polygon")) {
    return "scene-canvas-tool-polygon";
  }
  if (fogTool?.includes("circle")) {
    return "scene-canvas-tool-circle";
  }
  if (fogTool) {
    return "scene-canvas-tool-rectangle";
  }
  if (sceneItemHover) {
    return "scene-canvas-item-hover";
  }
  if (mouseBehavior === "grabber") {
    return "scene-canvas-grabber";
  }
  return "";
}

export interface DrawingTransformHoverInput {
  mode: "gm" | "player";
  scene: Scene | null;
  point: Point;
  camera: Camera;
  selectedDrawingIds: string[];
  canShowDrawings?: boolean;
  hasActiveInteraction?: boolean;
}

export function getDrawingTransformHoverAtPoint({
  mode,
  scene,
  point,
  camera,
  selectedDrawingIds,
  canShowDrawings,
  hasActiveInteraction
}: DrawingTransformHoverInput): DrawingTransformHover {
  if (mode !== "gm" || !scene || !canShowDrawings || hasActiveInteraction || selectedDrawingIds.length === 0) {
    return null;
  }
  if (getDrawingRotationHandleAtPoint(scene.drawings, selectedDrawingIds, point, camera)) {
    return "rotate";
  }
  return getDrawingResizeHandleAtPoint(scene.drawings, selectedDrawingIds, point, camera)?.handle ?? null;
}

export interface SceneItemHoverInput {
  mode: "gm" | "player";
  scene: Scene | null;
  point: Point;
  camera: Camera;
  canShowTokens?: boolean;
  canShowDrawings?: boolean;
  canShowWeather?: boolean;
  canShowFog?: boolean;
  hasActiveInteraction?: boolean;
}

export function hasSceneItemHoverAtPoint({
  mode,
  scene,
  point,
  camera,
  canShowTokens,
  canShowDrawings,
  canShowWeather,
  canShowFog,
  hasActiveInteraction
}: SceneItemHoverInput): boolean {
  if (mode !== "gm" || !scene || hasActiveInteraction) {
    return false;
  }
  if (canShowTokens && getTokenAtPoint(scene.tokens, point)) {
    return true;
  }
  if (canShowDrawings && getDrawingAtPoint(scene.drawings, point, getDrawingHitRadius(camera.zoom), scene.grid)) {
    return true;
  }
  return isMaskHitVisibleForLayers(getMaskHitAtPoint(scene, point), canShowWeather, canShowFog);
}
