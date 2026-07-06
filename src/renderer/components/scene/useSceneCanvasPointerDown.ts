import { useCallback, type Dispatch, type MutableRefObject, type PointerEvent, type SetStateAction } from "react";
import type { DrawingStrokeStyle, DrawingTemplateEffect, EnvironmentEffectMask, EnvironmentEffectType, LiveTableEvent, Point, Scene, TableToolSettings } from "../../../shared/localvtt";
import { eventToWorldPoint, getRenderCamera, type Camera, type CameraPanDrag } from "../../canvas/core";
import type { DrawingPointOverrides, DrawingPreview, DrawingTool } from "../../canvas/drawings";
import { getTemplatePreviewDrawing } from "../../canvas/drawings";
import type { EnvironmentEffectDrag } from "../../canvas/effects";
import type { FogDrag, FogTool } from "../../canvas/fog";
import { getMarqueeSelectionMode, getSelectionDragFromPoint } from "../../canvas/selection";
import type {
  DrawingDragState,
  DrawingResizeState,
  DrawingRotateState,
  LaserDragState,
  SelectionDrag,
  SelectionMode,
  TokenDragState
} from "../../canvas/scene";
import type { TokenDragPreview } from "../../canvas/tokens";
import type { WeatherMaskDrag } from "../../canvas/weather";
import type { EnvironmentEffectMoveState, WeatherMaskMoveState } from "./sceneMaskEffectPointer";
import type { MapCalibrationBox, MapCalibrationDrag } from "../../canvas/map";
import type { RulerDrag } from "../../canvas/measurement";
import type { EnvironmentEffectTool, MouseBehavior, WeatherMaskTool } from "../tools";
import { getLaserPointerStart } from "./sceneLaserPointer";
import { getMapCalibrationPointerStart } from "./sceneMapCalibrationPointer";
import { getRulerPointerStart } from "./sceneRulerPointer";
import { getSceneAuthoringPointerStart } from "./sceneAuthoringPointerStart";
import { getScenePointerDownRoute } from "./scenePointerDownRouting";
import { getSceneSelectorPointerStart } from "./sceneSelectorPointerStart";

