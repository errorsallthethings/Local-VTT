import type { EnvironmentEffectType } from "../../shared/localvtt";
import {
  ACID_EFFECT_PRESETS,
  ARCANE_EFFECT_PRESETS,
  CHAOS_EFFECT_PRESETS,
  COLD_EFFECT_PRESETS,
  DARKNESS_EFFECT_PRESETS,
  FIRE_EFFECT_PRESETS,
  FOG_EFFECT_PRESETS,
  FORCE_FIELD_EFFECT_PRESETS,
  DISTORTION_EFFECT_PRESETS,
  LAVA_EFFECT_PRESETS,
  LIGHTNING_EFFECT_PRESETS,
  NATURE_EFFECT_PRESETS,
  POISON_EFFECT_PRESETS,
  RADIANT_EFFECT_PRESETS,
  SHOCKWAVE_EFFECT_PRESETS,
  SMOKE_EFFECT_PRESETS,
  VOID_EFFECT_PRESETS,
  WATER_EFFECT_PRESETS,
  type AcidEffectTuning,
  type ArcaneEffectTuning,
  type ChaosEffectTuning,
  type ColdEffectTuning,
  type DarknessEffectTuning,
  type FireEffectTuning,
  type FogEffectTuning,
  type ForceFieldEffectTuning,
  type DistortionEffectTuning,
  type LavaEffectTuning,
  type LightningEffectTuning,
  type NatureEffectTuning,
  type PoisonEffectTuning,
  type RadiantEffectTuning,
  type ShockwaveEffectTuning,
  type SmokeEffectTuning,
  type VoidEffectTuning,
  type WaterEffectTuning
} from "../canvas/environmentEffectsRenderer";

export const ENVIRONMENT_EFFECT_FEATHER_OPTIONS = [
  { label: "None", value: 0 },
  { label: "Soft", value: 0.3 },
  { label: "Medium", value: 0.6 },
  { label: "Wide", value: 1 }
] as const;

export const ENVIRONMENT_EFFECT_OPTIONS: Array<{ label: string; value: EnvironmentEffectType }> = [
  { label: "Acid", value: "acid" },
  { label: "Arcane", value: "arcane" },
  { label: "Chaos Field", value: "chaos" },
  { label: "Cold", value: "cold" },
  { label: "Darkness", value: "darkness" },
  { label: "Distortion", value: "distortion" },
  { label: "Electric", value: "electric" },
  { label: "Fire", value: "fire" },
  { label: "Force Field", value: "field" },
  { label: "Lava", value: "lava" },
  { label: "Mist", value: "fog" },
  { label: "Nature Growth", value: "nature" },
  { label: "Poison Cloud", value: "poison" },
  { label: "Radiant", value: "radiant" },
  { label: "Shockwave", value: "shockwave" },
  { label: "Smoke", value: "smoke" },
  { label: "Void Tendrils", value: "void" },
  { label: "Water", value: "water" }
];

const ENVIRONMENT_EFFECT_LABELS: Record<EnvironmentEffectType, string> = {
  acid: "Acid",
  arcane: "Arcane",
  chaos: "Chaos Field",
  cold: "Cold",
  darkness: "Darkness",
  distortion: "Distortion",
  electric: "Electric",
  field: "Force Field",
  fire: "Fire",
  fog: "Mist",
  lava: "Lava",
  nature: "Nature Growth",
  poison: "Poison Cloud",
  radiant: "Radiant",
  shockwave: "Shockwave",
  smoke: "Smoke",
  void: "Void Tendrils",
  water: "Water"
};

