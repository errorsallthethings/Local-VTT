import { useEffect, useMemo, useState } from "react";
import { isPlayerSceneProjection, type PlayerSceneProjection } from "../../shared/localvtt";
import { SceneCanvas } from "../components/SceneCanvas";

const PLAYER_SCENE_SPLASH_FADE_MS = 320;
const PLAYER_SCENE_SPLASH_MIN_MS = 2000;
const PLAYER_SCENE_READY_FALLBACK_MS = 3000;

export function PlayerApp() {
  const [projection, setProjection] = useState<PlayerSceneProjection | null>(null);
  const [pendingProjection, setPendingProjection] = useState<PlayerSceneProjection | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [splashCovered, setSplashCovered] = useState(false);
  const [splashMinimumMet, setSplashMinimumMet] = useState(false);
  const [revealScene, setRevealScene] = useState(false);
  const [currentSceneReady, setCurrentSceneReady] = useState(true);

  useEffect(() => {
    const removeListener = window.localVtt.onPlayerState((state) => {
      if (isPlayerSceneProjection(state)) {
        applyProjection(state);
      }
    });
    void window.localVtt.getLastPlayerState().then((state) => {
      if (isPlayerSceneProjection(state)) {
        applyProjection(state);
      }
    });
    return removeListener;
  }, []);

  const applyProjection = (nextProjection: PlayerSceneProjection) => {
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
            />
          ) : (
            <div className="player-empty">Waiting for GM View</div>
          )}
          {transitioning && <PlayerSceneSplash leaving={revealScene} />}
        </div>
      ) : (
        <div className="player-empty">Waiting for GM View</div>
      )}
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

function PlayerScene({ projection, className, onReady }: { projection: PlayerSceneProjection; className: string; onReady?: () => void }) {
  const campaign = useMemo(
    () => ({ ...emptyCampaign(projection.campaignName), assets: projection.assets, playerDisplay: projection.playerDisplay }),
    [projection]
  );

  return (
    <div className={className}>
      <SceneCanvas
        campaign={campaign}
        scene={projection.scene}
        mode="player"
        interactive={false}
        onReady={onReady}
      />
    </div>
  );
}

function emptyCampaign(name: string) {
  return {
    id: "player-projection",
    name,
    description: "",
    createdAt: "",
    updatedAt: "",
    sceneFolders: [],
    sceneLibrary: { collapsedFolderIds: [] },
    scenes: [],
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
    playerDisplay: projectionDisplayFallback()
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
