import type { DrawingElement, GridSettings } from "../../../shared/localvtt";
import {
  createTemplateAssetPlacements,
  createTemplatePlacementRandom,
  getTemplateEffectBounds,
  getTemplateEffectOverlayCacheKey,
  getTemplateEffectPlacementCount,
  type PlacedTemplateAsset,
  type TemplateEffectRenderable
} from "./templateEffectPlacement";
import { supportsTemplateEffectAssets } from "./templateEffectAssets";
import {
  getTemplateEffectOverlayCacheEntry,
  setTemplateEffectOverlayCacheEntry,
  type TemplateEffectOverlayCacheEntry
} from "./templateEffectOverlayCache";
import { getTemplateEffectRenderables } from "./templateEffectRenderables";
import { getTemplateEffectTuning } from "./templateEffectTuning";
import { traceTemplateEffectPath } from "./templateDrawingPresentation";

const templateEffectOverlayCache = new Map<string, TemplateEffectOverlayCacheEntry>();

export function drawTemplateAssetOverlay(ctx: CanvasRenderingContext2D, drawing: DrawingElement, layerOpacity: number, grid?: GridSettings) {
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

function drawPlacedTemplateAsset(ctx: CanvasRenderingContext2D, placement: PlacedTemplateAsset) {
  ctx.save();
  ctx.translate(placement.x, placement.y);
  ctx.rotate(placement.angle);
  ctx.globalAlpha *= placement.alpha;
  ctx.drawImage(placement.image, -placement.width / 2, -placement.height / 2, placement.width, placement.height);
  ctx.restore();
}
