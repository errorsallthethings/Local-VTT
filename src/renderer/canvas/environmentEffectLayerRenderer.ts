import type { EnvironmentEffectMask, EnvironmentEffectType } from "../../shared/localvtt";
import { getEnvironmentEffectBounds, getPointBounds } from "./boundsGeometry";
import type { Camera } from "./camera";
import {
  DEFAULT_ACID_EFFECT_TUNING,
  DEFAULT_ARCANE_EFFECT_TUNING,
  DEFAULT_CHAOS_EFFECT_TUNING,
  DEFAULT_COLD_EFFECT_TUNING,
  DEFAULT_DARKNESS_EFFECT_TUNING,
  DEFAULT_DISTORTION_EFFECT_TUNING,
  DEFAULT_FOG_EFFECT_TUNING,
  DEFAULT_FORCE_FIELD_EFFECT_TUNING,
  DEFAULT_FIRE_EFFECT_TUNING,
  DEFAULT_LAVA_EFFECT_TUNING,
  DEFAULT_LIGHTNING_EFFECT_TUNING,
  DEFAULT_NATURE_EFFECT_TUNING,
  DEFAULT_POISON_EFFECT_TUNING,
  DEFAULT_RADIANT_EFFECT_TUNING,
  DEFAULT_SHOCKWAVE_EFFECT_TUNING,
  DEFAULT_SMOKE_EFFECT_TUNING,
  DEFAULT_VOID_EFFECT_TUNING,
  DEFAULT_WATER_EFFECT_TUNING,
  drawEnvironmentAcidEffect,
  drawEnvironmentArcaneEffect,
  drawEnvironmentChaosEffect,
  drawEnvironmentColdEffect,
  drawEnvironmentDarknessEffect,
  drawEnvironmentDistortionEffect,
  drawEnvironmentFogEffect,
  drawEnvironmentForceFieldEffect,
  drawEnvironmentFireEffect,
  drawEnvironmentLavaEffect,
  drawEnvironmentLightningEffect,
  drawEnvironmentNatureEffect,
  drawEnvironmentPoisonEffect,
  drawEnvironmentRadiantEffect,
  drawEnvironmentShockwaveEffect,
  drawEnvironmentSmokeEffect,
  drawEnvironmentVoidEffect,
  drawEnvironmentWaterEffect,
  type AcidEffectTuning,
  type ArcaneEffectTuning,
  type ChaosEffectTuning,
  type ColdEffectTuning,
  type DarknessEffectTuning,
  type DistortionEffectTuning,
  type FogEffectTuning,
  type ForceFieldEffectTuning,
  type FireEffectTuning,
  type LavaEffectTuning,
  type LightningEffectTuning,
  type NatureEffectTuning,
  type PoisonEffectTuning,
  type RadiantEffectTuning,
  type ShockwaveEffectTuning,
  type SmokeEffectTuning,
  type VoidEffectTuning,
  type WaterEffectTuning,
  type ScreenBounds
} from "./environmentEffectsRenderer";
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
import { worldRectToScreen, worldToScreenPoint } from "./viewportGeometry";
import { getEnvironmentEffectPreviewFill, getEnvironmentEffectStroke } from "../lib/environmentEffectOptions";

interface EnvironmentEffectTuningOverrides {
  acidEffectTuning?: AcidEffectTuning;
  coldEffectTuning?: ColdEffectTuning;
  darknessEffectTuning?: DarknessEffectTuning;
  poisonEffectTuning?: PoisonEffectTuning;
  waterEffectTuning?: WaterEffectTuning;
  lavaEffectTuning?: LavaEffectTuning;
  fireEffectTuning?: FireEffectTuning;
  lightningEffectTuning?: LightningEffectTuning;
  arcaneEffectTuning?: ArcaneEffectTuning;
  chaosEffectTuning?: ChaosEffectTuning;
  voidEffectTuning?: VoidEffectTuning;
  natureEffectTuning?: NatureEffectTuning;
  distortionEffectTuning?: DistortionEffectTuning;
  radiantEffectTuning?: RadiantEffectTuning;
  forceFieldEffectTuning?: ForceFieldEffectTuning;
  shockwaveEffectTuning?: ShockwaveEffectTuning;
  smokeEffectTuning?: SmokeEffectTuning;
  fogEffectTuning?: FogEffectTuning;
}

