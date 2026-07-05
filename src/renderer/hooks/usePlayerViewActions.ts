import type { Dispatch, SetStateAction } from "react";
import type { Campaign, DisplayCalibration, PlayerViewTestPattern, Scene } from "../../shared/localvtt";
import type { DisplayInfo } from "../components/settings/PlayerDisplayScalePanel";
import {
  getDirtySceneIdsAfterPreviousPlayerScenePause,
  getPlayerTestPatternState,
  getPlayerViewOpenOptions,
  getPlayerViewOpenWarning,
  getPreviousPlayerScenePauseUpdate,
  getSceneDraftsAfterPreviousPlayerScenePause,
  openAndSendSceneToPlayer,
  showDefaultPlayerHold,
  showPlayerBlackout as sendPlayerBlackout
} from "../lib/player-view";

type PlayerViewMode = "scene" | "hold" | "blackout" | "test-pattern";

interface UsePlayerViewActionsOptions {
  activeScene: Scene | null;
  campaign: Campaign | null;
  campaignPath: string | null;
  displays: DisplayInfo[];
  playerSceneId: string | null;
  playerViewSyncOptions: { showPlayerSeatIndicators: boolean };
  sceneDrafts: Record<string, Scene>;
  run: (task: () => Promise<void>) => Promise<unknown>;
  applyPlayerViewModeState: (mode: PlayerViewMode, sceneId?: string | null, closeMenu?: boolean) => void;
  setDirtySceneIds: Dispatch<SetStateAction<Set<string>>>;
  setError: (message: string | null) => void;
  setPlayerMenuOpen: (open: boolean) => void;
  setSceneDrafts: Dispatch<SetStateAction<Record<string, Scene>>>;
}

export function usePlayerViewActions({
  activeScene,
  campaign,
  campaignPath,
  displays,
  playerSceneId,
  playerViewSyncOptions,
  sceneDrafts,
  run,
  applyPlayerViewModeState,
  setDirtySceneIds,
  setError,
  setPlayerMenuOpen,
  setSceneDrafts
}: UsePlayerViewActionsOptions) {
  const showPlayerIdle = async () => {
    await showDefaultPlayerHold();
    applyPlayerViewModeState("hold");
  };

  return {
    sendToPlayer: () =>
      run(async () => {
        if (!campaign || !activeScene) {
          return;
        }
        if (campaignPath && playerSceneId && playerSceneId !== activeScene.id) {
          const previousPlayerScene = sceneDrafts[playerSceneId] ?? (await window.localVtt.loadScene(campaignPath, playerSceneId));
          const pausedPreviousScene = getPreviousPlayerScenePauseUpdate({
            previousPlayerScene,
            previousPlayerSceneId: playerSceneId,
            nextPlayerSceneId: activeScene.id,
            updatedAt: new Date().toISOString()
          });
          if (pausedPreviousScene) {
            setSceneDrafts((drafts) => getSceneDraftsAfterPreviousPlayerScenePause(drafts, pausedPreviousScene));
            setDirtySceneIds((ids) => getDirtySceneIdsAfterPreviousPlayerScenePause(ids, pausedPreviousScene));
          }
        }
        const result = await openAndSendSceneToPlayer(window.localVtt, campaign, activeScene, playerViewSyncOptions);
        applyPlayerViewModeState("scene", activeScene.id, false);
        if (result.warning) {
          setError(result.warning);
        }
      }),
    setPlayerFullscreen: (fullscreen: boolean) =>
      run(async () => {
        await window.localVtt.setPlayerFullscreen(fullscreen);
        setPlayerMenuOpen(false);
      }),
    closePlayerView: () =>
      run(async () => {
        await window.localVtt.closePlayerView();
        applyPlayerViewModeState("scene");
      }),
    showPlayerHold: () =>
      run(async () => {
        await showPlayerIdle();
      }),
    showPlayerBlackout: () =>
      run(async () => {
        await sendPlayerBlackout();
        applyPlayerViewModeState("blackout");
      }),
    showPlayerTestPattern: async (gridMode: PlayerViewTestPattern["gridMode"], display: DisplayCalibration, cellSizePx: number) =>
      run(async () => {
        const openResult = await window.localVtt.openPlayerView(getPlayerViewOpenOptions(display));
        await window.localVtt.showPlayerTestPattern(getPlayerTestPatternState(gridMode, display, cellSizePx, displays));
        applyPlayerViewModeState("test-pattern");
        const warning = getPlayerViewOpenWarning(openResult, display);
        if (warning) {
          setError(warning);
        }
      }),
    showPlayerIdle
  };
}
