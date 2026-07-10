import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_TABLE_TOOLS,
  DEFAULT_VIDEO_PLAYBACK,
} from "../../shared/localvtt";
import type { Asset, Campaign, DrawingElement, DrawingStrokeStyle, DrawingTemplateEffect, EnvironmentEffectType, LiveTableEvent, Point, Scene, TableToolSettings } from "../../shared/localvtt";
import {
  getRenderCamera,
  type Camera,
  type CameraPanDrag
} from "../canvas/core";
import {
  getCanvasInteractionClass,
  hasAuthoringToolActive,
  type DrawingTransformHover
} from "../canvas/core";
import {
  type DrawingPointOverrides,
  type DrawingPreview,
  type DrawingTool
} from "../canvas/drawings";
import {
  type FogDrag,
  type FogTool
} from "../canvas/fog";
import {
  createRulerClearEvent,
  createRulerLiveTableEvent,
  getVisibleCanvasLiveTableEvents,
  getVisibleDiceOverlayEvents,
  getVisibleTableMessageEvents,
  RULER_RELEASE_LINGER_MS
} from "../canvas/live-table";
import { TableMessageOverlay } from "./player-view/TableMessageOverlay";
import { getPlayerDisplayScale } from "../canvas/live-table";
import {
  type MapCalibrationBox,
  type MapCalibrationDrag
} from "../canvas/map";
import {
  getInitialMapLoadStatus,
  getMapCanvasBackgroundPlan,
  type MapLoadStatus,
} from "../canvas/map";
import type { RulerDrag } from "../canvas/measurement";
import {
  getSceneCanvasReadiness
} from "../canvas/scene";
import type {
  ArrowPointerDragState,
  DrawingDragState,
  DrawingResizeState,
  DrawingRotateState,
  LaserDragState,
  SelectionDrag,
  SelectionMode,
  TokenDragState
} from "../canvas/scene";
import { getSceneEffectRenderState, getSceneLayerVisibility } from "../canvas/scene";
import { getTurnOrderTokenIndicators } from "../lib/turn-order";
import { hasVisibleTokenConditions, type TokenDragPreview } from "../canvas/tokens";
import {
  type AcidEffectTuning,
  type ArcaneEffectTuning,
  type ChaosEffectTuning,
  type ColdEffectTuning,
  type DarknessEffectTuning,
  type DistortionEffectTuning,
  type FogEffectTuning,
  type ForceFieldEffectTuning,
  type FireEffectTuning,
  type LavaEffectTuning,
  type LightningEffectTuning,
  type NatureEffectTuning,
  type PoisonEffectTuning,
  type RadiantEffectTuning,
  type ShockwaveEffectTuning,
  type SmokeEffectTuning,
  type VoidEffectTuning,
  type WaterEffectTuning,
  retainEnvironmentEffectRuntimes
} from "../canvas/effects";
import {
  shouldAnimateEnvironmentEffects,
  type EnvironmentEffectDrag
} from "../canvas/effects";
import { shouldAnimateWeather } from "../canvas/weather";
import {
  type WeatherMaskDrag,
} from "../canvas/weather";
import { useImageMapLoader } from "../hooks/useImageMapLoader";
import { usePlayerTokenTweens } from "../hooks/usePlayerTokenTweens";
import { useTokenImageLoader } from "../hooks/useTokenImageLoader";
import { useVideoMapPlayback } from "../hooks/useVideoMapPlayback";
import { SceneCanvasContextMenus } from "./scene/context-menu/SceneCanvasContextMenus";
import { PlayerSeatIndicators, PlayerTurnStatusIndicators, TurnOrderPlayerBar } from "./scene/overlays/PlayerViewTurnOverlays";
import { useSceneCanvasAssets } from "./scene/hooks/useSceneCanvasAssets";
import { useSceneCanvasContextMenus } from "./scene/context-menu/useSceneCanvasContextMenus";
import { useSceneCanvasEnvironmentTuning } from "./scene/hooks/useSceneCanvasEnvironmentTuning";
import { useSceneCanvasSelectionState } from "./scene/hooks/useSceneCanvasSelectionState";
import {
  MapLoadOverlay,
} from "./scene/overlays/SceneCanvasStatusStrips";
import { MapCalibrationControls } from "./scene/map/MapCalibrationControls";
import {
  type EnvironmentEffectMoveState,
  type WeatherMaskMoveState
} from "./scene/input/sceneMaskEffectPointer";
import { SceneCanvasToolStatusOverlays } from "./scene/overlays/SceneCanvasToolStatusOverlays";
import { VideoMapElements } from "./scene/map/VideoMapElements";
import { useSceneViewportCenterReporting } from "./scene/hooks/useSceneViewportCenterReporting";
import { useSceneVideoMapHandlers } from "./scene/map/useSceneVideoMapHandlers";
import { useSceneWheelZoom } from "./scene/hooks/useSceneWheelZoom";
import { useScenePolygonDrafts } from "./scene/hooks/useScenePolygonDrafts";
import { useSceneCanvasHoverPoints } from "./scene/hooks/useSceneCanvasHoverPoints";
import { useSceneTokenAssetDrop } from "./scene/hooks/useSceneTokenAssetDrop";
import { useSceneCanvasMouseEvents } from "./scene/hooks/useSceneCanvasMouseEvents";
import { useSceneCanvasRenderer } from "./scene/hooks/useSceneCanvasRenderer";
import { useSceneCanvasPointerDown } from "./scene/hooks/useSceneCanvasPointerDown";
import { useSceneCanvasPointerUp } from "./scene/hooks/useSceneCanvasPointerUp";
import { useSceneCanvasPointerMove } from "./scene/hooks/useSceneCanvasPointerMove";
import { useSceneCanvasKeyboardInteractions } from "./scene/hooks/useSceneCanvasKeyboardInteractions";
import { useSceneLifecycleResets } from "./scene/hooks/useSceneLifecycleResets";
import { useSceneCanvasMapReadiness } from "./scene/map/useSceneCanvasMapReadiness";
import { useSceneCanvasSelectionRouting } from "./scene/hooks/useSceneCanvasSelectionRouting";
import type { DrawingTemplateSize, EnvironmentEffectTool, MouseBehavior, SelectorSelectionFilters, WeatherMaskTool } from "./tools";

