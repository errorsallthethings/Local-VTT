import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import type { Campaign, DrawingElement, LiveTableEvent, Scene } from "../../shared/localvtt";
import { isLiveTableEvent } from "../../shared/localvtt";
import { updateDiceRollHistory as updateDiceRollHistoryList } from "../lib/dice";
import {
  filterActiveLiveTableEvents,
  getPlayerViewDisplayStateFromLastState,
  mergeLiveTableEvent,
  showDefaultPlayerHold,
  updatePlayerSceneIfOpen,
  type PlayerDisplayMode
} from "../lib/player-view";

const PLAYER_TEMPLATE_PREVIEW_ID = "template-preview";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;

interface UsePlayerViewStateOptions {
  activeScene: Scene | null;
  campaign: Campaign | null;
  playersPanelOpen: boolean;
  templatePreviewVisibleInPlayer: boolean;
  playerTemplatePreviewDrawing: DrawingElement | null;
  onDiceRollHistoryChange: Dispatch<SetStateAction<DiceRollEvent[]>>;
}

export function usePlayerViewState({
  activeScene,
  campaign,
  playersPanelOpen,
  templatePreviewVisibleInPlayer,
  playerTemplatePreviewDrawing,
  onDiceRollHistoryChange
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
    setLiveTableEvents((events) => mergeLiveTableEvent(events, event));
    if (event.type === "dice") {
      updateDiceRollHistory(event);
    } else if (event.type === "dice-clear") {
      onDiceRollHistoryChange([]);
    }
    void window.localVtt.sendLiveTableEvent(event);
  }, [onDiceRollHistoryChange, updateDiceRollHistory]);

  const skipNextPlayerSceneAutoSync = useCallback(() => {
    skipNextPlayerSceneAutoSyncRef.current = true;
  }, []);

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
    if (!campaign || !activeScene || activeScene.id !== playerSceneId || playerDisplayMode !== "scene") {
      return;
    }
    if (skipNextPlayerSceneAutoSyncRef.current) {
      skipNextPlayerSceneAutoSyncRef.current = false;
      return;
    }
    void updatePlayerSceneIfOpen(window.localVtt, campaign, activeScene, { showPlayerSeatIndicators: playersPanelOpen });
  }, [activeScene, campaign, playerDisplayMode, playerSceneId, playersPanelOpen]);

  useEffect(() => {
    if (!campaign || !activeScene || activeScene.id !== playerSceneId || playerDisplayMode !== "scene") {
      playerTemplatePreviewPublishedRef.current = false;
      return;
    }
    const previewDrawing = templatePreviewVisibleInPlayer ? playerTemplatePreviewDrawing : null;
    if (!previewDrawing && !playerTemplatePreviewPublishedRef.current) {
      return;
    }
    const previewScene = previewDrawing
      ? {
          ...activeScene,
          drawings: [...activeScene.drawings.filter((drawing) => drawing.id !== PLAYER_TEMPLATE_PREVIEW_ID), previewDrawing]
        }
      : activeScene;
    playerTemplatePreviewPublishedRef.current = Boolean(previewDrawing);
    void updatePlayerSceneIfOpen(window.localVtt, campaign, previewScene, { showPlayerSeatIndicators: playersPanelOpen });
  }, [activeScene, campaign, playerDisplayMode, playerSceneId, playerTemplatePreviewDrawing, playersPanelOpen, templatePreviewVisibleInPlayer]);

  return {
    playerSceneId,
    setPlayerSceneId,
    playerDisplayMode,
    setPlayerDisplayMode,
    liveTableEvents,
    emitLiveTableEvent,
    updateDiceRollHistory,
    skipNextPlayerSceneAutoSync
  };
}
