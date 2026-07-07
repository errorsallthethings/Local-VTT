import type { Point, Scene } from "../../../../shared/localvtt";
import type { Camera } from "../../../canvas/core";
import { getDrawingAtPoint, getDrawingHitRadius } from "../../../canvas/drawings";
import { getEnvironmentEffectAtPoint, getMaskHitAtPoint } from "../../../canvas/scene";
import { getTokenAtPoint } from "../../../canvas/tokens";

export type SceneContextMenuTarget =
  | { kind: "token"; token: Scene["tokens"][number] }
  | { kind: "drawing"; drawing: Scene["drawings"][number]; drawingIndex: number }
  | { kind: "weather-mask"; mask: Scene["weather"]["masks"][number] }
  | { kind: "fog"; shape: Scene["fog"]["shapes"][number]; shapeIndex: number }
  | { kind: "environment-effect"; effect: Scene["environment"]["effects"][number]; effectIndex: number };

export interface SceneContextMenuTargetOptions {
  authoringToolActive: boolean;
  camera: Camera;
  canOpenTokenMenu: boolean;
  canShowDrawings: boolean;
  canShowTokens: boolean;
  point: Point;
  scene: Scene;
}

export function getSceneContextMenuTarget(options: SceneContextMenuTargetOptions): SceneContextMenuTarget | null {
  const token = options.canShowTokens && options.canOpenTokenMenu ? getTokenAtPoint(options.scene.tokens, options.point) : null;
  if (token) {
    return { kind: "token", token };
  }

  if (options.authoringToolActive) {
    return null;
  }

  const drawing = options.canShowDrawings
    ? getDrawingAtPoint(options.scene.drawings, options.point, getDrawingHitRadius(options.camera.zoom), options.scene.grid)
    : null;
  if (drawing) {
    return {
      kind: "drawing",
      drawing,
      drawingIndex: options.scene.drawings.findIndex((candidate) => candidate.id === drawing.id)
    };
  }

  const maskHit = getMaskHitAtPoint(options.scene, options.point);
  if (maskHit?.kind === "weather") {
    return { kind: "weather-mask", mask: maskHit.mask };
  }
  if (maskHit?.kind === "fog") {
    return {
      kind: "fog",
      shape: maskHit.shape,
      shapeIndex: options.scene.fog.shapes.findIndex((candidate) => candidate.id === maskHit.shape.id)
    };
  }

  const effect = getEnvironmentEffectAtPoint(options.scene, options.point);
  if (effect) {
    return {
      kind: "environment-effect",
      effect,
      effectIndex: options.scene.environment.effects.findIndex((candidate) => candidate.id === effect.id)
    };
  }

  return null;
}
