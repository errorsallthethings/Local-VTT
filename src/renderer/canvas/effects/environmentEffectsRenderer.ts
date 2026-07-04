import * as THREE from "three";
import {
  DEFAULT_ACID_EFFECT_TUNING,
  DEFAULT_ARCANE_EFFECT_TUNING,
  DEFAULT_CHAOS_EFFECT_TUNING,
  DEFAULT_COLD_EFFECT_TUNING,
  DEFAULT_DARKNESS_EFFECT_TUNING,
  DEFAULT_DISTORTION_EFFECT_TUNING,
  DEFAULT_FORCE_FIELD_EFFECT_TUNING,
  DEFAULT_NATURE_EFFECT_TUNING,
  DEFAULT_POISON_EFFECT_TUNING,
  DEFAULT_RADIANT_EFFECT_TUNING,
  DEFAULT_SHOCKWAVE_EFFECT_TUNING,
  DEFAULT_VOID_EFFECT_TUNING,
  DEFAULT_WATER_EFFECT_TUNING,
  type AcidEffectTuning,
  type ArcaneEffectTuning,
  type ChaosEffectTuning,
  type ColdEffectTuning,
  type DarknessEffectTuning,
  type DistortionEffectTuning,
  type ForceFieldEffectTuning,
  type NatureEffectTuning,
  type PoisonEffectTuning,
  type RadiantEffectTuning,
  type ShockwaveEffectTuning,
  type VoidEffectTuning,
  type WaterEffectTuning
} from "./environmentEffectTuningDefaults";
import {
  drawAcidFallback,
  drawArcaneFallback,
  drawChaosFallback,
  drawColdFallback,
  drawDarknessFallback,
  drawDistortionFallback,
  drawForceFieldFallback,
  drawNatureFallback,
  drawPoisonFallback,
  drawRadiantFallback,
  drawShockwaveFallback,
  drawVoidFallback,
  drawWaterFallback
} from "./environmentEffectFallbacks";
import { degreesToRadians, type ScreenBounds } from "./environmentEffectRendererMath";
import { disposeElementalEffectRuntimes } from "./environmentElementalEffects";
import { disposeSmokeFogEffectRuntimes } from "./environmentSmokeFogEffects";
import {
  disposeEnvironmentEffectRuntime,
  disposeSharedEnvironmentEffectRuntimeResources,
  getSharedEffectPlaneGeometry,
  getSharedEnvironmentEffectRenderer,
  positionEnvironmentEffectMesh,
  updateEnvironmentEffectCameraUniforms,
  type EnvironmentEffectRuntime
} from "./environmentEffectRuntime";

export {
  FIRE_EFFECT_PRESETS,
  LAVA_EFFECT_PRESETS,
  LIGHTNING_EFFECT_PRESETS,
  drawEnvironmentFireEffect,
  drawEnvironmentLavaEffect,
  drawEnvironmentLightningEffect
} from "./environmentElementalEffects";

export {
  FOG_EFFECT_PRESETS,
  SMOKE_EFFECT_PRESETS,
  drawEnvironmentFogEffect,
  drawEnvironmentSmokeEffect
} from "./environmentSmokeFogEffects";

export const WATER_EFFECT_PRESETS = {
  stream: {
    opacity: 0.92,
    bandScale: 6.6,
    bandWidth: 0.07,
    speed: 1.06,
    directionDegrees: 272,
    distortion: 0.03,
    verticalDistortion: 0.08,
    distortionVariation: 0.9,
    bandBreakup: 1,
    bandVariation: 1.35,
    bandOverlap: 0.42,
    panFollow: 1,
    zoomScale: -1,
    baseAlpha: 0.14,
    highlightAlpha: 0.44,
    deepColor: "#002e4d",
    waterColor: "#008cb8",
    highlightColor: "#ffffff"
  },
  river: {
    opacity: 0.59,
    bandScale: 14.2,
    bandWidth: 0.49,
    speed: 1.33,
    directionDegrees: 272,
    distortion: 0.11,
    verticalDistortion: 0.03,
    distortionVariation: 0.68,
    bandBreakup: 0.93,
    bandVariation: 4,
    bandOverlap: 0,
    panFollow: 1,
    zoomScale: -1,
    baseAlpha: 0.26,
    highlightAlpha: 0,
    deepColor: "#004d1a",
    waterColor: "#006280",
    highlightColor: "#c3f2fe"
  }
} as const satisfies Record<string, WaterEffectTuning>;

export const ACID_EFFECT_PRESETS = {
  acidPool: { ...DEFAULT_ACID_EFFECT_TUNING },
  causticSludge: {
    opacity: 0.9,
    acidScale: 7.8,
    speed: 0.12,
    directionDegrees: 282,
    corrosion: 0.92,
    bubbleDensity: 0.36,
    bubbleSize: 0.72,
    streakDensity: 0.76,
    streakWarp: 0.88,
    foam: 0.36,
    glow: 0.42,
    panFollow: 1,
    zoomScale: 0.2,
    baseAlpha: 0.38,
    darkColor: "#172c08",
    acidColor: "#65a30d",
    foamColor: "#d9f99d"
  },
  bubblingAcid: {
    opacity: 0.86,
    acidScale: 4.4,
    speed: 0.38,
    directionDegrees: 260,
    corrosion: 0.62,
    bubbleDensity: 0.92,
    bubbleSize: 0.84,
    streakDensity: 0.28,
    streakWarp: 0.64,
    foam: 0.86,
    glow: 0.78,
    panFollow: 1,
    zoomScale: -0.1,
    baseAlpha: 0.2,
    darkColor: "#052e16",
    acidColor: "#a3e635",
    foamColor: "#f7fee7"
  }
} as const satisfies Record<string, AcidEffectTuning>;

export const POISON_EFFECT_PRESETS = {
  poisonCloud: { ...DEFAULT_POISON_EFFECT_TUNING },
  toxicFog: {
    opacity: 0.78,
    cloudScale: 6.2,
    speed: 0.08,
    directionDegrees: 284,
    turbulence: 0.92,
    density: 0.82,
    pocketDensity: 0.42,
    pocketSize: 0.72,
    softness: 0.92,
    drift: 0.72,
    glow: 0.28,
    panFollow: 1,
    zoomScale: 0.1,
    baseAlpha: 0.34,
    shadowColor: "#10250b",
    poisonColor: "#4d7c0f",
    highlightColor: "#bef264"
  },
  sicklyMiasma: {
    opacity: 0.68,
    cloudScale: 3.8,
    speed: 0.18,
    directionDegrees: 262,
    turbulence: 1.2,
    density: 0.58,
    pocketDensity: 0.86,
    pocketSize: 0.5,
    softness: 0.74,
    drift: 0.88,
    glow: 0.72,
    panFollow: 1,
    zoomScale: -0.15,
    baseAlpha: 0.2,
    shadowColor: "#052e16",
    poisonColor: "#84cc16",
    highlightColor: "#ecfccb"
  }
} as const satisfies Record<string, PoisonEffectTuning>;

export const COLD_EFFECT_PRESETS = {
  frostField: { ...DEFAULT_COLD_EFFECT_TUNING },
  iceCrystals: {
    opacity: 0.78,
    frostScale: 4.2,
    speed: 0.05,
    directionDegrees: 292,
    veinDensity: 0.72,
    veinWidth: 0.36,
    crystalDensity: 0.92,
    crystalSize: 0.78,
    haze: 0.18,
    shimmer: 0.72,
    glow: 0.66,
    panFollow: 1,
    zoomScale: -0.1,
    baseAlpha: 0.14,
    shadowColor: "#0b1f33",
    frostColor: "#93c5fd",
    highlightColor: "#ffffff"
  },
  freezingHaze: {
    opacity: 0.68,
    frostScale: 7.6,
    speed: 0.12,
    directionDegrees: 278,
    veinDensity: 0.34,
    veinWidth: 0.28,
    crystalDensity: 0.36,
    crystalSize: 0.52,
    haze: 0.86,
    shimmer: 0.4,
    glow: 0.36,
    panFollow: 1,
    zoomScale: 0.1,
    baseAlpha: 0.28,
    shadowColor: "#13293d",
    frostColor: "#bfdbfe",
    highlightColor: "#eff6ff"
  }
} as const satisfies Record<string, ColdEffectTuning>;

export const DARKNESS_EFFECT_PRESETS = {
  shadowPool: { ...DEFAULT_DARKNESS_EFFECT_TUNING },
  creepingDarkness: {
    opacity: 0.88,
    darknessScale: 7.4,
    speed: 0.08,
    directionDegrees: 266,
    depth: 0.86,
    tendrilDensity: 0.78,
    tendrilReach: 0.82,
    edgeSoftness: 0.9,
    wispDensity: 0.54,
    drift: 0.72,
    voidHighlight: 0.18,
    panFollow: 1,
    zoomScale: 0.15,
    baseAlpha: 0.4,
    shadowColor: "#111827",
    voidColor: "#01030a",
    highlightColor: "#4f46e5"
  },
  voidShroud: {
    opacity: 0.94,
    darknessScale: 3.8,
    speed: 0.16,
    directionDegrees: 288,
    depth: 1,
    tendrilDensity: 0.46,
    tendrilReach: 0.58,
    edgeSoftness: 0.62,
    wispDensity: 0.3,
    drift: 0.48,
    voidHighlight: 0.38,
    panFollow: 1,
    zoomScale: -0.1,
    baseAlpha: 0.48,
    shadowColor: "#0f172a",
    voidColor: "#000000",
    highlightColor: "#7c3aed"
  }
} as const satisfies Record<string, DarknessEffectTuning>;

export const ARCANE_EFFECT_PRESETS = {
  sigilField: { ...DEFAULT_ARCANE_EFFECT_TUNING },
  ritualCircle: {
    opacity: 0.88,
    glyphScale: 3.4,
    speed: 0.18,
    rotationSpeed: 0.55,
    glyphDensity: 0.42,
    ringDensity: 0.92,
    circleScale: 8.8,
    spokeAmount: 0.78,
    pulse: 0.86,
    drift: 0.12,
    glow: 0.9,
    lineWidth: 0.5,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.24,
    backgroundColor: "#12041d",
    glyphColor: "#a78bfa",
    glowColor: "#f0abfc"
  },
  wardingRunes: {
    opacity: 0.78,
    glyphScale: 6.2,
    speed: 0.12,
    rotationSpeed: -0.18,
    glyphDensity: 0.88,
    ringDensity: 0.34,
    circleScale: 4.4,
    spokeAmount: 0.32,
    pulse: 0.5,
    drift: 0.46,
    glow: 0.62,
    lineWidth: 0.38,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.16,
    backgroundColor: "#0b1026",
    glyphColor: "#67e8f9",
    glowColor: "#ddd6fe"
  }
} as const satisfies Record<string, ArcaneEffectTuning>;

export const CHAOS_EFFECT_PRESETS = {
  wildSurge: { ...DEFAULT_CHAOS_EFFECT_TUNING },
  prismaticRift: {
    opacity: 0.86,
    chaosScale: 4.2,
    speed: 0.52,
    directionDegrees: 245,
    riftDensity: 0.78,
    riftWarp: 0.88,
    moteDensity: 0.42,
    moteSize: 1.9,
    colorShift: 0.92,
    pulse: 0.74,
    glow: 0.88,
    instability: 0.86,
    panFollow: 1,
    zoomScale: 1,
    baseAlpha: 0.18,
    backgroundColor: "#150720",
    riftColor: "#f472b6",
    moteColor: "#22d3ee",
    accentColor: "#facc15"
  },
  chaosMotes: {
    opacity: 0.76,
    chaosScale: 0.5,
    speed: 0.28,
    directionDegrees: 286,
    riftDensity: 0.24,
    riftWarp: 0.54,
    moteDensity: 0.92,
    moteSize: 3.4,
    colorShift: 0.85,
    pulse: 0.58,
    glow: 0.7,
    instability: 0.62,
    panFollow: 1,
    zoomScale: -0.5,
    baseAlpha: 0.12,
    backgroundColor: "#08111f",
    riftColor: "#a78bfa",
    moteColor: "#67e8f9",
    accentColor: "#fb7185"
  }
} as const satisfies Record<string, ChaosEffectTuning>;

export const VOID_EFFECT_PRESETS = {
  creepingVoid: { ...DEFAULT_VOID_EFFECT_TUNING },
  graspingTendrils: {
    opacity: 0.98,
    tendrilScale: 3.2,
    speed: 0.34,
    directionDegrees: 252,
    tendrilDensity: 0.88,
    tendrilWidth: 0.72,
    curl: 0.9,
    reach: 0.86,
    voidDepth: 0.82,
    moteDensity: 0.18,
    moteSize: 2.1,
    pulse: 0.62,
    glow: 0.96,
    instability: 0.78,
    panFollow: 1,
    zoomScale: 0.85,
    baseAlpha: 0.32,
    backgroundColor: "#04020a",
    tendrilColor: "#c4b5fd",
    voidColor: "#010108",
    accentColor: "#f5d0fe"
  },
  abyssalBloom: {
    opacity: 0.86,
    tendrilScale: 6.4,
    speed: 0.16,
    directionDegrees: 286,
    tendrilDensity: 0.58,
    tendrilWidth: 0.46,
    curl: 0.56,
    reach: 0.52,
    voidDepth: 0.92,
    moteDensity: 0.54,
    moteSize: 3.2,
    pulse: 0.44,
    glow: 0.7,
    instability: 0.5,
    panFollow: 1,
    zoomScale: 0.35,
    baseAlpha: 0.42,
    backgroundColor: "#020617",
    tendrilColor: "#8b5cf6",
    voidColor: "#000000",
    accentColor: "#67e8f9"
  }
} as const satisfies Record<string, VoidEffectTuning>;

export const NATURE_EFFECT_PRESETS = {
  overgrowth: {
    opacity: 0.43,
    vineScale: 12,
    speed: 0.16,
    directionDegrees: 258,
    vineDensity: 1,
    vineWidth: 1,
    vineBrightness: 1.42,
    curl: 0.53,
    thornDensity: 0.68,
    thornSize: 0.78,
    thornBrightness: 1.65,
    thornIrregularity: 0.82,
    leafDensity: 1,
    leafSize: 1,
    leafSharpness: 1,
    growth: 0.62,
    glow: 0.22,
    instability: 0.87,
    panFollow: 1,
    zoomScale: 1.7,
    baseAlpha: 0.34,
    soilColor: "#10200c",
    vineColor: "#22c55e",
    leafColor: "#bef264",
    thornColor: "#d97706"
  },
  thornField: {
    opacity: 0.96,
    vineScale: 0.7,
    speed: 0.12,
    directionDegrees: 246,
    vineDensity: 1,
    vineWidth: 1,
    vineBrightness: 2,
    curl: 0.44,
    thornDensity: 0.36,
    thornSize: 1,
    thornBrightness: 3,
    thornIrregularity: 0.92,
    leafDensity: 0.96,
    leafSize: 0.27,
    leafSharpness: 0,
    growth: 0.73,
    glow: 0.2,
    instability: 1,
    panFollow: 1,
    zoomScale: 0.15,
    baseAlpha: 0.32,
    soilColor: "#1c1207",
    vineColor: "#4d7c0f",
    leafColor: "#a3e635",
    thornColor: "#d97706"
  },
  entanglingVines: {
    opacity: 0.3,
    vineScale: 8.5,
    speed: 0.22,
    directionDegrees: 276,
    vineDensity: 1,
    vineWidth: 1,
    vineBrightness: 1.62,
    curl: 0.92,
    thornDensity: 0.43,
    thornSize: 0.72,
    thornBrightness: 1.55,
    thornIrregularity: 0.93,
    leafDensity: 1,
    leafSize: 0.86,
    leafSharpness: 1,
    growth: 0.88,
    glow: 0.83,
    instability: 0.86,
    panFollow: 1,
    zoomScale: 1.3,
    baseAlpha: 0.34,
    soilColor: "#052e16",
    vineColor: "#22c55e",
    leafColor: "#bef264",
    thornColor: "#b45309"
  }
} as const satisfies Record<string, NatureEffectTuning>;

