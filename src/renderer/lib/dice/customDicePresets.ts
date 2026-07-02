export interface CustomDicePreset {
  id: string;
  label: string;
  formula: string;
}

export interface CustomDicePresetStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const CUSTOM_DICE_PRESETS_STORAGE_KEY = "localvtt.customDicePresets";
export const MAX_CUSTOM_DICE_PRESETS = 12;

export function loadCustomDicePresets(storage: CustomDicePresetStorage): CustomDicePreset[] {
  try {
    return normalizeCustomDicePresets(JSON.parse(storage.getItem(CUSTOM_DICE_PRESETS_STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function saveCustomDicePresets(storage: CustomDicePresetStorage, presets: readonly CustomDicePreset[]): void {
  storage.setItem(CUSTOM_DICE_PRESETS_STORAGE_KEY, JSON.stringify(normalizeCustomDicePresets(presets)));
}

export function addCustomDicePreset(presets: readonly CustomDicePreset[], preset: CustomDicePreset): CustomDicePreset[] {
  return [preset, ...normalizeCustomDicePresets(presets)].slice(0, MAX_CUSTOM_DICE_PRESETS);
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
