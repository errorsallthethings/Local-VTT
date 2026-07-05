import { describe, expect, it, vi } from "vitest";
import { ENVIRONMENT_EFFECT_TYPES, formatEnvironmentEffectName } from "../../src/shared/environmentEffectCatalog";
import type { EnvironmentEffectType } from "../../src/shared/localvtt";
import {
  ENVIRONMENT_EFFECT_OPTIONS,
  ENVIRONMENT_EFFECT_REGISTRY,
  applyEnvironmentEffectPreset,
  formatEnvironmentEffectTuningNumber,
  formatEnvironmentEffectOptionLabel,
  getEnvironmentEffectPresetOptions,
  getEnvironmentEffectPreviewFill,
  getEnvironmentEffectRegistryEntry,
  getEnvironmentEffectStroke,
  getEnvironmentEffectTuningReadout,
  parseEnvironmentEffectTuningSliderValue
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
    expect([...ENVIRONMENT_EFFECT_OPTIONS.map((option) => option.value)].sort()).toEqual([...ENVIRONMENT_EFFECT_TYPES].sort());
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

  it("uses the shared effect names for renderer labels", () => {
    for (const option of ENVIRONMENT_EFFECT_OPTIONS) {
      expect(option.label).toBe(formatEnvironmentEffectName(option.value));
      expect(ENVIRONMENT_EFFECT_REGISTRY[option.value].label).toBe(formatEnvironmentEffectName(option.value));
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

  it("keeps every visible preset option wired to an effect preset", () => {
    for (const effect of EXPECTED_ENVIRONMENT_EFFECTS) {
      for (const option of getEnvironmentEffectPresetOptions(effect).filter((presetOption) => presetOption.value !== "custom")) {
        const handlers = presetChangeHandlers();

        applyEnvironmentEffectPreset(effect, option.value, handlers);

        expect(getPresetHandlerCallCount(handlers), `${effect}:${option.value}`).toBe(1);
      }
    }
  });

  it("formats tuning numbers for compact slider readouts", () => {
    expect(formatEnvironmentEffectTuningNumber(2)).toBe("2");
    expect(formatEnvironmentEffectTuningNumber(0.5)).toBe("0.5");
    expect(formatEnvironmentEffectTuningNumber(0.125)).toBe("0.125");
    expect(formatEnvironmentEffectTuningNumber(0.333333)).toBe("0.333");
  });

  it("parses slider values with a stable fallback", () => {
    expect(parseEnvironmentEffectTuningSliderValue("1.25", 0.5)).toBe(1.25);
    expect(parseEnvironmentEffectTuningSliderValue("bad", 0.5)).toBe(0.5);
  });

  it("serializes effect tuning readouts consistently", () => {
    expect(getEnvironmentEffectTuningReadout({ opacity: 0.5, color: "#ffffff" })).toBe("{\"opacity\":0.5,\"color\":\"#ffffff\"}");
  });
});

type EnvironmentEffectPresetHandlers = Parameters<typeof applyEnvironmentEffectPreset>[2];

function presetChangeHandlers(): EnvironmentEffectPresetHandlers {
  return {
    onAcidEffectTuningChange: vi.fn(),
    onColdEffectTuningChange: vi.fn(),
    onDarknessEffectTuningChange: vi.fn(),
    onPoisonEffectTuningChange: vi.fn(),
    onWaterEffectTuningChange: vi.fn(),
    onLavaEffectTuningChange: vi.fn(),
    onFireEffectTuningChange: vi.fn(),
    onLightningEffectTuningChange: vi.fn(),
    onArcaneEffectTuningChange: vi.fn(),
    onChaosEffectTuningChange: vi.fn(),
    onVoidEffectTuningChange: vi.fn(),
    onNatureEffectTuningChange: vi.fn(),
    onDistortionEffectTuningChange: vi.fn(),
    onRadiantEffectTuningChange: vi.fn(),
    onForceFieldEffectTuningChange: vi.fn(),
    onShockwaveEffectTuningChange: vi.fn(),
    onSmokeEffectTuningChange: vi.fn(),
    onFogEffectTuningChange: vi.fn()
  };
}

function getPresetHandlerCallCount(handlers: EnvironmentEffectPresetHandlers): number {
  return Object.values(handlers).reduce((count, handler) => count + vi.mocked(handler).mock.calls.length, 0);
}