const ENVIRONMENT_EFFECT_PRESET_OPTIONS: Record<EnvironmentEffectType, Array<{ label: string; value: string }>> = {
  acid: [
    { label: "Custom", value: "custom" },
    { label: "Acid Pool", value: "acidPool" },
    { label: "Caustic Sludge", value: "causticSludge" },
    { label: "Bubbling Acid", value: "bubblingAcid" }
  ],
  arcane: [
    { label: "Custom", value: "custom" },
    { label: "Ritual Circle", value: "ritualCircle" },
    { label: "Sigil Field", value: "sigilField" },
    { label: "Warding Runes", value: "wardingRunes" }
  ],
  chaos: [
    { label: "Custom", value: "custom" },
    { label: "Wild Surge", value: "wildSurge" },
    { label: "Prismatic Rift", value: "prismaticRift" },
    { label: "Chaos Motes", value: "chaosMotes" }
  ],
  cold: [
    { label: "Custom", value: "custom" },
    { label: "Frost Field", value: "frostField" },
    { label: "Ice Crystals", value: "iceCrystals" },
    { label: "Freezing Haze", value: "freezingHaze" }
  ],
  darkness: [
    { label: "Custom", value: "custom" },
    { label: "Shadow Pool", value: "shadowPool" },
    { label: "Creeping Darkness", value: "creepingDarkness" },
    { label: "Void Shroud", value: "voidShroud" }
  ],
  distortion: [
    { label: "Custom", value: "custom" },
    { label: "Heat Haze", value: "heatHaze" },
    { label: "Planar Distortion", value: "planarDistortion" },
    { label: "Reality Warp", value: "realityWarp" }
  ],
  electric: [
    { label: "Custom", value: "custom" },
    { label: "Arcing Field", value: "arcingField" },
    { label: "Static Web", value: "staticWeb" },
    { label: "Electric Surge", value: "stormSurge" }
  ],
  field: [
    { label: "Custom", value: "custom" },
    { label: "Magic Field", value: "magicField" },
    { label: "Shield Field", value: "shieldField" },
    { label: "Warp Field", value: "warpField" }
  ],
  fire: [
    { label: "Custom", value: "custom" },
    { label: "Embers", value: "embers" },
    { label: "Flames", value: "flames" },
    { label: "Inferno", value: "inferno" }
  ],
  fog: [
    { label: "Custom", value: "custom" },
    { label: "Light Mist", value: "lightMist" },
    { label: "Low Mist", value: "lowFog" },
    { label: "Thick Mist", value: "thickMist" }
  ],
  lava: [
    { label: "Custom", value: "custom" },
    { label: "Molten Flow", value: "moltenFlow" },
    { label: "Magma Pool", value: "magmaPool" }
  ],
  nature: [
    { label: "Custom", value: "custom" },
    { label: "Overgrowth", value: "overgrowth" },
    { label: "Thorn Field", value: "thornField" },
    { label: "Entangling Vines", value: "entanglingVines" }
  ],
  poison: [
    { label: "Custom", value: "custom" },
    { label: "Poison Cloud", value: "poisonCloud" },
    { label: "Toxic Fog", value: "toxicFog" },
    { label: "Sickly Miasma", value: "sicklyMiasma" }
  ],
  radiant: [
    { label: "Custom", value: "custom" },
    { label: "Divine Rays", value: "divineRays" },
    { label: "Holy Light", value: "holyLight" },
    { label: "Starfall", value: "starfall" }
  ],
  shockwave: [
    { label: "Custom", value: "custom" },
    { label: "Impact Pulse", value: "impactPulse" },
    { label: "Ripple Zone", value: "rippleZone" },
    { label: "Solar Ripples", value: "solarRipples" }
  ],
  smoke: [
    { label: "Custom", value: "custom" },
    { label: "Drifting Smoke", value: "driftingSmoke" },
    { label: "Heavy Smoke", value: "heavySmoke" }
  ],
  void: [
    { label: "Custom", value: "custom" },
    { label: "Creeping Void", value: "creepingVoid" },
    { label: "Grasping Tendrils", value: "graspingTendrils" },
    { label: "Abyssal Bloom", value: "abyssalBloom" }
  ],
  water: [
    { label: "Custom", value: "custom" },
    { label: "Stream", value: "stream" },
    { label: "River", value: "river" }
  ]
};