type EnvironmentEffectDrawFn = (
  ctx: CanvasRenderingContext2D,
  effect: EnvironmentEffectMask,
  camera: Camera,
  timestamp: number,
  layerOpacity: number,
  tuningOverrides: EnvironmentEffectTuningOverrides
) => void;

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
  const tuningOverrides: EnvironmentEffectTuningOverrides = {
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
  for (const effect of effects) {
    if (!isEnvironmentEffectVisibleForMode(effect, mode)) {
      continue;
    }
    const feather = getClampedEnvironmentEffectFeather(effect);
    if (feather > 0) {
      drawFeatheredEnvironmentEffect(ctx, effect, camera, timestamp, layerOpacity, feather, tuningOverrides);
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
  tuningOverrides: EnvironmentEffectTuningOverrides
) {
  const width = Math.max(1, Math.round(ctx.canvas.width / (window.devicePixelRatio || 1)));
  const height = Math.max(1, Math.round(ctx.canvas.height / (window.devicePixelRatio || 1)));
  const effectCanvas = document.createElement("canvas");
  effectCanvas.width = width;
  effectCanvas.height = height;
  const effectCtx = effectCanvas.getContext("2d");
  if (!effectCtx) {
    return;
  }

  const path = getEnvironmentEffectPath(effect, camera);
  effectCtx.save();
  effectCtx.clip(path);
  drawEnvironmentEffectContent(effectCtx, effect, camera, timestamp, layerOpacity, tuningOverrides);
  effectCtx.restore();

  applyEnvironmentEffectFeather(effectCtx, effect, camera, feather);
  ctx.drawImage(effectCanvas, 0, 0, width, height);
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

function applyEnvironmentEffectFeather(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, feather: number) {
  const path = getEnvironmentEffectPath(effect, camera);
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
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

function drawWaterEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, waterEffectTuning?: WaterEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.waterTuning ? { ...DEFAULT_WATER_EFFECT_TUNING, ...effect.waterTuning } : waterEffectTuning;
  drawEnvironmentWaterEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawAcidEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, acidEffectTuning?: AcidEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.acidTuning ? { ...DEFAULT_ACID_EFFECT_TUNING, ...effect.acidTuning } : acidEffectTuning;
  drawEnvironmentAcidEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawPoisonEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, poisonEffectTuning?: PoisonEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.poisonTuning ? { ...DEFAULT_POISON_EFFECT_TUNING, ...effect.poisonTuning } : poisonEffectTuning;
  drawEnvironmentPoisonEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawColdEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, coldEffectTuning?: ColdEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.coldTuning ? { ...DEFAULT_COLD_EFFECT_TUNING, ...effect.coldTuning } : coldEffectTuning;
  drawEnvironmentColdEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawDarknessEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, darknessEffectTuning?: DarknessEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.darknessTuning ? { ...DEFAULT_DARKNESS_EFFECT_TUNING, ...effect.darknessTuning } : darknessEffectTuning;
  drawEnvironmentDarknessEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawLavaEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, lavaEffectTuning?: LavaEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.lavaTuning ? { ...DEFAULT_LAVA_EFFECT_TUNING, ...effect.lavaTuning } : lavaEffectTuning;
  drawEnvironmentLavaEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawFireEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, fireEffectTuning?: FireEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.fireTuning ? { ...DEFAULT_FIRE_EFFECT_TUNING, ...effect.fireTuning } : fireEffectTuning;
  drawEnvironmentFireEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawLightningEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, lightningEffectTuning?: LightningEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.lightningTuning ? { ...DEFAULT_LIGHTNING_EFFECT_TUNING, ...effect.lightningTuning } : lightningEffectTuning;
  drawEnvironmentLightningEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawArcaneEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, arcaneEffectTuning?: ArcaneEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.arcaneTuning ? { ...DEFAULT_ARCANE_EFFECT_TUNING, ...effect.arcaneTuning } : arcaneEffectTuning;
  drawEnvironmentArcaneEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawChaosEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, chaosEffectTuning?: ChaosEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.chaosTuning ? { ...DEFAULT_CHAOS_EFFECT_TUNING, ...effect.chaosTuning } : chaosEffectTuning;
  drawEnvironmentChaosEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawVoidEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, voidEffectTuning?: VoidEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.voidTuning ? { ...DEFAULT_VOID_EFFECT_TUNING, ...effect.voidTuning } : voidEffectTuning;
  drawEnvironmentVoidEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawNatureEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, natureEffectTuning?: NatureEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.natureTuning ? { ...DEFAULT_NATURE_EFFECT_TUNING, ...effect.natureTuning } : natureEffectTuning;
  drawEnvironmentNatureEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawDistortionEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, distortionEffectTuning?: DistortionEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.distortionTuning ? { ...DEFAULT_DISTORTION_EFFECT_TUNING, ...effect.distortionTuning } : distortionEffectTuning;
  drawEnvironmentDistortionEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawRadiantEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, radiantEffectTuning?: RadiantEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.radiantTuning ? { ...DEFAULT_RADIANT_EFFECT_TUNING, ...effect.radiantTuning } : radiantEffectTuning;
  drawEnvironmentRadiantEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawForceFieldEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, forceFieldEffectTuning?: ForceFieldEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.fieldTuning ? { ...DEFAULT_FORCE_FIELD_EFFECT_TUNING, ...effect.fieldTuning } : forceFieldEffectTuning;
  drawEnvironmentForceFieldEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawShockwaveEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, shockwaveEffectTuning?: ShockwaveEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.shockwaveTuning ? { ...DEFAULT_SHOCKWAVE_EFFECT_TUNING, ...effect.shockwaveTuning } : shockwaveEffectTuning;
  drawEnvironmentShockwaveEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawSmokeEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, smokeEffectTuning?: SmokeEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.smokeTuning ? { ...DEFAULT_SMOKE_EFFECT_TUNING, ...effect.smokeTuning } : smokeEffectTuning;
  drawEnvironmentSmokeEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawFogMistEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, fogEffectTuning?: FogEffectTuning) {
  const screenBounds = getEnvironmentEffectScreenBounds(effect, camera);
  if (!screenBounds) {
    return;
  }
  const tuning = effect.fogTuning ? { ...DEFAULT_FOG_EFFECT_TUNING, ...effect.fogTuning } : fogEffectTuning;
  drawEnvironmentFogEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function getEnvironmentEffectScreenBounds(effect: EnvironmentEffectMask, camera: Camera): ScreenBounds | null {
  const bounds = getEnvironmentEffectBounds(effect);
  return bounds ? worldRectToScreen(bounds, camera) : null;
}

const ENVIRONMENT_EFFECT_DRAWERS: Record<EnvironmentEffectType, EnvironmentEffectDrawFn> = {
  acid: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawAcidEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.acidEffectTuning),
  arcane: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawArcaneEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.arcaneEffectTuning),
  chaos: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawChaosEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.chaosEffectTuning),
  cold: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawColdEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.coldEffectTuning),
  darkness: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawDarknessEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.darknessEffectTuning),
  distortion: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawDistortionEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.distortionEffectTuning),
  electric: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawLightningEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.lightningEffectTuning),
  field: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawForceFieldEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.forceFieldEffectTuning),
  fire: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawFireEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.fireEffectTuning),
  fog: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawFogMistEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.fogEffectTuning),
  lava: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawLavaEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.lavaEffectTuning),
  nature: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawNatureEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.natureEffectTuning),
  poison: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawPoisonEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.poisonEffectTuning),
  radiant: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawRadiantEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.radiantEffectTuning),
  shockwave: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawShockwaveEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.shockwaveEffectTuning),
  smoke: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawSmokeEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.smokeEffectTuning),
  void: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawVoidEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.voidEffectTuning),
  water: (ctx, effect, camera, timestamp, layerOpacity, tuningOverrides) => drawWaterEffect(ctx, effect, camera, timestamp, layerOpacity, tuningOverrides.waterEffectTuning)
};

export function drawEnvironmentEffectShape(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, options: { fill: boolean; selected: boolean }) {
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
