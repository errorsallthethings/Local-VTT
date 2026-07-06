import type { DrawingElement, GridSettings, Point, Scene } from "../../../shared/localvtt";
import { drawSelectionBox } from "../selection/selectionRenderer";
import { getDrawingBounds } from "./drawingBounds";
import { distanceBetweenPoints, getConeTriangle, getTriangle } from "./drawingGeometry";
import { isDrawingVisible } from "./drawingHitTesting";
import { type DrawingPreview } from "./drawingPreview";
import { getRenderableDrawingElementFromPreview } from "./drawingRenderPreview";
import { applyDrawingStrokeStyle } from "./drawingStrokeStyle";
import { getLineTemplateCorridorPoints } from "./templateEffectGeometry";
import { drawTemplateAssetOverlay } from "./templateEffectOverlayRenderer";
import {
  applyTemplateEffectStroke,
  drawTemplateGridHighlights,
  drawTemplateLabel,
  fillCurrentTemplatePath,
  fillTemplateShape,
  traceClosedPath
} from "./templateDrawingPresentation";

export type DrawingPointOverrides = Map<string, Point[]>;

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
    drawDrawingElement(ctx, getRenderableDrawingElementFromPreview(preview), scene, layerOpacity, true);
  }
  ctx.restore();
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
  if (drawing.measurementLabelVisible && drawing.id === "preview") {
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