const ENVIRONMENT_EFFECT_CANVAS_STYLES: Record<EnvironmentEffectType, { previewFill: string; stroke: string }> = {
  acid: { previewFill: "rgba(132, 204, 22, 0.18)", stroke: "rgba(190, 242, 100, 0.95)" },
  arcane: { previewFill: "rgba(168, 85, 247, 0.18)", stroke: "rgba(192, 132, 252, 0.95)" },
  chaos: { previewFill: "rgba(244, 114, 182, 0.16)", stroke: "rgba(244, 114, 182, 0.95)" },
  cold: { previewFill: "rgba(191, 219, 254, 0.18)", stroke: "rgba(239, 246, 255, 0.95)" },
  darkness: { previewFill: "rgba(15, 23, 42, 0.28)", stroke: "rgba(99, 102, 241, 0.95)" },
  distortion: { previewFill: "rgba(103, 232, 249, 0.14)", stroke: "rgba(103, 232, 249, 0.95)" },
  electric: { previewFill: "rgba(250, 204, 21, 0.18)", stroke: "rgba(250, 204, 21, 0.95)" },
  field: { previewFill: "rgba(103, 232, 249, 0.14)", stroke: "rgba(103, 232, 249, 0.95)" },
  fire: { previewFill: "rgba(249, 115, 22, 0.2)", stroke: "rgba(251, 146, 60, 0.95)" },
  fog: { previewFill: "rgba(226, 232, 240, 0.14)", stroke: "rgba(226, 232, 240, 0.82)" },
  lava: { previewFill: "rgba(255, 129, 52, 0.2)", stroke: "rgba(255, 129, 52, 0.95)" },
  nature: { previewFill: "rgba(132, 204, 22, 0.16)", stroke: "rgba(132, 204, 22, 0.95)" },
  poison: { previewFill: "rgba(101, 163, 13, 0.18)", stroke: "rgba(190, 242, 100, 0.95)" },
  radiant: { previewFill: "rgba(253, 230, 138, 0.16)", stroke: "rgba(253, 230, 138, 0.95)" },
  shockwave: { previewFill: "rgba(147, 197, 253, 0.16)", stroke: "rgba(147, 197, 253, 0.95)" },
  smoke: { previewFill: "rgba(210, 220, 226, 0.18)", stroke: "rgba(210, 220, 226, 0.88)" },
  void: { previewFill: "rgba(124, 58, 237, 0.16)", stroke: "rgba(167, 139, 250, 0.95)" },
  water: { previewFill: "rgba(56, 189, 248, 0.2)", stroke: "rgba(125, 211, 252, 0.95)" }
};

