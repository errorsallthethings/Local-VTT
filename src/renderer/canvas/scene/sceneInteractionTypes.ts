import type { LiveTablePoint, Point } from "../../../shared/localvtt";
import type { DrawingResizeHandle } from "../core/canvasInteraction";
import type { DrawingPointOverrides } from "../drawings/drawingRenderer";

export type TokenDragState = {
  pointerId: number;
  tokenId: string;
  offset: Point;
  startPosition: Point;
  waypoints: Point[];
  groupStartPositions: Map<string, Point>;
};

export type DrawingDragState = {
  pointerId: number;
  drawingId: string;
  start: Point;
  snapAnchor: Point;
  groupStartPoints: DrawingPointOverrides;
};

export type DrawingResizeState = {
  pointerId: number;
  handle: DrawingResizeHandle;
  bounds: { left: number; top: number; right: number; bottom: number };
  groupStartPoints: DrawingPointOverrides;
};

export type DrawingRotateState = {
  pointerId: number;
  center: Point;
  startAngle: number;
  groupStartPoints: DrawingPointOverrides;
};

export type LaserDragState = {
  pointerId: number;
  eventId: string;
  points: LiveTablePoint[];
};

export type SelectionMode = "replace" | "add" | "subtract";

export type SelectionDrag = {
  pointerId: number;
  start: Point;
  current: Point;
  mode: SelectionMode;
};
