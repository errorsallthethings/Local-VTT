import type { EnvironmentEffectMask, EnvironmentEffectType } from "../../../../shared/localvtt";
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
  cloneWaterEffectTuning,
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
} from "../../../canvas/effects";
import { applyEnvironmentEffectPreset, formatEnvironmentEffectOptionLabel, getEnvironmentEffectPresetSelectValue } from "../../../lib/effects";

export interface EnvironmentEffectEditorActiveTunings {
  acid: AcidEffectTuning;
  cold: ColdEffectTuning;
  darkness: DarknessEffectTuning;
  poison: PoisonEffectTuning;
  water: WaterEffectTuning;
  lava: LavaEffectTuning;
  fire: FireEffectTuning;
  lightning: LightningEffectTuning;
  arcane: ArcaneEffectTuning;
  chaos: ChaosEffectTuning;
  void: VoidEffectTuning;
  nature: NatureEffectTuning;
  distortion: DistortionEffectTuning;
  radiant: RadiantEffectTuning;
  forceField: ForceFieldEffectTuning;
  shockwave: ShockwaveEffectTuning;
  smoke: SmokeEffectTuning;
  fog: FogEffectTuning;
}

export interface EnvironmentEffectEditorPosition {
  x: number;
  y: number;
}

export interface EnvironmentEffectEditorDragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

export interface EnvironmentEffectEditorPresetSelection {
  effectId: string;
  value: string;
}

export interface EnvironmentEffectEditorTuningChangeHandlers {
  onAcidTuningChange: (tuning: AcidEffectTuning) => void;
  onColdTuningChange: (tuning: ColdEffectTuning) => void;
  onDarknessTuningChange: (tuning: DarknessEffectTuning) => void;
  onPoisonTuningChange: (tuning: PoisonEffectTuning) => void;
  onWaterTuningChange: (tuning: WaterEffectTuning) => void;
  onLavaTuningChange: (tuning: LavaEffectTuning) => void;
  onFireTuningChange: (tuning: FireEffectTuning) => void;
  onLightningTuningChange: (tuning: LightningEffectTuning) => void;
  onArcaneTuningChange: (tuning: ArcaneEffectTuning) => void;
  onChaosTuningChange: (tuning: ChaosEffectTuning) => void;
  onVoidTuningChange: (tuning: VoidEffectTuning) => void;
  onNatureTuningChange: (tuning: NatureEffectTuning) => void;
  onDistortionTuningChange: (tuning: DistortionEffectTuning) => void;
  onRadiantTuningChange: (tuning: RadiantEffectTuning) => void;
  onForceFieldTuningChange: (tuning: ForceFieldEffectTuning) => void;
  onShockwaveTuningChange: (tuning: ShockwaveEffectTuning) => void;
  onSmokeTuningChange: (tuning: SmokeEffectTuning) => void;
  onFogTuningChange: (tuning: FogEffectTuning) => void;
}

export interface EnvironmentEffectEditorTuningResetHandlers {
  onAcidTuningReset: () => void;
  onColdTuningReset: () => void;
  onDarknessTuningReset: () => void;
  onPoisonTuningReset: () => void;
  onWaterTuningReset: () => void;
  onLavaTuningReset: () => void;
  onFireTuningReset: () => void;
  onLightningTuningReset: () => void;
  onArcaneTuningReset: () => void;
  onChaosTuningReset: () => void;
  onVoidTuningReset: () => void;
  onNatureTuningReset: () => void;
  onDistortionTuningReset: () => void;
  onRadiantTuningReset: () => void;
  onForceFieldTuningReset: () => void;
  onShockwaveTuningReset: () => void;
  onSmokeTuningReset: () => void;
  onFogTuningReset: () => void;
}

export function getEnvironmentEffectEditorLabel(effect: Pick<EnvironmentEffectMask, "effect" | "name">): string {
  return effect.name?.trim() || `${formatEnvironmentEffectOptionLabel(effect.effect)} Effect`;
}

export function getEnvironmentEffectEditorEmptyTuningMessage(effect: EnvironmentEffectMask["effect"]): string {
  return `${formatEnvironmentEffectOptionLabel(effect)} effects do not have advanced controls yet.`;
}

export function getEnvironmentEffectEditorModalClassName(position: EnvironmentEffectEditorPosition | null): string {
  return position
    ? "environment-effect-editor-modal environment-effect-editor-modal-positioned"
    : "environment-effect-editor-modal";
}

