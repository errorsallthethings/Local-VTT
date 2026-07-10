import { useCallback, useEffect } from "react";
import type { LiveTableEvent, Point } from "../../../../shared/localvtt";
import { createRulerClearEvent } from "../../../canvas/live-table";
import type { RulerDrag } from "../../../canvas/measurement";
import type { SelectionDrag, TokenDragState } from "../../../canvas/scene";
import type { TokenDragPreview } from "../../../canvas/tokens";
import {
  getCanvasToolResetActions,
  getDrawingToolResetActions,
  getEnvironmentToolResetActions,
  getModeOrSceneResetActions,
  getSceneOrFogToolResetActions,
  getWeatherToolResetActions,
  type SceneLifecycleResetAction
} from "../state/sceneLifecycleReset";

interface MutableRef<T> {
  current: T;
}

type StateSetter<T> = (value: T | ((current: T) => T)) => void;

interface SceneLifecycleResetOptions {
  cancelEnvironmentEffectMove: () => void;
  cancelWeatherMaskMove: () => void;
  canvasTool: string | null | undefined;
  clearDrawingPolygonDraft: () => void;
  clearDrawingPreview: () => void;
  clearEnvironmentEffectPolygonDraft: () => void;
  clearEnvironmentEffectPreview: () => void;
  clearFogPolygonDraft: () => void;
  clearFogPreview: () => void;
  clearWeatherMaskPreview: () => void;
  clearWeatherPolygonDraft: () => void;
  dragRef: MutableRef<unknown | null>;
  drawingTool: unknown;
  environmentEffectTool: unknown;
  fogTool: unknown;
  arrowDragRef: MutableRef<unknown | null>;
  laserDragRef: MutableRef<unknown | null>;
  mode: "gm" | "player";
  onLiveTableEvent?: (event: LiveTableEvent) => void;
  releasedRulerTimeoutRef: MutableRef<number | null>;
  rulerDragRef: MutableRef<(RulerDrag & { pointerId?: number }) | null>;
  sceneId?: string;
  selectionDragRef: MutableRef<SelectionDrag | null>;
  setBrushHoverPoint: StateSetter<Point | null>;
  setIsPanning: StateSetter<boolean>;
  setReleasedRulerDrag: StateSetter<RulerDrag | null>;
  setRulerDrag: StateSetter<RulerDrag | null>;
  setSceneItemHover: StateSetter<boolean>;
  setSelectionDrag: StateSetter<SelectionDrag | null>;
  setSnapPoint: StateSetter<Point | null>;
  setTokenDragPreview: StateSetter<TokenDragPreview | null>;
  tokenDragRef: MutableRef<TokenDragState | null>;
  weatherMaskTool: unknown;
}

