export interface WaterEffectTuningSettings {
  opacity: number;
  bandScale: number;
  bandWidth: number;
  speed: number;
  directionDegrees: number;
  distortion: number;
  verticalDistortion: number;
  distortionVariation: number;
  bandBreakup: number;
  bandVariation: number;
  bandOverlap: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  highlightAlpha: number;
  deepColor: string;
  waterColor: string;
  highlightColor: string;
}

export const DEFAULT_WATER_EFFECT_TUNING_SETTINGS: WaterEffectTuningSettings = {
  opacity: 0.92,
  bandScale: 3.2,
  bandWidth: 0.16,
  speed: 0.18,
  directionDegrees: 270,
  distortion: 0.04,
  verticalDistortion: 0.055,
  distortionVariation: 0.9,
  bandBreakup: 0.78,
  bandVariation: 1.35,
  bandOverlap: 0.42,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.14,
  highlightAlpha: 0.58,
  deepColor: "#002e4d",
  waterColor: "#008cb8",
  highlightColor: "#ffffff"
};

export interface AcidEffectTuningSettings {
  opacity: number;
  acidScale: number;
  speed: number;
  directionDegrees: number;
  corrosion: number;
  bubbleDensity: number;
  bubbleSize: number;
  streakDensity: number;
  streakWarp: number;
  foam: number;
  glow: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  darkColor: string;
  acidColor: string;
  foamColor: string;
}

export const DEFAULT_ACID_EFFECT_TUNING_SETTINGS: AcidEffectTuningSettings = {
  opacity: 0.84,
  acidScale: 5.6,
  speed: 0.24,
  directionDegrees: 268,
  corrosion: 0.72,
  bubbleDensity: 0.58,
  bubbleSize: 0.56,
  streakDensity: 0.5,
  streakWarp: 0.76,
  foam: 0.5,
  glow: 0.58,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.24,
  darkColor: "#14330b",
  acidColor: "#84cc16",
  foamColor: "#ecfccb"
};

export interface PoisonEffectTuningSettings {
  opacity: number;
  cloudScale: number;
  speed: number;
  directionDegrees: number;
  turbulence: number;
  density: number;
  pocketDensity: number;
  pocketSize: number;
  softness: number;
  drift: number;
  glow: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  shadowColor: string;
  poisonColor: string;
  highlightColor: string;
}

export const DEFAULT_POISON_EFFECT_TUNING_SETTINGS: PoisonEffectTuningSettings = {
  opacity: 0.72,
  cloudScale: 4.8,
  speed: 0.12,
  directionDegrees: 276,
  turbulence: 0.78,
  density: 0.68,
  pocketDensity: 0.54,
  pocketSize: 0.58,
  softness: 0.82,
  drift: 0.62,
  glow: 0.38,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.24,
  shadowColor: "#12300c",
  poisonColor: "#65a30d",
  highlightColor: "#d9f99d"
};

export interface ColdEffectTuningSettings {
  opacity: number;
  frostScale: number;
  speed: number;
  directionDegrees: number;
  veinDensity: number;
  veinWidth: number;
  crystalDensity: number;
  crystalSize: number;
  haze: number;
  shimmer: number;
  glow: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  shadowColor: string;
  frostColor: string;
  highlightColor: string;
}

export const DEFAULT_COLD_EFFECT_TUNING_SETTINGS: ColdEffectTuningSettings = {
  opacity: 0.72,
  frostScale: 5.4,
  speed: 0.08,
  directionDegrees: 286,
  veinDensity: 0.58,
  veinWidth: 0.42,
  crystalDensity: 0.62,
  crystalSize: 0.58,
  haze: 0.36,
  shimmer: 0.5,
  glow: 0.48,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.18,
  shadowColor: "#0f2333",
  frostColor: "#bfdbfe",
  highlightColor: "#ffffff"
};

export interface DarknessEffectTuningSettings {
  opacity: number;
  darknessScale: number;
  speed: number;
  directionDegrees: number;
  depth: number;
  tendrilDensity: number;
  tendrilReach: number;
  edgeSoftness: number;
  wispDensity: number;
  drift: number;
  voidHighlight: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  shadowColor: string;
  voidColor: string;
  highlightColor: string;
}

export const DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS: DarknessEffectTuningSettings = {
  opacity: 0.82,
  darknessScale: 5.2,
  speed: 0.1,
  directionDegrees: 276,
  depth: 0.78,
  tendrilDensity: 0.58,
  tendrilReach: 0.62,
  edgeSoftness: 0.72,
  wispDensity: 0.38,
  drift: 0.62,
  voidHighlight: 0.24,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.34,
  shadowColor: "#111827",
  voidColor: "#020617",
  highlightColor: "#6366f1"
};

