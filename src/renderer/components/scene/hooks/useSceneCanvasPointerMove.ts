import { useCallback, type Dispatch, type MutableRefObject, type PointerEvent, type SetStateAction } from "react";
import type { LiveTableEvent, Point, Scene, TableToolSettings } from "../../../../shared/localvtt";
import { eventToWorldPoint, getCameraForPanDrag, getRenderCamera, isSnapModifier, type Camera, type CameraPanDrag } from "../../../canvas/core";
import type { DrawingPointOverrides, DrawingPreview, DrawingTool } from "../../../canvas/drawings";
import { getTemplatePreviewDrawing } from "../../../canvas/drawings";
import type { EnvironmentEffectDrag, EnvironmentPolygonDraft } from "../../../canvas/effects";
import type { FogDrag, FogPolygonDraft, FogTool } from "../../../canvas/fog";
import type { MapCalibrationBox, MapCalibrationDrag } from "../../../canvas/map";
import type { RulerDrag } from "../../../canvas/measurement";
import { getUpdatedSelectionDrag } from "../../../canvas/selection";
import type {
  DrawingDragState,
  DrawingResizeState,
  DrawingRotateState,
  LaserDragState,
  SelectionDrag,
  TokenDragState
} from "../../../canvas/scene";
import type { TokenDragPreview } from "../../../canvas/tokens";
import type { WeatherMaskDrag, WeatherPolygonDraft } from "../../../canvas/weather";
import type { DrawingTemplateSize, EnvironmentEffectTool, WeatherMaskTool } from "../../tools";
import { getDrawingPointerMove, getDrawingPointerMoveAction } from "../input/sceneDrawingPointer";
import { getDrawingTransformPointerMove, getDrawingTransformPointerMoveAction } from "../input/sceneDrawingTransformPointer";
import { getEnvironmentEffectPointerMove, getEnvironmentEffectPointerMoveAction } from "../input/sceneEnvironmentEffectPointer";
import { getFogPointerMove, getFogPointerMoveAction } from "../input/sceneFogPointer";
import { getLaserPointerMove, getLaserPointerMoveAction } from "../input/sceneLaserPointer";
import { getMapCalibrationPointerMove, getMapCalibrationPointerMoveAction } from "../map/sceneMapCalibrationPointer";
import { getMaskEffectPointerMove, getMaskEffectPointerMoveAction, type EnvironmentEffectMoveState, type WeatherMaskMoveState } from "../input/sceneMaskEffectPointer";
import { getBrushHoverPointForPointerMove, getScenePolygonDraftPointerMoveUpdate } from "../input/scenePointerMoveFallbackUpdates";
import { getScenePointerMoveFallbackRoute } from "../input/scenePointerMoveFallbackRouting";
import { getScenePointerMoveRoute } from "../input/scenePointerMoveRouting";
import { getRulerPointerMoveAction, getUpdatedRulerPointerDrag } from "../input/sceneRulerPointer";
import { getTokenPointerMove, getTokenPointerMoveAction } from "../input/sceneTokenPointer";
import { getWeatherMaskPointerMove, getWeatherMaskPointerMoveAction } from "../input/sceneWeatherMaskPointer";
import { createLaserLiveTableEvent } from "../../../canvas/live-table";

