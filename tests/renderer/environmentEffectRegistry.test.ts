import { describe, expect, it } from "vitest";
import type { EnvironmentEffectType } from "../../src/shared/localvtt";
import {
  ENVIRONMENT_EFFECT_OPTIONS,
  ENVIRONMENT_EFFECT_REGISTRY,
  formatEnvironmentEffectOptionLabel,
  getEnvironmentEffectPresetOptions,
  getEnvironmentEffectPreviewFill,
  getEnvironmentEffectRegistryEntry,
  getEnvironmentEffectStroke
} from "../../src/renderer/lib/effects";

const EXPECTED_ENVIRONMENT_EFFECTS: EnvironmentEffectType[] = [
  "acid",
  "arcane",
  "chaos",
  "cold",
  "darkness",
  "distortion",
  "electric",
  "fire",
  "field",
  "lava",
  "fog",
  "nature",
  "poison",
  "radiant",
  "shockwave",
  "smoke",
  "void",
  "water"
];

describe("environment effect registry", () => {
  it("registers every effect used by the Effects Tools dropdown", () => {
    expect(ENVIRONMENT_EFFECT_OPTIONS.map((option) => option.value)).toEqual(EXPECTED_ENVIRONMENT_EFFECTS);
    expect(Object.keys(ENVIRONMENT_EFFECT_REGISTRY).sort()).toEqual([...EXPECTED_ENVIRONMENT_EFFECTS].sort());
  });

  it("keeps effect metadata available through one registry entry", () => {
    for (const option of ENVIRONMENT_EFFECT_OPTIONS) {
      const entry = getEnvironmentEffectRegistryEntry(option.value);

      expect(entry.id).toBe(option.value);
      expect(entry.label).toBe(option.label);
      expect(entry.presetOptions[0]).toEqual({ label: "Custom", value: "custom" });
      expect(entry.canvasStyle.previewFill).toBeTruthy();
      expect(entry.canvasStyle.stroke).toBeTruthy();
    }
  });

  it("routes public effect helpers through the registry metadata", () => {
    for (const effect of EXPECTED_ENVIRONMENT_EFFECTS) {
      const entry = ENVIRONMENT_EFFECT_REGISTRY[effect];

      expect(formatEnvironmentEffectOptionLabel(effect)).toBe(entry.label);
      expect(getEnvironmentEffectPresetOptions(effect)).toBe(entry.presetOptions);
      expect(getEnvironmentEffectPreviewFill(effect)).toBe(entry.canvasStyle.previewFill);
      expect(getEnvironmentEffectStroke(effect)).toBe(entry.canvasStyle.stroke);
    }
  });
});
