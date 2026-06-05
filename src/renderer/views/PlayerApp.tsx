import { useEffect, useState } from "react";
import { isPlayerSceneProjection, type PlayerSceneProjection } from "../../shared/localvtt";
import { SceneCanvas } from "../components/SceneCanvas";

export function PlayerApp() {
  const [projection, setProjection] = useState<PlayerSceneProjection | null>(null);

  useEffect(() => {
    const removeListener = window.localVtt.onPlayerState((state) => {
      if (isPlayerSceneProjection(state)) {
        setProjection(state);
      }
    });
    void window.localVtt.getLastPlayerState().then((state) => {
      if (isPlayerSceneProjection(state)) {
        setProjection(state);
      }
    });
    return removeListener;
  }, []);

  return (
    <div className="player-shell">
      {projection ? (
        <SceneCanvas
          campaign={{ ...emptyCampaign(projection.campaignName), assets: projection.assets, playerDisplay: projection.playerDisplay }}
          scene={projection.scene}
          mode="player"
          interactive={false}
        />
      ) : (
        <div className="player-empty">Waiting for GM View</div>
      )}
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
