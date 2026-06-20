import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Copy, ListPlus, Settings2, Trash2 } from "lucide-react";
import { DEFAULT_TABLE_TOOLS, DEFAULT_VIDEO_PLAYBACK, formatDefaultDrawingName, formatDefaultFogShapeName } from "../../shared/localvtt";
import type { Asset, Campaign, DrawingElement, DrawingStrokeStyle, DrawingTemplateEffect, EnvironmentEffectMask, EnvironmentEffectType, LiveTableEvent, LiveTablePoint, Point, Scene, TableToolSettings, Token, WeatherMask } from "../../shared/localvtt";
import { getEnvironmentEffectBounds, getPointBounds, getWeatherMaskBounds } from "../canvas/boundsGeometry";
import { getRenderCamera, type Camera } from "../canvas/camera";
import { getCanvasInteractionClass, type DrawingResizeHandle, type DrawingTransformHover } from "../canvas/canvasInteraction";
import {
  drawDrawings,
  getDrawingBounds,
  getDrawingPreviewPoints,
  getDrawingAtPoint,
  isMeaningfulDrawingPreview,
  shouldAddDrawingPoint,
  type DrawingPointOverrides,
  type DrawingPreview,
  type DrawingTool
} from "../canvas/drawingRenderer";
import {
  drawFog,
  getFogDragKindForTool,
  getFogOperationForTool,
  isMeaningfulFogDrag,
  isMeaningfulPolygon,
  isPolygonTool,
  normalizeBrushPoints,
  shouldAddBrushPoint,
  type FogDrag,
  type FogPolygonDraft,
  type FogTool
} from "../canvas/fogRenderer";
import { drawHexGrid, drawSquareGrid } from "../canvas/gridRenderer";
import { getNearestSquareGridSnapPoint } from "../canvas/gridMath";
import {
  drawLiveTableEvents,
  hasActiveLiveTableEvents,
  LASER_MIN_POINT_DISTANCE,
  LASER_POINT_LIFETIME_MS,
  RULER_RELEASE_LINGER_MS
} from "../canvas/liveTableRenderer";
import { drawMapSource, resolveMapTransform } from "../canvas/mapRenderer";
import {
  drawRuler,
  formatMeasurementDistance,
  getMeasurementDistance,
  getMeasurementPathDistance,
  getRulerPathPoints,
  getStraightLineMeasurementDistance,
  type RulerDrag,
  type RulerLabel
} from "../canvas/measurement";
import { getPointAlongPath } from "../canvas/movementPath";
import {
  isDrawingInSelectionRect,
  isFogShapeInSelectionRect,
  isTokenInSelectionRect,
  isWeatherMaskInSelectionRect,
  pointsToSelectionRect
} from "../canvas/selectionGeometry";
import { drawSelectionBox } from "../canvas/selectionRenderer";
import {
  formatDefaultTemplateDrawingName,
  getDrawingKindForTool,
  getDrawingTemplateCurrentPoint,
  getTemplatePreviewDrawing,
  isTemplateDrawingTool
} from "../canvas/templateDrawing";
import { distanceBetween, getNearestGridCellCenter, getNearestHexCenter, getNearestHexVertex, getSnappedTokenPosition, getTokenAtPoint, isPointInsideFogShape } from "../canvas/tokenGeometry";
import {
  getTokenMovementPath,
  getTokenMovementTweens,
  getTokenWaypointPosition,
  isDuplicateTokenWaypoint
} from "../canvas/tokenMovement";
import { drawTokenDragHighlights, drawTokens, type TokenDragPreview, type TokenPositionOverrides } from "../canvas/tokenRenderer";
import { getVideoTransform } from "../canvas/videoMap";
import {
  DEFAULT_ACID_EFFECT_TUNING,
  DEFAULT_ARCANE_EFFECT_TUNING,
  DEFAULT_CHAOS_EFFECT_TUNING,
  DEFAULT_COLD_EFFECT_TUNING,
  DEFAULT_DARKNESS_EFFECT_TUNING,
  DEFAULT_DISTORTION_EFFECT_TUNING,
  DEFAULT_FOG_EFFECT_TUNING,
  DEFAULT_FORCE_FIELD_EFFECT_TUNING,
  DEFAULT_FIRE_EFFECT_TUNING,
  DEFAULT_LAVA_EFFECT_TUNING,
  DEFAULT_LIGHTNING_EFFECT_TUNING,
  DEFAULT_NATURE_EFFECT_TUNING,
  DEFAULT_POISON_EFFECT_TUNING,
  DEFAULT_RADIANT_EFFECT_TUNING,
  DEFAULT_SHOCKWAVE_EFFECT_TUNING,
  DEFAULT_SMOKE_EFFECT_TUNING,
  DEFAULT_VOID_EFFECT_TUNING,
  DEFAULT_WATER_EFFECT_TUNING,
  drawEnvironmentAcidEffect,
  drawEnvironmentArcaneEffect,
  drawEnvironmentChaosEffect,
  drawEnvironmentColdEffect,
  drawEnvironmentDarknessEffect,
  drawEnvironmentDistortionEffect,
  drawEnvironmentFogEffect,
  drawEnvironmentForceFieldEffect,
  drawEnvironmentFireEffect,
  drawEnvironmentLavaEffect,
  drawEnvironmentLightningEffect,
  drawEnvironmentNatureEffect,
  drawEnvironmentPoisonEffect,
  drawEnvironmentRadiantEffect,
  drawEnvironmentShockwaveEffect,
  drawEnvironmentSmokeEffect,
  drawEnvironmentVoidEffect,
  drawEnvironmentWaterEffect,
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
import { drawWeather, shouldAnimateWeather } from "../canvas/weatherRenderer";
import { useVideoMapPlayback } from "../hooks/useVideoMapPlayback";
import { duplicateDrawingElement } from "../lib/drawingDefaults";
import { TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../lib/dragTypes";
import {
  formatEnvironmentEffectOptionLabel as formatEnvironmentEffectLabel,
  getEnvironmentEffectPreviewFill,
  getEnvironmentEffectStroke
} from "../lib/environmentEffectOptions";
import { duplicateToken } from "../lib/tokenDefaults";
import { TokenSettings } from "./layers/TokenSettings";
import type { DrawingTemplateSize, EnvironmentEffectTool, MouseBehavior, SelectorSelectionFilters, WeatherMaskTool } from "./tools/ToolsMenu";
import {
  FOG_GRID_SNAP_HINT,
  getDrawingToolHint,
  getDrawingToolLabel,
  RULER_CLEAR_HINT,
  RULER_GRID_SNAP_HINT,
  SHIFT_WAYPOINT_HINT,
  TOKEN_MOVE_COMPLETE_HINT,
  getFogToolHint,
  getFogToolLabel
} from "../lib/toolCopy";

const DiceRollOverlay = lazy(() => import("./dice/DiceRollOverlay").then((module) => ({ default: module.DiceRollOverlay })));
const WEATHER_ONLY_FRAME_INTERVAL_MS = 50;
const LARGE_MAP_CACHE_MAX_EDGE = 4096;
const LARGE_MAP_CACHE_MAX_PIXELS = 16_000_000;
const GM_FULL_QUALITY_MAP_SCALE_THRESHOLD = 1.12;

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

interface LoadedMap {
  assetId: string;
  originalSource: HTMLImageElement;
  optimizedSource: CanvasImageSource | null;
  sourceWidth: number;
  sourceHeight: number;
  optimizedScale: number;
  animate: boolean;
  mediaType: "image" | "video";
  ready: boolean;
}

interface ReadyMapSource {
  source: CanvasImageSource;
  width: number;
  height: number;
}

type MapLoadStatus = "idle" | "loading" | "ready" | "error";

type TokenDragState = {
  pointerId: number;
  tokenId: string;
  offset: Point;
  startPosition: Point;
  waypoints: Point[];
  groupStartPositions: Map<string, Point>;
};

type DrawingDragState = {
  pointerId: number;
  drawingId: string;
  start: Point;
  snapAnchor: Point;
  groupStartPoints: DrawingPointOverrides;
};

type DrawingResizeState = {
  pointerId: number;
  handle: DrawingResizeHandle;
  bounds: { left: number; top: number; right: number; bottom: number };
  groupStartPoints: DrawingPointOverrides;
};

type DrawingRotateState = {
  pointerId: number;
  center: Point;
  startAngle: number;
  groupStartPoints: DrawingPointOverrides;
};

type LaserDragState = {
  pointerId: number;
  eventId: string;
  points: LiveTablePoint[];
};

type WeatherMaskDrag = {
  pointerId: number;
  kind: WeatherMaskTool;
  start: Point;
  current: Point;
};

type EnvironmentEffectDrag = {
  pointerId: number;
  kind: EnvironmentEffectTool;
  effect: EnvironmentEffectType;
  feather: number;
  acidTuning?: AcidEffectTuning;
  coldTuning?: ColdEffectTuning;
  darknessTuning?: DarknessEffectTuning;
  poisonTuning?: PoisonEffectTuning;
  waterTuning?: WaterEffectTuning;
  lavaTuning?: LavaEffectTuning;
  fireTuning?: FireEffectTuning;
  lightningTuning?: LightningEffectTuning;
  arcaneTuning?: ArcaneEffectTuning;
  chaosTuning?: ChaosEffectTuning;
  voidTuning?: VoidEffectTuning;
  natureTuning?: NatureEffectTuning;
  distortionTuning?: DistortionEffectTuning;
  radiantTuning?: RadiantEffectTuning;
  fieldTuning?: ForceFieldEffectTuning;
  shockwaveTuning?: ShockwaveEffectTuning;
  smokeTuning?: SmokeEffectTuning;
  fogTuning?: FogEffectTuning;
  start: Point;
  current: Point;
};

type WeatherPolygonDraft = {
  points: Point[];
  current?: Point;
};

type SelectionMode = "replace" | "add" | "subtract";

type SelectionDrag = {
  pointerId: number;
  start: Point;
  current: Point;
  mode: SelectionMode;
};

type DrawingPolygonDraft = {
  points: Point[];
  current?: Point;
};

type MapCalibrationBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MapCalibrationDrag = {
  pointerId: number;
  mode: "draw" | "move" | "resize";
  start: Point;
  current: Point;
  box?: MapCalibrationBox;
  offset?: Point;
};

type TokenImageSource = {
  id: string;
  path: string;
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

const ENVIRONMENT_FEATHER_MASK_CACHE_LIMIT = 80;
const environmentFeatherMaskCache = new Map<string, HTMLCanvasElement>();

function parseTokenImageSourceKey(key: string): TokenImageSource[] {
  try {
    const parsed = JSON.parse(key);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (source): source is TokenImageSource =>
        typeof source?.id === "string" && source.id.length > 0 && typeof source?.path === "string" && source.path.length > 0
    );
  } catch {
    return [];
  }
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
  selectedFogShapeIds = [],
  selectedWeatherMaskIds = [],
  selectedDrawingIds = [],
  selectedTokenIds = [],
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
  const [environmentPolygonDraft, setEnvironmentPolygonDraft] = useState<WeatherPolygonDraft | null>(null);
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
  const environmentPolygonDraftRef = useRef<WeatherPolygonDraft | null>(null);
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
    // Keep image loading keyed by asset identity, not token presentation/position changes.
    return [...new Set(scene?.tokens.map((token) => token.assetId).filter(Boolean) ?? [])].join("|");
  }, [scene?.tokens]);

  const tokenAssets = useMemo(() => {
    if (!campaignAssets) {
      return [];
    }
    const assetsById = new Map(campaignAssets.map((asset) => [asset.id, asset]));
    return tokenAssetIds
      .split("|")
      .filter(Boolean)
      .map((assetId) => assetsById.get(assetId) ?? null)
      .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset?.absolutePath));
  }, [campaignAssets, tokenAssetIds]);

  const tokenImageSourceKey = useMemo(() => {
    const sources = tokenAssets
      .map((asset) => ({
        id: asset.id,
        path: asset.thumbnailAbsolutePath ?? asset.absolutePath
      }))
      .filter((source): source is TokenImageSource => Boolean(source.path));
    return JSON.stringify(sources);
  }, [tokenAssets]);

  const mapLayer = scene?.layers.find((layer) => layer.id === "map");
  const gridLayer = scene?.layers.find((layer) => layer.id === "grid");
  const fogLayer = scene?.layers.find((layer) => layer.id === "fog");
  const drawingLayer = scene?.layers.find((layer) => layer.id === "drawing");
  const weatherLayer =
    scene?.layers.find((layer) => layer.id === "effects") ??
    scene?.layers.find((layer) => layer.id === "weather");
  const tokenLayer = scene?.layers.find((layer) => layer.id === "token");
  const canShowMap = mode === "gm" ? mapLayer?.visibleInGm : mapLayer?.visibleInPlayer;
  const canShowGrid = mode === "gm" ? gridLayer?.visibleInGm : gridLayer?.visibleInPlayer;
  const canShowFog = mode === "gm" ? fogLayer?.visibleInGm : fogLayer?.visibleInPlayer;
  const canShowDrawings = mode === "gm" ? drawingLayer?.visibleInGm : drawingLayer?.visibleInPlayer;
  const canShowWeather = mode === "gm" ? weatherLayer?.visibleInGm : weatherLayer?.visibleInPlayer;
  const canShowTokens = mode === "gm" ? tokenLayer?.visibleInGm : tokenLayer?.visibleInPlayer;
  const isVideoMap = Boolean(canShowMap && mapAsset?.mediaType === "video" && assetUrl);
  const mapOverlayActive = Boolean(canShowMap && mapAsset && (mapLoadStatus === "loading" || mapLoadStatus === "error"));
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

  const requiredTokenAssetIds = useMemo(() => parseTokenImageSourceKey(tokenImageSourceKey).map((source) => source.id), [tokenImageSourceKey]);
  const tokensReady = !canShowTokens || requiredTokenAssetIds.every((assetId) => loadedTokenImages.has(assetId) || failedTokenImageIds.has(assetId));
  const mapReady =
    !canShowMap ||
    !mapAsset ||
    mapLoadStatus === "ready" ||
    mapLoadStatus === "error";

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
    fogDragRef.current = null;
    drawingPreviewRef.current = null;
    setFogPreview(null);
    setDrawingPreview(null);
    onTemplatePreviewChange?.(null);
    setDrawingPolygonDraft(null);
    setWeatherPolygonDraft(null);
    setEnvironmentPolygonDraft(null);
    setBrushHoverPoint(null);
    setSnapPoint(null);
    setSceneItemHover(false);
  }, [fogTool, onTemplatePreviewChange, scene?.id]);

  useEffect(() => {
    drawingPreviewRef.current = null;
    setDrawingPreview(null);
    onTemplatePreviewChange?.(null);
    setBrushHoverPoint(null);
    setSnapPoint(null);
  }, [drawingTool, onTemplatePreviewChange, scene?.id]);

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
    weatherMaskDragRef.current = null;
    setWeatherMaskPreview(null);
    environmentEffectDragRef.current = null;
    setEnvironmentEffectPreview(null);
    setIsPanning(false);
    selectionDragRef.current = null;
    setSelectionDrag(null);
    setSnapPoint(null);
    setBrushHoverPoint(null);
  }, [mode, scene?.id]);

  useEffect(() => {
    weatherMaskDragRef.current = null;
    setWeatherMaskPreview(null);
    weatherPolygonDraftRef.current = null;
    setWeatherPolygonDraft(null);
  }, [weatherMaskTool, scene?.id]);

  useEffect(() => {
    environmentEffectDragRef.current = null;
    setEnvironmentEffectPreview(null);
    environmentPolygonDraftRef.current = null;
    setEnvironmentPolygonDraft(null);
  }, [environmentEffectTool, scene?.id]);

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
    if (!polygonDraft) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPolygonDraft(null);
        polygonDraftRef.current = null;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        commitPolygonDraft();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // Polygon draft state is mirrored in polygonDraftRef so the handler can commit the latest draft without re-subscribing to commitPolygonDraft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygonDraft, scene]);

  useEffect(() => {
    if (!drawingPolygonDraft) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawingPolygonDraft(null);
        drawingPolygonDraftRef.current = null;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        commitDrawingPolygonDraft();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // Drawing polygon draft state is mirrored in drawingPolygonDraftRef so the handler can commit the latest draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingPolygonDraft, scene]);

  useEffect(() => {
    if (!weatherPolygonDraft) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setWeatherPolygonDraft(null);
        weatherPolygonDraftRef.current = null;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        commitWeatherPolygonDraft();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // Weather polygon draft state is mirrored in weatherPolygonDraftRef so the handler can commit without re-subscribing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherPolygonDraft, scene]);

  useEffect(() => {
    if (!environmentPolygonDraft) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setEnvironmentPolygonDraft(null);
        environmentPolygonDraftRef.current = null;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        commitEnvironmentPolygonDraft();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // Environment polygon draft state is mirrored in environmentPolygonDraftRef so the handler can commit without re-subscribing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environmentPolygonDraft, scene]);

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
      cancelFogDrag();
      environmentEffectDragRef.current = null;
      setEnvironmentEffectPreview(null);
      clearDrawingPreview();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelRulerDrag, clearDrawingPreview, drawingDragPreview, drawingPreview, environmentEffectPreview, fogPreview, mode, rulerDrag, tokenDragPreview]);

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
      setMapLoadStatus(mapAsset?.mediaType === "video" && assetUrl ? "loading" : "idle");
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
        drawTokens(ctx, scene, loadedTokenImages, mode, selectedTokenIds.length > 0 ? selectedTokenIds : selectedTokenId, tokenDragPreview, playerTokenTweenPositionsRef.current, renderCamera.zoom);
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
          selectedDrawingIds.length > 0 ? selectedDrawingIds : selectedDrawingId,
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
        drawFog(ctx, scene, width, height, renderCamera, mode, fogPreview, polygonDraft, selectedFogShapeIds.length > 0 ? selectedFogShapeIds : selectedFogShapeId);
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
        const weatherMaskSelection = selectedWeatherMaskIds.length > 0 ? selectedWeatherMaskIds : selectedWeatherMaskId ? [selectedWeatherMaskId] : [];
        for (const selectedWeatherMask of scene.weather.masks.filter((mask) => weatherMaskSelection.includes(mask.id) && (mask.visible ?? true))) {
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
      if (mode === "gm" && canShowDrawings && !drawingDragPreview && selectedDrawingIds.length > 0) {
        drawDrawingResizeHandles(ctx, scene.drawings, selectedDrawingIds, renderCamera);
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
        (Boolean(selectedDrawingId) ||
          selectedDrawingIds.length > 0 ||
          Boolean(selectedFogShapeId) ||
          selectedFogShapeIds.length > 0 ||
          Boolean(selectedTokenId) ||
          selectedTokenIds.length > 0 ||
          Boolean(selectedWeatherMaskId) ||
          selectedWeatherMaskIds.length > 0);
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
      (Boolean(selectedDrawingId) ||
        selectedDrawingIds.length > 0 ||
        Boolean(selectedFogShapeId) ||
        selectedFogShapeIds.length > 0 ||
        Boolean(selectedTokenId) ||
        selectedTokenIds.length > 0 ||
        Boolean(selectedWeatherMaskId) ||
        selectedWeatherMaskIds.length > 0);
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
  }, [acidEffectTuning, activeFogBrushSize, activeTableTools, activeVideoIndex, arcaneEffectTuning, brushHoverPoint, camera, canShowDrawings, canShowFog, canShowGrid, canShowMap, canShowTokens, canShowWeather, chaosEffectTuning, coldEffectTuning, darknessEffectTuning, distortionEffectTuning, drawingColor, drawingDragPreview, drawingFillColor, drawingFillOpacity, drawingLayer?.opacity, drawingOpacity, drawingPolygonDraft, drawingPreview, drawingStrokeStyle, drawingStrokeWidth, drawingTemplateEffect, drawingTemplateWidth, drawingTool, environmentEffectFeather, environmentEffectPreview, environmentEffectTool, environmentPolygonDraft, fireEffectTuning, fitGmCameraToReadyMap, fogEffectTuning, fogPreview, fogTool, forceFieldEffectTuning, isVideoMap, lavaEffectTuning, lightningEffectTuning, liveTableEvents, loadedMap, loadedTokenImages, mapAsset, mapCalibrationBox, mapCalibrationDraftBox, mapCalibrationDrag, mapLayer?.opacity, mapOverlayActive, mode, natureEffectTuning, onMapCalibrationBox, playerDisplayScale, playerTokenTweenPositions, poisonEffectTuning, polygonDraft, radiantEffectTuning, releasedRulerDrag, rulerDrag, scene, selectedDrawingId, selectedDrawingIds, selectedEnvironmentEffectId, selectedFogShapeId, selectedFogShapeIds, selectedTokenId, selectedTokenIds, selectedWeatherMaskId, selectedWeatherMaskIds, selectionDrag, shockwaveEffectTuning, smokeEffectTuning, snapPoint, tokenDragPreview, videoRefs, voidEffectTuning, waterEffectTuning, weatherLayer?.opacity, weatherMaskPreview, weatherMaskTool, weatherPolygonDraft]);

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

  const cancelFogDrag = () => {
    fogDragRef.current = null;
    setFogPreview(null);
  };

  const selectFromMarquee = (currentScene: Scene, drag: SelectionDrag) => {
    const rect = pointsToSelectionRect(drag.start, drag.current);
    if (rect.width < 4 && rect.height < 4) {
      return;
    }
    const tokenIds = selectorSelectionFilters.tokens
      ? currentScene.tokens.filter((candidate) => canShowTokens && isTokenInSelectionRect(candidate, rect)).map((token) => token.id)
      : [];
    const drawingIds =
      selectorSelectionFilters.drawings || selectorSelectionFilters.templates
        ? currentScene.drawings
            .filter((candidate) => canShowDrawings && isDrawingInSelectionRect(candidate, rect))
            .filter((drawing) => {
              const isTemplate = Boolean(drawing.measurementLabelVisible);
              return isTemplate ? selectorSelectionFilters.templates : selectorSelectionFilters.drawings;
            })
            .map((drawing) => drawing.id)
        : [];
    const weatherMaskIds = selectorSelectionFilters.weatherMasks
      ? currentScene.weather.masks.filter((candidate) => (candidate.visible ?? true) && isWeatherMaskInSelectionRect(candidate, rect)).map((mask) => mask.id)
      : [];
    const fogShapeIds = selectorSelectionFilters.fogMasks
      ? currentScene.fog.shapes.filter((candidate) => (candidate.visibleInGm ?? candidate.visible ?? true) && isFogShapeInSelectionRect(candidate, rect)).map((shape) => shape.id)
      : [];
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
    const zoomFactor = event.deltaY < 0 ? 1.08 : 0.92;
    const nextZoom = Math.min(6, Math.max(0.08, camera.zoom * zoomFactor));
    const worldX = (mouseX - camera.x) / camera.zoom;
    const worldY = (mouseY - camera.y) / camera.zoom;

    autoFitCameraRef.current = false;
    setCamera({
      zoom: nextZoom,
      x: mouseX - worldX * nextZoom,
      y: mouseY - worldY * nextZoom
    });
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
      const hit = editableBox ? getMapCalibrationBoxHit(point, editableBox, getRenderCamera(camera, playerDisplayScale)) : null;
      let drag: MapCalibrationDrag;
      if (hit === "resize" && editableBox) {
        drag = { pointerId: event.pointerId, mode: "resize", start: { x: editableBox.x, y: editableBox.y }, current: point, box: editableBox };
      } else if (hit === "move" && editableBox) {
        drag = {
          pointerId: event.pointerId,
          mode: "move",
          start: point,
          current: point,
          box: editableBox,
          offset: { x: point.x - editableBox.x, y: point.y - editableBox.y }
        };
      } else {
        drag = { pointerId: event.pointerId, mode: "draw", start: point, current: point };
      }
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
        acidTuning: environmentEffectType === "acid" ? cloneAcidEffectTuning(acidEffectTuning) : undefined,
        coldTuning: environmentEffectType === "cold" ? cloneColdEffectTuning(coldEffectTuning) : undefined,
        darknessTuning: environmentEffectType === "darkness" ? cloneDarknessEffectTuning(darknessEffectTuning) : undefined,
        poisonTuning: environmentEffectType === "poison" ? clonePoisonEffectTuning(poisonEffectTuning) : undefined,
        waterTuning: environmentEffectType === "water" ? cloneWaterEffectTuning(waterEffectTuning) : undefined,
        lavaTuning: environmentEffectType === "lava" ? cloneLavaEffectTuning(lavaEffectTuning) : undefined,
        fireTuning: environmentEffectType === "fire" ? cloneFireEffectTuning(fireEffectTuning) : undefined,
        lightningTuning: environmentEffectType === "electric" ? cloneLightningEffectTuning(lightningEffectTuning) : undefined,
        arcaneTuning: environmentEffectType === "arcane" ? cloneArcaneEffectTuning(arcaneEffectTuning) : undefined,
        chaosTuning: environmentEffectType === "chaos" ? cloneChaosEffectTuning(chaosEffectTuning) : undefined,
        voidTuning: environmentEffectType === "void" ? cloneVoidEffectTuning(voidEffectTuning) : undefined,
        natureTuning: environmentEffectType === "nature" ? cloneNatureEffectTuning(natureEffectTuning) : undefined,
        distortionTuning: environmentEffectType === "distortion" ? cloneDistortionEffectTuning(distortionEffectTuning) : undefined,
        radiantTuning: environmentEffectType === "radiant" ? cloneRadiantEffectTuning(radiantEffectTuning) : undefined,
        fieldTuning: environmentEffectType === "field" ? cloneForceFieldEffectTuning(forceFieldEffectTuning) : undefined,
        shockwaveTuning: environmentEffectType === "shockwave" ? cloneShockwaveEffectTuning(shockwaveEffectTuning) : undefined,
        smokeTuning: environmentEffectType === "smoke" ? cloneSmokeEffectTuning(smokeEffectTuning) : undefined,
        fogTuning: environmentEffectType === "fog" ? cloneFogEffectTuning(fogEffectTuning) : undefined,
        start: point,
        current: point
      } satisfies EnvironmentEffectDrag;
      environmentEffectDragRef.current = effectDrag;
      setEnvironmentEffectPreview(effectDrag);
      return;
    }
    if (mode === "gm" && mouseBehavior === "selector" && scene && !canvasTool && !drawingTool && !fogTool && !weatherMaskTool && !environmentEffectTool && event.button === 0 && (event.shiftKey || event.ctrlKey || event.metaKey)) {
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
        const selectedTokenIdSet = new Set(selectedTokenIds);
        const shouldDragSelectedGroup = mouseBehavior === "grabber" && selectedTokenIdSet.has(token.id) && selectedTokenIds.length > 1;
        const groupTokenIds = shouldDragSelectedGroup ? selectedTokenIds : [token.id];
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
      if (!canvasTool && !drawingTool && !fogTool && !weatherMaskTool && !environmentEffectTool) {
        if ((mouseBehavior === "grabber" || mouseBehavior === "selector") && canShowDrawings && selectedDrawingIds.length > 0) {
          const rotateTarget = getDrawingRotationHandleAtPoint(scene.drawings, selectedDrawingIds, point, getRenderCamera(camera, playerDisplayScale));
          if (rotateTarget) {
            const selectedIdSet = new Set(selectedDrawingIds);
            const groupStartPoints = new Map(
              scene.drawings
                .filter((candidate) => selectedIdSet.has(candidate.id) && !candidate.measurementLabelVisible)
                .map((candidate) => [candidate.id, candidate.points.map((candidatePoint) => ({ ...candidatePoint }))])
            );
            drawingRotateRef.current = {
              pointerId: event.pointerId,
              center: rotateTarget.center,
              startAngle: Math.atan2(point.y - rotateTarget.center.y, point.x - rotateTarget.center.x),
              groupStartPoints
            };
            setDrawingDragPreview(groupStartPoints);
            return;
          }
          const resizeTarget = getDrawingResizeHandleAtPoint(scene.drawings, selectedDrawingIds, point, getRenderCamera(camera, playerDisplayScale));
          if (resizeTarget) {
            const selectedIdSet = new Set(selectedDrawingIds);
            const groupStartPoints = new Map(
              scene.drawings
                .filter((candidate) => selectedIdSet.has(candidate.id) && !candidate.measurementLabelVisible)
                .map((candidate) => [candidate.id, candidate.points.map((candidatePoint) => ({ ...candidatePoint }))])
            );
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
        const drawingHit = canShowDrawings ? getDrawingAtPoint(scene.drawings, point, Math.max(8, 8 / getRenderCamera(camera, playerDisplayScale).zoom), scene.grid) : null;
        if (drawingHit) {
          const selectedDrawingIdSet = new Set(selectedDrawingIds);
          const shouldDragSelectedGroup = mouseBehavior === "grabber" && selectedDrawingIdSet.has(drawingHit.id) && selectedDrawingIds.length > 1;
          const groupDrawingIds = shouldDragSelectedGroup ? selectedDrawingIds : [drawingHit.id];
          const groupStartPoints = new Map(
            scene.drawings
              .filter((candidate) => groupDrawingIds.includes(candidate.id))
              .map((candidate) => [candidate.id, candidate.points.map((candidatePoint) => ({ ...candidatePoint }))])
          );
          const snapBounds = getDrawingGroupBounds(scene.drawings.filter((candidate) => groupDrawingIds.includes(candidate.id)));
          const snapAnchor = snapBounds
            ? {
                x: (snapBounds.left + snapBounds.right) / 2,
                y: (snapBounds.top + snapBounds.bottom) / 2
              }
            : point;
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
    if (mode === "gm" && mouseBehavior === "selector" && scene && !canvasTool && !drawingTool && !fogTool && !weatherMaskTool && !environmentEffectTool && event.button === 0) {
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
      drawingPreviewRef.current = null;
      setDrawingPreview(null);
      onTemplatePreviewChange?.(null);
      if (scene && onSceneChange && isMeaningfulDrawingPreview(drawingDrag)) {
        const drawingPoints = getDrawingPreviewPoints(drawingDrag);
        const kind = drawingDrag.kind === "circle" && drawingPoints.length === 2 ? "circle" : getDrawingKindForTool(drawingDrag.kind);
        const isTemplate = drawingDrag.measurementLabelVisible === true;
        onSceneChange({
          ...scene,
          drawings: [
            ...scene.drawings,
            {
              id: crypto.randomUUID(),
              name: isTemplateDrawingTool(drawingDrag.kind) ? formatDefaultTemplateDrawingName(drawingDrag.kind, scene.drawings.length, drawingDrag.templateEffect ?? "plain") : formatDefaultDrawingName(kind, scene.drawings.length),
              kind,
              points: drawingPoints,
              color: drawingDrag.color,
              opacity: drawingDrag.opacity,
              strokeColor: drawingDrag.strokeColor ?? drawingDrag.color,
              strokeOpacity: drawingDrag.strokeOpacity ?? drawingDrag.opacity,
              strokeWidth: drawingDrag.strokeWidth,
              fill: drawingDrag.fillColor,
              fillColor: drawingDrag.fillColor,
              fillOpacity: isTemplate ? 0 : (drawingDrag.fillOpacity ?? 0),
              strokeStyle: isTemplate ? "dashed" : (drawingDrag.strokeStyle ?? "solid"),
              templateEffect: isTemplate ? (drawingDrag.templateEffect ?? "plain") : "plain",
              templateWidth: isTemplate ? (drawingDrag.templateWidth ?? 5) : 5,
              templateFootprintVisible: isTemplate ? false : undefined,
              measurementLabelVisible: isTemplate,
              visibleInGm: true,
              visibleInPlayer: true
            }
          ],
          updatedAt: new Date().toISOString()
        });
      }
      return;
    }

    const weatherMaskDrag = weatherMaskDragRef.current;
    if (weatherMaskDrag?.pointerId === event.pointerId) {
      weatherMaskDragRef.current = null;
      setWeatherMaskPreview(null);
      if (scene && onSceneChange && isMeaningfulWeatherMaskDrag(weatherMaskDrag)) {
        onSceneChange({
          ...scene,
          weather: {
            ...scene.weather,
            masks: [
              ...scene.weather.masks,
              {
                id: crypto.randomUUID(),
                name: `Weather Effect Mask ${scene.weather.masks.length + 1}`,
                kind: weatherMaskDrag.kind,
                points: weatherMaskDrag.kind === "circle" ? [weatherMaskDrag.start] : [weatherMaskDrag.start, weatherMaskDrag.current],
                radius: weatherMaskDrag.kind === "circle" ? distanceBetween(weatherMaskDrag.start, weatherMaskDrag.current) : undefined,
                visible: true
              }
            ]
          },
          updatedAt: new Date().toISOString()
        });
      }
      return;
    }

    const environmentEffectDrag = environmentEffectDragRef.current;
    if (environmentEffectDrag?.pointerId === event.pointerId) {
      environmentEffectDragRef.current = null;
      setEnvironmentEffectPreview(null);
      if (scene && onSceneChange && isMeaningfulEnvironmentEffectDrag(environmentEffectDrag)) {
        onSceneChange({
          ...scene,
          environment: {
            ...scene.environment,
            effects: [
              ...scene.environment.effects,
              {
                id: crypto.randomUUID(),
                name: `${formatEnvironmentEffectLabel(environmentEffectDrag.effect)} Effect ${scene.environment.effects.length + 1}`,
                kind: environmentEffectDrag.kind,
                effect: environmentEffectDrag.effect,
                feather: environmentEffectDrag.feather,
                acidTuning: environmentEffectDrag.effect === "acid" ? cloneAcidEffectTuning(environmentEffectDrag.acidTuning ?? acidEffectTuning) : undefined,
                coldTuning: environmentEffectDrag.effect === "cold" ? cloneColdEffectTuning(environmentEffectDrag.coldTuning ?? coldEffectTuning) : undefined,
                darknessTuning: environmentEffectDrag.effect === "darkness" ? cloneDarknessEffectTuning(environmentEffectDrag.darknessTuning ?? darknessEffectTuning) : undefined,
                poisonTuning: environmentEffectDrag.effect === "poison" ? clonePoisonEffectTuning(environmentEffectDrag.poisonTuning ?? poisonEffectTuning) : undefined,
                waterTuning: environmentEffectDrag.effect === "water" ? cloneWaterEffectTuning(environmentEffectDrag.waterTuning ?? waterEffectTuning) : undefined,
                lavaTuning: environmentEffectDrag.effect === "lava" ? cloneLavaEffectTuning(environmentEffectDrag.lavaTuning ?? lavaEffectTuning) : undefined,
                fireTuning: environmentEffectDrag.effect === "fire" ? cloneFireEffectTuning(environmentEffectDrag.fireTuning ?? fireEffectTuning) : undefined,
                lightningTuning: environmentEffectDrag.effect === "electric" ? cloneLightningEffectTuning(environmentEffectDrag.lightningTuning ?? lightningEffectTuning) : undefined,
                arcaneTuning: environmentEffectDrag.effect === "arcane" ? cloneArcaneEffectTuning(environmentEffectDrag.arcaneTuning ?? arcaneEffectTuning) : undefined,
                chaosTuning: environmentEffectDrag.effect === "chaos" ? cloneChaosEffectTuning(environmentEffectDrag.chaosTuning ?? chaosEffectTuning) : undefined,
                voidTuning: environmentEffectDrag.effect === "void" ? cloneVoidEffectTuning(environmentEffectDrag.voidTuning ?? voidEffectTuning) : undefined,
                natureTuning: environmentEffectDrag.effect === "nature" ? cloneNatureEffectTuning(environmentEffectDrag.natureTuning ?? natureEffectTuning) : undefined,
                distortionTuning: environmentEffectDrag.effect === "distortion" ? cloneDistortionEffectTuning(environmentEffectDrag.distortionTuning ?? distortionEffectTuning) : undefined,
                radiantTuning: environmentEffectDrag.effect === "radiant" ? cloneRadiantEffectTuning(environmentEffectDrag.radiantTuning ?? radiantEffectTuning) : undefined,
                fieldTuning: environmentEffectDrag.effect === "field" ? cloneForceFieldEffectTuning(environmentEffectDrag.fieldTuning ?? forceFieldEffectTuning) : undefined,
                shockwaveTuning: environmentEffectDrag.effect === "shockwave" ? cloneShockwaveEffectTuning(environmentEffectDrag.shockwaveTuning ?? shockwaveEffectTuning) : undefined,
                smokeTuning: environmentEffectDrag.effect === "smoke" ? cloneSmokeEffectTuning(environmentEffectDrag.smokeTuning ?? smokeEffectTuning) : undefined,
                fogTuning: environmentEffectDrag.effect === "fog" ? cloneFogEffectTuning(environmentEffectDrag.fogTuning ?? fogEffectTuning) : undefined,
                points: environmentEffectDrag.kind === "circle" ? [environmentEffectDrag.start] : [environmentEffectDrag.start, environmentEffectDrag.current],
                radius: environmentEffectDrag.kind === "circle" ? distanceBetween(environmentEffectDrag.start, environmentEffectDrag.current) : undefined,
                visibleInGm: true,
                visibleInPlayer: true
              }
            ]
          },
          updatedAt: new Date().toISOString()
        });
      }
      return;
    }

    const fogDrag = fogDragRef.current;
    if (fogDrag?.pointerId === event.pointerId) {
      fogDragRef.current = null;
      setFogPreview(null);
      if (scene && onSceneChange && isMeaningfulFogDrag(fogDrag)) {
        onSceneChange({
          ...scene,
          fog: {
            ...scene.fog,
            ...(fogDrag.operation === "hide" && scene.fog.gmOpacity === 0 && scene.fog.playerOpacity === 0
              ? { gmOpacity: 0.5, playerOpacity: 1, opacity: 1 }
              : {}),
            shapes: [
              ...scene.fog.shapes,
              {
                id: crypto.randomUUID(),
                name: formatDefaultFogShapeName(fogDrag.operation, fogDrag.kind, scene.fog.shapes.length),
                operation: fogDrag.operation,
                kind: fogDrag.kind,
                points: fogDrag.kind === "brush" ? normalizeBrushPoints(fogDrag.points, fogDrag.current) : [fogDrag.start, fogDrag.current],
                radius: fogDrag.kind === "circle" ? distanceBetween(fogDrag.start, fogDrag.current) : fogDrag.radius,
                visibleInGm: true,
                visibleInPlayer: scene.fog.newShapesVisibleInPlayer,
                visible: true
              }
            ]
          },
          updatedAt: new Date().toISOString()
        });
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
        onSceneChange({
          ...scene,
          drawings: scene.drawings.map((drawing) => {
            const points = movedPoints.get(drawing.id);
            return points ? { ...drawing, points } : drawing;
          }),
          updatedAt: new Date().toISOString()
        });
      }
      drawingDragRef.current = null;
      setDrawingDragPreview(null);
      setSnapPoint(null);
      return;
    }

    if (drawingResizeRef.current?.pointerId === event.pointerId) {
      const resizedPoints = drawingDragPreview;
      if (scene && onSceneChange && resizedPoints) {
        onSceneChange({
          ...scene,
          drawings: scene.drawings.map((drawing) => {
            const points = resizedPoints.get(drawing.id);
            return points ? { ...drawing, points } : drawing;
          }),
          updatedAt: new Date().toISOString()
        });
      }
      drawingResizeRef.current = null;
      setDrawingDragPreview(null);
      return;
    }

    if (drawingRotateRef.current?.pointerId === event.pointerId) {
      const rotatedPoints = drawingDragPreview;
      if (scene && onSceneChange && rotatedPoints) {
        onSceneChange({
          ...scene,
          drawings: scene.drawings.map((drawing) => {
            const points = rotatedPoints.get(drawing.id);
            return points ? { ...drawing, points } : drawing;
          }),
          updatedAt: new Date().toISOString()
        });
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
        const nextScene = {
          ...scene,
          tokens: scene.tokens.map((candidate) => {
            const groupStartPosition = tokenDrag.groupStartPositions.get(candidate.id);
            if (!groupStartPosition) {
              return candidate;
            }
            return {
              ...candidate,
              position: {
                x: groupStartPosition.x + snappedDelta.x,
                y: groupStartPosition.y + snappedDelta.y
              }
            };
          }),
          updatedAt: new Date().toISOString()
        };
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
    if (canvasTool || drawingTool || fogTool || weatherMaskTool || environmentEffectTool) {
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
        if (!canvasTool && !drawingTool && !fogTool && !weatherMaskTool && !environmentEffectTool) {
          const drawingHit = canShowDrawings ? getDrawingAtPoint(scene.drawings, point, Math.max(8, 8 / getRenderCamera(camera, playerDisplayScale).zoom), scene.grid) : null;
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
              label: drawingHit.name?.trim() || formatDefaultDrawingName(drawingHit.kind, Math.max(0, drawingIndex)),
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
                label: maskHit.mask.name?.trim() || "Weather Effect Mask",
                visible: maskHit.mask.visible ?? true,
                x: frameRect ? event.clientX - frameRect.left : event.clientX,
                y: frameRect ? event.clientY - frameRect.top : event.clientY
              });
            } else {
              const shapeIndex = scene.fog.shapes.findIndex((shape) => shape.id === maskHit.shape.id);
              const label = maskHit.shape.name?.trim() || formatDefaultFogShapeName(maskHit.shape.operation, maskHit.shape.kind, Math.max(0, shapeIndex));
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
              label: environmentEffectHit.name?.trim() || `${formatEnvironmentEffectLabel(environmentEffectHit.effect)} Effect ${Math.max(0, effectIndex) + 1}`,
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
      const nextPoints = draft.points.slice(0, -1);
      const nextDraft = nextPoints.length > 0 ? { ...draft, points: nextPoints, current: nextPoints[nextPoints.length - 1] } : null;
      polygonDraftRef.current = nextDraft;
      setPolygonDraft(nextDraft);
      return;
    }
    if (drawingDraft) {
      const nextPoints = drawingDraft.points.slice(0, -1);
      const nextDraft = nextPoints.length > 0 ? { ...drawingDraft, points: nextPoints, current: nextPoints[nextPoints.length - 1] } : null;
      drawingPolygonDraftRef.current = nextDraft;
      setDrawingPolygonDraft(nextDraft);
      return;
    }
    if (weatherDraft) {
      const nextPoints = weatherDraft.points.slice(0, -1);
      const nextDraft = nextPoints.length > 0 ? { ...weatherDraft, points: nextPoints, current: nextPoints[nextPoints.length - 1] } : null;
      weatherPolygonDraftRef.current = nextDraft;
      setWeatherPolygonDraft(nextDraft);
      return;
    }
    if (environmentDraft) {
      const nextPoints = environmentDraft.points.slice(0, -1);
      const nextDraft = nextPoints.length > 0 ? { ...environmentDraft, points: nextPoints, current: nextPoints[nextPoints.length - 1] } : null;
      environmentPolygonDraftRef.current = nextDraft;
      setEnvironmentPolygonDraft(nextDraft);
    }
  };

  const canAcceptTokenAssetDrop = (event: React.DragEvent<HTMLCanvasElement>): boolean => {
    return Boolean(mode === "gm" && scene && campaign && onDropTokenAsset && event.dataTransfer.types.includes(TOKEN_LIBRARY_ASSET_DRAG_TYPE));
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
    const assetId = event.dataTransfer.getData(TOKEN_LIBRARY_ASSET_DRAG_TYPE);
    const asset = campaign?.assets.find((candidate) => candidate.id === assetId && candidate.kind === "token");
    if (!asset) {
      return;
    }
    onDropTokenAsset?.(asset, clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, getRenderCamera(camera, playerDisplayScale)));
  };

  const updateDrawingTransformHover = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      mode !== "gm" ||
      !scene ||
      !canShowDrawings ||
      drawingDragPreview ||
      canvasTool ||
      drawingTool ||
      fogTool ||
      weatherMaskTool ||
      environmentEffectTool ||
      selectedDrawingIds.length === 0
    ) {
      setDrawingTransformHover(null);
      return;
    }
    const cameraState = getRenderCamera(camera, playerDisplayScale);
    const point = eventToWorldPoint(event, cameraState);
    if (getDrawingRotationHandleAtPoint(scene.drawings, selectedDrawingIds, point, cameraState)) {
      setDrawingTransformHover("rotate");
      return;
    }
    const resizeTarget = getDrawingResizeHandleAtPoint(scene.drawings, selectedDrawingIds, point, cameraState);
    setDrawingTransformHover(resizeTarget?.handle ?? null);
  };

  const updateSceneItemHover = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      mode !== "gm" ||
      !scene ||
      drawingDragPreview ||
      canvasTool ||
      drawingTool ||
      fogTool ||
      weatherMaskTool ||
      environmentEffectTool ||
      selectionDragRef.current
    ) {
      setSceneItemHover(false);
      return;
    }
    const cameraState = getRenderCamera(camera, playerDisplayScale);
    const point = eventToWorldPoint(event, cameraState);
    const tokenHit = canShowTokens ? getTokenAtPoint(scene.tokens, point) : null;
    if (tokenHit) {
      setSceneItemHover(true);
      return;
    }
    const drawingHit = canShowDrawings ? getDrawingAtPoint(scene.drawings, point, Math.max(8, 8 / cameraState.zoom), scene.grid) : null;
    if (drawingHit) {
      setSceneItemHover(true);
      return;
    }
    const maskHit = getMaskHitAtPoint(scene, point);
    const hasVisibleMaskHit = Boolean((maskHit?.kind === "weather" && canShowWeather) || (maskHit?.kind === "fog" && canShowFog));
    setSceneItemHover(hasVisibleMaskHit);
  };

  const updatePolygonDraft = (tool: FogTool, point: Point) => {
    const currentDraft = polygonDraftRef.current;
    const operation = getFogOperationForTool(tool);
    const nextDraft =
      currentDraft && currentDraft.operation === operation
        ? { ...currentDraft, points: [...currentDraft.points, point], current: point }
        : { operation, points: [point], current: point };
    setPolygonDraft(nextDraft);
    polygonDraftRef.current = nextDraft;
  };

  const updateWeatherPolygonDraft = (point: Point) => {
    const currentDraft = weatherPolygonDraftRef.current;
    const nextDraft = currentDraft ? { ...currentDraft, points: [...currentDraft.points, point], current: point } : { points: [point], current: point };
    setWeatherPolygonDraft(nextDraft);
    weatherPolygonDraftRef.current = nextDraft;
  };

  const updateEnvironmentPolygonDraft = (point: Point) => {
    const currentDraft = environmentPolygonDraftRef.current;
    const nextDraft = currentDraft ? { ...currentDraft, points: [...currentDraft.points, point], current: point } : { points: [point], current: point };
    setEnvironmentPolygonDraft(nextDraft);
    environmentPolygonDraftRef.current = nextDraft;
  };

  const updateDrawingPolygonDraft = (point: Point) => {
    const currentDraft = drawingPolygonDraftRef.current;
    const nextDraft = currentDraft ? { ...currentDraft, points: [...currentDraft.points, point], current: point } : { points: [point], current: point };
    setDrawingPolygonDraft(nextDraft);
    drawingPolygonDraftRef.current = nextDraft;
  };

  const getToolPoint = (event: React.PointerEvent<HTMLCanvasElement>, snapEnabled = true): Point => {
    const worldPoint = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
    const snappedPoint = scene && snapEnabled && isSnapModifier(event) ? getNearestSceneSnapPoint(worldPoint, scene) : null;
    setSnapPoint(snappedPoint);
    return snappedPoint ?? worldPoint;
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
    if (!scene || tool === "freehand" || !isSnapModifier(event)) {
      setSnapPoint(null);
      return point;
    }
    const snappedPoint = getNearestSceneSnapPoint(point, scene) ?? point;
    setSnapPoint(snappedPoint);
    return snappedPoint;
  };

  const updateSnapPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canSnapDrawing = drawingTool && drawingTool !== "freehand";
    const canSnapFog = fogTool && !fogTool.includes("brush");
    const canSnapWeather = Boolean(weatherMaskTool);
    const canSnapEnvironment = Boolean(environmentEffectTool);
    if (!scene || (!canSnapFog && !canSnapDrawing && !canSnapWeather && !canSnapEnvironment) || !isSnapModifier(event)) {
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
    onSceneChange({
      ...scene,
      fog: {
        ...scene.fog,
        ...(draft.operation === "hide" && scene.fog.gmOpacity === 0 && scene.fog.playerOpacity === 0
          ? { gmOpacity: 0.5, playerOpacity: 1, opacity: 1 }
          : {}),
        shapes: [
          ...scene.fog.shapes,
          {
            id: crypto.randomUUID(),
            name: formatDefaultFogShapeName(draft.operation, "polygon", scene.fog.shapes.length),
            operation: draft.operation,
            kind: "polygon",
            points: draft.points,
            visibleInGm: true,
            visibleInPlayer: scene.fog.newShapesVisibleInPlayer,
            visible: true
          }
        ]
      },
      updatedAt: new Date().toISOString()
    });
  };

  const commitDrawingPolygonDraft = () => {
    const draft = drawingPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft || !isMeaningfulPolygon(draft.points)) {
      return;
    }
    drawingPolygonDraftRef.current = null;
    setDrawingPolygonDraft(null);
    onSceneChange({
      ...scene,
      drawings: [
        ...scene.drawings,
        {
          id: crypto.randomUUID(),
          name: formatDefaultDrawingName("polygon", scene.drawings.length),
          kind: "polygon",
          points: draft.points,
          color: drawingColor,
          opacity: drawingOpacity,
          strokeColor: drawingColor,
          strokeOpacity: drawingOpacity,
          fillColor: drawingFillColor,
          fillOpacity: drawingFillOpacity,
          strokeStyle: drawingStrokeStyle,
          strokeWidth: drawingStrokeWidth,
          measurementLabelVisible: false,
          visibleInGm: true,
          visibleInPlayer: true
        }
      ],
      updatedAt: new Date().toISOString()
    });
  };

  const commitWeatherPolygonDraft = () => {
    const draft = weatherPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft || !isMeaningfulPolygon(draft.points)) {
      return;
    }
    weatherPolygonDraftRef.current = null;
    setWeatherPolygonDraft(null);
    onSceneChange({
      ...scene,
      weather: {
        ...scene.weather,
        masks: [
          ...scene.weather.masks,
          {
            id: crypto.randomUUID(),
            name: `Weather Effect Mask ${scene.weather.masks.length + 1}`,
            kind: "polygon",
            points: draft.points,
            visible: true
          }
        ]
      },
      updatedAt: new Date().toISOString()
    });
  };

  const commitEnvironmentPolygonDraft = () => {
    const draft = environmentPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft || !isMeaningfulPolygon(draft.points)) {
      return;
    }
    environmentPolygonDraftRef.current = null;
    setEnvironmentPolygonDraft(null);
    onSceneChange({
      ...scene,
      environment: {
        ...scene.environment,
        effects: [
          ...scene.environment.effects,
          {
            id: crypto.randomUUID(),
            name: `${formatEnvironmentEffectLabel(environmentEffectType)} Effect ${scene.environment.effects.length + 1}`,
            kind: "polygon",
            effect: environmentEffectType,
            feather: environmentEffectFeather,
            acidTuning: environmentEffectType === "acid" ? cloneAcidEffectTuning(acidEffectTuning) : undefined,
            coldTuning: environmentEffectType === "cold" ? cloneColdEffectTuning(coldEffectTuning) : undefined,
            darknessTuning: environmentEffectType === "darkness" ? cloneDarknessEffectTuning(darknessEffectTuning) : undefined,
            poisonTuning: environmentEffectType === "poison" ? clonePoisonEffectTuning(poisonEffectTuning) : undefined,
            waterTuning: environmentEffectType === "water" ? cloneWaterEffectTuning(waterEffectTuning) : undefined,
            lavaTuning: environmentEffectType === "lava" ? cloneLavaEffectTuning(lavaEffectTuning) : undefined,
            fireTuning: environmentEffectType === "fire" ? cloneFireEffectTuning(fireEffectTuning) : undefined,
            lightningTuning: environmentEffectType === "electric" ? cloneLightningEffectTuning(lightningEffectTuning) : undefined,
            arcaneTuning: environmentEffectType === "arcane" ? cloneArcaneEffectTuning(arcaneEffectTuning) : undefined,
            chaosTuning: environmentEffectType === "chaos" ? cloneChaosEffectTuning(chaosEffectTuning) : undefined,
            voidTuning: environmentEffectType === "void" ? cloneVoidEffectTuning(voidEffectTuning) : undefined,
            natureTuning: environmentEffectType === "nature" ? cloneNatureEffectTuning(natureEffectTuning) : undefined,
            distortionTuning: environmentEffectType === "distortion" ? cloneDistortionEffectTuning(distortionEffectTuning) : undefined,
            radiantTuning: environmentEffectType === "radiant" ? cloneRadiantEffectTuning(radiantEffectTuning) : undefined,
            fieldTuning: environmentEffectType === "field" ? cloneForceFieldEffectTuning(forceFieldEffectTuning) : undefined,
            shockwaveTuning: environmentEffectType === "shockwave" ? cloneShockwaveEffectTuning(shockwaveEffectTuning) : undefined,
            smokeTuning: environmentEffectType === "smoke" ? cloneSmokeEffectTuning(smokeEffectTuning) : undefined,
            fogTuning: environmentEffectType === "fog" ? cloneFogEffectTuning(fogEffectTuning) : undefined,
            points: draft.points,
            visibleInGm: true,
            visibleInPlayer: true
          }
        ]
      },
      updatedAt: new Date().toISOString()
    });
  };

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
  const mapOverlayMessage = mapLoadStatus === "error" ? "Map asset unavailable" : mapAsset?.mediaType === "video" ? "Loading video map..." : "Loading map...";
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
                onSceneChange({
                  ...scene,
                  tokens: scene.tokens.map((candidate) => (candidate.id === token.id ? { ...candidate, ...patch } : candidate)),
                  updatedAt: new Date().toISOString()
                });
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
                const duplicateTokenId = crypto.randomUUID();
                onSceneChange({
                  ...scene,
                  tokens: duplicateToken(scene.tokens, token.id, duplicateTokenId),
                  updatedAt: new Date().toISOString()
                });
                onSelectToken?.(duplicateTokenId);
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
                onSceneChange({
                  ...scene,
                  tokens: scene.tokens.filter((candidate) => candidate.id !== token.id),
                  updatedAt: new Date().toISOString()
                });
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
                      onSceneChange({
                        ...scene,
                        fog: {
                          ...scene.fog,
                          shapes: scene.fog.shapes.map((shape) =>
                            shape.id === maskContextMenu.shapeId
                              ? { ...shape, visibleInPlayer: nextVisibleInPlayer, visible: (shape.visibleInGm ?? shape.visible ?? true) || nextVisibleInPlayer }
                              : shape
                          )
                        },
                        updatedAt: new Date().toISOString()
                      });
                    } else {
                      const nextVisible = !event.target.checked;
                      onSceneChange({
                        ...scene,
                        weather: {
                          ...scene.weather,
                          masks: scene.weather.masks.map((mask) => (mask.id === maskContextMenu.maskId ? { ...mask, visible: nextVisible } : mask))
                        },
                        updatedAt: new Date().toISOString()
                      });
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
                      onSceneChange({
                        ...scene,
                        drawings: scene.drawings.map((drawing) =>
                          drawing.id === drawingContextMenu.drawingId ? { ...drawing, templateFootprintVisible: !event.target.checked } : drawing
                        ),
                        updatedAt: new Date().toISOString()
                      });
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
                    onSceneChange({
                      ...scene,
                      drawings: scene.drawings.map((drawing) =>
                        drawing.id === drawingContextMenu.drawingId ? { ...drawing, visibleInPlayer: !event.target.checked } : drawing
                      ),
                      updatedAt: new Date().toISOString()
                    });
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
              const sourceDrawing = scene.drawings.find((drawing) => drawing.id === drawingContextMenu.drawingId);
              if (!sourceDrawing) {
                setDrawingContextMenu(null);
                return;
              }
              const duplicatedDrawing = duplicateDrawingElement(sourceDrawing, scene.drawings, crypto.randomUUID(), drawingContextMenu.label);
              onSceneChange({
                ...scene,
                drawings: [...scene.drawings, duplicatedDrawing],
                updatedAt: new Date().toISOString()
              });
              onSelectDrawing?.(duplicatedDrawing.id);
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
              onSceneChange({
                ...scene,
                drawings: scene.drawings.filter((drawing) => drawing.id !== drawingContextMenu.drawingId),
                updatedAt: new Date().toISOString()
              });
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
              onSceneChange({
                ...scene,
                environment: {
                  ...scene.environment,
                  effects: scene.environment.effects.filter((effect) => effect.id !== environmentEffectContextMenu.effectId)
                },
                updatedAt: new Date().toISOString()
              });
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

function PlayerSeatIndicators({ campaign }: { campaign: Campaign | null }) {
  const seats = (campaign?.players ?? []).filter((player) => player.visibleInPlayer);
  if (seats.length === 0) {
    return null;
  }

  const assetsById = new Map((campaign?.assets ?? []).map((asset) => [asset.id, asset]));
  return (
    <>
      {seats.map((seat) => {
        const asset = seat.assetId ? assetsById.get(seat.assetId) : null;
        const previewPath = asset?.thumbnailAbsolutePath ?? asset?.absolutePath;
        const style = getPlayerSeatStyle(seat.defaultSeatEdge, seat.defaultSeatPosition, seat.color);
        return (
          <div key={seat.id} className={`player-seat-indicator player-seat-indicator-${seat.defaultSeatEdge}`} style={style}>
            <span className="player-seat-indicator-avatar">
              {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : seat.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="player-seat-indicator-name">{seat.name}</span>
          </div>
        );
      })}
    </>
  );
}

function getPlayerSeatStyle(edge: "top" | "right" | "bottom" | "left", position: number, color: string): React.CSSProperties {
  const clampedPosition = Math.min(1, Math.max(0, position)) * 100;
  const baseStyle = {
    "--player-seat-color": color
  } as React.CSSProperties;
  if (edge === "top" || edge === "bottom") {
    return {
      ...baseStyle,
      left: `${clampedPosition}%`,
      [edge]: "12px"
    };
  }
  return {
    ...baseStyle,
    top: `${clampedPosition}%`,
    [edge]: "12px"
  };
}

function TurnOrderPlayerBar({ scene, campaign }: { scene: Scene; campaign: Campaign | null }) {
  const turnOrder = scene.turnOrder;
  const entries = turnOrder.entries.filter((entry) => entry.visibleInPlayer);
  const visible = turnOrder.active && turnOrder.playerViewVisible && entries.length > 0;
  const reveal = useEdgeSlide(visible);
  const renderedEntries = useLastPresentValue(entries, visible && entries.length > 0);
  const renderedCampaign = useLastPresentValue(campaign, visible && Boolean(campaign));
  if (!reveal.present || renderedEntries.length === 0) {
    return null;
  }

  const assetsById = new Map((renderedCampaign?.assets ?? []).map((asset) => [asset.id, asset]));
  const playersById = new Map((renderedCampaign?.players ?? []).map((player) => [player.id, player]));
  const layout = getTurnOrderPlayerBarLayout(turnOrder.playerViewEdge, turnOrder.playerViewFacing);
  const displayedEntries = layout.reverseEntries ? [...renderedEntries].reverse() : renderedEntries;
  const currentIndex = Math.max(0, renderedEntries.findIndex((entry) => entry.id === turnOrder.currentEntryId));
  const nextEntryId = renderedEntries.length > 1 ? renderedEntries[(currentIndex + 1) % renderedEntries.length]?.id : null;

  return (
    <div
      className={`turn-order-player-bar turn-order-player-bar-${turnOrder.playerViewEdge} turn-order-player-bar-${turnOrder.playerViewSize} ${layout.arrowAtEnd ? "turn-order-player-bar-arrow-end" : ""}`}
      style={
        {
          "--turn-entry-rotation": `${layout.entryRotation}deg`,
          "--turn-arrow-rotation": `${layout.arrowRotation}deg`,
          transform: getEdgeSlideTransform(turnOrder.playerViewEdge, reveal.progress)
        } as React.CSSProperties
      }
    >
      <span className="turn-order-player-direction" aria-hidden="true">
        <ArrowRight size={18} />
      </span>
      {displayedEntries.map((entry) => {
        const player = entry.playerId ? playersById.get(entry.playerId) : null;
        const assetId = player?.assetId ?? entry.assetId;
        const asset = assetId ? assetsById.get(assetId) : null;
        const previewPath = asset?.thumbnailAbsolutePath ?? asset?.absolutePath;
        const active = entry.id === turnOrder.currentEntryId;
        const next = entry.id === nextEntryId;
        const entryName = player?.name ?? entry.name;
        return (
          <article
            key={entry.id}
            className={["turn-order-player-entry", active ? "turn-order-player-entry-active" : "", next ? "turn-order-player-entry-next" : ""].filter(Boolean).join(" ")}
            style={player?.color ? ({ "--turn-player-color": player.color } as React.CSSProperties) : undefined}
          >
            <span className="turn-order-player-avatar">
              {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : entryName.slice(0, 1).toUpperCase()}
            </span>
            <span className="turn-order-player-initiative">{entry.initiative}</span>
          </article>
        );
      })}
    </div>
  );
}

function PlayerTurnStatusIndicators({ scene, campaign }: { scene: Scene; campaign: Campaign | null }) {
  const turnOrder = scene.turnOrder;
  const visible = turnOrder.active && turnOrder.playerViewVisible && Boolean(campaign);
  const reveal = useEdgeSlide(visible);
  const renderedCampaign = useLastPresentValue(campaign, visible && Boolean(campaign));
  const entries = turnOrder.entries.filter((entry) => entry.visibleInPlayer);
  const renderedEntries = useLastPresentValue(entries, visible && entries.length > 0);
  if (!reveal.present || !renderedCampaign) {
    return null;
  }

  if (renderedEntries.length === 0) {
    return null;
  }

  const currentIndex = Math.max(0, renderedEntries.findIndex((entry) => entry.id === turnOrder.currentEntryId));
  const nextEntry = renderedEntries.length > 1 ? renderedEntries[(currentIndex + 1) % renderedEntries.length] : null;
  const entriesByPlayerId = new Map<string, (typeof renderedEntries)[number]>();
  for (const entry of renderedEntries) {
    if (entry.playerId) {
      entriesByPlayerId.set(entry.playerId, entry);
    }
  }
  const assetsById = new Map(renderedCampaign.assets.map((asset) => [asset.id, asset]));
  const players = renderedCampaign.players.filter((player) => entriesByPlayerId.has(player.id));
  if (players.length === 0) {
    return null;
  }

  return (
    <>
      {players.map((player) => {
        const entry = entriesByPlayerId.get(player.id);
        if (!entry) {
          return null;
        }
        const asset = player.assetId ? assetsById.get(player.assetId) : null;
        const previewPath = asset?.thumbnailAbsolutePath ?? asset?.absolutePath;
        const status = entry.id === turnOrder.currentEntryId ? "current" : entry.id === nextEntry?.id ? "next" : "waiting";
        const theme = player.indicatorTheme ?? "generic";
        const style = getPlayerTurnStatusStyle(player.defaultSeatEdge, player.defaultSeatPosition, player.color, reveal.progress);
        return (
          <div
            key={player.id}
            className={`player-turn-status player-turn-status-${player.defaultSeatEdge} player-turn-status-${turnOrder.playerTurnStatusSize} player-turn-status-${status} player-turn-theme-${theme}`}
            style={style}
          >
            <PlayerTurnStatusFrame />
            <span className="player-turn-status-avatar">
              {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : player.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="player-turn-status-copy">
              <strong>{player.name}</strong>
              <small>{getPlayerTurnStatusLabel(status)}</small>
            </span>
          </div>
        );
      })}
    </>
  );
}

function PlayerTurnStatusFrame() {
  return (
    <svg className="player-turn-status-frame" viewBox="0 0 260 82" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="player-turn-frame-shadow" d="M18 5H242L257 20V62L242 77H18L3 62V20L18 5Z" />
      <path className="player-turn-frame-fill" d="M22 4H238L254 20V62L238 78H22L6 62V20L22 4Z" />
      <path className="player-turn-frame-panel" d="M66 13H221L244 25V57L221 69H66L77 41L66 13Z" />
      <path className="player-turn-frame-crest" d="M22 11H64L77 41L64 71H22L12 59V23L22 11Z" />
      <path className="player-turn-frame-inner" d="M33 12H227L246 25V57L227 70H33L14 57V25L33 12Z" />
      <path className="player-turn-frame-corners" d="M24 10L35 18M236 10L225 18M24 72L35 64M236 72L225 64M8 31L18 41L8 51M252 31L242 41L252 51" />
      <path className="player-turn-frame-runes" d="M91 20H111M190 20H210M91 62H111M190 62H210" />
      <path className="player-turn-frame-sigil" d="M42 17L49 28L42 39L35 28L42 17ZM42 43L50 54L42 66L34 54L42 43Z" />
      <circle className="player-turn-frame-gem" cx="31" cy="41" r="4.5" />
      <circle className="player-turn-frame-gem" cx="229" cy="41" r="4.5" />
    </svg>
  );
}

function getPlayerTurnStatusLabel(status: "current" | "next" | "waiting"): string {
  if (status === "current") {
    return "Turn Now";
  }
  if (status === "next") {
    return "Up Next";
  }
  return "Waiting";
}

function getPlayerTurnStatusStyle(edge: "top" | "right" | "bottom" | "left", position: number, color: string, progress: number): React.CSSProperties {
  return {
    ...getPlayerSeatStyle(edge, position, color),
    transform: getEdgeSlideTransform(edge, progress, getPlayerTurnStatusRotation(edge))
  };
}

function getPlayerTurnStatusRotation(edge: "top" | "right" | "bottom" | "left"): number {
  if (edge === "top") {
    return 180;
  }
  if (edge === "left") {
    return 90;
  }
  if (edge === "right") {
    return -90;
  }
  return 0;
}

function getEdgeSlideTransform(edge: "top" | "right" | "bottom" | "left", progress: number, rotation = 0): string {
  const clamped = Math.min(1, Math.max(0, progress));
  const hiddenPercent = (1 - clamped) * 100;
  const hiddenPixels = (1 - clamped) * 36;
  const rotationTransform = rotation ? ` rotate(${rotation}deg)` : "";
  if (edge === "top") {
    return `translate(-50%, calc(-${hiddenPercent}% - ${hiddenPixels}px))${rotationTransform}`;
  }
  if (edge === "bottom") {
    return `translate(-50%, calc(${hiddenPercent}% + ${hiddenPixels}px))${rotationTransform}`;
  }
  if (edge === "left") {
    return `translate(calc(-${hiddenPercent}% - ${hiddenPixels}px), -50%)${rotationTransform}`;
  }
  return `translate(calc(${hiddenPercent}% + ${hiddenPixels}px), -50%)${rotationTransform}`;
}

function useEdgeSlide(show: boolean, durationMs = 560) {
  const [present, setPresent] = useState(show);
  const [progress, setProgress] = useState(show ? 1 : 0);
  const progressRef = useRef(show ? 1 : 0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = progressRef.current;
    const to = show ? 1 : 0;

    if (show) {
      setPresent(true);
    }

    const step = (now: number) => {
      const elapsed = now - start;
      const t = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
      const eased = show ? easeOutCubic(t) : easeInCubic(t);
      const nextProgress = from + (to - from) * eased;
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      if (t < 1) {
        frame = window.requestAnimationFrame(step);
        return;
      }
      progressRef.current = to;
      setProgress(to);
      if (!show) {
        setPresent(false);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [durationMs, show]);

  return { present, progress };
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function easeInCubic(value: number): number {
  return value * value * value;
}

function useLastPresentValue<T>(value: T, active: boolean): T {
  const lastValueRef = useRef(value);
  if (active) {
    lastValueRef.current = value;
  }
  return active ? value : lastValueRef.current;
}

function getTurnOrderPlayerBarLayout(edge: "top" | "right" | "bottom" | "left", facing: "inward" | "outward") {
  const reverseEntries =
    (edge === "top" && facing === "outward") ||
    (edge === "right" && facing === "outward") ||
    (edge === "bottom" && facing === "inward") ||
    (edge === "left" && facing === "inward");
  const vertical = edge === "left" || edge === "right";
  return {
    entryRotation: getTurnOrderFacingRotation(edge, facing),
    reverseEntries,
    arrowAtEnd: reverseEntries,
    arrowRotation: vertical ? (reverseEntries ? -90 : 90) : reverseEntries ? 180 : 0
  };
}

function getTurnOrderFacingRotation(edge: "top" | "right" | "bottom" | "left", facing: "inward" | "outward"): number {
  const inwardRotation = {
    top: 180,
    right: -90,
    bottom: 0,
    left: 90
  } satisfies Record<typeof edge, number>;
  const rotation = inwardRotation[edge];
  return facing === "inward" ? (rotation + 180) % 360 : rotation;
}

function MapLoadOverlay({ message, showSpinner }: { message: string; showSpinner: boolean }) {
  return (
    <div className="map-load-overlay" role="status" aria-live="polite">
      {showSpinner && <span className="map-load-spinner" aria-hidden="true" />}
      <span>{message}</span>
    </div>
  );
}

function FogToolStatusStrip({
  fogTool,
  polygonPointCount,
  brushSize
}: {
  fogTool: FogTool;
  polygonPointCount: number;
  brushSize: number;
}) {
  const primaryHint = getFogToolHint(fogTool, polygonPointCount, brushSize);

  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>{getFogToolLabel(fogTool)}</strong>
      <span>{primaryHint}</span>
      <span>{FOG_GRID_SNAP_HINT}</span>
      <span>Escape cancels active drawing.</span>
      <span>Middle-click drag pans.</span>
    </div>
  );
}

function DrawingToolStatusStrip({ drawingTool, drawingTemplateSize }: { drawingTool: DrawingTool; drawingTemplateSize: DrawingTemplateSize }) {
  const templateTool = isTemplateDrawingTool(drawingTool);
  const sizeLabel = drawingTemplateSize === "custom" || !templateTool ? "Custom size" : `${drawingTemplateSize} ft preset`;
  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>{getDrawingToolLabel(drawingTool)}</strong>
      <span>{getDrawingToolHint(drawingTool)}</span>
      {templateTool && <span>{sizeLabel}</span>}
      <span>Escape cancels active drawing.</span>
      <span>Middle-click drag pans.</span>
    </div>
  );
}

function TokenMoveStatusStrip({ scene, tokenDragPreview }: { scene: Scene | null; tokenDragPreview: TokenDragPreview }) {
  const waypointCount = tokenDragPreview.waypoints.length;
  const tokenMoveLabel = scene ? getTokenMoveLabel(scene, tokenDragPreview) : null;
  return (
    <div className="canvas-tool-status" aria-live="polite">
      <strong>Token Move</strong>
      <span>Drag to position.</span>
      <span>{SHIFT_WAYPOINT_HINT}</span>
      <span>{waypointCount === 1 ? "1 waypoint" : `${waypointCount} waypoints`}</span>
      {tokenMoveLabel && <span>{tokenMoveLabel}</span>}
      <span>{TOKEN_MOVE_COMPLETE_HINT}</span>
    </div>
  );
}

function RulerStatusStrip({ rulerDrag, scene }: { rulerDrag: RulerDrag | null; scene: Scene | null }) {
  const label = rulerDrag && scene ? getRulerLabel(rulerDrag, scene) : null;
  return (
    <div className="canvas-tool-status" aria-live="polite">
      <strong>Ruler</strong>
      <span>Left-drag to measure.</span>
      <span>{RULER_GRID_SNAP_HINT}</span>
      <span>{SHIFT_WAYPOINT_HINT}</span>
      {rulerDrag && <span>{rulerDrag.waypoints.length === 1 ? "1 waypoint" : `${rulerDrag.waypoints.length} waypoints`}</span>}
      {label && <span>{label.secondary ? `${label.primary} (${label.secondary})` : label.primary}</span>}
      <span>{RULER_CLEAR_HINT}</span>
    </div>
  );
}

function TableToolStatusStrip({ canvasTool }: { canvasTool: "ping" | "laser" }) {
  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>{canvasTool === "ping" ? "Ping" : "Laser Pointer"}</strong>
      <span>{canvasTool === "ping" ? "Click the map to send a ping." : "Drag on the map to show a fading pointer trail."}</span>
    </div>
  );
}

function MapCalibrationStatusStrip() {
  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>Map Calibration</strong>
      <span>Drag over one printed grid square, or a larger block such as 5 x 5 squares.</span>
    </div>
  );
}

function WeatherMaskStatusStrip({ weatherMaskTool, pointCount }: { weatherMaskTool: WeatherMaskTool; pointCount: number }) {
  const label = weatherMaskTool === "polygon" ? "Weather Effect Mask Polygon" : weatherMaskTool === "circle" ? "Weather Effect Mask Circle" : "Weather Effect Mask Rectangle";
  const hint =
    weatherMaskTool === "polygon"
      ? `Click to place points.${pointCount >= 3 ? " Enter or double-click finishes." : ""}${pointCount > 0 ? " Right-click removes last point." : ""} Escape cancels.`
      : weatherMaskTool === "circle"
        ? "Left-drag from center to set the excluded weather radius."
        : "Left-drag to draw an excluded weather area. Hold Shift for square.";
  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>{label}</strong>
      <span>{hint}</span>
      <span>{FOG_GRID_SNAP_HINT}</span>
    </div>
  );
}

function EnvironmentEffectStatusStrip({
  environmentEffectTool,
  effect,
  pointCount
}: {
  environmentEffectTool: EnvironmentEffectTool;
  effect: EnvironmentEffectType;
  pointCount: number;
}) {
  const shapeLabel = environmentEffectTool === "polygon" ? "Polygon" : environmentEffectTool === "circle" ? "Radius" : "Rectangle";
  const hint =
    environmentEffectTool === "polygon"
      ? `Click to place points.${pointCount >= 3 ? " Enter or double-click finishes." : ""}${pointCount > 0 ? " Right-click removes last point." : ""} Escape cancels.`
      : environmentEffectTool === "circle"
        ? "Left-drag from center to set the animated effect radius."
        : "Left-drag to draw an animated effect area. Hold Shift for square.";
  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>{formatEnvironmentEffectLabel(effect)} {shapeLabel}</strong>
      <span>{hint}</span>
      <span>{FOG_GRID_SNAP_HINT}</span>
    </div>
  );
}

