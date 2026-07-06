import { useCallback } from "react";
import type { Scene } from "../../../shared/localvtt";
import type { SelectionDrag } from "../../canvas/scene";
import type { SelectorSelectionFilters } from "../tools";
import {
  clearSceneSelectionsExcept,
  getSceneMarqueeSelectionPayload,
  type SceneMarqueeSelectionPayload,
  type SceneSelectionTargetKind
} from "./sceneSelectionRouting";

interface SceneCanvasSelectionRoutingOptions {
  canShowDrawings: boolean;
  canShowTokens: boolean;
  onSelectDrawing?: (id: string | null) => void;
  onSelectEnvironmentEffect?: (id: string | null) => void;
  onSelectFogShape?: (id: string | null) => void;
  onSelectSceneItems?: (selection: SceneMarqueeSelectionPayload) => void;
  onSelectToken?: (id: string | null) => void;
  onSelectWeatherMask?: (id: string | null) => void;
  selectorSelectionFilters: SelectorSelectionFilters;
}

export function useSceneCanvasSelectionRouting({
  canShowDrawings,
  canShowTokens,
  onSelectDrawing,
  onSelectEnvironmentEffect,
  onSelectFogShape,
  onSelectSceneItems,
  onSelectToken,
  onSelectWeatherMask,
  selectorSelectionFilters
}: SceneCanvasSelectionRoutingOptions): {
  clearSceneSelectionsExcept: (activeKind: SceneSelectionTargetKind) => void;
  selectFromMarquee: (currentScene: Scene, drag: SelectionDrag) => void;
} {
  const selectFromMarquee = useCallback(
    (currentScene: Scene, drag: SelectionDrag) => {
      const selection = getSceneMarqueeSelectionPayload(currentScene, drag, selectorSelectionFilters, {
        tokens: canShowTokens,
        drawings: canShowDrawings
      });
      if (!selection) {
        return;
      }
      onSelectSceneItems?.(selection);
    },
    [canShowDrawings, canShowTokens, onSelectSceneItems, selectorSelectionFilters]
  );

  const clearSceneSelectionsExceptCurrent = useCallback(
    (activeKind: SceneSelectionTargetKind) => {
      clearSceneSelectionsExcept(activeKind, {
        token: onSelectToken,
        drawing: onSelectDrawing,
        fogShape: onSelectFogShape,
        weatherMask: onSelectWeatherMask,
        environmentEffect: onSelectEnvironmentEffect
      });
    },
    [onSelectDrawing, onSelectEnvironmentEffect, onSelectFogShape, onSelectToken, onSelectWeatherMask]
  );

  return {
    clearSceneSelectionsExcept: clearSceneSelectionsExceptCurrent,
    selectFromMarquee
  };
}
