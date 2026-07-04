import type { EnvironmentEffectMask } from "../../../shared/localvtt";
import { getEnvironmentEffectBounds, getPointBounds } from "../scene/boundsGeometry";
import type { Camera } from "../core/camera";
import { drawSelectionBox } from "../selection/selectionRenderer";
import {
  type AcidEffectTuning,
  type ArcaneEffectTuning,
  type ChaosEffectTuning,
  type ColdEffectTuning,
  type DarknessEffectTuning,
  type DistortionEffectTuning,
  type FireEffectTuning,
  type FogEffectTuning,
  type ForceFieldEffectTuning,
  type LavaEffectTuning,
  type LightningEffectTuning,
  type NatureEffectTuning,
  type PoisonEffectTuning,
  type RadiantEffectTuning,
  type ShockwaveEffectTuning,
  type SmokeEffectTuning,
  type VoidEffectTuning,
  type WaterEffectTuning
} from "./environmentEffectTuningDefaults";
import {
  ENVIRONMENT_EFFECT_DRAWERS,
  type EnvironmentEffectTuningOverrides
} from "./environmentEffectDrawers";
import type { ScreenBounds } from "./environmentEffectRendererMath";
import {
  environmentDragToMask,
  getClampedEnvironmentEffectFeather,
  getEnvironmentEffectPathCommands,
  isEnvironmentEffectVisibleForMode,
  type EnvironmentEffectDrag
} from "./environmentEffectGeometry";
import {
  getDistanceToPolygonEdge,
  getEnvironmentFeatherAlpha,
  getEnvironmentFeatherMask,
  isPointInPolygon,
  roundMaskValue
} from "./environmentFeather";
import { worldRectToScreen, worldToScreenPoint } from "../core/viewportGeometry";
import { getEnvironmentEffectPreviewFill, getEnvironmentEffectStroke } from "../../lib/effects";

export function buildEnvironmentEffectTuningOverrides(
  acidEffectTuning?: AcidEffectTuning,
  coldEffectTuning?: ColdEffectTuning,
  darknessEffectTuning?: DarknessEffectTuning,
  poisonEffectTuning?: PoisonEffectTuning,
  waterEffectTuning?: WaterEffectTuning,
  lavaEffectTuning?: LavaEffectTuning,
  fireEffectTuning?: FireEffectTuning,
  lightningEffectTuning?: LightningEffectTuning,
  arcaneEffectTuning?: ArcaneEffectTuning,
  chaosEffectTuning?: ChaosEffectTuning,
  voidEffectTuning?: VoidEffectTuning,
  natureEffectTuning?: NatureEffectTuning,
  distortionEffectTuning?: DistortionEffectTuning,
  radiantEffectTuning?: RadiantEffectTuning,
  forceFieldEffectTuning?: ForceFieldEffectTuning,
  shockwaveEffectTuning?: ShockwaveEffectTuning,
  smokeEffectTuning?: SmokeEffectTuning,
  fogEffectTuning?: FogEffectTuning
): EnvironmentEffectTuningOverrides {
  return {
    acidEffectTuning,
    coldEffectTuning,
    darknessEffectTuning,
    poisonEffectTuning,
    waterEffectTuning,
    lavaEffectTuning,
    fireEffectTuning,
    lightningEffectTuning,
    arcaneEffectTuning,
    chaosEffectTuning,
    voidEffectTuning,
    natureEffectTuning,
    distortionEffectTuning,
    radiantEffectTuning,
    forceFieldEffectTuning,
    shockwaveEffectTuning,
    smokeEffectTuning,
    fogEffectTuning
  };
}

let featherCompositeCanvas: HTMLCanvasElement | null = null;

interface ViewportBounds {
  width: number;
  height: number;
}

export function drawEnvironmentEffectPreview(ctx: CanvasRenderingContext2D, preview: EnvironmentEffectDrag, camera: Camera) {
  const effectMask = environmentDragToMask(preview);
  drawEnvironmentEffectShape(ctx, effectMask, camera, { fill: true, selected: false });
}