interface SceneCanvasPointerDownOptions {
  activeFogBrushSize: number;
  activeTableTools: TableToolSettings;
  appendDrawingPolygonDraftPoint: (point: Point) => void;
  appendEnvironmentPolygonDraftPoint: (point: Point) => void;
  appendFogPolygonDraftPoint: (tool: FogTool, point: Point) => void;
  appendWeatherPolygonDraftPoint: (point: Point) => void;
  authoringToolActive: boolean;
  camera: Camera;
  canShowDrawings: boolean | undefined;
  canShowTokens: boolean | undefined;
  canvasTool?: "ruler" | "ping" | "laser" | null;
  clearEnvironmentPolygonDraft: () => void;
  clearSceneSelectionsExcept: (activeKind: "token" | "drawing" | "fogShape" | "weatherMask" | "environmentEffect" | "empty") => void;
  clearWeatherPolygonDraft: () => void;
  currentEnvironmentEffectTuning: Partial<EnvironmentEffectMask>;
  dismissCanvasContextMenus: () => void;
  dragRef: MutableRefObject<(CameraPanDrag & { pointerId: number }) | null>;
  drawingColor: string;
  drawingDragRef: MutableRefObject<DrawingDragState | null>;
  drawingFillColor: string;
  drawingFillOpacity: number;
  drawingOpacity: number;
  drawingPreviewRef: MutableRefObject<DrawingPreview | null>;
  drawingResizeRef: MutableRefObject<DrawingResizeState | null>;
  drawingRotateRef: MutableRefObject<DrawingRotateState | null>;
  drawingStrokeStyle: DrawingStrokeStyle;
  drawingStrokeWidth: number;
  drawingTemplateEffect: DrawingTemplateEffect;
  drawingTemplateWidth: number;
  drawingTool: DrawingTool | null;
  environmentEffectDragRef: MutableRefObject<EnvironmentEffectDrag | null>;
  environmentEffectFeather: number;
  environmentEffectMoveRef: MutableRefObject<EnvironmentEffectMoveState | null>;
  environmentEffectTool: EnvironmentEffectTool | null;
  environmentEffectType: EnvironmentEffectType;
  fogDragRef: MutableRefObject<FogDrag | null>;
  fogTool: FogTool | null;
  getDrawingToolPoint: (event: PointerEvent<HTMLCanvasElement>, tool: DrawingTool) => Point;
  getRulerPoint: (event: PointerEvent<HTMLCanvasElement>) => Point;
  getToolPoint: (event: PointerEvent<HTMLCanvasElement>, snapEnabled?: boolean) => Point;
  interactive: boolean;
  laserDragRef: MutableRefObject<LaserDragState | null>;
  mapCalibrationBox: MapCalibrationBox | null;
  mapCalibrationDraftBox: MapCalibrationBox | null;
  mapCalibrationDragRef: MutableRefObject<MapCalibrationDrag | null>;
  mode: "gm" | "player";
  mouseBehavior: MouseBehavior;
  onLiveTableEvent?: (event: LiveTableEvent) => void;
  onMapCalibrationBox?: (box: MapCalibrationBox) => void;
  onSceneChange?: (scene: Scene, syncScene?: Scene) => void;
  onSelectDrawing?: (drawingId: string | null) => void;
  onSelectEnvironmentEffect?: (effectId: string | null) => void;
  onSelectFogShape?: (shapeId: string | null) => void;
  onSelectToken?: (tokenId: string | null) => void;
  onSelectWeatherMask?: (maskId: string | null) => void;
  onTemplatePreviewChange?: (drawing: ReturnType<typeof getTemplatePreviewDrawing>) => void;
  playerDisplayScale: number;
  releasedRulerTimeoutRef: MutableRefObject<number | null>;
  rulerDragRef: MutableRefObject<(RulerDrag & { pointerId: number }) | null>;
  scene: Scene | null;
  selectedDrawingIds: string[];
  selectedTokenIds: string[];
  selectedWeatherMaskIds: string[];
  selectionDragRef: MutableRefObject<SelectionDrag | null>;
  setDrawingDragPreview: Dispatch<SetStateAction<DrawingPointOverrides | null>>;
  setDrawingPreview: Dispatch<SetStateAction<DrawingPreview | null>>;
  setEnvironmentEffectMovePreview: Dispatch<SetStateAction<Map<string, Point[]> | null>>;
  setEnvironmentEffectPreview: Dispatch<SetStateAction<EnvironmentEffectDrag | null>>;
  setFogPreview: Dispatch<SetStateAction<FogDrag | null>>;
  setIsPanning: Dispatch<SetStateAction<boolean>>;
  setMapCalibrationDrag: Dispatch<SetStateAction<MapCalibrationDrag | null>>;
  setReleasedRulerDrag: Dispatch<SetStateAction<RulerDrag | null>>;
  setRulerDrag: Dispatch<SetStateAction<RulerDrag | null>>;
  setSelectionDrag: Dispatch<SetStateAction<SelectionDrag | null>>;
  setTokenDragPreview: Dispatch<SetStateAction<TokenDragPreview | null>>;
  setWeatherMaskMovePreview: Dispatch<SetStateAction<Map<string, Point[]> | null>>;
  setWeatherMaskPreview: Dispatch<SetStateAction<WeatherMaskDrag | null>>;
  tableToolsVisibleInPlayer: boolean;
  tokenDragRef: MutableRefObject<TokenDragState | null>;
  weatherMaskDragRef: MutableRefObject<WeatherMaskDrag | null>;
  weatherMaskMoveRef: MutableRefObject<WeatherMaskMoveState | null>;
  weatherMaskTool: WeatherMaskTool | null;
  emitRulerEvent: (nextRulerDrag: RulerDrag) => void;
}

