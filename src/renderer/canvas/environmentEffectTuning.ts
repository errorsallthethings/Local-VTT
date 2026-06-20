import type { EnvironmentEffectMask, EnvironmentEffectType } from "../../shared/localvtt";
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
} from "./environmentEffectsRenderer";

type EnvironmentEffectTuningSource = Partial<EnvironmentEffectMask>;

export function getEnvironmentEffectTuningFields(
  effect: EnvironmentEffectType,
  source: EnvironmentEffectTuningSource = {},
  fallback: EnvironmentEffectTuningSource = {}
): Partial<EnvironmentEffectMask> {
  if (effect === "acid") {
    return { acidTuning: cloneAcidEffectTuning(source.acidTuning ?? fallback.acidTuning) };
  }
  if (effect === "cold") {
    return { coldTuning: cloneColdEffectTuning(source.coldTuning ?? fallback.coldTuning) };
  }
  if (effect === "darkness") {
    return { darknessTuning: cloneDarknessEffectTuning(source.darknessTuning ?? fallback.darknessTuning) };
  }
  if (effect === "poison") {
    return { poisonTuning: clonePoisonEffectTuning(source.poisonTuning ?? fallback.poisonTuning) };
  }
  if (effect === "water") {
    return { waterTuning: cloneWaterEffectTuning(source.waterTuning ?? fallback.waterTuning) };
  }
  if (effect === "lava") {
    return { lavaTuning: cloneLavaEffectTuning(source.lavaTuning ?? fallback.lavaTuning) };
  }
  if (effect === "fire") {
    return { fireTuning: cloneFireEffectTuning(source.fireTuning ?? fallback.fireTuning) };
  }
  if (effect === "electric") {
    return { lightningTuning: cloneLightningEffectTuning(source.lightningTuning ?? fallback.lightningTuning) };
  }
  if (effect === "arcane") {
    return { arcaneTuning: cloneArcaneEffectTuning(source.arcaneTuning ?? fallback.arcaneTuning) };
  }
  if (effect === "chaos") {
    return { chaosTuning: cloneChaosEffectTuning(source.chaosTuning ?? fallback.chaosTuning) };
  }
  if (effect === "void") {
    return { voidTuning: cloneVoidEffectTuning(source.voidTuning ?? fallback.voidTuning) };
  }
  if (effect === "nature") {
    return { natureTuning: cloneNatureEffectTuning(source.natureTuning ?? fallback.natureTuning) };
  }
  if (effect === "distortion") {
    return { distortionTuning: cloneDistortionEffectTuning(source.distortionTuning ?? fallback.distortionTuning) };
  }
  if (effect === "radiant") {
    return { radiantTuning: cloneRadiantEffectTuning(source.radiantTuning ?? fallback.radiantTuning) };
  }
  if (effect === "field") {
    return { fieldTuning: cloneForceFieldEffectTuning(source.fieldTuning ?? fallback.fieldTuning) };
  }
  if (effect === "shockwave") {
    return { shockwaveTuning: cloneShockwaveEffectTuning(source.shockwaveTuning ?? fallback.shockwaveTuning) };
  }
  if (effect === "smoke") {
    return { smokeTuning: cloneSmokeEffectTuning(source.smokeTuning ?? fallback.smokeTuning) };
  }
  if (effect === "fog") {
    return { fogTuning: cloneFogEffectTuning(source.fogTuning ?? fallback.fogTuning) };
  }
  return {};
}
