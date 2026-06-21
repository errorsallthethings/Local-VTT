import { useState } from "react";
import type { EnvironmentEffectType } from "../../shared/localvtt";
import {
  DEFAULT_ACID_EFFECT_TUNING,
  DEFAULT_ARCANE_EFFECT_TUNING,
  DEFAULT_CHAOS_EFFECT_TUNING,
  DEFAULT_COLD_EFFECT_TUNING,
  DEFAULT_DARKNESS_EFFECT_TUNING,
  DEFAULT_DISTORTION_EFFECT_TUNING,
  DEFAULT_FIRE_EFFECT_TUNING,
  DEFAULT_FOG_EFFECT_TUNING,
  DEFAULT_FORCE_FIELD_EFFECT_TUNING,
  DEFAULT_LAVA_EFFECT_TUNING,
  DEFAULT_LIGHTNING_EFFECT_TUNING,
  DEFAULT_NATURE_EFFECT_TUNING,
  DEFAULT_POISON_EFFECT_TUNING,
  DEFAULT_RADIANT_EFFECT_TUNING,
  DEFAULT_SHOCKWAVE_EFFECT_TUNING,
  DEFAULT_SMOKE_EFFECT_TUNING,
  DEFAULT_VOID_EFFECT_TUNING,
  DEFAULT_WATER_EFFECT_TUNING,
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
} from "../canvas/effects";

export const getDefaultAcidEffectTuning = () => ({ ...DEFAULT_ACID_EFFECT_TUNING });
export const getDefaultColdEffectTuning = () => ({ ...DEFAULT_COLD_EFFECT_TUNING });
export const getDefaultDarknessEffectTuning = () => ({ ...DEFAULT_DARKNESS_EFFECT_TUNING });
export const getDefaultPoisonEffectTuning = () => ({ ...DEFAULT_POISON_EFFECT_TUNING });
export const getDefaultWaterEffectTuning = () => ({ ...DEFAULT_WATER_EFFECT_TUNING });
export const getDefaultLavaEffectTuning = () => ({ ...DEFAULT_LAVA_EFFECT_TUNING });
export const getDefaultFireEffectTuning = () => ({ ...DEFAULT_FIRE_EFFECT_TUNING });
export const getDefaultLightningEffectTuning = () => ({ ...DEFAULT_LIGHTNING_EFFECT_TUNING });
export const getDefaultArcaneEffectTuning = () => ({ ...DEFAULT_ARCANE_EFFECT_TUNING });
export const getDefaultChaosEffectTuning = () => ({ ...DEFAULT_CHAOS_EFFECT_TUNING });
export const getDefaultVoidEffectTuning = () => ({ ...DEFAULT_VOID_EFFECT_TUNING });
export const getDefaultNatureEffectTuning = () => ({ ...DEFAULT_NATURE_EFFECT_TUNING });
export const getDefaultDistortionEffectTuning = () => ({ ...DEFAULT_DISTORTION_EFFECT_TUNING });
export const getDefaultRadiantEffectTuning = () => ({ ...DEFAULT_RADIANT_EFFECT_TUNING });
export const getDefaultForceFieldEffectTuning = () => ({ ...DEFAULT_FORCE_FIELD_EFFECT_TUNING });
export const getDefaultShockwaveEffectTuning = () => ({ ...DEFAULT_SHOCKWAVE_EFFECT_TUNING });
export const getDefaultSmokeEffectTuning = () => ({ ...DEFAULT_SMOKE_EFFECT_TUNING });
export const getDefaultFogEffectTuning = () => ({ ...DEFAULT_FOG_EFFECT_TUNING });

