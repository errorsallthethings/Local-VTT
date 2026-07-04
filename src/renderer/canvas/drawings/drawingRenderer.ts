import * as THREE from "three";
import type { DrawingElement, DrawingStrokeStyle, DrawingTemplateEffect, GridSettings, Point, Scene } from "../../../shared/localvtt";
import { drawSelectionBox } from "../selection/selectionRenderer";
import { getDrawingBounds } from "./drawingBounds";
import { distanceBetweenPoints, getConeTriangle, getTriangle } from "./drawingGeometry";
import { isDrawingVisible } from "./drawingHitTesting";
import { getDrawingPreviewPoints, type DrawingPreview } from "./drawingPreview";
import { getDrawingKindForTool } from "./templateDrawing";
import { createSeededRandom, getLineTemplateCorridorPoints, getRectanglePathPoints, scalePointsToCenter } from "./templateEffectGeometry";
import {
  createTemplateAssetPlacements,
  createTemplatePlacementRandom,
  getTemplateEffectBounds,
  getTemplateEffectOverlayCacheKey,
  getTemplateEffectPlacementCount,
  type PlacedTemplateAsset,
  type TemplateEffectRenderable
} from "./templateEffectPlacement";
import { getTemplateEffectStyle, getTemplateInnerGlowStyle } from "./templateEffectStyles";
import { supportsTemplateEffectAssets, supportsTemplateEffectInnerGlow, type TemplateEffectAssetEffect } from "./templateEffectAssets";
import {
  getTemplateEffectOverlayCacheEntry,
  setTemplateEffectOverlayCacheEntry,
  type TemplateEffectOverlayCacheEntry
} from "./templateEffectOverlayCache";
import { getTemplateEffectTuning } from "./templateEffectTuning";
import { getTemplateGridHighlightCells } from "./templateGridHighlights";
import { getTemplateLabel, getTemplateLabelPosition } from "./templateLabels";

export type DrawingPointOverrides = Map<string, Point[]>;

type TemplateEffectRenderableFactory = () => TemplateEffectRenderable[];

function disposeTransientRenderer(renderer: THREE.WebGLRenderer) {
  renderer.forceContextLoss();
  renderer.dispose();
}

function snapshotRendererCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const snapshot = document.createElement("canvas");
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;
  const snapshotContext = snapshot.getContext("2d");
  if (!snapshotContext) {
    return canvas;
  }
  snapshotContext.drawImage(canvas, 0, 0);
  return snapshot;
}

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
  if (supportsTemplateEffectInnerGlow(drawing)) {
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
  const glow = getTemplateInnerGlowStyle(drawing.templateEffect ?? "plain", drawing.strokeWidth, layerOpacity);
  if (!glow) {
    return;
  }
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = glow.alpha;
  ctx.strokeStyle = glow.strokeStyle;
  ctx.shadowColor = glow.shadowColor;
  ctx.shadowBlur = glow.shadowBlur;
  ctx.lineWidth = glow.lineWidth;
  ctx.stroke();
  ctx.globalAlpha = glow.highlightAlpha;
  ctx.shadowBlur = 0;
  ctx.lineWidth = glow.highlightLineWidth;
  ctx.strokeStyle = glow.highlightStrokeStyle;
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

function drawTemplateAssetOverlay(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number, grid?: GridSettings) {
  const effect = drawing.templateEffect ?? "plain";
  if (!supportsTemplateEffectAssets(drawing)) {
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
  const cached = getTemplateEffectOverlayCacheEntry(templateEffectOverlayCache, cacheKey);
  if (cached) {
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
  const random = createTemplatePlacementRandom(drawing);
  const placementCount = getTemplateEffectPlacementCount(bounds, tuning);
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
    return setTemplateEffectOverlayCacheEntry(templateEffectOverlayCache, { canvas, key: cacheKey, left: bounds.left, top: bounds.top });
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

  return setTemplateEffectOverlayCacheEntry(templateEffectOverlayCache, { canvas, key: cacheKey, left: bounds.left, top: bounds.top });
}

const TEMPLATE_EFFECT_RENDERABLE_FACTORIES: Record<TemplateEffectAssetEffect, TemplateEffectRenderableFactory> = {
  acid: getAcidTemplateRenderables,
  arcane: getArcaneTemplateRenderables,
  cold: getColdTemplateRenderables,
  darkness: getDarknessTemplateRenderables,
  fire: getFireTemplateRenderables,
  fog: getFogTemplateRenderables,
  lightning: getLightningTemplateRenderables,
  nature: getNatureTemplateRenderables,
  poison: getPoisonTemplateRenderables,
  psychic: getPsychicTemplateRenderables,
  radiant: getRadiantTemplateRenderables,
  storm: getStormTemplateRenderables,
  thunder: getThunderTemplateRenderables,
  water: getWaterTemplateRenderables,
  web: getWebTemplateRenderables
};

export function getRegisteredTemplateEffectRenderableEffects(): TemplateEffectAssetEffect[] {
  return Object.keys(TEMPLATE_EFFECT_RENDERABLE_FACTORIES).sort() as TemplateEffectAssetEffect[];
}

function getTemplateEffectRenderables(effect: DrawingTemplateEffect): TemplateEffectRenderable[] {
  return effect === "plain" ? [] : TEMPLATE_EFFECT_RENDERABLE_FACTORIES[effect]();
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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
    const snapshot = snapshotRendererCanvas(canvas);
    disposeScene(scene);
    disposeTransientRenderer(renderer);
    return snapshot;
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

