import type { DisplayCalibration, PlayerIdleState } from "../../../shared/localvtt";
import type { DisplayInfo } from "../../components/settings/PlayerDisplayScalePanel";
import {
  getPlayerTestPatternCellSize,
  getPlayerTestPatternMessage,
  type PlayerViewTestPatternGridMode
} from "./playerTestPattern";
import type { PlayerDisplayMode, PlayerViewDisplayState } from "./playerViewState";

export function getMissingPlayerDisplayWarning(displayFound: boolean, selectedDisplayLabel?: string): string | null {
  return !displayFound && selectedDisplayLabel
    ? `The saved Player View display (${selectedDisplayLabel}) is not connected. Player View opened normally so you can move it manually.`
    : null;
}

export function getPlayerViewModeState(playerDisplayMode: PlayerDisplayMode, playerSceneId: string | null = null): PlayerViewDisplayState {
  return {
    playerDisplayMode,
    playerSceneId: playerDisplayMode === "scene" ? playerSceneId : null
  };
}

export function getPlayerTestPatternState(
  gridMode: PlayerViewTestPatternGridMode,
  display: DisplayCalibration,
  cellSizePx: number,
  displays: readonly DisplayInfo[]
): PlayerIdleState {
  const selectedDisplay = displays.find((candidate) => candidate.id === display.selectedDisplayId);
  return {
    type: "idle",
    variant: "test-pattern",
    title: "Local VTT Test Pattern",
    message: getPlayerTestPatternMessage(gridMode, display),
    testPattern: {
      gridMode,
      cellSizePx: getPlayerTestPatternCellSize(gridMode, display, cellSizePx),
      displayLabel: selectedDisplay?.label ?? display.selectedDisplayLabel,
      nativeResolution: selectedDisplay?.nativeResolution
    }
  };
}
