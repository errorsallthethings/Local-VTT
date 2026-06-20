import { DEFAULT_DICE_SETTINGS, type DiceSettings } from "../../shared/localvtt";

export const DICE_SETTINGS_PREFERENCES_STORAGE_KEY = "localvtt.diceSettingsPreferences";

export function loadDiceSettingsPreference(): DiceSettings {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DICE_SETTINGS_PREFERENCES_STORAGE_KEY) ?? "null") as Partial<DiceSettings> | null;
    return normalizeDiceSettingsPreference(parsed);
  } catch {
    return { ...DEFAULT_DICE_SETTINGS };
  }
}

export function saveDiceSettingsPreference(settings: DiceSettings): void {
  try {
    window.localStorage.setItem(DICE_SETTINGS_PREFERENCES_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Preference persistence is helpful, but dice controls should still work if storage is unavailable.
  }
}

export function normalizeDiceSettingsPreference(settings?: Partial<DiceSettings> | null): DiceSettings {
  return {
    ...DEFAULT_DICE_SETTINGS,
    gmDisplayMode: isDiceDisplayModePreference(settings?.gmDisplayMode) ? settings.gmDisplayMode : DEFAULT_DICE_SETTINGS.gmDisplayMode,
    playerDisplayMode: isDiceDisplayModePreference(settings?.playerDisplayMode) ? settings.playerDisplayMode : DEFAULT_DICE_SETTINGS.playerDisplayMode,
    sceneRollEnabled: typeof settings?.sceneRollEnabled === "boolean" ? settings.sceneRollEnabled : DEFAULT_DICE_SETTINGS.sceneRollEnabled,
    sceneRollTarget: settings?.sceneRollTarget === "gm" || settings?.sceneRollTarget === "player" ? settings.sceneRollTarget : DEFAULT_DICE_SETTINGS.sceneRollTarget,
    gmSceneSize: isDiceSceneSizePreference(settings?.gmSceneSize) ? settings.gmSceneSize : DEFAULT_DICE_SETTINGS.gmSceneSize,
    playerSceneSize: isDiceSceneSizePreference(settings?.playerSceneSize) ? settings.playerSceneSize : DEFAULT_DICE_SETTINGS.playerSceneSize,
    gmPanelEdge: isDicePanelEdgePreference(settings?.gmPanelEdge) ? settings.gmPanelEdge : DEFAULT_DICE_SETTINGS.gmPanelEdge,
    playerPanelEdge: isDicePanelEdgePreference(settings?.playerPanelEdge) ? settings.playerPanelEdge : DEFAULT_DICE_SETTINGS.playerPanelEdge,
    gmPanelFacing: settings?.gmPanelFacing === "inward" || settings?.gmPanelFacing === "outward" ? settings.gmPanelFacing : DEFAULT_DICE_SETTINGS.gmPanelFacing,
    playerPanelFacing: settings?.playerPanelFacing === "inward" || settings?.playerPanelFacing === "outward" ? settings.playerPanelFacing : DEFAULT_DICE_SETTINGS.playerPanelFacing,
    gmPanelPosition: clampUnitPreference(settings?.gmPanelPosition, DEFAULT_DICE_SETTINGS.gmPanelPosition),
    playerPanelPosition: clampUnitPreference(settings?.playerPanelPosition, DEFAULT_DICE_SETTINGS.playerPanelPosition),
    gmPanelAdvanced: typeof settings?.gmPanelAdvanced === "boolean" ? settings.gmPanelAdvanced : DEFAULT_DICE_SETTINGS.gmPanelAdvanced,
    playerPanelAdvanced: typeof settings?.playerPanelAdvanced === "boolean" ? settings.playerPanelAdvanced : DEFAULT_DICE_SETTINGS.playerPanelAdvanced
  };
}

function isDiceDisplayModePreference(value: unknown): value is DiceSettings["gmDisplayMode"] {
  return value === "results" || value === "panel" || value === "scene" || value === "scene-result" || value === "hidden";
}

function isDiceSceneSizePreference(value: unknown): value is DiceSettings["gmSceneSize"] {
  return value === "xs" || value === "sm" || value === "md" || value === "lg" || value === "xl";
}

function isDicePanelEdgePreference(value: unknown): value is DiceSettings["gmPanelEdge"] {
  return value === "top" || value === "right" || value === "bottom" || value === "left";
}

function clampUnitPreference(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
}