export interface LavaEffectTuningSettings {
  opacity: number;
  flowScale: number;
  speed: number;
  directionDegrees: number;
  distortion: number;
  crust: number;
  glow: number;
  ember: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  darkColor: string;
  lavaColor: string;
  hotColor: string;
}

export const DEFAULT_LAVA_EFFECT_TUNING_SETTINGS: LavaEffectTuningSettings = {
  opacity: 0.9,
  flowScale: 5.2,
  speed: 0.42,
  directionDegrees: 270,
  distortion: 0.55,
  crust: 0.48,
  glow: 0.72,
  ember: 0.38,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.42,
  darkColor: "#2a0805",
  lavaColor: "#d84315",
  hotColor: "#ffd166"
};

export interface FireEffectTuningSettings {
  opacity: number;
  flameScale: number;
  speed: number;
  directionDegrees: number;
  turbulence: number;
  tongues: number;
  tongueVariation: number;
  breakup: number;
  flameStretch: number;
  flicker: number;
  ember: number;
  heat: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  emberColor: string;
  flameColor: string;
  hotColor: string;
}

export const DEFAULT_FIRE_EFFECT_TUNING_SETTINGS: FireEffectTuningSettings = {
  opacity: 0.86,
  flameScale: 6.4,
  speed: 0.62,
  directionDegrees: 270,
  turbulence: 0.92,
  tongues: 0.58,
  tongueVariation: 0.86,
  breakup: 0.64,
  flameStretch: 0.58,
  flicker: 0.74,
  ember: 0.34,
  heat: 0.78,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.26,
  emberColor: "#4a1205",
  flameColor: "#f97316",
  hotColor: "#fff2a8"
};

export interface LightningEffectTuningSettings {
  opacity: number;
  arcScale: number;
  speed: number;
  directionDegrees: number;
  boltDensity: number;
  branchiness: number;
  jitter: number;
  glow: number;
  strikeWidth: number;
  segmentBreaks: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  arcColor: string;
  coreColor: string;
}

export const DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS: LightningEffectTuningSettings = {
  opacity: 0.7,
  arcScale: 1,
  speed: 0.21,
  directionDegrees: 18,
  boltDensity: 0.49,
  branchiness: 0.9,
  jitter: 0.91,
  glow: 0.88,
  strikeWidth: 0.67,
  segmentBreaks: 0.33,
  panFollow: 1,
  zoomScale: 1.15,
  baseAlpha: 0.18,
  backgroundColor: "#081226",
  arcColor: "#60a5fa",
  coreColor: "#f8fbff"
};

export interface ArcaneEffectTuningSettings {
  opacity: number;
  glyphScale: number;
  speed: number;
  rotationSpeed: number;
  glyphDensity: number;
  ringDensity: number;
  circleScale: number;
  spokeAmount: number;
  pulse: number;
  drift: number;
  glow: number;
  lineWidth: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  glyphColor: string;
  glowColor: string;
}

export const DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS: ArcaneEffectTuningSettings = {
  opacity: 0.82,
  glyphScale: 4.8,
  speed: 0.24,
  rotationSpeed: 0.28,
  glyphDensity: 0.62,
  ringDensity: 0.58,
  circleScale: 6.5,
  spokeAmount: 0.62,
  pulse: 0.72,
  drift: 0.3,
  glow: 0.74,
  lineWidth: 0.46,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.2,
  backgroundColor: "#14051f",
  glyphColor: "#c084fc",
  glowColor: "#f5d0fe"
};

export interface RadiantEffectTuningSettings {
  opacity: number;
  rayScale: number;
  speed: number;
  directionDegrees: number;
  rayDensity: number;
  rayBreakup: number;
  raySpread: number;
  rayDistance: number;
  moteDensity: number;
  moteSize: number;
  shimmer: number;
  bloom: number;
  streakWidth: number;
  pulse: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  rayColor: string;
  coreColor: string;
}

export const DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS: RadiantEffectTuningSettings = {
  opacity: 0.78,
  rayScale: 4.8,
  speed: 0.18,
  directionDegrees: 270,
  rayDensity: 0.12,
  rayBreakup: 0.55,
  raySpread: 0.18,
  rayDistance: 0.4,
  moteDensity: 0.58,
  moteSize: 2,
  shimmer: 0.62,
  bloom: 0.76,
  streakWidth: 2,
  pulse: 0.5,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.1,
  backgroundColor: "#1c1607",
  rayColor: "#fde68a",
  coreColor: "#fffdf4"
};