export function drawEnvironmentEffects(
  ctx: CanvasRenderingContext2D,
  effects: EnvironmentEffectMask[],
  camera: Camera,
  mode: "gm" | "player",
  timestamp: number,
  layerOpacity: number,
  acidEffectTuning?: AcidEffectTuning,
  coldEffectTuning?: ColdEffectTuning,
  darknessEffectTuning?: DarknessEffectTuning,
  poisonEffectTuning?: PoisonEffectTuning,
  waterEffectTuning?: WaterEffectTuning,
  lavaEffectTuning?: LavaEffectTuning,
  fireEffectTuning?: FireEffectTuning,
  lightningEffectTuning?: LightningEffectTuning,
  arcaneEffectTuning?: ArcaneEffectTuning,
  chaosEffectTuning?: ChaosEffectTuning,
  voidEffectTuning?: VoidEffectTuning,
  natureEffectTuning?: NatureEffectTuning,
  distortionEffectTuning?: DistortionEffectTuning,
  radiantEffectTuning?: RadiantEffectTuning,
  forceFieldEffectTuning?: ForceFieldEffectTuning,
  shockwaveEffectTuning?: ShockwaveEffectTuning,
  smokeEffectTuning?: SmokeEffectTuning,
  fogEffectTuning?: FogEffectTuning
) {
  const tuningOverrides = buildEnvironmentEffectTuningOverrides(
    acidEffectTuning,
    coldEffectTuning,
    darknessEffectTuning,
    poisonEffectTuning,
    waterEffectTuning,
    lavaEffectTuning,
    fireEffectTuning,
    lightningEffectTuning,
    arcaneEffectTuning,
    chaosEffectTuning,
    voidEffectTuning,
    natureEffectTuning,
    distortionEffectTuning,
    radiantEffectTuning,
    forceFieldEffectTuning,
    shockwaveEffectTuning,
    smokeEffectTuning,
    fogEffectTuning
  );
  const viewportBounds = getCanvasViewportBounds(ctx);
  for (const effect of effects) {
    if (!isEnvironmentEffectVisibleForMode(effect, mode)) {
      continue;
    }
    const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
    if (!screenBounds || !isScreenBoundsVisible(screenBounds, viewportBounds)) {
      continue;
    }
    const feather = getClampedEnvironmentEffectFeather(effect);
    if (feather > 0) {
      drawFeatheredEnvironmentEffect(ctx, effect, camera, timestamp, layerOpacity, feather, tuningOverrides, screenBounds);
      continue;
    }
    ctx.save();
    const path = getEnvironmentEffectPath(effect, camera);
    ctx.clip(path);
    drawEnvironmentEffectContent(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides);
    ctx.restore();
  }
}

function drawFeatheredEnvironmentEffect(
  ctx: CanvasRenderingContext2D,
  effect: EnvironmentEffectMask,
  camera: Camera,
  timestamp: number,
  layerOpacity: number,
  feather: number,
  tuningOverrides: EnvironmentEffectTuningOverrides,
  screenBounds: ScreenBounds
) {
  const width = Math.max(1, Math.round(ctx.canvas.width / (window.devicePixelRatio || 1)));
  const height = Math.max(1, Math.round(ctx.canvas.height / (window.devicePixelRatio || 1)));
  const effectCanvas = getFeatherCompositeCanvas(width, height);
  const effectCtx = effectCanvas.getContext("2d");
  if (!effectCtx) {
    return;
  }
  resetFeatherCompositeContext(effectCtx, width, height);

  const path = getEnvironmentEffectPath(effect, camera);
  effectCtx.save();
  effectCtx.clip(path);
  drawEnvironmentEffectContent(effectCtx, effect, camera, timestamp, layerOpacity, tuningOverrides);
  effectCtx.restore();

  applyEnvironmentEffectFeather(effectCtx, effect, camera, feather, path, screenBounds);
  ctx.drawImage(effectCanvas, 0, 0, width, height);
}

function getFeatherCompositeCanvas(width: number, height: number): HTMLCanvasElement {
  if (!featherCompositeCanvas) {
    featherCompositeCanvas = document.createElement("canvas");
  }
  if (featherCompositeCanvas.width !== width || featherCompositeCanvas.height !== height) {
    featherCompositeCanvas.width = width;
    featherCompositeCanvas.height = height;
  }
  return featherCompositeCanvas;
}

