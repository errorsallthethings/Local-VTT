import type { DrawingElement, GridSettings, Point, Scene } from "../../../shared/localvtt";
import { distanceBetweenPoints, getConeTriangle } from "./drawingGeometry";
import { getLineTemplateCorridorPoints, getRectanglePathPoints, scalePointsToCenter } from "./templateEffectGeometry";
import { supportsTemplateEffectInnerGlow } from "./templateEffectAssets";
import { getTemplateEffectStyle, getTemplateInnerGlowStyle } from "./templateEffectStyles";
import { getTemplateLabel, getTemplateLabelPosition } from "./templateLabels";

export function fillTemplateShape(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number, tracePath: () => void) {
  ctx.beginPath();
  tracePath();
  fillCurrentTemplatePath(ctx, drawing, layerOpacity);
}

export function fillCurrentTemplatePath(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number) {
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

export function applyTemplateEffectStroke(ctx: CanvasRenderingContext2D, drawing: DrawingElement) {
  const effect = getTemplateEffectStyle(drawing.templateEffect ?? "plain");
  ctx.strokeStyle = effect.stroke;
  ctx.shadowBlur = 0;
  if (effect.dash) {
    ctx.setLineDash(effect.dash.map((value) => Math.max(2, value * Math.max(1, drawing.strokeWidth / 40))));
  }
}

export function drawTemplateLabel(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scene: Scene) {
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

export function traceTemplateEffectPath(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scale: number, grid?: GridSettings) {
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

export function traceClosedPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length === 0) {
    return;
  }
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
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

function traceLineTemplateCorridor(ctx: CanvasRenderingContext2D, drawing: DrawingElement, scale: number, grid?: GridSettings) {
  const points = getLineTemplateCorridorPoints(drawing, scale, grid);
  if (!points) {
    return;
  }
  traceClosedPath(ctx, points);
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

export { drawTemplateGridHighlights } from "./templateGridHighlights";
