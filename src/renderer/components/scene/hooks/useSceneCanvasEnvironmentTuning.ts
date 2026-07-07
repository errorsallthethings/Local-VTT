import { useMemo } from "react";
import type { EnvironmentEffectMask } from "../../../../shared/localvtt";

export type SceneCanvasEnvironmentTuningOptions = Pick<
  EnvironmentEffectMask,
  | "acidTuning"
  | "arcaneTuning"
  | "chaosTuning"
  | "coldTuning"
  | "darknessTuning"
  | "distortionTuning"
  | "fieldTuning"
  | "fireTuning"
  | "fogTuning"
  | "lavaTuning"
  | "lightningTuning"
  | "natureTuning"
  | "poisonTuning"
  | "radiantTuning"
  | "shockwaveTuning"
  | "smokeTuning"
  | "voidTuning"
  | "waterTuning"
>;

export function getSceneCanvasEnvironmentTuning(options: SceneCanvasEnvironmentTuningOptions): Partial<EnvironmentEffectMask> {
  return {
    acidTuning: options.acidTuning,
    coldTuning: options.coldTuning,
    darknessTuning: options.darknessTuning,
    poisonTuning: options.poisonTuning,
    waterTuning: options.waterTuning,
    lavaTuning: options.lavaTuning,
    fireTuning: options.fireTuning,
    lightningTuning: options.lightningTuning,
    arcaneTuning: options.arcaneTuning,
    chaosTuning: options.chaosTuning,
    voidTuning: options.voidTuning,
    natureTuning: options.natureTuning,
    distortionTuning: options.distortionTuning,
    radiantTuning: options.radiantTuning,
    fieldTuning: options.fieldTuning,
    shockwaveTuning: options.shockwaveTuning,
    smokeTuning: options.smokeTuning,
    fogTuning: options.fogTuning
  };
}

export function useSceneCanvasEnvironmentTuning(options: SceneCanvasEnvironmentTuningOptions): Partial<EnvironmentEffectMask> {
  const {
    acidTuning,
    arcaneTuning,
    chaosTuning,
    coldTuning,
    darknessTuning,
    distortionTuning,
    fieldTuning,
    fireTuning,
    fogTuning,
    lavaTuning,
    lightningTuning,
    natureTuning,
    poisonTuning,
    radiantTuning,
    shockwaveTuning,
    smokeTuning,
    voidTuning,
    waterTuning
  } = options;

  return useMemo(
    () => getSceneCanvasEnvironmentTuning({
      acidTuning,
      arcaneTuning,
      chaosTuning,
      coldTuning,
      darknessTuning,
      distortionTuning,
      fieldTuning,
      fireTuning,
      fogTuning,
      lavaTuning,
      lightningTuning,
      natureTuning,
      poisonTuning,
      radiantTuning,
      shockwaveTuning,
      smokeTuning,
      voidTuning,
      waterTuning
    }),
    [
      acidTuning,
      arcaneTuning,
      chaosTuning,
      coldTuning,
      darknessTuning,
      distortionTuning,
      fieldTuning,
      fireTuning,
      fogTuning,
      lavaTuning,
      lightningTuning,
      natureTuning,
      poisonTuning,
      radiantTuning,
      shockwaveTuning,
      smokeTuning,
      voidTuning,
      waterTuning
    ]
  );
}
