import { describe, expect, it } from "vitest";
import {
  addCustomDicePreset,
  CUSTOM_DICE_PRESETS_STORAGE_KEY,
  getCustomDicePresetFormClosedState,
  getCustomDicePresetFormOpenState,
  getCustomDicePresetSaveResult,
  loadCustomDicePresets,
  MAX_CUSTOM_DICE_PRESETS,
  normalizeCustomDicePresets,
  removeCustomDicePreset,
  saveCustomDicePresets,
  type CustomDicePreset,
  type CustomDicePresetStorage
} from "../../src/renderer/lib/dice";

function preset(index: number): CustomDicePreset {
  return { id: `preset-${index}`, label: `Preset ${index}`, formula: `${index}d6` };
}

function storage(initialValue: string | null = null): CustomDicePresetStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  if (initialValue !== null) {
    values.set(CUSTOM_DICE_PRESETS_STORAGE_KEY, initialValue);
  }
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
}

describe("custom dice presets", () => {
  it("loads valid presets from storage", () => {
    const stored = storage(JSON.stringify([preset(1), preset(2)]));

    expect(loadCustomDicePresets(stored)).toEqual([preset(1), preset(2)]);
  });

  it("returns an empty list for malformed storage", () => {
    expect(loadCustomDicePresets(storage("{bad json"))).toEqual([]);
    expect(loadCustomDicePresets(storage(JSON.stringify({ id: "preset" })))).toEqual([]);
  });

  it("filters invalid preset entries and caps the result", () => {
    const values = [
      preset(1),
      { id: "bad-label", label: "  ", formula: "d20" },
      { id: "bad-formula", label: "Bad", formula: "" },
      ...Array.from({ length: 20 }, (_value, index) => preset(index + 2))
    ];

    const normalized = normalizeCustomDicePresets(values);

    expect(normalized).toHaveLength(MAX_CUSTOM_DICE_PRESETS);
    expect(normalized[0]).toEqual(preset(1));
    expect(normalized.at(-1)).toEqual(preset(12));
  });

  it("saves normalized presets", () => {
    const stored = storage();

    saveCustomDicePresets(stored, [preset(1), { id: "bad", label: "", formula: "d20" } as CustomDicePreset]);

    expect(JSON.parse(stored.values.get(CUSTOM_DICE_PRESETS_STORAGE_KEY) ?? "null")).toEqual([preset(1)]);
  });

  it("adds new presets first while keeping the maximum count", () => {
    const existing = Array.from({ length: MAX_CUSTOM_DICE_PRESETS }, (_value, index) => preset(index + 1));

    expect(addCustomDicePreset(existing, preset(99))).toEqual([preset(99), ...existing.slice(0, MAX_CUSTOM_DICE_PRESETS - 1)]);
  });

  it("removes a preset by id after normalizing entries", () => {
    const presets = [preset(1), { id: "bad", label: "", formula: "d20" } as CustomDicePreset, preset(2)];

    expect(removeCustomDicePreset(presets, "preset-1")).toEqual([preset(2)]);
    expect(removeCustomDicePreset(presets, "missing")).toEqual([preset(1), preset(2)]);
  });

  it("builds preset form open and closed states", () => {
    expect(getCustomDicePresetFormOpenState("2d8+1")).toEqual({
      open: true,
      label: "",
      formula: "2d8+1",
      error: null
    });
    expect(getCustomDicePresetFormClosedState()).toEqual({
      open: false,
      label: "",
      formula: "",
      error: null
    });
  });

  it("builds save results from trimmed preset form values", () => {
    expect(getCustomDicePresetSaveResult("  Sneak Attack  ", "  2d6+3  ", "preset-new", () => null)).toEqual({
      ok: true,
      preset: { id: "preset-new", label: "Sneak Attack", formula: "2d6+3" }
    });
  });

  it("rejects incomplete or invalid preset form values", () => {
    expect(getCustomDicePresetSaveResult("  ", "d20", "preset-new", () => null)).toEqual({
      ok: false,
      error: "Label and formula are required."
    });
    expect(getCustomDicePresetSaveResult("Bad", "not dice", "preset-new", () => "Use dice.")).toEqual({
      ok: false,
      error: "Use dice."
    });
  });
});
