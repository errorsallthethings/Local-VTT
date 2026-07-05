import type { Point, Scene } from "../../../shared/localvtt";
import type { Camera } from "../../canvas/core";
import {
  getDrawingAtPoint,
  getDrawingGroupSnapAnchor,
  getDrawingHitRadius,
  getDrawingPointSnapshot,
  getDrawingTransformDragStart,
  getResizedDrawingPointSnapshot,
  getRotatedDrawingPointSnapshot,
  type DrawingPointOverrides
} from "../../canvas/drawings";
import {
  getSceneItemDragGroup,
  getSnapAwarePointSnapshotMovePreview,
  type DrawingDragState,
  type DrawingResizeState,
  type DrawingRotateState,
  type SceneItemDragGroup
} from "../../canvas/scene";

export type DrawingTransformPointerMouseBehavior = "selector" | "grabber";

export interface DrawingTransformPointerStartOptions {
  authoringToolActive: boolean;
  camera: Camera;
  canShowDrawings: boolean;
  mouseBehavior: DrawingTransformPointerMouseBehavior;
  point: Point;
  pointerId: number;
  scene: Scene;
  selectedDrawingIds: readonly string[];
}

export type DrawingTransformPointerStart =
  | {
      kind: "transform";
      transformKind: "resize";
      state: DrawingResizeState;
      preview: DrawingPointOverrides;
    }
  | {
      kind: "transform";
      transformKind: "rotate";
      state: DrawingRotateState;
      preview: DrawingPointOverrides;
    }
  | {
      kind: "hit";
      dragGroup: SceneItemDragGroup;
      dragStart: DrawingDragState | null;
      drawingId: string;
      preview: DrawingPointOverrides | null;
    };

export function getDrawingTransformPointerStart(options: DrawingTransformPointerStartOptions): DrawingTransformPointerStart | null {
  if (options.authoringToolActive || !options.canShowDrawings) {
    return null;
  }

  if ((options.mouseBehavior === "grabber" || options.mouseBehavior === "selector") && options.selectedDrawingIds.length > 0) {
    const transformDragStart = getDrawingTransformDragStart(
      options.scene.drawings,
      [...options.selectedDrawingIds],
      options.point,
      options.camera,
      options.pointerId
    );
    if (transformDragStart) {
      return transformDragStart.kind === "rotate"
        ? {
            kind: "transform",
            transformKind: "rotate",
            state: transformDragStart.state,
            preview: transformDragStart.preview
          }
        : {
            kind: "transform",
            transformKind: "resize",
            state: transformDragStart.state,
            preview: transformDragStart.preview
          };
    }
  }

  const drawingHit = getDrawingAtPoint(options.scene.drawings, options.point, getDrawingHitRadius(options.camera.zoom), options.scene.grid);
  if (!drawingHit) {
    return null;
  }

  const dragGroup = getSceneItemDragGroup(drawingHit.id, options.selectedDrawingIds, options.mouseBehavior);
  const groupDrawingIds = dragGroup.itemIds;
  const groupStartPoints = getDrawingPointSnapshot(options.scene.drawings, groupDrawingIds, { includeTemplates: true });
  const snapAnchor = getDrawingGroupSnapAnchor(options.scene.drawings, groupDrawingIds, options.point);
  const dragStart =
    options.mouseBehavior === "grabber"
      ? {
          pointerId: options.pointerId,
          drawingId: drawingHit.id,
          start: options.point,
          snapAnchor,
          groupStartPoints
        }
      : null;

  return {
    kind: "hit",
    dragGroup,
    dragStart,
    drawingId: drawingHit.id,
    preview: dragStart ? groupStartPoints : null
  };
}

export type DrawingTransformPointerMove =
  | { kind: "resize"; preview: DrawingPointOverrides }
  | { kind: "rotate"; preview: DrawingPointOverrides }
  | { kind: "move"; preview: DrawingPointOverrides; snapPoint: Point | null };

export interface DrawingTransformPointerMoveOptions {
  dragState: DrawingDragState | null;
  point: Point;
  pointerId: number;
  resizeState: DrawingResizeState | null;
  rotateState: DrawingRotateState | null;
  scene: Scene | null;
  snapEnabled: boolean;
  squareConstrained: boolean;
}

