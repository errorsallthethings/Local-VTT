import type { FogSettings, GridSettings, MapTransform, Scene, VideoPlaybackSettings } from "../../shared/localvtt";
import {
  moveSceneLayer,
  patchSceneFog,
  patchSceneGrid,
  patchSceneMapTransform,
  patchSceneVideoPlayback,
  removeLastDrawing,
  removeLastEnvironmentEffect,
  removeLastWeatherMask,
  removeSelectedSceneItems,
  setSelectedSceneItemsPlayerVisibility,
  type SceneSelectionIds,
  setSceneLayerOrderLocked,
  type LayerMoveDirection
} from "../lib/scene";

export function useSceneEditingActions({
  activeScene,
  selectedSceneItemIds,
  updateScene,
  clearSceneSelection,
  onClearFogConfirmed
}: {
  activeScene: Scene | null;
  selectedSceneItemIds: SceneSelectionIds;
  updateScene: (nextScene: Scene) => void;
  clearSceneSelection: () => void;
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

  const updateSelectedPlayerVisibility = (visibleInPlayer: boolean) => {
    if (!activeScene) {
      return;
    }
    updateScene(setSelectedSceneItemsPlayerVisibility(activeScene, selectedSceneItemIds, visibleInPlayer));
  };

  const deleteSelectedSceneItems = () => {
    if (!activeScene) {
      return;
    }
    updateScene(removeSelectedSceneItems(activeScene, selectedSceneItemIds));
    clearSceneSelection();
  };

  const undoWeatherMask = () => {
    if (!activeScene || activeScene.weather.masks.length === 0) {
      return;
    }
    updateScene(removeLastWeatherMask(activeScene));
  };

  const undoEnvironmentEffect = () => {
    if (!activeScene || activeScene.environment.effects.length === 0) {
      return;
    }
    updateScene(removeLastEnvironmentEffect(activeScene));
  };

  const undoDrawing = () => {
    if (!activeScene || activeScene.drawings.length === 0) {
      return;
    }
    updateScene(removeLastDrawing(activeScene));
  };

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
    updateSelectedPlayerVisibility,
    deleteSelectedSceneItems,
    undoWeatherMask,
    undoEnvironmentEffect,
    undoDrawing
  };
}
