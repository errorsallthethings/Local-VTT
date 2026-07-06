import { useCallback, type Dispatch, type MutableRefObject, type PointerEvent, type SetStateAction } from "react";
import type { EnvironmentEffectMask, Point, Scene } from "../../../shared/localvtt";
import type { DrawingPointOverrides, DrawingPreview } from "../../canvas/drawings";
import type { EnvironmentEffectDrag } from "../../canvas/effects";
import type { FogDrag } from "../../canvas/fog";
import type { MapCalibrationBox, MapCalibrationDrag } from "../../canvas/map";
import type { RulerDrag } from "../../canvas/measurement";
import type { CameraPanDrag } from "../../canvas/core";
import type {
  DrawingDragState,
  DrawingResizeState,
  DrawingRotateState,
  LaserDragState,
  SelectionDrag,
  TokenDragState
} from "../../canvas/scene";
import type { TokenDragPreview } from "../../canvas/tokens";
import type { WeatherMaskDrag } from "../../canvas/weather";
import {
  getSceneAfterDrawingDragCommit,
  getSceneAfterEnvironmentEffectDragCommit,
  getSceneAfterFogDragCommit,
  getSceneAfterWeatherMaskDragCommit
} from "./sceneDragCommitScenes";
import {
  getDrawingTransformPointerComplete,
  getDrawingTransformPointerCompleteAction
} from "./sceneDrawingTransformPointer";
import { getMapCalibrationPointerCompleteAction } from "./sceneMapCalibrationPointer";
import {
  getMaskEffectPointerComplete,
  getMaskEffectPointerCompleteAction,
  type EnvironmentEffectMoveState,
  type WeatherMaskMoveState
} from "./sceneMaskEffectPointer";
import {
  getSceneAfterDrawingTransformPointerComplete,
  getSceneAfterMaskEffectPointerComplete,
  getSceneAfterTokenPointerComplete
} from "./scenePointerCompleteScenes";
import { getScenePointerUpRoute } from "./scenePointerUpRouting";
import { shouldEndLaserPointer } from "./sceneLaserPointer";

interface SceneCanvasPointerUpOptions {
  cancelEnvironmentEffectMove: () => void;
  cancelTokenDrag: () => void;
  cancelWeatherMaskMove: () => void;
  clearDrawingPreview: () => void;
  clearEnvironmentEffectPreview: () => void;
  clearFogPreview: () => void;
  clearWeatherMaskPreview: () => void;
  currentEnvironmentEffectTuning: Partial<EnvironmentEffectMask>;
  dragRef: MutableRefObject<(CameraPanDrag & { pointerId: number }) | null>;
  drawingDragPreview: DrawingPointOverrides | null;
  drawingDragRef: MutableRefObject<DrawingDragState | null>;
  drawingPreviewRef: MutableRefObject<DrawingPreview | null>;
  drawingResizeRef: MutableRefObject<DrawingResizeState | null>;
  drawingRotateRef: MutableRefObject<DrawingRotateState | null>;
  environmentEffectDragRef: MutableRefObject<EnvironmentEffectDrag | null>;
  environmentEffectMovePreview: Map<string, Point[]> | null;
  environmentEffectMoveRef: MutableRefObject<EnvironmentEffectMoveState | null>;
  finishRulerDrag: () => void;
  fogDragRef: MutableRefObject<FogDrag | null>;
  laserDragRef: MutableRefObject<LaserDragState | null>;
  mapCalibrationDraftBox: MapCalibrationBox | null;
  mapCalibrationDragRef: MutableRefObject<MapCalibrationDrag | null>;
  onSceneChange?: (scene: Scene, syncScene?: Scene) => void;
  rulerDragRef: MutableRefObject<(RulerDrag & { pointerId: number }) | null>;
  scene: Scene | null;
  selectFromMarquee: (currentScene: Scene, drag: SelectionDrag) => void;
  selectionDragRef: MutableRefObject<SelectionDrag | null>;
  setDrawingDragPreview: Dispatch<SetStateAction<DrawingPointOverrides | null>>;
  setIsPanning: Dispatch<SetStateAction<boolean>>;
  setMapCalibrationDraftBox: Dispatch<SetStateAction<MapCalibrationBox | null>>;
  setMapCalibrationDrag: Dispatch<SetStateAction<MapCalibrationDrag | null>>;
  setSelectionDrag: Dispatch<SetStateAction<SelectionDrag | null>>;
  setSnapPoint: Dispatch<SetStateAction<Point | null>>;
  tokenDragPreview: TokenDragPreview | null;
  tokenDragRef: MutableRefObject<TokenDragState | null>;
  weatherMaskDragRef: MutableRefObject<WeatherMaskDrag | null>;
  weatherMaskMovePreview: Map<string, Point[]> | null;
  weatherMaskMoveRef: MutableRefObject<WeatherMaskMoveState | null>;
}

