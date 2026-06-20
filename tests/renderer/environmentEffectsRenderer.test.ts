import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACID_EFFECT_TUNING,
  DEFAULT_WATER_EFFECT_TUNING,
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
} from "../../src/renderer/canvas/environmentEffectsRenderer";

describe("environment effects renderer helpers", () => {
  it("clones default tuning objects instead of returning shared references", () => {
    const clones = [
      cloneWaterEffectTuning(),
      cloneAcidEffectTuning(),
      clonePoisonEffectTuning(),
      cloneColdEffectTuning(),
      cloneDarknessEffectTuning(),
      cloneLavaEffectTuning(),
      cloneFireEffectTuning(),
      cloneLightningEffectTuning(),
      cloneArcaneEffectTuning(),
      cloneChaosEffectTuning(),
      cloneVoidEffectTuning(),
      cloneNatureEffectTuning(),
      cloneDistortionEffectTuning(),
      cloneRadiantEffectTuning(),
      cloneForceFieldEffectTuning(),
      cloneShockwaveEffectTuning(),
      cloneSmokeEffectTuning(),
      cloneFogEffectTuning()
    ];

    for (const clone of clones) {
      expect(clone).toBeTruthy();
      expect(typeof clone).toBe("object");
    }
    expect(cloneWaterEffectTuning()).toEqual(DEFAULT_WATER_EFFECT_TUNING);
    expect(cloneWaterEffectTuning()).not.toBe(DEFAULT_WATER_EFFECT_TUNING);
    expect(cloneAcidEffectTuning()).toEqual(DEFAULT_ACID_EFFECT_TUNING);
    expect(cloneAcidEffectTuning()).not.toBe(DEFAULT_ACID_EFFECT_TUNING);
  });

  it("clones explicit tuning overrides", () => {
    const waterTuning = { ...DEFAULT_WATER_EFFECT_TUNING, opacity: 0.25 };
    const acidTuning = { ...DEFAULT_ACID_EFFECT_TUNING, opacity: 0.5 };

    expect(cloneWaterEffectTuning(waterTuning)).toEqual(waterTuning);
    expect(cloneWaterEffectTuning(waterTuning)).not.toBe(waterTuning);
    expect(cloneAcidEffectTuning(acidTuning)).toEqual(acidTuning);
    expect(cloneAcidEffectTuning(acidTuning)).not.toBe(acidTuning);
  });
});
