import type { Asset, FogSettings, GridSettings, MapTransform, Scene, VideoPlaybackSettings } from "../../shared/localvtt";
import {
  getFitGridPatch,
  moveSceneLayer,
  patchSceneFog,
  patchSceneGrid,
  patchSceneMapTransform,
  patchSceneVideoPlayback,
  setSceneLayerOrderLocked,
  type LayerMoveDirection
} from "../lib/sceneEditing";

export function useSceneEditingActions({
  activeScene,
  mapAsset,
  run,
  updateScene,
  onClearFogConfirmed
}: {
  activeScene: Scene | null;
  mapAsset: Asset | null;
  run: (task: () => Promise<void>) => Promise<boolean>;
  updateScene: (nextScene: Scene) => void;
  onClearFogConfirmed: () => void;
}) {
  const updateVideoPlayback = (patch: Partial<VideoPlaybackSettings>) => {
    if (!activeScene) {
      return;
    }
    updateScene(patchSceneVideoPlayback(activeScene, patch));
  };

  const updateGrid = (patch: Partial<GridSettings>) => {
    if (!activeScene) {
      return;
    }
    updateScene(patchSceneGrid(activeScene, patch));
  };

  const updateFog = (patch: Partial<FogSettings>) => {
    if (!activeScene) {
      return;
    }
    updateScene(patchSceneFog(activeScene, patch));
  };

  const undoFogShape = () => {
    if (!activeScene || activeScene.fog.shapes.length === 0) {
      return;
    }
    updateFog({ shapes: activeScene.fog.shapes.slice(0, -1) });
  };

  const clearFogShapes = () => {
    updateFog({ shapes: [] });
    onClearFogConfirmed();
  };

  const updateMeasurement = (patch: Partial<GridSettings["measurement"]>) => {
    if (!activeScene) {
      return;
    }
    updateGrid({
      measurement: { ...activeScene.grid.measurement, ...patch }
    });
  };

  const updateMapTransform = (patch: Partial<MapTransform>) => {
    if (!activeScene) {
      return;
    }
    updateScene(patchSceneMapTransform(activeScene, patch));
  };

  const setLayerOrderLocked = (locked: boolean) => {
    if (!activeScene) {
      return;
    }
    updateScene(setSceneLayerOrderLocked(activeScene, locked));
  };

  const moveLayer = (layerId: string, direction: LayerMoveDirection) => {
    if (!activeScene) {
      return;
    }
    const nextScene = moveSceneLayer(activeScene, layerId, direction);
    if (nextScene !== activeScene) {
      updateScene(nextScene);
    }
  };

  const fitGridToMapDimensions = () =>
    run(async () => {
      if (!activeScene || !mapAsset?.absolutePath || mapAsset.mediaType !== "image") {
        return;
      }
      const dimensions = await loadImageDimensions(window.localVtt.toAssetUrl(mapAsset.absolutePath));
      updateScene(
        patchSceneGrid(activeScene, {
          ...activeScene.grid,
          ...getFitGridPatch(activeScene, dimensions)
        })
      );
    });

  return {
    updateVideoPlayback,
    updateGrid,
    updateFog,
    undoFogShape,
    clearFogShapes,
    updateMeasurement,
    updateMapTransform,
    setLayerOrderLocked,
    moveLayer,
    fitGridToMapDimensions
  };
}

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Unable to read the selected map image dimensions."));
    image.src = src;
  });
}
