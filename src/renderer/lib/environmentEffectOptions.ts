import type { EnvironmentEffectType } from "../../shared/localvtt";
import {
  ARCANE_EFFECT_PRESETS,
  FIRE_EFFECT_PRESETS,
  FOG_EFFECT_PRESETS,
  LAVA_EFFECT_PRESETS,
  LIGHTNING_EFFECT_PRESETS,
  SMOKE_EFFECT_PRESETS,
  WATER_EFFECT_PRESETS,
  type ArcaneEffectTuning,
  type FireEffectTuning,
  type FogEffectTuning,
  type LavaEffectTuning,
  type LightningEffectTuning,
  type SmokeEffectTuning,
  type WaterEffectTuning
} from "../canvas/environmentEffectsRenderer";

export const ENVIRONMENT_EFFECT_FEATHER_OPTIONS = [
  { label: "None", value: 0 },
  { label: "Soft", value: 0.3 },
  { label: "Medium", value: 0.6 },
  { label: "Wide", value: 1 }
] as const;

export function getEnvironmentEffectPresetSelectValue(
  effect: EnvironmentEffectType,
  waterEffectTuning: WaterEffectTuning,
  lavaEffectTuning: LavaEffectTuning,
  fireEffectTuning: FireEffectTuning,
  lightningEffectTuning: LightningEffectTuning,
  arcaneEffectTuning: ArcaneEffectTuning,
  smokeEffectTuning: SmokeEffectTuning,
  fogEffectTuning: FogEffectTuning
): string {
  if (effect === "lava") {
    return getLavaPresetSelectValue(lavaEffectTuning);
  }
  if (effect === "fire") {
    return getFirePresetSelectValue(fireEffectTuning);
  }
  if (effect === "electric") {
    return getLightningPresetSelectValue(lightningEffectTuning);
  }
  if (effect === "arcane") {
    return getArcanePresetSelectValue(arcaneEffectTuning);
  }
  if (effect === "smoke") {
    return getSmokePresetSelectValue(smokeEffectTuning);
  }
  if (effect === "fog") {
    return getFogPresetSelectValue(fogEffectTuning);
  }
  return getWaterPresetSelectValue(waterEffectTuning);
}

export function getEnvironmentEffectPresetOptions(effect: EnvironmentEffectType): Array<{ label: string; value: string }> {
  if (effect === "lava") {
    return [
      { label: "Custom", value: "custom" },
      { label: "Molten Flow", value: "moltenFlow" },
      { label: "Magma Pool", value: "magmaPool" }
    ];
  }
  if (effect === "fire") {
    return [
      { label: "Custom", value: "custom" },
      { label: "Embers", value: "embers" },
      { label: "Flames", value: "flames" },
      { label: "Inferno", value: "inferno" }
    ];
  }
  if (effect === "electric") {
    return [
      { label: "Custom", value: "custom" },
      { label: "Arcing Field", value: "arcingField" },
      { label: "Static Web", value: "staticWeb" },
      { label: "Electric Surge", value: "stormSurge" }
    ];
  }
  if (effect === "arcane") {
    return [
      { label: "Custom", value: "custom" },
      { label: "Ritual Circle", value: "ritualCircle" },
      { label: "Sigil Field", value: "sigilField" },
      { label: "Warding Runes", value: "wardingRunes" }
    ];
  }
  if (effect === "smoke") {
    return [
      { label: "Custom", value: "custom" },
      { label: "Drifting Smoke", value: "driftingSmoke" },
      { label: "Heavy Smoke", value: "heavySmoke" }
    ];
  }
  if (effect === "fog") {
    return [
      { label: "Custom", value: "custom" },
      { label: "Light Mist", value: "lightMist" },
      { label: "Low Mist", value: "lowFog" },
      { label: "Thick Mist", value: "thickMist" }
    ];
  }
  return [
    { label: "Custom", value: "custom" },
    { label: "Stream", value: "stream" },
    { label: "River", value: "river" }
  ];
}

