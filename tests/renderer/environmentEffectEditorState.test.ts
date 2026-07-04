import { describe, expect, it, vi } from "vitest";
import type { EnvironmentEffectMask } from "../../src/shared/localvtt";
import {
  DEFAULT_ACID_EFFECT_TUNING,
  DEFAULT_WATER_EFFECT_TUNING,
  WATER_EFFECT_PRESETS
} from "../../src/renderer/canvas/effects";
import {
  applyEnvironmentEffectEditorPreset,
  getEnvironmentEffectEditorActiveTunings,
  getEnvironmentEffectEditorDefaultPresetValue,
  getEnvironmentEffectEditorDragPosition,
  getEnvironmentEffectEditorDragStart,
  getEnvironmentEffectEditorEmptyTuningMessage,
  getEnvironmentEffectEditorLabel,
  getEnvironmentEffectEditorModalClassName,
  getEnvironmentEffectEditorPresetValue,
  resetEnvironmentEffectEditorTuning,
  type EnvironmentEffectEditorTuningChangeHandlers,
  type EnvironmentEffectEditorTuningResetHandlers
} from "../../src/renderer/components/layers/modals/environmentEffectEditorState";

function environmentEffect(overrides: Partial<EnvironmentEffectMask> = {}): EnvironmentEffectMask {
  return {
    id: "effect-1",
    kind: "circle",
    effect: "water",
    points: [{ x: 10, y: 20 }],
    radius: 5,
    ...overrides
  };
}

function tuningChangeHandlers(): EnvironmentEffectEditorTuningChangeHandlers {
  return {
    onAcidTuningChange: vi.fn(),
    onColdTuningChange: vi.fn(),
    onDarknessTuningChange: vi.fn(),
    onPoisonTuningChange: vi.fn(),
    onWaterTuningChange: vi.fn(),
    onLavaTuningChange: vi.fn(),
    onFireTuningChange: vi.fn(),
    onLightningTuningChange: vi.fn(),
    onArcaneTuningChange: vi.fn(),
    onChaosTuningChange: vi.fn(),
    onVoidTuningChange: vi.fn(),
    onNatureTuningChange: vi.fn(),
    onDistortionTuningChange: vi.fn(),
    onRadiantTuningChange: vi.fn(),
    onForceFieldTuningChange: vi.fn(),
    onShockwaveTuningChange: vi.fn(),
    onSmokeTuningChange: vi.fn(),
    onFogTuningChange: vi.fn()
  };
}

function tuningResetHandlers(): EnvironmentEffectEditorTuningResetHandlers {
  return {
    onAcidTuningReset: vi.fn(),
    onColdTuningReset: vi.fn(),
    onDarknessTuningReset: vi.fn(),
    onPoisonTuningReset: vi.fn(),
    onWaterTuningReset: vi.fn(),
    onLavaTuningReset: vi.fn(),
    onFireTuningReset: vi.fn(),
    onLightningTuningReset: vi.fn(),
    onArcaneTuningReset: vi.fn(),
    onChaosTuningReset: vi.fn(),
    onVoidTuningReset: vi.fn(),
    onNatureTuningReset: vi.fn(),
    onDistortionTuningReset: vi.fn(),
    onRadiantTuningReset: vi.fn(),
    onForceFieldTuningReset: vi.fn(),
    onShockwaveTuningReset: vi.fn(),
    onSmokeTuningReset: vi.fn(),
    onFogTuningReset: vi.fn()
  };
}

describe("environment effect editor state", () => {
  it("derives display labels from custom names or effect labels", () => {
    expect(getEnvironmentEffectEditorLabel(environmentEffect({ name: "  Steam Vent  " }))).toBe("Steam Vent");
    expect(getEnvironmentEffectEditorLabel(environmentEffect({ effect: "field" }))).toBe("Force Field Effect");
  });

  it("merges active tunings over defaults without reusing default objects", () => {
    const activeTunings = getEnvironmentEffectEditorActiveTunings(environmentEffect({
      effect: "acid",
      acidTuning: { opacity: 0.42 }
    }));

    expect(activeTunings.acid).toEqual({ ...DEFAULT_ACID_EFFECT_TUNING, opacity: 0.42 });
    expect(activeTunings.acid).not.toBe(DEFAULT_ACID_EFFECT_TUNING);
    expect(activeTunings.water).toEqual(DEFAULT_WATER_EFFECT_TUNING);
    expect(activeTunings.water).not.toBe(DEFAULT_WATER_EFFECT_TUNING);
  });

  it("uses active tuning values to report the default preset selection", () => {
    expect(getEnvironmentEffectEditorDefaultPresetValue(environmentEffect({
      waterTuning: WATER_EFFECT_PRESETS.stream
    }))).toBe("stream");
    expect(getEnvironmentEffectEditorDefaultPresetValue(environmentEffect({
      waterTuning: { ...DEFAULT_WATER_EFFECT_TUNING, opacity: 0.123 }
    }))).toBe("custom");
  });

  it("keeps manual preset selection scoped to the edited effect", () => {
    expect(getEnvironmentEffectEditorPresetValue({ effectId: "effect-1", value: "river" }, "effect-1", "custom")).toBe("river");
    expect(getEnvironmentEffectEditorPresetValue({ effectId: "effect-1", value: "river" }, "effect-2", "custom")).toBe("custom");
  });

  it("dispatches preset changes to the matching tuning handler", () => {
    const handlers = tuningChangeHandlers();

    applyEnvironmentEffectEditorPreset("water", "stream", handlers);

    expect(handlers.onWaterTuningChange).toHaveBeenCalledWith(WATER_EFFECT_PRESETS.stream);
    expect(handlers.onFireTuningChange).not.toHaveBeenCalled();
  });

  it("dispatches reset requests through legacy effect field names", () => {
    const electricHandlers = tuningResetHandlers();
    const fieldHandlers = tuningResetHandlers();

    resetEnvironmentEffectEditorTuning("electric", electricHandlers);
    resetEnvironmentEffectEditorTuning("field", fieldHandlers);

    expect(electricHandlers.onLightningTuningReset).toHaveBeenCalledTimes(1);
    expect(electricHandlers.onWaterTuningReset).not.toHaveBeenCalled();
    expect(fieldHandlers.onForceFieldTuningReset).toHaveBeenCalledTimes(1);
    expect(fieldHandlers.onFireTuningReset).not.toHaveBeenCalled();
  });

  it("builds modal classes and empty tuning copy", () => {
    expect(getEnvironmentEffectEditorModalClassName(null)).toBe("environment-effect-editor-modal");
    expect(getEnvironmentEffectEditorModalClassName({ x: 12, y: 34 })).toBe("environment-effect-editor-modal environment-effect-editor-modal-positioned");
    expect(getEnvironmentEffectEditorEmptyTuningMessage("arcane")).toBe("Arcane effects do not have advanced controls yet.");
  });

  it("calculates drag offsets and next modal positions", () => {
    const dragState = getEnvironmentEffectEditorDragStart(7, 130, 260, { left: 100, top: 200 });

    expect(dragState).toEqual({ pointerId: 7, offsetX: 30, offsetY: 60 });
    expect(getEnvironmentEffectEditorDragPosition(dragState, 180, 290)).toEqual({ x: 150, y: 230 });
  });
});
