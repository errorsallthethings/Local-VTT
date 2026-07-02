import type { DiceDisplayMode, DicePanelEdge, DicePanelFacing, DiceSceneSize } from "../../../shared/localvtt";

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
