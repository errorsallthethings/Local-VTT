import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIGHTNING_EFFECT_TUNING,
  DEFAULT_WATER_EFFECT_TUNING
} from "../../src/renderer/canvas/environmentEffectsRenderer";
import { getEnvironmentEffectTuningFields } from "../../src/renderer/canvas/environmentEffectTuning";

describe("environment effect tuning fields", () => {
  it("returns only the matching tuning field", () => {
    const fields = getEnvironmentEffectTuningFields("water", {}, { waterTuning: DEFAULT_WATER_EFFECT_TUNING });

    expect(Object.keys(fields)).toEqual(["waterTuning"]);
    expect(fields.waterTuning).toEqual(DEFAULT_WATER_EFFECT_TUNING);
  });

  it("clones tuning values instead of reusing the source object", () => {
    const fields = getEnvironmentEffectTuningFields("water", { waterTuning: DEFAULT_WATER_EFFECT_TUNING });

    expect(fields.waterTuning).toEqual(DEFAULT_WATER_EFFECT_TUNING);
    expect(fields.waterTuning).not.toBe(DEFAULT_WATER_EFFECT_TUNING);
  });

  it("prefers source tuning over fallback tuning", () => {
    const sourceTuning = { ...DEFAULT_WATER_EFFECT_TUNING, opacity: 0.25 };
    const fallbackTuning = { ...DEFAULT_WATER_EFFECT_TUNING, opacity: 0.75 };

    const fields = getEnvironmentEffectTuningFields("water", { waterTuning: sourceTuning }, { waterTuning: fallbackTuning });

    expect(fields.waterTuning?.opacity).toBe(0.25);
  });

  it("stores electric effect tuning in the legacy lightning field", () => {
    const fields = getEnvironmentEffectTuningFields("electric", {}, { lightningTuning: DEFAULT_LIGHTNING_EFFECT_TUNING });

    expect(Object.keys(fields)).toEqual(["lightningTuning"]);
    expect(fields.lightningTuning).toEqual(DEFAULT_LIGHTNING_EFFECT_TUNING);
  });
});
