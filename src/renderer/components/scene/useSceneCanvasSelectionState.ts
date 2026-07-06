import { useMemo } from "react";
import { shouldAnimateSceneSelection } from "../../canvas/selection";
import { getSelectedItemIdList } from "../../lib/scene";

export interface SceneCanvasSelectionState {
  effectiveSelectedDrawingIds: string[];
  effectiveSelectedFogShapeIds: string[];
  effectiveSelectedTokenIds: string[];
  effectiveSelectedWeatherMaskIds: string[];
  sceneSelectionAnimating: boolean;
}

export interface SceneCanvasSelectionOptions {
  mode: "gm" | "player";
  selectedDrawingId?: string | null;
  selectedDrawingIds?: readonly string[];
  selectedFogShapeId?: string | null;
  selectedFogShapeIds?: readonly string[];
  selectedTokenId?: string | null;
  selectedTokenIds?: readonly string[];
  selectedWeatherMaskId?: string | null;
  selectedWeatherMaskIds?: readonly string[];
}

export function getSceneCanvasSelectionState(options: SceneCanvasSelectionOptions): SceneCanvasSelectionState {
  const effectiveSelectedDrawingIds = getSelectedItemIdList(options.selectedDrawingId, options.selectedDrawingIds);
  const effectiveSelectedFogShapeIds = getSelectedItemIdList(options.selectedFogShapeId, options.selectedFogShapeIds);
  const effectiveSelectedTokenIds = getSelectedItemIdList(options.selectedTokenId, options.selectedTokenIds);
  const effectiveSelectedWeatherMaskIds = getSelectedItemIdList(options.selectedWeatherMaskId, options.selectedWeatherMaskIds);

  return {
    effectiveSelectedDrawingIds,
    effectiveSelectedFogShapeIds,
    effectiveSelectedTokenIds,
    effectiveSelectedWeatherMaskIds,
    sceneSelectionAnimating: shouldAnimateSceneSelection(options.mode, {
      drawingIds: effectiveSelectedDrawingIds,
      fogShapeIds: effectiveSelectedFogShapeIds,
      tokenIds: effectiveSelectedTokenIds,
      weatherMaskIds: effectiveSelectedWeatherMaskIds
    })
  };
}

export function useSceneCanvasSelectionState(
  options: SceneCanvasSelectionOptions
): SceneCanvasSelectionState {
  const {
    mode,
    selectedDrawingId,
    selectedDrawingIds,
    selectedFogShapeId,
    selectedFogShapeIds,
    selectedTokenId,
    selectedTokenIds,
    selectedWeatherMaskId,
    selectedWeatherMaskIds
  } = options;

  return useMemo(
    () => getSceneCanvasSelectionState({
      mode,
      selectedDrawingId,
      selectedDrawingIds,
      selectedFogShapeId,
      selectedFogShapeIds,
      selectedTokenId,
      selectedTokenIds,
      selectedWeatherMaskId,
      selectedWeatherMaskIds
    }),
    [
      mode,
      selectedDrawingId,
      selectedDrawingIds,
      selectedFogShapeId,
      selectedFogShapeIds,
      selectedTokenId,
      selectedTokenIds,
      selectedWeatherMaskId,
      selectedWeatherMaskIds
    ]
  );
}