export interface ForceFieldEffectTuningSettings {
  opacity: number;
  fieldScale: number;
  speed: number;
  directionDegrees: number;
  gridDensity: number;
  gridWarp: number;
  rippleStrength: number;
  rippleFrequency: number;
  edgeStrength: number;
  pulse: number;
  glow: number;
  refraction: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  gridColor: string;
  edgeColor: string;
}

export const DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS: ForceFieldEffectTuningSettings = {
  opacity: 0.78,
  fieldScale: 5.4,
  speed: 0.22,
  directionDegrees: 278,
  gridDensity: 0.62,
  gridWarp: 0.42,
  rippleStrength: 0.5,
  rippleFrequency: 0.56,
  edgeStrength: 0.78,
  pulse: 0.48,
  glow: 0.74,
  refraction: 0.46,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.2,
  backgroundColor: "#03131f",
  gridColor: "#67e8f9",
  edgeColor: "#d8b4fe"
};

export interface ShockwaveEffectTuningSettings {
  opacity: number;
  ringScale: number;
  speed: number;
  directionDegrees: number;
  ringCount: number;
  ringWidth: number;
  ringSharpness: number;
  distortion: number;
  turbulence: number;
  centerStrength: number;
  fade: number;
  pulse: number;
  glow: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  ringColor: string;
  coreColor: string;
}

export const DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS: ShockwaveEffectTuningSettings = {
  opacity: 0.78,
  ringScale: 6,
  speed: 0.42,
  directionDegrees: 270,
  ringCount: 0.58,
  ringWidth: 0.48,
  ringSharpness: 0.62,
  distortion: 0.45,
  turbulence: 0.42,
  centerStrength: 0.72,
  fade: 0.55,
  pulse: 0.62,
  glow: 0.7,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.12,
  backgroundColor: "#07111f",
  ringColor: "#93c5fd",
  coreColor: "#f8fbff"
};

export interface DistortionEffectTuningSettings {
  opacity: number;
  distortionScale: number;
  speed: number;
  directionDegrees: number;
  distortionStrength: number;
  rippleStrength: number;
  rippleFrequency: number;
  shimmer: number;
  turbulence: number;
  causticStrength: number;
  edgeStrength: number;
  pulse: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  distortionColor: string;
  highlightColor: string;
}

export const DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS: DistortionEffectTuningSettings = {
  opacity: 0.72,
  distortionScale: 5.8,
  speed: 0.24,
  directionDegrees: 270,
  distortionStrength: 0.58,
  rippleStrength: 0.48,
  rippleFrequency: 0.56,
  shimmer: 0.62,
  turbulence: 0.64,
  causticStrength: 0.38,
  edgeStrength: 0.42,
  pulse: 0.32,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.08,
  backgroundColor: "#0f172a",
  distortionColor: "#67e8f9",
  highlightColor: "#f8fafc"
};

export interface ChaosEffectTuningSettings {
  opacity: number;
  chaosScale: number;
  speed: number;
  directionDegrees: number;
  riftDensity: number;
  riftWarp: number;
  moteDensity: number;
  moteSize: number;
  colorShift: number;
  pulse: number;
  glow: number;
  instability: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  riftColor: string;
  moteColor: string;
  accentColor: string;
}

export const DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS: ChaosEffectTuningSettings = {
  opacity: 0.82,
  chaosScale: 5.6,
  speed: 0.38,
  directionDegrees: 260,
  riftDensity: 0.62,
  riftWarp: 0.74,
  moteDensity: 0.58,
  moteSize: 2.2,
  colorShift: 0.7,
  pulse: 0.68,
  glow: 0.76,
  instability: 0.72,
  panFollow: 1,
  zoomScale: 1.15,
  baseAlpha: 0.16,
  backgroundColor: "#16051f",
  riftColor: "#f472b6",
  moteColor: "#67e8f9",
  accentColor: "#facc15"
};

export interface VoidEffectTuningSettings {
  opacity: number;
  tendrilScale: number;
  speed: number;
  directionDegrees: number;
  tendrilDensity: number;
  tendrilWidth: number;
  curl: number;
  reach: number;
  voidDepth: number;
  moteDensity: number;
  moteSize: number;
  pulse: number;
  glow: number;
  instability: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  tendrilColor: string;
  voidColor: string;
  accentColor: string;
}

export const DEFAULT_VOID_EFFECT_TUNING_SETTINGS: VoidEffectTuningSettings = {
  opacity: 0.95,
  tendrilScale: 3.8,
  speed: 0.24,
  directionDegrees: 268,
  tendrilDensity: 0.78,
  tendrilWidth: 0.56,
  curl: 0.82,
  reach: 0.8,
  voidDepth: 0.86,
  moteDensity: 0.36,
  moteSize: 2.4,
  pulse: 0.6,
  glow: 0.9,
  instability: 0.7,
  panFollow: 1,
  zoomScale: 0.8,
  baseAlpha: 0.34,
  backgroundColor: "#05030a",
  tendrilColor: "#a78bfa",
  voidColor: "#02010a",
  accentColor: "#e9d5ff"
};

