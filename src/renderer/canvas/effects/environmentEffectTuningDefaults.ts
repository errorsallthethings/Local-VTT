import {
  DEFAULT_ACID_EFFECT_TUNING_SETTINGS,
  DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS,
  DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS,
  DEFAULT_COLD_EFFECT_TUNING_SETTINGS,
  DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS,
  DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS,
  DEFAULT_FOG_EFFECT_TUNING_SETTINGS,
  DEFAULT_FIRE_EFFECT_TUNING_SETTINGS,
  DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS,
  DEFAULT_LAVA_EFFECT_TUNING_SETTINGS,
  DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS,
  DEFAULT_NATURE_EFFECT_TUNING_SETTINGS,
  DEFAULT_POISON_EFFECT_TUNING_SETTINGS,
  DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS,
  DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS,
  DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS,
  DEFAULT_VOID_EFFECT_TUNING_SETTINGS,
  DEFAULT_WATER_EFFECT_TUNING_SETTINGS,
  type AcidEffectTuningSettings,
  type ArcaneEffectTuningSettings,
  type ChaosEffectTuningSettings,
  type ColdEffectTuningSettings,
  type DarknessEffectTuningSettings,
  type DistortionEffectTuningSettings,
  type FogEffectTuningSettings,
  type FireEffectTuningSettings,
  type ForceFieldEffectTuningSettings,
  type LavaEffectTuningSettings,
  type LightningEffectTuningSettings,
  type NatureEffectTuningSettings,
  type PoisonEffectTuningSettings,
  type RadiantEffectTuningSettings,
  type ShockwaveEffectTuningSettings,
  type SmokeEffectTuningSettings,
  type VoidEffectTuningSettings,
  type WaterEffectTuningSettings
} from "../../../shared/localvtt";

export type WaterEffectTuning = WaterEffectTuningSettings;
export type AcidEffectTuning = AcidEffectTuningSettings;
export type PoisonEffectTuning = PoisonEffectTuningSettings;
export type ColdEffectTuning = ColdEffectTuningSettings;
export type LavaEffectTuning = LavaEffectTuningSettings;
export type FireEffectTuning = FireEffectTuningSettings;
export type ForceFieldEffectTuning = ForceFieldEffectTuningSettings;
export type ShockwaveEffectTuning = ShockwaveEffectTuningSettings;
export type DistortionEffectTuning = DistortionEffectTuningSettings;
export type LightningEffectTuning = LightningEffectTuningSettings;
export type ArcaneEffectTuning = ArcaneEffectTuningSettings;
export type ChaosEffectTuning = ChaosEffectTuningSettings;
export type VoidEffectTuning = VoidEffectTuningSettings;
export type NatureEffectTuning = NatureEffectTuningSettings;
export type RadiantEffectTuning = RadiantEffectTuningSettings;
export type SmokeEffectTuning = SmokeEffectTuningSettings;
export type FogEffectTuning = FogEffectTuningSettings;
export type DarknessEffectTuning = DarknessEffectTuningSettings;

export const DEFAULT_WATER_EFFECT_TUNING: WaterEffectTuning = DEFAULT_WATER_EFFECT_TUNING_SETTINGS;
export const DEFAULT_ACID_EFFECT_TUNING: AcidEffectTuning = DEFAULT_ACID_EFFECT_TUNING_SETTINGS;
export const DEFAULT_POISON_EFFECT_TUNING: PoisonEffectTuning = DEFAULT_POISON_EFFECT_TUNING_SETTINGS;
export const DEFAULT_COLD_EFFECT_TUNING: ColdEffectTuning = DEFAULT_COLD_EFFECT_TUNING_SETTINGS;
export const DEFAULT_DARKNESS_EFFECT_TUNING: DarknessEffectTuning = DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS;
export const DEFAULT_LAVA_EFFECT_TUNING: LavaEffectTuning = DEFAULT_LAVA_EFFECT_TUNING_SETTINGS;
export const DEFAULT_FIRE_EFFECT_TUNING: FireEffectTuning = DEFAULT_FIRE_EFFECT_TUNING_SETTINGS;
export const DEFAULT_FORCE_FIELD_EFFECT_TUNING: ForceFieldEffectTuning = DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS;
export const DEFAULT_SHOCKWAVE_EFFECT_TUNING: ShockwaveEffectTuning = DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS;
export const DEFAULT_DISTORTION_EFFECT_TUNING: DistortionEffectTuning = DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS;
export const DEFAULT_LIGHTNING_EFFECT_TUNING: LightningEffectTuning = DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS;
export const DEFAULT_ARCANE_EFFECT_TUNING: ArcaneEffectTuning = DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS;
export const DEFAULT_CHAOS_EFFECT_TUNING: ChaosEffectTuning = DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS;
export const DEFAULT_VOID_EFFECT_TUNING: VoidEffectTuning = DEFAULT_VOID_EFFECT_TUNING_SETTINGS;
export const DEFAULT_NATURE_EFFECT_TUNING: NatureEffectTuning = DEFAULT_NATURE_EFFECT_TUNING_SETTINGS;
export const DEFAULT_RADIANT_EFFECT_TUNING: RadiantEffectTuning = DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS;
export const DEFAULT_SMOKE_EFFECT_TUNING: SmokeEffectTuning = DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS;
export const DEFAULT_FOG_EFFECT_TUNING: FogEffectTuning = DEFAULT_FOG_EFFECT_TUNING_SETTINGS;