export function getEnvironmentEffectPresetSelectValue(
  effect: EnvironmentEffectType,
  acidEffectTuning: AcidEffectTuning,
  coldEffectTuning: ColdEffectTuning,
  darknessEffectTuning: DarknessEffectTuning,
  poisonEffectTuning: PoisonEffectTuning,
  waterEffectTuning: WaterEffectTuning,
  lavaEffectTuning: LavaEffectTuning,
  fireEffectTuning: FireEffectTuning,
  lightningEffectTuning: LightningEffectTuning,
  arcaneEffectTuning: ArcaneEffectTuning,
  chaosEffectTuning: ChaosEffectTuning,
  voidEffectTuning: VoidEffectTuning,
  natureEffectTuning: NatureEffectTuning,
  distortionEffectTuning: DistortionEffectTuning,
  radiantEffectTuning: RadiantEffectTuning,
  forceFieldEffectTuning: ForceFieldEffectTuning,
  shockwaveEffectTuning: ShockwaveEffectTuning,
  smokeEffectTuning: SmokeEffectTuning,
  fogEffectTuning: FogEffectTuning
): string {
  if (effect === "acid") {
    return getAcidPresetSelectValue(acidEffectTuning);
  }
  if (effect === "cold") {
    return getColdPresetSelectValue(coldEffectTuning);
  }
  if (effect === "darkness") {
    return getDarknessPresetSelectValue(darknessEffectTuning);
  }
  if (effect === "poison") {
    return getPoisonPresetSelectValue(poisonEffectTuning);
  }
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
  if (effect === "chaos") {
    return getChaosPresetSelectValue(chaosEffectTuning);
  }
  if (effect === "void") {
    return getVoidPresetSelectValue(voidEffectTuning);
  }
  if (effect === "nature") {
    return getNaturePresetSelectValue(natureEffectTuning);
  }
  if (effect === "distortion") {
    return getDistortionPresetSelectValue(distortionEffectTuning);
  }
  if (effect === "radiant") {
    return getRadiantPresetSelectValue(radiantEffectTuning);
  }
  if (effect === "field") {
    return getForceFieldPresetSelectValue(forceFieldEffectTuning);
  }
  if (effect === "shockwave") {
    return getShockwavePresetSelectValue(shockwaveEffectTuning);
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
  return ENVIRONMENT_EFFECT_PRESET_OPTIONS[effect];
}

export function applyEnvironmentEffectPreset(
  effect: EnvironmentEffectType,
  value: string,
  handlers: {
    onAcidEffectTuningChange: (tuning: AcidEffectTuning) => void;
    onColdEffectTuningChange: (tuning: ColdEffectTuning) => void;
    onDarknessEffectTuningChange: (tuning: DarknessEffectTuning) => void;
    onPoisonEffectTuningChange: (tuning: PoisonEffectTuning) => void;
    onWaterEffectTuningChange: (tuning: WaterEffectTuning) => void;
    onLavaEffectTuningChange: (tuning: LavaEffectTuning) => void;
    onFireEffectTuningChange: (tuning: FireEffectTuning) => void;
    onLightningEffectTuningChange: (tuning: LightningEffectTuning) => void;
    onArcaneEffectTuningChange: (tuning: ArcaneEffectTuning) => void;
    onChaosEffectTuningChange: (tuning: ChaosEffectTuning) => void;
    onVoidEffectTuningChange: (tuning: VoidEffectTuning) => void;
    onNatureEffectTuningChange: (tuning: NatureEffectTuning) => void;
    onDistortionEffectTuningChange: (tuning: DistortionEffectTuning) => void;
    onRadiantEffectTuningChange: (tuning: RadiantEffectTuning) => void;
    onForceFieldEffectTuningChange: (tuning: ForceFieldEffectTuning) => void;
    onShockwaveEffectTuningChange: (tuning: ShockwaveEffectTuning) => void;
    onSmokeEffectTuningChange: (tuning: SmokeEffectTuning) => void;
    onFogEffectTuningChange: (tuning: FogEffectTuning) => void;
  }
) {
  if (effect === "acid") {
    const preset = ACID_EFFECT_PRESETS[value as keyof typeof ACID_EFFECT_PRESETS];
    if (preset) {
      handlers.onAcidEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "cold") {
    const preset = COLD_EFFECT_PRESETS[value as keyof typeof COLD_EFFECT_PRESETS];
    if (preset) {
      handlers.onColdEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "darkness") {
    const preset = DARKNESS_EFFECT_PRESETS[value as keyof typeof DARKNESS_EFFECT_PRESETS];
    if (preset) {
      handlers.onDarknessEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "poison") {
    const preset = POISON_EFFECT_PRESETS[value as keyof typeof POISON_EFFECT_PRESETS];
    if (preset) {
      handlers.onPoisonEffectTuningChange({ ...preset });
    }
    return;
  }
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
  if (effect === "chaos") {
    const preset = CHAOS_EFFECT_PRESETS[value as keyof typeof CHAOS_EFFECT_PRESETS];
    if (preset) {
      handlers.onChaosEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "void") {
    const preset = VOID_EFFECT_PRESETS[value as keyof typeof VOID_EFFECT_PRESETS];
    if (preset) {
      handlers.onVoidEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "nature") {
    const preset = NATURE_EFFECT_PRESETS[value as keyof typeof NATURE_EFFECT_PRESETS];
    if (preset) {
      handlers.onNatureEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "distortion") {
    const preset = DISTORTION_EFFECT_PRESETS[value as keyof typeof DISTORTION_EFFECT_PRESETS];
    if (preset) {
      handlers.onDistortionEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "radiant") {
    const preset = RADIANT_EFFECT_PRESETS[value as keyof typeof RADIANT_EFFECT_PRESETS];
    if (preset) {
      handlers.onRadiantEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "field") {
    const preset = FORCE_FIELD_EFFECT_PRESETS[value as keyof typeof FORCE_FIELD_EFFECT_PRESETS];
    if (preset) {
      handlers.onForceFieldEffectTuningChange({ ...preset });
    }
    return;
  }
  if (effect === "shockwave") {
    const preset = SHOCKWAVE_EFFECT_PRESETS[value as keyof typeof SHOCKWAVE_EFFECT_PRESETS];
    if (preset) {
      handlers.onShockwaveEffectTuningChange({ ...preset });
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
  return ENVIRONMENT_EFFECT_LABELS[effect];
}

export function getEnvironmentEffectStroke(effect: EnvironmentEffectType): string {
  return ENVIRONMENT_EFFECT_CANVAS_STYLES[effect].stroke;
}

export function getEnvironmentEffectPreviewFill(effect: EnvironmentEffectType): string {
  return ENVIRONMENT_EFFECT_CANVAS_STYLES[effect].previewFill;
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

function getAcidPresetSelectValue(tuning: AcidEffectTuning): keyof typeof ACID_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(ACID_EFFECT_PRESETS)) {
    if (isAcidTuningMatch(tuning, preset)) {
      return presetName as keyof typeof ACID_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getColdPresetSelectValue(tuning: ColdEffectTuning): keyof typeof COLD_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(COLD_EFFECT_PRESETS)) {
    if (isColdTuningMatch(tuning, preset)) {
      return presetName as keyof typeof COLD_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getDarknessPresetSelectValue(tuning: DarknessEffectTuning): keyof typeof DARKNESS_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(DARKNESS_EFFECT_PRESETS)) {
    if (isDarknessTuningMatch(tuning, preset)) {
      return presetName as keyof typeof DARKNESS_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getPoisonPresetSelectValue(tuning: PoisonEffectTuning): keyof typeof POISON_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(POISON_EFFECT_PRESETS)) {
    if (isPoisonTuningMatch(tuning, preset)) {
      return presetName as keyof typeof POISON_EFFECT_PRESETS;
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

function getChaosPresetSelectValue(tuning: ChaosEffectTuning): keyof typeof CHAOS_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(CHAOS_EFFECT_PRESETS)) {
    if (isChaosTuningMatch(tuning, preset)) {
      return presetName as keyof typeof CHAOS_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getVoidPresetSelectValue(tuning: VoidEffectTuning): keyof typeof VOID_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(VOID_EFFECT_PRESETS)) {
    if (isVoidTuningMatch(tuning, preset)) {
      return presetName as keyof typeof VOID_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getNaturePresetSelectValue(tuning: NatureEffectTuning): keyof typeof NATURE_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(NATURE_EFFECT_PRESETS)) {
    if (isNatureTuningMatch(tuning, preset)) {
      return presetName as keyof typeof NATURE_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getDistortionPresetSelectValue(tuning: DistortionEffectTuning): keyof typeof DISTORTION_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(DISTORTION_EFFECT_PRESETS)) {
    if (isDistortionTuningMatch(tuning, preset)) {
      return presetName as keyof typeof DISTORTION_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getRadiantPresetSelectValue(tuning: RadiantEffectTuning): keyof typeof RADIANT_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(RADIANT_EFFECT_PRESETS)) {
    if (isRadiantTuningMatch(tuning, preset)) {
      return presetName as keyof typeof RADIANT_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getForceFieldPresetSelectValue(tuning: ForceFieldEffectTuning): keyof typeof FORCE_FIELD_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(FORCE_FIELD_EFFECT_PRESETS)) {
    if (isForceFieldTuningMatch(tuning, preset)) {
      return presetName as keyof typeof FORCE_FIELD_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function getShockwavePresetSelectValue(tuning: ShockwaveEffectTuning): keyof typeof SHOCKWAVE_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(SHOCKWAVE_EFFECT_PRESETS)) {
    if (isShockwaveTuningMatch(tuning, preset)) {
      return presetName as keyof typeof SHOCKWAVE_EFFECT_PRESETS;
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

function isAcidTuningMatch(tuning: AcidEffectTuning, preset: AcidEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.acidScale === preset.acidScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.corrosion === preset.corrosion &&
    tuning.bubbleDensity === preset.bubbleDensity &&
    tuning.bubbleSize === preset.bubbleSize &&
    tuning.streakDensity === preset.streakDensity &&
    tuning.streakWarp === preset.streakWarp &&
    tuning.foam === preset.foam &&
    tuning.glow === preset.glow &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.darkColor === preset.darkColor &&
    tuning.acidColor === preset.acidColor &&
    tuning.foamColor === preset.foamColor
  );
}

function isColdTuningMatch(tuning: ColdEffectTuning, preset: ColdEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.frostScale === preset.frostScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.veinDensity === preset.veinDensity &&
    tuning.veinWidth === preset.veinWidth &&
    tuning.crystalDensity === preset.crystalDensity &&
    tuning.crystalSize === preset.crystalSize &&
    tuning.haze === preset.haze &&
    tuning.shimmer === preset.shimmer &&
    tuning.glow === preset.glow &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.shadowColor === preset.shadowColor &&
    tuning.frostColor === preset.frostColor &&
    tuning.highlightColor === preset.highlightColor
  );
}

function isDarknessTuningMatch(tuning: DarknessEffectTuning, preset: DarknessEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.darknessScale === preset.darknessScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.depth === preset.depth &&
    tuning.tendrilDensity === preset.tendrilDensity &&
    tuning.tendrilReach === preset.tendrilReach &&
    tuning.edgeSoftness === preset.edgeSoftness &&
    tuning.wispDensity === preset.wispDensity &&
    tuning.drift === preset.drift &&
    tuning.voidHighlight === preset.voidHighlight &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.shadowColor === preset.shadowColor &&
    tuning.voidColor === preset.voidColor &&
    tuning.highlightColor === preset.highlightColor
  );
}

function isPoisonTuningMatch(tuning: PoisonEffectTuning, preset: PoisonEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.cloudScale === preset.cloudScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.turbulence === preset.turbulence &&
    tuning.density === preset.density &&
    tuning.pocketDensity === preset.pocketDensity &&
    tuning.pocketSize === preset.pocketSize &&
    tuning.softness === preset.softness &&
    tuning.drift === preset.drift &&
    tuning.glow === preset.glow &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.shadowColor === preset.shadowColor &&
    tuning.poisonColor === preset.poisonColor &&
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

function isChaosTuningMatch(tuning: ChaosEffectTuning, preset: ChaosEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.chaosScale === preset.chaosScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.riftDensity === preset.riftDensity &&
    tuning.riftWarp === preset.riftWarp &&
    tuning.moteDensity === preset.moteDensity &&
    tuning.moteSize === preset.moteSize &&
    tuning.colorShift === preset.colorShift &&
    tuning.pulse === preset.pulse &&
    tuning.glow === preset.glow &&
    tuning.instability === preset.instability &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.backgroundColor === preset.backgroundColor &&
    tuning.riftColor === preset.riftColor &&
    tuning.moteColor === preset.moteColor &&
    tuning.accentColor === preset.accentColor
  );
}

function isVoidTuningMatch(tuning: VoidEffectTuning, preset: VoidEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.tendrilScale === preset.tendrilScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.tendrilDensity === preset.tendrilDensity &&
    tuning.tendrilWidth === preset.tendrilWidth &&
    tuning.curl === preset.curl &&
    tuning.reach === preset.reach &&
    tuning.voidDepth === preset.voidDepth &&
    tuning.moteDensity === preset.moteDensity &&
    tuning.moteSize === preset.moteSize &&
    tuning.pulse === preset.pulse &&
    tuning.glow === preset.glow &&
    tuning.instability === preset.instability &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.backgroundColor === preset.backgroundColor &&
    tuning.tendrilColor === preset.tendrilColor &&
    tuning.voidColor === preset.voidColor &&
    tuning.accentColor === preset.accentColor
  );
}

function isNatureTuningMatch(tuning: NatureEffectTuning, preset: NatureEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.vineScale === preset.vineScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.vineDensity === preset.vineDensity &&
    tuning.vineWidth === preset.vineWidth &&
    tuning.vineBrightness === preset.vineBrightness &&
    tuning.curl === preset.curl &&
    tuning.thornDensity === preset.thornDensity &&
    tuning.thornSize === preset.thornSize &&
    tuning.thornBrightness === preset.thornBrightness &&
    tuning.thornIrregularity === preset.thornIrregularity &&
    tuning.leafDensity === preset.leafDensity &&
    tuning.leafSize === preset.leafSize &&
    tuning.leafSharpness === preset.leafSharpness &&
    tuning.growth === preset.growth &&
    tuning.glow === preset.glow &&
    tuning.instability === preset.instability &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.soilColor === preset.soilColor &&
    tuning.vineColor === preset.vineColor &&
    tuning.leafColor === preset.leafColor &&
    tuning.thornColor === preset.thornColor
  );
}

function isDistortionTuningMatch(tuning: DistortionEffectTuning, preset: DistortionEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.distortionScale === preset.distortionScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.distortionStrength === preset.distortionStrength &&
    tuning.rippleStrength === preset.rippleStrength &&
    tuning.rippleFrequency === preset.rippleFrequency &&
    tuning.shimmer === preset.shimmer &&
    tuning.turbulence === preset.turbulence &&
    tuning.causticStrength === preset.causticStrength &&
    tuning.edgeStrength === preset.edgeStrength &&
    tuning.pulse === preset.pulse &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.backgroundColor === preset.backgroundColor &&
    tuning.distortionColor === preset.distortionColor &&
    tuning.highlightColor === preset.highlightColor
  );
}

function isRadiantTuningMatch(tuning: RadiantEffectTuning, preset: RadiantEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.rayScale === preset.rayScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.rayDensity === preset.rayDensity &&
    tuning.rayBreakup === preset.rayBreakup &&
    tuning.raySpread === preset.raySpread &&
    tuning.rayDistance === preset.rayDistance &&
    tuning.moteDensity === preset.moteDensity &&
    tuning.moteSize === preset.moteSize &&
    tuning.shimmer === preset.shimmer &&
    tuning.bloom === preset.bloom &&
    tuning.streakWidth === preset.streakWidth &&
    tuning.pulse === preset.pulse &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.backgroundColor === preset.backgroundColor &&
    tuning.rayColor === preset.rayColor &&
    tuning.coreColor === preset.coreColor
  );
}

function isForceFieldTuningMatch(tuning: ForceFieldEffectTuning, preset: ForceFieldEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.fieldScale === preset.fieldScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.gridDensity === preset.gridDensity &&
    tuning.gridWarp === preset.gridWarp &&
    tuning.rippleStrength === preset.rippleStrength &&
    tuning.rippleFrequency === preset.rippleFrequency &&
    tuning.edgeStrength === preset.edgeStrength &&
    tuning.pulse === preset.pulse &&
    tuning.glow === preset.glow &&
    tuning.refraction === preset.refraction &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.backgroundColor === preset.backgroundColor &&
    tuning.gridColor === preset.gridColor &&
    tuning.edgeColor === preset.edgeColor
  );
}

function isShockwaveTuningMatch(tuning: ShockwaveEffectTuning, preset: ShockwaveEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.ringScale === preset.ringScale &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.ringCount === preset.ringCount &&
    tuning.ringWidth === preset.ringWidth &&
    tuning.ringSharpness === preset.ringSharpness &&
    tuning.distortion === preset.distortion &&
    tuning.turbulence === preset.turbulence &&
    tuning.centerStrength === preset.centerStrength &&
    tuning.fade === preset.fade &&
    tuning.pulse === preset.pulse &&
    tuning.glow === preset.glow &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.backgroundColor === preset.backgroundColor &&
    tuning.ringColor === preset.ringColor &&
    tuning.coreColor === preset.coreColor
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