export function useSceneCanvasPointerDown(options: SceneCanvasPointerDownOptions) {
  return useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    options.dismissCanvasContextMenus();
    if (!options.interactive) {
      return;
    }
    const pointerDownRoute = getScenePointerDownRoute({
      authoringToolActive: options.authoringToolActive,
      button: event.button,
      canvasTool: options.canvasTool,
      drawingTool: options.drawingTool,
      environmentEffectTool: options.environmentEffectTool,
      fogTool: options.fogTool,
      hasMapCalibrationTool: Boolean(options.onMapCalibrationBox),
      hasScene: Boolean(options.scene),
      mode: options.mode,
      mouseBehavior: options.mouseBehavior,
      onSceneChangeAvailable: Boolean(options.onSceneChange),
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      weatherMaskTool: options.weatherMaskTool
    });
    if (pointerDownRoute === "pan") {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      options.dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera: options.camera };
      options.setIsPanning(true);
      return;
    }
    if (pointerDownRoute === "ignore-ping") {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const cameraState = getRenderCamera(options.camera, options.playerDisplayScale);
    if (pointerDownRoute === "map-calibration") {
      const drag = getMapCalibrationPointerStart({
        button: event.button,
        camera: cameraState,
        draftBox: options.mapCalibrationDraftBox,
        existingBox: options.mapCalibrationBox ?? null,
        hasScene: Boolean(options.scene),
        mode: options.mode,
        point: eventToWorldPoint(event, cameraState),
        pointerId: event.pointerId,
        toolActive: Boolean(options.onMapCalibrationBox)
      });
      if (!drag) {
        return;
      }
      options.mapCalibrationDragRef.current = drag;
      options.setMapCalibrationDrag(drag);
      return;
    }
    if (pointerDownRoute === "ruler") {
      const nextRulerDrag = getRulerPointerStart({
        button: event.button,
        canvasTool: options.canvasTool,
        hasScene: Boolean(options.scene),
        mode: options.mode,
        point: options.getRulerPoint(event),
        pointerId: event.pointerId
      });
      if (!nextRulerDrag) {
        return;
      }
      if (options.releasedRulerTimeoutRef.current !== null) {
        window.clearTimeout(options.releasedRulerTimeoutRef.current);
        options.releasedRulerTimeoutRef.current = null;
      }
      options.setReleasedRulerDrag(null);
      options.rulerDragRef.current = nextRulerDrag;
      options.setRulerDrag(nextRulerDrag);
      options.emitRulerEvent(nextRulerDrag);
      return;
    }
    if (pointerDownRoute === "laser") {
      const start = getLaserPointerStart({
        button: event.button,
        canvasTool: options.canvasTool,
        eventId: crypto.randomUUID(),
        hasScene: Boolean(options.scene),
        mode: options.mode,
        point: eventToWorldPoint(event, cameraState),
        pointerId: event.pointerId,
        settings: options.activeTableTools,
        visibleInPlayer: options.tableToolsVisibleInPlayer
      });
      if (!start) {
        return;
      }
      options.laserDragRef.current = start.drag;
      options.onLiveTableEvent?.(start.event);
      return;
    }

    const getAuthoringStart = (route: typeof pointerDownRoute, toolPoint: Point) =>
      getSceneAuthoringPointerStart({
        activeFogBrushSize: options.activeFogBrushSize,
        button: event.button,
        drawingStyle: {
          color: options.drawingColor,
          opacity: options.drawingOpacity,
          fillColor: options.drawingFillColor,
          fillOpacity: options.drawingFillOpacity,
          strokeStyle: options.drawingStrokeStyle,
          strokeWidth: options.drawingStrokeWidth,
          templateEffect: options.drawingTemplateEffect,
          templateWidth: options.drawingTemplateWidth
        },
        drawingTool: options.drawingTool,
        environmentEffectFeather: options.environmentEffectFeather,
        environmentEffectTool: options.environmentEffectTool,
        environmentEffectTuning: options.currentEnvironmentEffectTuning,
        environmentEffectType: options.environmentEffectType,
        fogTool: options.fogTool,
        hasScene: Boolean(options.scene),
        mode: options.mode,
        onSceneChangeAvailable: Boolean(options.onSceneChange),
        pointerId: event.pointerId,
        route,
        toolPoint,
        weatherMaskTool: options.weatherMaskTool
      });

    if (pointerDownRoute === "drawing-polygon") {
      const activeDrawingTool = options.drawingTool!;
      const start = getAuthoringStart(pointerDownRoute, options.getDrawingToolPoint(event, activeDrawingTool));
      if (start?.kind === "drawing-polygon") {
        options.appendDrawingPolygonDraftPoint(start.point);
      }
      return;
    }
    if (pointerDownRoute === "drawing") {
      const activeDrawingTool = options.drawingTool!;
      const start = getAuthoringStart(pointerDownRoute, options.getDrawingToolPoint(event, activeDrawingTool));
      if (start?.kind !== "drawing") {
        return;
      }
      options.drawingPreviewRef.current = start.preview;
      options.setDrawingPreview(start.preview);
      options.onTemplatePreviewChange?.(getTemplatePreviewDrawing(start.preview));
      return;
    }
    if (pointerDownRoute === "fog") {
      const activeFogTool = options.fogTool!;
      const start = getAuthoringStart(pointerDownRoute, options.getToolPoint(event, !activeFogTool.includes("brush")));
      if (start?.kind !== "fog") {
        return;
      }
      if (start.start.kind === "polygon") {
        options.appendFogPolygonDraftPoint(start.start.tool, start.start.point);
        return;
      }
      options.fogDragRef.current = start.start.drag;
      options.setFogPreview(start.start.drag);
      return;
    }
    if (pointerDownRoute === "weather-mask") {
      const start = getAuthoringStart(pointerDownRoute, options.getToolPoint(event));
      if (start?.kind !== "weather-mask") {
        return;
      }
      if (start.start.kind === "polygon") {
        options.appendWeatherPolygonDraftPoint(start.start.point);
        return;
      }
      options.clearWeatherPolygonDraft();
      options.weatherMaskDragRef.current = start.start.drag;
      options.setWeatherMaskPreview(start.start.drag);
      return;
    }
    if (pointerDownRoute === "environment-effect") {
      const start = getAuthoringStart(pointerDownRoute, options.getToolPoint(event));
      if (start?.kind !== "environment-effect") {
        return;
      }
      if (start.start.kind === "polygon") {
        options.appendEnvironmentPolygonDraftPoint(start.start.point);
        return;
      }
      options.clearEnvironmentPolygonDraft();
      options.environmentEffectDragRef.current = start.start.drag;
      options.setEnvironmentEffectPreview(start.start.drag);
      return;
    }
    if (pointerDownRoute === "marquee-additive" || pointerDownRoute === "marquee") {
      const point = eventToWorldPoint(event, cameraState);
      const selectionMode: SelectionMode = getMarqueeSelectionMode(event);
      const nextSelectionDrag = getSelectionDragFromPoint(event.pointerId, point, selectionMode);
      options.selectionDragRef.current = nextSelectionDrag;
      options.setSelectionDrag(nextSelectionDrag);
      return;
    }
    if (pointerDownRoute === "selector") {
      const activeScene = options.scene!;
      const selectorStart = getSceneSelectorPointerStart({
        authoringToolActive: options.authoringToolActive,
        camera: cameraState,
        canShowDrawings: Boolean(options.canShowDrawings),
        canShowTokens: Boolean(options.canShowTokens),
        mouseBehavior: options.mouseBehavior,
        point: eventToWorldPoint(event, cameraState),
        pointerId: event.pointerId,
        scene: activeScene,
        selectedDrawingIds: options.selectedDrawingIds,
        selectedTokenIds: options.selectedTokenIds,
        selectedWeatherMaskIds: options.selectedWeatherMaskIds
      });
      applySelectorPointerStart(selectorStart, options);
    }
  }, [options]);
}

