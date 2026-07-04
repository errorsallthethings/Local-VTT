import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_TABLE_TOOLS,
  DEFAULT_VIDEO_PLAYBACK,
} from "../../shared/localvtt";
import type { Asset, Campaign, DrawingElement, DrawingStrokeStyle, DrawingTemplateEffect, EnvironmentEffectMask, EnvironmentEffectType, LiveTableEvent, Point, Scene, TableToolSettings } from "../../shared/localvtt";
import {
  WEATHER_ONLY_FRAME_INTERVAL_MS,
  areCamerasEqual,
  getCameraForPanDrag,
  getCameraForWheelZoom,
  getCanvasAnimationFramePlan,
  getRenderCamera,
  hasCanvasAnimationSources,
  type Camera,
  type CameraPanDrag,
  type CanvasAnimationSources
} from "../canvas/core";
import {
  getCanvasInteractionClass,
  getDrawingTransformHoverAtPoint,
  hasAuthoringToolActive,
  hasSceneItemHoverAtPoint,
  type DrawingTransformHover
} from "../canvas/core";
import {
  drawDrawings,
  getDrawingPolygonDraftPreview,
  type DrawingPointOverrides,
  type DrawingPreview,
  type DrawingTool
} from "../canvas/drawings";
import {
  drawFog,
  getFogOperationForTool,
  type FogDrag,
  type FogPolygonDraft,
  type FogTool
} from "../canvas/fog";
import { drawHexGrid, drawSquareGrid } from "../canvas/grid";
import {
  createLaserLiveTableEvent,
  createPingLiveTableEvent,
  createRulerClearEvent,
  createRulerLiveTableEvent,
  drawLiveTableEvents,
  getVisibleCanvasLiveTableEvents,
  getVisibleDiceOverlayEvents,
  hasActiveLiveTableEvents,
  RULER_RELEASE_LINGER_MS
} from "../canvas/live-table";
import { getPlayerDisplayScale, getRulerDragWithRemovedWaypoint, getRulerLabel } from "../canvas/live-table";
import {
  getVisibleMapCalibrationBox,
  type MapCalibrationBox,
  type MapCalibrationDrag
} from "../canvas/map";
import { drawMapSource, getCameraForMapFit } from "../canvas/map";
import {
  getInitialMapLoadStatus,
  getMapCanvasBackgroundPlan,
  getMapOverlayMessage,
  getReadyMapSourceForFit,
  isMapOverlayActive,
  isMapReady,
  type MapLoadStatus,
  type ReadyMapSource
} from "../canvas/map";
import {
  drawRuler,
  type RulerDrag
} from "../canvas/measurement";
import { updatePolygonDraftCurrent } from "../canvas/scene";
import {
  getSceneCanvasRenderPlan,
  getDrawingDragCommit,
  getDrawingPolygonDraftCommit,
  getEnvironmentEffectDragCommit,
  getEnvironmentPolygonDraftCommit,
  getFogDragCommit,
  getFogPolygonDraftCommit,
  getWeatherMaskDragCommit,
  getWeatherPolygonDraftCommit,
  type DrawingContextMenu,
  type EnvironmentEffectContextMenu,
  type MaskContextMenu,
  type TokenContextMenu
} from "../canvas/scene";
import {
  getCompletedSceneMarqueeSelection,
  getMarqueeSelectionMode,
  shouldAnimateSceneSelection,
  getSelectionDragFromPoint,
  getUpdatedSelectionDrag
} from "../canvas/selection";
import type {
  DrawingDragState,
  DrawingResizeState,
  DrawingRotateState,
  LaserDragState,
  SelectionDrag,
  SelectionMode,
  TokenDragState
} from "../canvas/scene";
import {
  drawBrushHoverPreview,
  drawDrawingBrushHoverPreview,
  drawDrawingResizeHandles,
  drawMapCalibrationBox,
  drawSelectionMarquee,
  drawSnapMarker
} from "../canvas/scene";
import { drawEnvironmentEffectPreview, drawEnvironmentEffects, drawEnvironmentEffectShape } from "../canvas/effects";
import { getSceneEffectRenderState, getSceneLayerVisibility } from "../canvas/scene";
import { getNearestSceneSnapPoint, getSceneSnapMarkerOperations, resolveDrawingToolEventPoint, resolveRulerEventPoint, resolveSceneToolEventPoint, shouldShowSceneSnapPreview } from "../canvas/scene";
import { getSelectedItemIdList } from "../lib/scene";
import { getTurnOrderTokenIndicators } from "../lib/turn-order";
import {
  getTemplatePreviewDrawing
} from "../canvas/drawings";
import { areTokenImagesReady, getTokenAssetIds, getTokenImageAssets, getTokenImageSourceKey } from "../canvas/tokens";
import {
  getSceneAfterTokenDrag,
  getTokenDragWaypointRemovalUpdate
} from "../canvas/tokens";
import { drawTokenDragHighlights, drawTokens, hasVisibleTokenConditions, type TokenDragPreview } from "../canvas/tokens";
import { clientToWorldPoint, eventToWorldPoint, getCanvasViewportCenter, isSnapModifier } from "../canvas/core";
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
  type EnvironmentEffectDrag,
  type EnvironmentPolygonDraft
} from "../canvas/effects";
import { drawWeather, shouldAnimateWeather } from "../canvas/weather";
import {
  drawWeatherMaskOutlines,
  drawWeatherMaskPreview,
  drawWeatherMaskSelection,
  drawWeatherPolygonDraft
} from "../canvas/weather";
import {
  type WeatherMaskDrag,
  type WeatherPolygonDraft
} from "../canvas/weather";
import { useDismissableMenu } from "../hooks/useDismissableMenu";
import { useImageMapLoader } from "../hooks/useImageMapLoader";
import { usePlayerTokenTweens } from "../hooks/usePlayerTokenTweens";
import { usePolygonDraftKeyboard } from "../hooks/usePolygonDraftKeyboard";
import { useSyncedRef } from "../hooks/useSyncedRef";
import { useTokenImageLoader } from "../hooks/useTokenImageLoader";
import { useVideoMapPlayback } from "../hooks/useVideoMapPlayback";
import { useWindowKeyDown } from "../hooks/useWindowKeyDown";
import { calculateCanvasContextMenuPosition, type CanvasContextMenuKind } from "../lib/ui";
import {
  addEnvironmentEffect,
  addSceneDrawing,
  addSceneFogShape,
  addSceneWeatherMask,
  updateSceneDrawingPoints,
  updateSceneEnvironmentEffectPoints,
  updateSceneWeatherMaskPoints,
} from "../lib/scene";
import { SceneCanvasContextMenus } from "./scene/SceneCanvasContextMenus";
import { PlayerSeatIndicators, PlayerTurnStatusIndicators, TurnOrderPlayerBar } from "./scene/PlayerViewTurnOverlays";
import { getSceneContextMenuOpening, type SceneContextMenuOpening } from "./scene/sceneContextMenuOpening";
import { resetSceneHoverState } from "./scene/sceneHoverReset";
import {
  cancelSceneInteractionsForKeyboardEvent,
  hasCancelableSceneInteraction
} from "./scene/sceneInteractionCancellation";
import {
  appendScenePolygonDraftPoint,
  appendScopedScenePolygonDraftPoint,
  clearScenePolygonDraft,
  removeLastScenePolygonDraftPoint
} from "./scene/scenePolygonDraftState";
import {
  MapLoadOverlay,
} from "./scene/SceneCanvasStatusStrips";
import { MapCalibrationControls } from "./scene/MapCalibrationControls";
import { getSceneContextMenuTarget } from "./scene/sceneContextMenuTarget";
import { getScenePointerDownRoute } from "./scene/scenePointerDownRouting";
import { getScenePointerUpRoute } from "./scene/scenePointerUpRouting";
import { getSceneSelectionKindsToClear, type SceneSelectionTargetKind } from "./scene/sceneSelectionRouting";
import { canAcceptTokenAssetDrop as canAcceptSceneTokenAssetDrop, getDroppedTokenAsset } from "./scene/sceneTokenAssetDrop";
import { getDrawingPointerMove, getDrawingPointerStart } from "./scene/sceneDrawingPointer";
import { getEnvironmentEffectPointerMove, getEnvironmentEffectPointerStart } from "./scene/sceneEnvironmentEffectPointer";
import { getLaserPointerMove, getLaserPointerStart, shouldEndLaserPointer } from "./scene/sceneLaserPointer";
import { getFogPointerMove, getFogPointerStart } from "./scene/sceneFogPointer";
import {
  getEnvironmentEffectHitPointerStart,
  getMaskEffectPointerComplete,
  getMaskEffectPointerMove,
  getMaskPointerStart,
  type EnvironmentEffectMoveState,
  type WeatherMaskMoveState
} from "./scene/sceneMaskEffectPointer";
import { getMapCalibrationPointerComplete, getMapCalibrationPointerMove, getMapCalibrationPointerStart } from "./scene/sceneMapCalibrationPointer";
import { getRulerPointerStart, getUpdatedRulerPointerDrag } from "./scene/sceneRulerPointer";
import { getTokenPointerMove, getTokenPointerStart } from "./scene/sceneTokenPointer";
import { getDrawingTransformPointerComplete, getDrawingTransformPointerMove, getDrawingTransformPointerStart } from "./scene/sceneDrawingTransformPointer";
import { getRulerWaypointAppendKeyboardUpdate, getTokenWaypointAppendKeyboardUpdate } from "./scene/sceneWaypointKeyboard";
import { SceneCanvasToolStatusOverlays } from "./scene/SceneCanvasToolStatusOverlays";
import { VideoMapElements } from "./scene/VideoMapElements";
import { getWeatherMaskPointerMove, getWeatherMaskPointerStart } from "./scene/sceneWeatherMaskPointer";
import type { DrawingTemplateSize, EnvironmentEffectTool, MouseBehavior, SelectorSelectionFilters, WeatherMaskTool } from "./tools";

