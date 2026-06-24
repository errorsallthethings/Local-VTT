import { describe, expect, it } from "vitest";
import {
  DEFAULT_FIRE_EFFECT_TUNING_SETTINGS,
  DEFAULT_WATER_EFFECT_TUNING_SETTINGS,
  normalizeFireEffectTuning,
  normalizeWaterEffectTuning
} from "../../src/shared/environmentEffectTuning";

describe("environment effect tuning", () => {
  it("clamps numeric tuning values and preserves fixed pan follow", () => {
    expect(normalizeWaterEffectTuning({ ...DEFAULT_WATER_EFFECT_TUNING_SETTINGS, opacity: 2, bandWidth: 0, panFollow: 0 })).toMatchObject({
      opacity: 1,
      bandWidth: 0.01,
      panFollow: 1
    });
  });

  it("falls back when color tuning values are invalid", () => {
    expect(normalizeFireEffectTuning({ ...DEFAULT_FIRE_EFFECT_TUNING_SETTINGS, flameColor: "red", hotColor: "#fff2a8" })).toMatchObject({
      flameColor: DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.flameColor,
      hotColor: "#fff2a8"
    });
  });
});
