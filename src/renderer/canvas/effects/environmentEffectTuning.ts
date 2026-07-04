import type { EnvironmentEffectMask, EnvironmentEffectType } from "../../../shared/localvtt";
import {
  cloneAcidEffectTuning,
  cloneArcaneEffectTuning,
  cloneChaosEffectTuning,
  cloneColdEffectTuning,
  cloneDarknessEffectTuning,
  cloneDistortionEffectTuning,
  cloneFireEffectTuning,
  cloneFogEffectTuning,
  cloneForceFieldEffectTuning,
  cloneLavaEffectTuning,
  cloneLightningEffectTuning,
  cloneNatureEffectTuning,
  clonePoisonEffectTuning,
  cloneRadiantEffectTuning,
  cloneShockwaveEffectTuning,
  cloneSmokeEffectTuning,
  cloneVoidEffectTuning,
  cloneWaterEffectTuning
} from "./environmentEffectTuningDefaults";

type EnvironmentEffectTuningSource = Partial<EnvironmentEffectMask>;
type EnvironmentEffectTuningField = Extract<
  keyof EnvironmentEffectMask,
  | "acidTuning"
  | "coldTuning"
  | "darknessTuning"
  | "poisonTuning"
  | "waterTuning"
  | "lavaTuning"
  | "fireTuning"
  | "lightningTuning"
  | "arcaneTuning"
  | "chaosTuning"
  | "voidTuning"
  | "natureTuning"
  | "distortionTuning"
  | "radiantTuning"
  | "fieldTuning"
  | "shockwaveTuning"
  | "smokeTuning"
  | "fogTuning"
>;
type EnvironmentEffectTuningResolver = (
  source: EnvironmentEffectTuningSource,
  fallback: EnvironmentEffectTuningSource
) => Partial<EnvironmentEffectMask>;

function createEnvironmentEffectTuningResolver<TKey extends EnvironmentEffectTuningField>(
  field: TKey,
  clone: (tuning?: NonNullable<EnvironmentEffectMask[TKey]>) => NonNullable<EnvironmentEffectMask[TKey]>
): EnvironmentEffectTuningResolver {
  return (source, fallback) => ({
    [field]: clone((source[field] ?? fallback[field]) as NonNullable<EnvironmentEffectMask[TKey]> | undefined)
  }) as Pick<EnvironmentEffectMask, TKey>;
}

export const ENVIRONMENT_EFFECT_TUNING_FIELDS: Record<EnvironmentEffectType, EnvironmentEffectTuningField> = {
  acid: "acidTuning",
  arcane: "arcaneTuning",
  chaos: "chaosTuning",
  cold: "coldTuning",
  darkness: "darknessTuning",
  distortion: "distortionTuning",
  electric: "lightningTuning",
  field: "fieldTuning",
  fire: "fireTuning",
  fog: "fogTuning",
  lava: "lavaTuning",
  nature: "natureTuning",
  poison: "poisonTuning",
  radiant: "radiantTuning",
  shockwave: "shockwaveTuning",
  smoke: "smokeTuning",
  void: "voidTuning",
  water: "waterTuning"
};

const ENVIRONMENT_EFFECT_TUNING_RESOLVERS: Record<EnvironmentEffectType, EnvironmentEffectTuningResolver> = {
  acid: createEnvironmentEffectTuningResolver("acidTuning", cloneAcidEffectTuning),
  arcane: createEnvironmentEffectTuningResolver("arcaneTuning", cloneArcaneEffectTuning),
  chaos: createEnvironmentEffectTuningResolver("chaosTuning", cloneChaosEffectTuning),
  cold: createEnvironmentEffectTuningResolver("coldTuning", cloneColdEffectTuning),
  darkness: createEnvironmentEffectTuningResolver("darknessTuning", cloneDarknessEffectTuning),
  distortion: createEnvironmentEffectTuningResolver("distortionTuning", cloneDistortionEffectTuning),
  electric: createEnvironmentEffectTuningResolver("lightningTuning", cloneLightningEffectTuning),
  field: createEnvironmentEffectTuningResolver("fieldTuning", cloneForceFieldEffectTuning),
  fire: createEnvironmentEffectTuningResolver("fireTuning", cloneFireEffectTuning),
  fog: createEnvironmentEffectTuningResolver("fogTuning", cloneFogEffectTuning),
  lava: createEnvironmentEffectTuningResolver("lavaTuning", cloneLavaEffectTuning),
  nature: createEnvironmentEffectTuningResolver("natureTuning", cloneNatureEffectTuning),
  poison: createEnvironmentEffectTuningResolver("poisonTuning", clonePoisonEffectTuning),
  radiant: createEnvironmentEffectTuningResolver("radiantTuning", cloneRadiantEffectTuning),
  shockwave: createEnvironmentEffectTuningResolver("shockwaveTuning", cloneShockwaveEffectTuning),
  smoke: createEnvironmentEffectTuningResolver("smokeTuning", cloneSmokeEffectTuning),
  void: createEnvironmentEffectTuningResolver("voidTuning", cloneVoidEffectTuning),
  water: createEnvironmentEffectTuningResolver("waterTuning", cloneWaterEffectTuning)
};

export function getRegisteredEnvironmentEffectTuningEffects(): EnvironmentEffectType[] {
  return Object.keys(ENVIRONMENT_EFFECT_TUNING_RESOLVERS).sort() as EnvironmentEffectType[];
}

export function getEnvironmentEffectTuningFields(
  effect: EnvironmentEffectType,
  source: EnvironmentEffectTuningSource = {},
  fallback: EnvironmentEffectTuningSource = {}
): Partial<EnvironmentEffectMask> {
  return ENVIRONMENT_EFFECT_TUNING_RESOLVERS[effect](source, fallback);
}
