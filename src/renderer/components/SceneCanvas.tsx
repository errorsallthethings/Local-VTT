import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, ListPlus, Settings2, Trash2 } from "lucide-react";
import { DEFAULT_TABLE_TOOLS, DEFAULT_VIDEO_PLAYBACK, formatDefaultFogShapeName } from "../../shared/localvtt";
import type { Asset, Campaign, DrawingElement, DrawingStrokeStyle, DrawingTemplateEffect, EnvironmentEffectMask, EnvironmentEffectType, LiveTableEvent, Point, Scene, TableToolSettings } from "../../shared/localvtt";
import { areCamerasEqual, getCameraForWheelZoom, getRenderCamera, type Camera } from "../canvas/camera";
import {
  getCanvasInteractionClass,
  getDrawingTransformHoverAtPoint,
  hasAuthoringToolActive,
  hasSceneItemHoverAtPoint,
  type DrawingTransformHover
} from "../canvas/canvasInteraction";
import {
  drawDrawings,
  getDrawingHitRadius,
  getDrawingAtPoint,
  isMeaningfulDrawingPreview,
  shouldAddDrawingPoint,
  type DrawingPointOverrides,
  type DrawingPreview,
  type DrawingTool
} from "../canvas/drawingRenderer";
import {
  getDrawingGroupSnapAnchor,
  getDrawingPointSnapshot,
  getDrawingResizeHandleAtPoint,
  getDrawingRotationHandleAtPoint,
  resizeDrawingPoints,
  rotateDrawingPoints
} from "../canvas/drawingTransform";
import {
  drawFog,
  getFogDragKindForTool,
  getFogShapeFromDrag,
  getFogShapeFromPolygonDraft,
  getFogVisibilityPatchForNewShape,
  getFogOperationForTool,
  isMeaningfulFogDrag,
  isMeaningfulPolygon,
  isPolygonTool,
  shouldAddBrushPoint,
  type FogDrag,
  type FogPolygonDraft,
  type FogTool
} from "../canvas/fogRenderer";
import { drawHexGrid, drawSquareGrid } from "../canvas/gridRenderer";
import { constrainSquarePoint } from "../canvas/gridMath";
import {
  drawLiveTableEvents,
  hasActiveLiveTableEvents,
  LASER_MIN_POINT_DISTANCE,
  LASER_POINT_LIFETIME_MS,
  RULER_RELEASE_LINGER_MS
} from "../canvas/liveTableRenderer";
import { getPlayerDisplayScale, getRulerLabel, isDuplicateRulerWaypoint, isVisibleDiceOverlayEvent } from "../canvas/liveTableState";
import {
  getMapCalibrationDragFromPoint,
  getSquareCalibrationBox,
  getVisibleMapCalibrationBox,
  type MapCalibrationBox,
  type MapCalibrationDrag
} from "../canvas/mapCalibrationGeometry";
import { drawMapSource, getCameraForMapFit } from "../canvas/mapRenderer";
import {
  closeCanvasImageSource,
  getInitialMapLoadStatus,
  getMapDrawSource,
  getMapOverlayMessage,
  getReadyMapSourceForFit,
  isMapOverlayActive,
  isMapReady,
  prepareLoadedImageMap,
  type LoadedMap,
  type MapLoadStatus,
  type ReadyMapSource
} from "../canvas/mapSource";
import {
  drawRuler,
  getRulerPathPoints,
  type RulerDrag
} from "../canvas/measurement";
import { getPointAlongPath } from "../canvas/movementPath";
import { appendPolygonDraftPoint, appendScopedPolygonDraftPoint, removeLastPolygonDraftPoint } from "../canvas/polygonDraft";
import {
  formatDefaultEnvironmentEffectName,
  formatDefaultWeatherMaskName,
  getDrawingContextLabel,
  getEnvironmentEffectContextLabel,
  getFogShapeContextLabel,
  getWeatherMaskContextLabel
} from "../canvas/sceneContextLabels";
import {
  getSceneMarqueeSelection,
  pointsToSelectionRect
} from "../canvas/selectionGeometry";
import type {
  DrawingDragState,
  DrawingResizeState,
  DrawingRotateState,
  LaserDragState,
  SelectionDrag,
  SelectionMode,
  TokenDragState
} from "../canvas/sceneInteractionTypes";
import {
  drawBrushHoverPreview,
  drawDrawingBrushHoverPreview,
  drawDrawingResizeHandles,
  drawMapCalibrationBox,
  drawSelectionMarquee,
  drawSnapMarker
} from "../canvas/sceneOverlayRenderer";
import { drawEnvironmentEffectPreview, drawEnvironmentEffects, drawEnvironmentEffectShape } from "../canvas/environmentEffectLayerRenderer";
import { getEnvironmentEffectAtPoint, getMaskHitAtPoint } from "../canvas/sceneHitTesting";
import { getSceneLayerVisibility } from "../canvas/sceneLayerVisibility";
import { getNearestSceneSnapPoint, getRulerSnapPoint, resolveDrawingToolPoint, resolveSceneToolPoint, shouldShowSceneSnapPreview } from "../canvas/sceneSnapping";
import { getSelectedItemIdList, getSelectedItemIds } from "../lib/selectionIds";
import {
  getDrawingElementFromPreview,
  getDrawingPolygonElementFromDraft,
  getDrawingTemplateCurrentPoint,
  getTemplatePreviewDrawing,
  isTemplateDrawingTool
} from "../canvas/templateDrawing";
import { distanceBetween, getSnappedTokenPosition, getTokenAtPoint } from "../canvas/tokenGeometry";
import { areTokenImagesReady, getTokenAssetIds, getTokenImageAssets, getTokenImageSourceKey, parseTokenImageSourceKey } from "../canvas/tokenImageSource";
import {
  getTokenMovementPath,
  getTokenMovementTweens,
  getTokenWaypointPosition,
  isDuplicateTokenWaypoint
} from "../canvas/tokenMovement";
import { drawTokenDragHighlights, drawTokens, type TokenDragPreview, type TokenPositionOverrides } from "../canvas/tokenRenderer";
import { getVideoTransform } from "../canvas/videoMap";
import { clientToWorldPoint, eventToWorldPoint, getCanvasViewportCenter, isSnapModifier } from "../canvas/viewportGeometry";
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
  type WaterEffectTuning
} from "../canvas/environmentEffectsRenderer";
import {
  getEnvironmentEffectFromDrag,
  getEnvironmentEffectFromPolygonDraft,
  isMeaningfulEnvironmentEffectDrag,
  shouldAnimateEnvironmentEffects,
  type EnvironmentEffectDrag,
  type EnvironmentPolygonDraft
} from "../canvas/environmentEffectGeometry";
import { getEnvironmentEffectTuningFields } from "../canvas/environmentEffectTuning";
import { drawWeather, shouldAnimateWeather } from "../canvas/weatherRenderer";
import {
  drawWeatherMaskOutlines,
  drawWeatherMaskPreview,
  drawWeatherMaskSelection,
  drawWeatherPolygonDraft
} from "../canvas/weatherMaskRenderer";
import {
  getWeatherMaskFromDrag,
  getWeatherMaskFromPolygonDraft,
  isMeaningfulWeatherMaskDrag,
  type WeatherMaskDrag,
  type WeatherPolygonDraft
} from "../canvas/weatherMaskGeometry";
import { usePolygonDraftKeyboard } from "../hooks/usePolygonDraftKeyboard";
import { useVideoMapPlayback } from "../hooks/useVideoMapPlayback";
import { getTokenLibraryAssetDragId, hasTokenLibraryAssetDrag } from "../lib/dragTypes";
import {
  addEnvironmentEffect,
  addSceneDrawing,
  addSceneFogShape,
  addSceneWeatherMask,
  duplicateSceneDrawing,
  duplicateSceneToken,
  removeEnvironmentEffect,
  removeSceneDrawing,
  removeSceneToken,
  patchSceneToken,
  setDrawingPlayerVisibility,
  setDrawingTemplateFootprintVisibility,
  setFogShapePlayerVisibility,
  setWeatherMaskVisibility,
  updateSceneDrawingPoints,
  updateSceneTokenPositions
} from "../lib/sceneEditing";
import { TokenSettings } from "./layers/TokenSettings";
import { PlayerSeatIndicators, PlayerTurnStatusIndicators, TurnOrderPlayerBar } from "./scene/PlayerViewTurnOverlays";
import {
  DrawingToolStatusStrip,
  EnvironmentEffectStatusStrip,
  FogToolStatusStrip,
  MapCalibrationStatusStrip,
  MapLoadOverlay,
  RulerStatusStrip,
  TableToolStatusStrip,
  TokenMoveStatusStrip,
  WeatherMaskStatusStrip
} from "./scene/SceneCanvasStatusStrips";
import type { DrawingTemplateSize, EnvironmentEffectTool, MouseBehavior, SelectorSelectionFilters, WeatherMaskTool } from "./tools/ToolsMenu";

const DiceRollOverlay = lazy(() => import("./dice/DiceRollOverlay").then((module) => ({ default: module.DiceRollOverlay })));
const WEATHER_ONLY_FRAME_INTERVAL_MS = 50;
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

type TokenContextMenu = {
  tokenId: string;
  tokenName: string;
  x: number;
  y: number;
};

type MaskContextMenu =
  | {
      kind: "fog";
      shapeId: string;
      label: string;
      visibleInPlayer: boolean;
      x: number;
      y: number;
    }
  | {
      kind: "effects";
      maskId: string;
      label: string;
      visible: boolean;
      x: number;
      y: number;
    };

type DrawingContextMenu = {
  drawingId: string;
  label: string;
  isTemplate: boolean;
  templateFootprintVisible: boolean;
  visibleInPlayer: boolean;
  x: number;
  y: number;
};