function getRulerLabel(rulerDrag: RulerDrag, scene: Scene): RulerLabel {
  const pathPoints = getRulerPathPoints(rulerDrag);
  const primaryDistance = getMeasurementPathDistance(pathPoints, scene.grid, getMeasurementDistance);
  const primary = formatMeasurementDistance(primaryDistance, scene.grid.measurement, scene.grid.type);
  if (scene.grid.type === "gridless" || scene.grid.measurement.distanceMode === "euclidean") {
    return { primary };
  }

  const straightLine = formatMeasurementDistance(getMeasurementPathDistance(pathPoints, scene.grid, getStraightLineMeasurementDistance), scene.grid.measurement, scene.grid.type);
  return { primary, secondary: `Straight: ${straightLine}` };
}

function getTokenMoveLabel(scene: Scene, preview: TokenDragPreview): string | null {
  const token = scene.tokens.find((candidate) => candidate.id === preview.tokenId);
  if (!token) {
    return null;
  }

  const pathPoints = [
    getTokenCenterPoint(token, preview.startPosition),
    ...preview.waypoints.map((waypoint) => getTokenCenterPoint(token, waypoint)),
    getTokenCenterPoint(token, preview.snappedPosition)
  ];
  const distance = getMeasurementPathDistance(pathPoints, scene.grid, getMeasurementDistance);
  return formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type);
}