export function getDrawingTransformPointerMove(options: DrawingTransformPointerMoveOptions): DrawingTransformPointerMove | null {
  if (options.resizeState?.pointerId === options.pointerId) {
    return {
      kind: "resize",
      preview: options.scene
        ? getResizedDrawingPointSnapshot(
            options.scene.drawings,
            options.resizeState.groupStartPoints,
            options.resizeState.bounds,
            options.resizeState.handle,
            options.point,
            options.squareConstrained
          )
        : new Map()
    };
  }

  if (options.rotateState?.pointerId === options.pointerId) {
    return {
      kind: "rotate",
      preview: options.scene
        ? getRotatedDrawingPointSnapshot(
            options.scene.drawings,
            options.rotateState.groupStartPoints,
            options.rotateState.center,
            options.rotateState.startAngle,
            options.point
          )
        : new Map()
    };
  }

  if (options.dragState?.pointerId === options.pointerId) {
    const preview = getSnapAwarePointSnapshotMovePreview(options.scene, options.dragState, options.point, options.snapEnabled);
    return {
      kind: "move",
      preview: preview.points,
      snapPoint: preview.snapPoint
    };
  }

  return null;
}

export type DrawingTransformPointerMoveAction =
  | { kind: "set-preview"; preview: DrawingPointOverrides; snapPoint?: Point | null }
  | { kind: "none" };

export function getDrawingTransformPointerMoveAction(move: DrawingTransformPointerMove | null): DrawingTransformPointerMoveAction {
  if (!move) {
    return { kind: "none" };
  }
  if (move.kind === "move") {
    return {
      kind: "set-preview",
      preview: move.preview,
      snapPoint: move.snapPoint
    };
  }
  return {
    kind: "set-preview",
    preview: move.preview
  };
}

export type DrawingTransformPointerComplete =
  | { kind: "move"; preview: DrawingPointOverrides | null; clearSnapPoint: true }
  | { kind: "resize"; preview: DrawingPointOverrides | null; clearSnapPoint: false }
  | { kind: "rotate"; preview: DrawingPointOverrides | null; clearSnapPoint: false };

export interface DrawingTransformPointerCompleteOptions {
  dragState: DrawingDragState | null;
  pointerId: number;
  preview: DrawingPointOverrides | null;
  resizeState: DrawingResizeState | null;
  rotateState: DrawingRotateState | null;
}

export function getDrawingTransformPointerComplete(options: DrawingTransformPointerCompleteOptions): DrawingTransformPointerComplete | null {
  if (options.dragState?.pointerId === options.pointerId) {
    return {
      kind: "move",
      preview: options.preview,
      clearSnapPoint: true
    };
  }

  if (options.resizeState?.pointerId === options.pointerId) {
    return {
      kind: "resize",
      preview: options.preview,
      clearSnapPoint: false
    };
  }

  if (options.rotateState?.pointerId === options.pointerId) {
    return {
      kind: "rotate",
      preview: options.preview,
      clearSnapPoint: false
    };
  }

  return null;
}

export type DrawingTransformPointerCompleteAction =
  | { kind: "commit-move"; preview: DrawingPointOverrides | null; clearSnapPoint: true }
  | { kind: "commit-resize"; preview: DrawingPointOverrides | null; clearSnapPoint: false }
  | { kind: "commit-rotate"; preview: DrawingPointOverrides | null; clearSnapPoint: false }
  | { kind: "none" };

export function getDrawingTransformPointerCompleteAction(complete: DrawingTransformPointerComplete | null): DrawingTransformPointerCompleteAction {
  if (!complete) {
    return { kind: "none" };
  }

  if (complete.kind === "move") {
    return {
      kind: "commit-move",
      preview: complete.preview,
      clearSnapPoint: complete.clearSnapPoint
    };
  }

  if (complete.kind === "resize") {
    return {
      kind: "commit-resize",
      preview: complete.preview,
      clearSnapPoint: complete.clearSnapPoint
    };
  }

  return {
    kind: "commit-rotate",
    preview: complete.preview,
    clearSnapPoint: complete.clearSnapPoint
  };
}