const DiceRollOverlay = lazy(() => import("./dice/DiceRollOverlay").then((module) => ({ default: module.DiceRollOverlay })));
const EMPTY_SELECTED_IDS: string[] = [];

interface SceneCanvasProps {
  campaign: Campaign | null;
  scene: Scene | null;
  mode: "gm" | "player";
  className?: string;
  interactive?: boolean;
  canvasTool?: "ruler" | "ping" | "laser" | null;
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

type DrawingPolygonDraft = {
  points: Point[];
  current?: Point;
};

function getCanvasContextMenuPosition(event: React.MouseEvent<HTMLCanvasElement>, kind: CanvasContextMenuKind): { x: number; y: number } {
  return calculateCanvasContextMenuPosition({
    anchorX: event.clientX,
    anchorY: event.clientY,
    kind,
    viewportWidth: window.innerWidth || document.documentElement.clientWidth,
    viewportHeight: window.innerHeight || document.documentElement.clientHeight
  });
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
  const [polygonDraft, setPolygonDraft] = useState<FogPolygonDraft | null>(null);
  const [drawingPolygonDraft, setDrawingPolygonDraft] = useState<DrawingPolygonDraft | null>(null);
  const [weatherPolygonDraft, setWeatherPolygonDraft] = useState<WeatherPolygonDraft | null>(null);
  const [environmentPolygonDraft, setEnvironmentPolygonDraft] = useState<EnvironmentPolygonDraft | null>(null);
  const [mapCalibrationDrag, setMapCalibrationDrag] = useState<MapCalibrationDrag | null>(null);
  const [selectionDrag, setSelectionDrag] = useState<SelectionDrag | null>(null);
  const [drawingTransformHover, setDrawingTransformHover] = useState<DrawingTransformHover>(null);
  const [sceneItemHover, setSceneItemHover] = useState(false);
  const [mapCalibrationDraftBox, setMapCalibrationDraftBox] = useState<MapCalibrationBox | null>(null);
  const [brushHoverPoint, setBrushHoverPoint] = useState<Point | null>(null);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  const [tokenContextMenu, setTokenContextMenu] = useState<TokenContextMenu | null>(null);
  const [maskContextMenu, setMaskContextMenu] = useState<MaskContextMenu | null>(null);
  const [drawingContextMenu, setDrawingContextMenu] = useState<DrawingContextMenu | null>(null);
  const [environmentEffectContextMenu, setEnvironmentEffectContextMenu] = useState<EnvironmentEffectContextMenu | null>(null);
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
  const laserDragRef = useRef<LaserDragState | null>(null);
  const fogDragRef = useRef<FogDrag | null>(null);
  const drawingPreviewRef = useRef<DrawingPreview | null>(null);
  const weatherMaskDragRef = useRef<WeatherMaskDrag | null>(null);
  const environmentEffectDragRef = useRef<EnvironmentEffectDrag | null>(null);
  const mapCalibrationDragRef = useRef<MapCalibrationDrag | null>(null);
  const selectionDragRef = useRef<SelectionDrag | null>(null);
  const polygonDraftRef = useSyncedRef<FogPolygonDraft | null>(polygonDraft);
  const drawingPolygonDraftRef = useSyncedRef<DrawingPolygonDraft | null>(drawingPolygonDraft);
  const weatherPolygonDraftRef = useSyncedRef<WeatherPolygonDraft | null>(weatherPolygonDraft);
  const environmentPolygonDraftRef = useSyncedRef<EnvironmentPolygonDraft | null>(environmentPolygonDraft);
  const fittedSceneCameraRef = useRef<string | null>(null);
  const autoFitCameraRef = useRef(true);
  const activeTableTools = tableTools ?? scene?.tableTools ?? DEFAULT_TABLE_TOOLS;
  const activeFogBrushSize = fogBrushSize ?? scene?.fog.brushSize ?? 80;
  const visibleDiceOverlayEvents = useMemo(() => getVisibleDiceOverlayEvents(liveTableEvents, mode), [liveTableEvents, mode]);

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

  const dismissCanvasContextMenus = useCallback(() => {
    setTokenContextMenu(null);
    setMaskContextMenu(null);
    setDrawingContextMenu(null);
    setEnvironmentEffectContextMenu(null);
  }, []);

  useDismissableMenu({
    enabled: Boolean(tokenContextMenu || maskContextMenu || drawingContextMenu || environmentEffectContextMenu),
    menuRootClass: "canvas-context-menu",
    onDismiss: dismissCanvasContextMenus
  });

  const mapAsset = useMemo(() => {
    if (!campaign || !scene?.mapAssetId) {
      return null;
    }
    return campaign.assets.find((asset) => asset.id === scene.mapAssetId) ?? null;
  }, [campaign, scene?.mapAssetId]);

  const assetUrl = useMemo(() => {
    return mapAsset?.absolutePath ? window.localVtt.toAssetUrl(mapAsset.absolutePath) : null;
  }, [mapAsset?.absolutePath]);
  const campaignAssets = campaign?.assets;

  const tokenAssetIds = useMemo(() => {
    return getTokenAssetIds(scene?.tokens);
  }, [scene?.tokens]);

  const tokenAssets = useMemo(() => {
    return getTokenImageAssets(campaignAssets, tokenAssetIds);
  }, [campaignAssets, tokenAssetIds]);

  const tokenImageSourceKey = useMemo(() => {
    return getTokenImageSourceKey(tokenAssets);
  }, [tokenAssets]);
  const { failedTokenImageIds, loadedTokenImages } = useTokenImageLoader(tokenImageSourceKey);
  const { tokenTweenPositions: playerTokenTweenPositions, tokenTweenPositionsRef: playerTokenTweenPositionsRef } = usePlayerTokenTweens(scene, mode);
  const visibleCanvasLiveTableEvents = useMemo(() => getVisibleCanvasLiveTableEvents(liveTableEvents, mode), [liveTableEvents, mode]);
  const effectiveSelectedTokenIds = useMemo(() => getSelectedItemIdList(selectedTokenId, selectedTokenIds), [selectedTokenId, selectedTokenIds]);
  const turnOrderTokenIndicators = useMemo(() => (scene && mode === "gm" ? getTurnOrderTokenIndicators(scene) : null), [mode, scene]);
  const effectiveSelectedDrawingIds = useMemo(() => getSelectedItemIdList(selectedDrawingId, selectedDrawingIds), [selectedDrawingId, selectedDrawingIds]);
  const effectiveSelectedFogShapeIds = useMemo(() => getSelectedItemIdList(selectedFogShapeId, selectedFogShapeIds), [selectedFogShapeId, selectedFogShapeIds]);
  const effectiveSelectedWeatherMaskIds = useMemo(() => getSelectedItemIdList(selectedWeatherMaskId, selectedWeatherMaskIds), [selectedWeatherMaskId, selectedWeatherMaskIds]);
  const sceneSelectionAnimating = useMemo(
    () =>
      shouldAnimateSceneSelection(mode, {
        drawingIds: effectiveSelectedDrawingIds,
        fogShapeIds: effectiveSelectedFogShapeIds,
        tokenIds: effectiveSelectedTokenIds,
        weatherMaskIds: effectiveSelectedWeatherMaskIds
      }),
    [effectiveSelectedDrawingIds, effectiveSelectedFogShapeIds, effectiveSelectedTokenIds, effectiveSelectedWeatherMaskIds, mode]
  );
  const authoringToolActive = useMemo(
    () => hasAuthoringToolActive({ canvasTool, drawingTool, fogTool, weatherMaskTool, environmentEffectTool }),
    [canvasTool, drawingTool, environmentEffectTool, fogTool, weatherMaskTool]
  );
  const currentEnvironmentEffectTuning = useMemo<Partial<EnvironmentEffectMask>>(
    () => ({
      acidTuning: acidEffectTuning,
      coldTuning: coldEffectTuning,
      darknessTuning: darknessEffectTuning,
      poisonTuning: poisonEffectTuning,
      waterTuning: waterEffectTuning,
      lavaTuning: lavaEffectTuning,
      fireTuning: fireEffectTuning,
      lightningTuning: lightningEffectTuning,
      arcaneTuning: arcaneEffectTuning,
      chaosTuning: chaosEffectTuning,
      voidTuning: voidEffectTuning,
      natureTuning: natureEffectTuning,
      distortionTuning: distortionEffectTuning,
      radiantTuning: radiantEffectTuning,
      fieldTuning: forceFieldEffectTuning,
      shockwaveTuning: shockwaveEffectTuning,
      smokeTuning: smokeEffectTuning,
      fogTuning: fogEffectTuning
    }),
    [
      acidEffectTuning,
      arcaneEffectTuning,
      chaosEffectTuning,
      coldEffectTuning,
      darknessEffectTuning,
      distortionEffectTuning,
      fireEffectTuning,
      fogEffectTuning,
      forceFieldEffectTuning,
      lavaEffectTuning,
      lightningEffectTuning,
      natureEffectTuning,
      poisonEffectTuning,
      radiantEffectTuning,
      shockwaveEffectTuning,
      smokeEffectTuning,
      voidEffectTuning,
      waterEffectTuning
    ]
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
  const mapOverlayActive = isMapOverlayActive(canShowMap, Boolean(mapAsset), mapLoadStatus);
  const playerDisplayScale = getPlayerDisplayScale(campaign, scene, mode);
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

  const tokensReady = areTokenImagesReady(canShowTokens, tokenImageSourceKey, loadedTokenImages, failedTokenImageIds);
  const mapReady = isMapReady(canShowMap, Boolean(mapAsset), mapLoadStatus);

  const getCurrentReadyMapSourceForFit = useCallback((): ReadyMapSource | null => {
    if (!mapAsset || !canShowMap) {
      return null;
    }
    const activeVideo = isVideoMap ? (videoRefs.current[activeVideoIndex] ?? null) : null;
    return getReadyMapSourceForFit(loadedMap, mapAsset.id, activeVideo, isVideoMap);
  }, [activeVideoIndex, canShowMap, isVideoMap, loadedMap, mapAsset, videoRefs]);

  const fitGmCameraToReadyMap = useCallback(
    (viewportWidth: number, viewportHeight: number, force = false): boolean => {
      if (mode !== "gm" || !scene || !mapAsset || viewportWidth <= 0 || viewportHeight <= 0) {
        return false;
      }

      const fitSignature = `${scene.id}:${mapAsset.id}`;
      if (!force && fittedSceneCameraRef.current === fitSignature) {
        return false;
      }

      const mapSource = getCurrentReadyMapSourceForFit();
      if (!mapSource) {
        return false;
      }

      fittedSceneCameraRef.current = fitSignature;
      const nextCamera = getCameraForMapFit(scene, mapSource.width, mapSource.height, viewportWidth, viewportHeight);
      setCamera((currentCamera) => (areCamerasEqual(currentCamera, nextCamera) ? currentCamera : nextCamera));
      return true;
    },
    [getCurrentReadyMapSourceForFit, mapAsset, mode, scene]
  );

  useEffect(() => {
    if (scene && mapReady && tokensReady) {
      // Player scene transitions wait for map/token assets so the splash does not reveal half-loaded content.
      onReady?.();
    }
  }, [mapReady, onReady, scene, tokensReady]);

  useEffect(() => {
    autoFitCameraRef.current = true;
    fittedSceneCameraRef.current = null;
  }, [mapAsset?.id, mode, scene?.id]);

  useEffect(() => {
    if (mode !== "gm" || !scene) {
      return;
    }

    const fitSignature = `${scene.id}:${mapAsset?.id ?? "no-map"}`;
    if (fittedSceneCameraRef.current === fitSignature) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    if (!canShowMap || !mapAsset) {
      fittedSceneCameraRef.current = fitSignature;
      setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }

    fitGmCameraToReadyMap(rect.width, rect.height);
  }, [canShowMap, fitGmCameraToReadyMap, mapAsset, mode, scene]);

  useEffect(() => {
    if (!onMapCalibrationBox) {
      setMapCalibrationDraftBox(null);
      mapCalibrationDragRef.current = null;
      setMapCalibrationDrag(null);
    }
  }, [onMapCalibrationBox]);

  useEffect(() => {
    clearScenePolygonDraft({ ref: polygonDraftRef, setDraft: setPolygonDraft });
    clearScenePolygonDraft({ ref: drawingPolygonDraftRef, setDraft: setDrawingPolygonDraft });
    clearScenePolygonDraft({ ref: weatherPolygonDraftRef, setDraft: setWeatherPolygonDraft });
    clearScenePolygonDraft({ ref: environmentPolygonDraftRef, setDraft: setEnvironmentPolygonDraft });
    clearFogPreview();
    clearDrawingPreview();
    setBrushHoverPoint(null);
    setSnapPoint(null);
    setSceneItemHover(false);
  }, [clearDrawingPreview, clearFogPreview, drawingPolygonDraftRef, environmentPolygonDraftRef, fogTool, polygonDraftRef, scene?.id, weatherPolygonDraftRef]);

  useEffect(() => {
    clearDrawingPreview();
    setBrushHoverPoint(null);
    setSnapPoint(null);
  }, [clearDrawingPreview, drawingTool, scene?.id]);

  useEffect(() => {
    if (rulerDragRef.current) {
      onLiveTableEvent?.({
        id: "ruler-clear",
        type: "ruler-clear",
        createdAt: Date.now()
      });
    }
    setRulerDrag(null);
    if (releasedRulerTimeoutRef.current !== null) {
      window.clearTimeout(releasedRulerTimeoutRef.current);
      releasedRulerTimeoutRef.current = null;
    }
    setReleasedRulerDrag(null);
    rulerDragRef.current = null;
    laserDragRef.current = null;
  }, [canvasTool, onLiveTableEvent, scene?.id]);

  useEffect(() => {
    tokenDragRef.current = null;
    setTokenDragPreview(null);
    dragRef.current = null;
    clearWeatherMaskPreview();
    clearEnvironmentEffectPreview();
    cancelWeatherMaskMove();
    cancelEnvironmentEffectMove();
    setIsPanning(false);
    selectionDragRef.current = null;
    setSelectionDrag(null);
    setSnapPoint(null);
    setBrushHoverPoint(null);
  }, [cancelEnvironmentEffectMove, cancelWeatherMaskMove, clearEnvironmentEffectPreview, clearWeatherMaskPreview, mode, scene?.id]);

  useEffect(() => {
    clearWeatherMaskPreview();
    clearScenePolygonDraft({ ref: weatherPolygonDraftRef, setDraft: setWeatherPolygonDraft });
  }, [clearWeatherMaskPreview, scene?.id, weatherMaskTool, weatherPolygonDraftRef]);

  useEffect(() => {
    clearEnvironmentEffectPreview();
    clearScenePolygonDraft({ ref: environmentPolygonDraftRef, setDraft: setEnvironmentPolygonDraft });
  }, [clearEnvironmentEffectPreview, environmentEffectTool, environmentPolygonDraftRef, scene?.id]);

  const sceneInteractionCancelable = hasCancelableSceneInteraction({
    tokenDragPreview,
    drawingDragPreview,
    weatherMaskMovePreview,
    environmentEffectMovePreview,
    rulerDrag,
    fogPreview,
    drawingPreview,
    environmentEffectPreview
  });
  const cancelSceneInteractionOnEscape = useCallback((event: KeyboardEvent) => {
    cancelSceneInteractionsForKeyboardEvent(event, {
      cancelTokenDrag,
      cancelDrawingDrag,
      cancelWeatherMaskMove,
      cancelEnvironmentEffectMove,
      cancelRulerDrag,
      clearFogPreview,
      clearEnvironmentEffectPreview,
      clearDrawingPreview
    });
  }, [cancelDrawingDrag, cancelEnvironmentEffectMove, cancelRulerDrag, cancelTokenDrag, cancelWeatherMaskMove, clearDrawingPreview, clearEnvironmentEffectPreview, clearFogPreview]);
  useWindowKeyDown(mode === "gm" && sceneInteractionCancelable, cancelSceneInteractionOnEscape);

  const appendTokenWaypointOnShift = useCallback((event: KeyboardEvent) => {
    if (!scene) {
      return;
    }
    const update = getTokenWaypointAppendKeyboardUpdate(scene, tokenDragRef.current, tokenDragPreview, event);
    if (!update) {
      return;
    }

    event.preventDefault();
    tokenDragRef.current = update.drag;
    setTokenDragPreview(update.preview);
  }, [scene, tokenDragPreview]);
  useWindowKeyDown(mode === "gm" && Boolean(scene && tokenDragPreview), appendTokenWaypointOnShift);

  const appendRulerWaypointOnShift = useCallback((event: KeyboardEvent) => {
    if (!scene) {
      return;
    }
    const nextRulerDrag = getRulerWaypointAppendKeyboardUpdate(scene, rulerDragRef.current, event);
    if (!nextRulerDrag) {
      return;
    }

    event.preventDefault();
    rulerDragRef.current = nextRulerDrag;
    setRulerDrag(nextRulerDrag);
    emitRulerEvent(nextRulerDrag);
  }, [emitRulerEvent, scene]);
  useWindowKeyDown(mode === "gm" && Boolean(scene && rulerDrag), appendRulerWaypointOnShift);

  useEffect(() => {
    setVideoMapLoadStatus(isVideoMap ? getInitialMapLoadStatus(mapAsset?.mediaType, assetUrl) : "idle");
  }, [assetUrl, isVideoMap, mapAsset?.id, mapAsset?.mediaType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scene) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      // Canvas pixels are scaled for crisp rendering while drawScene still receives CSS-pixel dimensions.
      canvas.width = Math.max(1, Math.floor(rect.width * scale));
      canvas.height = Math.max(1, Math.floor(rect.height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      if (autoFitCameraRef.current) {
        fitGmCameraToReadyMap(rect.width, rect.height, true);
      }
      drawScene(context, rect.width, rect.height);
    };

    const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      if (!isVideoMap) {
        ctx.fillStyle = scene.playerView.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      const activeVideo = isVideoMap ? (videoRefs.current[activeVideoIndex] ?? null) : null;
      const {
        mapDrawSource,
        renderCamera,
        showGrid,
        weatherMapReady,
        weatherMapSource
      } = getSceneCanvasRenderPlan({
        activeVideo,
        camera,
        canShowGrid,
        canShowMap,
        height,
        loadedMap,
        mapAsset,
        mode,
        outputPixelRatio: window.devicePixelRatio || 1,
        playerDisplayScale,
        scene,
        width
      });

      ctx.save();
      // Player Display Scale modifies Player View zoom only; GM camera controls stay scene-local.
      ctx.translate(renderCamera.x, renderCamera.y);
      ctx.scale(renderCamera.zoom, renderCamera.zoom);

      if (mapCanvasBackgroundPlan === "image-map" && loadedMap?.ready) {
        ctx.globalAlpha = mapLayer?.opacity ?? 1;
        try {
          drawMapSource(ctx, mapDrawSource ?? loadedMap.originalSource, scene, width, height, loadedMap.sourceWidth, loadedMap.sourceHeight);
        } catch {
          // Keep the canvas pass resilient if an image asset is temporarily unavailable.
        }
        ctx.globalAlpha = 1;
      } else if (mapCanvasBackgroundPlan === "empty-map-prompt") {
        const visibleLeft = -renderCamera.x / renderCamera.zoom;
        const visibleTop = -renderCamera.y / renderCamera.zoom;
        const visibleWidth = width / renderCamera.zoom;
        const visibleHeight = height / renderCamera.zoom;
        ctx.fillStyle = "#111720";
        ctx.fillRect(visibleLeft, visibleTop, visibleWidth, visibleHeight);
        ctx.fillStyle = "#8792a2";
        ctx.font = "24px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Import a map to begin", visibleLeft + visibleWidth / 2, visibleTop + visibleHeight / 2);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      } else if (mapCanvasBackgroundPlan === "fallback-fill") {
        ctx.fillStyle = "#111720";
        ctx.fillRect(0, 0, 1600, 1000);
      }

      if (showGrid && scene.grid.type === "square") {
        drawSquareGrid(ctx, scene, width, height, renderCamera, mode);
      } else if (showGrid && scene.grid.type === "hex") {
        drawHexGrid(ctx, scene, width, height, renderCamera, mode);
      }

      if (mode === "gm" && tokenDragPreview) {
        drawTokenDragHighlights(ctx, scene, tokenDragPreview, renderCamera.zoom);
      }

      const now = Date.now();
      if (canShowTokens) {
        drawTokens(ctx, scene, loadedTokenImages, mode, effectiveSelectedTokenIds, tokenDragPreview, playerTokenTweenPositionsRef.current, renderCamera.zoom, turnOrderTokenIndicators, now);
      }

      if (canShowDrawings) {
        const drawingPolygonPreview = getDrawingPolygonDraftPreview(drawingPolygonDraft, {
          color: drawingColor,
          opacity: drawingOpacity,
          fillColor: drawingFillColor,
          fillOpacity: drawingFillOpacity,
          strokeStyle: drawingStrokeStyle,
          strokeWidth: drawingStrokeWidth
        });
        drawDrawings(
          ctx,
          scene,
          mode,
          drawingLayer?.opacity ?? 1,
          mode === "gm" ? (drawingPreview ?? drawingPolygonPreview) : null,
          renderCamera.zoom,
          effectiveSelectedDrawingIds,
          drawingDragPreview,
          drawingRotateRef.current ? drawingRotateRef.current.groupStartPoints : drawingDragPreview
        );
      }

      const visibleGmRuler = rulerDrag ?? releasedRulerDrag;
      if (mode === "gm" && visibleGmRuler) {
        drawRuler(ctx, visibleGmRuler, getRulerLabel(visibleGmRuler, scene), scene.grid, renderCamera.zoom);
      }

      ctx.restore();

      if (canShowFog) {
        // Fog is drawn after world content so hidden/partial modes mask maps, tokens, grid, and ruler consistently.
        drawFog(ctx, scene, width, height, renderCamera, mode, fogPreview, polygonDraft, effectiveSelectedFogShapeIds);
      }
      if (canShowWeather && !mapOverlayActive) {
        if (weatherMapReady) {
          drawWeather(ctx, scene, width, height, renderCamera, now, weatherLayer?.opacity ?? 1, weatherMapSource);
        }
        drawEnvironmentEffects(ctx, effectRenderState.environmentEffects, renderCamera, mode, now, weatherLayer?.opacity ?? 1, acidEffectTuning, coldEffectTuning, darknessEffectTuning, poisonEffectTuning, waterEffectTuning, lavaEffectTuning, fireEffectTuning, lightningEffectTuning, arcaneEffectTuning, chaosEffectTuning, voidEffectTuning, natureEffectTuning, distortionEffectTuning, radiantEffectTuning, forceFieldEffectTuning, shockwaveEffectTuning, smokeEffectTuning, fogEffectTuning);
      }
      if (mode === "gm") {
        drawWeatherMaskOutlines(ctx, effectRenderState.weatherMasks, renderCamera);
      }
      if (mode === "gm" && weatherMaskPreview) {
        drawWeatherMaskPreview(ctx, weatherMaskPreview, renderCamera);
      }
      if (mode === "gm" && environmentEffectPreview) {
        drawEnvironmentEffectPreview(ctx, environmentEffectPreview, renderCamera);
      }
      if (mode === "gm" && weatherMaskTool === "polygon" && weatherPolygonDraft) {
        drawWeatherPolygonDraft(ctx, weatherPolygonDraft, renderCamera);
      }
      if (mode === "gm" && environmentEffectTool === "polygon" && environmentPolygonDraft) {
        drawWeatherPolygonDraft(ctx, environmentPolygonDraft, renderCamera);
      }
      if (mode === "gm") {
        for (const selectedWeatherMask of effectRenderState.selectedWeatherMasks) {
          drawWeatherMaskSelection(ctx, selectedWeatherMask, renderCamera);
        }
        if (effectRenderState.selectedEnvironmentEffect) {
          drawEnvironmentEffectShape(ctx, effectRenderState.selectedEnvironmentEffect, renderCamera, { fill: false, selected: true });
        }
      }
      if (mode === "gm" && brushHoverPoint && fogTool?.includes("brush") && !fogPreview) {
        drawBrushHoverPreview(ctx, brushHoverPoint, Math.max(4, activeFogBrushSize / 2), renderCamera, getFogOperationForTool(fogTool));
      }
      if (mode === "gm" && brushHoverPoint && drawingTool === "freehand" && !drawingPreview) {
        drawDrawingBrushHoverPreview(ctx, brushHoverPoint, Math.max(4, drawingStrokeWidth / 2), renderCamera, drawingColor, drawingOpacity);
      }
      for (const snapMarkerOperation of getSceneSnapMarkerOperations({
        mode,
        hasSnapPoint: Boolean(snapPoint),
        fogOperation: fogTool && !fogTool.includes("brush") ? getFogOperationForTool(fogTool) : null,
        drawingTool,
        drawingDragActive: Boolean(drawingDragPreview && drawingDragRef.current),
        weatherMaskTool,
        weatherMaskMoveActive: Boolean(weatherMaskMovePreview && weatherMaskMoveRef.current),
        environmentEffectTool,
        environmentEffectMoveActive: Boolean(environmentEffectMovePreview && environmentEffectMoveRef.current)
      })) {
        if (snapPoint) {
          drawSnapMarker(ctx, snapPoint, renderCamera, snapMarkerOperation);
        }
      }
      if (mode === "gm" && (onMapCalibrationBox || mapCalibrationBox)) {
        drawMapCalibrationBox(ctx, getVisibleMapCalibrationBox(mapCalibrationDrag, mapCalibrationDraftBox ?? mapCalibrationBox), renderCamera);
      }
      if (mode === "gm" && selectionDrag) {
        drawSelectionMarquee(ctx, selectionDrag, renderCamera);
      }
      if (mode === "gm" && canShowDrawings && !drawingDragPreview && effectiveSelectedDrawingIds.length > 0) {
        drawDrawingResizeHandles(ctx, scene.drawings, effectiveSelectedDrawingIds, renderCamera);
      }
      if (visibleCanvasLiveTableEvents.length > 0) {
        drawLiveTableEvents(ctx, visibleCanvasLiveTableEvents, renderCamera, scene.grid);
      }
    };

    let animationFrame = 0;
    let lastWeatherOnlyFrameAt = 0;
    const getAnimationSources = (): CanvasAnimationSources => ({
      mapAnimating: Boolean(loadedMap?.animate),
      tokenAnimating: Boolean(playerTokenTweenPositionsRef.current),
      tokenConditionAnimating: Boolean(canShowTokens && hasVisibleTokenConditions(scene, mode)),
      tableEventsAnimating: hasActiveLiveTableEvents(liveTableEvents),
      weatherAnimating: shouldAnimateWeather(scene, Boolean(canShowWeather)),
      environmentAnimating: shouldAnimateEnvironmentEffects(scene, mode, Boolean(canShowWeather)),
      selectionAnimating: sceneSelectionAnimating
    });
    const drawCurrentFrame = (timestamp: number) => {
      const animationPlan = getCanvasAnimationFramePlan(getAnimationSources(), timestamp, lastWeatherOnlyFrameAt, WEATHER_ONLY_FRAME_INTERVAL_MS);

      if (animationPlan.shouldDrawFrame) {
        const rect = canvas.getBoundingClientRect();
        drawScene(context, rect.width, rect.height);
        if (animationPlan.shouldUpdateEffectOnlyFrameAt) {
          lastWeatherOnlyFrameAt = timestamp;
        }
      }

      if (animationPlan.shouldRequestNextFrame) {
        animationFrame = window.requestAnimationFrame(drawCurrentFrame);
      }
    };

    resize();
    if (hasCanvasAnimationSources(getAnimationSources())) {
      animationFrame = window.requestAnimationFrame(drawCurrentFrame);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [acidEffectTuning, activeFogBrushSize, activeTableTools, activeVideoIndex, arcaneEffectTuning, brushHoverPoint, camera, canShowDrawings, canShowFog, canShowGrid, canShowMap, canShowTokens, canShowWeather, chaosEffectTuning, coldEffectTuning, darknessEffectTuning, distortionEffectTuning, drawingColor, drawingDragPreview, drawingFillColor, drawingFillOpacity, drawingLayer?.opacity, drawingOpacity, drawingPolygonDraft, drawingPreview, drawingStrokeStyle, drawingStrokeWidth, drawingTemplateEffect, drawingTemplateWidth, drawingTool, effectRenderState, effectiveSelectedDrawingIds, effectiveSelectedFogShapeIds, effectiveSelectedTokenIds, effectiveSelectedWeatherMaskIds, environmentEffectFeather, environmentEffectMovePreview, environmentEffectPreview, environmentEffectTool, environmentPolygonDraft, fireEffectTuning, fitGmCameraToReadyMap, fogEffectTuning, fogPreview, fogTool, forceFieldEffectTuning, isVideoMap, lavaEffectTuning, lightningEffectTuning, liveTableEvents, loadedMap, loadedTokenImages, mapAsset, mapCalibrationBox, mapCalibrationDraftBox, mapCalibrationDrag, mapCanvasBackgroundPlan, mapLayer?.opacity, mapOverlayActive, mode, natureEffectTuning, onMapCalibrationBox, playerDisplayScale, playerTokenTweenPositions, playerTokenTweenPositionsRef, poisonEffectTuning, polygonDraft, radiantEffectTuning, releasedRulerDrag, rulerDrag, scene, sceneSelectionAnimating, selectedDrawingId, selectedDrawingIds, selectedTokenId, selectionDrag, shockwaveEffectTuning, smokeEffectTuning, snapPoint, tokenDragPreview, turnOrderTokenIndicators, videoRefs, visibleCanvasLiveTableEvents, voidEffectTuning, waterEffectTuning, weatherLayer?.opacity, weatherMaskMovePreview, weatherMaskPreview, weatherMaskTool, weatherPolygonDraft]);

  useEffect(() => {
    return retainEnvironmentEffectRuntimes();
  }, []);

  useEffect(() => {
    if (mode !== "gm" || !scene || !onViewportCenterChange) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const reportCenter = () => {
      onViewportCenterChange(getCanvasViewportCenter(canvas, getRenderCamera(camera, playerDisplayScale)));
    };

    reportCenter();
    const observer = new ResizeObserver(reportCenter);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [camera, mode, onViewportCenterChange, playerDisplayScale, scene]);

  const selectFromMarquee = (currentScene: Scene, drag: SelectionDrag) => {
    const selection = getCompletedSceneMarqueeSelection(currentScene, drag, selectorSelectionFilters, {
      tokens: Boolean(canShowTokens),
      drawings: Boolean(canShowDrawings)
    });
    if (!selection) {
      return;
    }
    onSelectSceneItems?.({ ...selection, mode: drag.mode });
  };

  const clearSceneSelectionsExcept = (activeKind: SceneSelectionTargetKind) => {
    for (const kind of getSceneSelectionKindsToClear(activeKind)) {
      if (kind === "token") {
        onSelectToken?.(null);
      } else if (kind === "drawing") {
        onSelectDrawing?.(null);
      } else if (kind === "fogShape") {
        onSelectFogShape?.(null);
      } else if (kind === "weatherMask") {
        onSelectWeatherMask?.(null);
      } else if (kind === "environmentEffect") {
        onSelectEnvironmentEffect?.(null);
      }
    }
  };

  const onWheel = useCallback((event: WheelEvent) => {
    if (!interactive) {
      return;
    }
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    autoFitCameraRef.current = false;
    setCamera((currentCamera) => getCameraForWheelZoom({ camera: currentCamera, mouseX, mouseY, deltaY: event.deltaY }));
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    setTokenContextMenu(null);
    setMaskContextMenu(null);
    setDrawingContextMenu(null);
    setEnvironmentEffectContextMenu(null);
    if (!interactive) {
      return;
    }
    const pointerDownRoute = getScenePointerDownRoute({
      authoringToolActive,
      button: event.button,
      canvasTool,
      drawingTool,
      environmentEffectTool,
      fogTool,
      hasMapCalibrationTool: Boolean(onMapCalibrationBox),
      hasScene: Boolean(scene),
      mode,
      mouseBehavior,
      onSceneChangeAvailable: Boolean(onSceneChange),
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      weatherMaskTool
    });
    if (pointerDownRoute === "pan") {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera };
      setIsPanning(true);
      return;
    }
    if (pointerDownRoute === "ignore-ping") {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointerDownRoute === "map-calibration") {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const drag = getMapCalibrationPointerStart({
        button: event.button,
        camera: getRenderCamera(camera, playerDisplayScale),
        draftBox: mapCalibrationDraftBox,
        existingBox: mapCalibrationBox ?? null,
        hasScene: Boolean(scene),
        mode,
        point,
        pointerId: event.pointerId,
        toolActive: Boolean(onMapCalibrationBox)
      });
      if (!drag) {
        return;
      }
      mapCalibrationDragRef.current = drag;
      setMapCalibrationDrag(drag);
      return;
    }
    if (pointerDownRoute === "ruler") {
      const point = getRulerPoint(event);
      const nextRulerDrag = getRulerPointerStart({
        button: event.button,
        canvasTool,
        hasScene: Boolean(scene),
        mode,
        point,
        pointerId: event.pointerId
      });
      if (!nextRulerDrag) {
        return;
      }
      if (releasedRulerTimeoutRef.current !== null) {
        window.clearTimeout(releasedRulerTimeoutRef.current);
        releasedRulerTimeoutRef.current = null;
      }
      setReleasedRulerDrag(null);
      rulerDragRef.current = nextRulerDrag;
      setRulerDrag(nextRulerDrag);
      emitRulerEvent(nextRulerDrag);
      return;
    }
    if (pointerDownRoute === "laser") {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const start = getLaserPointerStart({
        button: event.button,
        canvasTool,
        eventId: crypto.randomUUID(),
        hasScene: Boolean(scene),
        mode,
        point,
        pointerId: event.pointerId,
        settings: activeTableTools,
        visibleInPlayer: tableToolsVisibleInPlayer
      });
      if (!start) {
        return;
      }
      const { drag, event: laserEvent } = start;
      laserDragRef.current = drag;
      onLiveTableEvent?.(laserEvent);
      return;
    }
    if (pointerDownRoute === "drawing-polygon") {
      const activeDrawingTool = drawingTool!;
      updateDrawingPolygonDraft(getDrawingToolPoint(event, activeDrawingTool));
      return;
    }
    if (pointerDownRoute === "drawing") {
      const activeDrawingTool = drawingTool!;
      const point = getDrawingToolPoint(event, activeDrawingTool);
      const preview = getDrawingPointerStart({
        button: event.button,
        hasScene: Boolean(scene),
        mode,
        onSceneChangeAvailable: Boolean(onSceneChange),
        point,
        pointerId: event.pointerId,
        style: {
          color: drawingColor,
          opacity: drawingOpacity,
          fillColor: drawingFillColor,
          fillOpacity: drawingFillOpacity,
          strokeStyle: drawingStrokeStyle,
          strokeWidth: drawingStrokeWidth,
          templateEffect: drawingTemplateEffect,
          templateWidth: drawingTemplateWidth
        },
        tool: activeDrawingTool
      });
      if (!preview) {
        return;
      }
      drawingPreviewRef.current = preview;
      setDrawingPreview(preview);
      onTemplatePreviewChange?.(getTemplatePreviewDrawing(preview));
      return;
    }
    if (pointerDownRoute === "fog") {
      const activeFogTool = fogTool!;
      const point = getToolPoint(event, !activeFogTool.includes("brush"));
      const start = getFogPointerStart({
        brushSize: activeFogBrushSize,
        button: event.button,
        hasScene: Boolean(scene),
        mode,
        onSceneChangeAvailable: Boolean(onSceneChange),
        point,
        pointerId: event.pointerId,
        tool: activeFogTool
      });
      if (!start) {
        return;
      }
      if (start.kind === "polygon") {
        updatePolygonDraft(start.tool, start.point);
        return;
      }
      fogDragRef.current = start.drag;
      setFogPreview(start.drag);
      return;
    }
    if (pointerDownRoute === "weather-mask") {
      const activeWeatherMaskTool = weatherMaskTool!;
      const point = getToolPoint(event);
      const start = getWeatherMaskPointerStart({
        button: event.button,
        hasScene: Boolean(scene),
        mode,
        onSceneChangeAvailable: Boolean(onSceneChange),
        point,
        pointerId: event.pointerId,
        tool: activeWeatherMaskTool
      });
      if (!start) {
        return;
      }
      if (start.kind === "polygon") {
        updateWeatherPolygonDraft(start.point);
        return;
      }
      clearScenePolygonDraft({ ref: weatherPolygonDraftRef, setDraft: setWeatherPolygonDraft });
      weatherMaskDragRef.current = start.drag;
      setWeatherMaskPreview(start.drag);
      return;
    }
    if (pointerDownRoute === "environment-effect") {
      const activeEnvironmentEffectTool = environmentEffectTool!;
      const point = getToolPoint(event);
      const start = getEnvironmentEffectPointerStart({
        button: event.button,
        effect: environmentEffectType,
        fallbackTuning: currentEnvironmentEffectTuning,
        feather: environmentEffectFeather,
        hasScene: Boolean(scene),
        mode,
        onSceneChangeAvailable: Boolean(onSceneChange),
        point,
        pointerId: event.pointerId,
        tool: activeEnvironmentEffectTool
      });
      if (!start) {
        return;
      }
      if (start.kind === "polygon") {
        updateEnvironmentPolygonDraft(start.point);
        return;
      }
      clearScenePolygonDraft({ ref: environmentPolygonDraftRef, setDraft: setEnvironmentPolygonDraft });
      environmentEffectDragRef.current = start.drag;
      setEnvironmentEffectPreview(start.drag);
      return;
    }
    if (pointerDownRoute === "marquee-additive") {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const selectionMode: SelectionMode = getMarqueeSelectionMode(event);
      const nextSelectionDrag = getSelectionDragFromPoint(event.pointerId, point, selectionMode);
      selectionDragRef.current = nextSelectionDrag;
      setSelectionDrag(nextSelectionDrag);
      return;
    }
    if (pointerDownRoute === "selector") {
      const activeScene = scene!;
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const tokenPointerStart = getTokenPointerStart({
        canShowTokens: Boolean(canShowTokens),
        mouseBehavior,
        point,
        pointerId: event.pointerId,
        scene: activeScene,
        selectedTokenIds: effectiveSelectedTokenIds
      });
      if (tokenPointerStart) {
        if (tokenPointerStart.dragGroup.shouldSelectHitItem) {
          onSelectToken?.(tokenPointerStart.token.id);
        }
        clearSceneSelectionsExcept("token");
        if (tokenPointerStart.dragStart) {
          tokenDragRef.current = tokenPointerStart.dragStart.drag;
          setTokenDragPreview(tokenPointerStart.dragStart.preview);
        }
        return;
      }
      onSelectToken?.(null);
      if (!authoringToolActive) {
        const drawingTransformStart = getDrawingTransformPointerStart({
          authoringToolActive,
          camera: getRenderCamera(camera, playerDisplayScale),
          canShowDrawings: Boolean(canShowDrawings),
          mouseBehavior,
          point,
          pointerId: event.pointerId,
          scene: activeScene,
          selectedDrawingIds: effectiveSelectedDrawingIds
        });
        if (drawingTransformStart?.kind === "transform") {
          if (drawingTransformStart.transformKind === "rotate") {
            drawingRotateRef.current = drawingTransformStart.state;
          } else {
            drawingResizeRef.current = drawingTransformStart.state;
          }
          setDrawingDragPreview(drawingTransformStart.preview);
          return;
        }
        if (drawingTransformStart?.kind === "hit") {
          if (drawingTransformStart.dragGroup.shouldSelectHitItem) {
            onSelectDrawing?.(drawingTransformStart.drawingId);
          }
          clearSceneSelectionsExcept("drawing");
          if (drawingTransformStart.dragStart) {
            drawingDragRef.current = drawingTransformStart.dragStart;
            setDrawingDragPreview(drawingTransformStart.preview);
          }
          return;
        }
        const environmentEffectStart = getEnvironmentEffectHitPointerStart({
          mouseBehavior,
          point,
          pointerId: event.pointerId,
          scene: activeScene
        });
        if (environmentEffectStart) {
          onSelectEnvironmentEffect?.(environmentEffectStart.effectId);
          clearSceneSelectionsExcept("environmentEffect");
          if (environmentEffectStart.moveStart) {
            environmentEffectMoveRef.current = environmentEffectStart.moveStart;
            setEnvironmentEffectMovePreview(environmentEffectStart.preview);
          }
          return;
        }
        const maskStart = getMaskPointerStart({
          mouseBehavior,
          point,
          pointerId: event.pointerId,
          scene: activeScene,
          selectedWeatherMaskIds: effectiveSelectedWeatherMaskIds
        });
        if (maskStart?.kind === "weather") {
          onSelectWeatherMask?.(maskStart.maskId);
          clearSceneSelectionsExcept("weatherMask");
          if (maskStart.moveStart) {
            weatherMaskMoveRef.current = maskStart.moveStart;
            setWeatherMaskMovePreview(maskStart.preview);
          }
          return;
        }
        if (maskStart?.kind === "fog") {
          onSelectFogShape?.(maskStart.shapeId);
          clearSceneSelectionsExcept("fogShape");
          return;
        }
        clearSceneSelectionsExcept("empty");
      }
    }
    if (pointerDownRoute === "marquee") {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const selectionMode: SelectionMode = getMarqueeSelectionMode(event);
      const nextSelectionDrag = getSelectionDragFromPoint(event.pointerId, point, selectionMode);
      selectionDragRef.current = nextSelectionDrag;
      setSelectionDrag(nextSelectionDrag);
      return;
    }
    if (pointerDownRoute === "none") {
      return;
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const tokenDrag = tokenDragRef.current;
    const drawingDragValue = drawingDragRef.current;
    const drawingResizeValue = drawingResizeRef.current;
    const drawingRotateValue = drawingRotateRef.current;
    const weatherMaskMoveValue = weatherMaskMoveRef.current;
    const environmentEffectMoveValue = environmentEffectMoveRef.current;
    const laserDrag = laserDragRef.current;
    const drawingDrag = drawingPreviewRef.current;
    const rulerDragValue = rulerDragRef.current;
    const selectionDragValue = selectionDragRef.current;
    const mapCalibrationDragValue = mapCalibrationDragRef.current;
    if (mapCalibrationDragValue?.pointerId === event.pointerId) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const update = getMapCalibrationPointerMove(mapCalibrationDragValue, event.pointerId, point);
      if (update) {
        mapCalibrationDragRef.current = update.drag;
        setMapCalibrationDrag(update.drag);
        setMapCalibrationDraftBox(update.draftBox);
      }
      return;
    }
    if (laserDrag?.pointerId === event.pointerId) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const nextLaserDrag = getLaserPointerMove(laserDrag, event.pointerId, point, Date.now());
      if (nextLaserDrag) {
        laserDragRef.current = nextLaserDrag;
        onLiveTableEvent?.(createLaserLiveTableEvent(laserDrag.eventId, nextLaserDrag.points, activeTableTools, tableToolsVisibleInPlayer));
      }
      return;
    }
    if (rulerDragValue?.pointerId === event.pointerId) {
      const nextRulerDrag = getUpdatedRulerPointerDrag(rulerDragValue, event.pointerId, getRulerPoint(event));
      if (!nextRulerDrag) {
        return;
      }
      rulerDragRef.current = nextRulerDrag;
      setRulerDrag(nextRulerDrag);
      emitRulerEvent(nextRulerDrag);
      return;
    }

    if (selectionDragValue?.pointerId === event.pointerId) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const nextSelectionDrag = getUpdatedSelectionDrag(selectionDragValue, point);
      selectionDragRef.current = nextSelectionDrag;
      setSelectionDrag(nextSelectionDrag);
      return;
    }

    if (drawingDrag?.pointerId === event.pointerId) {
      const point = getDrawingToolPoint(event, drawingDrag.kind);
      const nextDrawingDrag = getDrawingPointerMove(drawingDrag, event.pointerId, point, scene, drawingTemplateSize, event.shiftKey);
      if (!nextDrawingDrag) {
        return;
      }
      drawingPreviewRef.current = nextDrawingDrag;
      setDrawingPreview(nextDrawingDrag);
      onTemplatePreviewChange?.(getTemplatePreviewDrawing(nextDrawingDrag));
      return;
    }

    const drawingTransformMove = getDrawingTransformPointerMove({
      dragState: drawingDragValue,
      point: eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale)),
      pointerId: event.pointerId,
      resizeState: drawingResizeValue,
      rotateState: drawingRotateValue,
      scene,
      snapEnabled: isSnapModifier(event),
      squareConstrained: event.shiftKey
    });
    if (drawingTransformMove) {
      if (drawingTransformMove.kind === "move") {
        setSnapPoint(drawingTransformMove.snapPoint);
      }
      setDrawingDragPreview(drawingTransformMove.preview);
      return;
    }

    const maskEffectMove = getMaskEffectPointerMove({
      environmentEffectMoveState: environmentEffectMoveValue,
      point: eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale)),
      pointerId: event.pointerId,
      scene,
      snapEnabled: isSnapModifier(event),
      weatherMaskMoveState: weatherMaskMoveValue
    });
    if (maskEffectMove) {
      if (maskEffectMove.kind === "environment-effect") {
        setSnapPoint(maskEffectMove.snapPoint);
        setEnvironmentEffectMovePreview(maskEffectMove.preview);
      } else {
        setWeatherMaskMovePreview(maskEffectMove.preview);
      }
      return;
    }

    if (tokenDrag?.pointerId === event.pointerId && scene) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const update = getTokenPointerMove(scene, tokenDrag, event.pointerId, point);
      if (update?.kind === "missing-token") {
        cancelTokenDrag();
        return;
      }
      if (update?.kind === "preview") {
        setTokenDragPreview(update.preview);
      }
      return;
    }

    const fogDrag = fogDragRef.current;
    if (fogDrag?.pointerId === event.pointerId) {
      const nextDrag = getFogPointerMove(fogDrag, event.pointerId, getToolPoint(event, fogDrag.kind !== "brush"), event.shiftKey);
      if (!nextDrag) {
        return;
      }
      fogDragRef.current = nextDrag;
      setFogPreview(nextDrag);
      return;
    }

    const weatherMaskDrag = weatherMaskDragRef.current;
    if (weatherMaskDrag?.pointerId === event.pointerId) {
      const nextDrag = getWeatherMaskPointerMove(weatherMaskDrag, event.pointerId, getToolPoint(event), event.shiftKey);
      if (!nextDrag) {
        return;
      }
      weatherMaskDragRef.current = nextDrag;
      setWeatherMaskPreview(nextDrag);
      return;
    }

    const environmentEffectDrag = environmentEffectDragRef.current;
    if (environmentEffectDrag?.pointerId === event.pointerId) {
      const nextDrag = getEnvironmentEffectPointerMove(environmentEffectDrag, event.pointerId, getToolPoint(event), event.shiftKey);
      if (!nextDrag) {
        return;
      }
      environmentEffectDragRef.current = nextDrag;
      setEnvironmentEffectPreview(nextDrag);
      return;
    }

    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      autoFitCameraRef.current = false;
      setCamera(getCameraForPanDrag(drag, event.clientX, event.clientY));
      return;
    }

    if (drawingTool === "polygon" && drawingPolygonDraftRef.current) {
      setDrawingPolygonDraft(updatePolygonDraftCurrent(drawingPolygonDraftRef.current, getDrawingToolPoint(event, "polygon")));
      return;
    }

    if (polygonDraftRef.current) {
      setPolygonDraft(updatePolygonDraftCurrent(polygonDraftRef.current, getToolPoint(event)));
      return;
    }

    if (weatherMaskTool === "polygon" && weatherPolygonDraftRef.current) {
      setWeatherPolygonDraft(updatePolygonDraftCurrent(weatherPolygonDraftRef.current, getToolPoint(event)));
      return;
    }

    if (environmentEffectTool === "polygon" && environmentPolygonDraftRef.current) {
      setEnvironmentPolygonDraft(updatePolygonDraftCurrent(environmentPolygonDraftRef.current, getToolPoint(event)));
      return;
    }

    if (mode === "gm" && fogTool?.includes("brush") && scene) {
      setBrushHoverPoint(getToolPoint(event, false));
      return;
    }
    if (mode === "gm" && drawingTool === "freehand" && scene) {
      setBrushHoverPoint(eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale)));
      return;
    }

    updateDrawingTransformHover(event);
    updateSceneItemHover(event);
    updateSnapPoint(event);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const pointerUpRoute = getScenePointerUpRoute({
      pointerId: event.pointerId,
      mapCalibrationDrag: mapCalibrationDragRef.current,
      drawingDrag: drawingPreviewRef.current,
      weatherMaskDrag: weatherMaskDragRef.current,
      environmentEffectDrag: environmentEffectDragRef.current,
      fogDrag: fogDragRef.current,
      rulerDrag: rulerDragRef.current,
      selectionDrag: selectionDragRef.current,
      drawingMoveDrag: drawingDragRef.current,
      drawingResizeDrag: drawingResizeRef.current,
      drawingRotateDrag: drawingRotateRef.current,
      weatherMaskMove: weatherMaskMoveRef.current,
      environmentEffectMove: environmentEffectMoveRef.current,
      laserDrag: laserDragRef.current
    });

    const mapCalibrationDragValue = mapCalibrationDragRef.current;
    if (pointerUpRoute === "map-calibration" && mapCalibrationDragValue) {
      mapCalibrationDragRef.current = null;
      setMapCalibrationDrag(null);
      const box = getMapCalibrationPointerComplete(mapCalibrationDragValue, event.pointerId, mapCalibrationDraftBox);
      if (box) {
        setMapCalibrationDraftBox(box);
      }
      return;
    }

    const drawingDrag = drawingPreviewRef.current;
    if (pointerUpRoute === "drawing" && drawingDrag) {
      clearDrawingPreview();
      if (scene && onSceneChange) {
        const drawing = getDrawingDragCommit(scene, drawingDrag, crypto.randomUUID());
        if (drawing) {
          onSceneChange(addSceneDrawing(scene, drawing));
        }
      }
      return;
    }

    const weatherMaskDrag = weatherMaskDragRef.current;
    if (pointerUpRoute === "weather-mask" && weatherMaskDrag) {
      clearWeatherMaskPreview();
      if (scene && onSceneChange) {
        const mask = getWeatherMaskDragCommit(scene, weatherMaskDrag, crypto.randomUUID());
        if (mask) {
          onSceneChange(addSceneWeatherMask(scene, mask));
        }
      }
      return;
    }

    const environmentEffectDrag = environmentEffectDragRef.current;
    if (pointerUpRoute === "environment-effect" && environmentEffectDrag) {
      clearEnvironmentEffectPreview();
      if (scene && onSceneChange) {
        const effect = getEnvironmentEffectDragCommit(scene, environmentEffectDrag, crypto.randomUUID(), currentEnvironmentEffectTuning);
        if (effect) {
          onSceneChange(addEnvironmentEffect(scene, effect));
        }
      }
      return;
    }

    const fogDrag = fogDragRef.current;
    if (pointerUpRoute === "fog" && fogDrag) {
      clearFogPreview();
      if (scene && onSceneChange) {
        const commit = getFogDragCommit(scene, fogDrag, crypto.randomUUID());
        if (commit) {
          onSceneChange(addSceneFogShape(scene, commit.shape, commit.fogPatch));
        }
      }
      return;
    }

    if (pointerUpRoute === "ruler") {
      finishRulerDrag();
      return;
    }

    if (pointerUpRoute === "selection" && selectionDragRef.current) {
      const completedSelection = selectionDragRef.current;
      selectionDragRef.current = null;
      setSelectionDrag(null);
      if (scene) {
        selectFromMarquee(scene, completedSelection);
      }
      return;
    }

    if (pointerUpRoute === "drawing-transform") {
      const drawingTransformComplete = getDrawingTransformPointerComplete({
        dragState: drawingDragRef.current,
        pointerId: event.pointerId,
        preview: drawingDragPreview,
        resizeState: drawingResizeRef.current,
        rotateState: drawingRotateRef.current
      });
      if (!drawingTransformComplete) {
        return;
      }
      if (scene && onSceneChange && drawingTransformComplete.preview) {
        onSceneChange(updateSceneDrawingPoints(scene, drawingTransformComplete.preview));
      }
      if (drawingTransformComplete.kind === "move") {
        drawingDragRef.current = null;
      } else if (drawingTransformComplete.kind === "resize") {
        drawingResizeRef.current = null;
      } else {
        drawingRotateRef.current = null;
      }
      setDrawingDragPreview(null);
      if (drawingTransformComplete.clearSnapPoint) {
        setSnapPoint(null);
      }
      return;
    }

    if (pointerUpRoute === "mask-effect") {
      const maskEffectComplete = getMaskEffectPointerComplete({
        environmentEffectMoveState: environmentEffectMoveRef.current,
        environmentEffectPreview: environmentEffectMovePreview,
        pointerId: event.pointerId,
        weatherMaskMoveState: weatherMaskMoveRef.current,
        weatherMaskPreview: weatherMaskMovePreview
      });
      if (maskEffectComplete?.kind === "weather") {
        if (scene && onSceneChange && maskEffectComplete.preview) {
          onSceneChange(updateSceneWeatherMaskPoints(scene, maskEffectComplete.preview));
        }
        cancelWeatherMaskMove();
        return;
      }

      if (maskEffectComplete?.kind === "environment-effect") {
        if (scene && onSceneChange && maskEffectComplete.preview) {
          onSceneChange(updateSceneEnvironmentEffectPoints(scene, maskEffectComplete.preview));
        }
        cancelEnvironmentEffectMove();
        return;
      }
      return;
    }

    if (pointerUpRoute === "laser" && shouldEndLaserPointer(laserDragRef.current, event.pointerId)) {
      laserDragRef.current = null;
      return;
    }

    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsPanning(false);
    }
    if (tokenDragRef.current?.pointerId === event.pointerId) {
      const tokenDrag = tokenDragRef.current;
      const token = scene?.tokens.find((candidate) => candidate.id === tokenDrag.tokenId);
      if (scene && token && onSceneChange) {
        const result = getSceneAfterTokenDrag(scene, tokenDrag, token, tokenDragPreview);
        onSceneChange(result.scene, result.syncScene ?? result.scene);
      }
      cancelTokenDrag();
    }
  };

  const onPointerLeave = () => {
    resetSceneHoverState({
      clearSnapPoint: () => setSnapPoint(null),
      clearBrushHoverPoint: () => setBrushHoverPoint(null),
      clearDrawingTransformHover: () => setDrawingTransformHover(null),
      clearSceneItemHover: () => setSceneItemHover(false)
    });
  };

  const emitPing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    onLiveTableEvent?.(
      createPingLiveTableEvent(
        crypto.randomUUID(),
        clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, getRenderCamera(camera, playerDisplayScale)),
        activeTableTools,
        tableToolsVisibleInPlayer
      )
    );
  };

  const onClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "gm" && canvasTool === "ping" && scene) {
      event.preventDefault();
      emitPing(event);
    }
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "gm" && canvasTool === "ping" && scene) {
      event.preventDefault();
      return;
    }
    if (polygonDraftRef.current) {
      event.preventDefault();
      commitPolygonDraft();
    }
    if (drawingTool === "polygon" && drawingPolygonDraftRef.current) {
      event.preventDefault();
      commitDrawingPolygonDraft();
    }
    if (weatherMaskTool === "polygon" && weatherPolygonDraftRef.current) {
      event.preventDefault();
      commitWeatherPolygonDraft();
    }
    if (environmentEffectTool === "polygon" && environmentPolygonDraftRef.current) {
      event.preventDefault();
      commitEnvironmentPolygonDraft();
    }
  };

  const applySceneContextMenuOpening = (opening: SceneContextMenuOpening) => {
    const { selection } = opening;
    if ("tokenId" in selection) {
      onSelectToken?.(selection.tokenId ?? null);
    }
    if ("drawingId" in selection) {
      onSelectDrawing?.(selection.drawingId ?? null);
    }
    if ("fogShapeId" in selection) {
      onSelectFogShape?.(selection.fogShapeId ?? null);
    }
    if ("weatherMaskId" in selection) {
      onSelectWeatherMask?.(selection.weatherMaskId ?? null);
    }
    if ("environmentEffectId" in selection) {
      onSelectEnvironmentEffect?.(selection.environmentEffectId ?? null);
    }
    setTokenContextMenu(opening.tokenContextMenu);
    setMaskContextMenu(opening.maskContextMenu);
    setDrawingContextMenu(opening.drawingContextMenu);
    setEnvironmentEffectContextMenu(opening.environmentEffectContextMenu);
  };

  const onContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const activeRulerDrag = rulerDragRef.current;
    const tokenDrag = tokenDragRef.current;
    if (authoringToolActive) {
      event.preventDefault();
    }
    if (tokenDrag) {
      event.preventDefault();
      const update = getTokenDragWaypointRemovalUpdate(tokenDrag, tokenDragPreview);
      if (!update) {
        return;
      }
      tokenDragRef.current = update.drag;
      setTokenDragPreview(update.preview);
      return;
    }

    if (activeRulerDrag) {
      event.preventDefault();
      const nextRulerDrag = getRulerDragWithRemovedWaypoint(activeRulerDrag);
      if (!nextRulerDrag) {
        return;
      }
      rulerDragRef.current = nextRulerDrag;
      setRulerDrag(nextRulerDrag);
      emitRulerEvent(nextRulerDrag);
      return;
    }

    const draft = polygonDraftRef.current;
    const drawingDraft = drawingPolygonDraftRef.current;
    const weatherDraft = weatherPolygonDraftRef.current;
    const environmentDraft = environmentPolygonDraftRef.current;
    if (!draft && !drawingDraft && !weatherDraft && !environmentDraft) {
      if (mode === "gm" && scene) {
        const point = clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, getRenderCamera(camera, playerDisplayScale));
        const contextTarget = getSceneContextMenuTarget({
          authoringToolActive,
          camera: getRenderCamera(camera, playerDisplayScale),
          canOpenTokenMenu: Boolean(onAddTokenToTurnOrder),
          canShowDrawings: Boolean(canShowDrawings),
          canShowTokens: Boolean(canShowTokens),
          point,
          scene
        });
        if (contextTarget) {
          event.preventDefault();
          const menuKind: CanvasContextMenuKind =
            contextTarget.kind === "token"
              ? "token"
              : contextTarget.kind === "drawing"
                ? "drawing"
                : contextTarget.kind === "environment-effect"
                  ? "environment"
                  : "mask";
          applySceneContextMenuOpening(getSceneContextMenuOpening(contextTarget, getCanvasContextMenuPosition(event, menuKind)));
          return;
        }
      }
      return;
    }
    event.preventDefault();
    if (draft) {
      removeLastScenePolygonDraftPoint({ ref: polygonDraftRef, setDraft: setPolygonDraft });
      return;
    }
    if (drawingDraft) {
      removeLastScenePolygonDraftPoint({ ref: drawingPolygonDraftRef, setDraft: setDrawingPolygonDraft });
      return;
    }
    if (weatherDraft) {
      removeLastScenePolygonDraftPoint({ ref: weatherPolygonDraftRef, setDraft: setWeatherPolygonDraft });
      return;
    }
    if (environmentDraft) {
      removeLastScenePolygonDraftPoint({ ref: environmentPolygonDraftRef, setDraft: setEnvironmentPolygonDraft });
    }
  };

  const canAcceptTokenAssetDrop = (event: React.DragEvent<HTMLCanvasElement>): boolean => {
    return canAcceptSceneTokenAssetDrop({
      dataTransferTypes: event.dataTransfer.types,
      hasCampaign: Boolean(campaign),
      hasDropHandler: Boolean(onDropTokenAsset),
      hasScene: Boolean(scene),
      mode
    });
  };

  const onDragOver = (event: React.DragEvent<HTMLCanvasElement>) => {
    if (!canAcceptTokenAssetDrop(event)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const onDrop = (event: React.DragEvent<HTMLCanvasElement>) => {
    if (!canAcceptTokenAssetDrop(event)) {
      return;
    }
    event.preventDefault();
    const asset = getDroppedTokenAsset(campaign, event.dataTransfer);
    if (!asset) {
      return;
    }
    onDropTokenAsset?.(asset, clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, getRenderCamera(camera, playerDisplayScale)));
  };

  const updateDrawingTransformHover = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const cameraState = getRenderCamera(camera, playerDisplayScale);
    setDrawingTransformHover(
      getDrawingTransformHoverAtPoint({
        mode,
        scene,
        point: eventToWorldPoint(event, cameraState),
        camera: cameraState,
        selectedDrawingIds,
        canShowDrawings,
        hasActiveInteraction: Boolean(drawingDragPreview || authoringToolActive)
      })
    );
  };

  const updateSceneItemHover = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const cameraState = getRenderCamera(camera, playerDisplayScale);
    setSceneItemHover(
      hasSceneItemHoverAtPoint({
        mode,
        scene,
        point: eventToWorldPoint(event, cameraState),
        camera: cameraState,
        canShowTokens,
        canShowDrawings,
        canShowWeather,
        canShowFog,
        hasActiveInteraction: Boolean(drawingDragPreview || authoringToolActive || selectionDragRef.current)
      })
    );
  };

  const updatePolygonDraft = (tool: FogTool, point: Point) => {
    const operation = getFogOperationForTool(tool);
    appendScopedScenePolygonDraftPoint({ ref: polygonDraftRef, setDraft: setPolygonDraft }, point, "operation", operation);
  };

  const updateWeatherPolygonDraft = (point: Point) => {
    appendScenePolygonDraftPoint({ ref: weatherPolygonDraftRef, setDraft: setWeatherPolygonDraft }, point);
  };

  const updateEnvironmentPolygonDraft = (point: Point) => {
    appendScenePolygonDraftPoint({ ref: environmentPolygonDraftRef, setDraft: setEnvironmentPolygonDraft }, point);
  };

  const updateDrawingPolygonDraft = (point: Point) => {
    appendScenePolygonDraftPoint({ ref: drawingPolygonDraftRef, setDraft: setDrawingPolygonDraft }, point);
  };

  const getToolPoint = (event: React.PointerEvent<HTMLCanvasElement>, snapEnabled = true): Point => {
    const result = resolveSceneToolEventPoint(event, getRenderCamera(camera, playerDisplayScale), scene, snapEnabled);
    setSnapPoint(result.snapPoint);
    return result.point;
  };

  const getRulerPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    return resolveRulerEventPoint(event, getRenderCamera(camera, playerDisplayScale), scene);
  };

  const getDrawingToolPoint = (event: React.PointerEvent<HTMLCanvasElement>, tool: DrawingTool): Point => {
    const result = resolveDrawingToolEventPoint(event, getRenderCamera(camera, playerDisplayScale), scene, tool !== "freehand");
    setSnapPoint(result.snapPoint);
    return result.point;
  };

  const updateSnapPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canSnapDrawing = drawingTool && drawingTool !== "freehand";
    const canSnapFog = fogTool && !fogTool.includes("brush");
    const canSnapWeather = Boolean(weatherMaskTool);
    const canSnapEnvironment = Boolean(environmentEffectTool);
    if (!scene || !shouldShowSceneSnapPreview({ scene, snapModifierActive: isSnapModifier(event), canSnapDrawing, canSnapFog, canSnapWeather, canSnapEnvironment })) {
      setSnapPoint(null);
      return;
    }
    const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
    setSnapPoint(getNearestSceneSnapPoint(point, scene));
  };

  const commitPolygonDraft = () => {
    const draft = polygonDraftRef.current;
    if (!scene || !onSceneChange || !draft) {
      return;
    }
    const commit = getFogPolygonDraftCommit(scene, draft, crypto.randomUUID());
    if (!commit) {
      return;
    }
    clearScenePolygonDraft({ ref: polygonDraftRef, setDraft: setPolygonDraft });
    onSceneChange(addSceneFogShape(scene, commit.shape, commit.fogPatch));
  };

  const commitDrawingPolygonDraft = () => {
    const draft = drawingPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft) {
      return;
    }
    const drawing = getDrawingPolygonDraftCommit(scene, draft, crypto.randomUUID(), {
      color: drawingColor,
      opacity: drawingOpacity,
      fillColor: drawingFillColor,
      fillOpacity: drawingFillOpacity,
      strokeStyle: drawingStrokeStyle,
      strokeWidth: drawingStrokeWidth
    });
    if (!drawing) {
      return;
    }
    clearScenePolygonDraft({ ref: drawingPolygonDraftRef, setDraft: setDrawingPolygonDraft });
    onSceneChange(addSceneDrawing(scene, drawing));
  };

  const commitWeatherPolygonDraft = () => {
    const draft = weatherPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft) {
      return;
    }
    const mask = getWeatherPolygonDraftCommit(scene, draft, crypto.randomUUID());
    if (!mask) {
      return;
    }
    clearScenePolygonDraft({ ref: weatherPolygonDraftRef, setDraft: setWeatherPolygonDraft });
    onSceneChange(addSceneWeatherMask(scene, mask));
  };

  const commitEnvironmentPolygonDraft = () => {
    const draft = environmentPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft) {
      return;
    }
    const effect = getEnvironmentPolygonDraftCommit(
      scene,
      draft,
      crypto.randomUUID(),
      environmentEffectType,
      environmentEffectFeather,
      currentEnvironmentEffectTuning
    );
    if (!effect) {
      return;
    }
    clearScenePolygonDraft({ ref: environmentPolygonDraftRef, setDraft: setEnvironmentPolygonDraft });
    onSceneChange(addEnvironmentEffect(scene, effect));
  };

  usePolygonDraftKeyboard({
    active: Boolean(polygonDraft),
    onCancel: () => clearScenePolygonDraft({ ref: polygonDraftRef, setDraft: setPolygonDraft }),
    onCommit: commitPolygonDraft
  });

  usePolygonDraftKeyboard({
    active: Boolean(drawingPolygonDraft),
    onCancel: () => clearScenePolygonDraft({ ref: drawingPolygonDraftRef, setDraft: setDrawingPolygonDraft }),
    onCommit: commitDrawingPolygonDraft
  });

  usePolygonDraftKeyboard({
    active: Boolean(weatherPolygonDraft),
    onCancel: () => clearScenePolygonDraft({ ref: weatherPolygonDraftRef, setDraft: setWeatherPolygonDraft }),
    onCommit: commitWeatherPolygonDraft
  });

  usePolygonDraftKeyboard({
    active: Boolean(environmentPolygonDraft),
    onCancel: () => clearScenePolygonDraft({ ref: environmentPolygonDraftRef, setDraft: setEnvironmentPolygonDraft }),
    onCommit: commitEnvironmentPolygonDraft
  });

  const fitGmCameraToVideoMap = (video: HTMLVideoElement) => {
    if (mode !== "gm" || !scene || !mapAsset || !isVideoMap || video.dataset.mapAssetId !== mapAsset.id) {
      return;
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    fitGmCameraToReadyMap(rect.width, rect.height);
  };

  const handleVideoMapCanPlay = (video: HTMLVideoElement, index: number) => {
    setVideoMapLoadStatus("ready");
    fitGmCameraToVideoMap(video);
    playActiveWhenReady(index);
  };

  const handleVideoMapReady = (video: HTMLVideoElement) => {
    setVideoMapLoadStatus("ready");
    fitGmCameraToVideoMap(video);
  };

  const handleVideoMapMetadataReady = (video: HTMLVideoElement) => {
    fitGmCameraToVideoMap(video);
  };

  const handleVideoMapError = (video: HTMLVideoElement, index: number) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setVideoMapLoadStatus("ready");
      return;
    }
    window.setTimeout(() => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        setVideoMapLoadStatus("ready");
        return;
      }
      if (index === activeVideoIndex) {
        setVideoMapLoadStatus((status) => (status === "ready" ? status : "error"));
      }
    }, 180);
  };

  const showMapOverlay = mapOverlayActive;
  const mapOverlayMessage = getMapOverlayMessage(mapLoadStatus, mapAsset?.mediaType);
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
      {mode === "player" && scene && <TurnOrderPlayerBar scene={scene} campaign={campaign} />}
      {mode === "player" && scene && showPlayerSeatIndicators && <PlayerSeatIndicators campaign={campaign} />}
      {mode === "player" && scene && <PlayerTurnStatusIndicators scene={scene} campaign={campaign} />}
      {mode === "gm" && createPortal(
        <SceneCanvasContextMenus
          scene={scene}
          tokenContextMenu={tokenContextMenu}
          setTokenContextMenu={setTokenContextMenu}
          maskContextMenu={maskContextMenu}
          setMaskContextMenu={setMaskContextMenu}
          drawingContextMenu={drawingContextMenu}
          setDrawingContextMenu={setDrawingContextMenu}
          environmentEffectContextMenu={environmentEffectContextMenu}
          setEnvironmentEffectContextMenu={setEnvironmentEffectContextMenu}
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