function getTokenCenterPoint(token: Token, position: Point): Point {
  return {
    x: position.x + token.size.width / 2,
    y: position.y + token.size.height / 2
  };
}

function getPlayerDisplayScale(campaign: Campaign | null, scene: Scene | null, mode: "gm" | "player"): number {
  if (mode !== "player" || !campaign?.playerDisplay?.physicalScaleEnabled || !scene || scene.grid.sizePx <= 0) {
    return 1;
  }
  const targetCellSize = campaign.playerDisplay.pixelsPerInch * campaign.playerDisplay.inchesPerGridCell;
  if (!Number.isFinite(targetCellSize) || targetCellSize <= 0) {
    return 1;
  }
  return targetCellSize / scene.grid.sizePx;
}

function getMaskHitAtPoint(scene: Scene, point: Point): { kind: "weather"; mask: WeatherMask } | { kind: "fog"; shape: Scene["fog"]["shapes"][number] } | null {
  for (const mask of [...scene.weather.masks].reverse()) {
    if ((mask.visible ?? true) && isPointInsideWeatherMask(point, mask)) {
      return { kind: "weather", mask };
    }
  }
  for (const shape of [...scene.fog.shapes].reverse()) {
    if ((shape.visibleInGm ?? shape.visible ?? true) && isPointInsideFogShape(point, shape)) {
      return { kind: "fog", shape };
    }
  }
  return null;
}

