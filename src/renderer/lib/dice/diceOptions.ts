import type { DiceDisplayMode, DicePanelEdge, DicePanelFacing, DiceSceneRollTarget, DiceSceneSize, DiceSceneThrowDirection } from "../../../shared/localvtt";

export interface DiceDisplayModeChangePlan {
  sceneRollEnabled: boolean | null;
  sceneRollTarget: DiceSceneRollTarget | null;
  displayMode: DiceDisplayMode | null;
}

export interface DicePanelAdvancedChangePlan {
  advanced: boolean;
  resetPlacement: boolean;
}

export const DEFAULT_DICE_PANEL_EDGE: DicePanelEdge = "top";
export const DEFAULT_DICE_PANEL_FACING: DicePanelFacing = "inward";
export const DEFAULT_DICE_PANEL_POSITION = 0.5;

export const DICE_DISPLAY_OPTIONS = [
  { value: "results", label: "Text Result Only" },
  { value: "panel", label: "3D Panel" },
  { value: "scene", label: "3D Scene Roll" },
  { value: "hidden", label: "Hidden" }
] as const satisfies Array<{ value: DiceDisplayMode; label: string }>;

export const DICE_SCENE_SIZE_OPTIONS = [
  { value: "xs", label: "Extra small" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" }
] as const satisfies Array<{ value: DiceSceneSize; label: string }>;

export const DICE_SCENE_THROW_DIRECTION_OPTIONS = [
  { value: "random", label: "Random" },
  { value: "left", label: "Left" },
  { value: "top", label: "Top" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" }
] as const satisfies Array<{ value: DiceSceneThrowDirection; label: string }>;

export const DICE_PANEL_EDGE_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" }
] as const satisfies Array<{ value: DicePanelEdge; label: string }>;

export const DICE_PANEL_FACING_OPTIONS = [
  { value: "inward", label: "Inward" },
  { value: "outward", label: "Outward" }
] as const satisfies Array<{ value: DicePanelFacing; label: string }>;

export function getDiceDisplaySelectValue(mode: DiceDisplayMode): DiceDisplayMode {
  return mode === "panel" || mode === "hidden" || mode === "scene" ? mode : "results";
}

export function getDiceDisplayModeChangePlan(
  mode: DiceDisplayMode,
  sceneTarget: DiceSceneRollTarget,
  sceneRollEnabled: boolean
): DiceDisplayModeChangePlan {
  if (mode === "scene") {
    return {
      sceneRollTarget: sceneTarget,
      sceneRollEnabled: true,
      displayMode: null
    };
  }
  return {
    sceneRollTarget: null,
    sceneRollEnabled: sceneRollEnabled ? false : null,
    displayMode: mode
  };
}

export function getDiceDisplaySelectValueForView(
  mode: DiceDisplayMode,
  sceneTarget: DiceSceneRollTarget,
  view: DiceSceneRollTarget,
  sceneRollEnabled: boolean
): DiceDisplayMode {
  if (!sceneRollEnabled) {
    return getDiceDisplaySelectValue(mode);
  }
  if (view === "gm") {
    return sceneTarget === "gm" ? "scene" : "results";
  }
  return sceneTarget === "player" ? "scene" : "hidden";
}

export function getDicePanelAdvancedChangePlan(advanced: boolean): DicePanelAdvancedChangePlan {
  return {
    advanced,
    resetPlacement: !advanced
  };
}
