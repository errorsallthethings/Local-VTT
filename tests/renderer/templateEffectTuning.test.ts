import { describe, expect, it } from "vitest";
import { getTemplateEffectTuning, TEMPLATE_EFFECT_TUNING_VERSION } from "../../src/renderer/canvas/drawings";

describe("template effect tuning", () => {
  it("returns default tuning for plain effects", () => {
    expect(getTemplateEffectTuning("plain")).toEqual({
      density: 1,
      maxPlacements: 14,
      minPlacements: 5,
      opacity: 1,
      scale: 1
    });
  });

  it("merges effect-specific tuning over defaults", () => {
    expect(getTemplateEffectTuning("arcane")).toEqual({
      density: 1.12,
      maxPlacements: 16,
      minPlacements: 5,
      opacity: 1.18,
      scale: 1.12
    });
    expect(getTemplateEffectTuning("fog")).toEqual({
      density: 1.18,
      maxPlacements: 18,
      minPlacements: 5,
      opacity: 1.32,
      scale: 1
    });
  });

  it("exposes a cache version for tuning-sensitive overlays", () => {
    expect(TEMPLATE_EFFECT_TUNING_VERSION).toBe(2);
  });
});
