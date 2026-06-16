import * as THREE from "three";
import type { DrawingElement, DrawingStrokeStyle, DrawingTemplateEffect, GridSettings, Point, Scene } from "../../shared/localvtt";
import { formatMeasurementDistance, getStraightLineMeasurementDistance } from "./measurement";
import { drawSelectionBox } from "./selectionRenderer";
import { getNearestHexCoordinate, hexAxialToPoint } from "./tokenGeometry";

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

export type DrawingPointOverrides = Map<string, Point[]>;

type TemplateEffectRenderable = {
  id: string;
  image: CanvasImageSource;
  naturalHeight: number;
  naturalWidth: number;
};

type PlacedTemplateAsset = {
  angle: number;
  alpha: number;
  height: number;
  image: CanvasImageSource;
  width: number;
  x: number;
  y: number;
};

type TemplateEffectOverlayCacheEntry = {
  canvas: HTMLCanvasElement;
  key: string;
  left: number;
  top: number;
};

type TemplateEffectTuning = {
  density: number;
  maxPlacements: number;
  minPlacements: number;
  opacity: number;
  scale: number;
};

const TEMPLATE_EFFECT_RENDERABLE_WIDTH_PX = 800;
const TEMPLATE_EFFECT_OVERLAY_CACHE_LIMIT = 80;
const TEMPLATE_EFFECT_TUNING_VERSION = 2;
const DEFAULT_TEMPLATE_EFFECT_TUNING: TemplateEffectTuning = {
  density: 1,
  maxPlacements: 14,
  minPlacements: 5,
  opacity: 1,
  scale: 1
};
const TEMPLATE_EFFECT_TUNING: Partial<Record<DrawingTemplateEffect, Partial<TemplateEffectTuning>>> = {
  arcane: { density: 1.12, maxPlacements: 16, opacity: 1.18, scale: 1.12 },
  cold: { density: 1.08, maxPlacements: 16, opacity: 1.16, scale: 1.1 },
  fog: { density: 1.18, maxPlacements: 18, opacity: 1.32 },
  poison: { density: 1.15, maxPlacements: 18, opacity: 1.24 },
  radiant: { density: 1.1, maxPlacements: 16, opacity: 1.22, scale: 1.12 },
  storm: { density: 1.18, maxPlacements: 18, opacity: 1.26 },
  thunder: { density: 1.08, maxPlacements: 16, opacity: 1.18, scale: 1.14 }
};
const templateEffectOverlayCache = new Map<string, TemplateEffectOverlayCacheEntry>();
let acidTemplateRenderables: TemplateEffectRenderable[] | null = null;
let arcaneTemplateRenderables: TemplateEffectRenderable[] | null = null;
let coldTemplateRenderables: TemplateEffectRenderable[] | null = null;
let darknessTemplateRenderables: TemplateEffectRenderable[] | null = null;
let fireTemplateRenderables: TemplateEffectRenderable[] | null = null;
let fogTemplateRenderables: TemplateEffectRenderable[] | null = null;
let lightningTemplateRenderables: TemplateEffectRenderable[] | null = null;
let natureTemplateRenderables: TemplateEffectRenderable[] | null = null;
let poisonTemplateRenderables: TemplateEffectRenderable[] | null = null;
let psychicTemplateRenderables: TemplateEffectRenderable[] | null = null;
let radiantTemplateRenderables: TemplateEffectRenderable[] | null = null;
let stormTemplateRenderables: TemplateEffectRenderable[] | null = null;
let thunderTemplateRenderables: TemplateEffectRenderable[] | null = null;
let waterTemplateRenderables: TemplateEffectRenderable[] | null = null;
let webTemplateRenderables: TemplateEffectRenderable[] | null = null;

export function drawDrawings(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  mode: "gm" | "player",
  layerOpacity = 1,
  preview: DrawingPreview | null = null,
  zoom = 1,
  selectedDrawingId: string | string[] | null = null,
  drawingPointOverrides: DrawingPointOverrides | null = null,
  selectionPointOverrides: DrawingPointOverrides | null = drawingPointOverrides
) {
  if (layerOpacity <= 0) {
    return;
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const selectedDrawingIds = new Set(Array.isArray(selectedDrawingId) ? selectedDrawingId : selectedDrawingId ? [selectedDrawingId] : []);
  for (const drawing of scene.drawings) {
    if (!isDrawingVisible(drawing, mode)) {
      continue;
    }
    const overridePoints = mode === "gm" ? drawingPointOverrides?.get(drawing.id) : null;
    const renderDrawing = overridePoints ? { ...drawing, points: overridePoints } : drawing;
    drawDrawingElement(ctx, renderDrawing, scene, layerOpacity, selectedDrawingIds.has(drawing.id) || drawing.id === "template-preview");
    if (mode === "gm" && selectedDrawingIds.has(drawing.id)) {
      const selectionOverridePoints = selectionPointOverrides?.get(drawing.id);
      drawDrawingSelection(ctx, selectionOverridePoints ? { ...drawing, points: selectionOverridePoints } : renderDrawing, scene.grid, zoom);
    }
  }
  if (preview) {
    drawDrawingElement(
      ctx,
      {
        id: "preview",
        name: "Preview",
        kind: preview.kind === "circle" && !preview.ellipse ? "circle" : getDrawingKindForTool(preview.kind),
        points: getDrawingPreviewPoints(preview),
        color: preview.color,
        opacity: preview.opacity,
        strokeColor: preview.strokeColor ?? preview.color,
        strokeOpacity: preview.strokeOpacity ?? preview.opacity,
        strokeWidth: preview.strokeWidth,
        fillColor: preview.fillColor ?? preview.color,
        fillOpacity: preview.fillOpacity ?? 0,
        strokeStyle: preview.strokeStyle ?? "solid",
        templateEffect: preview.templateEffect,
        templateWidth: preview.templateWidth,
        templateFootprintVisible: preview.measurementLabelVisible === true,
        measurementLabelVisible: preview.measurementLabelVisible,
        visibleInGm: true,
        visibleInPlayer: true
      },
      scene,
      layerOpacity,
      true
    );
  }
  ctx.restore();
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

function drawDrawingSelection(ctx: CanvasRenderingContext2D, drawing: DrawingElement, grid: GridSettings, zoom: number) {
  const bounds = getDrawingBounds(drawing, grid);
  if (!bounds) {
    return;
  }
  drawSelectionBox(
    ctx,
    { x: bounds.left, y: bounds.top, width: Math.max(1, bounds.right - bounds.left), height: Math.max(1, bounds.bottom - bounds.top) },
    zoom,
    10
  );
}

export function getDrawingAtPoint(drawings: DrawingElement[], point: Point, hitRadius = 8, grid?: GridSettings): DrawingElement | null {
  for (const drawing of [...drawings].reverse()) {
    if (!isDrawingVisible(drawing, "gm")) {
      continue;
    }
    if (isPointNearDrawing(drawing, point, hitRadius, grid)) {
      return drawing;
    }
  }
  return null;
}

function drawDrawingElement(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scene: Scene, layerOpacity: number, showTemplateLabel: boolean) {
  const points = drawing.points;
  if (points.length === 0) {
    return;
  }

  ctx.save();
  const strokeOpacity = drawing.strokeOpacity ?? drawing.opacity;
  ctx.globalAlpha = Math.max(0, Math.min(1, strokeOpacity * layerOpacity));
  ctx.strokeStyle = drawing.strokeColor ?? drawing.color;
  ctx.fillStyle = drawing.fillColor ?? drawing.fill ?? drawing.color;
  ctx.lineWidth = drawing.strokeWidth;
  if (drawing.measurementLabelVisible) {
    ctx.setLineDash([Math.max(8, drawing.strokeWidth * 1.8), Math.max(6, drawing.strokeWidth * 1.1)]);
    applyTemplateEffectStroke(ctx, drawing);
  } else {
    applyDrawingStrokeStyle(ctx, drawing.strokeStyle ?? "solid", drawing.strokeWidth);
  }

  if (drawing.kind === "line") {
    drawLine(ctx, points, drawing, scene.grid, layerOpacity, showTemplateLabel);
  } else if (drawing.kind === "rectangle") {
    drawRectangle(ctx, points, drawing, layerOpacity);
  } else if (drawing.kind === "circle") {
    drawCircle(ctx, points, drawing, layerOpacity);
  } else if (drawing.kind === "ellipse") {
    drawEllipse(ctx, points, drawing, layerOpacity);
  } else if (drawing.kind === "triangle") {
    drawTriangle(ctx, points, drawing, layerOpacity);
  } else if (drawing.kind === "polygon") {
    drawPolygonShape(ctx, points, drawing, layerOpacity);
  } else if (drawing.kind === "cone") {
    drawCone(ctx, points, drawing, layerOpacity);
  } else {
    drawPath(ctx, points);
  }
  if (drawing.measurementLabelVisible && drawing.templateFootprintVisible === true) {
    drawTemplateGridHighlights(ctx, drawing, scene.grid);
  }
  if (showTemplateLabel) {
    drawTemplateLabel(ctx, drawing, scene);
  }
  ctx.restore();
}

function isPointNearDrawing(drawing: DrawingElement, point: Point, hitRadius: number, grid?: GridSettings): boolean {
  const points = drawing.points;
  if (points.length < 2) {
    return false;
  }
  if (drawing.kind === "circle") {
    const radius = distanceBetweenPoints(points[0], points[1]);
    return Math.abs(distanceBetweenPoints(points[0], point) - radius) <= hitRadius || distanceBetweenPoints(points[0], point) <= radius;
  }
  if (drawing.kind === "ellipse") {
    return isPointNearEllipse(drawing, point, hitRadius);
  }
  if (drawing.kind === "rectangle") {
    if (points.length >= 4) {
      return isPointInPolygon(point, points);
    }
    const minX = Math.min(points[0].x, points[1].x) - hitRadius;
    const maxX = Math.max(points[0].x, points[1].x) + hitRadius;
    const minY = Math.min(points[0].y, points[1].y) - hitRadius;
    const maxY = Math.max(points[0].y, points[1].y) + hitRadius;
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(points);
    return triangle ? isPointInTriangle(point, triangle[0], triangle[1], triangle[2]) : false;
  }
  if (drawing.kind === "triangle") {
    const triangle = getTriangle(points);
    return triangle ? isPointInTriangle(point, triangle[0], triangle[1], triangle[2]) : false;
  }
  if (drawing.kind === "polygon") {
    return isPointInPolygon(point, points);
  }
  if (drawing.measurementLabelVisible && drawing.kind === "line") {
    const corridor = getLineTemplateCorridorPoints(drawing, 1, grid);
    if (corridor) {
      return isPointInPolygon(point, corridor);
    }
  }
  return points.some((candidate, index) => {
    const next = points[index + 1];
    return next ? distanceToSegment(point, candidate, next) <= hitRadius : false;
  });
}

function isPointNearEllipse(drawing: DrawingElement, point: Point, hitRadius: number): boolean {
  const [center, edge, axis] = drawing.points;
  if (!center || !edge) {
    return false;
  }
  const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const deltaX = point.x - center.x;
  const deltaY = point.y - center.y;
  const localX = deltaX * cos - deltaY * sin;
  const localY = deltaX * sin + deltaY * cos;
  const radiusX = Math.max(0.5, Math.hypot(edge.x - center.x, edge.y - center.y));
  const radiusY = axis ? Math.max(0.5, Math.hypot(axis.x - center.x, axis.y - center.y)) : Math.max(0.5, Math.abs(edge.y - center.y));
  const normalizedX = localX / radiusX;
  const normalizedY = localY / radiusY;
  const normalizedDistance = normalizedX ** 2 + normalizedY ** 2;
  const tolerance = Math.max(hitRadius / radiusX, hitRadius / radiusY);
  return normalizedDistance <= 1 || Math.abs(normalizedDistance - 1) <= tolerance;
}

function drawLine(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, grid: GridSettings, layerOpacity: number, showCenterGuide: boolean) {
  if (points.length < 2) {
    return;
  }
  if (drawing.measurementLabelVisible) {
    const corridor = getLineTemplateCorridorPoints(drawing, 1, grid);
    if (!corridor) {
      drawLinePath(ctx, points);
      ctx.stroke();
      return;
    }
    ctx.beginPath();
    traceClosedPath(ctx, corridor);
    fillCurrentTemplatePath(ctx, drawing, layerOpacity);
    ctx.stroke();
    drawTemplateAssetOverlay(ctx, drawing, layerOpacity, grid);
    ctx.beginPath();
    traceClosedPath(ctx, corridor);
    ctx.stroke();
    if (showCenterGuide) {
      drawDashedGuide(ctx, points[0], points[1], drawing);
    }
    return;
  }
  drawLinePath(ctx, points);
  ctx.stroke();
}

function drawLinePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
}

function drawPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) {
    return;
  }
  tracePath(ctx, points);
  ctx.stroke();
}

function tracePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
}

function drawRectangle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  if (points.length >= 4) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();
    fillCurrentTemplatePath(ctx, drawing, layerOpacity);
    ctx.stroke();
    drawTemplateAssetOverlay(ctx, drawing, layerOpacity);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();
    ctx.stroke();
    return;
  }
  const [start, end] = points;
  fillTemplateShape(ctx, drawing, layerOpacity, () => {
    ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
  });
  ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  drawTemplateAssetOverlay(ctx, drawing, layerOpacity);
  ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
}

function drawCircle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  const [start, end] = points;
  ctx.beginPath();
  ctx.arc(start.x, start.y, distanceBetweenPoints(start, end), 0, Math.PI * 2);
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
  drawTemplateAssetOverlay(ctx, drawing, layerOpacity);
  ctx.beginPath();
  ctx.arc(start.x, start.y, distanceBetweenPoints(start, end), 0, Math.PI * 2);
  ctx.stroke();
  if (drawing.measurementLabelVisible) {
    drawCenterPoint(ctx, start, drawing);
    if (drawing.id === "preview") {
      drawDashedGuide(ctx, start, end, drawing);
    }
  }
}

function drawCone(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  const triangle = getConeTriangle(points);
  if (!triangle) {
    return;
  }
  const [origin, left, right] = triangle;

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
  drawTemplateAssetOverlay(ctx, drawing, layerOpacity);
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.stroke();
  if (drawing.measurementLabelVisible) {
    const oppositeCenter = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
    drawDashedGuide(ctx, origin, oppositeCenter, drawing);
  }
}

function drawEllipse(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  const [center, edge, axis] = points;
  const radiusX = Math.max(0.5, Math.hypot(edge.x - center.x, edge.y - center.y));
  const radiusY = axis ? Math.max(0.5, Math.hypot(axis.x - center.x, axis.y - center.y)) : Math.max(0.5, Math.abs(edge.y - center.y));
  const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, radiusX, radiusY, rotation, 0, Math.PI * 2);
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
}

function drawTriangle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  const triangle = getTriangle(points);
  if (!triangle) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(triangle[0].x, triangle[0].y);
  ctx.lineTo(triangle[1].x, triangle[1].y);
  ctx.lineTo(triangle[2].x, triangle[2].y);
  ctx.closePath();
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
}

function drawPolygonShape(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 3) {
    drawPath(ctx, points);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
}

function fillTemplateShape(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number, tracePath: () => void) {
  ctx.beginPath();
  tracePath();
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
}

function fillCurrentTemplatePath(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number) {
  if (drawing.measurementLabelVisible) {
    fillTemplateEffectPath(ctx, drawing, layerOpacity);
    return;
  }
  const fillOpacity = drawing.fillOpacity ?? (drawing.fill ? drawing.opacity : 0);
  if (fillOpacity <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, fillOpacity * layerOpacity));
  ctx.fill();
  ctx.restore();
}

function drawCenterPoint(ctx: CanvasRenderingContext2D, point: Point, drawing: DrawingElement) {
  ctx.save();
  ctx.globalAlpha = Math.max(0.65, Math.min(1, drawing.opacity));
  ctx.fillStyle = drawing.strokeColor ?? drawing.color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, Math.max(3, drawing.strokeWidth * 0.12), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDashedGuide(ctx: CanvasRenderingContext2D, start: Point, end: Point, drawing: DrawingElement) {
  ctx.save();
  ctx.globalAlpha = Math.max(0.55, Math.min(0.9, drawing.opacity));
  ctx.strokeStyle = drawing.strokeColor ?? drawing.color;
  ctx.lineWidth = Math.max(2, drawing.strokeWidth * 0.18);
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.restore();
}

function applyDrawingStrokeStyle(ctx: CanvasRenderingContext2D, style: DrawingStrokeStyle, strokeWidth: number) {
  if (style === "dashed") {
    ctx.setLineDash([Math.max(8, strokeWidth * 1.8), Math.max(6, strokeWidth * 1.1)]);
    return;
  }
  if (style === "dotted") {
    ctx.setLineDash([Math.max(1, strokeWidth * 0.12), Math.max(6, strokeWidth * 1.1)]);
    return;
  }
  if (style === "dash-dot") {
    ctx.setLineDash([Math.max(10, strokeWidth * 1.8), Math.max(5, strokeWidth * 0.8), Math.max(1, strokeWidth * 0.18), Math.max(5, strokeWidth * 0.8)]);
    return;
  }
  if (style === "sketch") {
    ctx.setLineDash([Math.max(12, strokeWidth * 2.1), Math.max(3, strokeWidth * 0.45), Math.max(4, strokeWidth * 0.7), Math.max(3, strokeWidth * 0.55)]);
    return;
  }
  ctx.setLineDash([]);
}

export function getConeTriangle(points: Point[]): [Point, Point, Point] | null {
  if (points.length < 2) {
    return null;
  }
  const [start, end] = points;
  const distance = distanceBetweenPoints(start, end);
  if (distance <= 0) {
    return null;
  }
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const perpendicularAngle = angle + Math.PI / 2;
  const halfWidth = distance / 2;
  return [
    start,
    {
      x: end.x + Math.cos(perpendicularAngle) * halfWidth,
      y: end.y + Math.sin(perpendicularAngle) * halfWidth
    },
    {
      x: end.x - Math.cos(perpendicularAngle) * halfWidth,
      y: end.y - Math.sin(perpendicularAngle) * halfWidth
    }
  ];
}

function getTriangle(points: Point[]): [Point, Point, Point] | null {
  if (points.length >= 3) {
    return [points[0], points[1], points[2]];
  }
  if (points.length < 2) {
    return null;
  }
  const [start, end] = points;
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return [
    start,
    end,
    {
      x: midpoint.x - dy * 0.866,
      y: midpoint.y + dx * 0.866
    }
  ];
}

function isPointInTriangle(point: Point, a: Point, b: Point, c: Point): boolean {
  const area = triangleArea(a, b, c);
  const area1 = triangleArea(point, b, c);
  const area2 = triangleArea(a, point, c);
  const area3 = triangleArea(a, b, point);
  return Math.abs(area - (area1 + area2 + area3)) <= 0.5;
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) {
    return false;
  }
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    if ((current.y > point.y) !== (previous.y > point.y) && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x) {
      inside = !inside;
    }
  }
  return inside;
}

function triangleArea(a: Point, b: Point, c: Point): number {
  return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (lengthSquared === 0) {
    return distanceBetweenPoints(point, start);
  }
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / lengthSquared));
  return distanceBetweenPoints(point, {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y)
  });
}