function getCanvasViewportBounds(ctx: CanvasRenderingContext2D): ViewportBounds {
  const pixelRatio = window.devicePixelRatio || 1;
  return {
    width: Math.max(1, ctx.canvas.width / pixelRatio),
    height: Math.max(1, ctx.canvas.height / pixelRatio)
  };
}

function isScreenBoundsVisible(bounds: ScreenBounds, viewport: ViewportBounds): boolean {
  const left = Math.min(bounds.x, bounds.x + bounds.width);
  const right = Math.max(bounds.x, bounds.x + bounds.width);
  const top = Math.min(bounds.y, bounds.y + bounds.height);
  const bottom = Math.max(bounds.y, bounds.y + bounds.height);
  return right >= 0 && bottom >= 0 && left <= viewport.width && top <= viewport.height;
}

function resetFeatherCompositeContext(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, width, height);
}

function drawEnvironmentEffectContent(
  ctx: CanvasRenderingContext2D,
  effect: EnvironmentEffectMask,
  camera: Camera,
  timestamp: number,
  layerOpacity: number,
  tuningOverrides: EnvironmentEffectTuningOverrides
) {
  const drawEffect = ENVIRONMENT_EFFECT_DRAWERS[effect.effect] ?? ENVIRONMENT_EFFECT_DRAWERS.water;
  drawEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides);
}

function applyEnvironmentEffectFeather(
  ctx: CanvasRenderingContext2D,
  effect: EnvironmentEffectMask,
  camera: Camera,
  feather: number,
  path: Path2D,
  screenBounds: { x: number; y: number; width: number; height: number }
) {
  const shortestEdge = Math.max(1, Math.min(Math.abs(screenBounds.width), Math.abs(screenBounds.height)));
  const featherPx = Math.max(10, shortestEdge * (0.06 + feather * 0.34));

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  if (effect.kind === "rectangle") {
    applyRectangleEnvironmentFeather(ctx, screenBounds, featherPx);
  } else if (effect.kind === "circle") {
    applyCircleEnvironmentFeather(ctx, screenBounds, featherPx);
  } else if (effect.kind === "polygon") {
    applyPolygonEnvironmentFeather(ctx, effect, camera, featherPx);
  } else {
    ctx.fillStyle = "#000";
    ctx.fill(path);
  }
  ctx.restore();

  if (effect.kind === "rectangle" || effect.kind === "circle" || effect.kind === "polygon") {
    return;
  }

  ctx.save();
  ctx.clip(path);
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "#000";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const steps = 12;
  for (let step = 0; step < steps; step += 1) {
    const progress = (step + 1) / steps;
    ctx.globalAlpha = Math.pow(progress, 1.45) * 0.09;
    ctx.lineWidth = featherPx * 2 * progress;
    ctx.stroke(path);
  }
  ctx.restore();
}

function applyRectangleEnvironmentFeather(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, featherPx: number) {
  const x = Math.min(bounds.x, bounds.x + bounds.width);
  const y = Math.min(bounds.y, bounds.y + bounds.height);
  const width = Math.abs(bounds.width);
  const height = Math.abs(bounds.height);
  if (width <= 1 || height <= 1) {
    return;
  }

  const feather = Math.min(featherPx, width / 2, height / 2);
  const maskWidth = Math.max(1, Math.ceil(width));
  const maskHeight = Math.max(1, Math.ceil(height));
  const cacheKey = `rect:${maskWidth}:${maskHeight}:${roundMaskValue(feather)}`;
  const mask = getEnvironmentFeatherMask(cacheKey, maskWidth, maskHeight, (pixelX, pixelY) => {
    const distanceToEdge = Math.min(pixelX, maskWidth - pixelX, pixelY, maskHeight - pixelY);
    return getEnvironmentFeatherAlpha(distanceToEdge / feather);
  });
  ctx.drawImage(mask, x, y, width, height);
}

