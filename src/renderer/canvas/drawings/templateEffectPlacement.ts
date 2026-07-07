import type { DrawingElement, GridSettings, Point } from "../../../shared/localvtt";
import { getDrawingBounds, type DrawingBounds } from "./drawingBounds";
import { distanceBetweenPoints, getConeTriangle } from "./drawingGeometry";
import { createSeededRandom, getRectanglePathPoints, hashString, pointsSeed } from "./templateEffectGeometry";
import type { TemplateEffectTuning } from "./templateEffectTuning";
import { TEMPLATE_EFFECT_TUNING_VERSION } from "./templateEffectTuning";
import { getLineTemplateEffectWidthPixels } from "./templateLabels";

export const TEMPLATE_EFFECT_RENDERABLE_WIDTH_PX = 800;

export type TemplateEffectRenderable = {
  id: string;
  image: CanvasImageSource;
  naturalHeight: number;
  naturalWidth: number;
};

export type PlacedTemplateAsset = {
  angle: number;
  alpha: number;
  height: number;
  image: CanvasImageSource;
  width: number;
  x: number;
  y: number;
};

export function createTemplatePlacementRandom(drawing: DrawingElement): () => number {
  return createSeededRandom(hashString(`${drawing.id}:${drawing.kind}:${drawing.templateEffect}:${pointsSeed(drawing.points)}`));
}

export function getTemplateEffectPlacementCount(bounds: DrawingBounds, tuning: TemplateEffectTuning): number {
  const width = Math.ceil(bounds.right - bounds.left);
  const height = Math.ceil(bounds.bottom - bounds.top);
  const basePlacementCount = Math.round((width * height) / 42000);
  return Math.max(tuning.minPlacements, Math.min(tuning.maxPlacements, Math.round(basePlacementCount * tuning.density)));
}

export function getTemplateEffectOverlayCacheKey(
  drawing: DrawingElement,
  bounds: DrawingBounds,
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

export function getTemplateEffectBounds(drawing: DrawingElement, grid?: GridSettings): DrawingBounds | null {
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

export function createTemplateAssetPlacements(
  drawing: DrawingElement,
  bounds: DrawingBounds,
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

function getTemplateEdgeBandPoint(
  drawing: DrawingElement,
  bounds: DrawingBounds,
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