export interface NatureEffectTuningSettings {
  opacity: number;
  vineScale: number;
  speed: number;
  directionDegrees: number;
  vineDensity: number;
  vineWidth: number;
  vineBrightness: number;
  curl: number;
  thornDensity: number;
  thornSize: number;
  thornBrightness: number;
  thornIrregularity: number;
  leafDensity: number;
  leafSize: number;
  leafSharpness: number;
  growth: number;
  glow: number;
  instability: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  soilColor: string;
  vineColor: string;
  leafColor: string;
  thornColor: string;
}

export const DEFAULT_NATURE_EFFECT_TUNING_SETTINGS: NatureEffectTuningSettings = {
  opacity: 0.95,
  vineScale: 3.4,
  speed: 0.16,
  directionDegrees: 258,
  vineDensity: 0.8,
  vineWidth: 0.68,
  vineBrightness: 1.45,
  curl: 0.66,
  thornDensity: 0.68,
  thornSize: 0.78,
  thornBrightness: 1.5,
  thornIrregularity: 0.82,
  leafDensity: 0.5,
  leafSize: 0.78,
  leafSharpness: 0.72,
  growth: 0.62,
  glow: 0.36,
  instability: 0.55,
  panFollow: 1,
  zoomScale: 0.2,
  baseAlpha: 0.34,
  soilColor: "#10200c",
  vineColor: "#22c55e",
  leafColor: "#bef264",
  thornColor: "#d97706"
};

export interface SmokeEffectTuningSettings {
  opacity: number;
  cloudScale: number;
  speed: number;
  directionDegrees: number;
  turbulence: number;
  softness: number;
  density: number;
  lift: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  shadowColor: string;
  smokeColor: string;
  highlightColor: string;
}

export const DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS: SmokeEffectTuningSettings = {
  opacity: 0.82,
  cloudScale: 4.8,
  speed: 0.16,
  directionDegrees: 270,
  turbulence: 0.72,
  softness: 0.64,
  density: 0.58,
  lift: 0.35,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.22,
  shadowColor: "#1f2933",
  smokeColor: "#8c98a5",
  highlightColor: "#d7dee6"
};

export type FogEffectTuningSettings = SmokeEffectTuningSettings;

export const DEFAULT_FOG_EFFECT_TUNING_SETTINGS: FogEffectTuningSettings = {
  opacity: 0.62,
  cloudScale: 3.6,
  speed: 0.08,
  directionDegrees: 282,
  turbulence: 0.42,
  softness: 0.9,
  density: 0.48,
  lift: 0.08,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.18,
  shadowColor: "#52606d",
  smokeColor: "#b7c2cc",
  highlightColor: "#f3f7fb"
};


export function normalizeWaterEffectTuning(tuning?: WaterEffectTuningSettings): WaterEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.opacity),
    bandScale: clampNumber(tuning?.bandScale, 0.5, 20, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.bandScale),
    bandWidth: clampNumber(tuning?.bandWidth, 0.01, 0.49, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.bandWidth),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.directionDegrees),
    distortion: clampNumber(tuning?.distortion, 0, 2, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.distortion),
    verticalDistortion: clampNumber(tuning?.verticalDistortion, 0, 2, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.verticalDistortion),
    distortionVariation: clampNumber(tuning?.distortionVariation, 0, 2, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.distortionVariation),
    bandBreakup: clampNumber(tuning?.bandBreakup, 0, 1, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.bandBreakup),
    bandVariation: clampNumber(tuning?.bandVariation, 0, 4, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.bandVariation),
    bandOverlap: clampNumber(tuning?.bandOverlap, 0, 1, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.bandOverlap),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.baseAlpha),
    highlightAlpha: clampNumber(tuning?.highlightAlpha, 0, 1, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.highlightAlpha),
    deepColor: normalizeColorValue(tuning?.deepColor, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.deepColor),
    waterColor: normalizeColorValue(tuning?.waterColor, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.waterColor),
    highlightColor: normalizeColorValue(tuning?.highlightColor, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.highlightColor)
  };
}

