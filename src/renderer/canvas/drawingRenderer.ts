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

type TemplateEffectAsset = {
  effect: string;
  image: HTMLImageElement;
  loaded: boolean;
  url: string;
};

type PlacedTemplateAsset = {
  angle: number;
  alpha: number;
  asset: TemplateEffectAsset;
  height: number;
  width: number;
  x: number;
  y: number;
};

const TEMPLATE_EFFECT_ASSET_READY_EVENT = "localvtt-template-effect-assets-ready";
const TEMPLATE_EFFECT_ASSET_WIDTH_PX = 700;
const templateEffectAssetUrls = import.meta.glob("../assets/template-effects/*/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const templateEffectAssetCache = createTemplateEffectAssetCache(templateEffectAssetUrls);

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
    drawDrawingElement(ctx, renderDrawing, scene, layerOpacity, zoom);
    if (mode === "gm" && selectedDrawingIds.has(drawing.id)) {
      const selectionOverridePoints = selectionPointOverrides?.get(drawing.id);
      drawDrawingSelection(ctx, selectionOverridePoints ? { ...drawing, points: selectionOverridePoints } : renderDrawing, zoom);
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
        measurementLabelVisible: preview.measurementLabelVisible,
        visibleInGm: true,
        visibleInPlayer: true
      },
      scene,
      layerOpacity,
      zoom
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

function drawDrawingSelection(ctx: CanvasRenderingContext2D, drawing: DrawingElement, zoom: number) {
  const bounds = getDrawingBounds(drawing);
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

export function getDrawingAtPoint(drawings: DrawingElement[], point: Point, hitRadius = 8): DrawingElement | null {
  for (const drawing of [...drawings].reverse()) {
    if (!isDrawingVisible(drawing, "gm")) {
      continue;
    }
    if (isPointNearDrawing(drawing, point, hitRadius)) {
      return drawing;
    }
  }
  return null;
}

function drawDrawingElement(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scene: Scene, layerOpacity: number, zoom: number) {
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
    drawTemplateGridHighlights(ctx, drawing, scene.grid);
  } else {
    applyDrawingStrokeStyle(ctx, drawing.strokeStyle ?? "solid", drawing.strokeWidth);
  }

  if (drawing.kind === "line") {
    drawLine(ctx, points);
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
  drawTemplateLabel(ctx, drawing, scene, zoom);
  ctx.restore();
}

function isPointNearDrawing(drawing: DrawingElement, point: Point, hitRadius: number): boolean {
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

function drawLine(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.stroke();
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

function drawTemplateLabel(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scene: Scene, zoom: number) {
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
  const scale = 1 / Math.max(0.1, zoom);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.font = `800 ${Math.round(18 * scale)}px Inter, system-ui, sans-serif`;
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
      return { stroke: "#84cc16", fill: "#bef264", fillOpacity: 0.18, highlightFill: "rgb(132 204 22 / 0.2)", highlightStroke: "rgb(217 249 157 / 0.34)", dash: [12, 8, 3, 8] };
    case "arcane":
      return { stroke: "#a78bfa", fill: "#7c3aed", fillOpacity: 0.16, highlightFill: "rgb(124 58 237 / 0.2)", highlightStroke: "rgb(221 214 254 / 0.36)", dash: [10, 7] };
    case "cold":
      return { stroke: "#67e8f9", fill: "#cffafe", fillOpacity: 0.15, highlightFill: "rgb(207 250 254 / 0.18)", highlightStroke: "rgb(165 243 252 / 0.38)", dash: [16, 6] };
    case "darkness":
      return { stroke: "#64748b", fill: "#020617", fillOpacity: 0.34, highlightFill: "rgb(15 23 42 / 0.34)", highlightStroke: "rgb(148 163 184 / 0.38)", dash: [7, 7] };
    case "fire":
      return { stroke: "#f97316", fill: "#facc15", fillOpacity: 0.2, highlightFill: "rgb(250 204 21 / 0.2)", highlightStroke: "rgb(254 215 170 / 0.38)", dash: [18, 7, 5, 7] };
    case "fog":
      return { stroke: "#cbd5e1", fill: "#e2e8f0", fillOpacity: 0.2, highlightFill: "rgb(226 232 240 / 0.22)", highlightStroke: "rgb(248 250 252 / 0.32)", dash: [5, 10] };
    case "lightning":
      return { stroke: "#fde047", fill: "#38bdf8", fillOpacity: 0.13, highlightFill: "rgb(56 189 248 / 0.18)", highlightStroke: "rgb(254 240 138 / 0.45)", dash: [20, 4, 3, 4] };
    case "nature":
      return { stroke: "#22c55e", fill: "#4ade80", fillOpacity: 0.16, highlightFill: "rgb(74 222 128 / 0.18)", highlightStroke: "rgb(187 247 208 / 0.34)", dash: [6, 5, 2, 5] };
    case "poison":
      return { stroke: "#a3e635", fill: "#365314", fillOpacity: 0.24, highlightFill: "rgb(54 83 20 / 0.28)", highlightStroke: "rgb(217 249 157 / 0.34)", dash: [9, 9] };
    case "psychic":
      return { stroke: "#f0abfc", fill: "#c026d3", fillOpacity: 0.15, highlightFill: "rgb(192 38 211 / 0.18)", highlightStroke: "rgb(245 208 254 / 0.38)", dash: [3, 7, 14, 7] };
    case "radiant":
      return { stroke: "#fef08a", fill: "#fef3c7", fillOpacity: 0.18, highlightFill: "rgb(254 243 199 / 0.2)", highlightStroke: "rgb(254 240 138 / 0.45)", dash: [14, 5] };
    case "storm":
      return { stroke: "#60a5fa", fill: "#1e3a8a", fillOpacity: 0.2, highlightFill: "rgb(30 58 138 / 0.24)", highlightStroke: "rgb(147 197 253 / 0.38)", dash: [11, 5, 3, 5] };
    case "thunder":
      return { stroke: "#c084fc", fill: "#4c1d95", fillOpacity: 0.14, highlightFill: "rgb(76 29 149 / 0.18)", highlightStroke: "rgb(216 180 254 / 0.38)", dash: [22, 5] };
    case "water":
      return { stroke: "#38bdf8", fill: "#0ea5e9", fillOpacity: 0.16, highlightFill: "rgb(14 165 233 / 0.18)", highlightStroke: "rgb(186 230 253 / 0.36)", dash: [12, 5] };
    case "web":
      return { stroke: "#f8fafc", fill: "#cbd5e1", fillOpacity: 0, highlightFill: "rgb(203 213 225 / 0.2)", highlightStroke: "rgb(248 250 252 / 0.45)", dash: [4, 6, 14, 6] };
    case "plain":
    default:
      return { stroke: "#7dd3fc", fill: "#7dd3fc", fillOpacity: 0.08, highlightFill: "rgb(122 162 247 / 0.18)", highlightStroke: "rgb(255 255 255 / 0.34)" };
  }
}

function drawTemplateAssetOverlay(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number) {
  if (drawing.id === "preview" || drawing.templateEffect !== "web" || (drawing.kind !== "circle" && drawing.kind !== "rectangle" && drawing.kind !== "cone")) {
    return;
  }
  const assets = templateEffectAssetCache.get("web")?.filter((asset) => asset.loaded && asset.image.naturalWidth > 0 && asset.image.naturalHeight > 0) ?? [];
  if (assets.length === 0) {
    return;
  }
  const bounds = getDrawingBounds(drawing);
  if (!bounds) {
    return;
  }
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  if (width <= 0 || height <= 0) {
    return;
  }

  const random = createSeededRandom(hashString(`${drawing.id}:${drawing.kind}:${drawing.templateEffect}:${pointsSeed(drawing.points)}`));
  const placementCount = Math.max(5, Math.min(14, Math.round((width * height) / 42000)));
  const placements = createTemplateAssetPlacements(drawing, bounds, assets, placementCount, random);
  const bands = 7;
  const innerScale = 0.58;
  ctx.save();
  for (let bandIndex = 0; bandIndex < bands; bandIndex += 1) {
    const outerScale = 1 - ((1 - innerScale) * bandIndex) / bands;
    const bandInnerScale = 1 - ((1 - innerScale) * (bandIndex + 1)) / bands;
    const fade = 1 - bandIndex / bands;
    ctx.save();
    ctx.beginPath();
    traceTemplatePath(ctx, drawing, outerScale);
    traceTemplatePath(ctx, drawing, bandInnerScale);
    ctx.clip("evenodd");
    ctx.globalAlpha = Math.max(0.04, Math.min(0.86, layerOpacity * fade * fade));
    for (const placement of placements) {
      drawPlacedTemplateAsset(ctx, placement);
    }
    ctx.restore();
  }
  ctx.restore();
}

function createTemplateAssetPlacements(
  drawing: DrawingElement,
  bounds: { left: number; top: number; right: number; bottom: number },
  assets: TemplateEffectAsset[],
  count: number,
  random: () => number
): PlacedTemplateAsset[] {
  const placements: PlacedTemplateAsset[] = [];
  for (let index = 0; index < count; index += 1) {
    const asset = assets[Math.floor(random() * assets.length) % assets.length];
    const point = getTemplateEdgeBandPoint(drawing, bounds, index, count, random);
    const targetWidth = TEMPLATE_EFFECT_ASSET_WIDTH_PX * (0.78 + random() * 0.5);
    const aspect = asset.image.naturalHeight > 0 ? asset.image.naturalWidth / asset.image.naturalHeight : 1;
    placements.push({
      angle: (random() - 0.5) * Math.PI * 1.85,
      alpha: 0.58 + random() * 0.32,
      asset,
      height: targetWidth / Math.max(0.2, aspect),
      width: targetWidth,
      x: point.x,
      y: point.y
    });
  }
  return placements;
}

function getTemplateEdgeBandPoint(
  drawing: DrawingElement,
  bounds: { left: number; top: number; right: number; bottom: number },
  index: number,
  count: number,
  random: () => number
): Point {
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
  ctx.drawImage(placement.asset.image, -placement.width / 2, -placement.height / 2, placement.width, placement.height);
  ctx.restore();
}

function traceTemplatePath(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scale: number) {
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

function createTemplateEffectAssetCache(urls: Record<string, string>): Map<string, TemplateEffectAsset[]> {
  const cache = new Map<string, TemplateEffectAsset[]>();
  if (typeof Image === "undefined") {
    return cache;
  }
  for (const [path, url] of Object.entries(urls).sort(([left], [right]) => left.localeCompare(right))) {
    const effect = getTemplateEffectNameFromPath(path);
    if (!effect) {
      continue;
    }
    const image = new Image();
    const asset: TemplateEffectAsset = { effect, image, loaded: false, url };
    image.onload = () => {
      asset.loaded = true;
      window.dispatchEvent(new Event(TEMPLATE_EFFECT_ASSET_READY_EVENT));
    };
    image.src = url;
    if (image.complete && image.naturalWidth > 0) {
      asset.loaded = true;
    }
    const assets = cache.get(effect) ?? [];
    assets.push(asset);
    cache.set(effect, assets);
  }
  return cache;
}

function getTemplateEffectNameFromPath(path: string): string | null {
  const normalized = path.replaceAll("\\", "/");
  const match = normalized.match(/template-effects\/([^/]+)\/[^/]+\.svg$/);
  return match?.[1] ?? null;
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

export function addTemplateEffectAssetLoadListener(listener: () => void): () => void {
  window.addEventListener(TEMPLATE_EFFECT_ASSET_READY_EVENT, listener);
  return () => window.removeEventListener(TEMPLATE_EFFECT_ASSET_READY_EVENT, listener);
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
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  const effect = getTemplateEffectStyle(drawing.templateEffect ?? "plain");
  ctx.fillStyle = effect.highlightFill;
  ctx.strokeStyle = effect.highlightStroke;
  ctx.lineWidth = Math.max(1, grid.lineThickness);
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
    return start && end ? distanceToSegment(center, start, end) <= getTemplateWidthPixels(drawing, grid) / 2 + 0.0001 : false;
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

export function getDrawingBounds(drawing: DrawingElement): { left: number; top: number; right: number; bottom: number } | null {
  const points = getShapePoints(drawing);
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
  const widthFeet = Math.max(1, drawing.templateWidth ?? 5);
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
