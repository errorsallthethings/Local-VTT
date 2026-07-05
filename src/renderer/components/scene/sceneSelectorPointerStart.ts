import type { Point, Scene } from "../../../shared/localvtt";
import type { Camera } from "../../canvas/core";
import type { MouseBehavior } from "../tools";
import { getDrawingTransformPointerStart, type DrawingTransformPointerStart } from "./sceneDrawingTransformPointer";
import { getEnvironmentEffectHitPointerStart, getMaskPointerStart, type EnvironmentEffectHitPointerStart, type MaskPointerStart } from "./sceneMaskEffectPointer";
import { getTokenPointerStart, type TokenPointerStart } from "./sceneTokenPointer";

export type SceneSelectorPointerStart =
  | { kind: "token"; start: TokenPointerStart }
  | { kind: "drawing-transform"; start: Extract<DrawingTransformPointerStart, { kind: "transform" }> }
  | { kind: "drawing-hit"; start: Extract<DrawingTransformPointerStart, { kind: "hit" }> }
  | { kind: "environment-effect"; start: EnvironmentEffectHitPointerStart }
  | { kind: "weather-mask"; start: Extract<MaskPointerStart, { kind: "weather" }> }
  | { kind: "fog-shape"; start: Extract<MaskPointerStart, { kind: "fog" }> }
  | { kind: "empty"; clearSceneSelections: boolean };

export interface SceneSelectorPointerStartOptions {
  authoringToolActive: boolean;
  camera: Camera;
  canShowDrawings: boolean;
  canShowTokens: boolean;
  mouseBehavior: MouseBehavior;
  point: Point;
  pointerId: number;
  scene: Scene;
  selectedDrawingIds: readonly string[];
  selectedTokenIds: readonly string[];
  selectedWeatherMaskIds: readonly string[];
}

export function getSceneSelectorPointerStart(options: SceneSelectorPointerStartOptions): SceneSelectorPointerStart {
  const tokenStart = getTokenPointerStart({
    canShowTokens: options.canShowTokens,
    mouseBehavior: options.mouseBehavior,
    point: options.point,
    pointerId: options.pointerId,
    scene: options.scene,
    selectedTokenIds: options.selectedTokenIds
  });
  if (tokenStart) {
    return { kind: "token", start: tokenStart };
  }

  if (options.authoringToolActive) {
    return { kind: "empty", clearSceneSelections: false };
  }

  const drawingStart = getDrawingTransformPointerStart({
    authoringToolActive: options.authoringToolActive,
    camera: options.camera,
    canShowDrawings: options.canShowDrawings,
    mouseBehavior: options.mouseBehavior,
    point: options.point,
    pointerId: options.pointerId,
    scene: options.scene,
    selectedDrawingIds: options.selectedDrawingIds
  });
  if (drawingStart?.kind === "transform") {
    return { kind: "drawing-transform", start: drawingStart };
  }
  if (drawingStart?.kind === "hit") {
    return { kind: "drawing-hit", start: drawingStart };
  }

  const environmentEffectStart = getEnvironmentEffectHitPointerStart({
    mouseBehavior: options.mouseBehavior,
    point: options.point,
    pointerId: options.pointerId,
    scene: options.scene
  });
  if (environmentEffectStart) {
    return { kind: "environment-effect", start: environmentEffectStart };
  }

  const maskStart = getMaskPointerStart({
    mouseBehavior: options.mouseBehavior,
    point: options.point,
    pointerId: options.pointerId,
    scene: options.scene,
    selectedWeatherMaskIds: options.selectedWeatherMaskIds
  });
  if (maskStart?.kind === "weather") {
    return { kind: "weather-mask", start: maskStart };
  }
  if (maskStart?.kind === "fog") {
    return { kind: "fog-shape", start: maskStart };
  }

  return { kind: "empty", clearSceneSelections: true };
}
