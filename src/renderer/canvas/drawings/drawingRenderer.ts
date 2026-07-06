import type { DrawingElement, GridSettings, Point, Scene } from "../../../shared/localvtt";
import { drawSelectionBox } from "../selection/selectionRenderer";
import { getDrawingBounds } from "./drawingBounds";
import { isDrawingVisible } from "./drawingHitTesting";
import { type DrawingPreview } from "./drawingPreview";
import { getRenderableDrawingElementFromPreview } from "./drawingRenderPreview";
import {
  drawCircle,
  drawCone,
  drawEllipse,
  drawLine,
  drawPath,
  drawPolygonShape,
  drawRectangle,
  drawTriangle
} from "./drawingShapeRenderer";
import { applyDrawingStrokeStyle } from "./drawingStrokeStyle";
import {
  applyTemplateEffectStroke,
  drawTemplateGridHighlights,
  drawTemplateLabel
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


