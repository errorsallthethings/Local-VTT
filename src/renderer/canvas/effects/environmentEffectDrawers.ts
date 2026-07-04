import type { EnvironmentEffectMask, EnvironmentEffectType } from "../../../shared/localvtt";
import type { Camera } from "../core/camera";
import { worldRectToScreen } from "../core/viewportGeometry";
import { getEnvironmentEffectBounds } from "../scene/boundsGeometry";
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
  drawEnvironmentAcidEffect,
  drawEnvironmentArcaneEffect,
  drawEnvironmentChaosEffect,
  drawEnvironmentColdEffect,
  drawEnvironmentDarknessEffect,
  drawEnvironmentDistortionEffect,
  drawEnvironmentForceFieldEffect,
  drawEnvironmentFireEffect,
  drawEnvironmentLavaEffect,
  drawEnvironmentLightningEffect,
  drawEnvironmentNatureEffect,
  drawEnvironmentPoisonEffect,
  drawEnvironmentRadiantEffect,
  drawEnvironmentShockwaveEffect,
  drawEnvironmentVoidEffect,
  drawEnvironmentWaterEffect
} from "./environmentEffectsRenderer";
import { drawEnvironmentFogEffect, drawEnvironmentSmokeEffect } from "./environmentSmokeFogEffects";
import type { ScreenBounds } from "./environmentEffectRendererMath";

export interface EnvironmentEffectTuningOverrides {
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

export type EnvironmentEffectDrawFn = (
  ctx: CanvasRenderingContext2D,
  effect: EnvironmentEffectMask,
  camera: Camera,
  timestamp: number,
  layerOpacity: number,
  tuningOverrides: EnvironmentEffectTuningOverrides
) => void;

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

export const ENVIRONMENT_EFFECT_DRAWERS: Record<EnvironmentEffectType, EnvironmentEffectDrawFn> = {
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

export function getRegisteredEnvironmentEffectDrawers(): EnvironmentEffectType[] {
  return Object.keys(ENVIRONMENT_EFFECT_DRAWERS).sort() as EnvironmentEffectType[];
}