export const RADIANT_EFFECT_PRESETS = {
  holyLight: {
    opacity: 0.78,
    rayScale: 16.2,
    speed: 1.18,
    directionDegrees: 270,
    rayDensity: 0.8,
    rayBreakup: 0,
    raySpread: 0.19,
    rayDistance: 0.44,
    moteDensity: 0.58,
    moteSize: 4.05,
    shimmer: 0.93,
    bloom: 0.97,
    streakWidth: 5,
    pulse: 0.26,
    panFollow: 1,
    zoomScale: -0.85,
    baseAlpha: 0.29,
    backgroundColor: "#1c1607",
    rayColor: "#fde68a",
    coreColor: "#fffdf4"
  },
  divineRays: {
    opacity: 1,
    rayScale: 1.9,
    speed: 0.26,
    directionDegrees: 228,
    rayDensity: 0.62,
    rayBreakup: 0,
    raySpread: 0.31,
    rayDistance: 0.51,
    moteDensity: 0.34,
    moteSize: 2.9,
    shimmer: 1,
    bloom: 1,
    streakWidth: 5,
    pulse: 1,
    panFollow: 1,
    zoomScale: -0.1,
    baseAlpha: 0.48,
    backgroundColor: "#241a05",
    rayColor: "#facc15",
    coreColor: "#fff7d6"
  },
  starfall: {
    opacity: 0.73,
    rayScale: 2.5,
    speed: 0.56,
    directionDegrees: 254,
    rayDensity: 0.14,
    rayBreakup: 1,
    raySpread: 0.72,
    rayDistance: 0.38,
    moteDensity: 0.88,
    moteSize: 2.15,
    shimmer: 1,
    bloom: 0.96,
    streakWidth: 2.85,
    pulse: 0.99,
    panFollow: 1,
    zoomScale: -0.4,
    baseAlpha: 0.3,
    backgroundColor: "#111827",
    rayColor: "#fde68a",
    coreColor: "#ffffff"
  }
} as const satisfies Record<string, RadiantEffectTuning>;

export const FORCE_FIELD_EFFECT_PRESETS = {
  shieldField: {
    opacity: 0.78,
    fieldScale: 5.4,
    speed: 0.22,
    directionDegrees: 269,
    gridDensity: 0,
    gridWarp: 0.64,
    rippleStrength: 0.55,
    rippleFrequency: 0.56,
    edgeStrength: 0.78,
    pulse: 0.48,
    glow: 0.52,
    refraction: 0.54,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.2,
    backgroundColor: "#03131f",
    gridColor: "#67e8f9",
    edgeColor: "#d8b4fe"
  },
  magicField: {
    opacity: 0.82,
    fieldScale: 4.2,
    speed: 0.18,
    directionDegrees: 286,
    gridDensity: 0.08,
    gridWarp: 0.68,
    rippleStrength: 0.42,
    rippleFrequency: 0.72,
    edgeStrength: 0.86,
    pulse: 0.72,
    glow: 0.82,
    refraction: 0.62,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.18,
    backgroundColor: "#12051f",
    gridColor: "#c084fc",
    edgeColor: "#67e8f9"
  },
  warpField: {
    opacity: 0.74,
    fieldScale: 6.8,
    speed: 0.32,
    directionDegrees: 248,
    gridDensity: 0.09,
    gridWarp: 0.92,
    rippleStrength: 0.88,
    rippleFrequency: 0.46,
    edgeStrength: 0.64,
    pulse: 0.38,
    glow: 0.58,
    refraction: 0.9,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.24,
    backgroundColor: "#04111d",
    gridColor: "#22d3ee",
    edgeColor: "#f0abfc"
  }
} as const satisfies Record<string, ForceFieldEffectTuning>;

export const SHOCKWAVE_EFFECT_PRESETS = {
  impactPulse: { ...DEFAULT_SHOCKWAVE_EFFECT_TUNING },
  rippleZone: {
    opacity: 0.68,
    ringScale: 9.4,
    speed: 0.28,
    directionDegrees: 270,
    ringCount: 0.72,
    ringWidth: 0.34,
    ringSharpness: 0.48,
    distortion: 0.36,
    turbulence: 0.58,
    centerStrength: 0.28,
    fade: 0.72,
    pulse: 0.32,
    glow: 0.42,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.1,
    backgroundColor: "#08111f",
    ringColor: "#7dd3fc",
    coreColor: "#e0f2fe"
  },
  solarRipples: {
    opacity: 0.74,
    ringScale: 7.2,
    speed: 0.36,
    directionDegrees: 250,
    ringCount: 0.64,
    ringWidth: 0.46,
    ringSharpness: 0.54,
    distortion: 0.28,
    turbulence: 0.44,
    centerStrength: 0.62,
    fade: 0.5,
    pulse: 0.72,
    glow: 0.82,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.16,
    backgroundColor: "#241005",
    ringColor: "#f97316",
    coreColor: "#fff7ad"
  }
} as const satisfies Record<string, ShockwaveEffectTuning>;

export const DISTORTION_EFFECT_PRESETS = {
  heatHaze: {
    opacity: 0.58,
    distortionScale: 7.6,
    speed: 0.18,
    directionDegrees: 270,
    distortionStrength: 0.42,
    rippleStrength: 0.34,
    rippleFrequency: 0.48,
    shimmer: 0.82,
    turbulence: 0.74,
    causticStrength: 0.22,
    edgeStrength: 0.18,
    pulse: 0.12,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.04,
    backgroundColor: "#1f1306",
    distortionColor: "#fbbf24",
    highlightColor: "#fff7ad"
  },
  planarDistortion: { ...DEFAULT_DISTORTION_EFFECT_TUNING },
  realityWarp: {
    opacity: 0.78,
    distortionScale: 4.4,
    speed: 0.36,
    directionDegrees: 245,
    distortionStrength: 0.86,
    rippleStrength: 0.72,
    rippleFrequency: 0.38,
    shimmer: 0.58,
    turbulence: 0.92,
    causticStrength: 0.66,
    edgeStrength: 0.64,
    pulse: 0.56,
    panFollow: 1,
    zoomScale: 0,
    baseAlpha: 0.16,
    backgroundColor: "#16051f",
    distortionColor: "#c084fc",
    highlightColor: "#67e8f9"
  }
} as const satisfies Record<string, DistortionEffectTuning>;

let waterRuntime: EnvironmentEffectRuntime | null = null;
let acidRuntime: EnvironmentEffectRuntime | null = null;
let coldRuntime: EnvironmentEffectRuntime | null = null;
let darknessRuntime: EnvironmentEffectRuntime | null = null;
let poisonRuntime: EnvironmentEffectRuntime | null = null;
let arcaneRuntime: EnvironmentEffectRuntime | null = null;
let chaosRuntime: EnvironmentEffectRuntime | null = null;
let voidRuntime: EnvironmentEffectRuntime | null = null;
let natureRuntime: EnvironmentEffectRuntime | null = null;
let radiantRuntime: EnvironmentEffectRuntime | null = null;
let forceFieldRuntime: EnvironmentEffectRuntime | null = null;
let shockwaveRuntime: EnvironmentEffectRuntime | null = null;
let distortionRuntime: EnvironmentEffectRuntime | null = null;
let environmentEffectRendererUsers = 0;

export function retainEnvironmentEffectRuntimes(): () => void {
  environmentEffectRendererUsers += 1;
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    environmentEffectRendererUsers = Math.max(0, environmentEffectRendererUsers - 1);
    if (environmentEffectRendererUsers === 0) {
      disposeEnvironmentEffectRuntimes();
    }
  };
}

export function disposeEnvironmentEffectRuntimes() {
  environmentEffectRendererUsers = 0;

  for (const runtime of [
    waterRuntime,
    acidRuntime,
    coldRuntime,
    darknessRuntime,
    poisonRuntime,
    arcaneRuntime,
    chaosRuntime,
    voidRuntime,
    natureRuntime,
    radiantRuntime,
    forceFieldRuntime,
    shockwaveRuntime,
    distortionRuntime,
  ]) {
    disposeEnvironmentEffectRuntime(runtime);
  }

  waterRuntime = null;
  acidRuntime = null;
  coldRuntime = null;
  darknessRuntime = null;
  poisonRuntime = null;
  arcaneRuntime = null;
  chaosRuntime = null;
  voidRuntime = null;
  natureRuntime = null;
  radiantRuntime = null;
  forceFieldRuntime = null;
  shockwaveRuntime = null;
  distortionRuntime = null;

  disposeSmokeFogEffectRuntimes();
  disposeElementalEffectRuntimes();
  disposeSharedEnvironmentEffectRuntimeResources();
}

export function drawEnvironmentWaterEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: WaterEffectTuning = DEFAULT_WATER_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getEnvironmentEffectRuntime(width, height);
  if (!runtime) {
    drawWaterFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = 0;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.82 + 19.7;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateWaterMaterialTuning(runtime.meshA.material, tuning);
  updateWaterMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentAcidEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: AcidEffectTuning = DEFAULT_ACID_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getAcidRuntime(width, height);
  if (!runtime) {
    drawAcidFallback(ctx, bounds, layerOpacity);
    return;
  }

  drawAcidFallback(ctx, bounds, layerOpacity * 0.45);

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.28;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.71 + 13.6;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateAcidMaterialTuning(runtime.meshA.material, tuning);
  updateAcidMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentPoisonEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: PoisonEffectTuning = DEFAULT_POISON_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getPoisonRuntime(width, height);
  if (!runtime) {
    drawPoisonFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.34;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.63 + 18.1;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updatePoisonMaterialTuning(runtime.meshA.material, tuning);
  updatePoisonMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentColdEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: ColdEffectTuning = DEFAULT_COLD_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getColdRuntime(width, height);
  if (!runtime) {
    drawColdFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.3;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.58 + 22.4;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateColdMaterialTuning(runtime.meshA.material, tuning);
  updateColdMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentDarknessEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: DarknessEffectTuning = DEFAULT_DARKNESS_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getDarknessRuntime(width, height);
  if (!runtime) {
    drawDarknessFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.42;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.55 + 14.7;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateDarknessMaterialTuning(runtime.meshA.material, tuning);
  updateDarknessMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentArcaneEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: ArcaneEffectTuning = DEFAULT_ARCANE_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getArcaneRuntime(width, height);
  if (!runtime) {
    drawArcaneFallback(ctx, bounds, layerOpacity);
    return;
  }

  drawArcaneFallback(ctx, bounds, layerOpacity * 0.45);

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.42;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.73 + 21.5;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateArcaneMaterialTuning(runtime.meshA.material, tuning);
  updateArcaneMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentChaosEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: ChaosEffectTuning = DEFAULT_CHAOS_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getChaosRuntime(width, height);
  if (!runtime) {
    drawChaosFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.34;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.59 + 29.4;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateChaosMaterialTuning(runtime.meshA.material, tuning);
  updateChaosMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentVoidEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: VoidEffectTuning = DEFAULT_VOID_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getVoidRuntime(width, height);
  if (!runtime) {
    drawVoidFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.42;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.67 + 31.2;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateVoidMaterialTuning(runtime.meshA.material, tuning);
  updateVoidMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentNatureEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: NatureEffectTuning = DEFAULT_NATURE_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getNatureRuntime(width, height);
  if (!runtime) {
    drawNatureFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.38;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.64 + 15.7;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateNatureMaterialTuning(runtime.meshA.material, tuning);
  updateNatureMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentRadiantEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: RadiantEffectTuning = DEFAULT_RADIANT_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getRadiantRuntime(width, height);
  if (!runtime) {
    drawRadiantFallback(ctx, bounds, layerOpacity);
    return;
  }

  drawRadiantFallback(ctx, bounds, layerOpacity * 0.26);

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.36;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.57 + 19.3;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateRadiantMaterialTuning(runtime.meshA.material, tuning);
  updateRadiantMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentForceFieldEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: ForceFieldEffectTuning = DEFAULT_FORCE_FIELD_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getForceFieldRuntime(width, height);
  if (!runtime) {
    drawForceFieldFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.42;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.67 + 13.7;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateForceFieldMaterialTuning(runtime.meshA.material, tuning);
  updateForceFieldMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentShockwaveEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: ShockwaveEffectTuning = DEFAULT_SHOCKWAVE_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getShockwaveRuntime(width, height);
  if (!runtime) {
    drawShockwaveFallback(ctx, bounds, layerOpacity);
    return;
  }

  drawShockwaveFallback(ctx, bounds, layerOpacity * 0.28);

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.36;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.53 + 11.2;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateShockwaveMaterialTuning(runtime.meshA.material, tuning);
  updateShockwaveMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

export function drawEnvironmentDistortionEffect(
  ctx: CanvasRenderingContext2D,
  bounds: ScreenBounds,
  timestamp: number,
  layerOpacity: number,
  cameraState: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 },
  tuning: DistortionEffectTuning = DEFAULT_DISTORTION_EFFECT_TUNING
) {
  if (bounds.width <= 1 || bounds.height <= 1 || layerOpacity <= 0) {
    return;
  }

  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;
  const runtime = getDistortionRuntime(width, height);
  if (!runtime) {
    drawDistortionFallback(ctx, bounds, layerOpacity);
    return;
  }

  const time = (timestamp - runtime.startedAt) / 1000;
  positionEnvironmentEffectMesh(runtime.meshA, width, height, 1);
  positionEnvironmentEffectMesh(runtime.meshB, width, height, 1);
  runtime.meshA.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity;
  runtime.meshB.material.uniforms.opacity.value = Math.max(0, Math.min(1, layerOpacity)) * tuning.opacity * 0.34;
  runtime.meshA.material.uniforms.time.value = time;
  runtime.meshB.material.uniforms.time.value = time * 0.61 + 23.4;
  runtime.meshA.material.uniforms.resolution.value.set(width, height);
  runtime.meshB.material.uniforms.resolution.value.set(width, height);
  updateEnvironmentEffectCameraUniforms(runtime.meshA.material, bounds, cameraState);
  updateEnvironmentEffectCameraUniforms(runtime.meshB.material, bounds, cameraState);
  updateDistortionMaterialTuning(runtime.meshA.material, tuning);
  updateDistortionMaterialTuning(runtime.meshB.material, tuning);

  runtime.renderer.setSize(width, height, false);
  runtime.renderer.setClearColor(0x000000, 0);
  runtime.renderer.clear();
  runtime.renderer.render(runtime.scene, runtime.camera);

  ctx.save();
  ctx.drawImage(runtime.renderer.domElement, 0, 0, width, height);
  ctx.restore();
}

function getEnvironmentEffectRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!waterRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createWaterMaterial(0.68);
    const materialB = createWaterMaterial(0.38);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    waterRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (waterRuntime.width !== width || waterRuntime.height !== height) {
    waterRuntime.width = width;
    waterRuntime.height = height;
    waterRuntime.camera.left = 0;
    waterRuntime.camera.right = width;
    waterRuntime.camera.top = 0;
    waterRuntime.camera.bottom = height;
    waterRuntime.camera.near = 0.1;
    waterRuntime.camera.far = 5000;
    waterRuntime.camera.updateProjectionMatrix();
  }

  return waterRuntime;
}

function getAcidRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!acidRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createAcidMaterial(0.84);
    const materialB = createAcidMaterial(0.28);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    acidRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (acidRuntime.width !== width || acidRuntime.height !== height) {
    acidRuntime.width = width;
    acidRuntime.height = height;
    acidRuntime.camera.left = 0;
    acidRuntime.camera.right = width;
    acidRuntime.camera.top = 0;
    acidRuntime.camera.bottom = height;
    acidRuntime.camera.near = 0.1;
    acidRuntime.camera.far = 5000;
    acidRuntime.camera.updateProjectionMatrix();
  }

  return acidRuntime;
}

function getPoisonRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!poisonRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createPoisonMaterial(0.72);
    const materialB = createPoisonMaterial(0.34);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    poisonRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (poisonRuntime.width !== width || poisonRuntime.height !== height) {
    poisonRuntime.width = width;
    poisonRuntime.height = height;
    poisonRuntime.camera.left = 0;
    poisonRuntime.camera.right = width;
    poisonRuntime.camera.top = 0;
    poisonRuntime.camera.bottom = height;
    poisonRuntime.camera.near = 0.1;
    poisonRuntime.camera.far = 5000;
    poisonRuntime.camera.updateProjectionMatrix();
  }

  return poisonRuntime;
}

function getColdRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!coldRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createColdMaterial(0.72);
    const materialB = createColdMaterial(0.3);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    coldRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (coldRuntime.width !== width || coldRuntime.height !== height) {
    coldRuntime.width = width;
    coldRuntime.height = height;
    coldRuntime.camera.left = 0;
    coldRuntime.camera.right = width;
    coldRuntime.camera.top = 0;
    coldRuntime.camera.bottom = height;
    coldRuntime.camera.near = 0.1;
    coldRuntime.camera.far = 5000;
    coldRuntime.camera.updateProjectionMatrix();
  }

  return coldRuntime;
}

function getDarknessRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!darknessRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createDarknessMaterial(0.82);
    const materialB = createDarknessMaterial(0.34);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    darknessRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (darknessRuntime.width !== width || darknessRuntime.height !== height) {
    darknessRuntime.width = width;
    darknessRuntime.height = height;
    darknessRuntime.camera.left = 0;
    darknessRuntime.camera.right = width;
    darknessRuntime.camera.top = 0;
    darknessRuntime.camera.bottom = height;
    darknessRuntime.camera.near = 0.1;
    darknessRuntime.camera.far = 5000;
    darknessRuntime.camera.updateProjectionMatrix();
  }

  return darknessRuntime;
}

function getArcaneRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!arcaneRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createArcaneMaterial(0.82);
    const materialB = createArcaneMaterial(0.34);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    arcaneRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (arcaneRuntime.width !== width || arcaneRuntime.height !== height) {
    arcaneRuntime.width = width;
    arcaneRuntime.height = height;
    arcaneRuntime.camera.left = 0;
    arcaneRuntime.camera.right = width;
    arcaneRuntime.camera.top = 0;
    arcaneRuntime.camera.bottom = height;
    arcaneRuntime.camera.near = 0.1;
    arcaneRuntime.camera.far = 5000;
    arcaneRuntime.camera.updateProjectionMatrix();
  }

  return arcaneRuntime;
}

function getChaosRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!chaosRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createChaosMaterial(0.82);
    const materialB = createChaosMaterial(0.32);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    chaosRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (chaosRuntime.width !== width || chaosRuntime.height !== height) {
    chaosRuntime.width = width;
    chaosRuntime.height = height;
    chaosRuntime.camera.left = 0;
    chaosRuntime.camera.right = width;
    chaosRuntime.camera.top = 0;
    chaosRuntime.camera.bottom = height;
    chaosRuntime.camera.near = 0.1;
    chaosRuntime.camera.far = 5000;
    chaosRuntime.camera.updateProjectionMatrix();
  }

  return chaosRuntime;
}

function getVoidRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!voidRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createVoidMaterial(0.82);
    const materialB = createVoidMaterial(0.34);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    voidRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (voidRuntime.width !== width || voidRuntime.height !== height) {
    voidRuntime.width = width;
    voidRuntime.height = height;
    voidRuntime.camera.left = 0;
    voidRuntime.camera.right = width;
    voidRuntime.camera.top = 0;
    voidRuntime.camera.bottom = height;
    voidRuntime.camera.near = 0.1;
    voidRuntime.camera.far = 5000;
    voidRuntime.camera.updateProjectionMatrix();
  }

  return voidRuntime;
}

function getNatureRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!natureRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createNatureMaterial(0.82);
    const materialB = createNatureMaterial(0.32);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    natureRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (natureRuntime.width !== width || natureRuntime.height !== height) {
    natureRuntime.width = width;
    natureRuntime.height = height;
    natureRuntime.camera.left = 0;
    natureRuntime.camera.right = width;
    natureRuntime.camera.top = 0;
    natureRuntime.camera.bottom = height;
    natureRuntime.camera.near = 0.1;
    natureRuntime.camera.far = 5000;
    natureRuntime.camera.updateProjectionMatrix();
  }

  return natureRuntime;
}

function getRadiantRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!radiantRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createRadiantMaterial(0.78);
    const materialB = createRadiantMaterial(0.28);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    radiantRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (radiantRuntime.width !== width || radiantRuntime.height !== height) {
    radiantRuntime.width = width;
    radiantRuntime.height = height;
    radiantRuntime.camera.left = 0;
    radiantRuntime.camera.right = width;
    radiantRuntime.camera.top = 0;
    radiantRuntime.camera.bottom = height;
    radiantRuntime.camera.near = 0.1;
    radiantRuntime.camera.far = 5000;
    radiantRuntime.camera.updateProjectionMatrix();
  }

  return radiantRuntime;
}

function getForceFieldRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!forceFieldRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createForceFieldMaterial(0.78);
    const materialB = createForceFieldMaterial(0.32);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    forceFieldRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (forceFieldRuntime.width !== width || forceFieldRuntime.height !== height) {
    forceFieldRuntime.width = width;
    forceFieldRuntime.height = height;
    forceFieldRuntime.camera.left = 0;
    forceFieldRuntime.camera.right = width;
    forceFieldRuntime.camera.top = 0;
    forceFieldRuntime.camera.bottom = height;
    forceFieldRuntime.camera.near = 0.1;
    forceFieldRuntime.camera.far = 5000;
    forceFieldRuntime.camera.updateProjectionMatrix();
  }

  return forceFieldRuntime;
}

function getShockwaveRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!shockwaveRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createShockwaveMaterial(0.78);
    const materialB = createShockwaveMaterial(0.28);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    shockwaveRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (shockwaveRuntime.width !== width || shockwaveRuntime.height !== height) {
    shockwaveRuntime.width = width;
    shockwaveRuntime.height = height;
    shockwaveRuntime.camera.left = 0;
    shockwaveRuntime.camera.right = width;
    shockwaveRuntime.camera.top = 0;
    shockwaveRuntime.camera.bottom = height;
    shockwaveRuntime.camera.near = 0.1;
    shockwaveRuntime.camera.far = 5000;
    shockwaveRuntime.camera.updateProjectionMatrix();
  }

  return shockwaveRuntime;
}

function getDistortionRuntime(width: number, height: number): EnvironmentEffectRuntime | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!distortionRuntime) {
    const renderer = getSharedEnvironmentEffectRenderer();
    if (!renderer) {
      return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    camera.position.set(0, 0, 2400);
    camera.lookAt(0, 0, 0);

    const material = createDistortionMaterial(0.72);
    const materialB = createDistortionMaterial(0.28);
    const meshA = new THREE.Mesh(getSharedEffectPlaneGeometry(), material);
    const meshB = new THREE.Mesh(getSharedEffectPlaneGeometry(), materialB);
    meshA.position.z = 1280;
    meshB.position.z = 1281;
    scene.add(meshA, meshB);

    distortionRuntime = {
      renderer,
      scene,
      camera,
      meshA,
      meshB,
      startedAt: Date.now(),
      width: 0,
      height: 0
    };
  }

  if (distortionRuntime.width !== width || distortionRuntime.height !== height) {
    distortionRuntime.width = width;
    distortionRuntime.height = height;
    distortionRuntime.camera.left = 0;
    distortionRuntime.camera.right = width;
    distortionRuntime.camera.top = 0;
    distortionRuntime.camera.bottom = height;
    distortionRuntime.camera.near = 0.1;
    distortionRuntime.camera.far = 5000;
    distortionRuntime.camera.updateProjectionMatrix();
  }

  return distortionRuntime;
}

function createWaterMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      bandScale: { value: DEFAULT_WATER_EFFECT_TUNING.bandScale },
      bandWidth: { value: DEFAULT_WATER_EFFECT_TUNING.bandWidth },
      speed: { value: DEFAULT_WATER_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_WATER_EFFECT_TUNING.directionDegrees) },
      distortion: { value: DEFAULT_WATER_EFFECT_TUNING.distortion },
      verticalDistortion: { value: DEFAULT_WATER_EFFECT_TUNING.verticalDistortion },
      distortionVariation: { value: DEFAULT_WATER_EFFECT_TUNING.distortionVariation },
      bandBreakup: { value: DEFAULT_WATER_EFFECT_TUNING.bandBreakup },
      bandVariation: { value: DEFAULT_WATER_EFFECT_TUNING.bandVariation },
      bandOverlap: { value: DEFAULT_WATER_EFFECT_TUNING.bandOverlap },
      panFollow: { value: DEFAULT_WATER_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_WATER_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_WATER_EFFECT_TUNING.baseAlpha },
      highlightAlpha: { value: DEFAULT_WATER_EFFECT_TUNING.highlightAlpha },
      deepColor: { value: new THREE.Color(DEFAULT_WATER_EFFECT_TUNING.deepColor) },
      waterColor: { value: new THREE.Color(DEFAULT_WATER_EFFECT_TUNING.waterColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_WATER_EFFECT_TUNING.highlightColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      cameraZoom: { value: 1 },
      opacity: { value: Math.max(opacity, 0.75) }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float bandScale;
      uniform float bandWidth;
      uniform float speed;
      uniform float directionRadians;
      uniform float distortion;
      uniform float verticalDistortion;
      uniform float distortionVariation;
      uniform float bandBreakup;
      uniform float bandVariation;
      uniform float bandOverlap;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform float highlightAlpha;
      uniform vec3 deepColor;
      uniform vec3 waterColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;
      varying vec2 vUv;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 180.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float motion = time * speed * 6.2831853;
        vec2 flowUv = uv;
        flowUv.x -= time * speed * 0.72;
        flowUv.y += sin(flowUv.x * 1.7 + motion * 0.12) * 0.035;
        float distortionNoise = valueNoise(pixelUv * vec2(1.15, 0.85) + vec2(motion * 0.018, -motion * 0.012));
        float distortionNoiseB = valueNoise(pixelUv * vec2(2.4, 1.7) - vec2(motion * 0.011, motion * 0.02));
        float distortionFactor = mix(1.0, 0.35 + distortionNoise * 1.55 + distortionNoiseB * 0.55, distortionVariation);
        float localHorizontalDistortion = distortion * distortionFactor;
        float localVerticalDistortion = verticalDistortion * distortionFactor;
        flowUv.x += sin(flowUv.y * 6.2831853 * 2.0 + motion) * localHorizontalDistortion;
        flowUv.y += cos(flowUv.x * 6.2831853 * 1.7 - motion * 0.82) * localVerticalDistortion;

        float spacingNoise = valueNoise(flowUv * vec2(1.35, 2.15) + vec2(motion * 0.018, -motion * 0.012)) - 0.5;
        float crossNoise = valueNoise(flowUv * vec2(2.8, 0.9) - vec2(motion * 0.01, motion * 0.016)) - 0.5;
        float diagonal = flowUv.x * bandScale + flowUv.y * bandScale * 0.3875 + (spacingNoise * 0.95 + crossNoise * 0.45) * bandVariation;
        float phase = abs(fract(diagonal) - 0.5);
        float primaryBand = 1.0 - smoothstep(bandWidth * 0.4, bandWidth, phase);
        float secondarySpacingNoise = valueNoise(flowUv * vec2(1.9, 1.15) - vec2(motion * 0.014, motion * 0.019)) - 0.5;
        float secondaryDiagonal = flowUv.x * bandScale * 0.78 - flowUv.y * bandScale * 0.52 + 0.23 + secondarySpacingNoise * bandVariation * 0.75;
        float secondaryPhase = abs(fract(secondaryDiagonal) - 0.5);
        float secondaryBand = 1.0 - smoothstep(bandWidth * 0.32, bandWidth * 1.12, secondaryPhase);
        float band = max(primaryBand, secondaryBand * bandOverlap);
        band += primaryBand * secondaryBand * bandOverlap * 0.55;
        band = clamp(band, 0.0, 1.0);
        float bodyLarge = valueNoise(flowUv * vec2(0.52, 0.88) + vec2(time * speed * 0.18, -time * speed * 0.08));
        float bodyMedium = valueNoise(flowUv * vec2(1.05, 1.7) - vec2(time * speed * 0.11, time * speed * 0.2));
        float bodyFine = valueNoise(flowUv * vec2(2.4, 3.1) + vec2(time * speed * 0.05, time * speed * 0.09));
        float body = smoothstep(0.22, 0.86, bodyLarge * 0.58 + bodyMedium * 0.3 + bodyFine * 0.12);
        float highlight = smoothstep(0.15, 0.88, band);
        float breakupPrimary = valueNoise(flowUv * vec2(3.0, 11.0) + vec2(motion * 0.08, 0.0));
        float breakupSecondary = valueNoise(flowUv * vec2(13.0, 4.0) - vec2(0.0, motion * 0.05));
        float breakupTertiary = valueNoise(flowUv * vec2(7.5, 7.0) + vec2(motion * 0.032, motion * 0.024));
        float brokenHighlight = smoothstep(0.24, 0.74, mix(mix(breakupPrimary, breakupSecondary, 0.38), breakupTertiary, 0.28));
        float segmentLong = valueNoise(flowUv * vec2(0.85, 5.8) + vec2(motion * 0.045, -motion * 0.018));
        float segmentShort = valueNoise(flowUv * vec2(5.4, 10.2) - vec2(motion * 0.03, motion * 0.052));
        float segmentPatch = smoothstep(0.42, 0.82, segmentLong * 0.72 + segmentShort * 0.28);
        brokenHighlight *= segmentPatch;
        highlight *= mix(1.0, brokenHighlight, bandBreakup);

        vec3 color = mix(deepColor, waterColor, body);
        color = mix(color, highlightColor, highlight);
        float alpha = (baseAlpha + body * 0.18 + highlight * highlightAlpha) * opacity;
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function updateWaterMaterialTuning(material: THREE.ShaderMaterial, tuning: WaterEffectTuning) {
  material.uniforms.bandScale.value = tuning.bandScale;
  material.uniforms.bandWidth.value = tuning.bandWidth;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.distortion.value = tuning.distortion;
  material.uniforms.verticalDistortion.value = tuning.verticalDistortion;
  material.uniforms.distortionVariation.value = tuning.distortionVariation;
  material.uniforms.bandBreakup.value = tuning.bandBreakup;
  material.uniforms.bandVariation.value = tuning.bandVariation;
  material.uniforms.bandOverlap.value = tuning.bandOverlap;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.highlightAlpha.value = tuning.highlightAlpha;
  material.uniforms.deepColor.value.set(tuning.deepColor);
  material.uniforms.waterColor.value.set(tuning.waterColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}

function createAcidMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      acidScale: { value: DEFAULT_ACID_EFFECT_TUNING.acidScale },
      speed: { value: DEFAULT_ACID_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_ACID_EFFECT_TUNING.directionDegrees) },
      corrosion: { value: DEFAULT_ACID_EFFECT_TUNING.corrosion },
      bubbleDensity: { value: DEFAULT_ACID_EFFECT_TUNING.bubbleDensity },
      bubbleSize: { value: DEFAULT_ACID_EFFECT_TUNING.bubbleSize },
      streakDensity: { value: DEFAULT_ACID_EFFECT_TUNING.streakDensity },
      streakWarp: { value: DEFAULT_ACID_EFFECT_TUNING.streakWarp },
      foam: { value: DEFAULT_ACID_EFFECT_TUNING.foam },
      glow: { value: DEFAULT_ACID_EFFECT_TUNING.glow },
      panFollow: { value: DEFAULT_ACID_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_ACID_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_ACID_EFFECT_TUNING.baseAlpha },
      darkColor: { value: new THREE.Color(DEFAULT_ACID_EFFECT_TUNING.darkColor) },
      acidColor: { value: new THREE.Color(DEFAULT_ACID_EFFECT_TUNING.acidColor) },
      foamColor: { value: new THREE.Color(DEFAULT_ACID_EFFECT_TUNING.foamColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float acidScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float corrosion;
      uniform float bubbleDensity;
      uniform float bubbleSize;
      uniform float streakDensity;
      uniform float streakWarp;
      uniform float foam;
      uniform float glow;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 darkColor;
      uniform vec3 acidColor;
      uniform vec3 foamColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.03;
          amplitude *= 0.52;
        }
        return total;
      }

      float bubbleField(vec2 uv, float localTime) {
        float field = 0.0;
        float cells = mix(2.0, 10.0, bubbleDensity) * mix(0.65, 1.3, bubbleSize);
        for (int layer = 0; layer < 3; layer++) {
          float layerSeed = float(layer) * 37.21;
          vec2 layerUv = uv * (cells + float(layer) * 1.7) + vec2(localTime * (0.08 + float(layer) * 0.03), -localTime * 0.06);
          vec2 cell = floor(layerUv);
          vec2 fraction = fract(layerUv);
          float seed = randomValue(cell + layerSeed);
          float placed = smoothstep(0.82 - bubbleDensity * 0.62, 0.98, seed);
          vec2 center = vec2(0.5) + (vec2(randomValue(cell + vec2(4.4, layerSeed)), randomValue(cell + vec2(12.7, layerSeed))) - 0.5) * 0.56;
          float radius = mix(0.08, 0.28, bubbleSize) * mix(0.65, 1.45, randomValue(cell + vec2(9.0, 2.0)));
          float distanceFromCenter = length(fraction - center);
          float ring = 1.0 - smoothstep(radius, radius + 0.035, abs(distanceFromCenter - radius));
          float centerPop = 1.0 - smoothstep(radius * 0.25, radius * 0.7, distanceFromCenter);
          float pulse = 0.72 + sin(localTime * 4.0 + seed * 6.2831853) * 0.28;
          field = max(field, (ring + centerPop * 0.3) * placed * pulse);
        }
        return clamp(field, 0.0, 1.0);
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 170.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float localTime = time * speed;

        vec2 flowUv = uv * max(0.2, acidScale / 4.0);
        float large = fbm(flowUv * 0.82 + vec2(localTime * 0.2, -localTime * 0.08));
        float medium = fbm(flowUv * 1.9 - vec2(localTime * 0.18, localTime * 0.14));
        flowUv += vec2(large - 0.5, medium - 0.5) * streakWarp * 0.9;

        float body = smoothstep(0.16, 0.88, large * 0.56 + medium * 0.34 + fbm(flowUv * 4.2) * 0.1);
        float corrosivePits = smoothstep(0.62 - corrosion * 0.32, 0.96, fbm(flowUv * mix(2.8, 8.5, corrosion) + vec2(localTime * 0.12, 8.0)));
        float streakNoise = fbm(vec2(flowUv.x * (1.0 + streakWarp * 2.0), flowUv.y * mix(4.0, 14.0, streakDensity)) + vec2(localTime * 0.45, 0.0));
        float streaks = smoothstep(0.74 - streakDensity * 0.36, 0.96, streakNoise);
        streaks *= smoothstep(0.2, 0.85, fbm(flowUv * vec2(6.0, 1.2) - vec2(0.0, localTime * 0.2)));
        float bubbles = bubbleField(flowUv * mix(0.9, 1.8, bubbleDensity), localTime);
        float foamEdge = smoothstep(0.58 - foam * 0.28, 0.96, fbm(flowUv * vec2(3.5, 5.2) - vec2(localTime * 0.08, localTime * 0.18)));

        vec3 color = mix(darkColor, acidColor, body + corrosivePits * 0.35);
        color = mix(color, foamColor, clamp(bubbles * 0.85 + foamEdge * foam * 0.42 + streaks * foam * 0.24, 0.0, 1.0));
        color += acidColor * glow * (corrosivePits * 0.28 + bubbles * 0.18 + streaks * 0.16);
        float alpha = (baseAlpha + body * 0.26 + corrosivePits * corrosion * 0.22 + streaks * 0.24 + bubbles * 0.28 + foamEdge * foam * 0.18) * opacity;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateAcidMaterialTuning(material: THREE.ShaderMaterial, tuning: AcidEffectTuning) {
  material.uniforms.acidScale.value = tuning.acidScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.corrosion.value = tuning.corrosion;
  material.uniforms.bubbleDensity.value = tuning.bubbleDensity;
  material.uniforms.bubbleSize.value = tuning.bubbleSize;
  material.uniforms.streakDensity.value = tuning.streakDensity;
  material.uniforms.streakWarp.value = tuning.streakWarp;
  material.uniforms.foam.value = tuning.foam;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.darkColor.value.set(tuning.darkColor);
  material.uniforms.acidColor.value.set(tuning.acidColor);
  material.uniforms.foamColor.value.set(tuning.foamColor);
}

function createPoisonMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      cloudScale: { value: DEFAULT_POISON_EFFECT_TUNING.cloudScale },
      speed: { value: DEFAULT_POISON_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_POISON_EFFECT_TUNING.directionDegrees) },
      turbulence: { value: DEFAULT_POISON_EFFECT_TUNING.turbulence },
      density: { value: DEFAULT_POISON_EFFECT_TUNING.density },
      pocketDensity: { value: DEFAULT_POISON_EFFECT_TUNING.pocketDensity },
      pocketSize: { value: DEFAULT_POISON_EFFECT_TUNING.pocketSize },
      softness: { value: DEFAULT_POISON_EFFECT_TUNING.softness },
      drift: { value: DEFAULT_POISON_EFFECT_TUNING.drift },
      glow: { value: DEFAULT_POISON_EFFECT_TUNING.glow },
      panFollow: { value: DEFAULT_POISON_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_POISON_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_POISON_EFFECT_TUNING.baseAlpha },
      shadowColor: { value: new THREE.Color(DEFAULT_POISON_EFFECT_TUNING.shadowColor) },
      poisonColor: { value: new THREE.Color(DEFAULT_POISON_EFFECT_TUNING.poisonColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_POISON_EFFECT_TUNING.highlightColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float cloudScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float turbulence;
      uniform float density;
      uniform float pocketDensity;
      uniform float pocketSize;
      uniform float softness;
      uniform float drift;
      uniform float glow;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 shadowColor;
      uniform vec3 poisonColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 6; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.02;
          amplitude *= 0.5;
        }
        return total;
      }

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 190.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float localTime = time * speed;

        vec2 flow = uv * max(0.2, cloudScale / 4.0);
        flow.x -= localTime * (0.22 + drift * 0.7);
        flow.y += sin(flow.x * 1.4 + localTime * 1.7) * drift * 0.18;
        float broad = fbm(flow * 0.78 + vec2(localTime * 0.08, -localTime * 0.03));
        float curl = fbm(flow * 1.55 - vec2(localTime * 0.06, localTime * 0.1));
        flow += vec2(broad - 0.5, curl - 0.5) * turbulence * 0.9;
        float largeCloud = fbm(flow * 0.95 + vec2(localTime * 0.06, 4.0));
        float mediumCloud = fbm(rotate2d(0.9) * flow * 1.85 - vec2(localTime * 0.08, localTime * 0.03));
        float fineCloud = fbm(flow * 4.4 + vec2(7.0, -localTime * 0.12));
        float cloud = largeCloud * 0.58 + mediumCloud * 0.32 + fineCloud * 0.1;
        float cloudMask = smoothstep(0.56 - density * 0.44, mix(0.96, 0.72, softness), cloud);

        float pocketNoise = fbm(flow * mix(2.6, 7.8, pocketDensity) + vec2(localTime * 0.18, -9.0));
        float pocketShape = smoothstep(0.74 - pocketDensity * 0.38, 0.98, pocketNoise);
        float pocketBreakup = smoothstep(0.24, 0.86, fbm(flow * vec2(3.7, 1.4) - vec2(localTime * 0.09, 0.0)));
        float pockets = pocketShape * pocketBreakup * mix(0.45, 1.35, pocketSize);

        float edgeWisps = smoothstep(0.22, 0.88, fbm(flow * vec2(6.0, 2.0) + vec2(localTime * 0.03, localTime * 0.11)));
        vec3 color = mix(shadowColor, poisonColor, cloudMask + pockets * 0.25);
        color = mix(color, highlightColor, clamp(pockets * 0.5 + edgeWisps * glow * 0.24, 0.0, 1.0));
        color += poisonColor * glow * (pockets * 0.26 + cloudMask * 0.12);
        float alpha = (baseAlpha + cloudMask * density * 0.64 + pockets * 0.34 + edgeWisps * glow * 0.12) * opacity;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updatePoisonMaterialTuning(material: THREE.ShaderMaterial, tuning: PoisonEffectTuning) {
  material.uniforms.cloudScale.value = tuning.cloudScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.turbulence.value = tuning.turbulence;
  material.uniforms.density.value = tuning.density;
  material.uniforms.pocketDensity.value = tuning.pocketDensity;
  material.uniforms.pocketSize.value = tuning.pocketSize;
  material.uniforms.softness.value = tuning.softness;
  material.uniforms.drift.value = tuning.drift;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.shadowColor.value.set(tuning.shadowColor);
  material.uniforms.poisonColor.value.set(tuning.poisonColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}

function createColdMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      frostScale: { value: DEFAULT_COLD_EFFECT_TUNING.frostScale },
      speed: { value: DEFAULT_COLD_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_COLD_EFFECT_TUNING.directionDegrees) },
      veinDensity: { value: DEFAULT_COLD_EFFECT_TUNING.veinDensity },
      veinWidth: { value: DEFAULT_COLD_EFFECT_TUNING.veinWidth },
      crystalDensity: { value: DEFAULT_COLD_EFFECT_TUNING.crystalDensity },
      crystalSize: { value: DEFAULT_COLD_EFFECT_TUNING.crystalSize },
      haze: { value: DEFAULT_COLD_EFFECT_TUNING.haze },
      shimmer: { value: DEFAULT_COLD_EFFECT_TUNING.shimmer },
      glow: { value: DEFAULT_COLD_EFFECT_TUNING.glow },
      panFollow: { value: DEFAULT_COLD_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_COLD_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_COLD_EFFECT_TUNING.baseAlpha },
      shadowColor: { value: new THREE.Color(DEFAULT_COLD_EFFECT_TUNING.shadowColor) },
      frostColor: { value: new THREE.Color(DEFAULT_COLD_EFFECT_TUNING.frostColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_COLD_EFFECT_TUNING.highlightColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float frostScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float veinDensity;
      uniform float veinWidth;
      uniform float crystalDensity;
      uniform float crystalSize;
      uniform float haze;
      uniform float shimmer;
      uniform float glow;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 shadowColor;
      uniform vec3 frostColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.05;
          amplitude *= 0.52;
        }
        return total;
      }

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float frostVeins(vec2 uv, float localTime) {
        float field = 0.0;
        for (int layer = 0; layer < 4; layer++) {
          float layerSeed = float(layer) * 11.73;
          vec2 veinUv = rotate2d(float(layer) * 0.78 + directionRadians * 0.35) * uv;
          veinUv += vec2(fbm(veinUv * 1.3 + layerSeed), fbm(veinUv * 1.7 - layerSeed)) * 0.42;
          float lines = veinUv.x * mix(3.5, 12.0, veinDensity) + sin(veinUv.y * (2.0 + float(layer)) + localTime * 0.32 + layerSeed) * 0.45;
          float phase = abs(fract(lines) - 0.5);
          float width = mix(0.015, 0.075, veinWidth);
          float line = 1.0 - smoothstep(width, width + 0.025, phase);
          float breakup = smoothstep(0.24, 0.86, fbm(veinUv * vec2(2.5, 7.0) + vec2(layerSeed, localTime * 0.06)));
          field = max(field, line * breakup);
        }
        return field * veinDensity;
      }

      float crystalField(vec2 uv, float localTime) {
        float field = 0.0;
        float cells = mix(2.0, 9.0, crystalDensity) * mix(0.75, 1.3, crystalSize);
        for (int layer = 0; layer < 3; layer++) {
          float layerSeed = float(layer) * 31.19;
          vec2 gridUv = rotate2d(float(layer) * 1.4 + 0.2) * uv * (cells + float(layer) * 1.4);
          vec2 cell = floor(gridUv);
          vec2 fraction = fract(gridUv);
          float seed = randomValue(cell + layerSeed);
          float placed = smoothstep(0.83 - crystalDensity * 0.62, 0.98, seed);
          vec2 center = vec2(0.5) + (vec2(randomValue(cell + vec2(4.0, layerSeed)), randomValue(cell + vec2(13.0, layerSeed))) - 0.5) * 0.44;
          vec2 localPoint = fraction - center;
          float angle = randomValue(cell + vec2(7.0, layerSeed)) * 3.14159;
          localPoint = rotate2d(angle) * localPoint;
          float size = mix(0.1, 0.28, crystalSize);
          float shardA = 1.0 - smoothstep(size * 0.08, size * 0.18, abs(localPoint.x)) * smoothstep(size * 0.95, size * 1.25, abs(localPoint.y));
          float shardB = 1.0 - smoothstep(size * 0.07, size * 0.17, abs(localPoint.y)) * smoothstep(size * 0.75, size * 1.1, abs(localPoint.x));
          float diagonal = abs(localPoint.x + localPoint.y) * 0.72;
          float shardC = 1.0 - smoothstep(size * 0.055, size * 0.15, diagonal) * smoothstep(size * 0.85, size * 1.2, length(localPoint));
          float crystal = max(max(shardA, shardB), shardC * 0.72);
          crystal *= 1.0 - smoothstep(size * 0.95, size * 1.3, length(localPoint));
          float twinkle = 0.75 + sin(localTime * 4.0 + seed * 6.2831853) * 0.25 * shimmer;
          field = max(field, crystal * placed * twinkle);
        }
        return clamp(field, 0.0, 1.0);
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 180.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float localTime = time * speed;
        vec2 frostUv = uv * max(0.2, frostScale / 4.0);
        frostUv += vec2(fbm(frostUv * 0.9 + localTime * 0.08), fbm(frostUv * 1.2 - localTime * 0.05)) * shimmer * 0.22;

        float hazeField = smoothstep(0.22, 0.88, fbm(frostUv * 0.82 + vec2(localTime * 0.05, -localTime * 0.03)));
        float veins = frostVeins(frostUv, localTime);
        float crystals = crystalField(frostUv, localTime);
        float icyPatch = smoothstep(0.38, 0.92, fbm(frostUv * 1.7 - vec2(localTime * 0.025, 8.0)));

        vec3 color = mix(shadowColor, frostColor, hazeField * haze + icyPatch * 0.5 + veins * 0.32);
        color = mix(color, highlightColor, clamp(crystals * 0.82 + veins * 0.5 + shimmer * glow * hazeField * 0.18, 0.0, 1.0));
        color += frostColor * glow * (veins * 0.22 + crystals * 0.18 + icyPatch * 0.1);
        float alpha = (baseAlpha + hazeField * haze * 0.35 + icyPatch * 0.2 + veins * 0.34 + crystals * 0.38) * opacity;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateColdMaterialTuning(material: THREE.ShaderMaterial, tuning: ColdEffectTuning) {
  material.uniforms.frostScale.value = tuning.frostScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.veinDensity.value = tuning.veinDensity;
  material.uniforms.veinWidth.value = tuning.veinWidth;
  material.uniforms.crystalDensity.value = tuning.crystalDensity;
  material.uniforms.crystalSize.value = tuning.crystalSize;
  material.uniforms.haze.value = tuning.haze;
  material.uniforms.shimmer.value = tuning.shimmer;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.shadowColor.value.set(tuning.shadowColor);
  material.uniforms.frostColor.value.set(tuning.frostColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}

function createDarknessMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      darknessScale: { value: DEFAULT_DARKNESS_EFFECT_TUNING.darknessScale },
      speed: { value: DEFAULT_DARKNESS_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_DARKNESS_EFFECT_TUNING.directionDegrees) },
      depth: { value: DEFAULT_DARKNESS_EFFECT_TUNING.depth },
      tendrilDensity: { value: DEFAULT_DARKNESS_EFFECT_TUNING.tendrilDensity },
      tendrilReach: { value: DEFAULT_DARKNESS_EFFECT_TUNING.tendrilReach },
      edgeSoftness: { value: DEFAULT_DARKNESS_EFFECT_TUNING.edgeSoftness },
      wispDensity: { value: DEFAULT_DARKNESS_EFFECT_TUNING.wispDensity },
      drift: { value: DEFAULT_DARKNESS_EFFECT_TUNING.drift },
      voidHighlight: { value: DEFAULT_DARKNESS_EFFECT_TUNING.voidHighlight },
      panFollow: { value: DEFAULT_DARKNESS_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_DARKNESS_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_DARKNESS_EFFECT_TUNING.baseAlpha },
      shadowColor: { value: new THREE.Color(DEFAULT_DARKNESS_EFFECT_TUNING.shadowColor) },
      voidColor: { value: new THREE.Color(DEFAULT_DARKNESS_EFFECT_TUNING.voidColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_DARKNESS_EFFECT_TUNING.highlightColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float darknessScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float depth;
      uniform float tendrilDensity;
      uniform float tendrilReach;
      uniform float edgeSoftness;
      uniform float wispDensity;
      uniform float drift;
      uniform float voidHighlight;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 shadowColor;
      uniform vec3 voidColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.02;
          amplitude *= 0.52;
        }
        return total;
      }

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float tendrilField(vec2 uv, float localTime) {
        float field = 0.0;
        for (int layer = 0; layer < 5; layer++) {
          float seed = float(layer) * 23.17;
          vec2 tendrilUv = rotate2d(directionRadians * 0.45 + float(layer) * 0.88) * uv;
          tendrilUv += vec2(
            fbm(tendrilUv * 0.9 + vec2(seed, localTime * 0.08)),
            fbm(tendrilUv * 1.2 + vec2(-seed, -localTime * 0.05))
          ) * mix(0.18, 0.72, drift);
          float spacing = mix(2.6, 10.0, tendrilDensity);
          float strand = tendrilUv.x * spacing + sin(tendrilUv.y * (2.2 + tendrilReach * 4.6) + seed + localTime * 0.35) * mix(0.3, 1.3, tendrilReach);
          float phase = abs(fract(strand) - 0.5);
          float width = mix(0.028, 0.12, tendrilReach);
          float line = 1.0 - smoothstep(width, width + mix(0.035, 0.13, edgeSoftness), phase);
          float broken = smoothstep(0.2, 0.9, fbm(tendrilUv * vec2(2.0, 5.4) + vec2(seed, localTime * 0.04)));
          field = max(field, line * broken);
        }
        return field * tendrilDensity;
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 pixelUv = anchoredCoord / 180.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float localTime = time * speed;
        vec2 darknessUv = uv * max(0.18, darknessScale / 4.0);

        vec2 driftUv = darknessUv + vec2(
          fbm(darknessUv * 0.7 + localTime * 0.08),
          fbm(darknessUv * 0.95 - localTime * 0.06)
        ) * mix(0.15, 0.85, drift);

        float deepPatch = smoothstep(0.18, 0.92, fbm(driftUv * 1.2 + vec2(localTime * 0.035, -localTime * 0.02)));
        float voidPocket = smoothstep(0.48, 0.96, fbm(driftUv * 2.1 - vec2(localTime * 0.03, 9.0)));
        float wisps = smoothstep(0.5, 0.92, fbm(driftUv * vec2(1.4, 5.6) + vec2(localTime * 0.12, 18.0))) * wispDensity;
        float tendrils = tendrilField(driftUv, localTime);
        float softCloud = smoothstep(0.18, 0.86, fbm(driftUv * 0.62 - vec2(localTime * 0.02, localTime * 0.015)));
        float absorb = clamp(deepPatch * depth + voidPocket * depth * 0.58 + tendrils * 0.46 + softCloud * edgeSoftness * 0.24, 0.0, 1.0);
        float highlight = clamp((tendrils * 0.36 + wisps * 0.44 + voidPocket * 0.18) * voidHighlight, 0.0, 1.0);

        vec3 color = mix(shadowColor, voidColor, clamp(absorb * 1.18, 0.0, 1.0));
        color = mix(color, highlightColor, highlight);
        float alpha = (baseAlpha + absorb * 0.52 + tendrils * 0.18 + wisps * 0.16) * opacity;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateDarknessMaterialTuning(material: THREE.ShaderMaterial, tuning: DarknessEffectTuning) {
  material.uniforms.darknessScale.value = tuning.darknessScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.depth.value = tuning.depth;
  material.uniforms.tendrilDensity.value = tuning.tendrilDensity;
  material.uniforms.tendrilReach.value = tuning.tendrilReach;
  material.uniforms.edgeSoftness.value = tuning.edgeSoftness;
  material.uniforms.wispDensity.value = tuning.wispDensity;
  material.uniforms.drift.value = tuning.drift;
  material.uniforms.voidHighlight.value = tuning.voidHighlight;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.shadowColor.value.set(tuning.shadowColor);
  material.uniforms.voidColor.value.set(tuning.voidColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}

function createArcaneMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      glyphScale: { value: DEFAULT_ARCANE_EFFECT_TUNING.glyphScale },
      speed: { value: DEFAULT_ARCANE_EFFECT_TUNING.speed },
      rotationSpeed: { value: DEFAULT_ARCANE_EFFECT_TUNING.rotationSpeed },
      glyphDensity: { value: DEFAULT_ARCANE_EFFECT_TUNING.glyphDensity },
      ringDensity: { value: DEFAULT_ARCANE_EFFECT_TUNING.ringDensity },
      circleScale: { value: DEFAULT_ARCANE_EFFECT_TUNING.circleScale },
      spokeAmount: { value: DEFAULT_ARCANE_EFFECT_TUNING.spokeAmount },
      pulse: { value: DEFAULT_ARCANE_EFFECT_TUNING.pulse },
      drift: { value: DEFAULT_ARCANE_EFFECT_TUNING.drift },
      glow: { value: DEFAULT_ARCANE_EFFECT_TUNING.glow },
      lineWidth: { value: DEFAULT_ARCANE_EFFECT_TUNING.lineWidth },
      panFollow: { value: DEFAULT_ARCANE_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_ARCANE_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_ARCANE_EFFECT_TUNING.baseAlpha },
      backgroundColor: { value: new THREE.Color(DEFAULT_ARCANE_EFFECT_TUNING.backgroundColor) },
      glyphColor: { value: new THREE.Color(DEFAULT_ARCANE_EFFECT_TUNING.glyphColor) },
      glowColor: { value: new THREE.Color(DEFAULT_ARCANE_EFFECT_TUNING.glowColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      effectSize: { value: new THREE.Vector2(1, 1) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float glyphScale;
      uniform float speed;
      uniform float rotationSpeed;
      uniform float glyphDensity;
      uniform float ringDensity;
      uniform float circleScale;
      uniform float spokeAmount;
      uniform float pulse;
      uniform float drift;
      uniform float glow;
      uniform float lineWidth;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 backgroundColor;
      uniform vec3 glyphColor;
      uniform vec3 glowColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform vec2 effectSize;
      uniform float cameraZoom;
      uniform float opacity;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float lineMask(float value, float width) {
        float distanceToLine = abs(fract(value) - 0.5);
        return smoothstep(width, 0.0, distanceToLine);
      }

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float runeCell(vec2 uv, float localTime) {
        vec2 grid = uv * glyphScale;
        vec2 cell = floor(grid);
        vec2 local = fract(grid) - 0.5;
        float seed = hash(cell);
        float visible = smoothstep(1.0 - glyphDensity, 1.0, seed);
        local *= rotate2d((seed - 0.5) * 6.2831 + localTime * rotationSpeed * (seed > 0.5 ? 1.0 : -1.0));
        float width = mix(0.018, 0.07, lineWidth);
        float vertical = smoothstep(width, 0.0, abs(local.x)) * step(abs(local.y), 0.36);
        float horizontal = smoothstep(width, 0.0, abs(local.y)) * step(abs(local.x), 0.36);
        float diagonal = smoothstep(width, 0.0, abs(local.x - local.y)) * step(max(abs(local.x), abs(local.y)), 0.34);
        float hook = smoothstep(width, 0.0, abs(length(local - vec2(0.16, -0.12)) - 0.22)) * step(local.x, 0.22);
        vec2 boxDistance = abs(local) - vec2(0.28);
        float squareOutline = smoothstep(width, 0.0, abs(max(boxDistance.x, boxDistance.y))) * step(max(abs(local.x), abs(local.y)), 0.34);
        float shapePick = floor(seed * 5.0);
        float glyph = shapePick < 1.0 ? vertical : shapePick < 2.0 ? max(vertical, horizontal) : shapePick < 3.0 ? diagonal : shapePick < 4.0 ? squareOutline : hook;
        float blink = mix(0.65, 1.0, sin(localTime * (1.4 + seed * 2.0) + seed * 9.0) * 0.5 + 0.5);
        return glyph * visible * blink;
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 localCoord = (worldCoord - effectOrigin) / max(effectSize, vec2(1.0));
        vec2 centeredCoord = localCoord - 0.5;
        centeredCoord.x *= effectSize.x / max(effectSize.y, 1.0);
        vec2 glyphCoord = centeredCoord * 3.2 * zoomFactor;
        float localTime = time * speed;
        vec2 driftOffset = vec2(sin(localTime * 0.67), cos(localTime * 0.53)) * drift * 0.65;
        vec2 fieldUv = glyphCoord + driftOffset;
        vec2 radialUv = rotate2d(localTime * rotationSpeed * 0.35) * centeredCoord;
        float radius = length(radialUv);
        float angle = atan(radialUv.y, radialUv.x) / 6.2831853 + 0.5;

        float ringWidth = mix(0.016, 0.06, lineWidth);
        float rings = lineMask(radius * circleScale, ringWidth) * ringDensity;
        float spokes = lineMask(angle * mix(4.0, 22.0, spokeAmount), ringWidth * 0.82) * smoothstep(0.08, 0.62, radius) * ringDensity * spokeAmount;
        float runeFragments = runeCell(fieldUv, localTime);
        float pulseWave = 0.72 + sin(localTime * 6.2831 + radius * 7.0) * 0.28 * pulse;
        float sigil = max(rings * pulseWave, spokes * 0.75);
        sigil = max(sigil, runeFragments);
        float aura = smoothstep(0.08, 0.0, abs(fract(radius * 2.3 - localTime * 0.18) - 0.5)) * glow * 0.28;
        float energy = clamp(sigil + aura, 0.0, 1.0);
        vec3 color = mix(backgroundColor, glyphColor, energy);
        color = mix(color, glowColor, smoothstep(0.45, 1.0, energy) * glow);
        float alpha = (baseAlpha * 0.42 + energy * (0.78 + glow * 0.38)) * opacity;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateArcaneMaterialTuning(material: THREE.ShaderMaterial, tuning: ArcaneEffectTuning) {
  material.uniforms.glyphScale.value = tuning.glyphScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.rotationSpeed.value = tuning.rotationSpeed;
  material.uniforms.glyphDensity.value = tuning.glyphDensity;
  material.uniforms.ringDensity.value = tuning.ringDensity;
  material.uniforms.circleScale.value = tuning.circleScale;
  material.uniforms.spokeAmount.value = tuning.spokeAmount;
  material.uniforms.pulse.value = tuning.pulse;
  material.uniforms.drift.value = tuning.drift;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.lineWidth.value = tuning.lineWidth;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.backgroundColor.value.set(tuning.backgroundColor);
  material.uniforms.glyphColor.value.set(tuning.glyphColor);
  material.uniforms.glowColor.value.set(tuning.glowColor);
}

function createChaosMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      chaosScale: { value: DEFAULT_CHAOS_EFFECT_TUNING.chaosScale },
      speed: { value: DEFAULT_CHAOS_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_CHAOS_EFFECT_TUNING.directionDegrees) },
      riftDensity: { value: DEFAULT_CHAOS_EFFECT_TUNING.riftDensity },
      riftWarp: { value: DEFAULT_CHAOS_EFFECT_TUNING.riftWarp },
      moteDensity: { value: DEFAULT_CHAOS_EFFECT_TUNING.moteDensity },
      moteSize: { value: DEFAULT_CHAOS_EFFECT_TUNING.moteSize },
      colorShift: { value: DEFAULT_CHAOS_EFFECT_TUNING.colorShift },
      pulse: { value: DEFAULT_CHAOS_EFFECT_TUNING.pulse },
      glow: { value: DEFAULT_CHAOS_EFFECT_TUNING.glow },
      instability: { value: DEFAULT_CHAOS_EFFECT_TUNING.instability },
      panFollow: { value: DEFAULT_CHAOS_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_CHAOS_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_CHAOS_EFFECT_TUNING.baseAlpha },
      backgroundColor: { value: new THREE.Color(DEFAULT_CHAOS_EFFECT_TUNING.backgroundColor) },
      riftColor: { value: new THREE.Color(DEFAULT_CHAOS_EFFECT_TUNING.riftColor) },
      moteColor: { value: new THREE.Color(DEFAULT_CHAOS_EFFECT_TUNING.moteColor) },
      accentColor: { value: new THREE.Color(DEFAULT_CHAOS_EFFECT_TUNING.accentColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      effectSize: { value: new THREE.Vector2(1, 1) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float chaosScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float riftDensity;
      uniform float riftWarp;
      uniform float moteDensity;
      uniform float moteSize;
      uniform float colorShift;
      uniform float pulse;
      uniform float glow;
      uniform float instability;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 backgroundColor;
      uniform vec3 riftColor;
      uniform vec3 moteColor;
      uniform vec3 accentColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform vec2 effectSize;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.05;
          amplitude *= 0.52;
        }
        return total;
      }

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float riftLayer(vec2 uv, float localTime, float seedOffset) {
        vec2 warped = uv;
        float coarse = fbm(warped * 0.55 + vec2(seedOffset, localTime * 0.12));
        float fine = fbm(warped * 1.7 + vec2(localTime * 0.08, seedOffset * 1.7));
        warped += vec2(coarse - 0.5, fine - 0.5) * riftWarp * (0.65 + instability);
        float path = warped.x * mix(1.8, 8.4, riftDensity) + sin(warped.y * (2.4 + chaosScale * 0.18) + localTime * 2.4 + seedOffset) * (0.22 + riftWarp * 0.55);
        path += fbm(warped * (1.8 + chaosScale * 0.22) + seedOffset) * instability * 1.8;
        float line = 1.0 - smoothstep(0.018, mix(0.11, 0.035, riftDensity), abs(fract(path) - 0.5));
        float segment = smoothstep(0.2, 0.92, fbm(warped * vec2(2.8, 7.4) + vec2(localTime * 0.34, seedOffset)));
        float flare = smoothstep(0.82, 1.0, fbm(warped * 3.2 - vec2(seedOffset, localTime * 0.28)));
        return line * mix(0.42, 1.0, segment) + flare * line * glow * 0.5;
      }

      float chaosMotes(vec2 uv, float localTime) {
        float density = mix(2.0, 18.0, moteDensity);
        vec2 grid = uv * density;
        vec2 cell = floor(grid);
        float seed = randomValue(cell);
        vec2 offset = vec2(randomValue(cell + vec2(19.0, 5.0)), randomValue(cell + vec2(7.0, 31.0))) - 0.5;
        offset += vec2(sin(localTime * (0.7 + seed) + seed * 8.0), cos(localTime * (0.52 + seed) + seed * 11.0)) * instability * 0.18;
        vec2 local = fract(grid) - 0.5 - offset * 0.82;
        float visible = step(1.0 - moteDensity, seed) * smoothstep(0.02, 0.12, moteDensity);
        float radius = length(local);
        float normalizedSize = clamp(moteSize / 5.0, 0.0, 1.0);
        float core = smoothstep(mix(0.035, 0.24, normalizedSize), 0.0, radius);
        float halo = smoothstep(mix(0.18, 0.48, normalizedSize), 0.0, radius) * 0.35 * glow;
        float twinkle = 0.55 + 0.45 * sin(localTime * (3.0 + seed * 8.0) + seed * 21.0);
        return (core + halo) * visible * twinkle;
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 size = max(effectSize, vec2(1.0));
        vec2 localCoord = (worldCoord - effectOrigin) / size;
        vec2 centered = localCoord - 0.5;
        centered.x *= size.x / max(size.y, 1.0);
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = anchoredCoord / 150.0 * zoomFactor;
        vec2 flowUv = vec2(dot(uv, direction), dot(uv, perpendicular));
        float localTime = time * speed;
        flowUv.x += localTime * 0.42;
        flowUv += rotate2d(localTime * 0.08 * instability) * centered * 0.36;

        float riftA = riftLayer(flowUv * max(0.25, chaosScale / 5.0), localTime, 3.1);
        float riftB = riftLayer(rotate2d(1.17 + colorShift) * flowUv.yx * max(0.25, chaosScale / 6.0), localTime * 0.83 + 4.0, 17.7) * 0.72;
        float mote = chaosMotes(localCoord * (1.2 + chaosScale * 0.08) + vec2(localTime * 0.06, -localTime * 0.04), localTime) * moteDensity;
        float fieldNoise = fbm(flowUv * 0.45 + vec2(localTime * 0.09, 6.0));
        float pulseWave = 0.72 + sin(localTime * 6.2831 + fieldNoise * 5.8) * 0.28 * pulse;
        float energy = clamp((riftA + riftB) * (0.58 + riftDensity * 0.64) * pulseWave + mote * 0.82 + fieldNoise * baseAlpha * 0.5, 0.0, 1.0);
        vec3 shiftedRift = mix(riftColor, accentColor, smoothstep(0.2, 0.95, sin(fieldNoise * 6.2831 + localTime * 2.0) * 0.5 + 0.5) * colorShift);
        vec3 color = mix(backgroundColor, shiftedRift, clamp(riftA + riftB, 0.0, 1.0));
        color = mix(color, moteColor, clamp(mote + energy * glow * 0.32, 0.0, 1.0));
        color = mix(color, accentColor, smoothstep(0.72, 1.0, energy) * colorShift * 0.55);
        float alpha = (baseAlpha * 0.42 + energy * (0.62 + glow * 0.48)) * opacity;
        alpha *= smoothstep(0.02, 0.12, energy + baseAlpha);
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateChaosMaterialTuning(material: THREE.ShaderMaterial, tuning: ChaosEffectTuning) {
  material.uniforms.chaosScale.value = tuning.chaosScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.riftDensity.value = tuning.riftDensity;
  material.uniforms.riftWarp.value = tuning.riftWarp;
  material.uniforms.moteDensity.value = tuning.moteDensity;
  material.uniforms.moteSize.value = tuning.moteSize;
  material.uniforms.colorShift.value = tuning.colorShift;
  material.uniforms.pulse.value = tuning.pulse;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.instability.value = tuning.instability;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.backgroundColor.value.set(tuning.backgroundColor);
  material.uniforms.riftColor.value.set(tuning.riftColor);
  material.uniforms.moteColor.value.set(tuning.moteColor);
  material.uniforms.accentColor.value.set(tuning.accentColor);
}

function createVoidMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      tendrilScale: { value: DEFAULT_VOID_EFFECT_TUNING.tendrilScale },
      speed: { value: DEFAULT_VOID_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_VOID_EFFECT_TUNING.directionDegrees) },
      tendrilDensity: { value: DEFAULT_VOID_EFFECT_TUNING.tendrilDensity },
      tendrilWidth: { value: DEFAULT_VOID_EFFECT_TUNING.tendrilWidth },
      curl: { value: DEFAULT_VOID_EFFECT_TUNING.curl },
      reach: { value: DEFAULT_VOID_EFFECT_TUNING.reach },
      voidDepth: { value: DEFAULT_VOID_EFFECT_TUNING.voidDepth },
      moteDensity: { value: DEFAULT_VOID_EFFECT_TUNING.moteDensity },
      moteSize: { value: DEFAULT_VOID_EFFECT_TUNING.moteSize },
      pulse: { value: DEFAULT_VOID_EFFECT_TUNING.pulse },
      glow: { value: DEFAULT_VOID_EFFECT_TUNING.glow },
      instability: { value: DEFAULT_VOID_EFFECT_TUNING.instability },
      panFollow: { value: DEFAULT_VOID_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_VOID_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_VOID_EFFECT_TUNING.baseAlpha },
      backgroundColor: { value: new THREE.Color(DEFAULT_VOID_EFFECT_TUNING.backgroundColor) },
      tendrilColor: { value: new THREE.Color(DEFAULT_VOID_EFFECT_TUNING.tendrilColor) },
      voidColor: { value: new THREE.Color(DEFAULT_VOID_EFFECT_TUNING.voidColor) },
      accentColor: { value: new THREE.Color(DEFAULT_VOID_EFFECT_TUNING.accentColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      effectSize: { value: new THREE.Vector2(1, 1) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float tendrilScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float tendrilDensity;
      uniform float tendrilWidth;
      uniform float curl;
      uniform float reach;
      uniform float voidDepth;
      uniform float moteDensity;
      uniform float moteSize;
      uniform float pulse;
      uniform float glow;
      uniform float instability;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 backgroundColor;
      uniform vec3 tendrilColor;
      uniform vec3 voidColor;
      uniform vec3 accentColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform vec2 effectSize;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.03;
          amplitude *= 0.52;
        }
        return total;
      }

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float tendrilLayer(vec2 uv, vec2 centered, float localTime, float seedOffset) {
        vec2 curlUv = uv;
        float swirl = atan(centered.y, centered.x);
        float radius = length(centered);
        curlUv += vec2(cos(swirl * (2.2 + curl * 4.4) - radius * 5.0 + localTime * 0.7), sin(swirl * (1.6 + curl * 3.2) + radius * 4.0 - localTime * 0.5)) * curl * 0.42;
        float coarse = fbm(curlUv * 0.8 + vec2(seedOffset, localTime * 0.12));
        float fine = fbm(curlUv * 2.2 - vec2(localTime * 0.09, seedOffset * 1.4));
        curlUv += vec2(coarse - 0.5, fine - 0.5) * instability * 0.92;

        float lanes = mix(2.2, 9.5, tendrilDensity);
        float path = curlUv.x * lanes + sin(curlUv.y * (2.2 + tendrilScale * 0.22) + localTime * 2.1 + seedOffset) * (0.18 + curl * 0.64);
        path += fbm(curlUv * (1.8 + tendrilScale * 0.16) + seedOffset) * (0.8 + instability * 1.6);
        float strandWidth = mix(0.04, 0.18, tendrilWidth);
        float strand = 1.0 - smoothstep(0.018, strandWidth, abs(fract(path) - 0.5));
        float broken = smoothstep(0.18, 0.9, fbm(curlUv * vec2(3.2, 6.8) + vec2(localTime * 0.18, seedOffset)));
        float reachMask = smoothstep(0.72 + reach * 0.22, 0.02, radius);
        float tipFlicker = 0.65 + 0.35 * sin(localTime * 4.2 + seedOffset + coarse * 5.0);
        float core = pow(strand, mix(1.8, 0.72, tendrilWidth));
        return core * broken * reachMask * tipFlicker;
      }

      float voidPocket(vec2 centered, vec2 uv, float localTime) {
        float radius = length(centered);
        float ringWarp = fbm(uv * (1.3 + tendrilScale * 0.09) + vec2(localTime * 0.05, -localTime * 0.04));
        float depth = smoothstep(0.82, 0.08, radius + (ringWarp - 0.5) * voidDepth * 0.42);
        float pits = smoothstep(0.62, 1.0, fbm(uv * 2.4 - vec2(localTime * 0.08, 7.0))) * voidDepth;
        return clamp(depth * (0.58 + voidDepth * 0.55) + pits * 0.24, 0.0, 1.0);
      }

      float motes(vec2 uv, float localTime) {
        float density = mix(2.0, 16.0, moteDensity);
        vec2 grid = uv * density;
        vec2 cell = floor(grid);
        float seed = randomValue(cell);
        vec2 drift = vec2(sin(localTime * (0.6 + seed) + seed * 9.0), cos(localTime * (0.48 + seed) + seed * 13.0)) * 0.2;
        vec2 local = fract(grid) - 0.5 - drift;
        float visible = step(1.0 - moteDensity, seed) * smoothstep(0.02, 0.12, moteDensity);
        float normalizedSize = clamp(moteSize / 5.0, 0.0, 1.0);
        float core = smoothstep(mix(0.045, 0.18, normalizedSize), 0.0, length(local));
        float halo = smoothstep(mix(0.16, 0.42, normalizedSize), 0.0, length(local)) * 0.28 * glow;
        return (core + halo) * visible;
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 size = max(effectSize, vec2(1.0));
        vec2 localCoord = (worldCoord - effectOrigin) / size;
        vec2 centered = localCoord - 0.5;
        centered.x *= size.x / max(size.y, 1.0);
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = anchoredCoord / 150.0 * zoomFactor;
        vec2 flowUv = vec2(dot(uv, direction), dot(uv, perpendicular));
        float localTime = time * speed;
        flowUv.x += localTime * 0.22;

        float pocket = voidPocket(centered, flowUv, localTime);
        float tendrilA = tendrilLayer(flowUv * max(0.25, tendrilScale / 5.0), centered, localTime, 6.2);
        float tendrilB = tendrilLayer(rotate2d(1.12) * flowUv.yx * max(0.25, tendrilScale / 6.0), centered.yx, localTime * 0.82 + 3.0, 19.4) * 0.68;
        float mote = motes(localCoord * (1.4 + tendrilScale * 0.08) + vec2(localTime * 0.04, -localTime * 0.05), localTime) * moteDensity;
        float pulseWave = 0.76 + 0.24 * sin(localTime * 6.2831 + fbm(flowUv * 0.5) * 5.0) * pulse;
        float tendrils = clamp((tendrilA + tendrilB) * pulseWave, 0.0, 1.0);
        float energy = clamp(tendrils * (0.94 + glow * 0.55) + mote * 0.86 + pocket * baseAlpha * 0.5, 0.0, 1.0);
        vec3 color = mix(backgroundColor, voidColor, pocket * voidDepth);
        color = mix(color, tendrilColor, clamp(tendrils * (1.1 + glow * 0.55), 0.0, 1.0));
        color = mix(color, accentColor, clamp(mote + smoothstep(0.66, 1.0, energy) * glow * 0.5, 0.0, 1.0));
        float alpha = (baseAlpha * 0.6 + pocket * voidDepth * 0.42 + tendrils * (0.68 + glow * 0.52) + mote * 0.42) * opacity;
        alpha *= smoothstep(0.015, 0.12, energy + baseAlpha + pocket * 0.32);
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateVoidMaterialTuning(material: THREE.ShaderMaterial, tuning: VoidEffectTuning) {
  material.uniforms.tendrilScale.value = tuning.tendrilScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.tendrilDensity.value = tuning.tendrilDensity;
  material.uniforms.tendrilWidth.value = tuning.tendrilWidth;
  material.uniforms.curl.value = tuning.curl;
  material.uniforms.reach.value = tuning.reach;
  material.uniforms.voidDepth.value = tuning.voidDepth;
  material.uniforms.moteDensity.value = tuning.moteDensity;
  material.uniforms.moteSize.value = tuning.moteSize;
  material.uniforms.pulse.value = tuning.pulse;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.instability.value = tuning.instability;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.backgroundColor.value.set(tuning.backgroundColor);
  material.uniforms.tendrilColor.value.set(tuning.tendrilColor);
  material.uniforms.voidColor.value.set(tuning.voidColor);
  material.uniforms.accentColor.value.set(tuning.accentColor);
}

function createNatureMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      vineScale: { value: DEFAULT_NATURE_EFFECT_TUNING.vineScale },
      speed: { value: DEFAULT_NATURE_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_NATURE_EFFECT_TUNING.directionDegrees) },
      vineDensity: { value: DEFAULT_NATURE_EFFECT_TUNING.vineDensity },
      vineWidth: { value: DEFAULT_NATURE_EFFECT_TUNING.vineWidth },
      vineBrightness: { value: DEFAULT_NATURE_EFFECT_TUNING.vineBrightness },
      curl: { value: DEFAULT_NATURE_EFFECT_TUNING.curl },
      thornDensity: { value: DEFAULT_NATURE_EFFECT_TUNING.thornDensity },
      thornSize: { value: DEFAULT_NATURE_EFFECT_TUNING.thornSize },
      thornBrightness: { value: DEFAULT_NATURE_EFFECT_TUNING.thornBrightness },
      thornIrregularity: { value: DEFAULT_NATURE_EFFECT_TUNING.thornIrregularity },
      leafDensity: { value: DEFAULT_NATURE_EFFECT_TUNING.leafDensity },
      leafSize: { value: DEFAULT_NATURE_EFFECT_TUNING.leafSize },
      leafSharpness: { value: DEFAULT_NATURE_EFFECT_TUNING.leafSharpness },
      growth: { value: DEFAULT_NATURE_EFFECT_TUNING.growth },
      glow: { value: DEFAULT_NATURE_EFFECT_TUNING.glow },
      instability: { value: DEFAULT_NATURE_EFFECT_TUNING.instability },
      panFollow: { value: DEFAULT_NATURE_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_NATURE_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_NATURE_EFFECT_TUNING.baseAlpha },
      soilColor: { value: new THREE.Color(DEFAULT_NATURE_EFFECT_TUNING.soilColor) },
      vineColor: { value: new THREE.Color(DEFAULT_NATURE_EFFECT_TUNING.vineColor) },
      leafColor: { value: new THREE.Color(DEFAULT_NATURE_EFFECT_TUNING.leafColor) },
      thornColor: { value: new THREE.Color(DEFAULT_NATURE_EFFECT_TUNING.thornColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      effectSize: { value: new THREE.Vector2(1, 1) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float vineScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float vineDensity;
      uniform float vineWidth;
      uniform float vineBrightness;
      uniform float curl;
      uniform float thornDensity;
      uniform float thornSize;
      uniform float thornBrightness;
      uniform float thornIrregularity;
      uniform float leafDensity;
      uniform float leafSize;
      uniform float leafSharpness;
      uniform float growth;
      uniform float glow;
      uniform float instability;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 soilColor;
      uniform vec3 vineColor;
      uniform vec3 leafColor;
      uniform vec3 thornColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform vec2 effectSize;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.04;
          amplitude *= 0.52;
        }
        return total;
      }

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float vineLayer(vec2 uv, float localTime, float seedOffset) {
        vec2 warped = uv;
        float broad = fbm(warped * 0.58 + vec2(seedOffset, localTime * 0.08));
        float fine = fbm(warped * 1.9 - vec2(localTime * 0.04, seedOffset));
        warped += vec2(broad - 0.5, fine - 0.5) * (0.32 + instability * 0.95);
        warped += vec2(sin(warped.y * (2.0 + curl * 5.0) + localTime * 0.9 + seedOffset), cos(warped.x * (1.8 + curl * 4.2) - localTime * 0.7)) * curl * 0.26;
        float lanes = mix(2.0, 10.0, vineDensity);
        float path = warped.x * lanes + sin(warped.y * (2.8 + vineScale * 0.18) + seedOffset + localTime * 1.1) * (0.16 + curl * 0.5);
        path += fbm(warped * (1.4 + vineScale * 0.12) + seedOffset) * (0.5 + instability);
        float width = mix(0.035, 0.17, vineWidth);
        float strand = 1.0 - smoothstep(0.015, width, abs(fract(path) - 0.5));
        float segment = smoothstep(0.16, 0.86, fbm(warped * vec2(2.5, 7.5) + vec2(localTime * 0.12, seedOffset)));
        float growthWave = mix(0.72, 1.0, growth) + sin(localTime * 5.0 + broad * 6.0) * 0.12 * growth;
        return pow(strand, mix(1.7, 0.68, vineWidth)) * segment * growthWave;
      }

      float pointedLeafMask(vec2 point, float sharpness) {
        float lengthLimit = 1.0 - smoothstep(0.86, 1.0, abs(point.y));
        float bladeWidth = (1.0 - pow(abs(point.y), mix(1.25, 0.62, sharpness))) * mix(0.42, 0.28, sharpness);
        float blade = 1.0 - smoothstep(bladeWidth, bladeWidth + mix(0.08, 0.018, sharpness), abs(point.x));
        float vein = (1.0 - smoothstep(0.006, 0.018, abs(point.x))) * (1.0 - smoothstep(0.2, 0.92, abs(point.y)));
        return clamp(blade * lengthLimit + vein * 0.12 * sharpness, 0.0, 1.0);
      }

      float triangleThornMask(vec2 point) {
        float spine = smoothstep(0.0, 0.08, point.y) * (1.0 - smoothstep(0.72, 1.0, point.y));
        float halfWidth = (1.0 - point.y) * 0.36;
        float body = 1.0 - smoothstep(halfWidth, halfWidth + 0.035, abs(point.x));
        return clamp(body * spine, 0.0, 1.0);
      }

      float leafField(vec2 uv, float vineMask, float localTime) {
        float field = 0.0;
        float cells = mix(2.2, 7.0, leafDensity) * mix(0.62, 1.16, leafSize);
        for (int layer = 0; layer < 3; layer++) {
          float layerSeed = float(layer) * 29.37;
          vec2 layerUv = rotate2d(float(layer) * 1.91 + 0.28) * uv * (cells + float(layer) * 0.83);
          vec2 cell = floor(layerUv);
          vec2 fraction = fract(layerUv);
          float seed = randomValue(cell + layerSeed);
          float placed = smoothstep(0.82 - leafDensity * 0.64, 0.98, seed);
          vec2 jitter = vec2(randomValue(cell + vec2(7.1, layerSeed)), randomValue(cell + vec2(13.9, layerSeed))) - 0.5;
          vec2 center = vec2(0.5) + jitter * mix(0.18, 0.42, instability);
          vec2 localPoint = fraction - center;
          float angle = randomValue(cell + vec2(23.7, layerSeed)) * 6.2831853 + directionRadians + (randomValue(cell + vec2(5.0, 9.0)) - 0.5) * 1.5;
          localPoint = rotate2d(angle) * localPoint;
          localPoint /= vec2(mix(0.12, 0.28, leafSize), mix(0.24, 0.56, leafSize));
          float leaf = pointedLeafMask(localPoint, leafSharpness);
          float veinBreakup = smoothstep(0.2, 0.92, fbm((cell + fraction) * 1.7 + layerSeed + localTime * 0.03));
          field = max(field, leaf * placed * veinBreakup);
        }
        return field * smoothstep(0.05, 0.34, vineMask + leafDensity * 0.52);
      }

      float thornField(vec2 uv, float vineMask, float localTime) {
        float field = 0.0;
        float cells = mix(3.2, 10.5, thornDensity) * mix(0.84, 1.28, thornSize);
        for (int layer = 0; layer < 3; layer++) {
          float layerSeed = float(layer) * 41.19;
          vec2 layerUv = rotate2d(float(layer) * 2.17 - 0.34) * uv * (cells + float(layer) * 1.15);
          vec2 cell = floor(layerUv);
          vec2 fraction = fract(layerUv);
          float seed = randomValue(cell + vec2(layerSeed, 6.0));
          float placed = smoothstep(0.86 - thornDensity * 0.66, 0.99, seed);
          vec2 jitter = vec2(randomValue(cell + vec2(2.3, layerSeed)), randomValue(cell + vec2(19.4, layerSeed))) - 0.5;
          vec2 center = vec2(0.5) + jitter * mix(0.12, 0.46, thornIrregularity);
          vec2 localPoint = fraction - center;
          float angle = randomValue(cell + vec2(31.0, layerSeed)) * 6.2831853 + (randomValue(cell + vec2(8.0, 14.0)) - 0.5) * thornIrregularity * 1.8;
          localPoint = rotate2d(angle) * localPoint;
          localPoint /= vec2(mix(0.045, 0.13, thornSize), mix(0.13, 0.34, thornSize));
          float thorn = triangleThornMask(localPoint);
          float breakup = smoothstep(0.12, 0.78, fbm((cell + fraction) * 1.2 + layerSeed - localTime * 0.02));
          field = max(field, thorn * placed * breakup);
        }
        return field * smoothstep(0.04, 0.28, vineMask + thornDensity * 0.48);
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 size = max(effectSize, vec2(1.0));
        vec2 effectCenter = effectOrigin + size * 0.5;
        vec2 effectScreenCenter = cameraOffset + effectCenter * zoomBase;
        vec2 anchoredCoord = mix(screenCoord - effectScreenCenter, worldCoord - effectCenter, panFollow);
        vec2 localCoord = (worldCoord - effectOrigin) / size;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = anchoredCoord / 150.0 * zoomFactor;
        vec2 flowUv = vec2(dot(uv, direction), dot(uv, perpendicular));
        float localTime = time * speed;
        flowUv.x += localTime * 0.16 * growth;

        float scale = max(0.25, vineScale / 5.0);
        float vineA = vineLayer(flowUv * scale, localTime, 4.7);
        float vineB = vineLayer(rotate2d(1.42) * flowUv.yx * max(0.25, vineScale / 6.5), localTime * 0.82 + 2.3, 17.9) * 0.72;
        float vines = clamp(vineA + vineB, 0.0, 1.0);
        float leaves = leafField(flowUv * max(0.22, vineScale / 5.8) + vec2(localTime * 0.025, -localTime * 0.018), vines, localTime) * leafDensity;
        float thorns = thornField(flowUv * max(0.25, vineScale / 5.5), vines, localTime) * thornDensity;
        float ground = fbm(flowUv * 0.48 + vec2(localTime * 0.03, 6.0));
        float energy = clamp(vines * vineBrightness * (0.92 + vineWidth * 0.42) + leaves * 1.15 + thorns * 1.25 + ground * baseAlpha * 0.42, 0.0, 1.0);
        vec3 color = mix(soilColor, vineColor, clamp(vines * vineBrightness * (1.05 + glow * 0.32), 0.0, 1.0));
        color = mix(color, leafColor, clamp(leaves * (1.28 + glow * 0.42), 0.0, 1.0));
        float thornStrength = clamp(thorns * thornBrightness * 2.2, 0.0, 1.0);
        color = mix(color, thornColor, thornStrength);
        color += vineColor * glow * smoothstep(0.56, 1.0, vines) * 0.22;
        color += leafColor * glow * smoothstep(0.72, 1.0, vines + leaves) * 0.16;
        float alpha = (baseAlpha * 0.68 + vines * vineBrightness * (0.76 + vineWidth * 0.46) + leaves * 0.7 + thorns * thornBrightness * 1.05 + ground * baseAlpha * 0.24) * opacity;
        alpha *= smoothstep(0.02, 0.12, energy + baseAlpha);
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateNatureMaterialTuning(material: THREE.ShaderMaterial, tuning: NatureEffectTuning) {
  material.uniforms.vineScale.value = tuning.vineScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.vineDensity.value = tuning.vineDensity;
  material.uniforms.vineWidth.value = tuning.vineWidth;
  material.uniforms.vineBrightness.value = tuning.vineBrightness;
  material.uniforms.curl.value = tuning.curl;
  material.uniforms.thornDensity.value = tuning.thornDensity;
  material.uniforms.thornSize.value = tuning.thornSize;
  material.uniforms.thornBrightness.value = tuning.thornBrightness;
  material.uniforms.thornIrregularity.value = tuning.thornIrregularity;
  material.uniforms.leafDensity.value = tuning.leafDensity;
  material.uniforms.leafSize.value = tuning.leafSize;
  material.uniforms.leafSharpness.value = tuning.leafSharpness;
  material.uniforms.growth.value = tuning.growth;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.instability.value = tuning.instability;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.soilColor.value.set(tuning.soilColor);
  material.uniforms.vineColor.value.set(tuning.vineColor);
  material.uniforms.leafColor.value.set(tuning.leafColor);
  material.uniforms.thornColor.value.set(tuning.thornColor);
}

function createRadiantMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      rayScale: { value: DEFAULT_RADIANT_EFFECT_TUNING.rayScale },
      speed: { value: DEFAULT_RADIANT_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_RADIANT_EFFECT_TUNING.directionDegrees) },
      rayDensity: { value: DEFAULT_RADIANT_EFFECT_TUNING.rayDensity },
      rayBreakup: { value: DEFAULT_RADIANT_EFFECT_TUNING.rayBreakup },
      raySpread: { value: DEFAULT_RADIANT_EFFECT_TUNING.raySpread },
      rayDistance: { value: DEFAULT_RADIANT_EFFECT_TUNING.rayDistance },
      moteDensity: { value: DEFAULT_RADIANT_EFFECT_TUNING.moteDensity },
      moteSize: { value: DEFAULT_RADIANT_EFFECT_TUNING.moteSize },
      shimmer: { value: DEFAULT_RADIANT_EFFECT_TUNING.shimmer },
      bloom: { value: DEFAULT_RADIANT_EFFECT_TUNING.bloom },
      streakWidth: { value: DEFAULT_RADIANT_EFFECT_TUNING.streakWidth },
      pulse: { value: DEFAULT_RADIANT_EFFECT_TUNING.pulse },
      panFollow: { value: DEFAULT_RADIANT_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_RADIANT_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_RADIANT_EFFECT_TUNING.baseAlpha },
      backgroundColor: { value: new THREE.Color(DEFAULT_RADIANT_EFFECT_TUNING.backgroundColor) },
      rayColor: { value: new THREE.Color(DEFAULT_RADIANT_EFFECT_TUNING.rayColor) },
      coreColor: { value: new THREE.Color(DEFAULT_RADIANT_EFFECT_TUNING.coreColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      effectSize: { value: new THREE.Vector2(1, 1) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float rayScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float rayDensity;
      uniform float rayBreakup;
      uniform float raySpread;
      uniform float rayDistance;
      uniform float moteDensity;
      uniform float moteSize;
      uniform float shimmer;
      uniform float bloom;
      uniform float streakWidth;
      uniform float pulse;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 backgroundColor;
      uniform vec3 rayColor;
      uniform vec3 coreColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform vec2 effectSize;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.04;
          amplitude *= 0.52;
        }
        return total;
      }

      float starMote(vec2 uv, float localTime) {
        vec2 driftUv = uv + vec2(localTime * 0.08, -localTime * 0.03);
        vec2 grid = driftUv * mix(2.0, 18.0, moteDensity);
        vec2 cell = floor(grid);
        float seed = randomValue(cell);
        vec2 offset = vec2(randomValue(cell + vec2(17.0, 3.0)), randomValue(cell + vec2(41.0, 11.0))) - 0.5;
        vec2 local = fract(grid) - 0.5 - offset * 0.82;
        float visible = step(1.0 - moteDensity, seed) * smoothstep(0.0, 0.08, moteDensity);
        float radius = length(local);
        float normalizedMoteSize = clamp(moteSize / 5.0, 0.0, 1.0);
        float core = smoothstep(mix(0.04, 0.28, normalizedMoteSize), 0.0, radius);
        float armWidth = mix(0.012, 0.09, normalizedMoteSize);
        float armLength = mix(0.18, 0.68, normalizedMoteSize);
        float arms = max(smoothstep(armWidth, 0.0, abs(local.x)) * smoothstep(armLength, 0.02, abs(local.y)), smoothstep(armWidth, 0.0, abs(local.y)) * smoothstep(armLength, 0.02, abs(local.x)));
        float twinkle = 0.55 + 0.45 * sin(localTime * (2.0 + seed * 5.0) + seed * 18.0);
        return max(core, arms * 0.52) * visible * twinkle;
      }

      float radiantRays(vec2 centeredLocal, float localTime) {
        vec2 edgeDirection = normalize(vec2(cos(directionRadians), sin(directionRadians)));
        vec2 inwardDirection = -edgeDirection;
        float edgeScale = min(0.5 / max(abs(edgeDirection.x), 0.0001), 0.5 / max(abs(edgeDirection.y), 0.0001));
        vec2 edgePoint = edgeDirection * edgeScale;
        vec2 sourcePoint = edgePoint + edgeDirection * mix(0.02, 0.92, rayDistance);
        vec2 fromSource = centeredLocal - sourcePoint;
        float distanceFromSource = max(length(fromSource), 0.001);
        vec2 fragmentDirection = fromSource / distanceFromSource;
        float signedAngle = atan(inwardDirection.x * fragmentDirection.y - inwardDirection.y * fragmentDirection.x, dot(inwardDirection, fragmentDirection));
        float coneWidth = mix(0.08, 1.36, raySpread);
        float coneMask = smoothstep(coneWidth, coneWidth * 0.18, abs(signedAngle));
        float rayCount = mix(1.0, 36.0, rayScale / 20.0);
        float rayCoord = ((signedAngle / coneWidth) * 0.5 + 0.5) * rayCount;
        float rayIndex = floor(rayCoord);
        float localRay = fract(rayCoord);
        float seed = randomValue(vec2(rayIndex, 7.0));
        float rayCenter = mix(0.18, 0.82, seed);
        float normalizedRayWidth = clamp(streakWidth / 5.0, 0.0, 1.0);
        float width = mix(0.018, 0.42, normalizedRayWidth);
        float ray = smoothstep(width, 0.0, abs(localRay - rayCenter));
        float rayStrength = mix(0.14, 1.0, rayDensity) * mix(0.65, 1.25, randomValue(vec2(rayIndex, 19.0)));
        float segmentIndex = floor(distanceFromSource * mix(3.0, 16.0, rayBreakup));
        float segmentSeed = randomValue(vec2(rayIndex, segmentIndex));
        float segmentMask = mix(1.0, smoothstep(0.18, 0.92, segmentSeed), rayBreakup);
        float shimmerOffset = fbm(vec2(rayIndex * 0.31, distanceFromSource * 2.7) + vec2(localTime * 0.06, 4.0));
        float shimmerMask = mix(1.0, mix(0.72, 1.18, shimmerOffset), shimmer);
        float distanceFade = smoothstep(0.02, 0.16, distanceFromSource) * smoothstep(1.68, 0.34, distanceFromSource);
        return ray * rayStrength * segmentMask * shimmerMask * coneMask * distanceFade;
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 size = max(effectSize, vec2(1.0));
        vec2 localCoord = (worldCoord - effectOrigin) / size;
        vec2 centeredLocal = localCoord - 0.5;
        vec2 pixelUv = anchoredCoord / 180.0 * zoomFactor;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        vec2 uv = vec2(dot(pixelUv, direction), dot(pixelUv, perpendicular));
        float localTime = time * speed;
        uv.x += localTime * 0.42;

        float rays = radiantRays(centeredLocal, localTime);
        float wash = fbm(uv * 0.62 + vec2(localTime * 0.06, localTime * 0.02));
        float bloomField = smoothstep(0.42, 1.0, wash) * bloom;
        float pulseWave = 0.75 + sin(localTime * 6.2831 + wash * 5.0) * 0.25 * pulse;
        float motes = starMote(localCoord * mix(1.2, 3.6, moteDensity), localTime) * moteDensity;
        float energy = clamp(rays * (0.68 + bloom * 0.34) * pulseWave + bloomField * 0.58 + motes * 0.92, 0.0, 1.0);
        vec3 color = mix(backgroundColor, rayColor, energy);
        color = mix(color, coreColor, smoothstep(0.55, 1.0, energy) * (0.55 + bloom * 0.45));
        float alpha = (max(baseAlpha * 0.5, 0.07) + energy * (0.72 + bloom * 0.48)) * opacity;
        alpha *= mix(0.48, 1.0, smoothstep(0.01, 0.12, energy + baseAlpha * 0.42));
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateRadiantMaterialTuning(material: THREE.ShaderMaterial, tuning: RadiantEffectTuning) {
  material.uniforms.rayScale.value = tuning.rayScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.rayDensity.value = tuning.rayDensity;
  material.uniforms.rayBreakup.value = tuning.rayBreakup;
  material.uniforms.raySpread.value = tuning.raySpread;
  material.uniforms.rayDistance.value = tuning.rayDistance;
  material.uniforms.moteDensity.value = tuning.moteDensity;
  material.uniforms.moteSize.value = tuning.moteSize;
  material.uniforms.shimmer.value = tuning.shimmer;
  material.uniforms.bloom.value = tuning.bloom;
  material.uniforms.streakWidth.value = tuning.streakWidth;
  material.uniforms.pulse.value = tuning.pulse;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.backgroundColor.value.set(tuning.backgroundColor);
  material.uniforms.rayColor.value.set(tuning.rayColor);
  material.uniforms.coreColor.value.set(tuning.coreColor);
}

function createForceFieldMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      fieldScale: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.fieldScale },
      speed: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_FORCE_FIELD_EFFECT_TUNING.directionDegrees) },
      gridDensity: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.gridDensity },
      gridWarp: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.gridWarp },
      rippleStrength: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.rippleStrength },
      rippleFrequency: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.rippleFrequency },
      edgeStrength: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.edgeStrength },
      pulse: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.pulse },
      glow: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.glow },
      refraction: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.refraction },
      panFollow: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_FORCE_FIELD_EFFECT_TUNING.baseAlpha },
      backgroundColor: { value: new THREE.Color(DEFAULT_FORCE_FIELD_EFFECT_TUNING.backgroundColor) },
      gridColor: { value: new THREE.Color(DEFAULT_FORCE_FIELD_EFFECT_TUNING.gridColor) },
      edgeColor: { value: new THREE.Color(DEFAULT_FORCE_FIELD_EFFECT_TUNING.edgeColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      effectSize: { value: new THREE.Vector2(1, 1) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float fieldScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float gridDensity;
      uniform float gridWarp;
      uniform float rippleStrength;
      uniform float rippleFrequency;
      uniform float edgeStrength;
      uniform float pulse;
      uniform float glow;
      uniform float refraction;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 backgroundColor;
      uniform vec3 gridColor;
      uniform vec3 edgeColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform vec2 effectSize;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.03;
          amplitude *= 0.52;
        }
        return total;
      }

      float lineMask(float value, float width) {
        return smoothstep(width, 0.0, abs(fract(value) - 0.5));
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 size = max(effectSize, vec2(1.0));
        vec2 localCoord = (worldCoord - effectOrigin) / size;
        vec2 centered = localCoord - 0.5;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        float localTime = time * speed;
        vec2 uv = anchoredCoord / 150.0 * zoomFactor;
        vec2 fieldUv = vec2(dot(uv, direction), dot(uv, perpendicular));
        fieldUv.x += localTime * 0.45;

        float warpA = fbm(fieldUv * 0.34 + vec2(localTime * 0.08, 7.0));
        float warpB = fbm(fieldUv.yx * 0.42 + vec2(13.0, -localTime * 0.06));
        vec2 warped = fieldUv + vec2(warpA - 0.5, warpB - 0.5) * gridWarp * 1.8;
        float density = mix(3.0, 18.0, gridDensity) * max(0.25, fieldScale / 5.0);
        vec2 gridUv = warped * density;
        float gridLines = max(lineMask(gridUv.x, 0.025 + glow * 0.035), lineMask(gridUv.y, 0.025 + glow * 0.035));
        vec2 diagonalUv = vec2(gridUv.x + gridUv.y, gridUv.x - gridUv.y) * 0.5;
        float diagonalLines = max(lineMask(diagonalUv.x, 0.018 + glow * 0.02), lineMask(diagonalUv.y, 0.018 + glow * 0.02));

        float radial = length(centered);
        float ripple = sin((radial * mix(18.0, 72.0, rippleFrequency)) - localTime * 8.0 + fbm(centered * 5.0) * 2.0);
        float rippleMask = smoothstep(0.72, 1.0, ripple) * rippleStrength;
        float edgeDistance = max(abs(centered.x), abs(centered.y));
        float rim = smoothstep(0.5, 0.34, edgeDistance) * smoothstep(0.26, 0.5, edgeDistance);
        float rimPulse = 0.72 + sin(localTime * 6.2831 + radial * 8.0) * 0.28 * pulse;
        float rimEnergy = rim * edgeStrength * rimPulse;
        float shimmer = fbm(warped * 1.4 + vec2(localTime * 0.18, -localTime * 0.09));
        float refract = smoothstep(0.38, 1.0, shimmer) * refraction;
        float energy = clamp((gridLines * 0.72 + diagonalLines * 0.34) * mix(0.45, 1.15, gridDensity) + rippleMask * 0.74 + rimEnergy + refract * 0.44, 0.0, 1.0);
        vec3 color = mix(backgroundColor, gridColor, clamp(gridLines + diagonalLines + rippleMask + refract, 0.0, 1.0));
        color = mix(color, edgeColor, clamp(rimEnergy + energy * glow * 0.35, 0.0, 1.0));
        float alpha = (baseAlpha * 0.42 + energy * (0.56 + glow * 0.48)) * opacity;
        alpha *= smoothstep(0.02, 0.12, energy + baseAlpha);
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateForceFieldMaterialTuning(material: THREE.ShaderMaterial, tuning: ForceFieldEffectTuning) {
  material.uniforms.fieldScale.value = tuning.fieldScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.gridDensity.value = tuning.gridDensity;
  material.uniforms.gridWarp.value = tuning.gridWarp;
  material.uniforms.rippleStrength.value = tuning.rippleStrength;
  material.uniforms.rippleFrequency.value = tuning.rippleFrequency;
  material.uniforms.edgeStrength.value = tuning.edgeStrength;
  material.uniforms.pulse.value = tuning.pulse;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.refraction.value = tuning.refraction;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.backgroundColor.value.set(tuning.backgroundColor);
  material.uniforms.gridColor.value.set(tuning.gridColor);
  material.uniforms.edgeColor.value.set(tuning.edgeColor);
}

function createShockwaveMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      ringScale: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.ringScale },
      speed: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_SHOCKWAVE_EFFECT_TUNING.directionDegrees) },
      ringCount: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.ringCount },
      ringWidth: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.ringWidth },
      ringSharpness: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.ringSharpness },
      distortion: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.distortion },
      turbulence: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.turbulence },
      centerStrength: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.centerStrength },
      fade: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.fade },
      pulse: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.pulse },
      glow: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.glow },
      panFollow: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_SHOCKWAVE_EFFECT_TUNING.baseAlpha },
      backgroundColor: { value: new THREE.Color(DEFAULT_SHOCKWAVE_EFFECT_TUNING.backgroundColor) },
      ringColor: { value: new THREE.Color(DEFAULT_SHOCKWAVE_EFFECT_TUNING.ringColor) },
      coreColor: { value: new THREE.Color(DEFAULT_SHOCKWAVE_EFFECT_TUNING.coreColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      effectSize: { value: new THREE.Vector2(1, 1) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float ringScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float ringCount;
      uniform float ringWidth;
      uniform float ringSharpness;
      uniform float distortion;
      uniform float turbulence;
      uniform float centerStrength;
      uniform float fade;
      uniform float pulse;
      uniform float glow;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 backgroundColor;
      uniform vec3 ringColor;
      uniform vec3 coreColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform vec2 effectSize;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.04;
          amplitude *= 0.52;
        }
        return total;
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 size = max(effectSize, vec2(1.0));
        vec2 localCoord = (worldCoord - effectOrigin) / size;
        vec2 centered = localCoord - 0.5;
        vec2 aspect = vec2(size.x / max(size.y, 1.0), 1.0);
        vec2 radialCoord = centered * aspect;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        float localTime = time * speed;
        vec2 uv = anchoredCoord / 160.0 * zoomFactor;
        vec2 driftUv = vec2(dot(uv, direction), dot(uv, perpendicular));
        driftUv.x += localTime * 0.42;

        float angle = atan(radialCoord.y, radialCoord.x);
        float radial = length(radialCoord);
        float angularNoise = fbm(vec2(cos(angle), sin(angle)) * mix(2.0, 8.0, turbulence) + vec2(localTime * 0.08, 4.0));
        float fieldNoise = fbm(driftUv * mix(0.45, 2.2, turbulence) + vec2(9.0, -localTime * 0.15));
        float warpedRadial = radial + (angularNoise - 0.5) * distortion * 0.18 + (fieldNoise - 0.5) * distortion * 0.12;
        float ringFrequency = mix(3.0, 18.0, ringCount) * max(0.25, ringScale / 6.0);
        float phase = warpedRadial * ringFrequency - localTime * mix(1.2, 5.6, speed);
        float ringDistance = abs(fract(phase) - 0.5);
        float ringMask = smoothstep(mix(0.22, 0.02, ringWidth), 0.0, ringDistance);
        ringMask = pow(ringMask, mix(1.8, 0.55, ringSharpness));
        float broken = smoothstep(mix(0.85, 0.35, turbulence), 1.0, fbm(driftUv * 1.35 + vec2(localTime * 0.18, 17.0)));
        ringMask *= mix(1.0, broken, turbulence * 0.72);

        float edgeFade = smoothstep(0.74, mix(0.46, 0.7, fade), radial);
        float centerPulse = smoothstep(mix(0.24, 0.04, centerStrength), 0.0, radial) * centerStrength;
        float pulseWave = 0.72 + sin(localTime * 6.2831 + radial * 12.0) * 0.28 * pulse;
        float energy = clamp((ringMask * edgeFade * pulseWave) + centerPulse + fieldNoise * baseAlpha * 0.62, 0.0, 1.0);
        vec3 color = mix(backgroundColor, ringColor, clamp(ringMask + fieldNoise * baseAlpha, 0.0, 1.0));
        color = mix(color, coreColor, clamp(centerPulse + energy * glow * 0.46, 0.0, 1.0));
        float alpha = (max(baseAlpha * 0.42, 0.06) + energy * (0.68 + glow * 0.62)) * opacity;
        alpha *= mix(0.5, 1.0, smoothstep(0.01, 0.1, energy + baseAlpha * 0.45));
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateShockwaveMaterialTuning(material: THREE.ShaderMaterial, tuning: ShockwaveEffectTuning) {
  material.uniforms.ringScale.value = tuning.ringScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.ringCount.value = tuning.ringCount;
  material.uniforms.ringWidth.value = tuning.ringWidth;
  material.uniforms.ringSharpness.value = tuning.ringSharpness;
  material.uniforms.distortion.value = tuning.distortion;
  material.uniforms.turbulence.value = tuning.turbulence;
  material.uniforms.centerStrength.value = tuning.centerStrength;
  material.uniforms.fade.value = tuning.fade;
  material.uniforms.pulse.value = tuning.pulse;
  material.uniforms.glow.value = tuning.glow;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.backgroundColor.value.set(tuning.backgroundColor);
  material.uniforms.ringColor.value.set(tuning.ringColor);
  material.uniforms.coreColor.value.set(tuning.coreColor);
}

function createDistortionMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      distortionScale: { value: DEFAULT_DISTORTION_EFFECT_TUNING.distortionScale },
      speed: { value: DEFAULT_DISTORTION_EFFECT_TUNING.speed },
      directionRadians: { value: degreesToRadians(DEFAULT_DISTORTION_EFFECT_TUNING.directionDegrees) },
      distortionStrength: { value: DEFAULT_DISTORTION_EFFECT_TUNING.distortionStrength },
      rippleStrength: { value: DEFAULT_DISTORTION_EFFECT_TUNING.rippleStrength },
      rippleFrequency: { value: DEFAULT_DISTORTION_EFFECT_TUNING.rippleFrequency },
      shimmer: { value: DEFAULT_DISTORTION_EFFECT_TUNING.shimmer },
      turbulence: { value: DEFAULT_DISTORTION_EFFECT_TUNING.turbulence },
      causticStrength: { value: DEFAULT_DISTORTION_EFFECT_TUNING.causticStrength },
      edgeStrength: { value: DEFAULT_DISTORTION_EFFECT_TUNING.edgeStrength },
      pulse: { value: DEFAULT_DISTORTION_EFFECT_TUNING.pulse },
      panFollow: { value: DEFAULT_DISTORTION_EFFECT_TUNING.panFollow },
      zoomScale: { value: DEFAULT_DISTORTION_EFFECT_TUNING.zoomScale },
      baseAlpha: { value: DEFAULT_DISTORTION_EFFECT_TUNING.baseAlpha },
      backgroundColor: { value: new THREE.Color(DEFAULT_DISTORTION_EFFECT_TUNING.backgroundColor) },
      distortionColor: { value: new THREE.Color(DEFAULT_DISTORTION_EFFECT_TUNING.distortionColor) },
      highlightColor: { value: new THREE.Color(DEFAULT_DISTORTION_EFFECT_TUNING.highlightColor) },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraOffset: { value: new THREE.Vector2(0, 0) },
      effectOrigin: { value: new THREE.Vector2(0, 0) },
      effectSize: { value: new THREE.Vector2(1, 1) },
      cameraZoom: { value: 1 },
      opacity: { value: opacity }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float distortionScale;
      uniform float speed;
      uniform float directionRadians;
      uniform float distortionStrength;
      uniform float rippleStrength;
      uniform float rippleFrequency;
      uniform float shimmer;
      uniform float turbulence;
      uniform float causticStrength;
      uniform float edgeStrength;
      uniform float pulse;
      uniform float panFollow;
      uniform float zoomScale;
      uniform float baseAlpha;
      uniform vec3 backgroundColor;
      uniform vec3 distortionColor;
      uniform vec3 highlightColor;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 cameraOffset;
      uniform vec2 effectOrigin;
      uniform vec2 effectSize;
      uniform float cameraZoom;
      uniform float opacity;

      float randomValue(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 value) {
        vec2 base = floor(value);
        vec2 fraction = fract(value);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        float a = randomValue(base);
        float b = randomValue(base + vec2(1.0, 0.0));
        float c = randomValue(base + vec2(0.0, 1.0));
        float d = randomValue(base + vec2(1.0, 1.0));
        return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
      }

      float fbm(vec2 value) {
        float total = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          total += valueNoise(value) * amplitude;
          value *= 2.05;
          amplitude *= 0.52;
        }
        return total;
      }

      float bandMask(float value, float width) {
        return smoothstep(width, 0.0, abs(fract(value) - 0.5));
      }

      void main() {
        float zoomBase = max(cameraZoom, 0.01);
        float zoomFactor = pow(zoomBase, zoomScale);
        vec2 screenCoord = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
        vec2 worldCoord = (screenCoord - cameraOffset) / zoomBase;
        vec2 anchoredCoord = mix(screenCoord, worldCoord - effectOrigin, panFollow);
        vec2 size = max(effectSize, vec2(1.0));
        vec2 localCoord = (worldCoord - effectOrigin) / size;
        vec2 centered = localCoord - 0.5;
        vec2 direction = vec2(cos(directionRadians), sin(directionRadians));
        vec2 perpendicular = vec2(-direction.y, direction.x);
        float localTime = time * speed;
        vec2 uv = anchoredCoord / 145.0 * zoomFactor;
        vec2 flowUv = vec2(dot(uv, direction), dot(uv, perpendicular));
        flowUv.x += localTime * 0.34;
        flowUv.y += sin(localTime * 0.77 + flowUv.x * 1.8) * distortionStrength * 0.28;

        float scale = max(0.25, distortionScale / 5.5);
        float warpA = fbm(flowUv * scale + vec2(localTime * 0.09, 3.0));
        float warpB = fbm(flowUv.yx * (scale * 1.27) + vec2(11.0, -localTime * 0.11));
        vec2 warped = flowUv + vec2(warpA - 0.5, warpB - 0.5) * distortionStrength * mix(0.55, 2.2, turbulence);
        float ripple = sin((warped.x + warped.y * 0.42) * mix(4.0, 34.0, rippleFrequency) + localTime * 4.0);
        float rippleMask = smoothstep(0.42, 1.0, ripple) * rippleStrength;
        float haze = fbm(warped * mix(0.65, 2.8, turbulence) + vec2(localTime * 0.18, localTime * 0.05));
        float secondHaze = fbm(warped.yx * mix(1.2, 4.2, shimmer) + vec2(-localTime * 0.12, 19.0));
        float shimmerMask = smoothstep(mix(0.82, 0.42, shimmer), 1.0, haze + secondHaze * 0.55) * shimmer;
        float causticA = bandMask(warped.x * mix(2.0, 12.0, causticStrength) + warpA * 1.5, mix(0.22, 0.045, causticStrength));
        float causticB = bandMask(warped.y * mix(2.0, 10.0, causticStrength) + warpB * 1.7, mix(0.24, 0.055, causticStrength));
        float caustics = max(causticA, causticB) * causticStrength * smoothstep(0.35, 1.0, haze);
        float edgeDistance = max(abs(centered.x), abs(centered.y));
        float edge = smoothstep(0.52, 0.38, edgeDistance) * smoothstep(0.28, 0.5, edgeDistance) * edgeStrength;
        float pulseWave = 0.75 + sin(localTime * 6.2831 + haze * 5.0) * 0.25 * pulse;
        float energy = clamp((haze * distortionStrength * 0.5 + rippleMask * 0.5 + shimmerMask * 0.7 + caustics * 0.86 + edge) * pulseWave, 0.0, 1.0);
        vec3 color = mix(backgroundColor, distortionColor, clamp(haze * distortionStrength + rippleMask + edge, 0.0, 1.0));
        color = mix(color, highlightColor, clamp(shimmerMask + caustics + edge * 0.5, 0.0, 1.0));
        float alpha = (baseAlpha * 0.38 + energy * 0.62) * opacity;
        alpha *= smoothstep(0.02, 0.12, energy + baseAlpha);
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `
  });
}

function updateDistortionMaterialTuning(material: THREE.ShaderMaterial, tuning: DistortionEffectTuning) {
  material.uniforms.distortionScale.value = tuning.distortionScale;
  material.uniforms.speed.value = tuning.speed;
  material.uniforms.directionRadians.value = degreesToRadians(tuning.directionDegrees);
  material.uniforms.distortionStrength.value = tuning.distortionStrength;
  material.uniforms.rippleStrength.value = tuning.rippleStrength;
  material.uniforms.rippleFrequency.value = tuning.rippleFrequency;
  material.uniforms.shimmer.value = tuning.shimmer;
  material.uniforms.turbulence.value = tuning.turbulence;
  material.uniforms.causticStrength.value = tuning.causticStrength;
  material.uniforms.edgeStrength.value = tuning.edgeStrength;
  material.uniforms.pulse.value = tuning.pulse;
  material.uniforms.panFollow.value = 1;
  material.uniforms.zoomScale.value = tuning.zoomScale;
  material.uniforms.baseAlpha.value = tuning.baseAlpha;
  material.uniforms.backgroundColor.value.set(tuning.backgroundColor);
  material.uniforms.distortionColor.value.set(tuning.distortionColor);
  material.uniforms.highlightColor.value.set(tuning.highlightColor);
}
