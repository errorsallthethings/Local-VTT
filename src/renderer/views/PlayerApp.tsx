import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import {
  CURRENT_CAMPAIGN_SCHEMA_VERSION,
  DEFAULT_DICE_SETTINGS,
  isLiveTableEvent,
  isPlayerIdleState,
  isPlayerSceneProjection,
  type LiveTableEvent,
  type PlayerIdleState,
  type PlayerSceneProjection
} from "../../shared/localvtt";
import { SceneCanvas } from "../components/SceneCanvas";
import { filterActiveLiveTableEvents, mergeLiveTableEvent } from "../lib/player-view";

const PLAYER_SCENE_SPLASH_FADE_MS = 320;
const PLAYER_SCENE_SPLASH_MIN_MS = 2000;
const PLAYER_SCENE_READY_FALLBACK_MS = 3000;
const DiceRollOverlay = lazy(() => import("../components/dice/DiceRollOverlay").then((module) => ({ default: module.DiceRollOverlay })));

export function PlayerApp() {
  const [projection, setProjection] = useState<PlayerSceneProjection | null>(null);
  const [pendingProjection, setPendingProjection] = useState<PlayerSceneProjection | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [splashCovered, setSplashCovered] = useState(false);
  const [splashMinimumMet, setSplashMinimumMet] = useState(false);
  const [revealScene, setRevealScene] = useState(false);
  const [currentSceneReady, setCurrentSceneReady] = useState(true);
  const [liveTableEvents, setLiveTableEvents] = useState<LiveTableEvent[]>([]);
  const [idleState, setIdleState] = useState<PlayerIdleState>({
    type: "idle",
    variant: "hold",
    title: "Waiting for GM View",
    message: "The next scene will appear here."
  });

  useEffect(() => {
    const removeListener = window.localVtt.onPlayerState((state) => {
      if (isPlayerSceneProjection(state)) {
        applyProjection(state);
      } else if (isPlayerIdleState(state)) {
        applyIdleState(state);
      }
    });
    void window.localVtt.getLastPlayerState().then((state) => {
      if (isPlayerSceneProjection(state)) {
        applyProjection(state);
      } else if (isPlayerIdleState(state)) {
        applyIdleState(state);
      }
    });
    return removeListener;
  }, []);

  useEffect(() => {
    const removeListener = window.localVtt.onLiveTableEvent((event) => {
      if (isLiveTableEvent(event)) {
        setLiveTableEvents((events) => mergeLiveTableEvent(events, event, { respectPlayerVisibility: true }));
      }
    });
    return removeListener;
  }, []);

  useEffect(() => {
    const exitFullscreenWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      void window.localVtt.setPlayerFullscreen(false);
    };

    window.addEventListener("keydown", exitFullscreenWithEscape);
    return () => window.removeEventListener("keydown", exitFullscreenWithEscape);
  }, []);

  useEffect(() => {
    if (liveTableEvents.length === 0) {
      return;
    }
    const cleanupTimer = window.setTimeout(() => {
      setLiveTableEvents((events) => filterActiveLiveTableEvents(events));
    }, 250);
    return () => window.clearTimeout(cleanupTimer);
  }, [liveTableEvents]);

  const applyProjection = (nextProjection: PlayerSceneProjection) => {
    setLiveTableEvents([]);
    setIdleState({
      type: "idle",
      variant: "hold",
      title: "Waiting for GM View",
      message: "The next scene will appear here."
    });
    setProjection((currentProjection) => {
      if (!currentProjection || currentProjection.scene.id === nextProjection.scene.id) {
        if (!currentProjection) {
          setPendingProjection(nextProjection);
          setTransitioning(true);
          setSplashCovered(false);
          setSplashMinimumMet(false);
          setRevealScene(false);
          setCurrentSceneReady(false);
          return currentProjection;
        }
        setCurrentSceneReady(true);
        return nextProjection;
      }
      setPendingProjection(nextProjection);
      setTransitioning(true);
      setSplashCovered(false);
      setSplashMinimumMet(false);
      setRevealScene(false);
      setCurrentSceneReady(false);
      return currentProjection;
    });
  };

  const applyIdleState = (nextIdleState: PlayerIdleState) => {
    setIdleState(nextIdleState);
    setProjection(null);
    setLiveTableEvents([]);
    setPendingProjection(null);
    setTransitioning(false);
    setSplashCovered(false);
    setSplashMinimumMet(false);
    setRevealScene(false);
    setCurrentSceneReady(true);
  };

  useEffect(() => {
    if (!transitioning) {
      setSplashCovered(false);
      setSplashMinimumMet(false);
      setRevealScene(false);
      return;
    }

    const coverTimer = window.setTimeout(() => setSplashCovered(true), PLAYER_SCENE_SPLASH_FADE_MS);
    const minimumTimer = window.setTimeout(() => setSplashMinimumMet(true), PLAYER_SCENE_SPLASH_MIN_MS);
    return () => {
      window.clearTimeout(coverTimer);
      window.clearTimeout(minimumTimer);
    };
  }, [transitioning, projection?.scene.id]);

  useEffect(() => {
    if (!transitioning || !splashCovered || !pendingProjection) {
      return;
    }
    setProjection(pendingProjection);
    setPendingProjection(null);
    setCurrentSceneReady(false);
  }, [pendingProjection, splashCovered, transitioning]);

  useEffect(() => {
    if (!transitioning || currentSceneReady) {
      return;
    }
    const fallbackTimer = window.setTimeout(() => setCurrentSceneReady(true), PLAYER_SCENE_READY_FALLBACK_MS);
    return () => window.clearTimeout(fallbackTimer);
  }, [currentSceneReady, projection?.scene.id, transitioning]);

  useEffect(() => {
    if (!transitioning || !currentSceneReady || !splashCovered || !splashMinimumMet) {
      return;
    }

    setRevealScene(true);
    const transitionTimer = window.setTimeout(() => {
      setTransitioning(false);
    }, PLAYER_SCENE_SPLASH_FADE_MS);

    return () => window.clearTimeout(transitionTimer);
  }, [currentSceneReady, projection?.scene.id, splashCovered, splashMinimumMet, transitioning]);

  return (
    <div className="player-shell">
      {projection || transitioning ? (
        <div className={transitioning ? "player-scene-stack player-scene-stack-transitioning" : "player-scene-stack"}>
          {projection ? (
            <PlayerScene
              projection={projection}
              className={[
                "player-scene-layer",
                "player-scene-layer-current",
                transitioning && !revealScene ? "player-scene-layer-pending" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              onReady={() => {
                if (!transitioning || splashCovered) {
                  setCurrentSceneReady(true);
                }
              }}
              liveTableEvents={liveTableEvents}
            />
          ) : (
            <PlayerEmpty state={idleState} />
          )}
          {transitioning && <PlayerSceneSplash leaving={revealScene} />}
        </div>
      ) : (
        <PlayerEmpty state={idleState} />
      )}
      {!projection && (
        <Suspense fallback={null}>
          <DiceRollOverlay events={liveTableEvents.filter(isVisiblePlayerDiceOverlayEvent)} mode="player" />
        </Suspense>
      )}
    </div>
  );
}

function PlayerEmpty({ state }: { state: PlayerIdleState }) {
  if (state.variant === "blackout") {
    return <div className="player-blackout" aria-label="Player View blackout" />;
  }

  return (
    <div className="player-empty">
      <div className="player-empty-mark">
        <span aria-hidden="true">
          <MapIcon size={24} strokeWidth={2.2} />
        </span>
        <strong>{state.title}</strong>
        <small>{state.message}</small>
      </div>
    </div>
  );
}

function PlayerSceneSplash({ leaving }: { leaving: boolean }) {
  return (
    <div className={leaving ? "player-scene-splash player-scene-splash-leaving" : "player-scene-splash"} role="status" aria-label="Loading scene">
      <div className="player-scene-splash-mark">
        <span aria-hidden="true" />
        <strong>Local VTT</strong>
        <small>Loading scene</small>
      </div>
    </div>
  );
}

function PlayerScene({
  projection,
  className,
  liveTableEvents,
  onReady
}: {
  projection: PlayerSceneProjection;
  className: string;
  liveTableEvents: LiveTableEvent[];
  onReady?: () => void;
}) {
  const campaign = useMemo(
    () => ({
      ...emptyCampaign(projection.campaignName),
      assets: projection.assets,
      players: projection.players ?? [],
      playerDisplay: projection.playerDisplay
    }),
    [projection]
  );

  return (
    <div className={className}>
      <SceneCanvas
        campaign={campaign}
        scene={projection.scene}
        mode="player"
        interactive={false}
        liveTableEvents={liveTableEvents}
        showPlayerSeatIndicators={projection.showPlayerSeatIndicators ?? false}
        onReady={onReady}
      />
    </div>
  );
}

function isVisiblePlayerDiceOverlayEvent(event: LiveTableEvent): event is Extract<LiveTableEvent, { type: "dice" }> {
  return event.type === "dice" && shouldShowPlayerDiceOverlay(event);
}

function shouldShowPlayerDiceOverlay(event: Extract<LiveTableEvent, { type: "dice" }>): boolean {
  if (event.playerDiceDisplay) {
    return event.playerDiceDisplay !== "scene" && event.playerDiceDisplay !== "hidden";
  }
  return event.playerPresentation ? event.playerPresentation === "3d" : event.presentation === "3d";
}

function emptyCampaign(name: string) {
  return {
    schemaVersion: CURRENT_CAMPAIGN_SCHEMA_VERSION,
    id: "player-projection",
    name,
    description: "",
    createdAt: "",
    updatedAt: "",
    sceneFolders: [],
    sceneLibrary: { collapsedFolderIds: [] },
    scenes: [],
    players: [],
    assets: [],
    defaultGrid: {
      type: "square" as const,
      sizePx: 100,
      offsetX: 0,
      offsetY: 0,
      mapGridColumns: 44,
      mapGridRows: 25,
      color: "#ffffff",
      opacity: 0.4,
      lineThickness: 1,
      showOnGm: false,
      showOnPlayer: true,
      measurement: {
        unit: "feet" as const,
        unitsPerGridCell: 5,
        distanceMode: "euclidean" as const
      }
    },
    defaultMeasurement: {
      unit: "feet" as const,
      unitsPerGridCell: 5,
      distanceMode: "euclidean" as const
    },
    defaultCalibration: {
      physicalScaleEnabled: false,
      mode: "manual" as const,
      openPlayerViewFullscreen: false,
      pixelsPerInch: 100,
      inchesPerGridCell: 1,
      screenDiagonalInches: 23.8,
      screenAspectRatio: "16:9" as const,
      screenResolutionWidth: 2560,
      screenResolutionHeight: 1440,
      defaultScaleLabel: "1 inch = 5 feet"
    },
    playerDisplay: projectionDisplayFallback(),
    diceSettings: { ...DEFAULT_DICE_SETTINGS }
  };
}

function projectionDisplayFallback() {
  return {
    physicalScaleEnabled: false,
    mode: "manual" as const,
    openPlayerViewFullscreen: false,
    pixelsPerInch: 100,
    inchesPerGridCell: 1,
    screenDiagonalInches: 23.8,
    screenAspectRatio: "16:9" as const,
    screenResolutionWidth: 2560,
    screenResolutionHeight: 1440,
    defaultScaleLabel: "1 inch = 5 feet"
  };
}
