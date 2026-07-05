import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import type { Campaign, DrawingElement, LiveTableEvent, Scene } from "../../shared/localvtt";
import { isLiveTableEvent } from "../../shared/localvtt";
import { updateDiceRollHistory as updateDiceRollHistoryList } from "../lib/dice";
import {
  filterActiveLiveTableEvents,
  getPlayerViewModeState,
  getPlayerViewDisplayStateFromLastState,
  mergeLiveTableEvent,
  showDefaultPlayerHold,
  updatePlayerSceneIfOpenInBackground,
  type PlayerDisplayMode
} from "../lib/player-view";
import { logRendererWarning } from "../lib/rendererDiagnostics";

const PLAYER_TEMPLATE_PREVIEW_ID = "template-preview";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;
type PlayerSceneAutoSyncAction = "ignore" | "skip-once" | "sync";

export function shouldShowPlayerHoldAfterSceneDelete(deletedSceneId: string, playerSceneId: string | null, deleteSucceeded: boolean): boolean {
  return deleteSucceeded && deletedSceneId === playerSceneId;
}

export function getPlayerSceneAutoSyncAction({
  hasCampaign,
  activeSceneId,
  playerSceneId,
  playerDisplayMode,
  skipNextAutoSync
}: {
  hasCampaign: boolean;
  activeSceneId: string | null;
  playerSceneId: string | null;
  playerDisplayMode: PlayerDisplayMode;
  skipNextAutoSync: boolean;
}): PlayerSceneAutoSyncAction {
  if (!hasCampaign || !activeSceneId || activeSceneId !== playerSceneId || playerDisplayMode !== "scene") {
    return "ignore";
  }
  return skipNextAutoSync ? "skip-once" : "sync";
}

export function getPlayerTemplatePreviewSyncScene({
  activeScene,
  hasCampaign,
  playerSceneId,
  playerDisplayMode,
  templatePreviewVisibleInPlayer,
  playerTemplatePreviewDrawing,
  previewPublished
}: {
  activeScene: Scene | null;
  hasCampaign: boolean;
  playerSceneId: string | null;
  playerDisplayMode: PlayerDisplayMode;
  templatePreviewVisibleInPlayer: boolean;
  playerTemplatePreviewDrawing: DrawingElement | null;
  previewPublished: boolean;
}): { scene: Scene | null; previewPublished: boolean } {
  if (!hasCampaign || !activeScene || activeScene.id !== playerSceneId || playerDisplayMode !== "scene") {
    return { scene: null, previewPublished: false };
  }

  const previewDrawing = templatePreviewVisibleInPlayer ? playerTemplatePreviewDrawing : null;
  if (!previewDrawing && !previewPublished) {
    return { scene: null, previewPublished: false };
  }

  return {
    scene: previewDrawing
      ? {
          ...activeScene,
          drawings: [...activeScene.drawings.filter((drawing) => drawing.id !== PLAYER_TEMPLATE_PREVIEW_ID), previewDrawing]
        }
      : activeScene,
    previewPublished: Boolean(previewDrawing)
  };
}

interface UsePlayerViewStateOptions {
  activeScene: Scene | null;
  campaign: Campaign | null;
  playersPanelOpen: boolean;
  templatePreviewVisibleInPlayer: boolean;
  playerTemplatePreviewDrawing: DrawingElement | null;
  onDiceRollHistoryChange: Dispatch<SetStateAction<DiceRollEvent[]>>;
  onClosePlayerMenu: () => void;
}