export function normalizeAcidEffectTuning(tuning?: AcidEffectTuningSettings): AcidEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.opacity),
    acidScale: clampNumber(tuning?.acidScale, 0.5, 20, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.acidScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.directionDegrees),
    corrosion: clampNumber(tuning?.corrosion, 0, 1, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.corrosion),
    bubbleDensity: clampNumber(tuning?.bubbleDensity, 0, 1, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.bubbleDensity),
    bubbleSize: clampNumber(tuning?.bubbleSize, 0, 1, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.bubbleSize),
    streakDensity: clampNumber(tuning?.streakDensity, 0, 1, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.streakDensity),
    streakWarp: clampNumber(tuning?.streakWarp, 0, 1, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.streakWarp),
    foam: clampNumber(tuning?.foam, 0, 1, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.foam),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.glow),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.baseAlpha),
    darkColor: normalizeColorValue(tuning?.darkColor, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.darkColor),
    acidColor: normalizeColorValue(tuning?.acidColor, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.acidColor),
    foamColor: normalizeColorValue(tuning?.foamColor, DEFAULT_ACID_EFFECT_TUNING_SETTINGS.foamColor)
  };
}

export function normalizePoisonEffectTuning(tuning?: PoisonEffectTuningSettings): PoisonEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.opacity),
    cloudScale: clampNumber(tuning?.cloudScale, 0.5, 20, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.cloudScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.directionDegrees),
    turbulence: clampNumber(tuning?.turbulence, 0, 2, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.turbulence),
    density: clampNumber(tuning?.density, 0, 1, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.density),
    pocketDensity: clampNumber(tuning?.pocketDensity, 0, 1, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.pocketDensity),
    pocketSize: clampNumber(tuning?.pocketSize, 0, 1, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.pocketSize),
    softness: clampNumber(tuning?.softness, 0, 1, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.softness),
    drift: clampNumber(tuning?.drift, 0, 1, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.drift),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.glow),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.baseAlpha),
    shadowColor: normalizeColorValue(tuning?.shadowColor, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.shadowColor),
    poisonColor: normalizeColorValue(tuning?.poisonColor, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.poisonColor),
    highlightColor: normalizeColorValue(tuning?.highlightColor, DEFAULT_POISON_EFFECT_TUNING_SETTINGS.highlightColor)
  };
}

export function normalizeColdEffectTuning(tuning?: ColdEffectTuningSettings): ColdEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.opacity),
    frostScale: clampNumber(tuning?.frostScale, 0.5, 20, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.frostScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.directionDegrees),
    veinDensity: clampNumber(tuning?.veinDensity, 0, 1, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.veinDensity),
    veinWidth: clampNumber(tuning?.veinWidth, 0, 1, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.veinWidth),
    crystalDensity: clampNumber(tuning?.crystalDensity, 0, 1, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.crystalDensity),
    crystalSize: clampNumber(tuning?.crystalSize, 0, 1, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.crystalSize),
    haze: clampNumber(tuning?.haze, 0, 1, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.haze),
    shimmer: clampNumber(tuning?.shimmer, 0, 1, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.shimmer),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.glow),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.baseAlpha),
    shadowColor: normalizeColorValue(tuning?.shadowColor, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.shadowColor),
    frostColor: normalizeColorValue(tuning?.frostColor, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.frostColor),
    highlightColor: normalizeColorValue(tuning?.highlightColor, DEFAULT_COLD_EFFECT_TUNING_SETTINGS.highlightColor)
  };
}

export function normalizeDarknessEffectTuning(tuning?: DarknessEffectTuningSettings): DarknessEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.opacity),
    darknessScale: clampNumber(tuning?.darknessScale, 0.5, 20, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.darknessScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.directionDegrees),
    depth: clampNumber(tuning?.depth, 0, 1, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.depth),
    tendrilDensity: clampNumber(tuning?.tendrilDensity, 0, 1, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.tendrilDensity),
    tendrilReach: clampNumber(tuning?.tendrilReach, 0, 1, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.tendrilReach),
    edgeSoftness: clampNumber(tuning?.edgeSoftness, 0, 1, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.edgeSoftness),
    wispDensity: clampNumber(tuning?.wispDensity, 0, 1, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.wispDensity),
    drift: clampNumber(tuning?.drift, 0, 1, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.drift),
    voidHighlight: clampNumber(tuning?.voidHighlight, 0, 1, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.voidHighlight),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.baseAlpha),
    shadowColor: normalizeColorValue(tuning?.shadowColor, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.shadowColor),
    voidColor: normalizeColorValue(tuning?.voidColor, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.voidColor),
    highlightColor: normalizeColorValue(tuning?.highlightColor, DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS.highlightColor)
  };
}

