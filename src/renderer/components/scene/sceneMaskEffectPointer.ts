import type { Point, Scene } from "../../../shared/localvtt";
import { getEnvironmentEffectGroupSnapAnchor, getEnvironmentEffectPointSnapshot } from "../../canvas/effects";
import { getMovedPointSnapshotForMove } from "../../canvas/drawings";
import { getEnvironmentEffectAtPoint, getMaskHitAtPoint, getSceneItemDragGroup, getSnapAwarePointSnapshotMovePreview, type SceneItemDragGroup } from "../../canvas/scene";
import { getWeatherMaskPointSnapshot } from "../../canvas/weather";

export type MaskEffectPointerMouseBehavior = "selector" | "grabber";

export type WeatherMaskMoveState = {
  pointerId: number;
  maskId: string;
  start: Point;
  groupStartPoints: Map<string, Point[]>;
};

export type EnvironmentEffectMoveState = {
  pointerId: number;
  effectId: string;
  start: Point;
  snapAnchor: Point;
  groupStartPoints: Map<string, Point[]>;
};

export interface EnvironmentEffectHitPointerStartOptions {
  mouseBehavior: MaskEffectPointerMouseBehavior;
  point: Point;
  pointerId: number;
  scene: Scene;
}

export interface EnvironmentEffectHitPointerStart {
  effectId: string;
  moveStart: EnvironmentEffectMoveState | null;
  preview: Map<string, Point[]> | null;
}

export function getEnvironmentEffectHitPointerStart(options: EnvironmentEffectHitPointerStartOptions): EnvironmentEffectHitPointerStart | null {
  const effectHit = getEnvironmentEffectAtPoint(options.scene, options.point);
  if (!effectHit) {
    return null;
  }

  const groupEffectIds = [effectHit.id];
  const groupStartPoints = getEnvironmentEffectPointSnapshot(options.scene, groupEffectIds);
  const moveStart =
    options.mouseBehavior === "grabber"
      ? {
          pointerId: options.pointerId,
          effectId: effectHit.id,
          start: options.point,
          snapAnchor: getEnvironmentEffectGroupSnapAnchor(options.scene, groupEffectIds, options.point),
          groupStartPoints
        }
      : null;

  return {
    effectId: effectHit.id,
    moveStart,
    preview: moveStart ? groupStartPoints : null
  };
}

export interface MaskPointerStartOptions {
  mouseBehavior: MaskEffectPointerMouseBehavior;
  point: Point;
  pointerId: number;
  scene: Scene;
  selectedWeatherMaskIds: readonly string[];
}

export type MaskPointerStart =
  | {
      kind: "weather";
      dragGroup: SceneItemDragGroup;
      maskId: string;
      moveStart: WeatherMaskMoveState | null;
      preview: Map<string, Point[]> | null;
    }
  | {
      kind: "fog";
      shapeId: string;
    };

export function getMaskPointerStart(options: MaskPointerStartOptions): MaskPointerStart | null {
  const maskHit = getMaskHitAtPoint(options.scene, options.point);
  if (maskHit?.kind === "weather") {
    const dragGroup = getSceneItemDragGroup(maskHit.mask.id, options.selectedWeatherMaskIds, options.mouseBehavior);
    const groupStartPoints = getWeatherMaskPointSnapshot(options.scene, dragGroup.itemIds);
    const moveStart =
      options.mouseBehavior === "grabber"
        ? {
            pointerId: options.pointerId,
            maskId: maskHit.mask.id,
            start: options.point,
            groupStartPoints
          }
        : null;

    return {
      kind: "weather",
      dragGroup,
      maskId: maskHit.mask.id,
      moveStart,
      preview: moveStart ? groupStartPoints : null
    };
  }

  if (maskHit?.kind === "fog") {
    return {
      kind: "fog",
      shapeId: maskHit.shape.id
    };
  }

  return null;
}

export type MaskEffectPointerMove =
  | { kind: "weather"; preview: Map<string, Point[]> }
  | { kind: "environment-effect"; preview: Map<string, Point[]>; snapPoint: Point | null };

export interface MaskEffectPointerMoveOptions {
  environmentEffectMoveState: EnvironmentEffectMoveState | null;
  point: Point;
  pointerId: number;
  scene: Scene | null;
  snapEnabled: boolean;
  weatherMaskMoveState: WeatherMaskMoveState | null;
}

export function getMaskEffectPointerMove(options: MaskEffectPointerMoveOptions): MaskEffectPointerMove | null {
  if (options.weatherMaskMoveState?.pointerId === options.pointerId) {
    return {
      kind: "weather",
      preview: getMovedPointSnapshotForMove(options.weatherMaskMoveState, options.point)
    };
  }

  if (options.environmentEffectMoveState?.pointerId === options.pointerId) {
    const preview = getSnapAwarePointSnapshotMovePreview(options.scene, options.environmentEffectMoveState, options.point, options.snapEnabled);
    return {
      kind: "environment-effect",
      preview: preview.points,
      snapPoint: preview.snapPoint
    };
  }

  return null;
}

export type MaskEffectPointerMoveAction =
  | { kind: "set-weather-preview"; preview: Map<string, Point[]> }
  | { kind: "set-environment-preview"; preview: Map<string, Point[]>; snapPoint: Point | null }
  | { kind: "none" };

export function getMaskEffectPointerMoveAction(move: MaskEffectPointerMove | null): MaskEffectPointerMoveAction {
  if (!move) {
    return { kind: "none" };
  }
  if (move.kind === "environment-effect") {
    return {
      kind: "set-environment-preview",
      preview: move.preview,
      snapPoint: move.snapPoint
    };
  }
  return {
    kind: "set-weather-preview",
    preview: move.preview
  };
}

export type MaskEffectPointerComplete =
  | { kind: "weather"; preview: Map<string, Point[]> | null }
  | { kind: "environment-effect"; preview: Map<string, Point[]> | null };

export interface MaskEffectPointerCompleteOptions {
  environmentEffectMoveState: EnvironmentEffectMoveState | null;
  environmentEffectPreview: Map<string, Point[]> | null;
  pointerId: number;
  weatherMaskMoveState: WeatherMaskMoveState | null;
  weatherMaskPreview: Map<string, Point[]> | null;
}

export function getMaskEffectPointerComplete(options: MaskEffectPointerCompleteOptions): MaskEffectPointerComplete | null {
  if (options.weatherMaskMoveState?.pointerId === options.pointerId) {
    return {
      kind: "weather",
      preview: options.weatherMaskPreview
    };
  }

  if (options.environmentEffectMoveState?.pointerId === options.pointerId) {
    return {
      kind: "environment-effect",
      preview: options.environmentEffectPreview
    };
  }

  return null;
}