const DiceRollOverlay = lazy(() => import("./dice/DiceRollOverlay").then((module) => ({ default: module.DiceRollOverlay })));
const EMPTY_SELECTED_IDS: string[] = [];

interface SceneCanvasProps {
  campaign: Campaign | null;
  scene: Scene | null;
  mode: "gm" | "player";
  className?: string;
  interactive?: boolean;
  canvasTool?: "ruler" | "ping" | "laser" | "arrow" | null;
  mouseBehavior?: MouseBehavior;
  drawingTool?: DrawingTool | null;
  drawingColor?: string;
  drawingOpacity?: number;
  drawingFillColor?: string;
  drawingFillOpacity?: number;
  drawingStrokeStyle?: DrawingStrokeStyle;
  drawingStrokeWidth?: number;
  drawingTemplateSize?: DrawingTemplateSize;
  drawingTemplateEffect?: DrawingTemplateEffect;
  drawingTemplateWidth?: number;
  fogBrushSize?: number;
  fogTool?: FogTool | null;
  weatherMaskTool?: WeatherMaskTool | null;
  environmentEffectTool?: EnvironmentEffectTool | null;
  environmentEffectType?: EnvironmentEffectType;
  environmentEffectFeather?: number;
  acidEffectTuning?: AcidEffectTuning;
  coldEffectTuning?: ColdEffectTuning;
  darknessEffectTuning?: DarknessEffectTuning;
  poisonEffectTuning?: PoisonEffectTuning;
  waterEffectTuning?: WaterEffectTuning;
  lavaEffectTuning?: LavaEffectTuning;
  fireEffectTuning?: FireEffectTuning;
  lightningEffectTuning?: LightningEffectTuning;
  arcaneEffectTuning?: ArcaneEffectTuning;
  chaosEffectTuning?: ChaosEffectTuning;
  voidEffectTuning?: VoidEffectTuning;
  natureEffectTuning?: NatureEffectTuning;
  distortionEffectTuning?: DistortionEffectTuning;
  radiantEffectTuning?: RadiantEffectTuning;
  forceFieldEffectTuning?: ForceFieldEffectTuning;
  shockwaveEffectTuning?: ShockwaveEffectTuning;
  smokeEffectTuning?: SmokeEffectTuning;
  fogEffectTuning?: FogEffectTuning;
  liveTableEvents?: LiveTableEvent[];
  tableTools?: TableToolSettings;
  tableToolsVisibleInPlayer?: boolean;
  selectedFogShapeId?: string | null;
  selectedWeatherMaskId?: string | null;
  selectedEnvironmentEffectId?: string | null;
  selectedDrawingId?: string | null;
  selectedTokenId?: string | null;
  selectedFogShapeIds?: string[];
  selectedWeatherMaskIds?: string[];
  selectedDrawingIds?: string[];
  selectedTokenIds?: string[];
  selectorSelectionFilters?: SelectorSelectionFilters;
  onSceneChange?: (scene: Scene, syncScene?: Scene) => void;
  onSelectToken?: (tokenId: string | null) => void;
  onSelectFogShape?: (shapeId: string | null) => void;
  onSelectWeatherMask?: (maskId: string | null) => void;
  onSelectEnvironmentEffect?: (effectId: string | null) => void;
  onEditEnvironmentEffect?: (effectId: string) => void;
  onSelectDrawing?: (drawingId: string | null) => void;
  onSelectSceneItems?: (selection: { tokenIds?: string[]; drawingIds?: string[]; fogShapeIds?: string[]; weatherMaskIds?: string[]; mode?: SelectionMode }) => void;
  onAddTokenToTurnOrder?: (tokenId: string) => void;
  onDropTokenAsset?: (asset: Asset, point: Point) => void;
  onLiveTableEvent?: (event: LiveTableEvent) => void;
  onDiceRollResolved?: (event: Extract<LiveTableEvent, { type: "dice" }>) => void;
  onTemplatePreviewChange?: (drawing: DrawingElement | null) => void;
  onViewportCenterChange?: (point: Point) => void;
  onOpenTokenColor?: (tokenId: string, value: string, kind: "border" | "glow") => void;
  mapCalibrationBox?: MapCalibrationBox | null;
  onMapCalibrationBox?: (box: MapCalibrationBox) => void;
  onMapCalibrationCancel?: () => void;
  onReady?: () => void;
  showPlayerSeatIndicators?: boolean;
}