function getEnvironmentEffectAtPoint(scene: Scene, point: Point): EnvironmentEffectMask | null {
  for (const effect of [...scene.environment.effects].reverse()) {
    if ((effect.visibleInGm ?? true) && isPointInsideEnvironmentEffect(point, effect)) {
      return effect;
    }
  }
  return null;
}

function isPointInsideEnvironmentEffect(point: Point, effect: EnvironmentEffectMask): boolean {
  if (effect.kind === "circle") {
    return Boolean(effect.points[0] && distanceBetween(point, effect.points[0]) <= (effect.radius ?? 0));
  }
  if (effect.kind === "rectangle") {
    if (effect.points.length < 2) {
      return false;
    }
    const minX = Math.min(effect.points[0].x, effect.points[1].x);
    const maxX = Math.max(effect.points[0].x, effect.points[1].x);
    const minY = Math.min(effect.points[0].y, effect.points[1].y);
    const maxY = Math.max(effect.points[0].y, effect.points[1].y);
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }
  return isPointInsidePolygon(point, effect.points);
}

function isPointInsideWeatherMask(point: Point, mask: WeatherMask): boolean {
  if (mask.kind === "circle") {
    return Boolean(mask.points[0] && distanceBetween(point, mask.points[0]) <= (mask.radius ?? 0));
  }
  if (mask.kind === "rectangle") {
    if (mask.points.length < 2) {
      return false;
    }
    const minX = Math.min(mask.points[0].x, mask.points[1].x);
    const maxX = Math.max(mask.points[0].x, mask.points[1].x);
    const minY = Math.min(mask.points[0].y, mask.points[1].y);
    const maxY = Math.max(mask.points[0].y, mask.points[1].y);
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }
  return isPointInsidePolygon(point, mask.points);
}

function isPointInsidePolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) {
    return false;
  }
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    if ((current.y > point.y) !== (previous.y > point.y) && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x) {
      inside = !inside;
    }
  }
  return inside;
}

function isVisibleDiceOverlayEvent(event: LiveTableEvent, mode: "gm" | "player"): event is Extract<LiveTableEvent, { type: "dice" }> {
  return event.type === "dice" && shouldShowDiceOverlay(event, mode);
}

function shouldShowDiceOverlay(event: Extract<LiveTableEvent, { type: "dice" }>, mode: "gm" | "player"): boolean {
  const displayMode = mode === "gm" ? event.gmDiceDisplay : event.playerDiceDisplay;
  if (displayMode) {
    return displayMode !== "hidden";
  }
  const presentation = mode === "gm" ? event.gmPresentation : event.playerPresentation;
  return presentation ? presentation === "3d" : event.presentation === "3d";
}

function eventToWorldPoint(event: React.PointerEvent<HTMLCanvasElement>, camera: Camera): Point {
  return clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, camera);
}

function clientToWorldPoint(element: HTMLCanvasElement, clientX: number, clientY: number, camera: Camera): Point {
  const rect = element.getBoundingClientRect();
  return {
    x: (clientX - rect.left - camera.x) / camera.zoom,
    y: (clientY - rect.top - camera.y) / camera.zoom
  };
}

function getCanvasViewportCenter(element: HTMLCanvasElement, camera: Camera): Point {
  const rect = element.getBoundingClientRect();
  return {
    x: (rect.width / 2 - camera.x) / camera.zoom,
    y: (rect.height / 2 - camera.y) / camera.zoom
  };
}

function areCamerasEqual(a: Camera, b: Camera): boolean {
  return Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001 && Math.abs(a.zoom - b.zoom) < 0.0001;
}

async function prepareLoadedImageMap(image: HTMLImageElement, assetPath: string): Promise<{ optimizedSource: CanvasImageSource | null; optimizedScale: number }> {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const isAnimatedImage = assetPath.toLowerCase().endsWith(".gif");
  if (isAnimatedImage || sourceWidth <= 0 || sourceHeight <= 0 || typeof createImageBitmap !== "function") {
    return { optimizedSource: null, optimizedScale: 1 };
  }

  const resizeScale = getLargeMapCacheScale(sourceWidth, sourceHeight);
  if (resizeScale >= 1) {
    return { optimizedSource: null, optimizedScale: 1 };
  }

  const resizeWidth = Math.max(1, Math.round(sourceWidth * resizeScale));
  const resizeHeight = Math.max(1, Math.round(sourceHeight * resizeScale));
  const optimizedSource = await createImageBitmap(image, {
    resizeWidth,
    resizeHeight,
    resizeQuality: "high"
  });
  return { optimizedSource, optimizedScale: resizeScale };
}

function getLargeMapCacheScale(width: number, height: number): number {
  const edgeScale = Math.min(1, LARGE_MAP_CACHE_MAX_EDGE / Math.max(width, height));
  const pixelScale = Math.min(1, Math.sqrt(LARGE_MAP_CACHE_MAX_PIXELS / Math.max(1, width * height)));
  return Math.min(edgeScale, pixelScale);
}

function closeCanvasImageSource(source: CanvasImageSource | null) {
  if (source && "close" in source && typeof source.close === "function") {
    source.close();
  }
}

function getMapDrawSource(
  loadedMap: LoadedMap,
  scene: Scene,
  viewportWidth: number,
  viewportHeight: number,
  cameraZoom: number,
  mode: "gm" | "player"
): CanvasImageSource {
  if (mode === "player" || loadedMap.animate || !loadedMap.optimizedSource) {
    return loadedMap.originalSource;
  }

  const transform = resolveMapTransform(scene, loadedMap.sourceWidth, loadedMap.sourceHeight, viewportWidth, viewportHeight);
  const effectiveMapScale = Math.abs(transform.scale * cameraZoom);
  if (effectiveMapScale > loadedMap.optimizedScale * GM_FULL_QUALITY_MAP_SCALE_THRESHOLD) {
    return loadedMap.originalSource;
  }
  return loadedMap.optimizedSource;
}

function getReadyMapSourceForFit(loadedMap: LoadedMap | null, mapAssetId: string, activeVideo: HTMLVideoElement | null, isVideoMap: boolean): ReadyMapSource | null {
  if (!isVideoMap) {
    return loadedMap?.ready && loadedMap.assetId === mapAssetId
      ? { source: loadedMap.originalSource, width: loadedMap.sourceWidth, height: loadedMap.sourceHeight }
      : null;
  }
  if (
    activeVideo?.dataset.mapAssetId === mapAssetId &&
    activeVideo.readyState >= HTMLMediaElement.HAVE_METADATA &&
    activeVideo.videoWidth > 0 &&
    activeVideo.videoHeight > 0
  ) {
    return { source: activeVideo, width: activeVideo.videoWidth, height: activeVideo.videoHeight };
  }
  return null;
}

function getCameraForMapFit(scene: Scene, sourceWidth: number, sourceHeight: number, viewportWidth: number, viewportHeight: number): Camera {
  if (sourceWidth <= 0 || sourceHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { x: 0, y: 0, zoom: 1 };
  }

  const transform = resolveMapTransform(scene, sourceWidth, sourceHeight, viewportWidth, viewportHeight);
  const rotation = (transform.rotation * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const corners = [
    { x: 0, y: 0 },
    { x: sourceWidth, y: 0 },
    { x: sourceWidth, y: sourceHeight },
    { x: 0, y: sourceHeight }
  ].map((corner) => {
    const scaledX = corner.x * transform.scale;
    const scaledY = corner.y * transform.scale;
    return {
      x: transform.x + scaledX * cos - scaledY * sin,
      y: transform.y + scaledX * sin + scaledY * cos
    };
  });

  const minX = Math.min(...corners.map((corner) => corner.x));
  const maxX = Math.max(...corners.map((corner) => corner.x));
  const minY = Math.min(...corners.map((corner) => corner.y));
  const maxY = Math.max(...corners.map((corner) => corner.y));
  const mapWidth = Math.max(1, maxX - minX);
  const mapHeight = Math.max(1, maxY - minY);
  const padding = Math.min(48, Math.max(16, Math.min(viewportWidth, viewportHeight) * 0.04));
  const availableWidth = Math.max(1, viewportWidth - padding * 2);
  const availableHeight = Math.max(1, viewportHeight - padding * 2);
  const zoom = Math.min(6, Math.max(0.05, Math.min(availableWidth / mapWidth, availableHeight / mapHeight)));
  const centerX = minX + mapWidth / 2;
  const centerY = minY + mapHeight / 2;

  return {
    x: viewportWidth / 2 - centerX * zoom,
    y: viewportHeight / 2 - centerY * zoom,
    zoom
  };
}

function getRulerSnapPoint(point: Point, scene: Scene): Point | null {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return null;
  }
  if (scene.grid.type === "hex") {
    return getNearestHexCenter(point, scene.grid);
  }
  return getNearestGridCellCenter(point, scene.grid);
}

