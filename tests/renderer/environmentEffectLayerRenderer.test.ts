import { describe, expect, it } from "vitest";
import { ENVIRONMENT_EFFECT_REGISTRY } from "../../src/renderer/lib/effects";
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
  ENVIRONMENT_EFFECT_DRAWERS,
  buildEnvironmentEffectTuningOverrides,
  getRegisteredEnvironmentEffectDrawers
} from "../../src/renderer/canvas/effects";
import type { EnvironmentEffectType } from "../../src/shared/localvtt";

describe("environment effect layer renderer registry", () => {
  it("registers a 2D drawer for every public environment effect", () => {
    expect(getRegisteredEnvironmentEffectDrawers()).toEqual(Object.keys(ENVIRONMENT_EFFECT_REGISTRY).sort());
  });

  it("keeps electric and force-field effect ids routed through canonical drawer keys", () => {
    expect(ENVIRONMENT_EFFECT_DRAWERS.electric).toBeTypeOf("function");
    expect(ENVIRONMENT_EFFECT_DRAWERS.field).toBeTypeOf("function");
    expect((ENVIRONMENT_EFFECT_DRAWERS as Partial<Record<EnvironmentEffectType | "lightning" | "forceField", unknown>>).lightning).toBeUndefined();
    expect((ENVIRONMENT_EFFECT_DRAWERS as Partial<Record<EnvironmentEffectType | "lightning" | "forceField", unknown>>).forceField).toBeUndefined();
  });

  it("maps positional draw tuning overrides into named effect overrides", () => {
    const overrides = buildEnvironmentEffectTuningOverrides(
      DEFAULT_ACID_EFFECT_TUNING,
      DEFAULT_COLD_EFFECT_TUNING,
      DEFAULT_DARKNESS_EFFECT_TUNING,
      DEFAULT_POISON_EFFECT_TUNING,
      DEFAULT_WATER_EFFECT_TUNING,
      DEFAULT_LAVA_EFFECT_TUNING,
      DEFAULT_FIRE_EFFECT_TUNING,
      DEFAULT_LIGHTNING_EFFECT_TUNING,
      DEFAULT_ARCANE_EFFECT_TUNING,
      DEFAULT_CHAOS_EFFECT_TUNING,
      DEFAULT_VOID_EFFECT_TUNING,
      DEFAULT_NATURE_EFFECT_TUNING,
      DEFAULT_DISTORTION_EFFECT_TUNING,
      DEFAULT_RADIANT_EFFECT_TUNING,
      DEFAULT_FORCE_FIELD_EFFECT_TUNING,
      DEFAULT_SHOCKWAVE_EFFECT_TUNING,
      DEFAULT_SMOKE_EFFECT_TUNING,
      DEFAULT_FOG_EFFECT_TUNING
    );

    expect(overrides).toEqual({
      acidEffectTuning: DEFAULT_ACID_EFFECT_TUNING,
      coldEffectTuning: DEFAULT_COLD_EFFECT_TUNING,
      darknessEffectTuning: DEFAULT_DARKNESS_EFFECT_TUNING,
      poisonEffectTuning: DEFAULT_POISON_EFFECT_TUNING,
      waterEffectTuning: DEFAULT_WATER_EFFECT_TUNING,
      lavaEffectTuning: DEFAULT_LAVA_EFFECT_TUNING,
      fireEffectTuning: DEFAULT_FIRE_EFFECT_TUNING,
      lightningEffectTuning: DEFAULT_LIGHTNING_EFFECT_TUNING,
      arcaneEffectTuning: DEFAULT_ARCANE_EFFECT_TUNING,
      chaosEffectTuning: DEFAULT_CHAOS_EFFECT_TUNING,
      voidEffectTuning: DEFAULT_VOID_EFFECT_TUNING,
      natureEffectTuning: DEFAULT_NATURE_EFFECT_TUNING,
      distortionEffectTuning: DEFAULT_DISTORTION_EFFECT_TUNING,
      radiantEffectTuning: DEFAULT_RADIANT_EFFECT_TUNING,
      forceFieldEffectTuning: DEFAULT_FORCE_FIELD_EFFECT_TUNING,
      shockwaveEffectTuning: DEFAULT_SHOCKWAVE_EFFECT_TUNING,
      smokeEffectTuning: DEFAULT_SMOKE_EFFECT_TUNING,
      fogEffectTuning: DEFAULT_FOG_EFFECT_TUNING
    });
  });
});