interface SceneCanvasPointerMoveOptions {
  activeTableTools: TableToolSettings;
  autoFitCameraRef: MutableRefObject<boolean>;
  camera: Camera;
  cancelTokenDrag: () => void;
  drawingDragRef: MutableRefObject<DrawingDragState | null>;
  drawingPolygonDraftRef: MutableRefObject<{ points: Point[]; current?: Point } | null>;
  drawingPreviewRef: MutableRefObject<DrawingPreview | null>;
  drawingResizeRef: MutableRefObject<DrawingResizeState | null>;
  drawingRotateRef: MutableRefObject<DrawingRotateState | null>;
  drawingTemplateSize: DrawingTemplateSize;
  drawingTool: DrawingTool | null;
  emitRulerEvent: (nextRulerDrag: RulerDrag) => void;
  dragRef: MutableRefObject<(CameraPanDrag & { pointerId: number }) | null>;
  environmentEffectDragRef: MutableRefObject<EnvironmentEffectDrag | null>;
  environmentEffectMovePreview: Map<string, Point[]> | null;
  environmentEffectMoveRef: MutableRefObject<EnvironmentEffectMoveState | null>;
  environmentEffectTool: EnvironmentEffectTool | null;
  environmentPolygonDraftRef: MutableRefObject<EnvironmentPolygonDraft | null>;
  fogDragRef: MutableRefObject<FogDrag | null>;
  fogTool: FogTool | null;
  getDrawingToolPoint: (event: PointerEvent<HTMLCanvasElement>, tool: DrawingTool) => Point;
  getRulerPoint: (event: PointerEvent<HTMLCanvasElement>) => Point;
  getToolPoint: (event: PointerEvent<HTMLCanvasElement>, snapEnabled?: boolean) => Point;
  laserDragRef: MutableRefObject<LaserDragState | null>;
  mapCalibrationDragRef: MutableRefObject<MapCalibrationDrag | null>;
  mode: "gm" | "player";
  onLiveTableEvent?: (event: LiveTableEvent) => void;
  onTemplatePreviewChange?: (drawing: ReturnType<typeof getTemplatePreviewDrawing>) => void;
  playerDisplayScale: number;
  polygonDraftRef: MutableRefObject<FogPolygonDraft | null>;
  rulerDragRef: MutableRefObject<(RulerDrag & { pointerId: number }) | null>;
  scene: Scene | null;
  selectionDragRef: MutableRefObject<SelectionDrag | null>;
  setBrushHoverPoint: Dispatch<SetStateAction<Point | null>>;
  setCamera: Dispatch<SetStateAction<Camera>>;
  setDrawingDragPreview: Dispatch<SetStateAction<DrawingPointOverrides | null>>;
  setDrawingPolygonDraft: Dispatch<SetStateAction<{ points: Point[]; current?: Point } | null>>;
  setDrawingPreview: Dispatch<SetStateAction<DrawingPreview | null>>;
  setEnvironmentEffectMovePreview: Dispatch<SetStateAction<Map<string, Point[]> | null>>;
  setEnvironmentEffectPreview: Dispatch<SetStateAction<EnvironmentEffectDrag | null>>;
  setEnvironmentPolygonDraft: Dispatch<SetStateAction<EnvironmentPolygonDraft | null>>;
  setFogPreview: Dispatch<SetStateAction<FogDrag | null>>;
  setMapCalibrationDraftBox: Dispatch<SetStateAction<MapCalibrationBox | null>>;
  setMapCalibrationDrag: Dispatch<SetStateAction<MapCalibrationDrag | null>>;
  setPolygonDraft: Dispatch<SetStateAction<FogPolygonDraft | null>>;
  setRulerDrag: Dispatch<SetStateAction<RulerDrag | null>>;
  setSelectionDrag: Dispatch<SetStateAction<SelectionDrag | null>>;
  setSnapPoint: Dispatch<SetStateAction<Point | null>>;
  setTokenDragPreview: Dispatch<SetStateAction<TokenDragPreview | null>>;
  setWeatherMaskMovePreview: Dispatch<SetStateAction<Map<string, Point[]> | null>>;
  setWeatherMaskPreview: Dispatch<SetStateAction<WeatherMaskDrag | null>>;
  setWeatherPolygonDraft: Dispatch<SetStateAction<WeatherPolygonDraft | null>>;
  tableToolsVisibleInPlayer: boolean;
  tokenDragRef: MutableRefObject<TokenDragState | null>;
  weatherMaskDragRef: MutableRefObject<WeatherMaskDrag | null>;
  weatherMaskMovePreview: Map<string, Point[]> | null;
  weatherMaskMoveRef: MutableRefObject<WeatherMaskMoveState | null>;
  weatherMaskTool: WeatherMaskTool | null;
  weatherPolygonDraftRef: MutableRefObject<WeatherPolygonDraft | null>;
  updateDrawingTransformHover: (event: PointerEvent<HTMLCanvasElement>) => void;
  updateSceneItemHover: (event: PointerEvent<HTMLCanvasElement>) => void;
  updateSnapPoint: (event: PointerEvent<HTMLCanvasElement>) => void;
}