export function cloneWaterEffectTuning(tuning?: WaterEffectTuning): WaterEffectTuning {
  return { ...(tuning ?? DEFAULT_WATER_EFFECT_TUNING) };
}

export function cloneAcidEffectTuning(tuning?: AcidEffectTuning): AcidEffectTuning {
  return { ...(tuning ?? DEFAULT_ACID_EFFECT_TUNING) };
}

export function clonePoisonEffectTuning(tuning?: PoisonEffectTuning): PoisonEffectTuning {
  return { ...(tuning ?? DEFAULT_POISON_EFFECT_TUNING) };
}

export function cloneColdEffectTuning(tuning?: ColdEffectTuning): ColdEffectTuning {
  return { ...(tuning ?? DEFAULT_COLD_EFFECT_TUNING) };
}

export function cloneDarknessEffectTuning(tuning?: DarknessEffectTuning): DarknessEffectTuning {
  return { ...(tuning ?? DEFAULT_DARKNESS_EFFECT_TUNING) };
}

export function cloneLavaEffectTuning(tuning?: LavaEffectTuning): LavaEffectTuning {
  return { ...(tuning ?? DEFAULT_LAVA_EFFECT_TUNING) };
}

export function cloneFireEffectTuning(tuning?: FireEffectTuning): FireEffectTuning {
  return { ...(tuning ?? DEFAULT_FIRE_EFFECT_TUNING) };
}

export function cloneLightningEffectTuning(tuning?: LightningEffectTuning): LightningEffectTuning {
  return { ...(tuning ?? DEFAULT_LIGHTNING_EFFECT_TUNING) };
}

export function cloneArcaneEffectTuning(tuning?: ArcaneEffectTuning): ArcaneEffectTuning {
  return { ...(tuning ?? DEFAULT_ARCANE_EFFECT_TUNING) };
}

export function cloneChaosEffectTuning(tuning?: ChaosEffectTuning): ChaosEffectTuning {
  return { ...(tuning ?? DEFAULT_CHAOS_EFFECT_TUNING) };
}

export function cloneVoidEffectTuning(tuning?: VoidEffectTuning): VoidEffectTuning {
  return { ...(tuning ?? DEFAULT_VOID_EFFECT_TUNING) };
}

export function cloneNatureEffectTuning(tuning?: NatureEffectTuning): NatureEffectTuning {
  return { ...(tuning ?? DEFAULT_NATURE_EFFECT_TUNING) };
}

export function cloneDistortionEffectTuning(tuning?: DistortionEffectTuning): DistortionEffectTuning {
  return { ...(tuning ?? DEFAULT_DISTORTION_EFFECT_TUNING) };
}

export function cloneRadiantEffectTuning(tuning?: RadiantEffectTuning): RadiantEffectTuning {
  return { ...(tuning ?? DEFAULT_RADIANT_EFFECT_TUNING) };
}

export function cloneForceFieldEffectTuning(tuning?: ForceFieldEffectTuning): ForceFieldEffectTuning {
  return { ...(tuning ?? DEFAULT_FORCE_FIELD_EFFECT_TUNING) };
}

export function cloneShockwaveEffectTuning(tuning?: ShockwaveEffectTuning): ShockwaveEffectTuning {
  return { ...(tuning ?? DEFAULT_SHOCKWAVE_EFFECT_TUNING) };
}

export function cloneSmokeEffectTuning(tuning?: SmokeEffectTuning): SmokeEffectTuning {
  return { ...(tuning ?? DEFAULT_SMOKE_EFFECT_TUNING) };
}

export function cloneFogEffectTuning(tuning?: FogEffectTuning): FogEffectTuning {
  return { ...(tuning ?? DEFAULT_FOG_EFFECT_TUNING) };
}