export function useSceneLifecycleResets({
  cancelEnvironmentEffectMove,
  cancelWeatherMaskMove,
  canvasTool,
  clearDrawingPolygonDraft,
  clearDrawingPreview,
  clearEnvironmentEffectPolygonDraft,
  clearEnvironmentEffectPreview,
  clearFogPolygonDraft,
  clearFogPreview,
  clearWeatherMaskPreview,
  clearWeatherPolygonDraft,
  dragRef,
  drawingTool,
  environmentEffectTool,
  fogTool,
  arrowDragRef,
  laserDragRef,
  mode,
  onLiveTableEvent,
  releasedRulerTimeoutRef,
  rulerDragRef,
  sceneId,
  selectionDragRef,
  setBrushHoverPoint,
  setIsPanning,
  setReleasedRulerDrag,
  setRulerDrag,
  setSceneItemHover,
  setSelectionDrag,
  setSnapPoint,
  setTokenDragPreview,
  tokenDragRef,
  weatherMaskTool
}: SceneLifecycleResetOptions): void {
  const applySceneLifecycleResetActions = useCallback(
    (actions: readonly SceneLifecycleResetAction[]) => {
      for (const action of actions) {
        switch (action) {
          case "clear-fog-polygon-draft":
            clearFogPolygonDraft();
            break;
          case "clear-drawing-polygon-draft":
            clearDrawingPolygonDraft();
            break;
          case "clear-weather-polygon-draft":
            clearWeatherPolygonDraft();
            break;
          case "clear-environment-polygon-draft":
            clearEnvironmentEffectPolygonDraft();
            break;
          case "clear-fog-preview":
            clearFogPreview();
            break;
          case "clear-drawing-preview":
            clearDrawingPreview();
            break;
          case "clear-weather-preview":
            clearWeatherMaskPreview();
            break;
          case "clear-environment-preview":
            clearEnvironmentEffectPreview();
            break;
          case "cancel-weather-move":
            cancelWeatherMaskMove();
            break;
          case "cancel-environment-move":
            cancelEnvironmentEffectMove();
            break;
          case "clear-token-drag":
            tokenDragRef.current = null;
            setTokenDragPreview(null);
            break;
          case "clear-pan-drag":
            dragRef.current = null;
            setIsPanning(false);
            break;
          case "clear-selection-drag":
            selectionDragRef.current = null;
            setSelectionDrag(null);
            break;
          case "clear-brush-hover":
            setBrushHoverPoint(null);
            break;
          case "clear-snap-point":
            setSnapPoint(null);
            break;
          case "clear-scene-item-hover":
            setSceneItemHover(false);
            break;
          case "clear-ruler-drag":
            setRulerDrag(null);
            rulerDragRef.current = null;
            break;
          case "clear-released-ruler":
            if (releasedRulerTimeoutRef.current !== null) {
              window.clearTimeout(releasedRulerTimeoutRef.current);
              releasedRulerTimeoutRef.current = null;
            }
            setReleasedRulerDrag(null);
            break;
          case "clear-laser-drag":
            laserDragRef.current = null;
            break;
          case "clear-arrow-drag":
            arrowDragRef.current = null;
            break;
          case "emit-ruler-clear":
            onLiveTableEvent?.(createRulerClearEvent());
            break;
        }
      }
    },
    [
      cancelEnvironmentEffectMove,
      cancelWeatherMaskMove,
      clearDrawingPolygonDraft,
      clearDrawingPreview,
      clearEnvironmentEffectPolygonDraft,
      clearEnvironmentEffectPreview,
      clearFogPolygonDraft,
      clearFogPreview,
      clearWeatherMaskPreview,
      clearWeatherPolygonDraft,
      dragRef,
      arrowDragRef,
      laserDragRef,
      onLiveTableEvent,
      releasedRulerTimeoutRef,
      rulerDragRef,
      selectionDragRef,
      setBrushHoverPoint,
      setIsPanning,
      setReleasedRulerDrag,
      setRulerDrag,
      setSceneItemHover,
      setSelectionDrag,
      setSnapPoint,
      setTokenDragPreview,
      tokenDragRef
    ]
  );

  useEffect(() => {
    applySceneLifecycleResetActions(getSceneOrFogToolResetActions());
  }, [applySceneLifecycleResetActions, fogTool, sceneId]);

  useEffect(() => {
    applySceneLifecycleResetActions(getDrawingToolResetActions());
  }, [applySceneLifecycleResetActions, drawingTool, sceneId]);

  useEffect(() => {
    applySceneLifecycleResetActions(getCanvasToolResetActions(Boolean(rulerDragRef.current)));
  }, [applySceneLifecycleResetActions, canvasTool, sceneId, rulerDragRef]);

  useEffect(() => {
    applySceneLifecycleResetActions(getModeOrSceneResetActions());
  }, [applySceneLifecycleResetActions, mode, sceneId]);

  useEffect(() => {
    applySceneLifecycleResetActions(getWeatherToolResetActions());
  }, [applySceneLifecycleResetActions, sceneId, weatherMaskTool]);

  useEffect(() => {
    applySceneLifecycleResetActions(getEnvironmentToolResetActions());
  }, [applySceneLifecycleResetActions, environmentEffectTool, sceneId]);
}
