import type { DrawingStrokeStyle, DrawingTemplateEffect, Point } from "../../../shared/localvtt";

export const DRAWING_POINT_MIN_DISTANCE = 3;

export type DrawingTool =
  | "freehand"
  | "line"
  | "rectangle"
  | "circle"
  | "triangle"
  | "polygon"
  | "template-line"
  | "template-rectangle"
  | "template-circle"
  | "template-cone";

export type DrawingPreview = {
  pointerId: number;
  kind: DrawingTool;
  points: Point[];
  current: Point;
  color: string;
  opacity: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth: number;
  fillColor?: string;
  fillOpacity?: number;
  strokeStyle?: DrawingStrokeStyle;
  templateEffect?: DrawingTemplateEffect;
  templateWidth?: number;
  measurementLabelVisible?: boolean;
  ellipse?: boolean;
};

export type DrawingPreviewStyle = {
  color: string;
  opacity: number;
  fillColor?: string;
  fillOpacity?: number;
  strokeStyle?: DrawingStrokeStyle;
  strokeWidth: number;
  templateEffect: DrawingTemplateEffect;
  templateWidth: number;
};

export type DrawingPolygonDraftPreviewStyle = {
  color: string;
  opacity: number;
  fillColor?: string;
  fillOpacity?: number;
  strokeStyle?: DrawingStrokeStyle;
  strokeWidth: number;
};

export type DrawingPolygonDraftLike = {
  points: Point[];
  current?: Point;
};

export function getDrawingPreviewFromPoint(pointerId: number, tool: DrawingTool, point: Point, style: DrawingPreviewStyle): DrawingPreview {
  const isTemplate = tool.startsWith("template-");
  return {
    pointerId,
    kind: tool,
    points: [point],
    current: point,
    color: style.color,
    opacity: style.opacity,
    strokeColor: style.color,
    strokeOpacity: style.opacity,
    fillColor: style.fillColor,
    fillOpacity: isTemplate ? 0 : style.fillOpacity,
    strokeStyle: isTemplate ? "dashed" : style.strokeStyle,
    strokeWidth: style.strokeWidth,
    templateEffect: isTemplate ? style.templateEffect : "plain",
    templateWidth: isTemplate ? style.templateWidth : 5,
    measurementLabelVisible: isTemplate
  };
}

export function getDrawingPolygonDraftPreview(draft: DrawingPolygonDraftLike | null | undefined, style: DrawingPolygonDraftPreviewStyle): DrawingPreview | null {
  if (!draft?.points[0]) {
    return null;
  }
  return {
    pointerId: -1,
    kind: "polygon",
    points: draft.points,
    current: draft.current ?? draft.points[draft.points.length - 1],
    color: style.color,
    opacity: style.opacity,
    strokeColor: style.color,
    strokeOpacity: style.opacity,
    fillColor: style.fillColor,
    fillOpacity: style.fillOpacity,
    strokeStyle: style.strokeStyle,
    strokeWidth: style.strokeWidth,
    templateEffect: "plain",
    templateWidth: 5,
    measurementLabelVisible: false
  };
}

export function getDrawingPreviewPoints(preview: DrawingPreview): Point[] {
  if (preview.kind === "circle" && preview.ellipse && preview.points[0]) {
    const [center] = preview.points;
    return [
      center,
      { x: preview.current.x, y: center.y },
      { x: center.x, y: preview.current.y }
    ];
  }
  if (isTwoPointDrawingTool(preview.kind)) {
    return [preview.points[0], preview.current].filter(Boolean);
  }
  const lastPoint = preview.points[preview.points.length - 1];
  if (!lastPoint || distanceBetweenPoints(lastPoint, preview.current) < DRAWING_POINT_MIN_DISTANCE) {
    return preview.points;
  }
  return [...preview.points, preview.current];
}

export function isMeaningfulDrawingPreview(preview: DrawingPreview): boolean {
  const points = getDrawingPreviewPoints(preview);
  if (points.length < 2) {
    return false;
  }
  return getPathDistance(points) >= DRAWING_POINT_MIN_DISTANCE;
}

export function shouldAddDrawingPoint(previous: Point | undefined, current: Point): boolean {
  return !previous || distanceBetweenPoints(previous, current) >= DRAWING_POINT_MIN_DISTANCE;
}

export function getDrawingHitRadius(cameraZoom: number): number {
  return Math.max(8, 8 / cameraZoom);
}

function getPathDistance(points: Point[]): number {
  let distance = 0;
  for (let index = 1; index < points.length; index += 1) {
    distance += distanceBetweenPoints(points[index - 1], points[index]);
  }
  return distance;
}

function distanceBetweenPoints(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isTwoPointDrawingTool(tool: DrawingTool): boolean {
  return tool !== "freehand" && tool !== "polygon";
}