export function normalizeLavaEffectTuning(tuning?: LavaEffectTuningSettings): LavaEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.opacity),
    flowScale: clampNumber(tuning?.flowScale, 0.5, 20, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.flowScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.directionDegrees),
    distortion: clampNumber(tuning?.distortion, 0, 2, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.distortion),
    crust: clampNumber(tuning?.crust, 0, 1, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.crust),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.glow),
    ember: clampNumber(tuning?.ember, 0, 1, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.ember),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.baseAlpha),
    darkColor: normalizeColorValue(tuning?.darkColor, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.darkColor),
    lavaColor: normalizeColorValue(tuning?.lavaColor, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.lavaColor),
    hotColor: normalizeColorValue(tuning?.hotColor, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.hotColor)
  };
}

export function normalizeFireEffectTuning(tuning?: FireEffectTuningSettings): FireEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.opacity),
    flameScale: clampNumber(tuning?.flameScale, 0.5, 20, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.flameScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.directionDegrees),
    turbulence: clampNumber(tuning?.turbulence, 0, 2, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.turbulence),
    tongues: clampNumber(tuning?.tongues, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.tongues),
    tongueVariation: clampNumber(tuning?.tongueVariation, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.tongueVariation),
    breakup: clampNumber(tuning?.breakup, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.breakup),
    flameStretch: clampNumber(tuning?.flameStretch, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.flameStretch),
    flicker: clampNumber(tuning?.flicker, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.flicker),
    ember: clampNumber(tuning?.ember, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.ember),
    heat: clampNumber(tuning?.heat, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.heat),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.baseAlpha),
    emberColor: normalizeColorValue(tuning?.emberColor, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.emberColor),
    flameColor: normalizeColorValue(tuning?.flameColor, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.flameColor),
    hotColor: normalizeColorValue(tuning?.hotColor, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.hotColor)
  };
}

export function normalizeLightningEffectTuning(tuning?: LightningEffectTuningSettings): LightningEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.opacity),
    arcScale: clampNumber(tuning?.arcScale, 0.5, 20, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.arcScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.directionDegrees),
    boltDensity: clampNumber(tuning?.boltDensity, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.boltDensity),
    branchiness: clampNumber(tuning?.branchiness, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.branchiness),
    jitter: clampNumber(tuning?.jitter, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.jitter),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.glow),
    strikeWidth: clampNumber(tuning?.strikeWidth, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.strikeWidth),
    segmentBreaks: clampNumber(tuning?.segmentBreaks, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.segmentBreaks),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.backgroundColor),
    arcColor: normalizeColorValue(tuning?.arcColor, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.arcColor),
    coreColor: normalizeColorValue(tuning?.coreColor, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.coreColor)
  };
}

export function normalizeArcaneEffectTuning(tuning?: ArcaneEffectTuningSettings): ArcaneEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.opacity),
    glyphScale: clampNumber(tuning?.glyphScale, 0.5, 20, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.glyphScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.speed),
    rotationSpeed: clampNumber(tuning?.rotationSpeed, -2, 2, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.rotationSpeed),
    glyphDensity: clampNumber(tuning?.glyphDensity, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.glyphDensity),
    ringDensity: clampNumber(tuning?.ringDensity, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.ringDensity),
    circleScale: clampNumber(tuning?.circleScale, 1, 20, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.circleScale),
    spokeAmount: clampNumber(tuning?.spokeAmount, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.spokeAmount),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.pulse),
    drift: clampNumber(tuning?.drift, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.drift),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.glow),
    lineWidth: clampNumber(tuning?.lineWidth, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.lineWidth),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.backgroundColor),
    glyphColor: normalizeColorValue(tuning?.glyphColor, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.glyphColor),
    glowColor: normalizeColorValue(tuning?.glowColor, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.glowColor)
  };
}

export function normalizeRadiantEffectTuning(tuning?: RadiantEffectTuningSettings): RadiantEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.opacity),
    rayScale: clampNumber(tuning?.rayScale, 0.5, 20, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.rayScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.directionDegrees),
    rayDensity: clampNumber(tuning?.rayDensity, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.rayDensity),
    rayBreakup: clampNumber(tuning?.rayBreakup, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.rayBreakup),
    raySpread: clampNumber(tuning?.raySpread, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.raySpread),
    rayDistance: clampNumber(tuning?.rayDistance, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.rayDistance),
    moteDensity: clampNumber(tuning?.moteDensity, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.moteDensity),
    moteSize: clampNumber(tuning?.moteSize, 0, 5, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.moteSize),
    shimmer: clampNumber(tuning?.shimmer, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.shimmer),
    bloom: clampNumber(tuning?.bloom, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.bloom),
    streakWidth: clampNumber(tuning?.streakWidth, 0, 5, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.streakWidth),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.pulse),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.backgroundColor),
    rayColor: normalizeColorValue(tuning?.rayColor, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.rayColor),
    coreColor: normalizeColorValue(tuning?.coreColor, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.coreColor)
  };
}