function getNearestSceneSnapPoint(point: Point, scene: Scene): Point | null {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return null;
  }
  const candidates =
    scene.grid.type === "hex"
      ? [getNearestHexCenter(point, scene.grid), getNearestHexVertex(point, scene.grid)]
      : [getNearestSquareGridSnapPoint(point, scene.grid)].filter((candidate): candidate is Point => Boolean(candidate));

  return candidates.reduce<Point | null>((nearest, candidate) => {
    if (!nearest) {
      return candidate;
    }
    return distanceBetween(candidate, point) < distanceBetween(nearest, point) ? candidate : nearest;
  }, null);
}

function isSnapModifier(event: React.PointerEvent<HTMLCanvasElement>): boolean {
  return event.ctrlKey || event.metaKey;
}

function constrainSquarePoint(start: Point, current: Point): Point {
  const width = current.x - start.x;
  const height = current.y - start.y;
  const size = Math.max(Math.abs(width), Math.abs(height));
  return {
    x: start.x + Math.sign(width || 1) * size,
    y: start.y + Math.sign(height || 1) * size
  };
}

function drawSnapMarker(ctx: CanvasRenderingContext2D, point: Point, camera: Camera, operation: "reveal" | "hide") {
  const screenX = point.x * camera.zoom + camera.x;
  const screenY = point.y * camera.zoom + camera.y;

  ctx.save();
  const scale = window.devicePixelRatio || 1;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = operation === "reveal" ? "#a7f3c5" : "#ffd2d2";
  ctx.strokeStyle = "#0b1118";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenX, screenY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBrushHoverPreview(ctx: CanvasRenderingContext2D, point: Point, radius: number, camera: Camera, operation: "reveal" | "hide") {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = operation === "reveal" ? "#8ee6a8" : "#ff9b9b";
  ctx.lineWidth = Math.max(1.5, 2 / camera.zoom);
  ctx.setLineDash([8 / camera.zoom, 5 / camera.zoom]);
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDrawingBrushHoverPreview(ctx: CanvasRenderingContext2D, point: Point, radius: number, camera: Camera, color: string, opacity: number) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.globalAlpha = Math.max(0.35, Math.min(1, opacity));
  ctx.lineWidth = Math.max(1.5, 2 / camera.zoom);
  ctx.setLineDash([8 / camera.zoom, 5 / camera.zoom]);
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSelectionMarquee(ctx: CanvasRenderingContext2D, drag: SelectionDrag, camera: Camera) {
  const rect = pointsToSelectionRect(drag.start, drag.current);
  ctx.save();
  const scale = window.devicePixelRatio || 1;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const x = rect.x * camera.zoom + camera.x;
  const y = rect.y * camera.zoom + camera.y;
  const width = rect.width * camera.zoom;
  const height = rect.height * camera.zoom;
  ctx.fillStyle = "rgb(122 162 247 / 0.14)";
  ctx.strokeStyle = "#7aa2f7";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 5]);
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

function drawDrawingResizeHandles(ctx: CanvasRenderingContext2D, drawings: Scene["drawings"], selectedDrawingIds: string[], camera: Camera) {
  const bounds = getSelectedResizableDrawingBounds(drawings, selectedDrawingIds);
  if (!bounds) {
    return;
  }
  const handles = getDrawingResizeHandles(bounds);
  const rotationHandle = getDrawingRotationHandle(bounds, camera);
  ctx.save();
  const scale = window.devicePixelRatio || 1;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const centerX = ((bounds.left + bounds.right) / 2) * camera.zoom + camera.x;
  const topY = bounds.top * camera.zoom + camera.y;
  const rotationX = rotationHandle.x * camera.zoom + camera.x;
  const rotationY = rotationHandle.y * camera.zoom + camera.y;
  ctx.strokeStyle = "#f6d365";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX, topY);
  ctx.lineTo(rotationX, rotationY);
  ctx.stroke();
  ctx.fillStyle = "#f6d365";
  ctx.strokeStyle = "#05070a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(rotationX, rotationY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (const handle of handles) {
    const x = handle.point.x * camera.zoom + camera.x;
    const y = handle.point.y * camera.zoom + camera.y;
    ctx.beginPath();
    ctx.rect(x - 4, y - 4, 8, 8);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function getDrawingRotationHandleAtPoint(drawings: Scene["drawings"], selectedDrawingIds: string[], point: Point, camera: Camera): { bounds: { left: number; top: number; right: number; bottom: number }; center: Point } | null {
  const bounds = getSelectedResizableDrawingBounds(drawings, selectedDrawingIds);
  if (!bounds) {
    return null;
  }
  const handlePoint = getDrawingRotationHandle(bounds, camera);
  const hitRadius = Math.max(9, 9 / Math.max(0.1, camera.zoom));
  if (distanceBetween(handlePoint, point) > hitRadius) {
    return null;
  }
  return {
    bounds,
    center: {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2
    }
  };
}

function getDrawingResizeHandleAtPoint(drawings: Scene["drawings"], selectedDrawingIds: string[], point: Point, camera: Camera): { handle: DrawingResizeHandle; bounds: { left: number; top: number; right: number; bottom: number } } | null {
  const bounds = getSelectedResizableDrawingBounds(drawings, selectedDrawingIds);
  if (!bounds) {
    return null;
  }
  const hitRadius = Math.max(8, 8 / Math.max(0.1, camera.zoom));
  for (const handle of getDrawingResizeHandles(bounds)) {
    if (distanceBetween(handle.point, point) <= hitRadius) {
      return { handle: handle.handle, bounds };
    }
  }
  return null;
}

function getDrawingRotationHandle(bounds: { left: number; top: number; right: number; bottom: number }, camera: Camera): Point {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: bounds.top - 30 / Math.max(0.1, camera.zoom)
  };
}

function getSelectedResizableDrawingBounds(drawings: Scene["drawings"], selectedDrawingIds: string[]): { left: number; top: number; right: number; bottom: number } | null {
  const selectedIds = new Set(selectedDrawingIds);
  const bounds = drawings
    .filter((drawing) => selectedIds.has(drawing.id) && !drawing.measurementLabelVisible)
    .map((drawing) => getDrawingBounds(drawing))
    .filter((drawingBounds): drawingBounds is { left: number; top: number; right: number; bottom: number } => Boolean(drawingBounds));
  if (bounds.length === 0) {
    return null;
  }
  return {
    left: Math.min(...bounds.map((drawingBounds) => drawingBounds.left)),
    top: Math.min(...bounds.map((drawingBounds) => drawingBounds.top)),
    right: Math.max(...bounds.map((drawingBounds) => drawingBounds.right)),
    bottom: Math.max(...bounds.map((drawingBounds) => drawingBounds.bottom))
  };
}

function getDrawingGroupBounds(drawings: Scene["drawings"]): { left: number; top: number; right: number; bottom: number } | null {
  const bounds = drawings.map((drawing) => getDrawingBounds(drawing)).filter((drawingBounds): drawingBounds is { left: number; top: number; right: number; bottom: number } => Boolean(drawingBounds));
  if (bounds.length === 0) {
    return null;
  }
  return {
    left: Math.min(...bounds.map((drawingBounds) => drawingBounds.left)),
    top: Math.min(...bounds.map((drawingBounds) => drawingBounds.top)),
    right: Math.max(...bounds.map((drawingBounds) => drawingBounds.right)),
    bottom: Math.max(...bounds.map((drawingBounds) => drawingBounds.bottom))
  };
}

function getDrawingResizeHandles(bounds: { left: number; top: number; right: number; bottom: number }): Array<{ handle: DrawingResizeHandle; point: Point }> {
  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;
  return [
    { handle: "nw", point: { x: bounds.left, y: bounds.top } },
    { handle: "n", point: { x: centerX, y: bounds.top } },
    { handle: "ne", point: { x: bounds.right, y: bounds.top } },
    { handle: "e", point: { x: bounds.right, y: centerY } },
    { handle: "se", point: { x: bounds.right, y: bounds.bottom } },
    { handle: "s", point: { x: centerX, y: bounds.bottom } },
    { handle: "sw", point: { x: bounds.left, y: bounds.bottom } },
    { handle: "w", point: { x: bounds.left, y: centerY } }
  ];
}

function resizeDrawingPoints(drawing: Scene["drawings"][number], bounds: { left: number; top: number; right: number; bottom: number }, handle: DrawingResizeHandle, current: Point, aspectLocked: boolean): Point[] {
  if (drawing.kind === "circle" || drawing.kind === "ellipse" || drawing.kind === "triangle") {
    return resizeCenterLockedDrawingPoints(drawing, handle, current, aspectLocked);
  }
  const points = drawing.points;
  const anchorX = handle.includes("w") ? bounds.right : handle.includes("e") ? bounds.left : (bounds.left + bounds.right) / 2;
  const anchorY = handle.includes("n") ? bounds.bottom : handle.includes("s") ? bounds.top : (bounds.top + bounds.bottom) / 2;
  const originalWidth = Math.max(1, bounds.right - bounds.left);
  const originalHeight = Math.max(1, bounds.bottom - bounds.top);
  let scaleX = handle === "n" || handle === "s" ? 1 : (current.x - anchorX) / ((handle.includes("w") ? bounds.left : bounds.right) - anchorX || 1);
  let scaleY = handle === "e" || handle === "w" ? 1 : (current.y - anchorY) / ((handle.includes("n") ? bounds.top : bounds.bottom) - anchorY || 1);

  if (aspectLocked && handle.length === 2) {
    const magnitude = Math.max(Math.abs(scaleX), Math.abs(scaleY));
    scaleX = Math.sign(scaleX || 1) * magnitude;
    scaleY = Math.sign(scaleY || 1) * magnitude;
  }

  const minScaleX = 12 / originalWidth;
  const minScaleY = 12 / originalHeight;
  if (Math.abs(scaleX) < minScaleX) {
    scaleX = Math.sign(scaleX || 1) * minScaleX;
  }
  if (Math.abs(scaleY) < minScaleY) {
    scaleY = Math.sign(scaleY || 1) * minScaleY;
  }

  return points.map((point) => ({
    x: anchorX + (point.x - anchorX) * scaleX,
    y: anchorY + (point.y - anchorY) * scaleY
  }));
}

function resizeCenterLockedDrawingPoints(drawing: Scene["drawings"][number], handle: DrawingResizeHandle, current: Point, aspectLocked: boolean): Point[] {
  const bounds = getDrawingBounds(drawing);
  if (!bounds) {
    return drawing.points;
  }
  const center = {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2
  };
  if (drawing.kind === "circle" && drawing.points[0] && drawing.points[1]) {
    const originalRadius = Math.max(1, distanceBetween(drawing.points[0], drawing.points[1]));
    const radius =
      handle === "n" || handle === "s"
        ? Math.abs(current.y - center.y)
        : handle === "e" || handle === "w"
          ? Math.abs(current.x - center.x)
          : Math.max(Math.abs(current.x - center.x), Math.abs(current.y - center.y));
    const safeRadius = Math.max(6, radius || originalRadius);
    return [center, { x: center.x + safeRadius, y: center.y }];
  }

  if (drawing.kind === "ellipse" && drawing.points[0] && drawing.points[1]) {
    const resizedPoints = resizeCenterLockedPoints(getEllipseAxisPoints(drawing.points), bounds, handle, current, aspectLocked);
    return [center, resizedPoints[1] ?? drawing.points[1], resizedPoints[2] ?? { x: center.x, y: drawing.points[1].y }];
  }

  if (drawing.kind === "triangle") {
    const trianglePoints = getTriangleDrawingPoints(drawing.points);
    return trianglePoints ? resizeCenterLockedPoints(trianglePoints, bounds, handle, current, aspectLocked) : drawing.points;
  }

  return resizeCenterLockedPoints(drawing.points, bounds, handle, current, aspectLocked);
}

function getTriangleDrawingPoints(points: Point[]): [Point, Point, Point] | null {
  if (points.length >= 3) {
    return [points[0], points[1], points[2]];
  }
  if (points.length < 2) {
    return null;
  }
  const [start, end] = points;
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return [
    start,
    end,
    {
      x: midpoint.x - dy * 0.866,
      y: midpoint.y + dx * 0.866
    }
  ];
}

function rotatePoints(points: Point[], center: Point, angle: number): Point[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map((point) => {
    const x = point.x - center.x;
    const y = point.y - center.y;
    return {
      x: center.x + x * cos - y * sin,
      y: center.y + x * sin + y * cos
    };
  });
}

function rotateDrawingPoints(drawing: Scene["drawings"][number], center: Point, angle: number): Point[] {
  if (drawing.kind === "rectangle" && drawing.points.length === 2) {
    return rotatePoints(getRectangleDrawingPoints(drawing.points), center, angle);
  }
  if (drawing.kind === "ellipse" && drawing.points[0] && drawing.points[1]) {
    return rotatePoints(getEllipseAxisPoints(drawing.points), center, angle);
  }
  if (drawing.kind === "triangle") {
    const trianglePoints = getTriangleDrawingPoints(drawing.points);
    return trianglePoints ? rotatePoints(trianglePoints, center, angle) : drawing.points;
  }
  return rotatePoints(drawing.points, center, angle);
}

function getRectangleDrawingPoints(points: Point[]): Point[] {
  const [start, end] = points;
  return [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x, y: end.y }
  ];
}

function getEllipseAxisPoints(points: Point[]): Point[] {
  const [center, edge, axis] = points;
  if (axis) {
    return [center, edge, axis];
  }
  return [
    center,
    { x: edge.x, y: center.y },
    { x: center.x, y: edge.y }
  ];
}

function resizeCenterLockedPoints(points: Point[], bounds: { left: number; top: number; right: number; bottom: number }, handle: DrawingResizeHandle, current: Point, aspectLocked: boolean): Point[] {
  const center = {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2
  };
  const originalWidth = Math.max(1, bounds.right - bounds.left);
  const originalHeight = Math.max(1, bounds.bottom - bounds.top);
  let scaleX = handle === "n" || handle === "s" ? 1 : ((current.x - center.x) * 2) / ((handle.includes("w") ? bounds.left : bounds.right) - center.x || 1);
  let scaleY = handle === "e" || handle === "w" ? 1 : ((current.y - center.y) * 2) / ((handle.includes("n") ? bounds.top : bounds.bottom) - center.y || 1);
  if (aspectLocked && handle.length === 2) {
    const magnitude = Math.max(Math.abs(scaleX), Math.abs(scaleY));
    scaleX = Math.sign(scaleX || 1) * magnitude;
    scaleY = Math.sign(scaleY || 1) * magnitude;
  }

  const minScaleX = 12 / originalWidth;
  const minScaleY = 12 / originalHeight;
  if (Math.abs(scaleX) < minScaleX) {
    scaleX = Math.sign(scaleX || 1) * minScaleX;
  }
  if (Math.abs(scaleY) < minScaleY) {
    scaleY = Math.sign(scaleY || 1) * minScaleY;
  }

  return points.map((point) => ({
    x: center.x + (point.x - center.x) * scaleX,
    y: center.y + (point.y - center.y) * scaleY
  }));
}

function drawWeatherMaskPreview(ctx: CanvasRenderingContext2D, preview: WeatherMaskDrag, camera: Camera) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.strokeStyle = "#8bc6ff";
  ctx.fillStyle = "rgb(139 198 255 / 0.12)";
  ctx.lineWidth = Math.max(1.5, 2 / camera.zoom);
  ctx.setLineDash([8 / camera.zoom, 5 / camera.zoom]);
  if (preview.kind === "circle") {
    ctx.beginPath();
    ctx.arc(preview.start.x, preview.start.y, distanceBetween(preview.start, preview.current), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const x = Math.min(preview.start.x, preview.current.x);
    const y = Math.min(preview.start.y, preview.current.y);
    const width = Math.abs(preview.current.x - preview.start.x);
    const height = Math.abs(preview.current.y - preview.start.y);
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  }
  ctx.restore();
}