export function useSceneCanvasPointerMove(options: SceneCanvasPointerMoveOptions) {
  return useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const tokenDrag = options.tokenDragRef.current;
    const drawingDragValue = options.drawingDragRef.current;
    const drawingResizeValue = options.drawingResizeRef.current;
    const drawingRotateValue = options.drawingRotateRef.current;
    const weatherMaskMoveValue = options.weatherMaskMoveRef.current;
    const environmentEffectMoveValue = options.environmentEffectMoveRef.current;
    const laserDrag = options.laserDragRef.current;
    const drawingDrag = options.drawingPreviewRef.current;
    const rulerDragValue = options.rulerDragRef.current;
    const selectionDragValue = options.selectionDragRef.current;
    const mapCalibrationDragValue = options.mapCalibrationDragRef.current;
    const pointerMoveRoute = getScenePointerMoveRoute({
      pointerId: event.pointerId,
      mapCalibrationDrag: mapCalibrationDragValue,
      laserDrag,
      rulerDrag: rulerDragValue,
      selectionDrag: selectionDragValue,
      drawingDrag,
      drawingMoveDrag: drawingDragValue,
      drawingResizeDrag: drawingResizeValue,
      drawingRotateDrag: drawingRotateValue,
      weatherMaskMove: weatherMaskMoveValue,
      environmentEffectMove: environmentEffectMoveValue,
      tokenDrag,
      fogDrag: options.fogDragRef.current,
      weatherMaskDrag: options.weatherMaskDragRef.current,
      environmentEffectDrag: options.environmentEffectDragRef.current,
      panDrag: options.dragRef.current
    });

    if (pointerMoveRoute === "map-calibration" && mapCalibrationDragValue) {
      const point = eventToWorldPoint(event, getRenderCamera(options.camera, options.playerDisplayScale));
      const action = getMapCalibrationPointerMoveAction(getMapCalibrationPointerMove(mapCalibrationDragValue, event.pointerId, point));
      if (action.kind === "set-drag") {
        options.mapCalibrationDragRef.current = action.drag;
        options.setMapCalibrationDrag(action.drag);
        options.setMapCalibrationDraftBox(action.draftBox);
      }
      return;
    }
    if (pointerMoveRoute === "laser" && laserDrag) {
      const point = eventToWorldPoint(event, getRenderCamera(options.camera, options.playerDisplayScale));
      const action = getLaserPointerMoveAction(getLaserPointerMove(laserDrag, event.pointerId, point, Date.now()));
      if (action.kind === "emit") {
        options.laserDragRef.current = action.drag;
        options.onLiveTableEvent?.(createLaserLiveTableEvent(laserDrag.eventId, action.drag.points, options.activeTableTools, options.tableToolsVisibleInPlayer));
      }
      return;
    }
    if (pointerMoveRoute === "ruler" && rulerDragValue) {
      const action = getRulerPointerMoveAction(getUpdatedRulerPointerDrag(rulerDragValue, event.pointerId, options.getRulerPoint(event)));
      if (action.kind === "set-drag") {
        options.rulerDragRef.current = action.drag;
        options.setRulerDrag(action.drag);
        options.emitRulerEvent(action.drag);
      }
      return;
    }

    if (pointerMoveRoute === "selection" && selectionDragValue) {
      const point = eventToWorldPoint(event, getRenderCamera(options.camera, options.playerDisplayScale));
      const nextSelectionDrag = getUpdatedSelectionDrag(selectionDragValue, point);
      options.selectionDragRef.current = nextSelectionDrag;
      options.setSelectionDrag(nextSelectionDrag);
      return;
    }

    if (pointerMoveRoute === "drawing" && drawingDrag) {
      const point = options.getDrawingToolPoint(event, drawingDrag.kind);
      const action = getDrawingPointerMoveAction(getDrawingPointerMove(drawingDrag, event.pointerId, point, options.scene, options.drawingTemplateSize, event.shiftKey));
      if (action.kind === "set-preview") {
        options.drawingPreviewRef.current = action.preview;
        options.setDrawingPreview(action.preview);
        options.onTemplatePreviewChange?.(getTemplatePreviewDrawing(action.preview));
      }
      return;
    }

    if (pointerMoveRoute === "drawing-transform") {
      const action = getDrawingTransformPointerMoveAction(
        getDrawingTransformPointerMove({
          dragState: drawingDragValue,
          point: eventToWorldPoint(event, getRenderCamera(options.camera, options.playerDisplayScale)),
          pointerId: event.pointerId,
          resizeState: drawingResizeValue,
          rotateState: drawingRotateValue,
          scene: options.scene,
          snapEnabled: isSnapModifier(event),
          squareConstrained: event.shiftKey
        })
      );
      if (action.kind === "set-preview") {
        if (action.snapPoint !== undefined) {
          options.setSnapPoint(action.snapPoint);
        }
        options.setDrawingDragPreview(action.preview);
      }
      return;
    }

    if (pointerMoveRoute === "mask-effect") {
      const action = getMaskEffectPointerMoveAction(
        getMaskEffectPointerMove({
          environmentEffectMoveState: environmentEffectMoveValue,
          point: eventToWorldPoint(event, getRenderCamera(options.camera, options.playerDisplayScale)),
          pointerId: event.pointerId,
          scene: options.scene,
          snapEnabled: isSnapModifier(event),
          weatherMaskMoveState: weatherMaskMoveValue
        })
      );
      if (action.kind === "set-environment-preview") {
        options.setSnapPoint(action.snapPoint);
        options.setEnvironmentEffectMovePreview(action.preview);
      } else if (action.kind === "set-weather-preview") {
        options.setWeatherMaskMovePreview(action.preview);
      }
      return;
    }

    if (pointerMoveRoute === "token" && tokenDrag && options.scene) {
      const point = eventToWorldPoint(event, getRenderCamera(options.camera, options.playerDisplayScale));
      const action = getTokenPointerMoveAction(getTokenPointerMove(options.scene, tokenDrag, event.pointerId, point));
      if (action.kind === "cancel-drag") {
        options.cancelTokenDrag();
        return;
      }
      if (action.kind === "set-preview") {
        options.setTokenDragPreview(action.preview);
      }
      return;
    }

    const fogDrag = options.fogDragRef.current;
    if (pointerMoveRoute === "fog" && fogDrag) {
      const action = getFogPointerMoveAction(getFogPointerMove(fogDrag, event.pointerId, options.getToolPoint(event, fogDrag.kind !== "brush"), event.shiftKey));
      if (action.kind === "set-preview") {
        options.fogDragRef.current = action.drag;
        options.setFogPreview(action.drag);
      }
      return;
    }

    const weatherMaskDrag = options.weatherMaskDragRef.current;
    if (pointerMoveRoute === "weather-mask" && weatherMaskDrag) {
      const action = getWeatherMaskPointerMoveAction(getWeatherMaskPointerMove(weatherMaskDrag, event.pointerId, options.getToolPoint(event), event.shiftKey));
      if (action.kind === "set-preview") {
        options.weatherMaskDragRef.current = action.drag;
        options.setWeatherMaskPreview(action.drag);
      }
      return;
    }

    const environmentEffectDrag = options.environmentEffectDragRef.current;
    if (pointerMoveRoute === "environment-effect" && environmentEffectDrag) {
      const action = getEnvironmentEffectPointerMoveAction(getEnvironmentEffectPointerMove(environmentEffectDrag, event.pointerId, options.getToolPoint(event), event.shiftKey));
      if (action.kind === "set-preview") {
        options.environmentEffectDragRef.current = action.drag;
        options.setEnvironmentEffectPreview(action.drag);
      }
      return;
    }

    const drag = options.dragRef.current;
    if (pointerMoveRoute === "pan" && drag) {
      options.autoFitCameraRef.current = false;
      options.setCamera(getCameraForPanDrag(drag, event.clientX, event.clientY));
      return;
    }

    const pointerMoveFallbackRoute = getScenePointerMoveFallbackRoute({
      drawingPolygonDraftActive: Boolean(options.drawingPolygonDraftRef.current),
      drawingTool: options.drawingTool,
      environmentEffectTool: options.environmentEffectTool,
      environmentPolygonDraftActive: Boolean(options.environmentPolygonDraftRef.current),
      fogPolygonDraftActive: Boolean(options.polygonDraftRef.current),
      fogTool: options.fogTool,
      hasScene: Boolean(options.scene),
      mode: options.mode,
      weatherMaskTool: options.weatherMaskTool,
      weatherPolygonDraftActive: Boolean(options.weatherPolygonDraftRef.current)
    });

    if (pointerMoveFallbackRoute === "drawing-polygon-draft" && options.drawingPolygonDraftRef.current) {
      const update = getScenePolygonDraftPointerMoveUpdate(options.drawingPolygonDraftRef.current, options.getDrawingToolPoint(event, "polygon"));
      if (update) {
        options.setDrawingPolygonDraft(update.draft);
      }
      return;
    }

    if (pointerMoveFallbackRoute === "fog-polygon-draft" && options.polygonDraftRef.current) {
      const update = getScenePolygonDraftPointerMoveUpdate(options.polygonDraftRef.current, options.getToolPoint(event));
      if (update) {
        options.setPolygonDraft(update.draft);
      }
      return;
    }

    if (pointerMoveFallbackRoute === "weather-polygon-draft" && options.weatherPolygonDraftRef.current) {
      const update = getScenePolygonDraftPointerMoveUpdate(options.weatherPolygonDraftRef.current, options.getToolPoint(event));
      if (update) {
        options.setWeatherPolygonDraft(update.draft);
      }
      return;
    }

    if (pointerMoveFallbackRoute === "environment-polygon-draft" && options.environmentPolygonDraftRef.current) {
      const update = getScenePolygonDraftPointerMoveUpdate(options.environmentPolygonDraftRef.current, options.getToolPoint(event));
      if (update) {
        options.setEnvironmentPolygonDraft(update.draft);
      }
      return;
    }

    if (pointerMoveFallbackRoute === "fog-brush-hover" || pointerMoveFallbackRoute === "drawing-freehand-hover") {
      const brushHoverPointUpdate = getBrushHoverPointForPointerMove(
        pointerMoveFallbackRoute,
        options.getToolPoint(event, false),
        eventToWorldPoint(event, getRenderCamera(options.camera, options.playerDisplayScale))
      );
      options.setBrushHoverPoint(brushHoverPointUpdate);
      return;
    }

    options.updateDrawingTransformHover(event);
    options.updateSceneItemHover(event);
    options.updateSnapPoint(event);
  }, [options]);
}
