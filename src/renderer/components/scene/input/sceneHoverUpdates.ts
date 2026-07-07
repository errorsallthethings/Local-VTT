import type { Point, Scene } from "../../../../shared/localvtt";
import type { Camera } from "../../../canvas/core";
import { getDrawingTransformHoverAtPoint, hasSceneItemHoverAtPoint, type DrawingTransformHover } from "../../../canvas/core";
import { getNearestSceneSnapPoint, shouldShowSceneSnapPreview } from "../../../canvas/scene";

export interface DrawingTransformHoverUpdateOptions {
  camera: Camera;
  canShowDrawings: boolean;
  hasActiveInteraction: boolean;
  mode: "gm" | "player";
  point: Point;
  scene: Scene | null;
  selectedDrawingIds: string[];
}

export function getDrawingTransformHoverUpdate(options: DrawingTransformHoverUpdateOptions): DrawingTransformHover {
  return getDrawingTransformHoverAtPoint(options);
}

export interface SceneItemHoverUpdateOptions {
  camera: Camera;
  canShowDrawings: boolean;
  canShowFog: boolean;
  canShowTokens: boolean;
  canShowWeather: boolean;
  hasActiveInteraction: boolean;
  mode: "gm" | "player";
  point: Point;
  scene: Scene | null;
}

export function getSceneItemHoverUpdate(options: SceneItemHoverUpdateOptions): boolean {
  return hasSceneItemHoverAtPoint(options);
}

export interface SceneSnapPointUpdateOptions {
  canSnapDrawing: boolean;
  canSnapEnvironment: boolean;
  canSnapFog: boolean;
  canSnapWeather: boolean;
  point: Point;
  scene: Scene | null;
  snapModifierActive: boolean;
}

export function getSceneSnapPointUpdate(options: SceneSnapPointUpdateOptions): Point | null {
  if (
    !options.scene ||
    !shouldShowSceneSnapPreview({
      scene: options.scene,
      snapModifierActive: options.snapModifierActive,
      canSnapDrawing: options.canSnapDrawing,
      canSnapFog: options.canSnapFog,
      canSnapWeather: options.canSnapWeather,
      canSnapEnvironment: options.canSnapEnvironment
    })
  ) {
    return null;
  }

  return getNearestSceneSnapPoint(options.point, options.scene);
}
