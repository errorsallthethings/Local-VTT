import { describe, expect, it, vi } from "vitest";
import type { EnvironmentEffectType } from "../../src/shared/localvtt";
import {
  applySelectedEnvironmentEffectPreset,
  getEnvironmentEffectResetHandler,
  resetSelectedEnvironmentEffectTuning,
  type EnvironmentEffectPresetChangeHandlers,
  type EnvironmentEffectResetHandlers
} from "../../src/renderer/components/tools/menu/environmentEffectMenuActions";

describe("environment effect menu actions", () => {
  it("routes custom resets to the active effect reset handler", () => {
    const presetHandlers = presetChangeHandlers();
    const resetHandlers = resetHandlersForTest();

    for (const [effect, resetName] of [
      ["acid", "onAcidEffectTuningReset"],
      ["cold", "onColdEffectTuningReset"],
      ["darkness", "onDarknessEffectTuningReset"],
      ["poison", "onPoisonEffectTuningReset"],
      ["water", "onWaterEffectTuningReset"],
      ["lava", "onLavaEffectTuningReset"],
      ["fire", "onFireEffectTuningReset"],
      ["electric", "onLightningEffectTuningReset"],
      ["arcane", "onArcaneEffectTuningReset"],
      ["chaos", "onChaosEffectTuningReset"],
      ["void", "onVoidEffectTuningReset"],
      ["nature", "onNatureEffectTuningReset"],
      ["distortion", "onDistortionEffectTuningReset"],
      ["radiant", "onRadiantEffectTuningReset"],
      ["field", "onForceFieldEffectTuningReset"],
      ["shockwave", "onShockwaveEffectTuningReset"],
      ["smoke", "onSmokeEffectTuningReset"],
      ["fog", "onFogEffectTuningReset"]
    ] as Array<[EnvironmentEffectType, keyof EnvironmentEffectResetHandlers]>) {
      resetSelectedEnvironmentEffectTuning(effect, "custom", presetHandlers, resetHandlers);
      expect(resetHandlers[resetName]).toHaveBeenCalledTimes(1);
      vi.mocked(resetHandlers[resetName]).mockClear();
    }
  });

  it("applies selected presets and ignores the custom sentinel", () => {
    const handlers = presetChangeHandlers();

    applySelectedEnvironmentEffectPreset("water", "custom", handlers);
    expect(handlers.onWaterEffectTuningChange).not.toHaveBeenCalled();

    applySelectedEnvironmentEffectPreset("water", "river", handlers);
    expect(handlers.onWaterEffectTuningChange).toHaveBeenCalledWith(expect.objectContaining({ speed: expect.any(Number) }));
  });

  it("reapplies the selected preset instead of defaulting when reset is pressed from a preset", () => {
    const presetHandlers = presetChangeHandlers();
    const resetHandlers = resetHandlersForTest();

    resetSelectedEnvironmentEffectTuning("fire", "inferno", presetHandlers, resetHandlers);

    expect(presetHandlers.onFireEffectTuningChange).toHaveBeenCalledWith(expect.objectContaining({ opacity: expect.any(Number), heat: expect.any(Number) }));
    expect(resetHandlers.onFireEffectTuningReset).not.toHaveBeenCalled();
  });

  it("exposes the reset handler lookup for direct routing checks", () => {
    const resetHandlers = resetHandlersForTest();

    getEnvironmentEffectResetHandler("field", resetHandlers)();

    expect(resetHandlers.onForceFieldEffectTuningReset).toHaveBeenCalledTimes(1);
  });
});

function presetChangeHandlers(): EnvironmentEffectPresetChangeHandlers {
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

function resetHandlersForTest(): EnvironmentEffectResetHandlers {
  return {
    onAcidEffectTuningReset: vi.fn(),
    onColdEffectTuningReset: vi.fn(),
    onDarknessEffectTuningReset: vi.fn(),
    onPoisonEffectTuningReset: vi.fn(),
    onWaterEffectTuningReset: vi.fn(),
    onLavaEffectTuningReset: vi.fn(),
    onFireEffectTuningReset: vi.fn(),
    onLightningEffectTuningReset: vi.fn(),
    onArcaneEffectTuningReset: vi.fn(),
    onChaosEffectTuningReset: vi.fn(),
    onVoidEffectTuningReset: vi.fn(),
    onNatureEffectTuningReset: vi.fn(),
    onDistortionEffectTuningReset: vi.fn(),
    onRadiantEffectTuningReset: vi.fn(),
    onForceFieldEffectTuningReset: vi.fn(),
    onShockwaveEffectTuningReset: vi.fn(),
    onSmokeEffectTuningReset: vi.fn(),
    onFogEffectTuningReset: vi.fn()
  };
}