export function useSceneCanvasPointerUp(options: SceneCanvasPointerUpOptions) {
  return useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const pointerUpRoute = getScenePointerUpRoute({
      pointerId: event.pointerId,
      mapCalibrationDrag: options.mapCalibrationDragRef.current,
      drawingDrag: options.drawingPreviewRef.current,
      weatherMaskDrag: options.weatherMaskDragRef.current,
      environmentEffectDrag: options.environmentEffectDragRef.current,
      fogDrag: options.fogDragRef.current,
      rulerDrag: options.rulerDragRef.current,
      selectionDrag: options.selectionDragRef.current,
      drawingMoveDrag: options.drawingDragRef.current,
      drawingResizeDrag: options.drawingResizeRef.current,
      drawingRotateDrag: options.drawingRotateRef.current,
      weatherMaskMove: options.weatherMaskMoveRef.current,
      environmentEffectMove: options.environmentEffectMoveRef.current,
      laserDrag: options.laserDragRef.current
    });

    const mapCalibrationDragValue = options.mapCalibrationDragRef.current;
    if (pointerUpRoute === "map-calibration" && mapCalibrationDragValue) {
      const action = getMapCalibrationPointerCompleteAction(mapCalibrationDragValue, event.pointerId, options.mapCalibrationDraftBox);
      if (action.kind === "finish") {
        options.mapCalibrationDragRef.current = null;
        options.setMapCalibrationDrag(null);
        if (action.draftBox) {
          options.setMapCalibrationDraftBox(action.draftBox);
        }
      }
      return;
    }

    const drawingDrag = options.drawingPreviewRef.current;
    if (pointerUpRoute === "drawing" && drawingDrag) {
      options.clearDrawingPreview();
      if (options.scene && options.onSceneChange) {
        const nextScene = getSceneAfterDrawingDragCommit(options.scene, drawingDrag, crypto.randomUUID());
        if (nextScene) {
          options.onSceneChange(nextScene);
        }
      }
      return;
    }

    const weatherMaskDrag = options.weatherMaskDragRef.current;
    if (pointerUpRoute === "weather-mask" && weatherMaskDrag) {
      options.clearWeatherMaskPreview();
      if (options.scene && options.onSceneChange) {
        const nextScene = getSceneAfterWeatherMaskDragCommit(options.scene, weatherMaskDrag, crypto.randomUUID());
        if (nextScene) {
          options.onSceneChange(nextScene);
        }
      }
      return;
    }

    const environmentEffectDrag = options.environmentEffectDragRef.current;
    if (pointerUpRoute === "environment-effect" && environmentEffectDrag) {
      options.clearEnvironmentEffectPreview();
      if (options.scene && options.onSceneChange) {
        const nextScene = getSceneAfterEnvironmentEffectDragCommit(
          options.scene,
          environmentEffectDrag,
          crypto.randomUUID(),
          options.currentEnvironmentEffectTuning
        );
        if (nextScene) {
          options.onSceneChange(nextScene);
        }
      }
      return;
    }

    const fogDrag = options.fogDragRef.current;
    if (pointerUpRoute === "fog" && fogDrag) {
      options.clearFogPreview();
      if (options.scene && options.onSceneChange) {
        const nextScene = getSceneAfterFogDragCommit(options.scene, fogDrag, crypto.randomUUID());
        if (nextScene) {
          options.onSceneChange(nextScene);
        }
      }
      return;
    }

    if (pointerUpRoute === "ruler") {
      options.finishRulerDrag();
      return;
    }

    if (pointerUpRoute === "selection" && options.selectionDragRef.current) {
      const completedSelection = options.selectionDragRef.current;
      options.selectionDragRef.current = null;
      options.setSelectionDrag(null);
      if (options.scene) {
        options.selectFromMarquee(options.scene, completedSelection);
      }
      return;
    }

    if (pointerUpRoute === "drawing-transform") {
      const action = getDrawingTransformPointerCompleteAction(
        getDrawingTransformPointerComplete({
          dragState: options.drawingDragRef.current,
          pointerId: event.pointerId,
          preview: options.drawingDragPreview,
          resizeState: options.drawingResizeRef.current,
          rotateState: options.drawingRotateRef.current
        })
      );
      if (action.kind === "none") {
        return;
      }
      if (options.scene && options.onSceneChange) {
        const nextScene = getSceneAfterDrawingTransformPointerComplete(options.scene, action);
        if (nextScene) {
          options.onSceneChange(nextScene);
        }
      }
      if (action.kind === "commit-move") {
        options.drawingDragRef.current = null;
      } else if (action.kind === "commit-resize") {
        options.drawingResizeRef.current = null;
      } else {
        options.drawingRotateRef.current = null;
      }
      options.setDrawingDragPreview(null);
      if (action.clearSnapPoint) {
        options.setSnapPoint(null);
      }
      return;
    }

    if (pointerUpRoute === "mask-effect") {
      const action = getMaskEffectPointerCompleteAction(
        getMaskEffectPointerComplete({
          environmentEffectMoveState: options.environmentEffectMoveRef.current,
          environmentEffectPreview: options.environmentEffectMovePreview,
          pointerId: event.pointerId,
          weatherMaskMoveState: options.weatherMaskMoveRef.current,
          weatherMaskPreview: options.weatherMaskMovePreview
        })
      );
      if (action.kind === "commit-weather") {
        if (options.scene && options.onSceneChange) {
          const nextScene = getSceneAfterMaskEffectPointerComplete(options.scene, action);
          if (nextScene) {
            options.onSceneChange(nextScene);
          }
        }
        options.cancelWeatherMaskMove();
        return;
      }

      if (action.kind === "commit-environment-effect") {
        if (options.scene && options.onSceneChange) {
          const nextScene = getSceneAfterMaskEffectPointerComplete(options.scene, action);
          if (nextScene) {
            options.onSceneChange(nextScene);
          }
        }
        options.cancelEnvironmentEffectMove();
        return;
      }
      return;
    }

    if (pointerUpRoute === "laser" && shouldEndLaserPointer(options.laserDragRef.current, event.pointerId)) {
      options.laserDragRef.current = null;
      return;
    }

    if (options.dragRef.current?.pointerId === event.pointerId) {
      options.dragRef.current = null;
      options.setIsPanning(false);
    }
    if (options.tokenDragRef.current?.pointerId === event.pointerId) {
      const tokenDrag = options.tokenDragRef.current;
      if (options.scene && options.onSceneChange) {
        const result = getSceneAfterTokenPointerComplete(options.scene, tokenDrag, options.tokenDragPreview);
        if (result) {
          options.onSceneChange(result.scene, result.syncScene);
        }
      }
      options.cancelTokenDrag();
    }
  }, [options]);
}
