import { loadLocalStorageJson, saveLocalStorageJson } from "../storage/localStorageJson";

export interface CustomDicePreset {
  id: string;
  label: string;
  formula: string;
}

export interface CustomDicePresetStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CustomDicePresetFormState {
  open: boolean;
  label: string;
  formula: string;
  error: string | null;
}

export type CustomDicePresetSaveResult =
  | { ok: true; preset: CustomDicePreset }
  | { ok: false; error: string };

export const CUSTOM_DICE_PRESETS_STORAGE_KEY = "localvtt.customDicePresets";
export const MAX_CUSTOM_DICE_PRESETS = 12;

export function loadCustomDicePresets(storage: CustomDicePresetStorage): CustomDicePreset[] {
  return normalizeCustomDicePresets(loadLocalStorageJson(storage, CUSTOM_DICE_PRESETS_STORAGE_KEY, []));
}

export function saveCustomDicePresets(storage: CustomDicePresetStorage, presets: readonly CustomDicePreset[]): void {
  saveLocalStorageJson(storage, CUSTOM_DICE_PRESETS_STORAGE_KEY, normalizeCustomDicePresets(presets));
}

export function addCustomDicePreset(presets: readonly CustomDicePreset[], preset: CustomDicePreset): CustomDicePreset[] {
  return [preset, ...normalizeCustomDicePresets(presets)].slice(0, MAX_CUSTOM_DICE_PRESETS);
}

export function removeCustomDicePreset(presets: readonly CustomDicePreset[], presetId: string): CustomDicePreset[] {
  return normalizeCustomDicePresets(presets).filter((preset) => preset.id !== presetId);
}

export function getCustomDicePresetFormOpenState(currentFormula: string): CustomDicePresetFormState {
  return {
    open: true,
    label: "",
    formula: currentFormula,
    error: null
  };
}

export function getCustomDicePresetFormClosedState(): CustomDicePresetFormState {
  return {
    open: false,
    label: "",
    formula: "",
    error: null
  };
}

export function getCustomDicePresetSaveResult(
  label: string,
  formula: string,
  id: string,
  validateFormula: (formula: string) => string | null
): CustomDicePresetSaveResult {
  const trimmedLabel = label.trim();
  const trimmedFormula = formula.trim();
  if (!trimmedLabel || !trimmedFormula) {
    return { ok: false, error: "Label and formula are required." };
  }
  const formulaError = validateFormula(trimmedFormula);
  if (formulaError) {
    return { ok: false, error: formulaError };
  }
  return {
    ok: true,
    preset: {
      id,
      label: trimmedLabel,
      formula: trimmedFormula
    }
  };
}

export function normalizeCustomDicePresets(value: unknown): CustomDicePreset[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isCustomDicePreset).slice(0, MAX_CUSTOM_DICE_PRESETS);
}

function isCustomDicePreset(value: unknown): value is CustomDicePreset {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CustomDicePreset).id === "string" &&
    typeof (value as CustomDicePreset).label === "string" &&
    (value as CustomDicePreset).label.trim().length > 0 &&
    typeof (value as CustomDicePreset).formula === "string" &&
    (value as CustomDicePreset).formula.trim().length > 0
  );
}
