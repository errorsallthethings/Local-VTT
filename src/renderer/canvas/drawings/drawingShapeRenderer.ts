import type { DrawingElement, GridSettings, Point } from "../../../shared/localvtt";
import { distanceBetweenPoints, getConeTriangle, getTriangle } from "./drawingGeometry";
import { getLineTemplateCorridorPoints } from "./templateEffectGeometry";
import { drawTemplateAssetOverlay } from "./templateEffectOverlayRenderer";
import {
  fillCurrentTemplatePath,
  fillTemplateShape,
  traceClosedPath
} from "./templateDrawingPresentation";

export function drawLine(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  drawing: DrawingElement,
  grid: GridSettings,
  layerOpacity: number,
  showCenterGuide: boolean
) {
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

export function drawPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) {
    return;
  }
  tracePath(ctx, points);
  ctx.stroke();
}

export function drawRectangle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  if (points.length >= 4) {
    ctx.beginPath();
    traceClosedPath(ctx, points.slice(0, 4));
    fillCurrentTemplatePath(ctx, drawing, layerOpacity);
    ctx.stroke();
    drawTemplateAssetOverlay(ctx, drawing, layerOpacity);
    ctx.beginPath();
    traceClosedPath(ctx, points.slice(0, 4));
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

export function drawCircle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  const [start, end] = points;
  const radius = distanceBetweenPoints(start, end);
  ctx.beginPath();
  ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
  drawTemplateAssetOverlay(ctx, drawing, layerOpacity);
  ctx.beginPath();
  ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  if (drawing.measurementLabelVisible) {
    drawCenterPoint(ctx, start, drawing);
    if (drawing.id === "preview") {
      drawDashedGuide(ctx, start, end, drawing);
    }
  }
}

export function drawCone(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 2) {
    return;
  }
  const triangle = getConeTriangle(points);
  if (!triangle) {
    return;
  }
  const [origin, left, right] = triangle;

  ctx.beginPath();
  traceClosedPath(ctx, [origin, left, right]);
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
  drawTemplateAssetOverlay(ctx, drawing, layerOpacity);
  ctx.beginPath();
  traceClosedPath(ctx, [origin, left, right]);
  ctx.stroke();
  if (drawing.measurementLabelVisible && drawing.id === "preview") {
    const oppositeCenter = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
    drawDashedGuide(ctx, origin, oppositeCenter, drawing);
  }
}

export function drawEllipse(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
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

export function drawTriangle(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  const triangle = getTriangle(points);
  if (!triangle) {
    return;
  }
  ctx.beginPath();
  traceClosedPath(ctx, triangle);
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
}

export function drawPolygonShape(ctx: CanvasRenderingContext2D, points: Point[], drawing: DrawingElement, layerOpacity: number) {
  if (points.length < 3) {
    drawPath(ctx, points);
    return;
  }
  ctx.beginPath();
  traceClosedPath(ctx, points);
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
  ctx.stroke();
}

function drawLinePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
}

function tracePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
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