function applyCircleEnvironmentFeather(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, featherPx: number) {
  const radius = Math.max(1, Math.min(Math.abs(bounds.width), Math.abs(bounds.height)) / 2);
  const feather = Math.min(featherPx, radius);
  const size = Math.max(1, Math.ceil(radius * 2));
  const center = size / 2;
  const cacheKey = `circle:${size}:${roundMaskValue(feather)}`;
  const mask = getEnvironmentFeatherMask(cacheKey, size, size, (pixelX, pixelY) => {
    const distanceFromCenter = Math.hypot(pixelX - center, pixelY - center);
    if (distanceFromCenter > radius) {
      return 0;
    }
    return getEnvironmentFeatherAlpha((radius - distanceFromCenter) / feather);
  });
  ctx.drawImage(mask, bounds.x, bounds.y, bounds.width, bounds.height);
}

function applyPolygonEnvironmentFeather(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, featherPx: number) {
  if (effect.points.length < 3) {
    return;
  }
  const screenPoints = effect.points.map((point) => worldToScreenPoint(point, camera));
  const bounds = getPointBounds(screenPoints);
  const maskWidth = Math.max(1, Math.ceil(bounds.width));
  const maskHeight = Math.max(1, Math.ceil(bounds.height));
  const localPoints = screenPoints.map((point) => ({ x: point.x - bounds.x, y: point.y - bounds.y }));
  const cacheKey = `poly:${maskWidth}:${maskHeight}:${roundMaskValue(featherPx)}:${localPoints.map((point) => `${roundMaskValue(point.x)},${roundMaskValue(point.y)}`).join(";")}`;
  const mask = getEnvironmentFeatherMask(cacheKey, maskWidth, maskHeight, (pixelX, pixelY) => {
    const point = { x: pixelX, y: pixelY };
    if (!isPointInPolygon(point, localPoints)) {
      return 0;
    }
    const distanceToEdge = getDistanceToPolygonEdge(point, localPoints);
    return getEnvironmentFeatherAlpha(distanceToEdge / featherPx);
  });
  ctx.drawImage(mask, bounds.x, bounds.y, bounds.width, bounds.height);
}

function getEnvironmentEffectScreenBounds(effect: EnvironmentEffectMask, camera: Camera): ScreenBounds | null {
  const bounds = getEnvironmentEffectBounds(effect);
  return bounds ? worldRectToScreen(bounds, camera) : null;
}

export function drawEnvironmentEffectShape(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, options: { fill: boolean; selected: boolean }) {
  if (options.selected) {
    const bounds = getEnvironmentEffectBounds(effect);
    if (bounds) {
      const screenBounds = worldRectToScreen(bounds, camera);
      drawSelectionBox(ctx, screenBounds, 1, 10);
    }
    return;
  }
  const path = getEnvironmentEffectPath(effect, camera);
  ctx.save();
  if (options.fill) {
    ctx.fillStyle = getEnvironmentEffectPreviewFill(effect.effect);
    ctx.fill(path);
  }
  ctx.strokeStyle = options.selected ? "#facc15" : getEnvironmentEffectStroke(effect.effect);
  ctx.lineWidth = Math.max(2, 2.5 * camera.zoom);
  ctx.setLineDash([Math.max(8, 8 * camera.zoom), Math.max(5, 5 * camera.zoom)]);
  ctx.stroke(path);
  ctx.restore();
}

function getEnvironmentEffectPath(effect: EnvironmentEffectMask, camera: Camera): Path2D {
  const path = new Path2D();
  for (const command of getEnvironmentEffectPathCommands(effect, camera)) {
    if (command.kind === "rect") {
      path.rect(command.x, command.y, command.width, command.height);
    } else if (command.kind === "arc") {
      path.moveTo(command.x + command.radius, command.y);
      path.arc(command.x, command.y, command.radius, 0, Math.PI * 2);
    } else if (command.points.length > 0) {
      path.moveTo(command.points[0].x, command.points[0].y);
      for (const point of command.points.slice(1)) {
        path.lineTo(point.x, point.y);
      }
      path.closePath();
    }
  }
  return path;
}