function drawMapCalibrationBox(ctx: CanvasRenderingContext2D, box: MapCalibrationBox | null, camera: Camera) {
  if (!box) {
    return;
  }
  ctx.save();
  const scale = window.devicePixelRatio || 1;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const x = box.x * camera.zoom + camera.x;
  const y = box.y * camera.zoom + camera.y;
  const width = box.width * camera.zoom;
  const height = box.height * camera.zoom;
  ctx.fillStyle = "rgb(246 195 67 / 0.16)";
  ctx.strokeStyle = "#f6c343";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y + height);
  ctx.moveTo(x + width, y);
  ctx.lineTo(x, y + height);
  ctx.stroke();
  ctx.fillStyle = "#f6d98a";
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.fillText(`${Math.round(box.width)} x ${Math.round(box.height)}px`, x + 8, y - 8);
  ctx.fillStyle = "#0b1118";
  ctx.strokeStyle = "#f6d98a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x + width - 7, y + height - 7, 14, 14);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function getVisibleMapCalibrationBox(drag: MapCalibrationDrag | null, fallback: MapCalibrationBox | null): MapCalibrationBox | null {
  if (!drag) {
    return fallback;
  }
  if (drag.mode === "move" && drag.box && drag.offset) {
    return {
      ...drag.box,
      x: drag.current.x - drag.offset.x,
      y: drag.current.y - drag.offset.y
    };
  }
  return getSquareCalibrationBox(drag.start, drag.current);
}

function getSquareCalibrationBox(start: Point, current: Point): MapCalibrationBox {
  const width = current.x - start.x;
  const height = current.y - start.y;
  const size = Math.max(Math.abs(width), Math.abs(height));
  const endX = start.x + Math.sign(width || 1) * size;
  const endY = start.y + Math.sign(height || 1) * size;
  const x = Math.min(start.x, endX);
  const y = Math.min(start.y, endY);
  return {
    x,
    y,
    width: size,
    height: size
  };
}

function getMapCalibrationBoxHit(point: Point, box: MapCalibrationBox, camera: Camera): "move" | "resize" | null {
  const handleSize = 14 / Math.max(0.1, camera.zoom);
  const handleLeft = box.x + box.width - handleSize / 2;
  const handleTop = box.y + box.height - handleSize / 2;
  if (point.x >= handleLeft && point.x <= handleLeft + handleSize && point.y >= handleTop && point.y <= handleTop + handleSize) {
    return "resize";
  }
  if (point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height) {
    return "move";
  }
  return null;
}

function drawEnvironmentEffectPreview(ctx: CanvasRenderingContext2D, preview: EnvironmentEffectDrag, camera: Camera) {
  const effectMask = environmentDragToMask(preview);
  drawEnvironmentEffectShape(ctx, effectMask, camera, { fill: true, selected: false });
}

function drawEnvironmentEffects(
  ctx: CanvasRenderingContext2D,
  effects: EnvironmentEffectMask[],
  camera: Camera,
  mode: "gm" | "player",
  timestamp: number,
  layerOpacity: number,
  acidEffectTuning?: AcidEffectTuning,
  coldEffectTuning?: ColdEffectTuning,
  darknessEffectTuning?: DarknessEffectTuning,
  poisonEffectTuning?: PoisonEffectTuning,
  waterEffectTuning?: WaterEffectTuning,
  lavaEffectTuning?: LavaEffectTuning,
  fireEffectTuning?: FireEffectTuning,
  lightningEffectTuning?: LightningEffectTuning,
  arcaneEffectTuning?: ArcaneEffectTuning,
  chaosEffectTuning?: ChaosEffectTuning,
  voidEffectTuning?: VoidEffectTuning,
  natureEffectTuning?: NatureEffectTuning,
  distortionEffectTuning?: DistortionEffectTuning,
  radiantEffectTuning?: RadiantEffectTuning,
  forceFieldEffectTuning?: ForceFieldEffectTuning,
  shockwaveEffectTuning?: ShockwaveEffectTuning,
  smokeEffectTuning?: SmokeEffectTuning,
  fogEffectTuning?: FogEffectTuning
) {
  for (const effect of effects) {
    const visible = mode === "gm" ? effect.visibleInGm !== false : effect.visibleInPlayer !== false;
    if (!visible) {
      continue;
    }
    const feather = Math.max(0, Math.min(1, effect.feather ?? 0));
    if (feather > 0) {
      drawFeatheredEnvironmentEffect(ctx, effect, camera, timestamp, layerOpacity, feather, acidEffectTuning, coldEffectTuning, darknessEffectTuning, poisonEffectTuning, waterEffectTuning, lavaEffectTuning, fireEffectTuning, lightningEffectTuning, arcaneEffectTuning, chaosEffectTuning, voidEffectTuning, natureEffectTuning, distortionEffectTuning, radiantEffectTuning, forceFieldEffectTuning, shockwaveEffectTuning, smokeEffectTuning, fogEffectTuning);
      continue;
    }
    ctx.save();
    const path = getEnvironmentEffectPath(effect, camera);
    ctx.clip(path);
    if (effect.effect === "acid") {
      drawAcidEffect(ctx, effect, camera, timestamp, layerOpacity, acidEffectTuning);
    } else if (effect.effect === "cold") {
      drawColdEffect(ctx, effect, camera, timestamp, layerOpacity, coldEffectTuning);
    } else if (effect.effect === "darkness") {
      drawDarknessEffect(ctx, effect, camera, timestamp, layerOpacity, darknessEffectTuning);
    } else if (effect.effect === "poison") {
      drawPoisonEffect(ctx, effect, camera, timestamp, layerOpacity, poisonEffectTuning);
    } else if (effect.effect === "lava") {
      drawLavaEffect(ctx, effect, camera, timestamp, layerOpacity, lavaEffectTuning);
    } else if (effect.effect === "fire") {
      drawFireEffect(ctx, effect, camera, timestamp, layerOpacity, fireEffectTuning);
    } else if (effect.effect === "electric") {
      drawLightningEffect(ctx, effect, camera, timestamp, layerOpacity, lightningEffectTuning);
    } else if (effect.effect === "arcane") {
      drawArcaneEffect(ctx, effect, camera, timestamp, layerOpacity, arcaneEffectTuning);
    } else if (effect.effect === "chaos") {
      drawChaosEffect(ctx, effect, camera, timestamp, layerOpacity, chaosEffectTuning);
    } else if (effect.effect === "void") {
      drawVoidEffect(ctx, effect, camera, timestamp, layerOpacity, voidEffectTuning);
    } else if (effect.effect === "nature") {
      drawNatureEffect(ctx, effect, camera, timestamp, layerOpacity, natureEffectTuning);
    } else if (effect.effect === "distortion") {
      drawDistortionEffect(ctx, effect, camera, timestamp, layerOpacity, distortionEffectTuning);
    } else if (effect.effect === "radiant") {
      drawRadiantEffect(ctx, effect, camera, timestamp, layerOpacity, radiantEffectTuning);
    } else if (effect.effect === "field") {
      drawForceFieldEffect(ctx, effect, camera, timestamp, layerOpacity, forceFieldEffectTuning);
    } else if (effect.effect === "shockwave") {
      drawShockwaveEffect(ctx, effect, camera, timestamp, layerOpacity, shockwaveEffectTuning);
    } else if (effect.effect === "fog") {
      drawFogMistEffect(ctx, effect, camera, timestamp, layerOpacity, fogEffectTuning);
    } else if (effect.effect === "smoke") {
      drawSmokeEffect(ctx, effect, camera, timestamp, layerOpacity, smokeEffectTuning);
    } else {
      drawWaterEffect(ctx, effect, camera, timestamp, layerOpacity, waterEffectTuning);
    }
    ctx.restore();
  }
}

function drawFeatheredEnvironmentEffect(
  ctx: CanvasRenderingContext2D,
  effect: EnvironmentEffectMask,
  camera: Camera,
  timestamp: number,
  layerOpacity: number,
  feather: number,
  acidEffectTuning?: AcidEffectTuning,
  coldEffectTuning?: ColdEffectTuning,
  darknessEffectTuning?: DarknessEffectTuning,
  poisonEffectTuning?: PoisonEffectTuning,
  waterEffectTuning?: WaterEffectTuning,
  lavaEffectTuning?: LavaEffectTuning,
  fireEffectTuning?: FireEffectTuning,
  lightningEffectTuning?: LightningEffectTuning,
  arcaneEffectTuning?: ArcaneEffectTuning,
  chaosEffectTuning?: ChaosEffectTuning,
  voidEffectTuning?: VoidEffectTuning,
  natureEffectTuning?: NatureEffectTuning,
  distortionEffectTuning?: DistortionEffectTuning,
  radiantEffectTuning?: RadiantEffectTuning,
  forceFieldEffectTuning?: ForceFieldEffectTuning,
  shockwaveEffectTuning?: ShockwaveEffectTuning,
  smokeEffectTuning?: SmokeEffectTuning,
  fogEffectTuning?: FogEffectTuning
) {
  const width = Math.max(1, Math.round(ctx.canvas.width / (window.devicePixelRatio || 1)));
  const height = Math.max(1, Math.round(ctx.canvas.height / (window.devicePixelRatio || 1)));
  const effectCanvas = document.createElement("canvas");
  effectCanvas.width = width;
  effectCanvas.height = height;
  const effectCtx = effectCanvas.getContext("2d");
  if (!effectCtx) {
    return;
  }

  const path = getEnvironmentEffectPath(effect, camera);
  effectCtx.save();
  effectCtx.clip(path);
  if (effect.effect === "acid") {
    drawAcidEffect(effectCtx, effect, camera, timestamp, layerOpacity, acidEffectTuning);
  } else if (effect.effect === "cold") {
    drawColdEffect(effectCtx, effect, camera, timestamp, layerOpacity, coldEffectTuning);
  } else if (effect.effect === "darkness") {
    drawDarknessEffect(effectCtx, effect, camera, timestamp, layerOpacity, darknessEffectTuning);
  } else if (effect.effect === "poison") {
    drawPoisonEffect(effectCtx, effect, camera, timestamp, layerOpacity, poisonEffectTuning);
  } else if (effect.effect === "lava") {
    drawLavaEffect(effectCtx, effect, camera, timestamp, layerOpacity, lavaEffectTuning);
  } else if (effect.effect === "fire") {
    drawFireEffect(effectCtx, effect, camera, timestamp, layerOpacity, fireEffectTuning);
  } else if (effect.effect === "electric") {
    drawLightningEffect(effectCtx, effect, camera, timestamp, layerOpacity, lightningEffectTuning);
  } else if (effect.effect === "arcane") {
    drawArcaneEffect(effectCtx, effect, camera, timestamp, layerOpacity, arcaneEffectTuning);
  } else if (effect.effect === "chaos") {
    drawChaosEffect(effectCtx, effect, camera, timestamp, layerOpacity, chaosEffectTuning);
  } else if (effect.effect === "void") {
    drawVoidEffect(effectCtx, effect, camera, timestamp, layerOpacity, voidEffectTuning);
  } else if (effect.effect === "nature") {
    drawNatureEffect(effectCtx, effect, camera, timestamp, layerOpacity, natureEffectTuning);
  } else if (effect.effect === "distortion") {
    drawDistortionEffect(effectCtx, effect, camera, timestamp, layerOpacity, distortionEffectTuning);
  } else if (effect.effect === "radiant") {
    drawRadiantEffect(effectCtx, effect, camera, timestamp, layerOpacity, radiantEffectTuning);
  } else if (effect.effect === "field") {
    drawForceFieldEffect(effectCtx, effect, camera, timestamp, layerOpacity, forceFieldEffectTuning);
  } else if (effect.effect === "shockwave") {
    drawShockwaveEffect(effectCtx, effect, camera, timestamp, layerOpacity, shockwaveEffectTuning);
  } else if (effect.effect === "fog") {
    drawFogMistEffect(effectCtx, effect, camera, timestamp, layerOpacity, fogEffectTuning);
  } else if (effect.effect === "smoke") {
    drawSmokeEffect(effectCtx, effect, camera, timestamp, layerOpacity, smokeEffectTuning);
  } else {
    drawWaterEffect(effectCtx, effect, camera, timestamp, layerOpacity, waterEffectTuning);
  }
  effectCtx.restore();

  applyEnvironmentEffectFeather(effectCtx, effect, camera, feather);
  ctx.drawImage(effectCanvas, 0, 0, width, height);
}

function applyEnvironmentEffectFeather(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, feather: number) {
  const path = getEnvironmentEffectPath(effect, camera);
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const shortestEdge = Math.max(1, Math.min(Math.abs(screenBounds.width), Math.abs(screenBounds.height)));
  const featherPx = Math.max(10, shortestEdge * (0.06 + feather * 0.34));

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  if (effect.kind === "rectangle") {
    applyRectangleEnvironmentFeather(ctx, screenBounds, featherPx);
  } else if (effect.kind === "circle") {
    applyCircleEnvironmentFeather(ctx, screenBounds, featherPx);
  } else if (effect.kind === "polygon") {
    applyPolygonEnvironmentFeather(ctx, effect, camera, featherPx);
  } else {
    ctx.fillStyle = "#000";
    ctx.fill(path);
  }
  ctx.restore();

  if (effect.kind === "rectangle" || effect.kind === "circle" || effect.kind === "polygon") {
    return;
  }

  ctx.save();
  ctx.clip(path);
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "#000";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const steps = 12;
  for (let step = 0; step < steps; step += 1) {
    const progress = (step + 1) / steps;
    ctx.globalAlpha = Math.pow(progress, 1.45) * 0.09;
    ctx.lineWidth = featherPx * 2 * progress;
    ctx.stroke(path);
  }
  ctx.restore();
}

function applyRectangleEnvironmentFeather(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, featherPx: number) {
  const x = Math.min(bounds.x, bounds.x + bounds.width);
  const y = Math.min(bounds.y, bounds.y + bounds.height);
  const width = Math.abs(bounds.width);
  const height = Math.abs(bounds.height);
  if (width <= 1 || height <= 1) {
    return;
  }

  const feather = Math.min(featherPx, width / 2, height / 2);
  const maskWidth = Math.max(1, Math.ceil(width));
  const maskHeight = Math.max(1, Math.ceil(height));
  const cacheKey = `rect:${maskWidth}:${maskHeight}:${roundMaskValue(feather)}`;
  const mask = getEnvironmentFeatherMask(cacheKey, maskWidth, maskHeight, (pixelX, pixelY) => {
    const distanceToEdge = Math.min(pixelX, maskWidth - pixelX, pixelY, maskHeight - pixelY);
    return getEnvironmentFeatherAlpha(distanceToEdge / feather);
  });
  ctx.drawImage(mask, x, y, width, height);
}

function applyCircleEnvironmentFeather(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, featherPx: number) {
  const radius = Math.max(1, Math.min(Math.abs(bounds.width), Math.abs(bounds.height)) / 2);
  const feather = Math.min(featherPx, radius);
  const size = Math.max(1, Math.ceil(radius * 2));
  const center = size / 2;
  const cacheKey = `circle:${size}:${roundMaskValue(feather)}`;
  const mask = getEnvironmentFeatherMask(cacheKey, size, size, (pixelX, pixelY) => {
    const distanceFromCenter = Math.hypot(pixelX - center, pixelY - center);
    if (distanceFromCenter > radius) {
      return 0;
    }
    return getEnvironmentFeatherAlpha((radius - distanceFromCenter) / feather);
  });
  ctx.drawImage(mask, bounds.x, bounds.y, bounds.width, bounds.height);
}

function applyPolygonEnvironmentFeather(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, featherPx: number) {
  if (effect.points.length < 3) {
    return;
  }
  const screenPoints = effect.points.map((point) => worldToScreenPoint(point, camera));
  const bounds = getPointBounds(screenPoints);
  const maskWidth = Math.max(1, Math.ceil(bounds.width));
  const maskHeight = Math.max(1, Math.ceil(bounds.height));
  const localPoints = screenPoints.map((point) => ({ x: point.x - bounds.x, y: point.y - bounds.y }));
  const cacheKey = `poly:${maskWidth}:${maskHeight}:${roundMaskValue(featherPx)}:${localPoints.map((point) => `${roundMaskValue(point.x)},${roundMaskValue(point.y)}`).join(";")}`;
  const mask = getEnvironmentFeatherMask(cacheKey, maskWidth, maskHeight, (pixelX, pixelY) => {
    const point = { x: pixelX, y: pixelY };
    if (!isPointInPolygon(point, localPoints)) {
      return 0;
    }
    const distanceToEdge = getDistanceToPolygonEdge(point, localPoints);
    return getEnvironmentFeatherAlpha(distanceToEdge / featherPx);
  });
  ctx.drawImage(mask, bounds.x, bounds.y, bounds.width, bounds.height);
}

function getEnvironmentFeatherAlpha(progress: number): number {
  return Math.pow(Math.max(0, Math.min(1, progress)), 1.85);
}

function roundMaskValue(value: number): number {
  return Math.round(value * 10) / 10;
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const crossesY = current.y > point.y !== previous.y > point.y;
    if (crossesY) {
      const intersectionX = ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y || 1) + current.x;
      if (point.x < intersectionX) {
        inside = !inside;
      }
    }
  }
  return inside;
}

function getDistanceToPolygonEdge(point: Point, polygon: Point[]): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    nearest = Math.min(nearest, getDistanceToSegment(point, start, end));
  }
  return nearest;
}

function getDistanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t));
}