export function applyEnvironmentEffectPreset(
  effect: EnvironmentEffectType,
  value: string,
  handlers: {
    onWaterEffectTuningChange: (tuning: WaterEffectTuning) => void;
    onLavaEffectTuningChange: (tuning: LavaEffectTuning) => void;
    onFireEffectTuningChange: (tuning: FireEffectTuning) => void;
    onLightningEffectTuningChange: (tuning: LightningEffectTuning) => void;
    onArcaneEffectTuningChange: (tuning: ArcaneEffectTuning) => void;
    onSmokeEffectTuningChange: (tuning: SmokeEffectTuning) => void;
    onFogEffectTuningChange: (tuning: FogEffectTuning) => void;
  }
) {
  if (effect === "lava") {
    const preset = LAVA_EFFECT_PRESETS[value as keyof typeof LAVA_EFFECT_PRESETS];
    if (preset) {
      handlers.onLavaEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "fire") {
    const preset = FIRE_EFFECT_PRESETS[value as keyof typeof FIRE_EFFECT_PRESETS];
    if (preset) {
      handlers.onFireEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "electric") {
    const preset = LIGHTNING_EFFECT_PRESETS[value as keyof typeof LIGHTNING_EFFECT_PRESETS];
    if (preset) {
      handlers.onLightningEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "arcane") {
    const preset = ARCANE_EFFECT_PRESETS[value as keyof typeof ARCANE_EFFECT_PRESETS];
    if (preset) {
      handlers.onArcaneEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "smoke") {
    const preset = SMOKE_EFFECT_PRESETS[value as keyof typeof SMOKE_EFFECT_PRESETS];
    if (preset) {
      handlers.onSmokeEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "fog") {
    const preset = FOG_EFFECT_PRESETS[value as keyof typeof FOG_EFFECT_PRESETS];
    if (preset) {
      handlers.onFogEffectTuningChange({ ...preset });
    }
    return;
  }
  const preset = WATER_EFFECT_PRESETS[value as keyof typeof WATER_EFFECT_PRESETS];
  if (preset) {
    handlers.onWaterEffectTuningChange({ ...preset });
  }
}

export function formatEnvironmentEffectOptionLabel(effect: EnvironmentEffectType): string {
  return effect === "water" ? "Water" : effect === "lava" ? "Lava" : effect === "fire" ? "Fire" : effect === "electric" ? "Electric" : effect === "arcane" ? "Arcane" : effect === "fog" ? "Mist" : "Smoke";
}

export function getEnvironmentEffectFeatherSelectValue(feather: number): number {
  const match = ENVIRONMENT_EFFECT_FEATHER_OPTIONS.find((option) => Math.abs(option.value - feather) < 0.001);
  return match?.value ?? 0;
}

function getWaterPresetSelectValue(tuning: WaterEffectTuning): keyof typeof WATER_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(WATER_EFFECT_PRESETS)) {
    if (isWaterTuningMatch(tuning, preset)) {
      return presetName as keyof typeof WATER_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getLavaPresetSelectValue(tuning: LavaEffectTuning): keyof typeof LAVA_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(LAVA_EFFECT_PRESETS)) {
    if (isLavaTuningMatch(tuning, preset)) {
      return presetName as keyof typeof LAVA_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getFirePresetSelectValue(tuning: FireEffectTuning): keyof typeof FIRE_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(FIRE_EFFECT_PRESETS)) {
    if (isFireTuningMatch(tuning, preset)) {
      return presetName as keyof typeof FIRE_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getLightningPresetSelectValue(tuning: LightningEffectTuning): keyof typeof LIGHTNING_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(LIGHTNING_EFFECT_PRESETS)) {
    if (isLightningTuningMatch(tuning, preset)) {
      return presetName as keyof typeof LIGHTNING_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getArcanePresetSelectValue(tuning: ArcaneEffectTuning): keyof typeof ARCANE_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(ARCANE_EFFECT_PRESETS)) {
    if (isArcaneTuningMatch(tuning, preset)) {
      return presetName as keyof typeof ARCANE_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getSmokePresetSelectValue(tuning: SmokeEffectTuning): keyof typeof SMOKE_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(SMOKE_EFFECT_PRESETS)) {
    if (isSmokeTuningMatch(tuning, preset)) {
      return presetName as keyof typeof SMOKE_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getFogPresetSelectValue(tuning: FogEffectTuning): keyof typeof FOG_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(FOG_EFFECT_PRESETS)) {
    if (isFogTuningMatch(tuning, preset)) {
      return presetName as keyof typeof FOG_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function isWaterTuningMatch(tuning: WaterEffectTuning, preset: WaterEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.bandScale === preset.bandScale &&
    tuning.bandWidth === preset.bandWidth &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.distortion === preset.distortion &&
    tuning.verticalDistortion === preset.verticalDistortion &&
    tuning.distortionVariation === preset.distortionVariation &&
    tuning.bandBreakup === preset.bandBreakup &&
    tuning.bandVariation === preset.bandVariation &&
    tuning.bandOverlap === preset.bandOverlap &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.highlightAlpha === preset.highlightAlpha &&
    tuning.deepColor === preset.deepColor &&
    tuning.waterColor === preset.waterColor &&
    tuning.highlightColor === preset.highlightColor
  );
}

function isLavaTuningMatch(tuning: LavaEffectTuning, preset: LavaEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.flowScale === preset.flowScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.distortion === preset.distortion &&
    tuning.crust === preset.crust &&
    tuning.glow === preset.glow &&
    tuning.ember === preset.ember &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.darkColor === preset.darkColor &&
    tuning.lavaColor === preset.lavaColor &&
    tuning.hotColor === preset.hotColor
  );
}

function isFireTuningMatch(tuning: FireEffectTuning, preset: FireEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.flameScale === preset.flameScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.turbulence === preset.turbulence &&
    tuning.tongues === preset.tongues &&
    tuning.tongueVariation === preset.tongueVariation &&
    tuning.breakup === preset.breakup &&
    tuning.flameStretch === preset.flameStretch &&
    tuning.flicker === preset.flicker &&
    tuning.ember === preset.ember &&
    tuning.heat === preset.heat &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.emberColor === preset.emberColor &&
    tuning.flameColor === preset.flameColor &&
    tuning.hotColor === preset.hotColor
  );
}

function isLightningTuningMatch(tuning: LightningEffectTuning, preset: LightningEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.arcScale === preset.arcScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.boltDensity === preset.boltDensity &&
    tuning.branchiness === preset.branchiness &&
    tuning.jitter === preset.jitter &&
    tuning.glow === preset.glow &&
    tuning.strikeWidth === preset.strikeWidth &&
    tuning.segmentBreaks === preset.segmentBreaks &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.backgroundColor === preset.backgroundColor &&
    tuning.arcColor === preset.arcColor &&
    tuning.coreColor === preset.coreColor
  );
}

function isArcaneTuningMatch(tuning: ArcaneEffectTuning, preset: ArcaneEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.glyphScale === preset.glyphScale &&
    tuning.speed === preset.speed &&
    tuning.rotationSpeed === preset.rotationSpeed &&
    tuning.glyphDensity === preset.glyphDensity &&
    tuning.ringDensity === preset.ringDensity &&
    tuning.circleScale === preset.circleScale &&
    tuning.spokeAmount === preset.spokeAmount &&
    tuning.pulse === preset.pulse &&
    tuning.drift === preset.drift &&
    tuning.glow === preset.glow &&
    tuning.lineWidth === preset.lineWidth &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.backgroundColor === preset.backgroundColor &&
    tuning.glyphColor === preset.glyphColor &&
    tuning.glowColor === preset.glowColor
  );
}

function isSmokeTuningMatch(tuning: SmokeEffectTuning, preset: SmokeEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.cloudScale === preset.cloudScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.turbulence === preset.turbulence &&
    tuning.softness === preset.softness &&
    tuning.density === preset.density &&
    tuning.lift === preset.lift &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.shadowColor === preset.shadowColor &&
    tuning.smokeColor === preset.smokeColor &&
    tuning.highlightColor === preset.highlightColor
  );
}

function isFogTuningMatch(tuning: FogEffectTuning, preset: FogEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.cloudScale === preset.cloudScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.turbulence === preset.turbulence &&
    tuning.softness === preset.softness &&
    tuning.density === preset.density &&
    tuning.lift === preset.lift &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.shadowColor === preset.shadowColor &&
    tuning.smokeColor === preset.smokeColor &&
    tuning.highlightColor === preset.highlightColor
  );
}