type EnvironmentEffectContextMenu = {
  effectId: string;
  label: string;
  x: number;
  y: number;
};

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
  const [loadedMap, setLoadedMap] = useState<LoadedMap | null>(null);
  const [loadedTokenImages, setLoadedTokenImages] = useState<Map<string, HTMLImageElement>>(() => new Map());
  const [failedTokenImageIds, setFailedTokenImageIds] = useState<Set<string>>(() => new Set());
  const [mapLoadStatus, setMapLoadStatus] = useState<MapLoadStatus>("idle");
  const [fogPreview, setFogPreview] = useState<FogDrag | null>(null);
  const [drawingPreview, setDrawingPreview] = useState<DrawingPreview | null>(null);
  const [weatherMaskPreview, setWeatherMaskPreview] = useState<WeatherMaskDrag | null>(null);
  const [environmentEffectPreview, setEnvironmentEffectPreview] = useState<EnvironmentEffectDrag | null>(null);
  const [rulerDrag, setRulerDrag] = useState<RulerDrag | null>(null);
  const [releasedRulerDrag, setReleasedRulerDrag] = useState<RulerDrag | null>(null);
  const [tokenDragPreview, setTokenDragPreview] = useState<TokenDragPreview | null>(null);
  const [drawingDragPreview, setDrawingDragPreview] = useState<DrawingPointOverrides | null>(null);
  const [playerTokenTweenPositions, setPlayerTokenTweenPositions] = useState<TokenPositionOverrides | null>(null);
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
  const dragRef = useRef<{ pointerId: number; x: number; y: number; camera: Camera } | null>(null);
  const rulerDragRef = useRef<(RulerDrag & { pointerId: number }) | null>(null);
  const releasedRulerTimeoutRef = useRef<number | null>(null);
  const tokenDragRef = useRef<TokenDragState | null>(null);
  const drawingDragRef = useRef<DrawingDragState | null>(null);
  const drawingResizeRef = useRef<DrawingResizeState | null>(null);
  const drawingRotateRef = useRef<DrawingRotateState | null>(null);
  const laserDragRef = useRef<LaserDragState | null>(null);
  const fogDragRef = useRef<FogDrag | null>(null);
  const drawingPreviewRef = useRef<DrawingPreview | null>(null);
  const weatherMaskDragRef = useRef<WeatherMaskDrag | null>(null);
  const environmentEffectDragRef = useRef<EnvironmentEffectDrag | null>(null);
  const mapCalibrationDragRef = useRef<MapCalibrationDrag | null>(null);
  const selectionDragRef = useRef<SelectionDrag | null>(null);
  const polygonDraftRef = useRef<FogPolygonDraft | null>(null);
  const drawingPolygonDraftRef = useRef<DrawingPolygonDraft | null>(null);
  const weatherPolygonDraftRef = useRef<WeatherPolygonDraft | null>(null);
  const environmentPolygonDraftRef = useRef<EnvironmentPolygonDraft | null>(null);
  const previousSceneRef = useRef<Scene | null>(null);
  const fittedSceneCameraRef = useRef<string | null>(null);
  const autoFitCameraRef = useRef(true);
  // Player View tween state is mirrored in a ref so requestAnimationFrame can draw without stale React closures.
  const playerTokenTweenPositionsRef = useRef<TokenPositionOverrides | null>(null);
  const activeTableTools = tableTools ?? scene?.tableTools ?? DEFAULT_TABLE_TOOLS;
  const activeFogBrushSize = fogBrushSize ?? scene?.fog.brushSize ?? 80;

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

  const emitRulerEvent = useCallback((nextRulerDrag: RulerDrag) => {
    if (!scene) {
      return;
    }
    const label = getRulerLabel(nextRulerDrag, scene);
    onLiveTableEvent?.({
      id: "ruler-live",
      type: "ruler",
      points: getRulerPathPoints(nextRulerDrag),
      primary: label.primary,
      secondary: label.secondary,
      visibleInPlayer: tableToolsVisibleInPlayer,
      createdAt: Date.now()
    });
  }, [onLiveTableEvent, scene, tableToolsVisibleInPlayer]);

  const cancelRulerDrag = useCallback(() => {
    if (releasedRulerTimeoutRef.current !== null) {
      window.clearTimeout(releasedRulerTimeoutRef.current);
      releasedRulerTimeoutRef.current = null;
    }
    rulerDragRef.current = null;
    setRulerDrag(null);
    setReleasedRulerDrag(null);
    onLiveTableEvent?.({
      id: "ruler-clear",
      type: "ruler-clear",
      createdAt: Date.now()
    });
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
    const label = getRulerLabel(activeRulerDrag, scene);
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
    onLiveTableEvent?.({
      id: "ruler-live",
      type: "ruler",
      points: getRulerPathPoints(activeRulerDrag),
      primary: label.primary,
      secondary: label.secondary,
      visibleInPlayer: tableToolsVisibleInPlayer,
      createdAt: now,
      expiresAt: now + RULER_RELEASE_LINGER_MS
    });
  }, [activeTableTools.rulerLinger, cancelRulerDrag, onLiveTableEvent, scene, tableToolsVisibleInPlayer]);

  useEffect(() => {
    return () => {
      if (releasedRulerTimeoutRef.current !== null) {
        window.clearTimeout(releasedRulerTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!tokenContextMenu && !maskContextMenu && !drawingContextMenu && !environmentEffectContextMenu) {
      return;
    }

    const dismissMenu = () => {
      setTokenContextMenu(null);
      setMaskContextMenu(null);
      setDrawingContextMenu(null);
      setEnvironmentEffectContextMenu(null);
    };
    const dismissMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissMenu();
      }
    };

    window.addEventListener("pointerdown", dismissMenu);
    window.addEventListener("keydown", dismissMenuOnEscape);
    return () => {
      window.removeEventListener("pointerdown", dismissMenu);
      window.removeEventListener("keydown", dismissMenuOnEscape);
    };
  }, [drawingContextMenu, environmentEffectContextMenu, maskContextMenu, tokenContextMenu]);

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
  const effectiveSelectedTokenIds = useMemo(() => getSelectedItemIdList(selectedTokenId, selectedTokenIds), [selectedTokenId, selectedTokenIds]);
  const effectiveSelectedTokenIdSet = useMemo(() => getSelectedItemIds(selectedTokenId, selectedTokenIds), [selectedTokenId, selectedTokenIds]);
  const effectiveSelectedDrawingIds = useMemo(() => getSelectedItemIdList(selectedDrawingId, selectedDrawingIds), [selectedDrawingId, selectedDrawingIds]);
  const effectiveSelectedDrawingIdSet = useMemo(() => getSelectedItemIds(selectedDrawingId, selectedDrawingIds), [selectedDrawingId, selectedDrawingIds]);
  const effectiveSelectedFogShapeIds = useMemo(() => getSelectedItemIdList(selectedFogShapeId, selectedFogShapeIds), [selectedFogShapeId, selectedFogShapeIds]);
  const effectiveSelectedWeatherMaskIds = useMemo(() => getSelectedItemIdList(selectedWeatherMaskId, selectedWeatherMaskIds), [selectedWeatherMaskId, selectedWeatherMaskIds]);
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
  const isVideoMap = Boolean(canShowMap && mapAsset?.mediaType === "video" && assetUrl);
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
    polygonDraftRef.current = polygonDraft;
  }, [polygonDraft]);

  useEffect(() => {
    drawingPolygonDraftRef.current = drawingPolygonDraft;
  }, [drawingPolygonDraft]);

  useEffect(() => {
    weatherPolygonDraftRef.current = weatherPolygonDraft;
  }, [weatherPolygonDraft]);

  useEffect(() => {
    environmentPolygonDraftRef.current = environmentPolygonDraft;
  }, [environmentPolygonDraft]);

  useEffect(() => {
    if (!onMapCalibrationBox) {
      setMapCalibrationDraftBox(null);
      mapCalibrationDragRef.current = null;
      setMapCalibrationDrag(null);
    }
  }, [onMapCalibrationBox]);

  useEffect(() => {
    setPolygonDraft(null);
    polygonDraftRef.current = null;
    setDrawingPolygonDraft(null);
    drawingPolygonDraftRef.current = null;
    weatherPolygonDraftRef.current = null;
    environmentPolygonDraftRef.current = null;
    clearFogPreview();
    clearDrawingPreview();
    setDrawingPolygonDraft(null);
    setWeatherPolygonDraft(null);
    setEnvironmentPolygonDraft(null);
    setBrushHoverPoint(null);
    setSnapPoint(null);
    setSceneItemHover(false);
  }, [clearDrawingPreview, clearFogPreview, fogTool, scene?.id]);

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
    setIsPanning(false);
    selectionDragRef.current = null;
    setSelectionDrag(null);
    setSnapPoint(null);
    setBrushHoverPoint(null);
  }, [clearEnvironmentEffectPreview, clearWeatherMaskPreview, mode, scene?.id]);

  useEffect(() => {
    clearWeatherMaskPreview();
    weatherPolygonDraftRef.current = null;
    setWeatherPolygonDraft(null);
  }, [clearWeatherMaskPreview, weatherMaskTool, scene?.id]);

  useEffect(() => {
    clearEnvironmentEffectPreview();
    environmentPolygonDraftRef.current = null;
    setEnvironmentPolygonDraft(null);
  }, [clearEnvironmentEffectPreview, environmentEffectTool, scene?.id]);

  useEffect(() => {
    const previousScene = previousSceneRef.current;
    previousSceneRef.current = scene;

    if (mode !== "player" || !previousScene || !scene || previousScene.id !== scene.id) {
      playerTokenTweenPositionsRef.current = null;
      setPlayerTokenTweenPositions(null);
      return;
    }

    // Only Player View animates committed token moves; GM View uses the live drag preview instead.
    const tweens = getTokenMovementTweens(previousScene.tokens, scene.tokens, scene);
    if (tweens.length === 0) {
      playerTokenTweenPositionsRef.current = null;
      setPlayerTokenTweenPositions(null);
      return;
    }

    let animationFrame = 0;
    let cancelled = false;
    const durationMs = Math.max(...tweens.map((tween) => tween.durationMs));
    const startedAt = performance.now();

    const animate = (timestamp: number) => {
      if (cancelled) {
        return;
      }
      const tweenPositions = new Map(
        tweens.map((tween) => {
          const progress = Math.min(1, (timestamp - startedAt) / tween.durationMs);
          return [tween.id, getPointAlongPath(tween.points, tween.distance * progress)];
        })
      );
      playerTokenTweenPositionsRef.current = tweenPositions;
      setPlayerTokenTweenPositions(tweenPositions);

      if (timestamp - startedAt < durationMs) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        playerTokenTweenPositionsRef.current = null;
        setPlayerTokenTweenPositions(null);
      }
    };

    const initialTweenPositions = new Map(tweens.map((tween) => [tween.id, tween.points[0]]));
    playerTokenTweenPositionsRef.current = initialTweenPositions;
    setPlayerTokenTweenPositions(initialTweenPositions);
    animationFrame = window.requestAnimationFrame(animate);
    return () => {
      cancelled = true;
      playerTokenTweenPositionsRef.current = null;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [mode, scene]);

  useEffect(() => {
    if (mode !== "gm" || (!tokenDragPreview && !drawingDragPreview && !rulerDrag && !fogPreview && !drawingPreview && !environmentEffectPreview)) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      cancelTokenDrag();
      cancelDrawingDrag();
      cancelRulerDrag();
      clearFogPreview();
      clearEnvironmentEffectPreview();
      clearDrawingPreview();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelRulerDrag, clearDrawingPreview, clearEnvironmentEffectPreview, clearFogPreview, drawingDragPreview, drawingPreview, environmentEffectPreview, fogPreview, mode, rulerDrag, tokenDragPreview]);

  useEffect(() => {
    if (mode !== "gm" || !scene || !tokenDragPreview) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Shift" || event.repeat) {
        return;
      }
      const tokenDrag = tokenDragRef.current;
      const token = scene.tokens.find((candidate) => candidate.id === tokenDragPreview.tokenId);
      if (!tokenDrag || !token || tokenDrag.tokenId !== token.id) {
        return;
      }

      event.preventDefault();
      const waypoint = getTokenWaypointPosition(tokenDragPreview.currentPosition, token, scene);
      const previousRoutePosition = tokenDrag.waypoints[tokenDrag.waypoints.length - 1] ?? tokenDrag.startPosition;
      if (isDuplicateTokenWaypoint(previousRoutePosition, waypoint, token, scene)) {
        return;
      }

      const waypoints = [...tokenDrag.waypoints, waypoint];
      tokenDrag.waypoints = waypoints;
      setTokenDragPreview((preview) => (preview?.tokenId === token.id ? { ...preview, waypoints } : preview));
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, scene, tokenDragPreview]);

  useEffect(() => {
    if (mode !== "gm" || !scene || !rulerDrag) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Shift" || event.repeat) {
        return;
      }
      const activeRulerDrag = rulerDragRef.current;
      if (!activeRulerDrag) {
        return;
      }

      event.preventDefault();
      const waypoint = event.ctrlKey || event.metaKey ? (getRulerSnapPoint(activeRulerDrag.current, scene) ?? activeRulerDrag.current) : activeRulerDrag.current;
      const previousRoutePosition = activeRulerDrag.waypoints[activeRulerDrag.waypoints.length - 1] ?? activeRulerDrag.start;
      if (isDuplicateRulerWaypoint(previousRoutePosition, waypoint, scene)) {
        return;
      }

      const waypoints = [...activeRulerDrag.waypoints, waypoint];
      const nextRulerDrag = { ...activeRulerDrag, current: waypoint, waypoints };
      rulerDragRef.current = nextRulerDrag;
      setRulerDrag(nextRulerDrag);
      emitRulerEvent(nextRulerDrag);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [emitRulerEvent, mode, rulerDrag, scene]);

  useEffect(() => {
    if (!assetUrl || !mapAsset?.id || mapAsset.mediaType === "video") {
      setLoadedMap(null);
      setMapLoadStatus(getInitialMapLoadStatus(mapAsset?.mediaType, assetUrl));
      return;
    }

    let cancelled = false;
    const imageAssetId = mapAsset.id;
    const imageAssetPath = mapAsset.relativePath;
    const image = new Image();
    image.decoding = "async";
    setLoadedMap(null);
    setMapLoadStatus("loading");
    image.onload = () => {
      void prepareLoadedImageMap(image, imageAssetPath)
        .then((preparedMap) => {
          if (cancelled) {
            closeCanvasImageSource(preparedMap.optimizedSource);
            return;
          }
          setLoadedMap({
            assetId: imageAssetId,
            originalSource: image,
            optimizedSource: preparedMap.optimizedSource,
            sourceWidth: image.naturalWidth || image.width,
            sourceHeight: image.naturalHeight || image.height,
            optimizedScale: preparedMap.optimizedScale,
            animate: imageAssetPath.toLowerCase().endsWith(".gif"),
            mediaType: "image",
            ready: true
          });
          setMapLoadStatus("ready");
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setLoadedMap(null);
          setMapLoadStatus("error");
        });
    };
    image.onerror = () => {
      if (cancelled) {
        return;
      }
      setLoadedMap(null);
      setMapLoadStatus("error");
    };
    image.src = assetUrl;
    return () => {
      cancelled = true;
    };
  }, [assetUrl, mapAsset?.id, mapAsset?.mediaType, mapAsset?.relativePath]);

  useEffect(() => {
    return () => {
      if (loadedMap) {
        closeCanvasImageSource(loadedMap.optimizedSource);
      }
    };
  }, [loadedMap]);

  useEffect(() => {
    if (!isVideoMap) {
      return;
    }
    setMapLoadStatus("loading");
  }, [isVideoMap, mapAsset?.id, assetUrl]);

  useEffect(() => {
    const tokenImageSources = parseTokenImageSourceKey(tokenImageSourceKey);
    if (tokenImageSources.length === 0) {
      setLoadedTokenImages(new Map());
      setFailedTokenImageIds(new Set());
      return;
    }

    let cancelled = false;
    const nextImages = new Map<string, HTMLImageElement>();
    const nextFailedIds = new Set<string>();
    setLoadedTokenImages(new Map());
    setFailedTokenImageIds(new Set());
    for (const source of tokenImageSources) {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (cancelled) {
          return;
        }
        nextImages.set(source.id, image);
        setLoadedTokenImages(new Map(nextImages));
      };
      image.onerror = () => {
        if (cancelled) {
          return;
        }
        nextFailedIds.add(source.id);
        setFailedTokenImageIds(new Set(nextFailedIds));
      };
      image.src = window.localVtt.toAssetUrl(source.path);
    }

    return () => {
      cancelled = true;
    };
  }, [tokenImageSourceKey]);

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

      const renderCamera = getRenderCamera(camera, playerDisplayScale);
      const activeVideo = isVideoMap ? (videoRefs.current[activeVideoIndex] ?? null) : null;
      const mapDrawSource = loadedMap?.ready ? getMapDrawSource(loadedMap, scene, width, height, renderCamera.zoom, mode) : null;
      const weatherMapSource = loadedMap?.ready ? loadedMap.originalSource : (activeVideo && activeVideo.readyState >= HTMLMediaElement.HAVE_METADATA ? activeVideo : null);
      const weatherMapReady = !canShowMap || !mapAsset || Boolean(weatherMapSource);

      ctx.save();
      // Player Display Scale modifies Player View zoom only; GM camera controls stay scene-local.
      ctx.translate(renderCamera.x, renderCamera.y);
      ctx.scale(renderCamera.zoom, renderCamera.zoom);

      if (!isVideoMap && canShowMap && loadedMap?.ready) {
        ctx.globalAlpha = mapLayer?.opacity ?? 1;
        try {
          drawMapSource(ctx, mapDrawSource ?? loadedMap.originalSource, scene, width, height, loadedMap.sourceWidth, loadedMap.sourceHeight);
        } catch {
          // Keep the canvas pass resilient if an image asset is temporarily unavailable.
        }
        ctx.globalAlpha = 1;
      } else if (!isVideoMap && (!canShowMap || !mapAsset)) {
        ctx.fillStyle = "#242a32";
        ctx.fillRect(0, 0, 1600, 1000);
        ctx.fillStyle = "#8792a2";
        ctx.font = "24px system-ui, sans-serif";
        ctx.fillText("Import a map to begin", 48, 64);
      } else if (!isVideoMap) {
        ctx.fillStyle = "#111720";
        ctx.fillRect(0, 0, 1600, 1000);
      }

      const showGrid = Boolean(canShowGrid) && (mode === "gm" ? scene.grid.showOnGm : scene.grid.showOnPlayer);
      if (showGrid && scene.grid.type === "square") {
        drawSquareGrid(ctx, scene, width, height, renderCamera);
      } else if (showGrid && scene.grid.type === "hex") {
        drawHexGrid(ctx, scene, width, height, renderCamera);
      }

      if (mode === "gm" && tokenDragPreview) {
        drawTokenDragHighlights(ctx, scene, tokenDragPreview, renderCamera.zoom);
      }

      if (canShowTokens) {
        drawTokens(ctx, scene, loadedTokenImages, mode, effectiveSelectedTokenIds, tokenDragPreview, playerTokenTweenPositionsRef.current, renderCamera.zoom);
      }

      if (canShowDrawings) {
        const drawingPolygonPreview =
          drawingPolygonDraft && drawingPolygonDraft.points[0]
            ? ({
                pointerId: -1,
                kind: "polygon",
                points: drawingPolygonDraft.points,
                current: drawingPolygonDraft.current ?? drawingPolygonDraft.points[drawingPolygonDraft.points.length - 1],
                color: drawingColor,
                opacity: drawingOpacity,
                strokeColor: drawingColor,
                strokeOpacity: drawingOpacity,
                fillColor: drawingFillColor,
                fillOpacity: drawingFillOpacity,
                strokeStyle: drawingStrokeStyle,
                strokeWidth: drawingStrokeWidth,
                templateEffect: "plain",
                templateWidth: 5,
                measurementLabelVisible: false
              } satisfies DrawingPreview)
            : null;
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
          drawWeather(ctx, scene, width, height, renderCamera, Date.now(), weatherLayer?.opacity ?? 1, weatherMapSource);
        }
        drawEnvironmentEffects(ctx, scene.environment.effects, renderCamera, mode, Date.now(), weatherLayer?.opacity ?? 1, acidEffectTuning, coldEffectTuning, darknessEffectTuning, poisonEffectTuning, waterEffectTuning, lavaEffectTuning, fireEffectTuning, lightningEffectTuning, arcaneEffectTuning, chaosEffectTuning, voidEffectTuning, natureEffectTuning, distortionEffectTuning, radiantEffectTuning, forceFieldEffectTuning, shockwaveEffectTuning, smokeEffectTuning, fogEffectTuning);
      }
      if (mode === "gm") {
        drawWeatherMaskOutlines(ctx, scene.weather.masks, renderCamera);
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
        for (const selectedWeatherMask of scene.weather.masks.filter((mask) => effectiveSelectedWeatherMaskIds.includes(mask.id) && (mask.visible ?? true))) {
          drawWeatherMaskSelection(ctx, selectedWeatherMask, renderCamera);
        }
        if (selectedEnvironmentEffectId) {
          const selectedEnvironmentEffect = scene.environment.effects.find((effect) => effect.id === selectedEnvironmentEffectId && effect.visibleInGm !== false);
          if (selectedEnvironmentEffect) {
            drawEnvironmentEffectShape(ctx, selectedEnvironmentEffect, renderCamera, { fill: false, selected: true });
          }
        }
      }
      if (mode === "gm" && brushHoverPoint && fogTool?.includes("brush") && !fogPreview) {
        drawBrushHoverPreview(ctx, brushHoverPoint, Math.max(4, activeFogBrushSize / 2), renderCamera, getFogOperationForTool(fogTool));
      }
      if (mode === "gm" && brushHoverPoint && drawingTool === "freehand" && !drawingPreview) {
        drawDrawingBrushHoverPreview(ctx, brushHoverPoint, Math.max(4, drawingStrokeWidth / 2), renderCamera, drawingColor, drawingOpacity);
      }
      if (mode === "gm" && snapPoint && fogTool && !fogTool.includes("brush")) {
        drawSnapMarker(ctx, snapPoint, renderCamera, getFogOperationForTool(fogTool));
      }
      if (mode === "gm" && snapPoint && ((drawingTool && drawingTool !== "freehand") || (drawingDragPreview && drawingDragRef.current))) {
        drawSnapMarker(ctx, snapPoint, renderCamera, "reveal");
      }
      if (mode === "gm" && snapPoint && weatherMaskTool) {
        drawSnapMarker(ctx, snapPoint, renderCamera, "reveal");
      }
      if (mode === "gm" && snapPoint && environmentEffectTool) {
        drawSnapMarker(ctx, snapPoint, renderCamera, "reveal");
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
      const visibleLiveTableEvents = mode === "gm" ? liveTableEvents.filter((event) => event.type !== "ruler") : liveTableEvents;
      if (visibleLiveTableEvents.length > 0) {
        drawLiveTableEvents(ctx, visibleLiveTableEvents, renderCamera, scene.grid);
      }
    };

    let animationFrame = 0;
    let lastWeatherOnlyFrameAt = 0;
    const drawCurrentFrame = (timestamp: number) => {
      const mapAnimating = Boolean(loadedMap?.animate);
      const tokenAnimating = Boolean(playerTokenTweenPositionsRef.current);
      const tableEventsAnimating = hasActiveLiveTableEvents(liveTableEvents);
      const weatherAnimating = shouldAnimateWeather(scene, Boolean(canShowWeather));
      const environmentAnimating = shouldAnimateEnvironmentEffects(scene, mode, Boolean(canShowWeather));
      const selectionAnimating =
        mode === "gm" &&
        (effectiveSelectedDrawingIds.length > 0 ||
          effectiveSelectedFogShapeIds.length > 0 ||
          effectiveSelectedTokenIds.length > 0 ||
          effectiveSelectedWeatherMaskIds.length > 0);
      const hasFullRateAnimation = mapAnimating || tokenAnimating || tableEventsAnimating || selectionAnimating;
      const effectAnimating = weatherAnimating || environmentAnimating;
      const shouldDrawFrame = !effectAnimating || hasFullRateAnimation || timestamp - lastWeatherOnlyFrameAt >= WEATHER_ONLY_FRAME_INTERVAL_MS;

      if (shouldDrawFrame) {
        const rect = canvas.getBoundingClientRect();
        drawScene(context, rect.width, rect.height);
        if (effectAnimating && !hasFullRateAnimation) {
          lastWeatherOnlyFrameAt = timestamp;
        }
      }

      if (mapAnimating || tokenAnimating || tableEventsAnimating || weatherAnimating || environmentAnimating || selectionAnimating) {
        animationFrame = window.requestAnimationFrame(drawCurrentFrame);
      }
    };

    resize();
    const selectionAnimating =
      mode === "gm" &&
      (effectiveSelectedDrawingIds.length > 0 ||
        effectiveSelectedFogShapeIds.length > 0 ||
        effectiveSelectedTokenIds.length > 0 ||
        effectiveSelectedWeatherMaskIds.length > 0);
    if (loadedMap?.animate || playerTokenTweenPositionsRef.current || hasActiveLiveTableEvents(liveTableEvents) || shouldAnimateWeather(scene, Boolean(canShowWeather)) || shouldAnimateEnvironmentEffects(scene, mode, Boolean(canShowWeather)) || selectionAnimating) {
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
  }, [acidEffectTuning, activeFogBrushSize, activeTableTools, activeVideoIndex, arcaneEffectTuning, brushHoverPoint, camera, canShowDrawings, canShowFog, canShowGrid, canShowMap, canShowTokens, canShowWeather, chaosEffectTuning, coldEffectTuning, darknessEffectTuning, distortionEffectTuning, drawingColor, drawingDragPreview, drawingFillColor, drawingFillOpacity, drawingLayer?.opacity, drawingOpacity, drawingPolygonDraft, drawingPreview, drawingStrokeStyle, drawingStrokeWidth, drawingTemplateEffect, drawingTemplateWidth, drawingTool, effectiveSelectedDrawingIds, effectiveSelectedFogShapeIds, effectiveSelectedTokenIds, effectiveSelectedWeatherMaskIds, environmentEffectFeather, environmentEffectPreview, environmentEffectTool, environmentPolygonDraft, fireEffectTuning, fitGmCameraToReadyMap, fogEffectTuning, fogPreview, fogTool, forceFieldEffectTuning, isVideoMap, lavaEffectTuning, lightningEffectTuning, liveTableEvents, loadedMap, loadedTokenImages, mapAsset, mapCalibrationBox, mapCalibrationDraftBox, mapCalibrationDrag, mapLayer?.opacity, mapOverlayActive, mode, natureEffectTuning, onMapCalibrationBox, playerDisplayScale, playerTokenTweenPositions, poisonEffectTuning, polygonDraft, radiantEffectTuning, releasedRulerDrag, rulerDrag, scene, selectedDrawingId, selectedDrawingIds, selectedEnvironmentEffectId, selectedTokenId, selectionDrag, shockwaveEffectTuning, smokeEffectTuning, snapPoint, tokenDragPreview, videoRefs, voidEffectTuning, waterEffectTuning, weatherLayer?.opacity, weatherMaskPreview, weatherMaskTool, weatherPolygonDraft]);

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

  const cancelTokenDrag = () => {
    tokenDragRef.current = null;
    setTokenDragPreview(null);
  };

  const cancelDrawingDrag = () => {
    drawingDragRef.current = null;
    drawingResizeRef.current = null;
    drawingRotateRef.current = null;
    setDrawingDragPreview(null);
  };

  const selectFromMarquee = (currentScene: Scene, drag: SelectionDrag) => {
    const rect = pointsToSelectionRect(drag.start, drag.current);
    if (rect.width < 4 && rect.height < 4) {
      return;
    }
    const { tokenIds, drawingIds, fogShapeIds, weatherMaskIds } = getSceneMarqueeSelection(currentScene, rect, selectorSelectionFilters, {
      tokens: Boolean(canShowTokens),
      drawings: Boolean(canShowDrawings)
    });
    onSelectSceneItems?.({ tokenIds, drawingIds, fogShapeIds, weatherMaskIds, mode: drag.mode });
  };

  const onWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (!interactive) {
      return;
    }
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    autoFitCameraRef.current = false;
    setCamera(getCameraForWheelZoom({ camera, mouseX, mouseY, deltaY: event.deltaY }));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    setTokenContextMenu(null);
    setMaskContextMenu(null);
    setDrawingContextMenu(null);
    setEnvironmentEffectContextMenu(null);
    if (!interactive) {
      return;
    }
    if (event.button !== 0) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera };
      setIsPanning(true);
      return;
    }
    if (mode === "gm" && canvasTool === "ping" && scene && event.button === 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    if (mode === "gm" && scene && onMapCalibrationBox && event.button === 0) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const editableBox = mapCalibrationDraftBox ?? mapCalibrationBox;
      const drag = getMapCalibrationDragFromPoint(event.pointerId, point, editableBox, getRenderCamera(camera, playerDisplayScale));
      mapCalibrationDragRef.current = drag;
      setMapCalibrationDrag(drag);
      return;
    }
    if (mode === "gm" && canvasTool === "ruler" && scene && event.button === 0) {
      const point = getRulerPoint(event);
      const nextRulerDrag = { pointerId: event.pointerId, start: point, current: point, waypoints: [] };
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
    if (mode === "gm" && canvasTool === "laser" && scene && event.button === 0) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const now = Date.now();
      const laserEvent = {
        id: crypto.randomUUID(),
        type: "laser",
        createdAt: now,
        points: [{ point, createdAt: now }],
        thickness: activeTableTools.laserThickness,
        color: activeTableTools.laserColor,
        visibleInPlayer: tableToolsVisibleInPlayer
      } satisfies LiveTableEvent;
      laserDragRef.current = { pointerId: event.pointerId, eventId: laserEvent.id, points: laserEvent.points };
      onLiveTableEvent?.(laserEvent);
      return;
    }
    if (mode === "gm" && drawingTool === "polygon" && scene && onSceneChange && event.button === 0) {
      updateDrawingPolygonDraft(getDrawingToolPoint(event, drawingTool));
      return;
    }
    if (mode === "gm" && drawingTool && scene && onSceneChange && event.button === 0) {
      const point = getDrawingToolPoint(event, drawingTool);
      const preview = {
        pointerId: event.pointerId,
        kind: drawingTool,
        points: [point],
        current: point,
        color: drawingColor,
        opacity: drawingOpacity,
        strokeColor: drawingColor,
        strokeOpacity: drawingOpacity,
        fillColor: drawingFillColor,
        fillOpacity: isTemplateDrawingTool(drawingTool) ? 0 : drawingFillOpacity,
        strokeStyle: isTemplateDrawingTool(drawingTool) ? "dashed" : drawingStrokeStyle,
        strokeWidth: drawingStrokeWidth,
        templateEffect: isTemplateDrawingTool(drawingTool) ? drawingTemplateEffect : "plain",
        templateWidth: isTemplateDrawingTool(drawingTool) ? drawingTemplateWidth : 5,
        measurementLabelVisible: isTemplateDrawingTool(drawingTool)
      } satisfies DrawingPreview;
      drawingPreviewRef.current = preview;
      setDrawingPreview(preview);
      onTemplatePreviewChange?.(getTemplatePreviewDrawing(preview));
      return;
    }
    if (mode === "gm" && fogTool && scene && onSceneChange && event.button === 0) {
      const point = getToolPoint(event, !fogTool.includes("brush"));
      if (isPolygonTool(fogTool)) {
        updatePolygonDraft(fogTool, point);
        return;
      }
      const fogDrag = {
        pointerId: event.pointerId,
        kind: getFogDragKindForTool(fogTool),
        start: point,
        current: point,
        points: [point],
        radius: fogTool.includes("brush") ? Math.max(4, activeFogBrushSize / 2) : undefined,
        operation: getFogOperationForTool(fogTool)
      } satisfies FogDrag;
      fogDragRef.current = fogDrag;
      setFogPreview(fogDrag);
      return;
    }
    if (mode === "gm" && weatherMaskTool && scene && onSceneChange && event.button === 0) {
      const point = getToolPoint(event);
      if (weatherMaskTool === "polygon") {
        updateWeatherPolygonDraft(point);
        return;
      }
      weatherPolygonDraftRef.current = null;
      setWeatherPolygonDraft(null);
      const maskDrag = {
        pointerId: event.pointerId,
        kind: weatherMaskTool,
        start: point,
        current: point
      } satisfies WeatherMaskDrag;
      weatherMaskDragRef.current = maskDrag;
      setWeatherMaskPreview(maskDrag);
      return;
    }
    if (mode === "gm" && environmentEffectTool && scene && onSceneChange && event.button === 0) {
      const point = getToolPoint(event);
      if (environmentEffectTool === "polygon") {
        updateEnvironmentPolygonDraft(point);
        return;
      }
      environmentPolygonDraftRef.current = null;
      setEnvironmentPolygonDraft(null);
      const effectDrag = {
        pointerId: event.pointerId,
        kind: environmentEffectTool,
        effect: environmentEffectType,
        feather: environmentEffectFeather,
        ...getEnvironmentEffectTuningFields(environmentEffectType, {}, currentEnvironmentEffectTuning),
        start: point,
        current: point
      } satisfies EnvironmentEffectDrag;
      environmentEffectDragRef.current = effectDrag;
      setEnvironmentEffectPreview(effectDrag);
      return;
    }
    if (mode === "gm" && mouseBehavior === "selector" && scene && !authoringToolActive && event.button === 0 && (event.shiftKey || event.ctrlKey || event.metaKey)) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const selectionMode: SelectionMode = event.ctrlKey || event.metaKey ? "subtract" : "add";
      const nextSelectionDrag = { pointerId: event.pointerId, start: point, current: point, mode: selectionMode };
      selectionDragRef.current = nextSelectionDrag;
      setSelectionDrag(nextSelectionDrag);
      return;
    }
    if (mode === "gm" && scene && onSceneChange && event.button === 0) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const token = canShowTokens ? getTokenAtPoint(scene.tokens, point) : null;
      if (token) {
        const shouldDragSelectedGroup = mouseBehavior === "grabber" && effectiveSelectedTokenIdSet.has(token.id) && effectiveSelectedTokenIds.length > 1;
        const groupTokenIds = shouldDragSelectedGroup ? effectiveSelectedTokenIds : [token.id];
        const groupStartPositions = new Map(
          scene.tokens
            .filter((candidate) => groupTokenIds.includes(candidate.id))
            .map((candidate) => [candidate.id, candidate.position])
        );
        if (!shouldDragSelectedGroup) {
          onSelectToken?.(token.id);
        }
        onSelectFogShape?.(null);
        onSelectWeatherMask?.(null);
        onSelectEnvironmentEffect?.(null);
        onSelectDrawing?.(null);
        if (mouseBehavior === "grabber") {
          const snappedPosition = getSnappedTokenPosition(token.position, token, scene);
          tokenDragRef.current = {
            pointerId: event.pointerId,
            tokenId: token.id,
            startPosition: token.position,
            waypoints: [],
            groupStartPositions,
            offset: {
              x: point.x - token.position.x,
              y: point.y - token.position.y
            }
          };
          setTokenDragPreview({
            tokenId: token.id,
            startPosition: token.position,
            currentPosition: token.position,
            snappedPosition,
            waypoints: [],
            tokenPositions: groupStartPositions
          });
        }
        return;
      }
      onSelectToken?.(null);
      if (!authoringToolActive) {
        if ((mouseBehavior === "grabber" || mouseBehavior === "selector") && canShowDrawings && effectiveSelectedDrawingIds.length > 0) {
          const rotateTarget = getDrawingRotationHandleAtPoint(scene.drawings, effectiveSelectedDrawingIds, point, getRenderCamera(camera, playerDisplayScale));
          if (rotateTarget) {
            const groupStartPoints = getDrawingPointSnapshot(scene.drawings, effectiveSelectedDrawingIds);
            drawingRotateRef.current = {
              pointerId: event.pointerId,
              center: rotateTarget.center,
              startAngle: Math.atan2(point.y - rotateTarget.center.y, point.x - rotateTarget.center.x),
              groupStartPoints
            };
            setDrawingDragPreview(groupStartPoints);
            return;
          }
          const resizeTarget = getDrawingResizeHandleAtPoint(scene.drawings, effectiveSelectedDrawingIds, point, getRenderCamera(camera, playerDisplayScale));
          if (resizeTarget) {
            const groupStartPoints = getDrawingPointSnapshot(scene.drawings, effectiveSelectedDrawingIds);
            drawingResizeRef.current = {
              pointerId: event.pointerId,
              handle: resizeTarget.handle,
              bounds: resizeTarget.bounds,
              groupStartPoints
            };
            setDrawingDragPreview(groupStartPoints);
            return;
          }
        }
        const drawingHit = canShowDrawings ? getDrawingAtPoint(scene.drawings, point, getDrawingHitRadius(getRenderCamera(camera, playerDisplayScale).zoom), scene.grid) : null;
        if (drawingHit) {
          const shouldDragSelectedGroup = mouseBehavior === "grabber" && effectiveSelectedDrawingIdSet.has(drawingHit.id) && effectiveSelectedDrawingIds.length > 1;
          const groupDrawingIds = shouldDragSelectedGroup ? effectiveSelectedDrawingIds : [drawingHit.id];
          const groupStartPoints = getDrawingPointSnapshot(scene.drawings, groupDrawingIds, { includeTemplates: true });
          const snapAnchor = getDrawingGroupSnapAnchor(scene.drawings, groupDrawingIds, point);
          onSelectToken?.(null);
          if (!shouldDragSelectedGroup) {
            onSelectDrawing?.(drawingHit.id);
          }
          onSelectFogShape?.(null);
          onSelectWeatherMask?.(null);
          onSelectEnvironmentEffect?.(null);
          if (mouseBehavior === "grabber") {
            drawingDragRef.current = {
              pointerId: event.pointerId,
              drawingId: drawingHit.id,
              start: point,
              snapAnchor,
              groupStartPoints
            };
            setDrawingDragPreview(groupStartPoints);
          }
          return;
        }
        const environmentEffectHit = getEnvironmentEffectAtPoint(scene, point);
        if (environmentEffectHit) {
          onSelectEnvironmentEffect?.(environmentEffectHit.id);
          onSelectFogShape?.(null);
          onSelectWeatherMask?.(null);
          onSelectDrawing?.(null);
          return;
        }
        const maskHit = getMaskHitAtPoint(scene, point);
        if (maskHit?.kind === "weather") {
          onSelectWeatherMask?.(maskHit.mask.id);
          onSelectFogShape?.(null);
          onSelectEnvironmentEffect?.(null);
          onSelectDrawing?.(null);
          return;
        }
        if (maskHit?.kind === "fog") {
          onSelectFogShape?.(maskHit.shape.id);
          onSelectWeatherMask?.(null);
          onSelectEnvironmentEffect?.(null);
          onSelectDrawing?.(null);
          return;
        }
        onSelectFogShape?.(null);
        onSelectWeatherMask?.(null);
        onSelectEnvironmentEffect?.(null);
        onSelectDrawing?.(null);
      }
    }
    if (mode === "gm" && mouseBehavior === "selector" && scene && !authoringToolActive && event.button === 0) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const selectionMode: SelectionMode = event.ctrlKey || event.metaKey ? "subtract" : event.shiftKey ? "add" : "replace";
      const nextSelectionDrag = { pointerId: event.pointerId, start: point, current: point, mode: selectionMode };
      selectionDragRef.current = nextSelectionDrag;
      setSelectionDrag(nextSelectionDrag);
      return;
    }
    if (mode === "gm" && mouseBehavior !== "grabber" && event.button === 0) {
      return;
    }
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera };
    setIsPanning(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const tokenDrag = tokenDragRef.current;
    const drawingDragValue = drawingDragRef.current;
    const drawingResizeValue = drawingResizeRef.current;
    const drawingRotateValue = drawingRotateRef.current;
    const laserDrag = laserDragRef.current;
    const drawingDrag = drawingPreviewRef.current;
    const rulerDragValue = rulerDragRef.current;
    const selectionDragValue = selectionDragRef.current;
    const mapCalibrationDragValue = mapCalibrationDragRef.current;
    if (mapCalibrationDragValue?.pointerId === event.pointerId) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const nextDrag = { ...mapCalibrationDragValue, current: point };
      mapCalibrationDragRef.current = nextDrag;
      setMapCalibrationDrag(nextDrag);
      if (nextDrag.mode === "move" && nextDrag.box && nextDrag.offset) {
        setMapCalibrationDraftBox({
          ...nextDrag.box,
          x: point.x - nextDrag.offset.x,
          y: point.y - nextDrag.offset.y
        });
      } else if (nextDrag.mode === "resize") {
        setMapCalibrationDraftBox(getSquareCalibrationBox(nextDrag.start, point));
      } else {
        setMapCalibrationDraftBox(getSquareCalibrationBox(nextDrag.start, point));
      }
      return;
    }
    if (laserDrag?.pointerId === event.pointerId) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const previousPoint = laserDrag.points[laserDrag.points.length - 1]?.point;
      if (!previousPoint || distanceBetween(previousPoint, point) >= LASER_MIN_POINT_DISTANCE) {
        const now = Date.now();
        const nextPoints = [...laserDrag.points, { point, createdAt: now }].filter((entry) => now - entry.createdAt <= LASER_POINT_LIFETIME_MS);
        laserDragRef.current = { ...laserDrag, points: nextPoints };
        onLiveTableEvent?.({
          id: laserDrag.eventId,
          type: "laser",
          createdAt: laserDrag.points[0]?.createdAt ?? Date.now(),
          points: nextPoints,
          thickness: activeTableTools.laserThickness,
          color: activeTableTools.laserColor,
          visibleInPlayer: tableToolsVisibleInPlayer
        });
      }
      return;
    }
    if (rulerDragValue?.pointerId === event.pointerId) {
      const nextRulerDrag = { ...rulerDragValue, current: getRulerPoint(event) };
      rulerDragRef.current = nextRulerDrag;
      setRulerDrag(nextRulerDrag);
      emitRulerEvent(nextRulerDrag);
      return;
    }

    if (selectionDragValue?.pointerId === event.pointerId) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const nextSelectionDrag = { ...selectionDragValue, current: point };
      selectionDragRef.current = nextSelectionDrag;
      setSelectionDrag(nextSelectionDrag);
      return;
    }

    if (drawingDrag?.pointerId === event.pointerId) {
      const point = getDrawingToolPoint(event, drawingDrag.kind);
      const templateCurrent = getDrawingTemplateCurrentPoint(drawingDrag.points[0], point, drawingDrag.kind, scene, drawingTemplateSize);
      const current = (drawingDrag.kind === "rectangle" || drawingDrag.kind === "circle") && event.shiftKey ? constrainSquarePoint(drawingDrag.points[0], templateCurrent) : templateCurrent;
      const ellipse = drawingDrag.kind === "circle" && !event.shiftKey;
      const nextPoints =
        drawingDrag.kind === "freehand" && shouldAddDrawingPoint(drawingDrag.points[drawingDrag.points.length - 1], current)
          ? [...drawingDrag.points, current]
          : drawingDrag.points;
      const nextDrawingDrag = { ...drawingDrag, current, points: nextPoints, ellipse };
      drawingPreviewRef.current = nextDrawingDrag;
      setDrawingPreview(nextDrawingDrag);
      onTemplatePreviewChange?.(getTemplatePreviewDrawing(nextDrawingDrag));
      return;
    }

    if (drawingResizeValue?.pointerId === event.pointerId) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      setDrawingDragPreview(
        new Map(
          [...drawingResizeValue.groupStartPoints.entries()].flatMap(([drawingId, points]) => {
            const drawing = scene?.drawings.find((candidate) => candidate.id === drawingId);
            return drawing
              ? [
                  [
                    drawingId,
                    resizeDrawingPoints({ ...drawing, points }, drawingResizeValue.bounds, drawingResizeValue.handle, point, event.shiftKey)
                  ] as const
                ]
              : [];
          })
        )
      );
      return;
    }

    if (drawingRotateValue?.pointerId === event.pointerId) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const currentAngle = Math.atan2(point.y - drawingRotateValue.center.y, point.x - drawingRotateValue.center.x);
      const angle = currentAngle - drawingRotateValue.startAngle;
      setDrawingDragPreview(
        new Map(
          [...drawingRotateValue.groupStartPoints.entries()].flatMap(([drawingId, points]) => {
            const drawing = scene?.drawings.find((candidate) => candidate.id === drawingId);
            return drawing
              ? [
                  [
                    drawingId,
                    rotateDrawingPoints({ ...drawing, points }, drawingRotateValue.center, angle)
                  ] as const
                ]
              : [];
          })
        )
      );
      return;
    }

    if (drawingDragValue?.pointerId === event.pointerId) {
      const worldPoint = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const pointerDelta = {
        x: worldPoint.x - drawingDragValue.start.x,
        y: worldPoint.y - drawingDragValue.start.y
      };
      const projectedAnchor = {
        x: drawingDragValue.snapAnchor.x + pointerDelta.x,
        y: drawingDragValue.snapAnchor.y + pointerDelta.y
      };
      const snappedPoint = scene && isSnapModifier(event) ? getNearestSceneSnapPoint(projectedAnchor, scene) : null;
      setSnapPoint(snappedPoint);
      const delta = snappedPoint
        ? {
            x: snappedPoint.x - drawingDragValue.snapAnchor.x,
            y: snappedPoint.y - drawingDragValue.snapAnchor.y
          }
        : pointerDelta;
      setDrawingDragPreview(
        new Map(
          [...drawingDragValue.groupStartPoints.entries()].map(([drawingId, points]) => [
            drawingId,
            points.map((candidatePoint) => ({
              x: candidatePoint.x + delta.x,
              y: candidatePoint.y + delta.y
            }))
          ])
        )
      );
      return;
    }

    if (tokenDrag?.pointerId === event.pointerId && scene) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const token = scene.tokens.find((candidate) => candidate.id === tokenDrag.tokenId);
      if (!token) {
        cancelTokenDrag();
        return;
      }
      const currentPosition = {
        x: point.x - tokenDrag.offset.x,
        y: point.y - tokenDrag.offset.y
      };
      const snappedPosition = getSnappedTokenPosition(currentPosition, token, scene);
      const currentDelta = {
        x: currentPosition.x - tokenDrag.startPosition.x,
        y: currentPosition.y - tokenDrag.startPosition.y
      };
      const tokenPositions = new Map(
        [...tokenDrag.groupStartPositions.entries()].map(([tokenId, startPosition]) => [
          tokenId,
          {
            x: startPosition.x + currentDelta.x,
            y: startPosition.y + currentDelta.y
          }
        ])
      );
      setTokenDragPreview({
        tokenId: token.id,
        startPosition: tokenDrag.startPosition,
        currentPosition,
        snappedPosition,
        waypoints: tokenDrag.waypoints,
        tokenPositions
      });
      return;
    }

    const fogDrag = fogDragRef.current;
    if (fogDrag?.pointerId === event.pointerId) {
      const point = getToolPoint(event, fogDrag.kind !== "brush");
      const current = fogDrag.kind === "rectangle" && event.shiftKey ? constrainSquarePoint(fogDrag.start, point) : point;
      const nextPoints =
        fogDrag.kind === "brush" && shouldAddBrushPoint(fogDrag.points[fogDrag.points.length - 1], current, fogDrag.radius ?? 1)
          ? [...fogDrag.points, current]
          : fogDrag.points;
      const nextDrag = { ...fogDrag, current, points: nextPoints };
      fogDragRef.current = nextDrag;
      setFogPreview(nextDrag);
      return;
    }

    const weatherMaskDrag = weatherMaskDragRef.current;
    if (weatherMaskDrag?.pointerId === event.pointerId) {
      const point = getToolPoint(event);
      const current = weatherMaskDrag.kind === "rectangle" && event.shiftKey ? constrainSquarePoint(weatherMaskDrag.start, point) : point;
      const nextDrag = { ...weatherMaskDrag, current };
      weatherMaskDragRef.current = nextDrag;
      setWeatherMaskPreview(nextDrag);
      return;
    }

    const environmentEffectDrag = environmentEffectDragRef.current;
    if (environmentEffectDrag?.pointerId === event.pointerId) {
      const point = getToolPoint(event);
      const current = environmentEffectDrag.kind === "rectangle" && event.shiftKey ? constrainSquarePoint(environmentEffectDrag.start, point) : point;
      const nextDrag = { ...environmentEffectDrag, current };
      environmentEffectDragRef.current = nextDrag;
      setEnvironmentEffectPreview(nextDrag);
      return;
    }

    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      autoFitCameraRef.current = false;
      setCamera({
        ...drag.camera,
        x: drag.camera.x + event.clientX - drag.x,
        y: drag.camera.y + event.clientY - drag.y
      });
      return;
    }

    if (drawingTool === "polygon" && drawingPolygonDraftRef.current) {
      setDrawingPolygonDraft({ ...drawingPolygonDraftRef.current, current: getDrawingToolPoint(event, "polygon") });
      return;
    }

    if (polygonDraftRef.current) {
      setPolygonDraft({ ...polygonDraftRef.current, current: getToolPoint(event) });
      return;
    }

    if (weatherMaskTool === "polygon" && weatherPolygonDraftRef.current) {
      setWeatherPolygonDraft({ ...weatherPolygonDraftRef.current, current: getToolPoint(event) });
      return;
    }

    if (environmentEffectTool === "polygon" && environmentPolygonDraftRef.current) {
      setEnvironmentPolygonDraft({ ...environmentPolygonDraftRef.current, current: getToolPoint(event) });
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
    const mapCalibrationDragValue = mapCalibrationDragRef.current;
    if (mapCalibrationDragValue?.pointerId === event.pointerId) {
      mapCalibrationDragRef.current = null;
      setMapCalibrationDrag(null);
      const box = getVisibleMapCalibrationBox(mapCalibrationDragValue, mapCalibrationDraftBox);
      if (box && box.width >= 4 && box.height >= 4) {
        setMapCalibrationDraftBox(box);
      }
      return;
    }

    const drawingDrag = drawingPreviewRef.current;
    if (drawingDrag?.pointerId === event.pointerId) {
      clearDrawingPreview();
      if (scene && onSceneChange && isMeaningfulDrawingPreview(drawingDrag)) {
        onSceneChange(addSceneDrawing(scene, getDrawingElementFromPreview(drawingDrag, crypto.randomUUID(), scene.drawings.length)));
      }
      return;
    }

    const weatherMaskDrag = weatherMaskDragRef.current;
    if (weatherMaskDrag?.pointerId === event.pointerId) {
      clearWeatherMaskPreview();
      if (scene && onSceneChange && isMeaningfulWeatherMaskDrag(weatherMaskDrag)) {
        onSceneChange(
          addSceneWeatherMask(
            scene,
            getWeatherMaskFromDrag(
              weatherMaskDrag,
              crypto.randomUUID(),
              formatDefaultWeatherMaskName(scene.weather.masks.length)
            )
          )
        );
      }
      return;
    }

    const environmentEffectDrag = environmentEffectDragRef.current;
    if (environmentEffectDrag?.pointerId === event.pointerId) {
      clearEnvironmentEffectPreview();
      if (scene && onSceneChange && isMeaningfulEnvironmentEffectDrag(environmentEffectDrag)) {
        onSceneChange(
          addEnvironmentEffect(
            scene,
            getEnvironmentEffectFromDrag(
              environmentEffectDrag,
              crypto.randomUUID(),
              formatDefaultEnvironmentEffectName(environmentEffectDrag.effect, scene.environment.effects.length),
              currentEnvironmentEffectTuning
            )
          )
        );
      }
      return;
    }

    const fogDrag = fogDragRef.current;
    if (fogDrag?.pointerId === event.pointerId) {
      clearFogPreview();
      if (scene && onSceneChange && isMeaningfulFogDrag(fogDrag)) {
        onSceneChange(
          addSceneFogShape(
            scene,
            getFogShapeFromDrag(
              fogDrag,
              crypto.randomUUID(),
              formatDefaultFogShapeName(fogDrag.operation, fogDrag.kind, scene.fog.shapes.length),
              scene.fog.newShapesVisibleInPlayer
            ),
            getFogVisibilityPatchForNewShape(scene.fog, fogDrag.operation)
          )
        );
      }
      return;
    }

    if (rulerDragRef.current?.pointerId === event.pointerId) {
      finishRulerDrag();
      return;
    }

    if (selectionDragRef.current?.pointerId === event.pointerId) {
      const completedSelection = selectionDragRef.current;
      selectionDragRef.current = null;
      setSelectionDrag(null);
      if (scene) {
        selectFromMarquee(scene, completedSelection);
      }
      return;
    }

    if (drawingDragRef.current?.pointerId === event.pointerId) {
      const movedPoints = drawingDragPreview;
      if (scene && onSceneChange && movedPoints) {
        onSceneChange(updateSceneDrawingPoints(scene, movedPoints));
      }
      drawingDragRef.current = null;
      setDrawingDragPreview(null);
      setSnapPoint(null);
      return;
    }

    if (drawingResizeRef.current?.pointerId === event.pointerId) {
      const resizedPoints = drawingDragPreview;
      if (scene && onSceneChange && resizedPoints) {
        onSceneChange(updateSceneDrawingPoints(scene, resizedPoints));
      }
      drawingResizeRef.current = null;
      setDrawingDragPreview(null);
      return;
    }

    if (drawingRotateRef.current?.pointerId === event.pointerId) {
      const rotatedPoints = drawingDragPreview;
      if (scene && onSceneChange && rotatedPoints) {
        onSceneChange(updateSceneDrawingPoints(scene, rotatedPoints));
      }
      drawingRotateRef.current = null;
      setDrawingDragPreview(null);
      return;
    }

    if (laserDragRef.current?.pointerId === event.pointerId) {
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
        const finalPosition = tokenDragPreview?.tokenId === token.id ? tokenDragPreview.snappedPosition : getSnappedTokenPosition(token.position, token, scene);
        const snappedDelta = {
          x: finalPosition.x - tokenDrag.startPosition.x,
          y: finalPosition.y - tokenDrag.startPosition.y
        };
        const nextScene = updateSceneTokenPositions(scene, tokenDrag.groupStartPositions, snappedDelta);
        const tokenMovementPath = getTokenMovementPath(tokenDrag.startPosition, tokenDrag.waypoints, finalPosition);
        onSceneChange(
          nextScene,
          tokenMovementPath
            ? {
                ...nextScene,
                tokenMovementPath: {
                  tokenId: token.id,
                  points: tokenMovementPath
                }
              }
            : nextScene
        );
      }
      cancelTokenDrag();
    }
  };

  const onPointerLeave = () => {
    setSnapPoint(null);
    setBrushHoverPoint(null);
    setDrawingTransformHover(null);
    setSceneItemHover(false);
  };

  const emitPing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    onLiveTableEvent?.({
      id: crypto.randomUUID(),
      type: "ping",
      point: clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, getRenderCamera(camera, playerDisplayScale)),
      size: activeTableTools.pingSize,
      color: activeTableTools.pingColor,
      visibleInPlayer: tableToolsVisibleInPlayer,
      createdAt: Date.now()
    });
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

  const onContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const activeRulerDrag = rulerDragRef.current;
    const tokenDrag = tokenDragRef.current;
    if (authoringToolActive) {
      event.preventDefault();
    }
    if (tokenDrag) {
      event.preventDefault();
      if (tokenDrag.waypoints.length === 0) {
        return;
      }
      const waypoints = tokenDrag.waypoints.slice(0, -1);
      tokenDrag.waypoints = waypoints;
      setTokenDragPreview((preview) => (preview?.tokenId === tokenDrag.tokenId ? { ...preview, waypoints } : preview));
      return;
    }

    if (activeRulerDrag) {
      event.preventDefault();
      if (activeRulerDrag.waypoints.length === 0) {
        return;
      }
      const nextRulerDrag = {
        ...activeRulerDrag,
        waypoints: activeRulerDrag.waypoints.slice(0, -1)
      };
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
        const token = canShowTokens ? getTokenAtPoint(scene.tokens, point) : null;
        if (token && onAddTokenToTurnOrder) {
          const frameRect = frameRef.current?.getBoundingClientRect();
          event.preventDefault();
          onSelectToken?.(token.id);
          onSelectFogShape?.(null);
          onSelectWeatherMask?.(null);
          onSelectDrawing?.(null);
          setMaskContextMenu(null);
          setDrawingContextMenu(null);
          setEnvironmentEffectContextMenu(null);
          setTokenContextMenu({
            tokenId: token.id,
            tokenName: token.name || "Token",
            x: frameRect ? event.clientX - frameRect.left : event.clientX,
            y: frameRect ? event.clientY - frameRect.top : event.clientY
          });
          return;
        }
        if (!authoringToolActive) {
          const drawingHit = canShowDrawings ? getDrawingAtPoint(scene.drawings, point, getDrawingHitRadius(getRenderCamera(camera, playerDisplayScale).zoom), scene.grid) : null;
          if (drawingHit) {
            const frameRect = frameRef.current?.getBoundingClientRect();
            const drawingIndex = scene.drawings.findIndex((drawing) => drawing.id === drawingHit.id);
            event.preventDefault();
            onSelectToken?.(null);
            onSelectFogShape?.(null);
            onSelectWeatherMask?.(null);
            onSelectDrawing?.(drawingHit.id);
            setTokenContextMenu(null);
            setMaskContextMenu(null);
            setEnvironmentEffectContextMenu(null);
            setDrawingContextMenu({
              drawingId: drawingHit.id,
              label: getDrawingContextLabel(drawingHit, drawingIndex),
              isTemplate: drawingHit.measurementLabelVisible === true,
              templateFootprintVisible: drawingHit.templateFootprintVisible === true,
              visibleInPlayer: drawingHit.visibleInPlayer,
              x: frameRect ? event.clientX - frameRect.left : event.clientX,
              y: frameRect ? event.clientY - frameRect.top : event.clientY
            });
            return;
          }
          const maskHit = getMaskHitAtPoint(scene, point);
          if (maskHit) {
            const frameRect = frameRef.current?.getBoundingClientRect();
            event.preventDefault();
            onSelectToken?.(null);
            onSelectDrawing?.(null);
            if (maskHit.kind === "weather") {
              onSelectWeatherMask?.(maskHit.mask.id);
              onSelectFogShape?.(null);
              setTokenContextMenu(null);
              setDrawingContextMenu(null);
              setEnvironmentEffectContextMenu(null);
              setMaskContextMenu({
                kind: "effects",
                maskId: maskHit.mask.id,
                label: getWeatherMaskContextLabel(maskHit.mask),
                visible: maskHit.mask.visible ?? true,
                x: frameRect ? event.clientX - frameRect.left : event.clientX,
                y: frameRect ? event.clientY - frameRect.top : event.clientY
              });
            } else {
              const shapeIndex = scene.fog.shapes.findIndex((shape) => shape.id === maskHit.shape.id);
              const label = getFogShapeContextLabel(maskHit.shape, shapeIndex);
              const visibleInPlayer = maskHit.shape.visibleInPlayer ?? maskHit.shape.visible ?? true;
              onSelectFogShape?.(maskHit.shape.id);
              onSelectWeatherMask?.(null);
              setTokenContextMenu(null);
              setDrawingContextMenu(null);
              setEnvironmentEffectContextMenu(null);
              setMaskContextMenu({
                kind: "fog",
                shapeId: maskHit.shape.id,
                label,
                visibleInPlayer,
                x: frameRect ? event.clientX - frameRect.left : event.clientX,
                y: frameRect ? event.clientY - frameRect.top : event.clientY
              });
            }
            return;
          }
          const environmentEffectHit = getEnvironmentEffectAtPoint(scene, point);
          if (environmentEffectHit) {
            const frameRect = frameRef.current?.getBoundingClientRect();
            event.preventDefault();
            const effectIndex = scene.environment.effects.findIndex((effect) => effect.id === environmentEffectHit.id);
            onSelectToken?.(null);
            onSelectDrawing?.(null);
            onSelectFogShape?.(null);
            onSelectWeatherMask?.(null);
            onSelectEnvironmentEffect?.(environmentEffectHit.id);
            setTokenContextMenu(null);
            setMaskContextMenu(null);
            setDrawingContextMenu(null);
            setEnvironmentEffectContextMenu({
              effectId: environmentEffectHit.id,
              label: getEnvironmentEffectContextLabel(environmentEffectHit, effectIndex),
              x: frameRect ? event.clientX - frameRect.left : event.clientX,
              y: frameRect ? event.clientY - frameRect.top : event.clientY
            });
            return;
          }
        }
      }
      return;
    }
    event.preventDefault();
    if (draft) {
      const nextDraft = removeLastPolygonDraftPoint(draft);
      polygonDraftRef.current = nextDraft;
      setPolygonDraft(nextDraft);
      return;
    }
    if (drawingDraft) {
      const nextDraft = removeLastPolygonDraftPoint(drawingDraft);
      drawingPolygonDraftRef.current = nextDraft;
      setDrawingPolygonDraft(nextDraft);
      return;
    }
    if (weatherDraft) {
      const nextDraft = removeLastPolygonDraftPoint(weatherDraft);
      weatherPolygonDraftRef.current = nextDraft;
      setWeatherPolygonDraft(nextDraft);
      return;
    }
    if (environmentDraft) {
      const nextDraft = removeLastPolygonDraftPoint(environmentDraft);
      environmentPolygonDraftRef.current = nextDraft;
      setEnvironmentPolygonDraft(nextDraft);
    }
  };

  const canAcceptTokenAssetDrop = (event: React.DragEvent<HTMLCanvasElement>): boolean => {
    return Boolean(mode === "gm" && scene && campaign && onDropTokenAsset && hasTokenLibraryAssetDrag(event.dataTransfer.types));
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
    const assetId = getTokenLibraryAssetDragId(event.dataTransfer);
    const asset = campaign?.assets.find((candidate) => candidate.id === assetId && candidate.kind === "token");
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
    const currentDraft = polygonDraftRef.current;
    const operation = getFogOperationForTool(tool);
    const nextDraft = appendScopedPolygonDraftPoint(currentDraft, point, "operation", operation);
    setPolygonDraft(nextDraft);
    polygonDraftRef.current = nextDraft;
  };

  const updateWeatherPolygonDraft = (point: Point) => {
    const currentDraft = weatherPolygonDraftRef.current;
    const nextDraft = appendPolygonDraftPoint(currentDraft, point);
    setWeatherPolygonDraft(nextDraft);
    weatherPolygonDraftRef.current = nextDraft;
  };

  const updateEnvironmentPolygonDraft = (point: Point) => {
    const currentDraft = environmentPolygonDraftRef.current;
    const nextDraft = appendPolygonDraftPoint(currentDraft, point);
    setEnvironmentPolygonDraft(nextDraft);
    environmentPolygonDraftRef.current = nextDraft;
  };

  const updateDrawingPolygonDraft = (point: Point) => {
    const currentDraft = drawingPolygonDraftRef.current;
    const nextDraft = appendPolygonDraftPoint(currentDraft, point);
    setDrawingPolygonDraft(nextDraft);
    drawingPolygonDraftRef.current = nextDraft;
  };

  const getToolPoint = (event: React.PointerEvent<HTMLCanvasElement>, snapEnabled = true): Point => {
    const worldPoint = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
    const result = resolveSceneToolPoint(worldPoint, scene, snapEnabled, isSnapModifier(event));
    setSnapPoint(result.snapPoint);
    return result.point;
  };

  const getRulerPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
    if (!scene || !isSnapModifier(event)) {
      return point;
    }
    return getRulerSnapPoint(point, scene) ?? point;
  };

  const getDrawingToolPoint = (event: React.PointerEvent<HTMLCanvasElement>, tool: DrawingTool): Point => {
    const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
    const result = resolveDrawingToolPoint(point, scene, tool !== "freehand", isSnapModifier(event));
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
    if (!scene || !onSceneChange || !draft || !isMeaningfulPolygon(draft.points)) {
      return;
    }
    polygonDraftRef.current = null;
    setPolygonDraft(null);
    onSceneChange(
      addSceneFogShape(
        scene,
        getFogShapeFromPolygonDraft(
          draft,
          crypto.randomUUID(),
          formatDefaultFogShapeName(draft.operation, "polygon", scene.fog.shapes.length),
          scene.fog.newShapesVisibleInPlayer
        ),
        getFogVisibilityPatchForNewShape(scene.fog, draft.operation)
      )
    );
  };

  const commitDrawingPolygonDraft = () => {
    const draft = drawingPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft || !isMeaningfulPolygon(draft.points)) {
      return;
    }
    drawingPolygonDraftRef.current = null;
    setDrawingPolygonDraft(null);
    onSceneChange(
      addSceneDrawing(
        scene,
        getDrawingPolygonElementFromDraft(draft.points, crypto.randomUUID(), scene.drawings.length, {
          color: drawingColor,
          opacity: drawingOpacity,
          fillColor: drawingFillColor,
          fillOpacity: drawingFillOpacity,
          strokeStyle: drawingStrokeStyle,
          strokeWidth: drawingStrokeWidth
        })
      )
    );
  };

  const commitWeatherPolygonDraft = () => {
    const draft = weatherPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft || !isMeaningfulPolygon(draft.points)) {
      return;
    }
    weatherPolygonDraftRef.current = null;
    setWeatherPolygonDraft(null);
    onSceneChange(
      addSceneWeatherMask(
        scene,
        getWeatherMaskFromPolygonDraft(
          draft,
          crypto.randomUUID(),
          formatDefaultWeatherMaskName(scene.weather.masks.length)
        )
      )
    );
  };

  const commitEnvironmentPolygonDraft = () => {
    const draft = environmentPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft || !isMeaningfulPolygon(draft.points)) {
      return;
    }
    environmentPolygonDraftRef.current = null;
    setEnvironmentPolygonDraft(null);
    onSceneChange(
      addEnvironmentEffect(
        scene,
        getEnvironmentEffectFromPolygonDraft(
          draft,
          crypto.randomUUID(),
          formatDefaultEnvironmentEffectName(environmentEffectType, scene.environment.effects.length),
          environmentEffectType,
          environmentEffectFeather,
          currentEnvironmentEffectTuning
        )
      )
    );
  };

  usePolygonDraftKeyboard({
    active: Boolean(polygonDraft),
    onCancel: () => {
      setPolygonDraft(null);
      polygonDraftRef.current = null;
    },
    onCommit: commitPolygonDraft
  });

  usePolygonDraftKeyboard({
    active: Boolean(drawingPolygonDraft),
    onCancel: () => {
      setDrawingPolygonDraft(null);
      drawingPolygonDraftRef.current = null;
    },
    onCommit: commitDrawingPolygonDraft
  });

  usePolygonDraftKeyboard({
    active: Boolean(weatherPolygonDraft),
    onCancel: () => {
      setWeatherPolygonDraft(null);
      weatherPolygonDraftRef.current = null;
    },
    onCommit: commitWeatherPolygonDraft
  });

  usePolygonDraftKeyboard({
    active: Boolean(environmentPolygonDraft),
    onCancel: () => {
      setEnvironmentPolygonDraft(null);
      environmentPolygonDraftRef.current = null;
    },
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

  const showMapOverlay = mapOverlayActive;
  const mapOverlayMessage = getMapOverlayMessage(mapLoadStatus, mapAsset?.mediaType);
  const activeCalibrationBox = onMapCalibrationBox ? mapCalibrationDraftBox : null;
  const activeCalibrationBoxCamera = getRenderCamera(camera, playerDisplayScale);
  const calibrationSizeControlStyle =
    activeCalibrationBox && onMapCalibrationBox
      ? {
          left: activeCalibrationBox.x * activeCalibrationBoxCamera.zoom + activeCalibrationBoxCamera.x + activeCalibrationBox.width * activeCalibrationBoxCamera.zoom + 12,
          top: activeCalibrationBox.y * activeCalibrationBoxCamera.zoom + activeCalibrationBoxCamera.y
        }
      : undefined;

  return (
    <div ref={frameRef} className={className ?? "scene-canvas-frame"}>
      {isVideoMap &&
        videoUrls.map((videoUrl, index) => (
          (index === activeVideoIndex || index === preparedVideoIndex) && (
            <video
              key={videoUrl}
              ref={(element) => {
                videoRefs.current[index] = element;
              }}
              className="scene-video-map"
              src={videoUrl}
              data-map-asset-id={mapAsset?.id ?? ""}
              muted={videoMuted}
              autoPlay={index === activeVideoIndex && !videoPaused}
              playsInline
              preload="auto"
              style={{
                opacity: index === activeVideoIndex ? (mapLayer?.opacity ?? 1) : 0,
                transform: getVideoTransform(getRenderCamera(camera, playerDisplayScale), scene)
              }}
              onCanPlay={(event) => {
                setMapLoadStatus("ready");
                fitGmCameraToVideoMap(event.currentTarget);
                playActiveWhenReady(index);
              }}
              onLoadedMetadata={(event) => {
                fitGmCameraToVideoMap(event.currentTarget);
              }}
              onLoadedData={(event) => {
                setMapLoadStatus("ready");
                fitGmCameraToVideoMap(event.currentTarget);
              }}
              onPlaying={(event) => {
                setMapLoadStatus("ready");
                fitGmCameraToVideoMap(event.currentTarget);
              }}
              onError={(event) => {
                const video = event.currentTarget;
                if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                  setMapLoadStatus("ready");
                  return;
                }
                window.setTimeout(() => {
                  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                    setMapLoadStatus("ready");
                    return;
                  }
                  if (index === activeVideoIndex) {
                    setMapLoadStatus((status) => (status === "ready" ? status : "error"));
                  }
                }, 180);
              }}
              onPause={() => recoverUnexpectedPause(index)}
            />
          )
        ))}
      <canvas
        ref={canvasRef}
        className={`scene-canvas ${getCanvasInteractionClass({ canvasTool, mouseBehavior, drawingTool, fogTool, weatherMaskTool, environmentEffectTool, isPanning, tokenDragPreview, drawingTransformHover, sceneItemHover })}`}
        onWheel={onWheel}
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
      {mode === "gm" && fogTool && (
        <FogToolStatusStrip fogTool={fogTool} polygonPointCount={polygonDraft?.points.length ?? 0} brushSize={activeFogBrushSize} />
      )}
      {mode === "gm" && drawingTool && <DrawingToolStatusStrip drawingTool={drawingTool} drawingTemplateSize={drawingTemplateSize} />}
      {mode === "gm" && onMapCalibrationBox && <MapCalibrationStatusStrip />}
      {mode === "gm" && onMapCalibrationBox && activeCalibrationBox && calibrationSizeControlStyle && (
        <label className="map-calibration-size-control" style={calibrationSizeControlStyle} onPointerDown={(event) => event.stopPropagation()}>
          Size
          <input
            type="number"
            min={4}
            step={1}
            value={Math.round(activeCalibrationBox.width)}
            onChange={(event) => {
              const size = Math.max(4, Number(event.target.value));
              setMapCalibrationDraftBox({ ...activeCalibrationBox, width: size, height: size });
            }}
          />
        </label>
      )}
      {mode === "gm" && onMapCalibrationBox && mapCalibrationDraftBox && (
        <div className="map-calibration-actions" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => onMapCalibrationBox(mapCalibrationDraftBox)}>
            Confirm
          </button>
          <button
            type="button"
            onClick={() => {
              setMapCalibrationDraftBox(null);
              onMapCalibrationCancel?.();
            }}
          >
            Cancel
          </button>
        </div>
      )}
      {mode === "gm" && canvasTool === "ruler" && <RulerStatusStrip rulerDrag={rulerDrag} scene={scene} />}
      {mode === "gm" && (canvasTool === "ping" || canvasTool === "laser") && <TableToolStatusStrip canvasTool={canvasTool} />}
      {mode === "gm" && weatherMaskTool && <WeatherMaskStatusStrip weatherMaskTool={weatherMaskTool} pointCount={weatherPolygonDraft?.points.length ?? 0} />}
      {mode === "gm" && environmentEffectTool && <EnvironmentEffectStatusStrip environmentEffectTool={environmentEffectTool} effect={environmentEffectType} pointCount={environmentPolygonDraft?.points.length ?? 0} />}
      {mode === "gm" && tokenDragPreview && <TokenMoveStatusStrip scene={scene} tokenDragPreview={tokenDragPreview} />}
      <Suspense fallback={null}>
        <DiceRollOverlay events={liveTableEvents.filter((event) => isVisibleDiceOverlayEvent(event, mode))} mode={mode} onDiceRollResolved={onDiceRollResolved} />
      </Suspense>
      {mode === "player" && scene && <TurnOrderPlayerBar scene={scene} campaign={campaign} />}
      {mode === "player" && scene && showPlayerSeatIndicators && <PlayerSeatIndicators campaign={campaign} />}
      {mode === "player" && scene && <PlayerTurnStatusIndicators scene={scene} campaign={campaign} />}
      {mode === "gm" && tokenContextMenu && scene && (() => {
        const token = scene.tokens.find((candidate) => candidate.id === tokenContextMenu.tokenId);
        if (!token) {
          return null;
        }
        return (
          <div
            className="token-settings-menu canvas-context-menu"
            style={{ left: tokenContextMenu.x, top: tokenContextMenu.y }}
            role="menu"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="canvas-context-menu-title" title={tokenContextMenu.tokenName}>{tokenContextMenu.tokenName}</div>
            <div className="control-divider" />
            <TokenSettings
              token={token}
              gridSize={scene.grid.sizePx}
              gridType={scene.grid.type}
              onUpdateToken={(patch) => {
                if (!onSceneChange) {
                  return;
                }
                onSceneChange(patchSceneToken(scene, token.id, patch));
              }}
              onOpenTokenColor={(tokenId, value, kind) => {
                onOpenTokenColor?.(tokenId, value, kind);
                setTokenContextMenu(null);
              }}
            />
            <div className="control-divider" />
            <button
              type="button"
              className="token-menu-action"
              role="menuitem"
              title={`Add ${tokenContextMenu.tokenName} to Turn Order`}
              aria-label={`Add ${tokenContextMenu.tokenName} to Turn Order`}
              onClick={() => {
                onAddTokenToTurnOrder?.(tokenContextMenu.tokenId);
                setTokenContextMenu(null);
              }}
            >
              <ListPlus size={14} aria-hidden="true" />
              <span>Add to Turn Order</span>
            </button>
            <button
              type="button"
              className="token-menu-action"
              role="menuitem"
              title={`Duplicate ${tokenContextMenu.tokenName}`}
              aria-label={`Duplicate ${tokenContextMenu.tokenName}`}
              onClick={() => {
                if (!onSceneChange) {
                  setTokenContextMenu(null);
                  return;
                }
                const result = duplicateSceneToken(scene, token.id, crypto.randomUUID());
                if (!result.duplicatedTokenId) {
                  setTokenContextMenu(null);
                  return;
                }
                onSceneChange(result.scene);
                onSelectToken?.(result.duplicatedTokenId);
                setTokenContextMenu(null);
              }}
            >
              <Copy size={14} aria-hidden="true" />
              <span>Duplicate</span>
            </button>
            <button
              type="button"
              className="token-menu-action token-menu-delete"
              role="menuitem"
              title={`Delete ${tokenContextMenu.tokenName}`}
              aria-label={`Delete ${tokenContextMenu.tokenName}`}
              onClick={() => {
                if (!onSceneChange) {
                  setTokenContextMenu(null);
                  return;
                }
                onSceneChange(removeSceneToken(scene, token.id));
                onSelectToken?.(null);
                setTokenContextMenu(null);
              }}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Delete</span>
            </button>
          </div>
        );
      })()}
      {mode === "gm" && maskContextMenu && (
        <div
          className="token-settings-menu canvas-context-menu"
          style={{ left: maskContextMenu.x, top: maskContextMenu.y }}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="canvas-context-menu-title" title={maskContextMenu.label}>{maskContextMenu.label}</div>
          <div className="control-divider" />
          <div className="settings-grid">
            <label className="setting-row">
              <span>{maskContextMenu.kind === "fog" ? "Player View" : "Mask"}</span>
              <label
                className="fog-operation-switch"
                title={
                  maskContextMenu.kind === "fog"
                    ? `${maskContextMenu.visibleInPlayer ? "Hide" : "Show"} ${maskContextMenu.label} on Player View`
                    : `${maskContextMenu.visible ? "Hide" : "Show"} ${maskContextMenu.label}`
                }
              >
                <span>Show</span>
                <input
                  aria-label={
                    maskContextMenu.kind === "fog"
                      ? `${maskContextMenu.visibleInPlayer ? "Hide" : "Show"} ${maskContextMenu.label} on Player View`
                      : `${maskContextMenu.visible ? "Hide" : "Show"} ${maskContextMenu.label}`
                  }
                  type="checkbox"
                  checked={maskContextMenu.kind === "fog" ? !maskContextMenu.visibleInPlayer : !maskContextMenu.visible}
                  onChange={(event) => {
                    if (!scene || !onSceneChange) {
                      setMaskContextMenu(null);
                      return;
                    }
                    if (maskContextMenu.kind === "fog") {
                      const nextVisibleInPlayer = !event.target.checked;
                      onSceneChange(setFogShapePlayerVisibility(scene, maskContextMenu.shapeId, nextVisibleInPlayer));
                    } else {
                      const nextVisible = !event.target.checked;
                      onSceneChange(setWeatherMaskVisibility(scene, maskContextMenu.maskId, nextVisible));
                    }
                    setMaskContextMenu(null);
                  }}
                />
                <span>Hide</span>
              </label>
            </label>
          </div>
        </div>
      )}
      {mode === "gm" && drawingContextMenu && (
        <div
          className="token-settings-menu canvas-context-menu"
          style={{ left: drawingContextMenu.x, top: drawingContextMenu.y }}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="canvas-context-menu-title" title={drawingContextMenu.label}>{drawingContextMenu.label}</div>
          <div className="control-divider" />
          <div className="settings-grid">
            {drawingContextMenu.isTemplate && (
              <label className="setting-row">
                <span>Footprint</span>
                <label className="fog-operation-switch" title={`${drawingContextMenu.templateFootprintVisible ? "Hide" : "Show"} ${drawingContextMenu.label} grid footprint`}>
                  <span>Show</span>
                  <input
                    aria-label={`${drawingContextMenu.templateFootprintVisible ? "Hide" : "Show"} ${drawingContextMenu.label} grid footprint`}
                    type="checkbox"
                    checked={!drawingContextMenu.templateFootprintVisible}
                    onChange={(event) => {
                      if (!scene || !onSceneChange) {
                        setDrawingContextMenu(null);
                        return;
                      }
                      onSceneChange(setDrawingTemplateFootprintVisibility(scene, drawingContextMenu.drawingId, !event.target.checked));
                      setDrawingContextMenu(null);
                    }}
                  />
                  <span>Hide</span>
                </label>
              </label>
            )}
            <label className="setting-row">
              <span>Player View</span>
              <label className="fog-operation-switch" title={`${drawingContextMenu.visibleInPlayer ? "Hide" : "Show"} ${drawingContextMenu.label} on Player View`}>
                <span>Show</span>
                <input
                  aria-label={`${drawingContextMenu.visibleInPlayer ? "Hide" : "Show"} ${drawingContextMenu.label} on Player View`}
                  type="checkbox"
                  checked={!drawingContextMenu.visibleInPlayer}
                  onChange={(event) => {
                    if (!scene || !onSceneChange) {
                      setDrawingContextMenu(null);
                      return;
                    }
                    onSceneChange(setDrawingPlayerVisibility(scene, drawingContextMenu.drawingId, !event.target.checked));
                    setDrawingContextMenu(null);
                  }}
                />
                <span>Hide</span>
              </label>
            </label>
          </div>
          <div className="control-divider" />
          <button
            type="button"
            role="menuitem"
            className="token-menu-action"
            title={`Duplicate ${drawingContextMenu.label}`}
            aria-label={`Duplicate ${drawingContextMenu.label}`}
            onClick={() => {
              if (!scene || !onSceneChange) {
                setDrawingContextMenu(null);
                return;
              }
              const result = duplicateSceneDrawing(scene, drawingContextMenu.drawingId, crypto.randomUUID(), drawingContextMenu.label);
              if (!result.duplicatedDrawingId) {
                setDrawingContextMenu(null);
                return;
              }
              onSceneChange(result.scene);
              onSelectDrawing?.(result.duplicatedDrawingId);
              setDrawingContextMenu(null);
            }}
          >
            <Copy size={14} aria-hidden="true" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="token-menu-action token-menu-delete"
            title={`Delete ${drawingContextMenu.label}`}
            aria-label={`Delete ${drawingContextMenu.label}`}
            onClick={() => {
              if (!scene || !onSceneChange) {
                setDrawingContextMenu(null);
                return;
              }
              onSceneChange(removeSceneDrawing(scene, drawingContextMenu.drawingId));
              onSelectDrawing?.(null);
              setDrawingContextMenu(null);
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>
      )}
      {mode === "gm" && environmentEffectContextMenu && (
        <div
          className="token-settings-menu canvas-context-menu"
          style={{ left: environmentEffectContextMenu.x, top: environmentEffectContextMenu.y }}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="canvas-context-menu-title" title={environmentEffectContextMenu.label}>{environmentEffectContextMenu.label}</div>
          <div className="control-divider" />
          <button
            type="button"
            role="menuitem"
            className="token-menu-action"
            title={`Edit ${environmentEffectContextMenu.label}`}
            aria-label={`Edit ${environmentEffectContextMenu.label}`}
            onClick={() => {
              onSelectEnvironmentEffect?.(environmentEffectContextMenu.effectId);
              onEditEnvironmentEffect?.(environmentEffectContextMenu.effectId);
              setEnvironmentEffectContextMenu(null);
            }}
          >
            <Settings2 size={14} aria-hidden="true" />
            <span>Edit Effect</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="token-menu-action token-menu-delete"
            title={`Delete ${environmentEffectContextMenu.label}`}
            aria-label={`Delete ${environmentEffectContextMenu.label}`}
            onClick={() => {
              if (!scene || !onSceneChange) {
                return;
              }
              onSceneChange(removeEnvironmentEffect(scene, environmentEffectContextMenu.effectId));
              onSelectEnvironmentEffect?.(null);
              setEnvironmentEffectContextMenu(null);
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>
      )}
      {showMapOverlay && <MapLoadOverlay message={mapOverlayMessage} showSpinner={mapLoadStatus === "loading"} />}
      {mode === "gm" && showVideoDiagnostics && isVideoMap && videoDebug && <div className="video-debug">{videoDebug}</div>}
    </div>
  );
}


