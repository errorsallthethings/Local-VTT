import { DEFAULT_DICE_SETTINGS, type Campaign, type DiceSettings } from "../../../shared/localvtt";
import { loadLocalStorageJson, saveLocalStorageJson, type LocalStorageLike } from "../storage/localStorageJson";

export const DICE_SETTINGS_PREFERENCES_STORAGE_KEY = "localvtt.diceSettingsPreferences";

export function loadDiceSettingsPreference(storage: Pick<LocalStorageLike, "getItem"> = window.localStorage): DiceSettings {
  const parsed = loadLocalStorageJson(storage, DICE_SETTINGS_PREFERENCES_STORAGE_KEY, null);
  if (parsed !== null && !isRecord(parsed)) {
    return { ...DEFAULT_DICE_SETTINGS };
  }
  return normalizeDiceSettingsPreference(parsed);
}

export function saveDiceSettingsPreference(
  settings: DiceSettings,
  storage: Pick<LocalStorageLike, "setItem"> = window.localStorage
): void {
  saveLocalStorageJson(storage, DICE_SETTINGS_PREFERENCES_STORAGE_KEY, settings);
}

export function getEffectiveDiceSettings(campaign: Campaign | null | undefined, preference: DiceSettings): DiceSettings {
  return {
    ...DEFAULT_DICE_SETTINGS,
    ...(campaign?.diceSettings ?? preference)
  };
}

export type DiceSettingsPatchResult =
  | { kind: "preference"; settings: DiceSettings }
  | { kind: "campaign"; settings: DiceSettings; campaign: Campaign };

export function applyDiceSettingsPatch(
  currentSettings: DiceSettings,
  patch: Partial<DiceSettings>,
  campaign: Campaign | null | undefined,
  updatedAt: string
): DiceSettingsPatchResult {
  const settings = {
    ...currentSettings,
    ...patch
  };
  if (!campaign) {
    return { kind: "preference", settings };
  }
  return {
    kind: "campaign",
    settings,
    campaign: {
      ...campaign,
      diceSettings: settings,
      updatedAt
    }
  };
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

function isRecord(value: unknown): value is Partial<DiceSettings> {
  return typeof value === "object" && value !== null;
}