function getEnvironmentFeatherMask(key: string, width: number, height: number, alphaAt: (x: number, y: number) => number): HTMLCanvasElement {
  const cached = environmentFeatherMaskCache.get(key);
  if (cached) {
    environmentFeatherMaskCache.delete(key);
    environmentFeatherMaskCache.set(key, cached);
    return cached;
  }
  const mask = createEnvironmentFeatherMask(width, height, alphaAt);
  environmentFeatherMaskCache.set(key, mask);
  while (environmentFeatherMaskCache.size > ENVIRONMENT_FEATHER_MASK_CACHE_LIMIT) {
    const oldestKey = environmentFeatherMaskCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    environmentFeatherMaskCache.delete(oldestKey);
  }
  return mask;
}

function createEnvironmentFeatherMask(width: number, height: number, alphaAt: (x: number, y: number) => number): HTMLCanvasElement {
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const maskCtx = mask.getContext("2d");
  if (!maskCtx) {
    return mask;
  }
  const image = maskCtx.createImageData(width, height);
  for (let pixelY = 0; pixelY < height; pixelY += 1) {
    for (let pixelX = 0; pixelX < width; pixelX += 1) {
      const offset = (pixelY * width + pixelX) * 4;
      image.data[offset] = 0;
      image.data[offset + 1] = 0;
      image.data[offset + 2] = 0;
      image.data[offset + 3] = Math.round(alphaAt(pixelX + 0.5, pixelY + 0.5) * 255);
    }
  }
  maskCtx.putImageData(image, 0, 0);
  return mask;
}

function shouldAnimateEnvironmentEffects(scene: Scene | null, mode: "gm" | "player", layerVisible: boolean): boolean {
  return Boolean(
    scene &&
      layerVisible &&
      scene.environment.effects.some((effect) => (mode === "gm" ? effect.visibleInGm !== false : effect.visibleInPlayer !== false))
  );
}

function drawWaterEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, waterEffectTuning?: WaterEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.waterTuning ? { ...DEFAULT_WATER_EFFECT_TUNING, ...effect.waterTuning } : waterEffectTuning;
  drawEnvironmentWaterEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawAcidEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, acidEffectTuning?: AcidEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.acidTuning ? { ...DEFAULT_ACID_EFFECT_TUNING, ...effect.acidTuning } : acidEffectTuning;
  drawEnvironmentAcidEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawPoisonEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, poisonEffectTuning?: PoisonEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.poisonTuning ? { ...DEFAULT_POISON_EFFECT_TUNING, ...effect.poisonTuning } : poisonEffectTuning;
  drawEnvironmentPoisonEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawColdEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, coldEffectTuning?: ColdEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.coldTuning ? { ...DEFAULT_COLD_EFFECT_TUNING, ...effect.coldTuning } : coldEffectTuning;
  drawEnvironmentColdEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawDarknessEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, darknessEffectTuning?: DarknessEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.darknessTuning ? { ...DEFAULT_DARKNESS_EFFECT_TUNING, ...effect.darknessTuning } : darknessEffectTuning;
  drawEnvironmentDarknessEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function cloneWaterEffectTuning(tuning?: WaterEffectTuning): WaterEffectTuning {
  return { ...(tuning ?? DEFAULT_WATER_EFFECT_TUNING) };
}

function cloneAcidEffectTuning(tuning?: AcidEffectTuning): AcidEffectTuning {
  return { ...(tuning ?? DEFAULT_ACID_EFFECT_TUNING) };
}

function clonePoisonEffectTuning(tuning?: PoisonEffectTuning): PoisonEffectTuning {
  return { ...(tuning ?? DEFAULT_POISON_EFFECT_TUNING) };
}

function cloneColdEffectTuning(tuning?: ColdEffectTuning): ColdEffectTuning {
  return { ...(tuning ?? DEFAULT_COLD_EFFECT_TUNING) };
}

function cloneDarknessEffectTuning(tuning?: DarknessEffectTuning): DarknessEffectTuning {
  return { ...(tuning ?? DEFAULT_DARKNESS_EFFECT_TUNING) };
}

function cloneLavaEffectTuning(tuning?: LavaEffectTuning): LavaEffectTuning {
  return { ...(tuning ?? DEFAULT_LAVA_EFFECT_TUNING) };
}

function cloneFireEffectTuning(tuning?: FireEffectTuning): FireEffectTuning {
  return { ...(tuning ?? DEFAULT_FIRE_EFFECT_TUNING) };
}

function cloneLightningEffectTuning(tuning?: LightningEffectTuning): LightningEffectTuning {
  return { ...(tuning ?? DEFAULT_LIGHTNING_EFFECT_TUNING) };
}

function cloneArcaneEffectTuning(tuning?: ArcaneEffectTuning): ArcaneEffectTuning {
  return { ...(tuning ?? DEFAULT_ARCANE_EFFECT_TUNING) };
}

function cloneChaosEffectTuning(tuning?: ChaosEffectTuning): ChaosEffectTuning {
  return { ...(tuning ?? DEFAULT_CHAOS_EFFECT_TUNING) };
}

function cloneVoidEffectTuning(tuning?: VoidEffectTuning): VoidEffectTuning {
  return { ...(tuning ?? DEFAULT_VOID_EFFECT_TUNING) };
}

function cloneNatureEffectTuning(tuning?: NatureEffectTuning): NatureEffectTuning {
  return { ...(tuning ?? DEFAULT_NATURE_EFFECT_TUNING) };
}

function cloneDistortionEffectTuning(tuning?: DistortionEffectTuning): DistortionEffectTuning {
  return { ...(tuning ?? DEFAULT_DISTORTION_EFFECT_TUNING) };
}

function cloneRadiantEffectTuning(tuning?: RadiantEffectTuning): RadiantEffectTuning {
  return { ...(tuning ?? DEFAULT_RADIANT_EFFECT_TUNING) };
}

function cloneForceFieldEffectTuning(tuning?: ForceFieldEffectTuning): ForceFieldEffectTuning {
  return { ...(tuning ?? DEFAULT_FORCE_FIELD_EFFECT_TUNING) };
}

function cloneShockwaveEffectTuning(tuning?: ShockwaveEffectTuning): ShockwaveEffectTuning {
  return { ...(tuning ?? DEFAULT_SHOCKWAVE_EFFECT_TUNING) };
}

function cloneSmokeEffectTuning(tuning?: SmokeEffectTuning): SmokeEffectTuning {
  return { ...(tuning ?? DEFAULT_SMOKE_EFFECT_TUNING) };
}

function cloneFogEffectTuning(tuning?: FogEffectTuning): FogEffectTuning {
  return { ...(tuning ?? DEFAULT_FOG_EFFECT_TUNING) };
}

function drawLavaEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, lavaEffectTuning?: LavaEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.lavaTuning ? { ...DEFAULT_LAVA_EFFECT_TUNING, ...effect.lavaTuning } : lavaEffectTuning;
  drawEnvironmentLavaEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawFireEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, fireEffectTuning?: FireEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.fireTuning ? { ...DEFAULT_FIRE_EFFECT_TUNING, ...effect.fireTuning } : fireEffectTuning;
  drawEnvironmentFireEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawLightningEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, lightningEffectTuning?: LightningEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.lightningTuning ? { ...DEFAULT_LIGHTNING_EFFECT_TUNING, ...effect.lightningTuning } : lightningEffectTuning;
  drawEnvironmentLightningEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawArcaneEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, arcaneEffectTuning?: ArcaneEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.arcaneTuning ? { ...DEFAULT_ARCANE_EFFECT_TUNING, ...effect.arcaneTuning } : arcaneEffectTuning;
  drawEnvironmentArcaneEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawChaosEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, chaosEffectTuning?: ChaosEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.chaosTuning ? { ...DEFAULT_CHAOS_EFFECT_TUNING, ...effect.chaosTuning } : chaosEffectTuning;
  drawEnvironmentChaosEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawVoidEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, voidEffectTuning?: VoidEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.voidTuning ? { ...DEFAULT_VOID_EFFECT_TUNING, ...effect.voidTuning } : voidEffectTuning;
  drawEnvironmentVoidEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawNatureEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, natureEffectTuning?: NatureEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.natureTuning ? { ...DEFAULT_NATURE_EFFECT_TUNING, ...effect.natureTuning } : natureEffectTuning;
  drawEnvironmentNatureEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawDistortionEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, distortionEffectTuning?: DistortionEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.distortionTuning ? { ...DEFAULT_DISTORTION_EFFECT_TUNING, ...effect.distortionTuning } : distortionEffectTuning;
  drawEnvironmentDistortionEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawRadiantEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, radiantEffectTuning?: RadiantEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.radiantTuning ? { ...DEFAULT_RADIANT_EFFECT_TUNING, ...effect.radiantTuning } : radiantEffectTuning;
  drawEnvironmentRadiantEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawForceFieldEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, forceFieldEffectTuning?: ForceFieldEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.fieldTuning ? { ...DEFAULT_FORCE_FIELD_EFFECT_TUNING, ...effect.fieldTuning } : forceFieldEffectTuning;
  drawEnvironmentForceFieldEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawShockwaveEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, shockwaveEffectTuning?: ShockwaveEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.shockwaveTuning ? { ...DEFAULT_SHOCKWAVE_EFFECT_TUNING, ...effect.shockwaveTuning } : shockwaveEffectTuning;
  drawEnvironmentShockwaveEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawSmokeEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, smokeEffectTuning?: SmokeEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.smokeTuning ? { ...DEFAULT_SMOKE_EFFECT_TUNING, ...effect.smokeTuning } : smokeEffectTuning;
  drawEnvironmentSmokeEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawFogMistEffect(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, timestamp: number, layerOpacity: number, fogEffectTuning?: FogEffectTuning) {
  const bounds = getEnvironmentEffectBounds(effect);
  if (!bounds) {
    return;
  }
  const screenBounds = worldRectToScreen(bounds, camera);
  const tuning = effect.fogTuning ? { ...DEFAULT_FOG_EFFECT_TUNING, ...effect.fogTuning } : fogEffectTuning;
  drawEnvironmentFogEffect(ctx, screenBounds, timestamp, layerOpacity, camera, tuning);
}

function drawEnvironmentEffectShape(ctx: CanvasRenderingContext2D, effect: EnvironmentEffectMask, camera: Camera, options: { fill: boolean; selected: boolean }) {
  const path = getEnvironmentEffectPath(effect, camera);
  ctx.save();
  if (options.fill) {
    ctx.fillStyle = getEnvironmentEffectPreviewFill(effect.effect);
    ctx.fill(path);
  }
  ctx.strokeStyle = options.selected ? "#facc15" : getEnvironmentEffectStroke(effect.effect);
  ctx.lineWidth = Math.max(2, 2.5 * camera.zoom);
  ctx.setLineDash([Math.max(8, 8 * camera.zoom), Math.max(5, 5 * camera.zoom)]);
  ctx.stroke(path);
  ctx.restore();
}

function getEnvironmentEffectPath(effect: EnvironmentEffectMask, camera: Camera): Path2D {
  const path = new Path2D();
  if (effect.kind === "rectangle" && effect.points.length >= 2) {
    const start = worldToScreenPoint(effect.points[0], camera);
    const end = worldToScreenPoint(effect.points[1], camera);
    path.rect(Math.min(start.x, end.x), Math.min(start.y, end.y), Math.abs(end.x - start.x), Math.abs(end.y - start.y));
    return path;
  }
  if (effect.kind === "circle" && effect.points[0] && effect.radius) {
    const center = worldToScreenPoint(effect.points[0], camera);
    path.moveTo(center.x + effect.radius * camera.zoom, center.y);
    path.arc(center.x, center.y, effect.radius * camera.zoom, 0, Math.PI * 2);
    return path;
  }
  if (effect.kind === "polygon" && effect.points.length >= 3) {
    const start = worldToScreenPoint(effect.points[0], camera);
    path.moveTo(start.x, start.y);
    for (const point of effect.points.slice(1)) {
      const screenPoint = worldToScreenPoint(point, camera);
      path.lineTo(screenPoint.x, screenPoint.y);
    }
    path.closePath();
  }
  return path;
}

function worldRectToScreen(bounds: { x: number; y: number; width: number; height: number }, camera: Camera): { x: number; y: number; width: number; height: number } {
  const topLeft = worldToScreenPoint({ x: bounds.x, y: bounds.y }, camera);
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bounds.width * camera.zoom,
    height: bounds.height * camera.zoom
  };
}

function worldToScreenPoint(point: Point, camera: Camera): Point {
  return {
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y
  };
}

function environmentDragToMask(drag: EnvironmentEffectDrag): EnvironmentEffectMask {
  return {
    id: "preview",
    kind: drag.kind,
    effect: drag.effect,
    feather: drag.feather,
    points: drag.kind === "circle" ? [drag.start] : [drag.start, drag.current],
    radius: drag.kind === "circle" ? distanceBetween(drag.start, drag.current) : undefined,
    visibleInGm: true,
    visibleInPlayer: true
  };
}

function isMeaningfulEnvironmentEffectDrag(drag: EnvironmentEffectDrag): boolean {
  return drag.kind === "circle" ? distanceBetween(drag.start, drag.current) > 8 : Math.abs(drag.current.x - drag.start.x) > 8 && Math.abs(drag.current.y - drag.start.y) > 8;
}

function drawWeatherPolygonDraft(ctx: CanvasRenderingContext2D, draft: WeatherPolygonDraft, camera: Camera) {
  if (draft.points.length === 0) {
    return;
  }

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.strokeStyle = "#8bc6ff";
  ctx.fillStyle = "#8bc6ff";
  ctx.lineWidth = Math.max(1.5, 2 / camera.zoom);
  ctx.setLineDash([8 / camera.zoom, 5 / camera.zoom]);
  ctx.beginPath();
  ctx.moveTo(draft.points[0].x, draft.points[0].y);
  for (const point of draft.points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  if (draft.current) {
    ctx.lineTo(draft.current.x, draft.current.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  for (const point of draft.points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 8 / camera.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1, 2 / camera.zoom);
    ctx.strokeStyle = "#0b1118";
    ctx.stroke();
  }
  ctx.restore();
}

function drawWeatherMaskSelection(ctx: CanvasRenderingContext2D, mask: WeatherMask, camera: Camera) {
  const bounds = getWeatherMaskBounds(mask);
  if (!bounds) {
    return;
  }
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  drawSelectionBox(ctx, bounds, camera.zoom, 10);
  ctx.restore();
}

function drawWeatherMaskOutlines(ctx: CanvasRenderingContext2D, masks: WeatherMask[], camera: Camera) {
  for (const mask of masks) {
    if (mask.visible === false) {
      continue;
    }
    drawWeatherMaskShape(ctx, mask, camera, { fill: false, selected: false });
  }
}

function drawWeatherMaskShape(ctx: CanvasRenderingContext2D, mask: WeatherMask, camera: Camera, options: { fill: boolean; selected: boolean }) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.globalAlpha = options.selected ? 1 : 0.78;
  if (options.selected) {
    const bounds = getWeatherMaskBounds(mask);
    if (bounds) {
      drawSelectionBox(ctx, bounds, camera.zoom, 10);
    }
    ctx.restore();
    return;
  } else {
    ctx.strokeStyle = "#8bc6ff";
    ctx.fillStyle = options.fill ? "rgb(139 198 255 / 0.16)" : "transparent";
    ctx.lineWidth = Math.max(1.75, 2 / camera.zoom);
    ctx.setLineDash([9 / camera.zoom, 5 / camera.zoom]);
  }
  if (mask.kind === "circle" && mask.points[0] && mask.radius) {
    ctx.beginPath();
    ctx.arc(mask.points[0].x, mask.points[0].y, mask.radius, 0, Math.PI * 2);
    if (options.fill || options.selected) {
      ctx.fill();
    }
    ctx.stroke();
  } else if (mask.kind === "rectangle" && mask.points.length >= 2) {
    const x = Math.min(mask.points[0].x, mask.points[1].x);
    const y = Math.min(mask.points[0].y, mask.points[1].y);
    const width = Math.abs(mask.points[1].x - mask.points[0].x);
    const height = Math.abs(mask.points[1].y - mask.points[0].y);
    if (options.fill || options.selected) {
      ctx.fillRect(x, y, width, height);
    }
    ctx.strokeRect(x, y, width, height);
  } else if (mask.kind === "polygon" && mask.points.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(mask.points[0].x, mask.points[0].y);
    for (const point of mask.points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    if (options.fill || options.selected) {
      ctx.fill();
    }
    ctx.stroke();
  }
  ctx.restore();
}

function isMeaningfulWeatherMaskDrag(drag: WeatherMaskDrag): boolean {
  if (drag.kind === "circle") {
    return distanceBetween(drag.start, drag.current) >= 4;
  }
  return Math.abs(drag.current.x - drag.start.x) >= 4 && Math.abs(drag.current.y - drag.start.y) >= 4;
}

function isDuplicateRulerWaypoint(existingPosition: Point, waypoint: Point, scene: Scene) {
  const duplicateDistance = scene.grid.type === "gridless" ? 12 : 2;
  return distanceBetween(existingPosition, waypoint) <= duplicateDistance;
}