type SceneSelectorPointerStartResult = ReturnType<typeof getSceneSelectorPointerStart>;

function applySelectorPointerStart(selectorStart: SceneSelectorPointerStartResult, options: SceneCanvasPointerDownOptions) {
  if (selectorStart.kind === "token") {
    if (selectorStart.start.dragGroup.shouldSelectHitItem) {
      options.onSelectToken?.(selectorStart.start.token.id);
    }
    options.clearSceneSelectionsExcept("token");
    if (selectorStart.start.dragStart) {
      options.tokenDragRef.current = selectorStart.start.dragStart.drag;
      options.setTokenDragPreview(selectorStart.start.dragStart.preview);
    }
    return;
  }
  options.onSelectToken?.(null);

  if (selectorStart.kind === "drawing-transform") {
    if (selectorStart.start.transformKind === "rotate") {
      options.drawingRotateRef.current = selectorStart.start.state;
    } else {
      options.drawingResizeRef.current = selectorStart.start.state;
    }
    options.setDrawingDragPreview(selectorStart.start.preview);
    return;
  }

  if (selectorStart.kind === "drawing-hit") {
    if (selectorStart.start.dragGroup.shouldSelectHitItem) {
      options.onSelectDrawing?.(selectorStart.start.drawingId);
    }
    options.clearSceneSelectionsExcept("drawing");
    if (selectorStart.start.dragStart) {
      options.drawingDragRef.current = selectorStart.start.dragStart;
      options.setDrawingDragPreview(selectorStart.start.preview);
    }
    return;
  }

  if (selectorStart.kind === "environment-effect") {
    options.onSelectEnvironmentEffect?.(selectorStart.start.effectId);
    options.clearSceneSelectionsExcept("environmentEffect");
    if (selectorStart.start.moveStart) {
      options.environmentEffectMoveRef.current = selectorStart.start.moveStart;
      options.setEnvironmentEffectMovePreview(selectorStart.start.preview);
    }
    return;
  }

  if (selectorStart.kind === "weather-mask") {
    options.onSelectWeatherMask?.(selectorStart.start.maskId);
    options.clearSceneSelectionsExcept("weatherMask");
    if (selectorStart.start.moveStart) {
      options.weatherMaskMoveRef.current = selectorStart.start.moveStart;
      options.setWeatherMaskMovePreview(selectorStart.start.preview);
    }
    return;
  }

  if (selectorStart.kind === "fog-shape") {
    options.onSelectFogShape?.(selectorStart.start.shapeId);
    options.clearSceneSelectionsExcept("fogShape");
    return;
  }

  if (selectorStart.clearSceneSelections) {
    options.clearSceneSelectionsExcept("empty");
  }
}
