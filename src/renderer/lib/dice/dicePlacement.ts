import type { DiceDisplayMode } from "../../../shared/localvtt";

export type DicePlacementViewLabel = "GM" | "Player";

export function getDicePlacementAvailable(mode: DiceDisplayMode, sceneRollEnabled: boolean): boolean {
  return !sceneRollEnabled && mode !== "hidden" && mode !== "scene" && mode !== "scene-result";
}

export function getDicePlacementFacingAvailable(mode: DiceDisplayMode, sceneRollEnabled: boolean): boolean {
  return getDicePlacementAvailable(mode, sceneRollEnabled) && mode === "results";
}

export function getDicePlacementHelp(viewLabel: DicePlacementViewLabel, mode: DiceDisplayMode, sceneRollEnabled: boolean): string {
  if (sceneRollEnabled) {
    return "3D Scene Roll is always centered on the selected scene view, so display placement is ignored.";
  }
  if (mode === "hidden") {
    return `${viewLabel} display is hidden, so placement is ignored.`;
  }
  if (mode === "panel") {
    return "3D Panel uses Edge and Edge Position. Facing is only used by Text Result Only.";
  }
  return "Text Result Only uses Edge, Facing, and Edge Position. Turn placement off to keep it centered.";
}