export function normalizeForceFieldEffectTuning(tuning?: ForceFieldEffectTuningSettings): ForceFieldEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.opacity),
    fieldScale: clampNumber(tuning?.fieldScale, 0.5, 20, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.fieldScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.directionDegrees),
    gridDensity: clampNumber(tuning?.gridDensity, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.gridDensity),
    gridWarp: clampNumber(tuning?.gridWarp, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.gridWarp),
    rippleStrength: clampNumber(tuning?.rippleStrength, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.rippleStrength),
    rippleFrequency: clampNumber(tuning?.rippleFrequency, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.rippleFrequency),
    edgeStrength: clampNumber(tuning?.edgeStrength, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.edgeStrength),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.pulse),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.glow),
    refraction: clampNumber(tuning?.refraction, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.refraction),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.backgroundColor),
    gridColor: normalizeColorValue(tuning?.gridColor, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.gridColor),
    edgeColor: normalizeColorValue(tuning?.edgeColor, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.edgeColor)
  };
}

export function normalizeShockwaveEffectTuning(tuning?: ShockwaveEffectTuningSettings): ShockwaveEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.opacity),
    ringScale: clampNumber(tuning?.ringScale, 0.5, 20, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.ringScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.directionDegrees),
    ringCount: clampNumber(tuning?.ringCount, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.ringCount),
    ringWidth: clampNumber(tuning?.ringWidth, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.ringWidth),
    ringSharpness: clampNumber(tuning?.ringSharpness, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.ringSharpness),
    distortion: clampNumber(tuning?.distortion, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.distortion),
    turbulence: clampNumber(tuning?.turbulence, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.turbulence),
    centerStrength: clampNumber(tuning?.centerStrength, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.centerStrength),
    fade: clampNumber(tuning?.fade, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.fade),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.pulse),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.glow),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.backgroundColor),
    ringColor: normalizeColorValue(tuning?.ringColor, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.ringColor),
    coreColor: normalizeColorValue(tuning?.coreColor, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.coreColor)
  };
}

export function normalizeDistortionEffectTuning(tuning?: DistortionEffectTuningSettings): DistortionEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.opacity),
    distortionScale: clampNumber(tuning?.distortionScale, 0.5, 20, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.distortionScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.directionDegrees),
    distortionStrength: clampNumber(tuning?.distortionStrength, 0, 1, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.distortionStrength),
    rippleStrength: clampNumber(tuning?.rippleStrength, 0, 1, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.rippleStrength),
    rippleFrequency: clampNumber(tuning?.rippleFrequency, 0, 1, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.rippleFrequency),
    shimmer: clampNumber(tuning?.shimmer, 0, 1, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.shimmer),
    turbulence: clampNumber(tuning?.turbulence, 0, 1, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.turbulence),
    causticStrength: clampNumber(tuning?.causticStrength, 0, 1, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.causticStrength),
    edgeStrength: clampNumber(tuning?.edgeStrength, 0, 1, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.edgeStrength),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.pulse),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.backgroundColor),
    distortionColor: normalizeColorValue(tuning?.distortionColor, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.distortionColor),
    highlightColor: normalizeColorValue(tuning?.highlightColor, DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS.highlightColor)
  };
}

export function normalizeChaosEffectTuning(tuning?: ChaosEffectTuningSettings): ChaosEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.opacity),
    chaosScale: clampNumber(tuning?.chaosScale, 0.5, 20, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.chaosScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.directionDegrees),
    riftDensity: clampNumber(tuning?.riftDensity, 0, 1, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.riftDensity),
    riftWarp: clampNumber(tuning?.riftWarp, 0, 1, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.riftWarp),
    moteDensity: clampNumber(tuning?.moteDensity, 0, 1, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.moteDensity),
    moteSize: clampNumber(tuning?.moteSize, 0, 5, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.moteSize),
    colorShift: clampNumber(tuning?.colorShift, 0, 1, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.colorShift),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.pulse),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.glow),
    instability: clampNumber(tuning?.instability, 0, 1, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.instability),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.backgroundColor),
    riftColor: normalizeColorValue(tuning?.riftColor, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.riftColor),
    moteColor: normalizeColorValue(tuning?.moteColor, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.moteColor),
    accentColor: normalizeColorValue(tuning?.accentColor, DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS.accentColor)
  };
}