function drawTemplateLabel(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scene: Scene) {
  if (drawing.measurementLabelVisible === false) {
    return;
  }
  if (drawing.kind !== "line" && drawing.kind !== "rectangle" && drawing.kind !== "circle" && drawing.kind !== "cone") {
    return;
  }
  if (drawing.points.length < 2) {
    return;
  }
  const label = getTemplateLabel(drawing, scene);
  if (!label) {
    return;
  }
  const { position, angle } = getTemplateLabelPosition(drawing);
  const scale = 1;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.font = `800 ${Math.round(48 * scale)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);
  drawTemplateLabelHalo(ctx, label, scale);
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(label, 0, scale);
  ctx.restore();
}

function fillTemplateEffectPath(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number) {
  const effect = getTemplateEffectStyle(drawing.templateEffect ?? "plain");
  if ((drawing.templateEffect === "lightning" || drawing.templateEffect === "cold" || drawing.templateEffect === "poison" || drawing.templateEffect === "acid" || drawing.templateEffect === "arcane" || drawing.templateEffect === "fire" || drawing.templateEffect === "fog" || drawing.templateEffect === "darkness" || drawing.templateEffect === "nature" || drawing.templateEffect === "psychic" || drawing.templateEffect === "radiant" || drawing.templateEffect === "storm" || drawing.templateEffect === "thunder" || drawing.templateEffect === "water" || drawing.templateEffect === "web") && (drawing.kind === "circle" || drawing.kind === "rectangle" || drawing.kind === "cone")) {
    drawTemplateInnerGlow(ctx, drawing, layerOpacity);
  }
  if (effect.fillOpacity <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, effect.fillOpacity * layerOpacity));
  ctx.fillStyle = effect.fill;
  ctx.shadowBlur = 0;
  ctx.fill();
  ctx.restore();
}

function drawTemplateInnerGlow(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number) {
  const alpha = Math.max(0, Math.min(0.7, layerOpacity * 0.55));
  if (alpha <= 0) {
    return;
  }
  const cold = drawing.templateEffect === "cold";
  const acid = drawing.templateEffect === "acid";
  const arcane = drawing.templateEffect === "arcane";
  const darkness = drawing.templateEffect === "darkness";
  const fire = drawing.templateEffect === "fire";
  const fog = drawing.templateEffect === "fog";
  const nature = drawing.templateEffect === "nature";
  const poison = drawing.templateEffect === "poison";
  const psychic = drawing.templateEffect === "psychic";
  const radiant = drawing.templateEffect === "radiant";
  const storm = drawing.templateEffect === "storm";
  const thunder = drawing.templateEffect === "thunder";
  const water = drawing.templateEffect === "water";
  const web = drawing.templateEffect === "web";
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = acid ? "#bef264" : poison ? "#a3e635" : cold ? "#f8fafc" : arcane ? "#c4b5fd" : fire ? "#fb923c" : fog ? "#e2e8f0" : darkness ? "#020617" : nature ? "#86efac" : psychic ? "#f0abfc" : radiant ? "#fef3c7" : storm ? "#93c5fd" : thunder ? "#d8b4fe" : water ? "#5eead4" : web ? "#f8fafc" : "#facc15";
  ctx.shadowColor = acid ? "#d9f99d" : poison ? "#84cc16" : cold ? "#e0f2fe" : arcane ? "#8b5cf6" : fire ? "#f97316" : fog ? "#f8fafc" : darkness ? "#020617" : nature ? "#22c55e" : psychic ? "#db2777" : radiant ? "#facc15" : storm ? "#60a5fa" : thunder ? "#9333ea" : water ? "#14b8a6" : web ? "#e2e8f0" : "#fde047";
  ctx.shadowBlur = acid ? Math.max(26, drawing.strokeWidth * 1.55) : Math.max(18, drawing.strokeWidth * 1.15);
  ctx.lineWidth = acid ? Math.max(34, drawing.strokeWidth * 3.25) : Math.max(26, drawing.strokeWidth * 2.6);
  ctx.stroke();
  ctx.globalAlpha = acid ? Math.min(0.56, alpha * 0.96) : Math.min(0.42, alpha * 0.78);
  ctx.shadowBlur = 0;
  ctx.lineWidth = acid ? Math.max(14, drawing.strokeWidth * 1.45) : Math.max(10, drawing.strokeWidth * 1.1);
  ctx.strokeStyle = acid ? "#f7fee7" : poison ? "#d9f99d" : cold ? "#ffffff" : arcane ? "#ede9fe" : fire ? "#fed7aa" : fog ? "#f8fafc" : darkness ? "#1e293b" : nature ? "#dcfce7" : psychic ? "#fdf4ff" : radiant ? "#fff7ed" : storm ? "#dbeafe" : thunder ? "#f3e8ff" : water ? "#ccfbf1" : web ? "#ffffff" : "#fef08a";
  ctx.stroke();
  ctx.restore();
}

function applyTemplateEffectStroke(ctx: CanvasRenderingContext2D, drawing: DrawingElement) {
  const effect = getTemplateEffectStyle(drawing.templateEffect ?? "plain");
  ctx.strokeStyle = effect.stroke;
  ctx.shadowBlur = 0;
  if (effect.dash) {
    ctx.setLineDash(effect.dash.map((value) => Math.max(2, value * Math.max(1, drawing.strokeWidth / 40))));
  }
}

function getTemplateEffectStyle(effect: DrawingTemplateEffect): { stroke: string; fill: string; fillOpacity: number; highlightFill: string; highlightStroke: string; dash?: number[] } {
  switch (effect) {
    case "acid":
      return { stroke: "#84cc16", fill: "#bef264", fillOpacity: 0, highlightFill: "rgb(132 204 22 / 0.2)", highlightStroke: "rgb(217 249 157 / 0.34)", dash: [12, 8, 3, 8] };
    case "arcane":
      return { stroke: "#a78bfa", fill: "#7c3aed", fillOpacity: 0, highlightFill: "rgb(124 58 237 / 0.2)", highlightStroke: "rgb(221 214 254 / 0.36)", dash: [10, 7] };
    case "cold":
      return { stroke: "#67e8f9", fill: "#f8fafc", fillOpacity: 0, highlightFill: "rgb(207 250 254 / 0.18)", highlightStroke: "rgb(165 243 252 / 0.38)", dash: [16, 6] };
    case "darkness":
      return { stroke: "#64748b", fill: "#020617", fillOpacity: 0, highlightFill: "rgb(15 23 42 / 0.34)", highlightStroke: "rgb(148 163 184 / 0.38)", dash: [7, 7] };
    case "fire":
      return { stroke: "#f97316", fill: "#f97316", fillOpacity: 0, highlightFill: "rgb(250 204 21 / 0.2)", highlightStroke: "rgb(254 215 170 / 0.38)", dash: [18, 7, 5, 7] };
    case "fog":
      return { stroke: "#cbd5e1", fill: "#e2e8f0", fillOpacity: 0, highlightFill: "rgb(226 232 240 / 0.22)", highlightStroke: "rgb(248 250 252 / 0.32)", dash: [5, 10] };
    case "lightning":
      return { stroke: "#fde047", fill: "#fde047", fillOpacity: 0, highlightFill: "rgb(250 204 21 / 0.18)", highlightStroke: "rgb(254 240 138 / 0.45)", dash: [20, 4, 3, 4] };
    case "nature":
      return { stroke: "#22c55e", fill: "#4ade80", fillOpacity: 0, highlightFill: "rgb(74 222 128 / 0.18)", highlightStroke: "rgb(187 247 208 / 0.34)", dash: [6, 5, 2, 5] };
    case "poison":
      return { stroke: "#a3e635", fill: "#a3e635", fillOpacity: 0, highlightFill: "rgb(54 83 20 / 0.28)", highlightStroke: "rgb(217 249 157 / 0.34)", dash: [9, 9] };
    case "psychic":
      return { stroke: "#f0abfc", fill: "#c026d3", fillOpacity: 0, highlightFill: "rgb(192 38 211 / 0.18)", highlightStroke: "rgb(245 208 254 / 0.38)", dash: [3, 7, 14, 7] };
    case "radiant":
      return { stroke: "#facc15", fill: "#fef3c7", fillOpacity: 0, highlightFill: "rgb(254 243 199 / 0.2)", highlightStroke: "rgb(254 240 138 / 0.45)", dash: [14, 5] };
    case "storm":
      return { stroke: "#60a5fa", fill: "#1e3a8a", fillOpacity: 0, highlightFill: "rgb(30 58 138 / 0.24)", highlightStroke: "rgb(147 197 253 / 0.38)", dash: [11, 5, 3, 5] };
    case "thunder":
      return { stroke: "#c084fc", fill: "#4c1d95", fillOpacity: 0, highlightFill: "rgb(76 29 149 / 0.18)", highlightStroke: "rgb(216 180 254 / 0.38)", dash: [22, 5] };
    case "water":
      return { stroke: "#0891b2", fill: "#0ea5e9", fillOpacity: 0, highlightFill: "rgb(14 165 233 / 0.18)", highlightStroke: "rgb(94 234 212 / 0.36)", dash: [12, 5] };
    case "web":
      return { stroke: "#f8fafc", fill: "#cbd5e1", fillOpacity: 0, highlightFill: "rgb(203 213 225 / 0.2)", highlightStroke: "rgb(248 250 252 / 0.45)", dash: [4, 6, 14, 6] };
    case "plain":
    default:
      return { stroke: "#7dd3fc", fill: "#7dd3fc", fillOpacity: 0.08, highlightFill: "rgb(122 162 247 / 0.18)", highlightStroke: "rgb(255 255 255 / 0.34)" };
  }
}

function drawTemplateAssetOverlay(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number, grid?: GridSettings) {
  const effect = drawing.templateEffect ?? "plain";
  if (drawing.id === "preview" || (effect !== "web" && effect !== "poison" && effect !== "acid" && effect !== "arcane" && effect !== "cold" && effect !== "lightning" && effect !== "fire" && effect !== "fog" && effect !== "darkness" && effect !== "nature" && effect !== "psychic" && effect !== "radiant" && effect !== "storm" && effect !== "thunder" && effect !== "water") || (drawing.kind !== "line" && drawing.kind !== "circle" && drawing.kind !== "rectangle" && drawing.kind !== "cone")) {
    return;
  }
  const renderables = getTemplateEffectRenderables(effect);
  if (renderables.length === 0) {
    return;
  }
  const bounds = getTemplateEffectBounds(drawing, grid);
  if (!bounds) {
    return;
  }
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  if (width <= 0 || height <= 0) {
    return;
  }

  const overlay = getTemplateEffectOverlay(drawing, bounds, renderables, layerOpacity, grid);
  if (!overlay) {
    return;
  }
  ctx.drawImage(overlay.canvas, overlay.left, overlay.top);
}

function getTemplateEffectOverlay(
  drawing: DrawingElement,
  bounds: { left: number; top: number; right: number; bottom: number },
  renderables: TemplateEffectRenderable[],
  layerOpacity: number,
  grid?: GridSettings
): TemplateEffectOverlayCacheEntry | null {
  if (typeof document === "undefined") {
    return null;
  }
  const cacheKey = getTemplateEffectOverlayCacheKey(drawing, bounds, renderables, layerOpacity, grid);
  const cached = templateEffectOverlayCache.get(cacheKey);
  if (cached) {
    templateEffectOverlayCache.delete(cacheKey);
    templateEffectOverlayCache.set(cacheKey, cached);
    return cached;
  }

  const width = Math.ceil(bounds.right - bounds.left);
  const height = Math.ceil(bounds.bottom - bounds.top);
  if (width <= 0 || height <= 0) {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const overlayCtx = canvas.getContext("2d");
  if (!overlayCtx) {
    return null;
  }

  const tuning = getTemplateEffectTuning(drawing.templateEffect ?? "plain");
  const random = createSeededRandom(hashString(`${drawing.id}:${drawing.kind}:${drawing.templateEffect}:${pointsSeed(drawing.points)}`));
  const basePlacementCount = Math.round((width * height) / 42000);
  const placementCount = Math.max(tuning.minPlacements, Math.min(tuning.maxPlacements, Math.round(basePlacementCount * tuning.density)));
  const placements = createTemplateAssetPlacements(drawing, bounds, renderables, placementCount, random, grid, tuning);
  const bands = 7;
  const innerScale = 0.58;
  overlayCtx.save();
  overlayCtx.translate(-bounds.left, -bounds.top);
  if (drawing.kind === "line") {
    overlayCtx.save();
    overlayCtx.beginPath();
    traceTemplateEffectPath(overlayCtx, drawing, 1, grid);
    overlayCtx.clip();
    overlayCtx.globalAlpha = Math.max(0.08, Math.min(0.9, layerOpacity * tuning.opacity));
    for (const placement of placements) {
      drawPlacedTemplateAsset(overlayCtx, placement);
    }
    overlayCtx.restore();
    overlayCtx.restore();
    const entry = { canvas, key: cacheKey, left: bounds.left, top: bounds.top };
    templateEffectOverlayCache.set(cacheKey, entry);
    trimTemplateEffectOverlayCache();
    return entry;
  }
  for (let bandIndex = 0; bandIndex < bands; bandIndex += 1) {
    const outerScale = 1 - ((1 - innerScale) * bandIndex) / bands;
    const bandInnerScale = 1 - ((1 - innerScale) * (bandIndex + 1)) / bands;
    const fade = 1 - bandIndex / bands;
    overlayCtx.save();
    overlayCtx.beginPath();
    traceTemplateEffectPath(overlayCtx, drawing, outerScale, grid);
    traceTemplateEffectPath(overlayCtx, drawing, bandInnerScale, grid);
    overlayCtx.clip("evenodd");
    overlayCtx.globalAlpha = Math.max(0.04, Math.min(0.9, layerOpacity * tuning.opacity * fade * fade));
    for (const placement of placements) {
      drawPlacedTemplateAsset(overlayCtx, placement);
    }
    overlayCtx.restore();
  }
  overlayCtx.restore();

  const entry = { canvas, key: cacheKey, left: bounds.left, top: bounds.top };
  templateEffectOverlayCache.set(cacheKey, entry);
  trimTemplateEffectOverlayCache();
  return entry;
}

function getTemplateEffectOverlayCacheKey(
  drawing: DrawingElement,
  bounds: { left: number; top: number; right: number; bottom: number },
  renderables: TemplateEffectRenderable[],
  layerOpacity: number,
  grid?: GridSettings
): string {
  const lineWidthPx = drawing.kind === "line" ? getLineTemplateEffectWidthPixels(drawing, grid) : 0;
  return [
    drawing.id,
    drawing.kind,
    drawing.templateEffect ?? "plain",
    drawing.strokeColor ?? drawing.color,
    drawing.opacity,
    drawing.strokeWidth,
    drawing.templateWidth ?? 5,
    Math.round(lineWidthPx * 10),
    Math.round(layerOpacity * 1000),
    Math.round(bounds.left),
    Math.round(bounds.top),
    Math.round(bounds.right),
    Math.round(bounds.bottom),
    pointsSeed(drawing.points),
    `tune-${TEMPLATE_EFFECT_TUNING_VERSION}`,
    renderables.map((asset) => asset.id).join("|")
  ].join(":");
}

function trimTemplateEffectOverlayCache() {
  while (templateEffectOverlayCache.size > TEMPLATE_EFFECT_OVERLAY_CACHE_LIMIT) {
    const oldestKey = templateEffectOverlayCache.keys().next().value;
    if (!oldestKey) {
      return;
    }
    templateEffectOverlayCache.delete(oldestKey);
  }
}

function getTemplateEffectBounds(drawing: DrawingElement, grid?: GridSettings): { left: number; top: number; right: number; bottom: number } | null {
  const bounds = getDrawingBounds(drawing, grid);
  if (!bounds) {
    return null;
  }
  if (drawing.kind !== "line") {
    return bounds;
  }
  const padding = getLineTemplateEffectWidthPixels(drawing, grid) / 2 + TEMPLATE_EFFECT_RENDERABLE_WIDTH_PX * 0.08;
  return {
    left: bounds.left - padding,
    top: bounds.top - padding,
    right: bounds.right + padding,
    bottom: bounds.bottom + padding
  };
}

function getLineTemplateEffectWidthPixels(drawing: DrawingElement, grid?: GridSettings): number {
  const widthFeet = drawing.templateWidth ?? 5;
  if (widthFeet <= 0) {
    return Math.max(12, drawing.strokeWidth * 2.5);
  }
  if (grid && grid.type !== "gridless" && grid.sizePx > 0 && grid.measurement.unitsPerGridCell > 0) {
    return (widthFeet / grid.measurement.unitsPerGridCell) * grid.sizePx;
  }
  return Math.max(drawing.strokeWidth * 1.8, widthFeet * 10);
}

function getTemplateEffectRenderables(effect: DrawingTemplateEffect): TemplateEffectRenderable[] {
  if (effect === "web") {
    return getWebTemplateRenderables();
  }
  if (effect === "acid") {
    return getAcidTemplateRenderables();
  }
  if (effect === "arcane") {
    return getArcaneTemplateRenderables();
  }
  if (effect === "cold") {
    return getColdTemplateRenderables();
  }
  if (effect === "darkness") {
    return getDarknessTemplateRenderables();
  }
  if (effect === "fire") {
    return getFireTemplateRenderables();
  }
  if (effect === "fog") {
    return getFogTemplateRenderables();
  }
  if (effect === "lightning") {
    return getLightningTemplateRenderables();
  }
  if (effect === "nature") {
    return getNatureTemplateRenderables();
  }
  if (effect === "poison") {
    return getPoisonTemplateRenderables();
  }
  if (effect === "psychic") {
    return getPsychicTemplateRenderables();
  }
  if (effect === "radiant") {
    return getRadiantTemplateRenderables();
  }
  if (effect === "storm") {
    return getStormTemplateRenderables();
  }
  if (effect === "thunder") {
    return getThunderTemplateRenderables();
  }
  if (effect === "water") {
    return getWaterTemplateRenderables();
  }
  return [];
}

function getPoisonTemplateRenderables(): TemplateEffectRenderable[] {
  if (poisonTemplateRenderables) {
    return poisonTemplateRenderables;
  }
  const canvas = createPoisonBubbleImage();
  poisonTemplateRenderables = canvas
    ? [
        {
          id: "three-poison-bubbles-v1",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return poisonTemplateRenderables;
}

function getPsychicTemplateRenderables(): TemplateEffectRenderable[] {
  if (psychicTemplateRenderables) {
    return psychicTemplateRenderables;
  }
  const canvas = createPsychicHazeImage();
  psychicTemplateRenderables = canvas
    ? [
        {
          id: "three-psychic-haze-v1",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return psychicTemplateRenderables;
}

function getAcidTemplateRenderables(): TemplateEffectRenderable[] {
  if (acidTemplateRenderables) {
    return acidTemplateRenderables;
  }
  const canvas = createAcidSpatterImage();
  acidTemplateRenderables = canvas
    ? [
        {
          id: "three-acid-spatter-v2",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return acidTemplateRenderables;
}

function getArcaneTemplateRenderables(): TemplateEffectRenderable[] {
  if (arcaneTemplateRenderables) {
    return arcaneTemplateRenderables;
  }
  const canvas = createArcaneGlyphImage();
  arcaneTemplateRenderables = canvas
    ? [
        {
          id: "three-arcane-glyphs-v2",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return arcaneTemplateRenderables;
}

function getColdTemplateRenderables(): TemplateEffectRenderable[] {
  if (coldTemplateRenderables) {
    return coldTemplateRenderables;
  }
  const canvas = createColdShardImage();
  coldTemplateRenderables = canvas
    ? [
        {
          id: "three-cold-shards-v1",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return coldTemplateRenderables;
}

function getDarknessTemplateRenderables(): TemplateEffectRenderable[] {
  if (darknessTemplateRenderables) {
    return darknessTemplateRenderables;
  }
  const canvas = createDarknessMistImage();
  darknessTemplateRenderables = canvas
    ? [
        {
          id: "three-darkness-mist-v1",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return darknessTemplateRenderables;
}

function getLightningTemplateRenderables(): TemplateEffectRenderable[] {
  if (lightningTemplateRenderables) {
    return lightningTemplateRenderables;
  }
  const canvas = createLightningForkImage();
  lightningTemplateRenderables = canvas
    ? [
        {
          id: "three-lightning-forks-v1",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return lightningTemplateRenderables;
}

function getNatureTemplateRenderables(): TemplateEffectRenderable[] {
  if (natureTemplateRenderables) {
    return natureTemplateRenderables;
  }
  const canvas = createNatureThornImage();
  natureTemplateRenderables = canvas
    ? [
        {
          id: "three-nature-thorns-v6",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return natureTemplateRenderables;
}

function getFireTemplateRenderables(): TemplateEffectRenderable[] {
  if (fireTemplateRenderables) {
    return fireTemplateRenderables;
  }
  const canvas = createFireTongueImage();
  fireTemplateRenderables = canvas
    ? [
        {
          id: "three-fire-tongues-v1",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return fireTemplateRenderables;
}

function getFogTemplateRenderables(): TemplateEffectRenderable[] {
  if (fogTemplateRenderables) {
    return fogTemplateRenderables;
  }
  const canvas = createFogCloudImage();
  fogTemplateRenderables = canvas
    ? [
        {
          id: "three-fog-clouds-v1",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return fogTemplateRenderables;
}

function getStormTemplateRenderables(): TemplateEffectRenderable[] {
  if (stormTemplateRenderables) {
    return stormTemplateRenderables;
  }
  const canvas = createStormCloudImage();
  stormTemplateRenderables = canvas
    ? [
        {
          id: "three-storm-clouds-v1",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return stormTemplateRenderables;
}

function getThunderTemplateRenderables(): TemplateEffectRenderable[] {
  if (thunderTemplateRenderables) {
    return thunderTemplateRenderables;
  }
  const canvas = createThunderWaveImage();
  thunderTemplateRenderables = canvas
    ? [
        {
          id: "three-thunder-waves-v2",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return thunderTemplateRenderables;
}

function getRadiantTemplateRenderables(): TemplateEffectRenderable[] {
  if (radiantTemplateRenderables) {
    return radiantTemplateRenderables;
  }
  const canvas = createRadiantLightImage();
  radiantTemplateRenderables = canvas
    ? [
        {
          id: "three-radiant-light-v1",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return radiantTemplateRenderables;
}

function getWaterTemplateRenderables(): TemplateEffectRenderable[] {
  if (waterTemplateRenderables) {
    return waterTemplateRenderables;
  }
  const canvas = createWaterDropletImage();
  waterTemplateRenderables = canvas
    ? [
        {
          id: "three-water-ripples-currents-droplets-v3",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return waterTemplateRenderables;
}

function getWebTemplateRenderables(): TemplateEffectRenderable[] {
  if (webTemplateRenderables) {
    return webTemplateRenderables;
  }
  const canvas = createWebStrandImage();
  webTemplateRenderables = canvas
    ? [
        {
          id: "three-web-strands-v2",
          image: canvas,
          naturalHeight: canvas.height,
          naturalWidth: canvas.width
        }
      ]
    : [];
  return webTemplateRenderables;
}

function createPoisonBubbleImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0x51f15e);
    for (let index = 0; index < 58; index += 1) {
      addPoisonCloudPuff(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.055 + random() * 0.19, random);
    }
    for (let index = 0; index < 28; index += 1) {
      const radius = 0.035 + random() * 0.13;
      const x = -0.82 + random() * 1.64;
      const y = -0.82 + random() * 1.64;
      addPoisonBubble(scene, x, y, radius, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createPsychicHazeImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0x951c1c);
    for (let index = 0; index < 16; index += 1) {
      addPsychicBand(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.28 + random() * 0.62, random);
    }
    for (let index = 0; index < 18; index += 1) {
      addPsychicStreak(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.18 + random() * 0.44, random);
    }
    for (let index = 0; index < 34; index += 1) {
      addPsychicSpark(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.01 + random() * 0.03, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createAcidSpatterImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0xac1d);
    for (let index = 0; index < 6; index += 1) {
      addAcidBubble(scene, -0.86 + random() * 1.72, -0.86 + random() * 1.72, 0.035 + random() * 0.11, random);
    }
    for (let index = 0; index < 58; index += 1) {
      addAcidDroplet(scene, -0.92 + random() * 1.84, -0.92 + random() * 1.84, 0.007 + random() * 0.032, random);
    }
    for (let index = 0; index < 7; index += 1) {
      addAcidRing(scene, -0.86 + random() * 1.72, -0.86 + random() * 1.72, 0.045 + random() * 0.12, random);
    }
    for (let index = 0; index < 10; index += 1) {
      addAcidWave(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.18 + random() * 0.34, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createArcaneGlyphImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0xa2ca3e);
    for (let index = 0; index < 14; index += 1) {
      addArcaneGlyph(scene, -0.84 + random() * 1.68, -0.84 + random() * 1.68, 0.08 + random() * 0.18, random);
    }
    for (let index = 0; index < 24; index += 1) {
      addArcaneRuneStroke(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.06 + random() * 0.16, random);
    }
    for (let index = 0; index < 30; index += 1) {
      addArcaneSpark(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.008 + random() * 0.024, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createColdShardImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0xc01df057);
    for (let index = 0; index < 34; index += 1) {
      const x = -0.84 + random() * 1.68;
      const y = -0.84 + random() * 1.68;
      const size = 0.04 + random() * 0.16;
      addColdShard(scene, x, y, size, random);
    }
    for (let index = 0; index < 30; index += 1) {
      const x = -0.82 + random() * 1.64;
      const y = -0.82 + random() * 1.64;
      const size = 0.025 + random() * 0.18;
      addColdStarburst(scene, x, y, size, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createLightningForkImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0x1e471e);
    for (let index = 0; index < 15; index += 1) {
      const start = { x: -0.88 + random() * 1.76, y: -0.88 + random() * 1.76 };
      const angle = random() * Math.PI * 2;
      const length = 0.92 + random() * 1.24;
      const end = {
        x: Math.max(-0.92, Math.min(0.92, start.x + Math.cos(angle) * length)),
        y: Math.max(-0.92, Math.min(0.92, start.y + Math.sin(angle) * length))
      };
      addLightningBolt(scene, start, end, 6 + Math.floor(random() * 6), 0.28 + random() * 0.5, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createNatureThornImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0x71a7e);
    for (let index = 0; index < 18; index += 1) {
      addNatureVine(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.22 + random() * 0.52, random);
    }
    for (let index = 0; index < 34; index += 1) {
      addNatureThorn(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.035 + random() * 0.08, random);
    }
    for (let index = 0; index < 26; index += 1) {
      addNatureLeaf(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.035 + random() * 0.09, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createFireTongueImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0xf17e);
    for (let index = 0; index < 28; index += 1) {
      const x = -0.84 + random() * 1.68;
      const y = -0.84 + random() * 1.68;
      const size = 0.07 + random() * 0.2;
      addFireTongue(scene, x, y, size, random);
    }
    for (let index = 0; index < 42; index += 1) {
      const x = -0.9 + random() * 1.8;
      const y = -0.9 + random() * 1.8;
      const radius = 0.008 + random() * 0.024;
      addFireEmber(scene, x, y, radius, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createFogCloudImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0xf06c10d);
    for (let index = 0; index < 72; index += 1) {
      const x = -0.9 + random() * 1.8;
      const y = -0.9 + random() * 1.8;
      const radius = 0.045 + random() * 0.17;
      addFogPuff(scene, x, y, radius, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createDarknessMistImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0xda2c);
    for (let index = 0; index < 58; index += 1) {
      const x = -0.9 + random() * 1.8;
      const y = -0.9 + random() * 1.8;
      const radius = 0.05 + random() * 0.2;
      addDarkMistPuff(scene, x, y, radius, random);
    }
    for (let index = 0; index < 22; index += 1) {
      const x = -0.86 + random() * 1.72;
      const y = -0.86 + random() * 1.72;
      addDarknessTendril(scene, x, y, 0.16 + random() * 0.34, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createStormCloudImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0x570a);
    for (let index = 0; index < 64; index += 1) {
      const x = -0.9 + random() * 1.8;
      const y = -0.9 + random() * 1.8;
      const radius = 0.045 + random() * 0.18;
      addStormPuff(scene, x, y, radius, random);
    }
    for (let index = 0; index < 16; index += 1) {
      const start = { x: -0.88 + random() * 1.76, y: -0.88 + random() * 1.76 };
      const angle = random() * Math.PI * 2;
      const length = 0.48 + random() * 0.78;
      const end = {
        x: Math.max(-0.92, Math.min(0.92, start.x + Math.cos(angle) * length)),
        y: Math.max(-0.92, Math.min(0.92, start.y + Math.sin(angle) * length))
      };
      addLightningBolt(scene, start, end, 4 + Math.floor(random() * 5), 0.16 + random() * 0.32, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createThunderWaveImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0x7e2d);
    for (let index = 0; index < 10; index += 1) {
      addThunderArc(scene, -0.82 + random() * 1.64, -0.82 + random() * 1.64, 0.24 + random() * 0.48, random);
    }
    for (let index = 0; index < 14; index += 1) {
      addThunderWaveLine(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.36 + random() * 0.62, random);
    }
    for (let index = 0; index < 18; index += 1) {
      addThunderTick(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.08 + random() * 0.16, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createRadiantLightImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0xad1a17);
    for (let index = 0; index < 18; index += 1) {
      addRadiantRay(scene, -0.88 + random() * 1.76, -0.88 + random() * 1.76, 0.24 + random() * 0.58, random);
    }
    for (let index = 0; index < 14; index += 1) {
      addRadiantStarburst(scene, -0.84 + random() * 1.68, -0.84 + random() * 1.68, 0.05 + random() * 0.18, random);
    }
    for (let index = 0; index < 32; index += 1) {
      addRadiantSpark(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.008 + random() * 0.026, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createWaterDropletImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0x0ce4);
    for (let index = 0; index < 10; index += 1) {
      addWaterRipple(scene, -0.86 + random() * 1.72, -0.86 + random() * 1.72, 0.38 + random() * 0.62, random);
    }
    for (let index = 0; index < 10; index += 1) {
      addWaterCurrent(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.42 + random() * 0.72, random);
    }
    for (let index = 0; index < 16; index += 1) {
      addWaterDroplet(scene, -0.9 + random() * 1.8, -0.9 + random() * 1.8, 0.018 + random() * 0.052, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function createWebStrandImage(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;
    const random = createSeededRandom(0x5a1d);
    for (let index = 0; index < 5; index += 1) {
      addWebCluster(scene, -0.76 + random() * 1.52, -0.76 + random() * 1.52, 0.22 + random() * 0.34, random);
    }
    for (let index = 0; index < 20; index += 1) {
      addWebStrayThread(scene, -0.92 + random() * 1.84, -0.92 + random() * 1.84, 0.18 + random() * 0.42, random);
    }
    renderer.render(scene, camera);
    disposeScene(scene);
    renderer.dispose();
    return canvas;
  } catch {
    return null;
  }
}

function addPoisonBubble(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    new THREE.MeshBasicMaterial({ color: 0x65a30d, transparent: true, opacity: 0.08 + random() * 0.26, depthWrite: false })
  );
  fill.position.set(x, y, 0);
  scene.add(fill);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.9, radius, 36),
    new THREE.MeshBasicMaterial({ color: 0xd9f99d, transparent: true, opacity: 0.24 + random() * 0.48, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.position.set(x, y, 0.01);
  scene.add(ring);

  const highlight = new THREE.Mesh(
    new THREE.CircleGeometry(radius * (0.16 + random() * 0.08), 16),
    new THREE.MeshBasicMaterial({ color: 0xf7fee7, transparent: true, opacity: 0.18 + random() * 0.42, depthWrite: false })
  );
  const highlightAngle = -Math.PI * 0.72 + random() * 0.38;
  highlight.position.set(x + Math.cos(highlightAngle) * radius * 0.38, y + Math.sin(highlightAngle) * radius * 0.38, 0.02);
  scene.add(highlight);
}

function addPoisonCloudPuff(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const puff = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 28),
    new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0x365314 : 0x65a30d, transparent: true, opacity: 0.055 + random() * 0.15, depthWrite: false })
  );
  puff.position.set(x, y, 0.01);
  puff.scale.set(1 + random() * 0.9, 0.62 + random() * 0.62, 1);
  puff.rotation.z = random() * Math.PI;
  scene.add(puff);
}

function addPsychicBand(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const amplitude = length * (0.07 + random() * 0.12);
  const colors = [0xf0abfc, 0x67e8f9, 0xf9a8d4, 0xc4b5fd];
  const color = colors[Math.floor(random() * colors.length) % colors.length];
  const points: Point[] = [];
  for (let index = 0; index < 8; index += 1) {
    const t = index / 7;
    const wave = Math.sin(t * Math.PI * (1.1 + random() * 1.1)) * amplitude;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * wave,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * wave
    });
  }
  addPsychicLine(scene, points, color, 0.22 + random() * 0.28, 0.012 + random() * 0.012);
}

function addPsychicStreak(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const skew = (random() - 0.5) * length * 0.16;
  const width = length * (0.035 + random() * 0.045);
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    -length * 0.5,
    -width,
    0,
    length * 0.5,
    -width + skew,
    0,
    length * 0.5,
    width + skew,
    0,
    -length * 0.5,
    width,
    0
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  const streak = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0xf0abfc : 0x22d3ee, transparent: true, opacity: 0.14 + random() * 0.26, side: THREE.DoubleSide, depthWrite: false })
  );
  streak.position.set(x, y, 0.03);
  streak.rotation.z = angle;
  scene.add(streak);
}

function addPsychicSpark(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const spark = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 14),
    new THREE.MeshBasicMaterial({ color: random() > 0.5 ? 0xfdf4ff : 0x67e8f9, transparent: true, opacity: 0.16 + random() * 0.42, depthWrite: false })
  );
  spark.position.set(x, y, 0.05);
  spark.scale.set(1 + random() * 0.8, 0.64 + random() * 0.46, 1);
  spark.rotation.z = random() * Math.PI;
  scene.add(spark);
}

function addPsychicLine(scene: THREE.Scene, points: Point[], color: number, opacity: number, thickness: number) {
  const drawOffsets = [{ x: 0, y: 0 }, { x: thickness, y: 0 }, { x: -thickness, y: 0 }, { x: 0, y: thickness }, { x: 0, y: -thickness }];
  for (const offset of drawOffsets) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x + offset.x, point.y + offset.y, 0.04)));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.max(0.08, Math.min(0.62, opacity / 1.5)) });
    scene.add(new THREE.Line(geometry, material));
  }
}

function addAcidBubble(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * (0.86 + random() * 0.06), radius, 28),
    new THREE.MeshBasicMaterial({ color: random() > 0.35 ? 0xd9f99d : 0xfacc15, transparent: true, opacity: 0.34 + random() * 0.42, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.position.set(x, y, 0.03);
  scene.add(ring);
  addAcidDroplet(scene, x + (random() - 0.5) * radius * 0.6, y + (random() - 0.5) * radius * 0.6, radius * (0.18 + random() * 0.18), random);
}

function addAcidDroplet(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const droplet = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 14),
    new THREE.MeshBasicMaterial({ color: random() > 0.5 ? 0xa3e635 : 0xfde047, transparent: true, opacity: 0.18 + random() * 0.58, depthWrite: false })
  );
  droplet.position.set(x, y, 0.04);
  droplet.scale.set(1 + random() * 0.75, 0.72 + random() * 0.42, 1);
  droplet.rotation.z = random() * Math.PI;
  scene.add(droplet);
}

function addAcidRing(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.94, radius, 34),
    new THREE.MeshBasicMaterial({ color: 0xbef264, transparent: true, opacity: 0.16 + random() * 0.3, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.position.set(x, y, 0.02);
  ring.scale.set(1 + random() * 0.5, 0.72 + random() * 0.32, 1);
  ring.rotation.z = random() * Math.PI;
  scene.add(ring);
}

function addAcidWave(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const amplitude = length * (0.06 + random() * 0.08);
  const points: Point[] = [];
  for (let index = 0; index < 7; index += 1) {
    const t = index / 6;
    const wave = Math.sin(t * Math.PI * (1.5 + random() * 0.8)) * amplitude;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * wave,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * wave
    });
  }
  addLightningLine(scene, points, random() > 0.45 ? 0xbef264 : 0xfde047, 0.16 + random() * 0.28, 0.004 + random() * 0.005);
}

function addArcaneGlyph(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const group = new THREE.Group();
  const color = random() > 0.4 ? 0xc4b5fd : 0x818cf8;
  const opacity = 0.3 + random() * 0.36;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.92, radius, 42, 1, random() * Math.PI * 2, Math.PI * (0.72 + random() * 0.72)),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })
  );
  group.add(ring);
  const inner = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.45, radius * 0.49, 32, 1, random() * Math.PI * 2, Math.PI * (0.38 + random() * 0.58)),
    new THREE.MeshBasicMaterial({ color: 0xede9fe, transparent: true, opacity: opacity * 0.7, side: THREE.DoubleSide, depthWrite: false })
  );
  group.add(inner);
  const spokeCount = 2 + Math.floor(random() * 3);
  for (let index = 0; index < spokeCount; index += 1) {
    const angle = random() * Math.PI * 2;
    const start = { x: Math.cos(angle) * radius * 0.22, y: Math.sin(angle) * radius * 0.22 };
    const end = { x: Math.cos(angle) * radius * (0.66 + random() * 0.18), y: Math.sin(angle) * radius * (0.66 + random() * 0.18) };
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(start.x, start.y, 0.04), new THREE.Vector3(end.x, end.y, 0.04)]),
      new THREE.LineBasicMaterial({ color: 0xddd6fe, transparent: true, opacity: opacity * 0.8 })
    );
    group.add(line);
  }
  group.position.set(x, y, 0.03);
  group.rotation.z = random() * Math.PI * 2;
  scene.add(group);
}

function addArcaneRuneStroke(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const branchAngle = angle + (random() > 0.5 ? 1 : -1) * (0.7 + random() * 0.6);
  const center = new THREE.Vector3(x, y, 0.04);
  const half = length * 0.5;
  const points = [
    new THREE.Vector3(center.x - Math.cos(angle) * half, center.y - Math.sin(angle) * half, 0.04),
    new THREE.Vector3(center.x + Math.cos(angle) * half, center.y + Math.sin(angle) * half, 0.04)
  ];
  const material = new THREE.LineBasicMaterial({ color: random() > 0.45 ? 0xa78bfa : 0xe879f9, transparent: true, opacity: 0.3 + random() * 0.46 });
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  if (random() > 0.32) {
    const branchLength = length * (0.28 + random() * 0.34);
    const branchStart = points[random() > 0.5 ? 0 : 1];
    const branchEnd = new THREE.Vector3(branchStart.x + Math.cos(branchAngle) * branchLength, branchStart.y + Math.sin(branchAngle) * branchLength, 0.04);
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([branchStart, branchEnd]), material.clone()));
  }
}

function addArcaneSpark(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const spark = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 12),
    new THREE.MeshBasicMaterial({ color: random() > 0.5 ? 0xede9fe : 0xc084fc, transparent: true, opacity: 0.28 + random() * 0.5, depthWrite: false })
  );
  spark.position.set(x, y, 0.05);
  spark.scale.set(1 + random() * 0.8, 0.68 + random() * 0.42, 1);
  spark.rotation.z = random() * Math.PI;
  scene.add(spark);
}

function addColdShard(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const length = size * (1.4 + random() * 1.2);
  const width = size * (0.18 + random() * 0.26);
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0,
    length * 0.5,
    0,
    -width,
    -length * 0.14,
    0,
    0,
    -length * 0.5,
    0,
    width,
    -length * 0.08,
    0
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  const material = new THREE.MeshBasicMaterial({ color: random() > 0.42 ? 0xa5f3fc : 0xf0f9ff, transparent: true, opacity: 0.18 + random() * 0.34, side: THREE.DoubleSide, depthWrite: false });
  const shard = new THREE.Mesh(geometry, material);
  shard.position.set(x, y, 0);
  shard.rotation.z = random() * Math.PI * 2;
  scene.add(shard);
}

function addColdStarburst(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const material = new THREE.LineBasicMaterial({ color: random() > 0.35 ? 0xe0f2fe : 0x67e8f9, transparent: true, opacity: 0.08 + random() * 0.56 });
  const rayCount = 4 + Math.floor(random() * 4);
  const rotation = random() * Math.PI;
  for (let index = 0; index < rayCount; index += 1) {
    const angle = rotation + (Math.PI * index) / rayCount;
    const length = size * (0.72 + random() * 0.72);
    const points = [
      new THREE.Vector3(Math.cos(angle) * -length * 0.5, Math.sin(angle) * -length * 0.5, 0.03),
      new THREE.Vector3(Math.cos(angle) * length * 0.5, Math.sin(angle) * length * 0.5, 0.03)
    ];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material.clone());
    line.position.set(x, y, 0);
    scene.add(line);
  }
}

function addFireTongue(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const height = size * (1.35 + random() * 1.15);
  const width = size * (0.32 + random() * 0.36);
  const curve = (random() - 0.5) * width * 1.15;
  const geometry = new THREE.ShapeGeometry(
    new THREE.Shape()
      .moveTo(0, height * 0.58)
      .bezierCurveTo(width + curve, height * 0.18, width * 0.45, -height * 0.34, 0, -height * 0.58)
      .bezierCurveTo(-width * 0.5 + curve, -height * 0.18, -width - curve, height * 0.18, 0, height * 0.58)
  );
  const material = new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0xf97316 : 0xfacc15, transparent: true, opacity: 0.16 + random() * 0.42, side: THREE.DoubleSide, depthWrite: false });
  const flame = new THREE.Mesh(geometry, material);
  flame.position.set(x, y, 0);
  flame.rotation.z = random() * Math.PI * 2;
  scene.add(flame);
}

function addFireEmber(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const ember = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 14),
    new THREE.MeshBasicMaterial({ color: random() > 0.38 ? 0xfef08a : 0xfb923c, transparent: true, opacity: 0.18 + random() * 0.52, depthWrite: false })
  );
  ember.position.set(x, y, 0.04);
  scene.add(ember);
}

function addFogPuff(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const puff = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 28),
    new THREE.MeshBasicMaterial({ color: random() > 0.55 ? 0xf8fafc : 0xcbd5e1, transparent: true, opacity: 0.035 + random() * 0.115, depthWrite: false })
  );
  puff.position.set(x, y, 0.02);
  puff.scale.set(1 + random() * 0.9, 0.62 + random() * 0.62, 1);
  puff.rotation.z = random() * Math.PI;
  scene.add(puff);
}

function addDarkMistPuff(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const puff = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 28),
    new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0x020617 : 0x1e293b, transparent: true, opacity: 0.08 + random() * 0.22, depthWrite: false })
  );
  puff.position.set(x, y, 0.02);
  puff.scale.set(1 + random() * 1.05, 0.54 + random() * 0.72, 1);
  puff.rotation.z = random() * Math.PI;
  scene.add(puff);
}

function addDarknessTendril(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const points: Point[] = [];
  for (let index = 0; index < 5; index += 1) {
    const t = index / 4;
    const curl = Math.sin(t * Math.PI * 1.4 + random()) * length * 0.14;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * curl,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * curl
    });
  }
  addLightningLine(scene, points, 0x0f172a, 0.16 + random() * 0.28, 0.01 + random() * 0.012);
}

function addStormPuff(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const puff = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 28),
    new THREE.MeshBasicMaterial({ color: random() > 0.5 ? 0x1e3a8a : 0x64748b, transparent: true, opacity: 0.055 + random() * 0.16, depthWrite: false })
  );
  puff.position.set(x, y, 0.02);
  puff.scale.set(1 + random() * 0.9, 0.58 + random() * 0.72, 1);
  puff.rotation.z = random() * Math.PI;
  scene.add(puff);
}

function addThunderArc(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const arcCount = 2 + Math.floor(random() * 2);
  for (let index = 0; index < arcCount; index += 1) {
    const arcRadius = radius * (0.72 + index * 0.36 + random() * 0.08);
    const arc = new THREE.Mesh(
      new THREE.RingGeometry(arcRadius * 0.94, arcRadius, 54, 1, random() * Math.PI * 2, Math.PI * (0.38 + random() * 0.55)),
      new THREE.MeshBasicMaterial({ color: random() > 0.42 ? 0xd8b4fe : 0xc084fc, transparent: true, opacity: 0.16 + random() * 0.3, side: THREE.DoubleSide, depthWrite: false })
    );
    arc.position.set(x, y, 0.03 + index * 0.002);
    arc.scale.set(1 + random() * 0.45, 0.7 + random() * 0.32, 1);
    arc.rotation.z = random() * Math.PI;
    scene.add(arc);
  }
}

function addThunderWaveLine(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const amplitude = length * (0.025 + random() * 0.045);
  const points: Point[] = [];
  for (let index = 0; index < 8; index += 1) {
    const t = index / 7;
    const wave = Math.sin(t * Math.PI * (1.8 + random() * 1.2)) * amplitude;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * wave,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * wave
    });
  }
  addLightningLine(scene, points, random() > 0.45 ? 0xc084fc : 0xf3e8ff, 0.18 + random() * 0.28, 0.004 + random() * 0.004);
}

function addThunderTick(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const points = [
    new THREE.Vector3(x - Math.cos(angle) * length * 0.5, y - Math.sin(angle) * length * 0.5, 0.04),
    new THREE.Vector3(x + Math.cos(angle) * length * 0.5, y + Math.sin(angle) * length * 0.5, 0.04)
  ];
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: random() > 0.5 ? 0xf3e8ff : 0xd8b4fe, transparent: true, opacity: 0.16 + random() * 0.42 })
    )
  );
}

function addLightningBolt(scene: THREE.Scene, start: Point, end: Point, segments: number, opacity: number, random: () => number) {
  const points = getJaggedBoltPoints(start, end, segments, 0.08 + random() * 0.07, random);
  addLightningLine(scene, points, 0xfacc15, opacity, 0.012);
  addLightningLine(scene, points, 0xfef08a, opacity * 0.78, 0.006);
  addLightningLine(scene, points, 0xeab308, opacity * 0.42, 0.018);
  for (let index = 1; index < points.length - 1; index += 1) {
    if (random() < 0.72) {
      const current = points[index];
      const previous = points[index - 1];
      const angle = Math.atan2(current.y - previous.y, current.x - previous.x) + (random() > 0.5 ? 1 : -1) * (0.72 + random() * 0.7);
      const length = distanceBetweenPoints(start, end) * (0.22 + random() * 0.34);
      const branchEnd = {
        x: Math.max(-0.96, Math.min(0.96, current.x + Math.cos(angle) * length)),
        y: Math.max(-0.96, Math.min(0.96, current.y + Math.sin(angle) * length))
      };
      addLightningLine(scene, getJaggedBoltPoints(current, branchEnd, 2 + Math.floor(random() * 3), 0.035 + random() * 0.04, random), 0xfef08a, opacity * (0.46 + random() * 0.24), 0.006);
    }
  }
}

function addNatureVine(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const amplitude = length * (0.08 + random() * 0.12);
  const points: Point[] = [];
  for (let index = 0; index < 7; index += 1) {
    const t = index / 6;
    const curl = Math.sin(t * Math.PI * (1.2 + random() * 0.9)) * amplitude;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * curl,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * curl
    });
  }
  addNatureVineLine(scene, points, 0x16a34a, 0.76 + random() * 0.18, 0.012 + random() * 0.008);
}

function addNatureVineLine(scene: THREE.Scene, points: Point[], color: number, opacity: number, thickness: number) {
  const drawOffsets = [{ x: 0, y: 0 }, { x: thickness, y: 0 }, { x: -thickness, y: 0 }, { x: 0, y: thickness }, { x: 0, y: -thickness }];
  for (const offset of drawOffsets) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x + offset.x, point.y + offset.y, 0.04)));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.max(0.16, Math.min(0.94, opacity)) });
    scene.add(new THREE.Line(geometry, material));
  }
}

function addNatureThorn(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const height = size * (1.25 + random() * 0.95);
  const width = size * (0.28 + random() * 0.22);
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([0, height * 0.62, 0, -width, -height * 0.38, 0, width, -height * 0.38, 0]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2]);
  const thorn = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: random() > 0.42 ? 0x92400e : 0x78350f, transparent: true, opacity: 0.42 + random() * 0.38, side: THREE.DoubleSide, depthWrite: false })
  );
  thorn.position.set(x, y, 0.04);
  thorn.rotation.z = random() * Math.PI * 2;
  scene.add(thorn);
}

function addNatureLeaf(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const shape = new THREE.Shape()
    .moveTo(0, size)
    .bezierCurveTo(size * 0.72, size * 0.48, size * 0.78, -size * 0.42, 0, -size)
    .bezierCurveTo(-size * 0.78, -size * 0.42, -size * 0.72, size * 0.48, 0, size);
  const leaf = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0x4ade80 : 0x22c55e, transparent: true, opacity: 0.18 + random() * 0.34, side: THREE.DoubleSide, depthWrite: false })
  );
  leaf.position.set(x, y, 0.03);
  leaf.rotation.z = random() * Math.PI * 2;
  leaf.scale.set(1 + random() * 0.55, 0.72 + random() * 0.32, 1);
  scene.add(leaf);
}

function addRadiantRay(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const width = length * (0.04 + random() * 0.055);
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([0, length * 0.52, 0, -width, -length * 0.38, 0, width, -length * 0.38, 0]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2]);
  const ray = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: random() > 0.38 ? 0xfef3c7 : 0xfacc15, transparent: true, opacity: 0.08 + random() * 0.18, side: THREE.DoubleSide, depthWrite: false })
  );
  ray.position.set(x, y, 0.02);
  ray.rotation.z = random() * Math.PI * 2;
  scene.add(ray);
}

function addRadiantStarburst(scene: THREE.Scene, x: number, y: number, size: number, random: () => number) {
  const material = new THREE.LineBasicMaterial({ color: random() > 0.35 ? 0xfff7ed : 0xfef08a, transparent: true, opacity: 0.18 + random() * 0.42 });
  const rayCount = 4 + Math.floor(random() * 4);
  const rotation = random() * Math.PI;
  for (let index = 0; index < rayCount; index += 1) {
    const angle = rotation + (Math.PI * index) / rayCount;
    const length = size * (0.72 + random() * 0.9);
    const points = [
      new THREE.Vector3(Math.cos(angle) * -length * 0.5, Math.sin(angle) * -length * 0.5, 0.04),
      new THREE.Vector3(Math.cos(angle) * length * 0.5, Math.sin(angle) * length * 0.5, 0.04)
    ];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material.clone());
    line.position.set(x, y, 0);
    scene.add(line);
  }
}

function addRadiantSpark(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const spark = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 14),
    new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0xfffbeb : 0xfde047, transparent: true, opacity: 0.18 + random() * 0.48, depthWrite: false })
  );
  spark.position.set(x, y, 0.05);
  spark.scale.set(1 + random() * 0.7, 0.7 + random() * 0.42, 1);
  spark.rotation.z = random() * Math.PI;
  scene.add(spark);
}

function addWaterRipple(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const ringCount = 2 + Math.floor(random() * 2);
  for (let index = 0; index < ringCount; index += 1) {
    const ringRadius = radius * (0.34 + index * 0.64 + random() * 0.08);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(ringRadius * 0.95, ringRadius, 44),
      new THREE.MeshBasicMaterial({ color: random() > 0.35 ? 0x7dd3fc : 0xbae6fd, transparent: true, opacity: 0.08 + random() * 0.18, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.position.set(x, y, 0.03 + index * 0.002);
    ring.scale.set(1 + random() * 0.42, 0.5 + random() * 0.34, 1);
    ring.rotation.z = random() * Math.PI;
    scene.add(ring);
  }
}

function addWaterCurrent(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const amplitude = length * (0.018 + random() * 0.034);
  const points: Point[] = [];
  for (let index = 0; index < 8; index += 1) {
    const t = index / 7;
    const wave = Math.sin(t * Math.PI * (1.35 + random() * 1.2)) * amplitude;
    points.push({
      x: x + Math.cos(angle) * length * (t - 0.5) + Math.cos(angle + Math.PI / 2) * wave,
      y: y + Math.sin(angle) * length * (t - 0.5) + Math.sin(angle + Math.PI / 2) * wave
    });
  }
  addLightningLine(scene, points, random() > 0.45 ? 0x38bdf8 : 0xbae6fd, 0.06 + random() * 0.16, 0.002 + random() * 0.003);
}

function addWaterDroplet(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const droplet = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 16),
    new THREE.MeshBasicMaterial({ color: random() > 0.42 ? 0x38bdf8 : 0xe0f2fe, transparent: true, opacity: 0.16 + random() * 0.38, depthWrite: false })
  );
  droplet.position.set(x, y, 0.04);
  droplet.scale.set(1 + random() * 0.6, 0.7 + random() * 0.38, 1);
  droplet.rotation.z = random() * Math.PI;
  scene.add(droplet);
}

function addWebCluster(scene: THREE.Scene, x: number, y: number, radius: number, random: () => number) {
  const hub = { x: x + (random() - 0.5) * radius * 0.35, y: y + (random() - 0.5) * radius * 0.35 };
  const spokeCount = 9 + Math.floor(random() * 5);
  const spokes: Point[][] = [];
  const rotation = random() * Math.PI * 2;
  for (let index = 0; index < spokeCount; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / spokeCount + (random() - 0.5) * 0.32;
    const length = radius * (0.74 + random() * 0.48);
    const end = {
      x: hub.x + Math.cos(angle) * length,
      y: hub.y + Math.sin(angle) * length
    };
    spokes.push([hub, end]);
    addWebThread(scene, [hub, end], 0.38 + random() * 0.32);
  }

  const ringCount = 3 + Math.floor(random() * 3);
  for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
    const t = 0.22 + ringIndex * (0.64 / ringCount) + random() * 0.035;
    for (let spokeIndex = 0; spokeIndex < spokes.length; spokeIndex += 1) {
      if (random() < 0.18) {
        continue;
      }
      const current = interpolatePoint(spokes[spokeIndex][0], spokes[spokeIndex][1], t + (random() - 0.5) * 0.025);
      const nextSpoke = spokes[(spokeIndex + 1) % spokes.length];
      const next = interpolatePoint(nextSpoke[0], nextSpoke[1], t + (random() - 0.5) * 0.04);
      const mid = {
        x: (current.x + next.x) / 2 + (hub.x - (current.x + next.x) / 2) * (0.08 + random() * 0.08),
        y: (current.y + next.y) / 2 + (hub.y - (current.y + next.y) / 2) * (0.08 + random() * 0.08)
      };
      addWebThread(scene, [current, mid, next], 0.32 + random() * 0.28);
    }
  }
}

function addWebStrayThread(scene: THREE.Scene, x: number, y: number, length: number, random: () => number) {
  const angle = random() * Math.PI * 2;
  const bend = (random() - 0.5) * length * 0.18;
  const start = { x: x - Math.cos(angle) * length * 0.5, y: y - Math.sin(angle) * length * 0.5 };
  const end = { x: x + Math.cos(angle) * length * 0.5, y: y + Math.sin(angle) * length * 0.5 };
  const mid = {
    x: x + Math.cos(angle + Math.PI / 2) * bend,
    y: y + Math.sin(angle + Math.PI / 2) * bend
  };
  addWebThread(scene, [start, mid, end], 0.26 + random() * 0.26);
}

function addWebThread(scene: THREE.Scene, points: Point[], opacity: number) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x, point.y, 0.04)));
  const material = new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: Math.max(0.18, Math.min(0.76, opacity)) });
  scene.add(new THREE.Line(geometry, material));
}

function interpolatePoint(start: Point, end: Point, t: number): Point {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t
  };
}

function getJaggedBoltPoints(start: Point, end: Point, segments: number, jitter: number, random: () => number): Point[] {
  const angle = Math.atan2(end.y - start.y, end.x - start.x) + Math.PI / 2;
  const points: Point[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const offset = index === 0 || index === segments ? 0 : (random() - 0.5) * jitter;
    points.push({
      x: start.x + (end.x - start.x) * t + Math.cos(angle) * offset,
      y: start.y + (end.y - start.y) * t + Math.sin(angle) * offset
    });
  }
  return points;
}

function addLightningLine(scene: THREE.Scene, points: Point[], color: number, opacity: number, thickness = 0) {
  const drawOffsets = thickness > 0 ? [{ x: 0, y: 0 }, { x: thickness, y: 0 }, { x: -thickness, y: 0 }, { x: 0, y: thickness }, { x: 0, y: -thickness }] : [{ x: 0, y: 0 }];
  for (const offset of drawOffsets) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x + offset.x, point.y + offset.y, 0.04)));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.max(0.05, Math.min(0.88, opacity / Math.sqrt(drawOffsets.length))) });
    scene.add(new THREE.Line(geometry, material));
  }
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          material.dispose();
        }
      } else {
        object.material.dispose();
      }
    }
  });
}

function createTemplateAssetPlacements(
  drawing: DrawingElement,
  bounds: { left: number; top: number; right: number; bottom: number },
  renderables: TemplateEffectRenderable[],
  count: number,
  random: () => number,
  grid: GridSettings | undefined,
  tuning: TemplateEffectTuning
): PlacedTemplateAsset[] {
  const placements: PlacedTemplateAsset[] = [];
  for (let index = 0; index < count; index += 1) {
    const asset = renderables[Math.floor(random() * renderables.length) % renderables.length];
    const point = getTemplateEdgeBandPoint(drawing, bounds, index, count, random, grid);
    const targetWidth = TEMPLATE_EFFECT_RENDERABLE_WIDTH_PX * tuning.scale * (0.78 + random() * 0.5);
    const aspect = asset.naturalHeight > 0 ? asset.naturalWidth / asset.naturalHeight : 1;
    placements.push({
      angle: getTemplateEffectPlacementAngle(drawing, random),
      alpha: Math.min(1, (0.58 + random() * 0.32) * tuning.opacity),
      height: targetWidth / Math.max(0.2, aspect),
      image: asset.image,
      width: targetWidth,
      x: point.x,
      y: point.y
    });
  }
  return placements;
}

function getTemplateEffectTuning(effect: DrawingTemplateEffect): TemplateEffectTuning {
  return {
    ...DEFAULT_TEMPLATE_EFFECT_TUNING,
    ...(TEMPLATE_EFFECT_TUNING[effect] ?? {})
  };
}

function getTemplateEdgeBandPoint(
  drawing: DrawingElement,
  bounds: { left: number; top: number; right: number; bottom: number },
  index: number,
  count: number,
  random: () => number,
  grid?: GridSettings
): Point {
  if (drawing.kind === "line") {
    const [start, end] = drawing.points;
    if (start && end) {
      const length = distanceBetweenPoints(start, end);
      if (length > 0.001) {
        const t = (index + random() * 0.8) / Math.max(1, count);
        const corridorWidth = getLineTemplateEffectWidthPixels(drawing, grid);
        const normal = { x: -(end.y - start.y) / length, y: (end.x - start.x) / length };
        const center = { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
        const offset = (random() - 0.5) * corridorWidth * 0.72;
        return { x: center.x + normal.x * offset, y: center.y + normal.y * offset };
      }
    }
  }

  if (drawing.kind === "circle") {
    const [center, edge] = drawing.points;
    if (center && edge) {
      const radius = distanceBetweenPoints(center, edge);
      const angle = (Math.PI * 2 * (index + random() * 0.7)) / count;
      const distance = radius * (0.68 + random() * 0.25);
      return { x: center.x + Math.cos(angle) * distance, y: center.y + Math.sin(angle) * distance };
    }
  }

  const polygon = drawing.kind === "cone" ? getConeTriangle(drawing.points) : drawing.kind === "rectangle" ? (drawing.points.length >= 4 ? drawing.points.slice(0, 4) : getRectanglePathPoints(drawing.points)) : null;
  if (polygon && polygon.length >= 3) {
    return getPolygonEdgeBandPoint(polygon, index, count, random);
  }

  return {
    x: bounds.left + random() * (bounds.right - bounds.left),
    y: bounds.top + random() * (bounds.bottom - bounds.top)
  };
}

function getTemplateEffectPlacementAngle(drawing: DrawingElement, random: () => number): number {
  if (drawing.kind === "line") {
    const [start, end] = drawing.points;
    if (start && end) {
      return Math.atan2(end.y - start.y, end.x - start.x) + (random() - 0.5) * 0.55;
    }
  }
  return (random() - 0.5) * Math.PI * 1.85;
}

function getPolygonEdgeBandPoint(points: Point[], index: number, count: number, random: () => number): Point {
  const center = {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length
  };
  const edgeIndex = index % points.length;
  const start = points[edgeIndex];
  const end = points[(edgeIndex + 1) % points.length];
  const t = ((Math.floor(index / points.length) + random() * 0.85) / Math.max(1, Math.ceil(count / points.length))) % 1;
  const edgePoint = { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
  const inset = 0.08 + random() * 0.24;
  return {
    x: edgePoint.x + (center.x - edgePoint.x) * inset,
    y: edgePoint.y + (center.y - edgePoint.y) * inset
  };
}

function drawPlacedTemplateAsset(ctx: CanvasRenderingContext2D, placement: PlacedTemplateAsset) {
  ctx.save();
  ctx.translate(placement.x, placement.y);
  ctx.rotate(placement.angle);
  ctx.globalAlpha *= placement.alpha;
  ctx.drawImage(placement.image, -placement.width / 2, -placement.height / 2, placement.width, placement.height);
  ctx.restore();
}

function traceTemplateEffectPath(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scale: number, grid?: GridSettings) {
  if (drawing.kind === "line") {
    traceLineTemplateCorridor(ctx, drawing, scale, grid);
    return;
  }
  if (drawing.kind === "circle") {
    const [center, edge] = drawing.points;
    if (!center || !edge) {
      return;
    }
    ctx.arc(center.x, center.y, distanceBetweenPoints(center, edge) * scale, 0, Math.PI * 2);
    return;
  }
  if (drawing.kind === "rectangle") {
    const points = drawing.points.length >= 4 ? drawing.points.slice(0, 4) : getRectanglePathPoints(drawing.points);
    traceClosedPath(ctx, scalePointsToCenter(points, scale));
    return;
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(drawing.points);
    if (triangle) {
      traceClosedPath(ctx, scalePointsToCenter(triangle, scale));
    }
  }
}

function traceLineTemplateCorridor(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scale: number, grid?: GridSettings) {
  const points = getLineTemplateCorridorPoints(drawing, scale, grid);
  if (!points) {
    return;
  }
  traceClosedPath(ctx, points);
}

function getLineTemplateCorridorPoints(drawing: DrawingElement, scale = 1, grid?: GridSettings): Point[] | null {
  const [start, end] = drawing.points;
  if (!start || !end) {
    return null;
  }
  const length = distanceBetweenPoints(start, end);
  if (length <= 0.001) {
    return null;
  }
  const halfWidth = (getLineTemplateEffectWidthPixels(drawing, grid) / 2) * scale;
  if (halfWidth <= 0) {
    return null;
  }
  const normal = { x: (-(end.y - start.y) / length) * halfWidth, y: ((end.x - start.x) / length) * halfWidth };
  return [
    { x: start.x + normal.x, y: start.y + normal.y },
    { x: end.x + normal.x, y: end.y + normal.y },
    { x: end.x - normal.x, y: end.y - normal.y },
    { x: start.x - normal.x, y: start.y - normal.y }
  ];
}

function getRectanglePathPoints(points: Point[]): Point[] {
  const [start, end] = points;
  if (!start || !end) {
    return [];
  }
  return [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x, y: end.y }
  ];
}

function scalePointsToCenter(points: Point[], scale: number): Point[] {
  if (points.length === 0) {
    return [];
  }
  const center = {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length
  };
  return points.map((point) => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale
  }));
}

function traceClosedPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length === 0) {
    return;
  }
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
}

function pointsSeed(points: Point[]): string {
  return points.map((point) => `${Math.round(point.x * 10)},${Math.round(point.y * 10)}`).join("|");
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function drawTemplateLabelHalo(ctx: CanvasRenderingContext2D, label: string, scale: number) {
  const offset = Math.max(1.5, 2.5 * scale);
  ctx.fillStyle = "rgba(11, 17, 24, 0.86)";
  for (const point of [
    { x: -offset, y: -offset },
    { x: 0, y: -offset },
    { x: offset, y: -offset },
    { x: offset, y: 0 },
    { x: offset, y: offset },
    { x: 0, y: offset },
    { x: -offset, y: offset },
    { x: -offset, y: 0 }
  ]) {
    ctx.fillText(label, point.x, scale + point.y);
  }
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.strokeStyle = "rgba(11, 17, 24, 0.9)";
  ctx.strokeText(label, 0, scale);
}

function drawTemplateGridHighlights(ctx: CanvasRenderingContext2D, drawing: DrawingElement, grid: GridSettings) {
  if (grid.type === "gridless" || grid.sizePx <= 0 || drawing.points.length < 2) {
    return;
  }
  const cells = getTemplateGridHighlightCells(drawing, grid);
  if (cells.length === 0) {
    return;
  }
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(239, 68, 68, 0)";
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = Math.max(5, Math.min(8, grid.lineThickness * 4));
  for (const center of cells) {
    if (grid.type === "hex") {
      tracePointyHex(ctx, center.x, center.y, Math.max(8, grid.sizePx / 2));
      ctx.fill();
      ctx.stroke();
    } else {
      const size = grid.sizePx;
      ctx.fillRect(center.x - size / 2, center.y - size / 2, size, size);
      ctx.strokeRect(center.x - size / 2, center.y - size / 2, size, size);
    }
  }
  ctx.restore();
}

function getTemplateGridHighlightCells(drawing: DrawingElement, grid: GridSettings): Point[] {
  const bounds = getDrawingBounds(drawing);
  if (!bounds) {
    return [];
  }
  if (grid.type === "hex") {
    return getTemplateHexHighlightCells(drawing, grid, bounds);
  }
  const size = grid.sizePx;
  const columns = {
    start: Math.floor((bounds.left - grid.offsetX) / size) - 1,
    end: Math.ceil((bounds.right - grid.offsetX) / size) + 1
  };
  const rows = {
    start: Math.floor((bounds.top - grid.offsetY) / size) - 1,
    end: Math.ceil((bounds.bottom - grid.offsetY) / size) + 1
  };
  const cells: Point[] = [];
  const maxCells = 2000;
  for (let row = rows.start; row <= rows.end && cells.length < maxCells; row += 1) {
    for (let column = columns.start; column <= columns.end && cells.length < maxCells; column += 1) {
      const center = { x: grid.offsetX + column * size + size / 2, y: grid.offsetY + row * size + size / 2 };
      if (isSquareGridCellInsideTemplate(center, drawing, grid)) {
        cells.push(center);
      }
    }
  }
  return cells;
}

function isSquareGridCellInsideTemplate(center: Point, drawing: DrawingElement, grid: GridSettings): boolean {
  const halfSize = grid.sizePx / 2;
  const rect = {
    left: center.x - halfSize,
    top: center.y - halfSize,
    right: center.x + halfSize,
    bottom: center.y + halfSize
  };

  if (drawing.kind === "line") {
    const [start, end] = drawing.points;
    if (!start || !end) {
      return false;
    }
    const corridor = getLineTemplateCorridorPoints(drawing, 1, grid);
    if (corridor) {
      return doesRectIntersectPolygon(rect, corridor);
    }
    return distanceToSegment(center, start, end) <= 0.0001;
  }
  if (drawing.kind === "circle") {
    const [origin, edge] = drawing.points;
    return origin && edge ? doesRectIntersectCircle(rect, origin, distanceBetweenPoints(origin, edge)) : false;
  }
  if (drawing.kind === "rectangle") {
    const [start, end] = drawing.points;
    if (!start || !end) {
      return false;
    }
    return doRectsIntersect(rect, {
      left: Math.min(start.x, end.x),
      top: Math.min(start.y, end.y),
      right: Math.max(start.x, end.x),
      bottom: Math.max(start.y, end.y)
    });
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(drawing.points);
    return triangle ? doesRectIntersectPolygon(rect, triangle) : false;
  }
  return isPointInsideTemplate(center, drawing, Math.max(8, grid.sizePx * 0.42));
}

function getTemplateHexHighlightCells(
  drawing: DrawingElement,
  grid: GridSettings,
  bounds: { left: number; top: number; right: number; bottom: number }
): Point[] {
  const cornerCoords = [
    getNearestHexCoordinate({ x: bounds.left, y: bounds.top }, grid),
    getNearestHexCoordinate({ x: bounds.right, y: bounds.top }, grid),
    getNearestHexCoordinate({ x: bounds.left, y: bounds.bottom }, grid),
    getNearestHexCoordinate({ x: bounds.right, y: bounds.bottom }, grid)
  ];
  const padding = 3;
  const qRange = {
    start: Math.min(...cornerCoords.map((coord) => coord.q)) - padding,
    end: Math.max(...cornerCoords.map((coord) => coord.q)) + padding
  };
  const rRange = {
    start: Math.min(...cornerCoords.map((coord) => coord.r)) - padding,
    end: Math.max(...cornerCoords.map((coord) => coord.r)) + padding
  };
  const cells: Point[] = [];
  const maxCells = 2000;
  for (let q = qRange.start; q <= qRange.end && cells.length < maxCells; q += 1) {
    for (let r = rRange.start; r <= rRange.end && cells.length < maxCells; r += 1) {
      const center = hexAxialToPoint({ q, r }, grid);
      if (
        center.x >= bounds.left - grid.sizePx &&
        center.x <= bounds.right + grid.sizePx &&
        center.y >= bounds.top - grid.sizePx &&
        center.y <= bounds.bottom + grid.sizePx &&
        isPointInsideTemplate(center, drawing, getTemplateHitRadius(drawing, grid))
      ) {
        cells.push(center);
      }
    }
  }
  return cells;
}

export function getDrawingBounds(drawing: DrawingElement, grid?: GridSettings): { left: number; top: number; right: number; bottom: number } | null {
  const points = drawing.measurementLabelVisible && drawing.kind === "line" ? (getLineTemplateCorridorPoints(drawing, 1, grid) ?? drawing.points) : getShapePoints(drawing);
  if (points.length === 0) {
    return null;
  }
  if (drawing.kind === "circle" && drawing.points[0] && drawing.points[1]) {
    const radiusX = distanceBetweenPoints(drawing.points[0], drawing.points[1]);
    const radiusY = radiusX;
    return {
      left: drawing.points[0].x - radiusX,
      top: drawing.points[0].y - radiusY,
      right: drawing.points[0].x + radiusX,
      bottom: drawing.points[0].y + radiusY
    };
  }
  return {
    left: Math.min(...points.map((point) => point.x)),
    top: Math.min(...points.map((point) => point.y)),
    right: Math.max(...points.map((point) => point.x)),
    bottom: Math.max(...points.map((point) => point.y))
  };
}

function getShapePoints(drawing: DrawingElement): Point[] {
  if (drawing.kind === "ellipse" && drawing.points[0] && drawing.points[1]) {
    return getEllipseBoundsPoints(drawing.points);
  }
  if (drawing.kind === "cone") {
    return getConeTriangle(drawing.points) ?? drawing.points;
  }
  if (drawing.kind === "triangle") {
    return getTriangle(drawing.points) ?? drawing.points;
  }
  return drawing.points;
}

function getEllipseBoundsPoints(points: Point[]): Point[] {
  const [center, edge, axis] = points;
  const radiusX = Math.max(0.5, Math.hypot(edge.x - center.x, edge.y - center.y));
  const radiusY = axis ? Math.max(0.5, Math.hypot(axis.x - center.x, axis.y - center.y)) : Math.max(0.5, Math.abs(edge.y - center.y));
  const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const samples: Point[] = [];
  for (let index = 0; index < 16; index += 1) {
    const angle = (Math.PI * 2 * index) / 16;
    const x = Math.cos(angle) * radiusX;
    const y = Math.sin(angle) * radiusY;
    samples.push({
      x: center.x + x * cos - y * sin,
      y: center.y + x * sin + y * cos
    });
  }
  return samples;
}

function isPointInsideTemplate(point: Point, drawing: DrawingElement, hitRadius: number): boolean {
  if (drawing.kind === "line") {
    return drawing.points[0] && drawing.points[1] ? distanceToSegment(point, drawing.points[0], drawing.points[1]) <= hitRadius : false;
  }
  if (drawing.kind === "circle") {
    const [center, edge] = drawing.points;
    return center && edge ? distanceBetweenPoints(center, point) <= distanceBetweenPoints(center, edge) : false;
  }
  if (drawing.kind === "rectangle") {
    const [start, end] = drawing.points;
    if (!start || !end) {
      return false;
    }
    const left = Math.min(start.x, end.x);
    const right = Math.max(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const bottom = Math.max(start.y, end.y);
    return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(drawing.points);
    return triangle ? isPointInTriangle(point, triangle[0], triangle[1], triangle[2]) : false;
  }
  return false;
}

function getTemplateHitRadius(drawing: DrawingElement, grid: GridSettings): number {
  return drawing.kind === "line" ? getTemplateWidthPixels(drawing, grid) / 2 : Math.max(8, grid.sizePx * 0.42);
}

function getTemplateWidthPixels(drawing: DrawingElement, grid: GridSettings): number {
  const widthFeet = Math.max(0, drawing.templateWidth ?? 5);
  const unitsPerCell = Math.max(0.01, grid.measurement.unitsPerGridCell);
  return (widthFeet / unitsPerCell) * grid.sizePx;
}

function doesRectIntersectCircle(rect: { left: number; top: number; right: number; bottom: number }, center: Point, radius: number): boolean {
  const closestX = Math.max(rect.left, Math.min(center.x, rect.right));
  const closestY = Math.max(rect.top, Math.min(center.y, rect.bottom));
  return distanceBetweenPoints(center, { x: closestX, y: closestY }) < radius - 0.0001;
}

function doRectsIntersect(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number }
): boolean {
  return a.left < b.right - 0.0001 && a.right > b.left + 0.0001 && a.top < b.bottom - 0.0001 && a.bottom > b.top + 0.0001;
}

function doesRectIntersectPolygon(rect: { left: number; top: number; right: number; bottom: number }, polygon: Point[]): boolean {
  return getPolygonArea(clipPolygonToRect(polygon, rect)) > 0.01;
}

function clipPolygonToRect(polygon: Point[], rect: { left: number; top: number; right: number; bottom: number }): Point[] {
  return clipPolygonEdge(
    clipPolygonEdge(
      clipPolygonEdge(
        clipPolygonEdge(polygon, (point) => point.x > rect.left, (start, end) => getLineIntersectionWithVertical(start, end, rect.left)),
        (point) => point.x < rect.right,
        (start, end) => getLineIntersectionWithVertical(start, end, rect.right)
      ),
      (point) => point.y > rect.top,
      (start, end) => getLineIntersectionWithHorizontal(start, end, rect.top)
    ),
    (point) => point.y < rect.bottom,
    (start, end) => getLineIntersectionWithHorizontal(start, end, rect.bottom)
  );
}

function clipPolygonEdge(polygon: Point[], isInside: (point: Point) => boolean, getIntersection: (start: Point, end: Point) => Point): Point[] {
  if (polygon.length === 0) {
    return [];
  }
  const result: Point[] = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentInside = isInside(current);
    const previousInside = isInside(previous);
    if (currentInside) {
      if (!previousInside) {
        result.push(getIntersection(previous, current));
      }
      result.push(current);
    } else if (previousInside) {
      result.push(getIntersection(previous, current));
    }
  }
  return result;
}

function getLineIntersectionWithVertical(start: Point, end: Point, x: number): Point {
  const t = (x - start.x) / getSafeDelta(end.x - start.x);
  return { x, y: start.y + (end.y - start.y) * t };
}

function getLineIntersectionWithHorizontal(start: Point, end: Point, y: number): Point {
  const t = (y - start.y) / getSafeDelta(end.y - start.y);
  return { x: start.x + (end.x - start.x) * t, y };
}

function getSafeDelta(delta: number): number {
  if (Math.abs(delta) >= 0.0001) {
    return delta;
  }
  return delta < 0 ? -0.0001 : 0.0001;
}

function getPolygonArea(points: Point[]): number {
  if (points.length < 3) {
    return 0;
  }
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}

function tracePointyHex(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 180) * (60 * index - 30);
    const point = {
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius
    };
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.closePath();
}

export function getTemplateLabel(drawing: DrawingElement, scene: Scene): string | null {
  const [start, end] = drawing.points;
  if (!start || !end) {
    return null;
  }
  const distance = getStraightLineMeasurementDistance(start, end, scene.grid);
  if (drawing.kind === "rectangle") {
    const squareSideDistance = getTemplateRectangleSideDistance(start, end, scene);
    return `${formatMeasurementDistance(squareSideDistance, scene.grid.measurement, scene.grid.type)} square`;
  }
  if (drawing.kind === "circle") {
    return `${formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type)} radius`;
  }
  if (drawing.kind === "cone") {
    return `${formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type)} cone`;
  }
  if (drawing.kind === "line" && (drawing.templateWidth ?? 5) > 0) {
    const width = formatMeasurementDistance(drawing.templateWidth ?? 5, scene.grid.measurement, scene.grid.type);
    return `${formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type)} x ${width}`;
  }
  return formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type);
}

function getTemplateRectangleSideDistance(start: Point, end: Point, scene: Scene): number {
  const sideLengthPx = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return sideLengthPx;
  }
  return (sideLengthPx / scene.grid.sizePx) * scene.grid.measurement.unitsPerGridCell;
}

function getTemplateLabelPosition(drawing: DrawingElement): { position: Point; angle: number } {
  const [start, end] = drawing.points;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  if (drawing.kind === "circle") {
    return {
      position: {
        x: start.x,
        y: start.y - 18
      },
      angle: 0
    };
  }
  if (drawing.kind === "rectangle") {
    return {
      position: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2
      },
      angle: 0
    };
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(drawing.points);
    if (triangle) {
      const oppositeCenter = {
        x: (triangle[1].x + triangle[2].x) / 2,
        y: (triangle[1].y + triangle[2].y) / 2
      };
      return {
        position: {
          x: (triangle[0].x + oppositeCenter.x) / 2,
          y: (triangle[0].y + oppositeCenter.y) / 2
        },
        angle
      };
    }
  }
  return {
    position: {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    },
    angle
  };
}

function isDrawingVisible(drawing: DrawingElement, mode: "gm" | "player"): boolean {
  return mode === "gm" ? drawing.visibleInGm !== false : drawing.visibleInPlayer !== false;
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

function getDrawingKindForTool(tool: DrawingTool): DrawingElement["kind"] {
  if (tool === "template-line") {
    return "line";
  }
  if (tool === "template-rectangle") {
    return "rectangle";
  }
  if (tool === "template-circle") {
    return "circle";
  }
  if (tool === "template-cone") {
    return "cone";
  }
  if (tool === "circle") {
    return "ellipse";
  }
  return tool;
}