export function useEnvironmentEffectTuning() {
  const [environmentEffectType, setEnvironmentEffectType] = useState<EnvironmentEffectType>("water");
  const [environmentEffectFeather, setEnvironmentEffectFeather] = useState(0);
  const [acidEffectTuning, setAcidEffectTuning] = useState<AcidEffectTuning>(DEFAULT_ACID_EFFECT_TUNING);
  const [coldEffectTuning, setColdEffectTuning] = useState<ColdEffectTuning>(DEFAULT_COLD_EFFECT_TUNING);
  const [darknessEffectTuning, setDarknessEffectTuning] = useState<DarknessEffectTuning>(DEFAULT_DARKNESS_EFFECT_TUNING);
  const [poisonEffectTuning, setPoisonEffectTuning] = useState<PoisonEffectTuning>(DEFAULT_POISON_EFFECT_TUNING);
  const [waterEffectTuning, setWaterEffectTuning] = useState<WaterEffectTuning>(DEFAULT_WATER_EFFECT_TUNING);
  const [lavaEffectTuning, setLavaEffectTuning] = useState<LavaEffectTuning>(DEFAULT_LAVA_EFFECT_TUNING);
  const [fireEffectTuning, setFireEffectTuning] = useState<FireEffectTuning>(DEFAULT_FIRE_EFFECT_TUNING);
  const [lightningEffectTuning, setLightningEffectTuning] = useState<LightningEffectTuning>(DEFAULT_LIGHTNING_EFFECT_TUNING);
  const [arcaneEffectTuning, setArcaneEffectTuning] = useState<ArcaneEffectTuning>(DEFAULT_ARCANE_EFFECT_TUNING);
  const [chaosEffectTuning, setChaosEffectTuning] = useState<ChaosEffectTuning>(DEFAULT_CHAOS_EFFECT_TUNING);
  const [voidEffectTuning, setVoidEffectTuning] = useState<VoidEffectTuning>(DEFAULT_VOID_EFFECT_TUNING);
  const [natureEffectTuning, setNatureEffectTuning] = useState<NatureEffectTuning>(DEFAULT_NATURE_EFFECT_TUNING);
  const [distortionEffectTuning, setDistortionEffectTuning] = useState<DistortionEffectTuning>(DEFAULT_DISTORTION_EFFECT_TUNING);
  const [radiantEffectTuning, setRadiantEffectTuning] = useState<RadiantEffectTuning>(DEFAULT_RADIANT_EFFECT_TUNING);
  const [forceFieldEffectTuning, setForceFieldEffectTuning] = useState<ForceFieldEffectTuning>(DEFAULT_FORCE_FIELD_EFFECT_TUNING);
  const [shockwaveEffectTuning, setShockwaveEffectTuning] = useState<ShockwaveEffectTuning>(DEFAULT_SHOCKWAVE_EFFECT_TUNING);
  const [smokeEffectTuning, setSmokeEffectTuning] = useState<SmokeEffectTuning>(DEFAULT_SMOKE_EFFECT_TUNING);
  const [fogEffectTuning, setFogEffectTuning] = useState<FogEffectTuning>(DEFAULT_FOG_EFFECT_TUNING);

  return {
    environmentEffectType,
    setEnvironmentEffectType,
    environmentEffectFeather,
    setEnvironmentEffectFeather,
    acidEffectTuning,
    setAcidEffectTuning,
    resetAcidEffectTuning: () => setAcidEffectTuning(getDefaultAcidEffectTuning()),
    coldEffectTuning,
    setColdEffectTuning,
    resetColdEffectTuning: () => setColdEffectTuning(getDefaultColdEffectTuning()),
    darknessEffectTuning,
    setDarknessEffectTuning,
    resetDarknessEffectTuning: () => setDarknessEffectTuning(getDefaultDarknessEffectTuning()),
    poisonEffectTuning,
    setPoisonEffectTuning,
    resetPoisonEffectTuning: () => setPoisonEffectTuning(getDefaultPoisonEffectTuning()),
    waterEffectTuning,
    setWaterEffectTuning,
    resetWaterEffectTuning: () => setWaterEffectTuning(getDefaultWaterEffectTuning()),
    lavaEffectTuning,
    setLavaEffectTuning,
    resetLavaEffectTuning: () => setLavaEffectTuning(getDefaultLavaEffectTuning()),
    fireEffectTuning,
    setFireEffectTuning,
    resetFireEffectTuning: () => setFireEffectTuning(getDefaultFireEffectTuning()),
    lightningEffectTuning,
    setLightningEffectTuning,
    resetLightningEffectTuning: () => setLightningEffectTuning(getDefaultLightningEffectTuning()),
    arcaneEffectTuning,
    setArcaneEffectTuning,
    resetArcaneEffectTuning: () => setArcaneEffectTuning(getDefaultArcaneEffectTuning()),
    chaosEffectTuning,
    setChaosEffectTuning,
    resetChaosEffectTuning: () => setChaosEffectTuning(getDefaultChaosEffectTuning()),
    voidEffectTuning,
    setVoidEffectTuning,
    resetVoidEffectTuning: () => setVoidEffectTuning(getDefaultVoidEffectTuning()),
    natureEffectTuning,
    setNatureEffectTuning,
    resetNatureEffectTuning: () => setNatureEffectTuning(getDefaultNatureEffectTuning()),
    distortionEffectTuning,
    setDistortionEffectTuning,
    resetDistortionEffectTuning: () => setDistortionEffectTuning(getDefaultDistortionEffectTuning()),
    radiantEffectTuning,
    setRadiantEffectTuning,
    resetRadiantEffectTuning: () => setRadiantEffectTuning(getDefaultRadiantEffectTuning()),
    forceFieldEffectTuning,
    setForceFieldEffectTuning,
    resetForceFieldEffectTuning: () => setForceFieldEffectTuning(getDefaultForceFieldEffectTuning()),
    shockwaveEffectTuning,
    setShockwaveEffectTuning,
    resetShockwaveEffectTuning: () => setShockwaveEffectTuning(getDefaultShockwaveEffectTuning()),
    smokeEffectTuning,
    setSmokeEffectTuning,
    resetSmokeEffectTuning: () => setSmokeEffectTuning(getDefaultSmokeEffectTuning()),
    fogEffectTuning,
    setFogEffectTuning,
    resetFogEffectTuning: () => setFogEffectTuning(getDefaultFogEffectTuning())
  };
}