export function SceneCanvas({
  campaign,
  scene,
  mode,
  className,
  interactive = true,
  canvasTool = null,
  mouseBehavior = "selector",
  drawingTool = null,
  drawingColor = "#ff0000",
  drawingOpacity = 1,
  drawingFillColor = "#ff0000",
  drawingFillOpacity = 0,
  drawingStrokeStyle = "solid",
  drawingStrokeWidth = 40,
  drawingTemplateSize = "custom",
  drawingTemplateEffect = "plain",
  drawingTemplateWidth = 5,
  fogBrushSize,
  fogTool = null,
  weatherMaskTool = null,
  environmentEffectTool = null,
  environmentEffectType = "water",
  environmentEffectFeather = 0,
  acidEffectTuning,
  coldEffectTuning,
  darknessEffectTuning,
  poisonEffectTuning,
  waterEffectTuning,
  lavaEffectTuning,
  fireEffectTuning,
  lightningEffectTuning,
  arcaneEffectTuning,
  chaosEffectTuning,
  voidEffectTuning,
  natureEffectTuning,
  distortionEffectTuning,
  radiantEffectTuning,
  forceFieldEffectTuning,
  shockwaveEffectTuning,
  smokeEffectTuning,
  fogEffectTuning,
  liveTableEvents = [],
  tableTools,
  tableToolsVisibleInPlayer = true,
  selectedFogShapeId = null,
  selectedWeatherMaskId = null,
  selectedEnvironmentEffectId = null,
  selectedDrawingId = null,
  selectedTokenId = null,
  selectedFogShapeIds = EMPTY_SELECTED_IDS,
  selectedWeatherMaskIds = EMPTY_SELECTED_IDS,
  selectedDrawingIds = EMPTY_SELECTED_IDS,
  selectedTokenIds = EMPTY_SELECTED_IDS,
  selectorSelectionFilters = {
    tokens: true,
    templates: false,
    fogMasks: false,
    weatherMasks: false,
    drawings: true
  },
  onSceneChange,
  onSelectToken,
  onSelectFogShape,
  onSelectWeatherMask,
  onSelectEnvironmentEffect,
  onEditEnvironmentEffect,
  onSelectDrawing,
  onSelectSceneItems,
  onAddTokenToTurnOrder,
  onDropTokenAsset,
  onLiveTableEvent,
  onDiceRollResolved,
  onTemplatePreviewChange,
  onViewportCenterChange,
  onOpenTokenColor,
  mapCalibrationBox = null,
  onMapCalibrationBox,
  onMapCalibrationCancel,
  onReady,
  showPlayerSeatIndicators = false
}: SceneCanvasProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [videoMapLoadStatus, setVideoMapLoadStatus] = useState<MapLoadStatus>("idle");
  const [fogPreview, setFogPreview] = useState<FogDrag | null>(null);
  const [drawingPreview, setDrawingPreview] = useState<DrawingPreview | null>(null);
  const [weatherMaskPreview, setWeatherMaskPreview] = useState<WeatherMaskDrag | null>(null);
  const [environmentEffectPreview, setEnvironmentEffectPreview] = useState<EnvironmentEffectDrag | null>(null);
  const [rulerDrag, setRulerDrag] = useState<RulerDrag | null>(null);
  const [releasedRulerDrag, setReleasedRulerDrag] = useState<RulerDrag | null>(null);
  const [tokenDragPreview, setTokenDragPreview] = useState<TokenDragPreview | null>(null);
  const [drawingDragPreview, setDrawingDragPreview] = useState<DrawingPointOverrides | null>(null);
  const [weatherMaskMovePreview, setWeatherMaskMovePreview] = useState<Map<string, Point[]> | null>(null);
  const [environmentEffectMovePreview, setEnvironmentEffectMovePreview] = useState<Map<string, Point[]> | null>(null);
  const [mapCalibrationDrag, setMapCalibrationDrag] = useState<MapCalibrationDrag | null>(null);
  const [selectionDrag, setSelectionDrag] = useState<SelectionDrag | null>(null);
  const [drawingTransformHover, setDrawingTransformHover] = useState<DrawingTransformHover>(null);
  const [sceneItemHover, setSceneItemHover] = useState(false);
  const [mapCalibrationDraftBox, setMapCalibrationDraftBox] = useState<MapCalibrationBox | null>(null);
  const [brushHoverPoint, setBrushHoverPoint] = useState<Point | null>(null);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef<(CameraPanDrag & { pointerId: number }) | null>(null);
  const rulerDragRef = useRef<(RulerDrag & { pointerId: number }) | null>(null);
  const releasedRulerTimeoutRef = useRef<number | null>(null);
  const tokenDragRef = useRef<TokenDragState | null>(null);
  const drawingDragRef = useRef<DrawingDragState | null>(null);
  const drawingResizeRef = useRef<DrawingResizeState | null>(null);
  const drawingRotateRef = useRef<DrawingRotateState | null>(null);
  const weatherMaskMoveRef = useRef<WeatherMaskMoveState | null>(null);
  const environmentEffectMoveRef = useRef<EnvironmentEffectMoveState | null>(null);
  const arrowDragRef = useRef<ArrowPointerDragState | null>(null);
  const laserDragRef = useRef<LaserDragState | null>(null);
  const fogDragRef = useRef<FogDrag | null>(null);
  const drawingPreviewRef = useRef<DrawingPreview | null>(null);
  const weatherMaskDragRef = useRef<WeatherMaskDrag | null>(null);
  const environmentEffectDragRef = useRef<EnvironmentEffectDrag | null>(null);
  const mapCalibrationDragRef = useRef<MapCalibrationDrag | null>(null);
  const selectionDragRef = useRef<SelectionDrag | null>(null);
  const fittedSceneCameraRef = useRef<string | null>(null);
  const autoFitCameraRef = useRef(true);
  const activeTableTools = tableTools ?? scene?.tableTools ?? DEFAULT_TABLE_TOOLS;
  const activeFogBrushSize = fogBrushSize ?? scene?.fog.brushSize ?? 80;
  const currentEnvironmentEffectTuning = useSceneCanvasEnvironmentTuning({
    acidTuning: acidEffectTuning,
    arcaneTuning: arcaneEffectTuning,
    chaosTuning: chaosEffectTuning,
    coldTuning: coldEffectTuning,
    darknessTuning: darknessEffectTuning,
    distortionTuning: distortionEffectTuning,
    fireTuning: fireEffectTuning,
    fogTuning: fogEffectTuning,
    fieldTuning: forceFieldEffectTuning,
    lavaTuning: lavaEffectTuning,
    lightningTuning: lightningEffectTuning,
    natureTuning: natureEffectTuning,
    poisonTuning: poisonEffectTuning,
    radiantTuning: radiantEffectTuning,
    shockwaveTuning: shockwaveEffectTuning,
    smokeTuning: smokeEffectTuning,
    voidTuning: voidEffectTuning,
    waterTuning: waterEffectTuning
  });
  const {
    appendDrawingPolygonDraftPoint,
    appendEnvironmentPolygonDraftPoint,
    appendFogPolygonDraftPoint,
    appendWeatherPolygonDraftPoint,
    clearDrawingPolygonDraft,
    clearEnvironmentPolygonDraft,
    clearFogPolygonDraft,
    clearWeatherPolygonDraft,
    commitDrawingPolygonDraft,
    commitEnvironmentPolygonDraft,
    commitFogPolygonDraft: commitPolygonDraft,
    commitWeatherPolygonDraft,
    drawingPolygonDraft,
    drawingPolygonDraftRef,
    environmentPolygonDraft,
    environmentPolygonDraftRef,
    fogPolygonDraft: polygonDraft,
    fogPolygonDraftRef: polygonDraftRef,
    removeLastDrawingPolygonDraftPoint,
    removeLastEnvironmentPolygonDraftPoint,
    removeLastFogPolygonDraftPoint,
    removeLastWeatherPolygonDraftPoint,
    setDrawingPolygonDraft,
    setEnvironmentPolygonDraft,
    setFogPolygonDraft: setPolygonDraft,
    setWeatherPolygonDraft,
    weatherPolygonDraft,
    weatherPolygonDraftRef
  } = useScenePolygonDrafts({
    drawingStyle: {
      color: drawingColor,
      opacity: drawingOpacity,
      fillColor: drawingFillColor,
      fillOpacity: drawingFillOpacity,
      strokeStyle: drawingStrokeStyle,
      strokeWidth: drawingStrokeWidth
    },
    environmentEffectFeather,
    environmentEffectTuning: currentEnvironmentEffectTuning,
    environmentEffectType,
    onSceneChange,
    scene
  });
  const visibleDiceOverlayEvents = useMemo(() => getVisibleDiceOverlayEvents(liveTableEvents, mode), [liveTableEvents, mode]);
  const visibleTableMessageEvents = useMemo(() => getVisibleTableMessageEvents(liveTableEvents, mode), [liveTableEvents, mode]);
  const contextMenuSelectionHandlers = useMemo(() => ({
    onSelectDrawing,
    onSelectEnvironmentEffect,
    onSelectFogShape,
    onSelectToken,
    onSelectWeatherMask
  }), [onSelectDrawing, onSelectEnvironmentEffect, onSelectFogShape, onSelectToken, onSelectWeatherMask]);
  const {
    applySceneContextMenuOpening,
    contextMenuProps,
    dismissCanvasContextMenus
  } = useSceneCanvasContextMenus(contextMenuSelectionHandlers);

  const clearDrawingPreview = useCallback(() => {
    drawingPreviewRef.current = null;
    setDrawingPreview(null);
    onTemplatePreviewChange?.(null);
  }, [onTemplatePreviewChange]);

  const clearFogPreview = useCallback(() => {
    fogDragRef.current = null;
    setFogPreview(null);
  }, []);

  const clearWeatherMaskPreview = useCallback(() => {
    weatherMaskDragRef.current = null;
    setWeatherMaskPreview(null);
  }, []);

  const clearEnvironmentEffectPreview = useCallback(() => {
    environmentEffectDragRef.current = null;
    setEnvironmentEffectPreview(null);
  }, []);

  const cancelTokenDrag = useCallback(() => {
    tokenDragRef.current = null;
    setTokenDragPreview(null);
  }, []);

  const cancelDrawingDrag = useCallback(() => {
    drawingDragRef.current = null;
    drawingResizeRef.current = null;
    drawingRotateRef.current = null;
    setDrawingDragPreview(null);
  }, []);

  const cancelWeatherMaskMove = useCallback(() => {
    weatherMaskMoveRef.current = null;
    setWeatherMaskMovePreview(null);
  }, []);

  const cancelEnvironmentEffectMove = useCallback(() => {
    environmentEffectMoveRef.current = null;
    setEnvironmentEffectMovePreview(null);
    setSnapPoint(null);
  }, []);

  const emitRulerEvent = useCallback((nextRulerDrag: RulerDrag) => {
    if (!scene) {
      return;
    }
    onLiveTableEvent?.(createRulerLiveTableEvent(nextRulerDrag, scene, tableToolsVisibleInPlayer));
  }, [onLiveTableEvent, scene, tableToolsVisibleInPlayer]);

  const cancelRulerDrag = useCallback(() => {
    if (releasedRulerTimeoutRef.current !== null) {
      window.clearTimeout(releasedRulerTimeoutRef.current);
      releasedRulerTimeoutRef.current = null;
    }
    rulerDragRef.current = null;
    setRulerDrag(null);
    setReleasedRulerDrag(null);
    onLiveTableEvent?.(createRulerClearEvent());
  }, [onLiveTableEvent]);

  const finishRulerDrag = useCallback(() => {
    const activeRulerDrag = rulerDragRef.current;
    if (!activeRulerDrag || !scene) {
      return;
    }
    if (!activeTableTools.rulerLinger) {
      cancelRulerDrag();
      return;
    }
    const now = Date.now();
    if (releasedRulerTimeoutRef.current !== null) {
      window.clearTimeout(releasedRulerTimeoutRef.current);
    }
    rulerDragRef.current = null;
    setRulerDrag(null);
    setReleasedRulerDrag(activeRulerDrag);
    releasedRulerTimeoutRef.current = window.setTimeout(() => {
      setReleasedRulerDrag(null);
      releasedRulerTimeoutRef.current = null;
    }, RULER_RELEASE_LINGER_MS);
    onLiveTableEvent?.(createRulerLiveTableEvent(activeRulerDrag, scene, tableToolsVisibleInPlayer, now, now + RULER_RELEASE_LINGER_MS));
  }, [activeTableTools.rulerLinger, cancelRulerDrag, onLiveTableEvent, scene, tableToolsVisibleInPlayer]);

  useEffect(() => {
    return () => {
      if (releasedRulerTimeoutRef.current !== null) {
        window.clearTimeout(releasedRulerTimeoutRef.current);
      }
    };
  }, []);

  const {
    assetUrl,
    mapAsset,
    tokenImageSourceKey
  } = useSceneCanvasAssets(campaign, scene);
  const { failedTokenImageIds, loadedTokenImages } = useTokenImageLoader(tokenImageSourceKey);
  const { tokenTweenPositions: playerTokenTweenPositions, tokenTweenPositionsRef: playerTokenTweenPositionsRef } = usePlayerTokenTweens(scene, mode);
  const visibleCanvasLiveTableEvents = useMemo(() => getVisibleCanvasLiveTableEvents(liveTableEvents, mode), [liveTableEvents, mode]);
  const turnOrderTokenIndicators = useMemo(() => (scene && mode === "gm" ? getTurnOrderTokenIndicators(scene) : null), [mode, scene]);
  const {
    effectiveSelectedDrawingIds,
    effectiveSelectedFogShapeIds,
    effectiveSelectedTokenIds,
    effectiveSelectedWeatherMaskIds,
    sceneSelectionAnimating
  } = useSceneCanvasSelectionState({
    mode,
    selectedDrawingId,
    selectedDrawingIds,
    selectedFogShapeId,
    selectedFogShapeIds,
    selectedTokenId,
    selectedTokenIds,
    selectedWeatherMaskId,
    selectedWeatherMaskIds
  });
  const authoringToolActive = useMemo(
    () => hasAuthoringToolActive({ canvasTool, drawingTool, fogTool, weatherMaskTool, environmentEffectTool }),
    [canvasTool, drawingTool, environmentEffectTool, fogTool, weatherMaskTool]
  );
  const {
    mapLayer,
    drawingLayer,
    effectsLayer: weatherLayer,
    canShowMap,
    canShowGrid,
    canShowFog,
    canShowDrawings,
    canShowWeather,
    canShowTokens
  } = getSceneLayerVisibility(scene?.layers, mode);
  const sceneAnimationState = useMemo(
    () => ({
      tokenConditionAnimating: scene ? Boolean(canShowTokens && hasVisibleTokenConditions(scene, mode)) : false,
      weatherAnimating: scene ? shouldAnimateWeather(scene, Boolean(canShowWeather)) : false,
      environmentAnimating: shouldAnimateEnvironmentEffects(scene, mode, Boolean(canShowWeather))
    }),
    [canShowTokens, canShowWeather, mode, scene]
  );
  const effectRenderState = useMemo(
    () =>
      getSceneEffectRenderState({
        scene,
        mode,
        environmentEffectPoints: environmentEffectMovePreview,
        weatherMaskPoints: weatherMaskMovePreview,
        selectedEnvironmentEffectId,
        selectedWeatherMaskIds: effectiveSelectedWeatherMaskIds
      }),
    [effectiveSelectedWeatherMaskIds, environmentEffectMovePreview, mode, scene, selectedEnvironmentEffectId, weatherMaskMovePreview]
  );
  const isVideoMap = Boolean(canShowMap && mapAsset?.mediaType === "video" && assetUrl);
  const { loadedMap, mapLoadStatus: imageMapLoadStatus } = useImageMapLoader({
    assetId: mapAsset?.id,
    assetRelativePath: mapAsset?.relativePath,
    assetUrl,
    mediaType: mapAsset?.mediaType
  });
  const mapCanvasBackgroundPlan = getMapCanvasBackgroundPlan({
    isVideoMap,
    canShowMap,
    hasMapAsset: Boolean(mapAsset),
    imageMapReady: Boolean(loadedMap?.ready)
  });
  const mapLoadStatus = isVideoMap ? videoMapLoadStatus : imageMapLoadStatus;
  const playerDisplayScale = getPlayerDisplayScale(campaign, scene, mode);
  const {
    getDrawingToolPoint,
    getRulerPoint,
    getToolPoint,
    updateDrawingTransformHover,
    updateSceneItemHover,
    updateSnapPoint
  } = useSceneCanvasHoverPoints({
    authoringToolActive,
    camera,
    canShowDrawings,
    canShowFog,
    canShowTokens,
    canShowWeather,
    drawingDragPreview,
    drawingTool,
    environmentEffectTool,
    fogTool,
    mode,
    playerDisplayScale,
    scene,
    selectedDrawingIds,
    selectionDragRef,
    setDrawingTransformHover,
    setSceneItemHover,
    setSnapPoint,
    weatherMaskTool
  });
  const { onDragOver, onDrop } = useSceneTokenAssetDrop({
    campaign,
    camera,
    mode,
    onDropTokenAsset,
    playerDisplayScale,
    scene
  });
  const {
    onClick,
    onContextMenu,
    onDoubleClick,
    onPointerLeave
  } = useSceneCanvasMouseEvents({
    activeTableTools,
    applySceneContextMenuOpening,
    authoringToolActive,
    camera,
    canShowDrawings,
    canShowTokens,
    canvasTool,
    commitDrawingPolygonDraft,
    commitEnvironmentPolygonDraft,
    commitFogPolygonDraft: commitPolygonDraft,
    commitWeatherPolygonDraft,
    drawingPolygonDraftRef,
    drawingTool,
    emitRulerEvent,
    environmentEffectTool,
    environmentPolygonDraftRef,
    fogPolygonDraftRef: polygonDraftRef,
    mode,
    onAddTokenToTurnOrder,
    onLiveTableEvent,
    playerDisplayScale,
    removeLastDrawingPolygonDraftPoint,
    removeLastEnvironmentPolygonDraftPoint,
    removeLastFogPolygonDraftPoint,
    removeLastWeatherPolygonDraftPoint,
    rulerDragRef,
    scene,
    setBrushHoverPoint,
    setDrawingTransformHover,
    setRulerDrag,
    setSceneItemHover,
    setSnapPoint,
    setTokenDragPreview,
    tableToolsVisibleInPlayer,
    tokenDragPreview,
    tokenDragRef,
    weatherMaskTool,
    weatherPolygonDraftRef
  });
  const videoPlayback = scene?.videoPlayback ?? DEFAULT_VIDEO_PLAYBACK;
  const videoPaused = videoPlayback.paused;
  const videoMuted = videoPlayback.muted;
  const showVideoDiagnostics = mode === "gm" && videoPlayback.diagnosticsVisible;
  const { activeVideoIndex, preparedVideoIndex, videoDebug, videoRefs, videoUrls, playActiveWhenReady, recoverUnexpectedPause } =
    useVideoMapPlayback({
      assetUrl,
      isVideoMap,
      paused: videoPaused
    });

  const sceneCanvasReadiness = getSceneCanvasReadiness({
    canShowMap,
    canShowTokens,
    failedTokenImageIds,
    hasMapAsset: Boolean(mapAsset),
    loadedTokenImages,
    mapLoadStatus,
    mapMediaType: mapAsset?.mediaType,
    tokenImageSourceKey
  });

  const fitGmCameraToReadyMap = useSceneCanvasMapReadiness({
    activeVideoIndex,
    autoFitCameraRef,
    canShowMap: Boolean(canShowMap),
    canvasRef,
    fittedSceneCameraRef,
    isVideoMap,
    loadedMap,
    mapAsset,
    mode,
    onReady,
    scene,
    sceneCanvasReadiness,
    setCamera,
    videoRefs
  });

  useEffect(() => {
    if (!onMapCalibrationBox) {
      setMapCalibrationDraftBox(null);
      mapCalibrationDragRef.current = null;
      setMapCalibrationDrag(null);
    }
  }, [onMapCalibrationBox]);

  useSceneLifecycleResets({
    cancelEnvironmentEffectMove,
    cancelWeatherMaskMove,
    canvasTool,
    clearDrawingPolygonDraft,
    clearDrawingPreview,
    clearEnvironmentEffectPolygonDraft: clearEnvironmentPolygonDraft,
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
    sceneId: scene?.id,
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
  });

  useSceneCanvasKeyboardInteractions({
    cancelDrawingDrag,
    cancelEnvironmentEffectMove,
    cancelRulerDrag,
    cancelTokenDrag,
    cancelWeatherMaskMove,
    clearDrawingPreview,
    clearEnvironmentEffectPreview,
    clearFogPreview,
    drawingDragPreview,
    drawingPreview,
    emitRulerEvent,
    environmentEffectMovePreview,
    environmentEffectPreview,
    fogPreview,
    mode,
    rulerDrag,
    rulerDragRef,
    scene,
    setRulerDrag,
    setTokenDragPreview,
    tokenDragPreview,
    tokenDragRef,
    weatherMaskMovePreview
  });

  useEffect(() => {
    setVideoMapLoadStatus(isVideoMap ? getInitialMapLoadStatus(mapAsset?.mediaType, assetUrl) : "idle");
  }, [assetUrl, isVideoMap, mapAsset?.id, mapAsset?.mediaType]);

  useSceneCanvasRenderer({
    acidEffectTuning,
    activeFogBrushSize,
    activeVideoIndex,
    arcaneEffectTuning,
    autoFitCameraRef,
    brushHoverPoint,
    camera,
    canShowDrawings,
    canShowFog,
    canShowGrid,
    canShowMap,
    canShowTokens,
    canShowWeather,
    canvasRef,
    chaosEffectTuning,
    coldEffectTuning,
    darknessEffectTuning,
    distortionEffectTuning,
    drawingColor,
    drawingDragPreview,
    drawingDragRef,
    drawingFillColor,
    drawingFillOpacity,
    drawingLayer,
    drawingOpacity,
    drawingPolygonDraft,
    drawingPreview,
    drawingRotateRef,
    drawingStrokeStyle,
    drawingStrokeWidth,
    drawingTool,
    effectRenderState,
    effectiveSelectedDrawingIds,
    effectiveSelectedFogShapeIds,
    effectiveSelectedTokenIds,
    environmentEffectMovePreview,
    environmentEffectMoveRef,
    environmentEffectPreview,
    environmentEffectTool,
    environmentPolygonDraft,
    fireEffectTuning,
    fitGmCameraToReadyMap,
    fogEffectTuning,
    fogPreview,
    fogTool,
    forceFieldEffectTuning,
    isVideoMap,
    lavaEffectTuning,
    lightningEffectTuning,
    liveTableEvents,
    loadedMap,
    loadedTokenImages,
    mapAsset,
    mapCalibrationBox,
    mapCalibrationDraftBox,
    mapCalibrationDrag,
    mapCanvasBackgroundPlan,
    mapLayer,
    mapOverlayActive: sceneCanvasReadiness.mapOverlayActive,
    mode,
    natureEffectTuning,
    onMapCalibrationBox,
    playerDisplayScale,
    playerTokenTweenPositions,
    playerTokenTweenPositionsRef,
    poisonEffectTuning,
    polygonDraft,
    radiantEffectTuning,
    releasedRulerDrag,
    rulerDrag,
    scene,
    sceneAnimationState,
    sceneSelectionAnimating,
    selectionDrag,
    shockwaveEffectTuning,
    smokeEffectTuning,
    snapPoint,
    tableTools: activeTableTools,
    tokenDragPreview,
    turnOrderTokenIndicators,
    videoRefs,
    visibleCanvasLiveTableEvents,
    voidEffectTuning,
    waterEffectTuning,
    weatherLayer,
    weatherMaskMovePreview,
    weatherMaskMoveRef,
    weatherMaskPreview,
    weatherMaskTool,
    weatherPolygonDraft
  });

  useEffect(() => {
    return retainEnvironmentEffectRuntimes();
  }, []);

  useSceneViewportCenterReporting({
    camera,
    canvasRef,
    mode,
    onViewportCenterChange,
    playerDisplayScale,
    scene
  });

  const { clearSceneSelectionsExcept, selectFromMarquee } = useSceneCanvasSelectionRouting({
    canShowDrawings: Boolean(canShowDrawings),
    canShowTokens: Boolean(canShowTokens),
    onSelectDrawing,
    onSelectEnvironmentEffect,
    onSelectFogShape,
    onSelectSceneItems,
    onSelectToken,
    onSelectWeatherMask,
    selectorSelectionFilters
  });

  const disableAutoFitCamera = useCallback(() => {
    autoFitCameraRef.current = false;
  }, []);

  useSceneWheelZoom({
    camera,
    canvasRef,
    interactive,
    onAutoFitCameraDisabled: disableAutoFitCamera,
    onCameraChange: setCamera
  });

  const onPointerDown = useSceneCanvasPointerDown({
    activeFogBrushSize,
    activeTableTools,
    appendDrawingPolygonDraftPoint,
    appendEnvironmentPolygonDraftPoint,
    appendFogPolygonDraftPoint,
    appendWeatherPolygonDraftPoint,
    authoringToolActive,
    camera,
    canShowDrawings,
    canShowTokens,
    canvasTool,
    clearEnvironmentPolygonDraft,
    clearSceneSelectionsExcept,
    clearWeatherPolygonDraft,
    currentEnvironmentEffectTuning,
    dismissCanvasContextMenus,
    dragRef,
    drawingColor,
    drawingDragRef,
    drawingFillColor,
    drawingFillOpacity,
    drawingOpacity,
    drawingPreviewRef,
    drawingResizeRef,
    drawingRotateRef,
    drawingStrokeStyle,
    drawingStrokeWidth,
    drawingTemplateEffect,
    drawingTemplateWidth,
    drawingTool,
    emitRulerEvent,
    environmentEffectDragRef,
    environmentEffectFeather,
    environmentEffectMoveRef,
    environmentEffectTool,
    environmentEffectType,
    fogDragRef,
    fogTool,
    getDrawingToolPoint,
    getRulerPoint,
    getToolPoint,
    interactive,
    arrowDragRef,
    laserDragRef,
    mapCalibrationBox,
    mapCalibrationDraftBox,
    mapCalibrationDragRef,
    mode,
    mouseBehavior,
    onLiveTableEvent,
    onMapCalibrationBox,
    onSceneChange,
    onSelectDrawing,
    onSelectEnvironmentEffect,
    onSelectFogShape,
    onSelectToken,
    onSelectWeatherMask,
    onTemplatePreviewChange,
    playerDisplayScale,
    releasedRulerTimeoutRef,
    rulerDragRef,
    scene,
    selectedDrawingIds: effectiveSelectedDrawingIds,
    selectedTokenIds: effectiveSelectedTokenIds,
    selectedWeatherMaskIds: effectiveSelectedWeatherMaskIds,
    selectionDragRef,
    setDrawingDragPreview,
    setDrawingPreview,
    setEnvironmentEffectMovePreview,
    setEnvironmentEffectPreview,
    setFogPreview,
    setIsPanning,
    setMapCalibrationDrag,
    setReleasedRulerDrag,
    setRulerDrag,
    setSelectionDrag,
    setTokenDragPreview,
    setWeatherMaskMovePreview,
    setWeatherMaskPreview,
    tableToolsVisibleInPlayer,
    tokenDragRef,
    weatherMaskDragRef,
    weatherMaskMoveRef,
    weatherMaskTool
  });

  const onPointerMove = useSceneCanvasPointerMove({
    activeTableTools,
    autoFitCameraRef,
    camera,
    cancelTokenDrag,
    arrowDragRef,
    dragRef,
    drawingDragRef,
    drawingPolygonDraftRef,
    drawingPreviewRef,
    drawingResizeRef,
    drawingRotateRef,
    drawingTemplateSize,
    drawingTool,
    emitRulerEvent,
    environmentEffectDragRef,
    environmentEffectMovePreview,
    environmentEffectMoveRef,
    environmentEffectTool,
    environmentPolygonDraftRef,
    fogDragRef,
    fogTool,
    getDrawingToolPoint,
    getRulerPoint,
    getToolPoint,
    laserDragRef,
    mapCalibrationDragRef,
    mode,
    onLiveTableEvent,
    onTemplatePreviewChange,
    playerDisplayScale,
    polygonDraftRef,
    rulerDragRef,
    scene,
    selectionDragRef,
    setBrushHoverPoint,
    setCamera,
    setDrawingDragPreview,
    setDrawingPolygonDraft,
    setDrawingPreview,
    setEnvironmentEffectMovePreview,
    setEnvironmentEffectPreview,
    setEnvironmentPolygonDraft,
    setFogPreview,
    setMapCalibrationDraftBox,
    setMapCalibrationDrag,
    setPolygonDraft,
    setRulerDrag,
    setSelectionDrag,
    setSnapPoint,
    setTokenDragPreview,
    setWeatherMaskMovePreview,
    setWeatherMaskPreview,
    setWeatherPolygonDraft,
    tableToolsVisibleInPlayer,
    tokenDragRef,
    weatherMaskDragRef,
    weatherMaskMovePreview,
    weatherMaskMoveRef,
    weatherMaskTool,
    weatherPolygonDraftRef,
    updateDrawingTransformHover,
    updateSceneItemHover,
    updateSnapPoint
  });

  const onPointerUp = useSceneCanvasPointerUp({
    cancelEnvironmentEffectMove,
    cancelTokenDrag,
    cancelWeatherMaskMove,
    clearDrawingPreview,
    clearEnvironmentEffectPreview,
    clearFogPreview,
    clearWeatherMaskPreview,
    currentEnvironmentEffectTuning,
    activeTableTools,
    arrowDragRef,
    dragRef,
    drawingDragPreview,
    drawingDragRef,
    drawingPreviewRef,
    drawingResizeRef,
    drawingRotateRef,
    environmentEffectDragRef,
    environmentEffectMovePreview,
    environmentEffectMoveRef,
    finishRulerDrag,
    fogDragRef,
    laserDragRef,
    mapCalibrationDraftBox,
    mapCalibrationDragRef,
    onLiveTableEvent,
    onSceneChange,
    rulerDragRef,
    scene,
    selectFromMarquee,
    selectionDragRef,
    setDrawingDragPreview,
    setIsPanning,
    setMapCalibrationDraftBox,
    setMapCalibrationDrag,
    setSelectionDrag,
    setSnapPoint,
    tableToolsVisibleInPlayer,
    tokenDragPreview,
    tokenDragRef,
    weatherMaskDragRef,
    weatherMaskMovePreview,
    weatherMaskMoveRef
  });

  const {
    handleVideoMapCanPlay,
    handleVideoMapError,
    handleVideoMapMetadataReady,
    handleVideoMapReady
  } = useSceneVideoMapHandlers({
    activeVideoIndex,
    canvasRef,
    fitGmCameraToReadyMap,
    isVideoMap,
    mapAssetId: mapAsset?.id,
    mode,
    playActiveWhenReady,
    scene,
    setVideoMapLoadStatus
  });

  const showMapOverlay = sceneCanvasReadiness.mapOverlayActive;
  const mapOverlayMessage = sceneCanvasReadiness.mapOverlayMessage;
  const activeCalibrationBox = onMapCalibrationBox ? mapCalibrationDraftBox : null;
  const activeCalibrationBoxCamera = getRenderCamera(camera, playerDisplayScale);

  return (
    <div ref={frameRef} className={className ?? "scene-canvas-frame"}>
      {isVideoMap && (
        <VideoMapElements
          activeVideoIndex={activeVideoIndex}
          camera={getRenderCamera(camera, playerDisplayScale)}
          mapAssetId={mapAsset?.id ?? ""}
          mapLayer={mapLayer ?? null}
          muted={videoMuted}
          paused={videoPaused}
          preparedVideoIndex={preparedVideoIndex}
          scene={scene}
          urls={videoUrls}
          videoRefs={videoRefs}
          onCanPlay={handleVideoMapCanPlay}
          onReady={handleVideoMapReady}
          onMetadataReady={handleVideoMapMetadataReady}
          onError={handleVideoMapError}
          onPause={recoverUnexpectedPause}
        />
      )}
      <canvas
        ref={canvasRef}
        className={`scene-canvas ${getCanvasInteractionClass({ canvasTool, mouseBehavior, drawingTool, fogTool, weatherMaskTool, environmentEffectTool, isPanning, tokenDragPreview, drawingTransformHover, sceneItemHover })}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onDragOver={onDragOver}
        onDrop={onDrop}
      />
      <SceneCanvasToolStatusOverlays
        activeFogBrushSize={activeFogBrushSize}
        canvasTool={canvasTool}
        drawingTemplateSize={drawingTemplateSize}
        drawingTool={drawingTool}
        environmentEffectTool={environmentEffectTool}
        environmentEffectType={environmentEffectType}
        environmentPolygonPointCount={environmentPolygonDraft?.points.length ?? 0}
        fogPolygonPointCount={polygonDraft?.points.length ?? 0}
        fogTool={fogTool}
        mode={mode}
        rulerDrag={rulerDrag}
        scene={scene}
        tokenDragPreview={tokenDragPreview}
        weatherMaskTool={weatherMaskTool}
        weatherPolygonPointCount={weatherPolygonDraft?.points.length ?? 0}
      />
      {mode === "gm" && onMapCalibrationBox && (
        <MapCalibrationControls
          activeBox={activeCalibrationBox}
          draftBox={mapCalibrationDraftBox}
          camera={activeCalibrationBoxCamera}
          onDraftBoxChange={setMapCalibrationDraftBox}
          onConfirm={onMapCalibrationBox}
          onCancel={onMapCalibrationCancel}
        />
      )}
      {visibleDiceOverlayEvents.length > 0 && (
        <Suspense fallback={null}>
          <DiceRollOverlay events={visibleDiceOverlayEvents} mode={mode} onDiceRollResolved={onDiceRollResolved} />
        </Suspense>
      )}
      <TableMessageOverlay events={visibleTableMessageEvents} mode={mode} />
      {mode === "player" && scene && <TurnOrderPlayerBar scene={scene} campaign={campaign} />}
      {mode === "player" && scene && showPlayerSeatIndicators && <PlayerSeatIndicators campaign={campaign} />}
      {mode === "player" && scene && <PlayerTurnStatusIndicators scene={scene} campaign={campaign} />}
      {mode === "gm" && createPortal(
        <SceneCanvasContextMenus
          scene={scene}
          {...contextMenuProps}
          onSceneChange={onSceneChange}
          onSelectToken={onSelectToken}
          onSelectDrawing={onSelectDrawing}
          onSelectFogShape={onSelectFogShape}
          onSelectWeatherMask={onSelectWeatherMask}
          onSelectEnvironmentEffect={onSelectEnvironmentEffect}
          onEditEnvironmentEffect={onEditEnvironmentEffect}
          onAddTokenToTurnOrder={onAddTokenToTurnOrder}
          onOpenTokenColor={onOpenTokenColor}
        />,
        document.body
      )}
      {showMapOverlay && <MapLoadOverlay message={mapOverlayMessage} showSpinner={mapLoadStatus === "loading"} />}
      {mode === "gm" && showVideoDiagnostics && isVideoMap && videoDebug && <div className="video-debug">{videoDebug}</div>}
    </div>
  );
}




