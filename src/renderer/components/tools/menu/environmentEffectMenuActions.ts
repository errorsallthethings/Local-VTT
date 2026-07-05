import type { EnvironmentEffectType } from "../../../../shared/localvtt";
import type {
  AcidEffectTuning,
  ArcaneEffectTuning,
  ChaosEffectTuning,
  ColdEffectTuning,
  DarknessEffectTuning,
  DistortionEffectTuning,
  FireEffectTuning,
  FogEffectTuning,
  ForceFieldEffectTuning,
  LavaEffectTuning,
  LightningEffectTuning,
  NatureEffectTuning,
  PoisonEffectTuning,
  RadiantEffectTuning,
  ShockwaveEffectTuning,
  SmokeEffectTuning,
  VoidEffectTuning,
  WaterEffectTuning
} from "../../../canvas/effects";
import { applyEnvironmentEffectPreset } from "../../../lib/effects";

export interface EnvironmentEffectPresetChangeHandlers {
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

export interface EnvironmentEffectResetHandlers {
  onAcidEffectTuningReset: () => void;
  onColdEffectTuningReset: () => void;
  onDarknessEffectTuningReset: () => void;
  onPoisonEffectTuningReset: () => void;
  onWaterEffectTuningReset: () => void;
  onLavaEffectTuningReset: () => void;
  onFireEffectTuningReset: () => void;
  onLightningEffectTuningReset: () => void;
  onArcaneEffectTuningReset: () => void;
  onChaosEffectTuningReset: () => void;
  onVoidEffectTuningReset: () => void;
  onNatureEffectTuningReset: () => void;
  onDistortionEffectTuningReset: () => void;
  onRadiantEffectTuningReset: () => void;
  onForceFieldEffectTuningReset: () => void;
  onShockwaveEffectTuningReset: () => void;
  onSmokeEffectTuningReset: () => void;
  onFogEffectTuningReset: () => void;
}

export function applySelectedEnvironmentEffectPreset(
  effect: EnvironmentEffectType,
  presetValue: string,
  handlers: EnvironmentEffectPresetChangeHandlers
): void {
  if (presetValue === "custom") {
    return;
  }
  applyEnvironmentEffectPreset(effect, presetValue, handlers);
}

export function resetSelectedEnvironmentEffectTuning(
  effect: EnvironmentEffectType,
  presetValue: string,
  presetHandlers: EnvironmentEffectPresetChangeHandlers,
  resetHandlers: EnvironmentEffectResetHandlers
): void {
  if (presetValue !== "custom") {
    applySelectedEnvironmentEffectPreset(effect, presetValue, presetHandlers);
    return;
  }

  getEnvironmentEffectResetHandler(effect, resetHandlers)();
}

export function getEnvironmentEffectResetHandler(effect: EnvironmentEffectType, handlers: EnvironmentEffectResetHandlers): () => void {
  if (effect === "acid") {
    return handlers.onAcidEffectTuningReset;
  }
  if (effect === "cold") {
    return handlers.onColdEffectTuningReset;
  }
  if (effect === "darkness") {
    return handlers.onDarknessEffectTuningReset;
  }
  if (effect === "poison") {
    return handlers.onPoisonEffectTuningReset;
  }
  if (effect === "water") {
    return handlers.onWaterEffectTuningReset;
  }
  if (effect === "lava") {
    return handlers.onLavaEffectTuningReset;
  }
  if (effect === "fire") {
    return handlers.onFireEffectTuningReset;
  }
  if (effect === "electric") {
    return handlers.onLightningEffectTuningReset;
  }
  if (effect === "arcane") {
    return handlers.onArcaneEffectTuningReset;
  }
  if (effect === "chaos") {
    return handlers.onChaosEffectTuningReset;
  }
  if (effect === "void") {
    return handlers.onVoidEffectTuningReset;
  }
  if (effect === "nature") {
    return handlers.onNatureEffectTuningReset;
  }
  if (effect === "distortion") {
    return handlers.onDistortionEffectTuningReset;
  }
  if (effect === "radiant") {
    return handlers.onRadiantEffectTuningReset;
  }
  if (effect === "field") {
    return handlers.onForceFieldEffectTuningReset;
  }
  if (effect === "shockwave") {
    return handlers.onShockwaveEffectTuningReset;
  }
  if (effect === "smoke") {
    return handlers.onSmokeEffectTuningReset;
  }
  if (effect === "fog") {
    return handlers.onFogEffectTuningReset;
  }
  return handlers.onWaterEffectTuningReset;
}