export function getEnvironmentEffectEditorActiveTunings(effect: EnvironmentEffectMask): EnvironmentEffectEditorActiveTunings {
  return {
    acid: { ...cloneAcidEffectTuning(), ...(effect.acidTuning ?? {}) },
    cold: { ...cloneColdEffectTuning(), ...(effect.coldTuning ?? {}) },
    darkness: { ...cloneDarknessEffectTuning(), ...(effect.darknessTuning ?? {}) },
    poison: { ...clonePoisonEffectTuning(), ...(effect.poisonTuning ?? {}) },
    water: { ...cloneWaterEffectTuning(), ...(effect.waterTuning ?? {}) },
    lava: { ...cloneLavaEffectTuning(), ...(effect.lavaTuning ?? {}) },
    fire: { ...cloneFireEffectTuning(), ...(effect.fireTuning ?? {}) },
    lightning: { ...cloneLightningEffectTuning(), ...(effect.lightningTuning ?? {}) },
    arcane: { ...cloneArcaneEffectTuning(), ...(effect.arcaneTuning ?? {}) },
    chaos: { ...cloneChaosEffectTuning(), ...(effect.chaosTuning ?? {}) },
    void: { ...cloneVoidEffectTuning(), ...(effect.voidTuning ?? {}) },
    nature: { ...cloneNatureEffectTuning(), ...(effect.natureTuning ?? {}) },
    distortion: { ...cloneDistortionEffectTuning(), ...(effect.distortionTuning ?? {}) },
    radiant: { ...cloneRadiantEffectTuning(), ...(effect.radiantTuning ?? {}) },
    forceField: { ...cloneForceFieldEffectTuning(), ...(effect.fieldTuning ?? {}) },
    shockwave: { ...cloneShockwaveEffectTuning(), ...(effect.shockwaveTuning ?? {}) },
    smoke: { ...cloneSmokeEffectTuning(), ...(effect.smokeTuning ?? {}) },
    fog: { ...cloneFogEffectTuning(), ...(effect.fogTuning ?? {}) }
  };
}

export function getEnvironmentEffectEditorDefaultPresetValue(
  effect: EnvironmentEffectMask,
  tunings: EnvironmentEffectEditorActiveTunings = getEnvironmentEffectEditorActiveTunings(effect)
): string {
  return getEnvironmentEffectPresetSelectValue(
    effect.effect,
    tunings.acid,
    tunings.cold,
    tunings.darkness,
    tunings.poison,
    tunings.water,
    tunings.lava,
    tunings.fire,
    tunings.lightning,
    tunings.arcane,
    tunings.chaos,
    tunings.void,
    tunings.nature,
    tunings.distortion,
    tunings.radiant,
    tunings.forceField,
    tunings.shockwave,
    tunings.smoke,
    tunings.fog
  );
}

export function getEnvironmentEffectEditorPresetValue(
  selection: EnvironmentEffectEditorPresetSelection,
  effectId: string,
  defaultPresetValue: string
): string {
  return selection.effectId === effectId ? selection.value : defaultPresetValue;
}

export function applyEnvironmentEffectEditorPreset(
  effect: EnvironmentEffectType,
  value: string,
  handlers: EnvironmentEffectEditorTuningChangeHandlers
) {
  applyEnvironmentEffectPreset(effect, value, {
    onAcidEffectTuningChange: handlers.onAcidTuningChange,
    onColdEffectTuningChange: handlers.onColdTuningChange,
    onDarknessEffectTuningChange: handlers.onDarknessTuningChange,
    onPoisonEffectTuningChange: handlers.onPoisonTuningChange,
    onWaterEffectTuningChange: handlers.onWaterTuningChange,
    onLavaEffectTuningChange: handlers.onLavaTuningChange,
    onFireEffectTuningChange: handlers.onFireTuningChange,
    onLightningEffectTuningChange: handlers.onLightningTuningChange,
    onArcaneEffectTuningChange: handlers.onArcaneTuningChange,
    onChaosEffectTuningChange: handlers.onChaosTuningChange,
    onVoidEffectTuningChange: handlers.onVoidTuningChange,
    onNatureEffectTuningChange: handlers.onNatureTuningChange,
    onDistortionEffectTuningChange: handlers.onDistortionTuningChange,
    onRadiantEffectTuningChange: handlers.onRadiantTuningChange,
    onForceFieldEffectTuningChange: handlers.onForceFieldTuningChange,
    onShockwaveEffectTuningChange: handlers.onShockwaveTuningChange,
    onSmokeEffectTuningChange: handlers.onSmokeTuningChange,
    onFogEffectTuningChange: handlers.onFogTuningChange
  });
}

export function resetEnvironmentEffectEditorTuning(
  effect: EnvironmentEffectType,
  handlers: EnvironmentEffectEditorTuningResetHandlers
) {
  const resetHandlers: Record<EnvironmentEffectType, () => void> = {
    acid: handlers.onAcidTuningReset,
    cold: handlers.onColdTuningReset,
    darkness: handlers.onDarknessTuningReset,
    poison: handlers.onPoisonTuningReset,
    water: handlers.onWaterTuningReset,
    lava: handlers.onLavaTuningReset,
    fire: handlers.onFireTuningReset,
    electric: handlers.onLightningTuningReset,
    arcane: handlers.onArcaneTuningReset,
    chaos: handlers.onChaosTuningReset,
    void: handlers.onVoidTuningReset,
    nature: handlers.onNatureTuningReset,
    distortion: handlers.onDistortionTuningReset,
    radiant: handlers.onRadiantTuningReset,
    field: handlers.onForceFieldTuningReset,
    shockwave: handlers.onShockwaveTuningReset,
    smoke: handlers.onSmokeTuningReset,
    fog: handlers.onFogTuningReset
  };

  resetHandlers[effect]();
}

export function getEnvironmentEffectEditorDragStart(
  pointerId: number,
  clientX: number,
  clientY: number,
  bounds: Pick<DOMRect, "left" | "top">
): EnvironmentEffectEditorDragState {
  return {
    pointerId,
    offsetX: clientX - bounds.left,
    offsetY: clientY - bounds.top
  };
}

export function getEnvironmentEffectEditorDragPosition(
  dragState: EnvironmentEffectEditorDragState,
  clientX: number,
  clientY: number
): EnvironmentEffectEditorPosition {
  return {
    x: clientX - dragState.offsetX,
    y: clientY - dragState.offsetY
  };
}