export function normalizeVoidEffectTuning(tuning?: VoidEffectTuningSettings): VoidEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.opacity),
    tendrilScale: clampNumber(tuning?.tendrilScale, 0.5, 20, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.tendrilScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.directionDegrees),
    tendrilDensity: clampNumber(tuning?.tendrilDensity, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.tendrilDensity),
    tendrilWidth: clampNumber(tuning?.tendrilWidth, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.tendrilWidth),
    curl: clampNumber(tuning?.curl, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.curl),
    reach: clampNumber(tuning?.reach, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.reach),
    voidDepth: clampNumber(tuning?.voidDepth, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.voidDepth),
    moteDensity: clampNumber(tuning?.moteDensity, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.moteDensity),
    moteSize: clampNumber(tuning?.moteSize, 0, 5, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.moteSize),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.pulse),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.glow),
    instability: clampNumber(tuning?.instability, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.instability),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.backgroundColor),
    tendrilColor: normalizeColorValue(tuning?.tendrilColor, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.tendrilColor),
    voidColor: normalizeColorValue(tuning?.voidColor, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.voidColor),
    accentColor: normalizeColorValue(tuning?.accentColor, DEFAULT_VOID_EFFECT_TUNING_SETTINGS.accentColor)
  };
}

export function normalizeNatureEffectTuning(tuning?: NatureEffectTuningSettings): NatureEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.opacity),
    vineScale: clampNumber(tuning?.vineScale, 0.5, 20, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.vineScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.directionDegrees),
    vineDensity: clampNumber(tuning?.vineDensity, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.vineDensity),
    vineWidth: clampNumber(tuning?.vineWidth, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.vineWidth),
    vineBrightness: clampNumber(tuning?.vineBrightness, 0, 2, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.vineBrightness),
    curl: clampNumber(tuning?.curl, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.curl),
    thornDensity: clampNumber(tuning?.thornDensity, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.thornDensity),
    thornSize: clampNumber(tuning?.thornSize, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.thornSize),
    thornBrightness: clampNumber(tuning?.thornBrightness, 0, 3, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.thornBrightness),
    thornIrregularity: clampNumber(tuning?.thornIrregularity, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.thornIrregularity),
    leafDensity: clampNumber(tuning?.leafDensity, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.leafDensity),
    leafSize: clampNumber(tuning?.leafSize, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.leafSize),
    leafSharpness: clampNumber(tuning?.leafSharpness, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.leafSharpness),
    growth: clampNumber(tuning?.growth, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.growth),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.glow),
    instability: clampNumber(tuning?.instability, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.instability),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.baseAlpha),
    soilColor: normalizeColorValue(tuning?.soilColor, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.soilColor),
    vineColor: normalizeColorValue(tuning?.vineColor, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.vineColor),
    leafColor: normalizeColorValue(tuning?.leafColor, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.leafColor),
    thornColor: normalizeColorValue(tuning?.thornColor, DEFAULT_NATURE_EFFECT_TUNING_SETTINGS.thornColor)
  };
}

export function normalizeSmokeEffectTuning(tuning?: SmokeEffectTuningSettings): SmokeEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.opacity),
    cloudScale: clampNumber(tuning?.cloudScale, 0.5, 20, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.cloudScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.directionDegrees),
    turbulence: clampNumber(tuning?.turbulence, 0, 2, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.turbulence),
    softness: clampNumber(tuning?.softness, 0, 1, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.softness),
    density: clampNumber(tuning?.density, 0, 1, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.density),
    lift: clampNumber(tuning?.lift, 0, 1, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.lift),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.baseAlpha),
    shadowColor: normalizeColorValue(tuning?.shadowColor, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.shadowColor),
    smokeColor: normalizeColorValue(tuning?.smokeColor, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.smokeColor),
    highlightColor: normalizeColorValue(tuning?.highlightColor, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.highlightColor)
  };
}

export function normalizeFogEffectTuning(tuning?: FogEffectTuningSettings): FogEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.opacity),
    cloudScale: clampNumber(tuning?.cloudScale, 0.5, 20, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.cloudScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.directionDegrees),
    turbulence: clampNumber(tuning?.turbulence, 0, 2, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.turbulence),
    softness: clampNumber(tuning?.softness, 0, 1, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.softness),
    density: clampNumber(tuning?.density, 0, 1, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.density),
    lift: clampNumber(tuning?.lift, 0, 1, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.lift),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.baseAlpha),
    shadowColor: normalizeColorValue(tuning?.shadowColor, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.shadowColor),
    smokeColor: normalizeColorValue(tuning?.smokeColor, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.smokeColor),
    highlightColor: normalizeColorValue(tuning?.highlightColor, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.highlightColor)
  };
}

function normalizeColorValue(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