export function usePlayerViewState({
  activeScene,
  campaign,
  playersPanelOpen,
  templatePreviewVisibleInPlayer,
  playerTemplatePreviewDrawing,
  onDiceRollHistoryChange,
  onClosePlayerMenu
}: UsePlayerViewStateOptions) {
  const [playerSceneId, setPlayerSceneId] = useState<string | null>(null);
  const [playerDisplayMode, setPlayerDisplayMode] = useState<PlayerDisplayMode>("scene");
  const [liveTableEvents, setLiveTableEvents] = useState<LiveTableEvent[]>([]);
  const skipNextPlayerSceneAutoSyncRef = useRef(false);
  const playerTemplatePreviewPublishedRef = useRef(false);
  const playerIdleClearedForNoCampaignRef = useRef(false);

  const updateDiceRollHistory = useCallback((event: DiceRollEvent) => {
    onDiceRollHistoryChange((history) => updateDiceRollHistoryList(history, event));
  }, [onDiceRollHistoryChange]);

  const emitLiveTableEvent = useCallback((event: LiveTableEvent) => {
    if (!isLiveTableEvent(event)) {
      logRendererWarning("LOCALVTT_INVALID_LIVE_TABLE_EVENT", event);
      return;
    }
    setLiveTableEvents((events) => mergeLiveTableEvent(events, event));
    if (event.type === "dice") {
      updateDiceRollHistory(event);
    } else if (event.type === "dice-clear") {
      onDiceRollHistoryChange([]);
    }
    void window.localVtt.sendLiveTableEvent(event).catch((caught) => {
      logRendererWarning("LOCALVTT_LIVE_TABLE_EVENT_SEND_FAILED", caught);
    });
  }, [onDiceRollHistoryChange, updateDiceRollHistory]);

  const skipNextPlayerSceneAutoSync = useCallback(() => {
    skipNextPlayerSceneAutoSyncRef.current = true;
  }, []);

  const applyPlayerViewModeState = useCallback((
    nextPlayerDisplayMode: PlayerDisplayMode,
    nextPlayerSceneId: string | null = null,
    closeMenu = true
  ) => {
    const playerViewState = getPlayerViewModeState(nextPlayerDisplayMode, nextPlayerSceneId);
    setPlayerSceneId(playerViewState.playerSceneId);
    setPlayerDisplayMode(playerViewState.playerDisplayMode);
    if (closeMenu) {
      onClosePlayerMenu();
    }
  }, [onClosePlayerMenu]);

  useEffect(() => {
    const removeListener = window.localVtt.onLiveTableEvent((event) => {
      if (isLiveTableEvent(event)) {
        setLiveTableEvents((events) => mergeLiveTableEvent(events, event));
        if (event.type === "dice") {
          updateDiceRollHistory(event);
        } else if (event.type === "dice-clear") {
          onDiceRollHistoryChange([]);
        }
      }
    });
    return removeListener;
  }, [onDiceRollHistoryChange, updateDiceRollHistory]);

  useEffect(() => {
    setLiveTableEvents([]);
  }, [activeScene?.id]);

  useEffect(() => {
    if (liveTableEvents.length === 0) {
      return;
    }
    const cleanupTimer = window.setTimeout(() => {
      setLiveTableEvents((events) => filterActiveLiveTableEvents(events));
    }, 250);
    return () => window.clearTimeout(cleanupTimer);
  }, [liveTableEvents]);

  useEffect(() => {
    if (campaign) {
      playerIdleClearedForNoCampaignRef.current = false;
      return;
    }
    if (playerIdleClearedForNoCampaignRef.current) {
      return;
    }
    playerIdleClearedForNoCampaignRef.current = true;
    void showDefaultPlayerHold();
    setPlayerSceneId(null);
    setPlayerDisplayMode("hold");
  }, [campaign]);

  useEffect(() => {
    if (!playerSceneId || campaign?.scenes.some((scene) => scene.id === playerSceneId)) {
      return;
    }
    void showDefaultPlayerHold();
    setPlayerSceneId(null);
    setPlayerDisplayMode("hold");
  }, [campaign?.scenes, playerSceneId]);

  useEffect(() => {
    let cancelled = false;
    void window.localVtt.getLastPlayerState().then((state) => {
      if (cancelled) {
        return;
      }
      const displayState = getPlayerViewDisplayStateFromLastState(state, campaign?.scenes);
      if (displayState) {
        setPlayerSceneId(displayState.playerSceneId);
        setPlayerDisplayMode(displayState.playerDisplayMode);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [campaign?.scenes]);

  useEffect(() => {
    const action = getPlayerSceneAutoSyncAction({
      hasCampaign: Boolean(campaign),
      activeSceneId: activeScene?.id ?? null,
      playerSceneId,
      playerDisplayMode,
      skipNextAutoSync: skipNextPlayerSceneAutoSyncRef.current
    });
    if (action === "ignore") {
      return;
    }
    if (action === "skip-once") {
      skipNextPlayerSceneAutoSyncRef.current = false;
      return;
    }
    if (campaign && activeScene) {
      updatePlayerSceneIfOpenInBackground(window.localVtt, campaign, activeScene, { showPlayerSeatIndicators: playersPanelOpen });
    }
  }, [activeScene, campaign, playerDisplayMode, playerSceneId, playersPanelOpen]);

  useEffect(() => {
    const syncState = getPlayerTemplatePreviewSyncScene({
      activeScene,
      hasCampaign: Boolean(campaign),
      playerSceneId,
      playerDisplayMode,
      templatePreviewVisibleInPlayer,
      playerTemplatePreviewDrawing,
      previewPublished: playerTemplatePreviewPublishedRef.current
    });
    playerTemplatePreviewPublishedRef.current = syncState.previewPublished;
    if (campaign && syncState.scene) {
      updatePlayerSceneIfOpenInBackground(window.localVtt, campaign, syncState.scene, { showPlayerSeatIndicators: playersPanelOpen });
    }
  }, [activeScene, campaign, playerDisplayMode, playerSceneId, playerTemplatePreviewDrawing, playersPanelOpen, templatePreviewVisibleInPlayer]);

  return {
    playerSceneId,
    playerDisplayMode,
    liveTableEvents,
    emitLiveTableEvent,
    updateDiceRollHistory,
    applyPlayerViewModeState,
    skipNextPlayerSceneAutoSync
  };
}
