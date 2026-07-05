import type { DisplayCalibration, PlayerIdleState, Scene } from "../../../shared/localvtt";
import type { DisplayInfo } from "../../components/settings/PlayerDisplayScalePanel";
import { stopTurnOrder } from "../turn-order";
import {
  getPlayerTestPatternCellSize,
  getPlayerTestPatternMessage,
  type PlayerViewTestPatternGridMode
} from "./playerTestPattern";
import type { PlayerDisplayMode, PlayerViewDisplayState } from "./playerViewState";

export interface PlayerViewOpenResult {
  displayFound: boolean;
}

export interface PlayerViewOpenOptions {
  displayId?: number;
  fullscreen: boolean;
}

export function getMissingPlayerDisplayWarning(displayFound: boolean, selectedDisplayLabel?: string): string | null {
  return !displayFound && selectedDisplayLabel
    ? `The saved Player View display (${selectedDisplayLabel}) is not connected. Player View opened normally so you can move it manually.`
    : null;
}

export function getPlayerViewOpenOptions(display: DisplayCalibration): PlayerViewOpenOptions {
  return {
    displayId: display.selectedDisplayId,
    fullscreen: display.openPlayerViewFullscreen
  };
}

export function getPlayerViewOpenWarning(openResult: PlayerViewOpenResult, display: DisplayCalibration): string | null {
  return getMissingPlayerDisplayWarning(openResult.displayFound, display.selectedDisplayLabel);
}

export function getPlayerViewModeState(playerDisplayMode: PlayerDisplayMode, playerSceneId: string | null = null): PlayerViewDisplayState {
  return {
    playerDisplayMode,
    playerSceneId: playerDisplayMode === "scene" ? playerSceneId : null
  };
}

export function getPreviousPlayerScenePauseUpdate({
  previousPlayerScene,
  previousPlayerSceneId,
  nextPlayerSceneId,
  updatedAt
}: {
  previousPlayerScene: Scene | null;
  previousPlayerSceneId: string | null;
  nextPlayerSceneId: string;
  updatedAt: string;
}): Scene | null {
  if (!previousPlayerScene || !previousPlayerSceneId || previousPlayerSceneId === nextPlayerSceneId || !previousPlayerScene.turnOrder.active) {
    return null;
  }
  return stopTurnOrder(previousPlayerScene, updatedAt);
}

export function getSceneDraftsAfterPreviousPlayerScenePause(
  sceneDrafts: Record<string, Scene>,
  pausedPreviousScene: Scene | null
): Record<string, Scene> {
  return pausedPreviousScene ? { ...sceneDrafts, [pausedPreviousScene.id]: pausedPreviousScene } : sceneDrafts;
}

export function getDirtySceneIdsAfterPreviousPlayerScenePause(dirtySceneIds: Set<string>, pausedPreviousScene: Scene | null): Set<string> {
  if (!pausedPreviousScene) {
    return dirtySceneIds;
  }
  return new Set(dirtySceneIds).add(pausedPreviousScene.id);
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
