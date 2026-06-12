import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { DEFAULT_VIDEO_PLAYBACK, formatDefaultFogShapeName } from "../../shared/localvtt";
import type { Asset, Campaign, LiveTableEvent, LiveTablePoint, Point, Scene, Token, WeatherMask } from "../../shared/localvtt";
import { getRenderCamera, type Camera } from "../canvas/camera";
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
import { getNearestGridPoint } from "../canvas/gridMath";
import {
  drawLiveTableEvents,
  hasActiveLiveTableEvents,
  LASER_MIN_POINT_DISTANCE,
  LASER_POINT_LIFETIME_MS
} from "../canvas/liveTableRenderer";
import { drawMapSource, getSourceHeight, getSourceWidth, resolveMapTransform } from "../canvas/mapRenderer";
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
import { distanceBetween, getNearestGridCellCenter, getNearestHexCenter, getNearestHexVertex, getSnappedTokenPosition, getTokenAtPoint } from "../canvas/tokenGeometry";
import {
  getTokenMovementPath,
  getTokenMovementTweens,
  getTokenWaypointPosition,
  isDuplicateTokenWaypoint
} from "../canvas/tokenMovement";
import { drawTokenDragHighlights, drawTokens, type TokenDragPreview, type TokenPositionOverrides } from "../canvas/tokenRenderer";
import { getVideoTransform } from "../canvas/videoMap";
import { drawWeather, shouldAnimateWeather } from "../canvas/weatherRenderer";
import { useVideoMapPlayback } from "../hooks/useVideoMapPlayback";
import { TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../lib/dragTypes";
import { DiceRollOverlay } from "./dice/DiceRollOverlay";
import type { WeatherMaskTool } from "./tools/ToolsMenu";
import {
  FOG_GRID_SNAP_HINT,
  RULER_CLEAR_HINT,
  RULER_GRID_SNAP_HINT,
  SHIFT_WAYPOINT_HINT,
  TOKEN_MOVE_COMPLETE_HINT,
  getFogToolHint,
  getFogToolLabel
} from "../lib/toolCopy";

interface SceneCanvasProps {
  campaign: Campaign | null;
  scene: Scene | null;
  mode: "gm" | "player";
  className?: string;
  interactive?: boolean;
  canvasTool?: "ruler" | "ping" | "laser" | null;
  fogTool?: FogTool | null;
  weatherMaskTool?: WeatherMaskTool | null;
  liveTableEvents?: LiveTableEvent[];
  selectedFogShapeId?: string | null;
  selectedWeatherMaskId?: string | null;
  selectedTokenId?: string | null;
  onSceneChange?: (scene: Scene, syncScene?: Scene) => void;
  onSelectToken?: (tokenId: string | null) => void;
  onAddTokenToTurnOrder?: (tokenId: string) => void;
  onDropTokenAsset?: (asset: Asset, point: Point) => void;
  onLiveTableEvent?: (event: LiveTableEvent) => void;
  onViewportCenterChange?: (point: Point) => void;
  onReady?: () => void;
  showPlayerSeatIndicators?: boolean;
}

interface LoadedMap {
  assetId: string;
  source: CanvasImageSource;
  animate: boolean;
  mediaType: "image" | "video";
  ready: boolean;
}

type MapLoadStatus = "idle" | "loading" | "ready" | "error";

type TokenDragState = {
  pointerId: number;
  tokenId: string;
  offset: Point;
  startPosition: Point;
  waypoints: Point[];
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

type WeatherPolygonDraft = {
  points: Point[];
  current?: Point;
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
  fogTool = null,
  weatherMaskTool = null,
  liveTableEvents = [],
  selectedFogShapeId = null,
  selectedWeatherMaskId = null,
  selectedTokenId = null,
  onSceneChange,
  onSelectToken,
  onAddTokenToTurnOrder,
  onDropTokenAsset,
  onLiveTableEvent,
  onViewportCenterChange,
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
  const [weatherMaskPreview, setWeatherMaskPreview] = useState<WeatherMaskDrag | null>(null);
  const [rulerDrag, setRulerDrag] = useState<RulerDrag | null>(null);
  const [tokenDragPreview, setTokenDragPreview] = useState<TokenDragPreview | null>(null);
  const [playerTokenTweenPositions, setPlayerTokenTweenPositions] = useState<TokenPositionOverrides | null>(null);
  const [polygonDraft, setPolygonDraft] = useState<FogPolygonDraft | null>(null);
  const [weatherPolygonDraft, setWeatherPolygonDraft] = useState<WeatherPolygonDraft | null>(null);
  const [brushHoverPoint, setBrushHoverPoint] = useState<Point | null>(null);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  const [tokenContextMenu, setTokenContextMenu] = useState<TokenContextMenu | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; camera: Camera } | null>(null);
  const rulerDragRef = useRef<(RulerDrag & { pointerId: number }) | null>(null);
  const tokenDragRef = useRef<TokenDragState | null>(null);
  const laserDragRef = useRef<LaserDragState | null>(null);
  const fogDragRef = useRef<FogDrag | null>(null);
  const weatherMaskDragRef = useRef<WeatherMaskDrag | null>(null);
  const polygonDraftRef = useRef<FogPolygonDraft | null>(null);
  const weatherPolygonDraftRef = useRef<WeatherPolygonDraft | null>(null);
  const previousSceneRef = useRef<Scene | null>(null);
  const fittedSceneCameraRef = useRef<string | null>(null);
  const autoFitCameraRef = useRef(true);
  // Player View tween state is mirrored in a ref so requestAnimationFrame can draw without stale React closures.
  const playerTokenTweenPositionsRef = useRef<TokenPositionOverrides | null>(null);

  useEffect(() => {
    if (!tokenContextMenu) {
      return;
    }

    const dismissMenu = () => setTokenContextMenu(null);
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
  }, [tokenContextMenu]);

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
  const weatherLayer = scene?.layers.find((layer) => layer.id === "weather");
  const tokenLayer = scene?.layers.find((layer) => layer.id === "token");
  const canShowMap = mode === "gm" ? mapLayer?.visibleInGm : mapLayer?.visibleInPlayer;
  const canShowGrid = mode === "gm" ? gridLayer?.visibleInGm : gridLayer?.visibleInPlayer;
  const canShowFog = mode === "gm" ? fogLayer?.visibleInGm : fogLayer?.visibleInPlayer;
  const canShowWeather = mode === "gm" ? weatherLayer?.visibleInGm : weatherLayer?.visibleInPlayer;
  const canShowTokens = mode === "gm" ? tokenLayer?.visibleInGm : tokenLayer?.visibleInPlayer;
  const isVideoMap = Boolean(canShowMap && mapAsset?.mediaType === "video" && assetUrl);
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

  const getCurrentReadyMapSourceForFit = useCallback((): CanvasImageSource | null => {
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
      setCamera(getCameraForMapFit(scene, mapSource, viewportWidth, viewportHeight));
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
    weatherPolygonDraftRef.current = weatherPolygonDraft;
  }, [weatherPolygonDraft]);

  useEffect(() => {
    setPolygonDraft(null);
    polygonDraftRef.current = null;
    weatherPolygonDraftRef.current = null;
    fogDragRef.current = null;
    setFogPreview(null);
    setWeatherPolygonDraft(null);
    setBrushHoverPoint(null);
    setSnapPoint(null);
  }, [fogTool, scene?.id]);

  useEffect(() => {
    setRulerDrag(null);
    rulerDragRef.current = null;
    laserDragRef.current = null;
  }, [canvasTool, scene?.id]);

  useEffect(() => {
    tokenDragRef.current = null;
    setTokenDragPreview(null);
    dragRef.current = null;
    weatherMaskDragRef.current = null;
    setWeatherMaskPreview(null);
    setIsPanning(false);
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
    if (mode !== "gm" || (!tokenDragPreview && !rulerDrag && !fogPreview)) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      cancelTokenDrag();
      cancelRulerDrag();
      cancelFogDrag();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fogPreview, mode, rulerDrag, tokenDragPreview]);

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
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, rulerDrag, scene]);

  useEffect(() => {
    if (!assetUrl || !mapAsset?.id || mapAsset.mediaType === "video") {
      setLoadedMap(null);
      setMapLoadStatus(mapAsset?.mediaType === "video" && assetUrl ? "loading" : "idle");
      return;
    }

    const imageAssetId = mapAsset.id;
    const imageAssetPath = mapAsset.relativePath;
    const image = new Image();
    image.decoding = "async";
    setLoadedMap(null);
    setMapLoadStatus("loading");
    image.onload = () => {
      setLoadedMap({
        assetId: imageAssetId,
        source: image,
        animate: imageAssetPath.toLowerCase().endsWith(".gif"),
        mediaType: "image",
        ready: true
      });
      setMapLoadStatus("ready");
    };
    image.onerror = () => {
      setLoadedMap(null);
      setMapLoadStatus("error");
    };
    image.src = assetUrl;
  }, [assetUrl, mapAsset?.id, mapAsset?.mediaType, mapAsset?.relativePath]);

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
      const weatherMapSource = loadedMap?.ready ? loadedMap.source : activeVideo && activeVideo.readyState >= HTMLMediaElement.HAVE_METADATA ? activeVideo : null;
      const weatherMapReady = !canShowMap || !mapAsset || Boolean(weatherMapSource);

      ctx.save();
      // Player Display Scale modifies Player View zoom only; GM camera controls stay scene-local.
      ctx.translate(renderCamera.x, renderCamera.y);
      ctx.scale(renderCamera.zoom, renderCamera.zoom);

      if (!isVideoMap && canShowMap && loadedMap?.ready) {
        ctx.globalAlpha = mapLayer?.opacity ?? 1;
        try {
          drawMapSource(ctx, loadedMap.source, scene, width, height);
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
        drawTokens(ctx, scene, loadedTokenImages, mode, selectedTokenId, tokenDragPreview, playerTokenTweenPositionsRef.current);
      }

      if (mode === "gm" && rulerDrag) {
        drawRuler(ctx, rulerDrag, getRulerLabel(rulerDrag, scene), scene.grid, renderCamera.zoom);
      }

      ctx.restore();

      if (canShowFog) {
        // Fog is drawn after world content so hidden/partial modes mask maps, tokens, grid, and ruler consistently.
        drawFog(ctx, scene, width, height, renderCamera, mode, fogPreview, polygonDraft, selectedFogShapeId);
      }
      if (canShowWeather) {
        if (weatherMapReady) {
          drawWeather(ctx, scene, width, height, renderCamera, Date.now(), weatherLayer?.opacity ?? 1, weatherMapSource);
        }
      }
      if (mode === "gm" && weatherMaskPreview) {
        drawWeatherMaskPreview(ctx, weatherMaskPreview, renderCamera);
      }
      if (mode === "gm" && weatherMaskTool === "polygon" && weatherPolygonDraft) {
        drawWeatherPolygonDraft(ctx, weatherPolygonDraft, renderCamera);
      }
      if (mode === "gm" && selectedWeatherMaskId) {
        const selectedWeatherMask = scene.weather.masks.find((mask) => mask.id === selectedWeatherMaskId && (mask.visible ?? true));
        if (selectedWeatherMask) {
          drawWeatherMaskSelection(ctx, selectedWeatherMask, renderCamera);
        }
      }
      if (mode === "gm" && brushHoverPoint && fogTool?.includes("brush") && !fogPreview) {
        drawBrushHoverPreview(ctx, brushHoverPoint, Math.max(4, scene.fog.brushSize / 2), renderCamera, getFogOperationForTool(fogTool));
      }
      if (mode === "gm" && snapPoint && fogTool) {
        drawSnapMarker(ctx, snapPoint, renderCamera, getFogOperationForTool(fogTool));
      }
      if (liveTableEvents.length > 0) {
        drawLiveTableEvents(ctx, liveTableEvents, renderCamera);
      }
    };

    let animationFrame = 0;
    const drawCurrentFrame = () => {
      const rect = canvas.getBoundingClientRect();
      drawScene(context, rect.width, rect.height);
      if (loadedMap?.animate || playerTokenTweenPositionsRef.current || hasActiveLiveTableEvents(liveTableEvents) || shouldAnimateWeather(scene, Boolean(canShowWeather))) {
        animationFrame = window.requestAnimationFrame(drawCurrentFrame);
      }
    };

    resize();
    if (loadedMap?.animate || playerTokenTweenPositionsRef.current || hasActiveLiveTableEvents(liveTableEvents) || shouldAnimateWeather(scene, Boolean(canShowWeather))) {
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
  }, [activeVideoIndex, brushHoverPoint, camera, canShowFog, canShowGrid, canShowMap, canShowTokens, canShowWeather, fitGmCameraToReadyMap, fogPreview, fogTool, isVideoMap, liveTableEvents, loadedMap, loadedTokenImages, mapAsset, mapLayer?.opacity, mode, playerDisplayScale, playerTokenTweenPositions, polygonDraft, rulerDrag, scene, selectedFogShapeId, selectedTokenId, selectedWeatherMaskId, snapPoint, tokenDragPreview, videoRefs, weatherLayer?.opacity, weatherMaskPreview, weatherMaskTool, weatherPolygonDraft]);

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

  const cancelRulerDrag = () => {
    rulerDragRef.current = null;
    setRulerDrag(null);
  };

  const cancelFogDrag = () => {
    fogDragRef.current = null;
    setFogPreview(null);
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
    if (!interactive) {
      return;
    }
    if (event.button === 2 && polygonDraftRef.current) {
      return;
    }
    if (mode === "gm" && canvasTool === "ping" && scene && event.button === 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    if (mode === "gm" && canvasTool === "ruler" && scene && event.button === 0) {
      const point = getRulerPoint(event);
      const nextRulerDrag = { pointerId: event.pointerId, start: point, current: point, waypoints: [] };
      rulerDragRef.current = nextRulerDrag;
      setRulerDrag(nextRulerDrag);
      return;
    }
    if (mode === "gm" && canvasTool === "laser" && scene && event.button === 0) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const now = Date.now();
      const laserEvent = {
        id: crypto.randomUUID(),
        type: "laser",
        createdAt: now,
        points: [{ point, createdAt: now }]
      } satisfies LiveTableEvent;
      laserDragRef.current = { pointerId: event.pointerId, eventId: laserEvent.id, points: laserEvent.points };
      onLiveTableEvent?.(laserEvent);
      return;
    }
    if (mode === "gm" && fogTool && scene && onSceneChange && event.button === 0) {
      const point = getToolPoint(event);
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
        radius: fogTool.includes("brush") ? Math.max(4, scene.fog.brushSize / 2) : undefined,
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
    if (mode === "gm" && scene && onSceneChange && event.button === 0 && canShowTokens) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const token = getTokenAtPoint(scene.tokens, point);
      if (token) {
        onSelectToken?.(token.id);
        const snappedPosition = getSnappedTokenPosition(token.position, token, scene);
        tokenDragRef.current = {
          pointerId: event.pointerId,
          tokenId: token.id,
          startPosition: token.position,
          waypoints: [],
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
          waypoints: []
        });
        return;
      }
      onSelectToken?.(null);
    }
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera };
    setIsPanning(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const tokenDrag = tokenDragRef.current;
    const laserDrag = laserDragRef.current;
    const rulerDragValue = rulerDragRef.current;
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
          points: nextPoints
        });
      }
      return;
    }
    if (rulerDragValue?.pointerId === event.pointerId) {
      const nextRulerDrag = { ...rulerDragValue, current: getRulerPoint(event) };
      rulerDragRef.current = nextRulerDrag;
      setRulerDrag(nextRulerDrag);
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
      setTokenDragPreview({
        tokenId: token.id,
        startPosition: tokenDrag.startPosition,
        currentPosition,
        snappedPosition,
        waypoints: tokenDrag.waypoints
      });
      return;
    }

    const fogDrag = fogDragRef.current;
    if (fogDrag?.pointerId === event.pointerId) {
      const point = getToolPoint(event);
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

    if (polygonDraftRef.current) {
      setPolygonDraft({ ...polygonDraftRef.current, current: getToolPoint(event) });
      return;
    }

    if (weatherMaskTool === "polygon" && weatherPolygonDraftRef.current) {
      setWeatherPolygonDraft({ ...weatherPolygonDraftRef.current, current: getToolPoint(event) });
      return;
    }

    if (mode === "gm" && fogTool?.includes("brush") && scene) {
      setBrushHoverPoint(getToolPoint(event));
      return;
    }

    updateSnapPoint(event);

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    autoFitCameraRef.current = false;
    setCamera({
      ...drag.camera,
      x: drag.camera.x + event.clientX - drag.x,
      y: drag.camera.y + event.clientY - drag.y
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
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
                name: `Weather Mask ${scene.weather.masks.length + 1}`,
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
      cancelRulerDrag();
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
        const nextScene = {
          ...scene,
          tokens: scene.tokens.map((candidate) => (candidate.id === token.id ? { ...candidate, position: finalPosition } : candidate)),
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
  };

  const emitPing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    onLiveTableEvent?.({
      id: crypto.randomUUID(),
      type: "ping",
      point: clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, getRenderCamera(camera, playerDisplayScale)),
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
    if (weatherMaskTool === "polygon" && weatherPolygonDraftRef.current) {
      event.preventDefault();
      commitWeatherPolygonDraft();
    }
  };

  const onContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const activeRulerDrag = rulerDragRef.current;
    const tokenDrag = tokenDragRef.current;
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
      return;
    }

    const draft = polygonDraftRef.current;
    const weatherDraft = weatherPolygonDraftRef.current;
    if (!draft && !weatherDraft) {
      if (mode === "gm" && scene && onAddTokenToTurnOrder && canShowTokens) {
        const point = clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, getRenderCamera(camera, playerDisplayScale));
        const token = getTokenAtPoint(scene.tokens, point);
        if (token) {
          const frameRect = frameRef.current?.getBoundingClientRect();
          event.preventDefault();
          onSelectToken?.(token.id);
          setTokenContextMenu({
            tokenId: token.id,
            tokenName: token.name || "Token",
            x: frameRect ? event.clientX - frameRect.left : event.clientX,
            y: frameRect ? event.clientY - frameRect.top : event.clientY
          });
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
    if (weatherDraft) {
      const nextPoints = weatherDraft.points.slice(0, -1);
      const nextDraft = nextPoints.length > 0 ? { ...weatherDraft, points: nextPoints, current: nextPoints[nextPoints.length - 1] } : null;
      weatherPolygonDraftRef.current = nextDraft;
      setWeatherPolygonDraft(nextDraft);
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

  const getToolPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const worldPoint = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
    const snappedPoint = scene && isSnapModifier(event) ? getFogSnapPoint(worldPoint, scene) : null;
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

  const updateSnapPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!scene || !fogTool || !isSnapModifier(event)) {
      setSnapPoint(null);
      return;
    }
    setSnapPoint(getFogSnapPoint(eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale)), scene));
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
            name: `Weather Mask ${scene.weather.masks.length + 1}`,
            kind: "polygon",
            points: draft.points,
            visible: true
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

  const showMapOverlay = Boolean(canShowMap && mapAsset && (mapLoadStatus === "loading" || mapLoadStatus === "error"));
  const mapOverlayMessage = mapLoadStatus === "error" ? "Map asset unavailable" : mapAsset?.mediaType === "video" ? "Loading video map..." : "Loading map...";

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
        className={`scene-canvas ${getCanvasInteractionClass({ canvasTool, fogTool, weatherMaskTool, isPanning, tokenDragPreview })}`}
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
        <FogToolStatusStrip fogTool={fogTool} polygonPointCount={polygonDraft?.points.length ?? 0} brushSize={scene?.fog.brushSize ?? 0} />
      )}
      {mode === "gm" && canvasTool === "ruler" && <RulerStatusStrip rulerDrag={rulerDrag} scene={scene} />}
      {mode === "gm" && (canvasTool === "ping" || canvasTool === "laser") && <TableToolStatusStrip canvasTool={canvasTool} />}
      {mode === "gm" && weatherMaskTool && <WeatherMaskStatusStrip weatherMaskTool={weatherMaskTool} pointCount={weatherPolygonDraft?.points.length ?? 0} />}
      {mode === "gm" && tokenDragPreview && <TokenMoveStatusStrip scene={scene} tokenDragPreview={tokenDragPreview} />}
      <DiceRollOverlay events={liveTableEvents.filter((event) => isVisibleDiceOverlayEvent(event, mode))} mode={mode} />
      {mode === "player" && scene && <TurnOrderPlayerBar scene={scene} campaign={campaign} />}
      {mode === "player" && scene && showPlayerSeatIndicators && <PlayerSeatIndicators campaign={campaign} />}
      {mode === "player" && scene && <PlayerTurnStatusIndicators scene={scene} campaign={campaign} />}
      {mode === "gm" && tokenContextMenu && (
        <div
          className="canvas-token-context-menu"
          style={{ left: tokenContextMenu.x, top: tokenContextMenu.y }}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onAddTokenToTurnOrder?.(tokenContextMenu.tokenId);
              setTokenContextMenu(null);
            }}
          >
            Add "{tokenContextMenu.tokenName}" to Turn Order
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
        const entryName = player?.name ?? entry.name;
        return (
          <article
            key={entry.id}
            className={active ? "turn-order-player-entry turn-order-player-entry-active" : "turn-order-player-entry"}
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
        const style = getPlayerTurnStatusStyle(player.defaultSeatEdge, player.defaultSeatPosition, player.color, reveal.progress);
        return (
          <div key={player.id} className={`player-turn-status player-turn-status-${player.defaultSeatEdge} player-turn-status-${status}`} style={style}>
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

function WeatherMaskStatusStrip({ weatherMaskTool, pointCount }: { weatherMaskTool: WeatherMaskTool; pointCount: number }) {
  const label = weatherMaskTool === "polygon" ? "Weather Mask Polygon" : weatherMaskTool === "circle" ? "Weather Mask Circle" : "Weather Mask Rectangle";
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

function isVisibleDiceOverlayEvent(event: LiveTableEvent, mode: "gm" | "player"): event is Extract<LiveTableEvent, { type: "dice" }> {
  return event.type === "dice" && shouldShowDiceOverlay(event, mode);
}

function shouldShowDiceOverlay(event: Extract<LiveTableEvent, { type: "dice" }>, mode: "gm" | "player"): boolean {
  const displayMode = mode === "gm" ? event.gmDiceDisplay : event.playerDiceDisplay;
  if (displayMode) {
    return displayMode !== "scene";
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

function getReadyMapSourceForFit(loadedMap: LoadedMap | null, mapAssetId: string, activeVideo: HTMLVideoElement | null, isVideoMap: boolean): CanvasImageSource | null {
  if (!isVideoMap) {
    return loadedMap?.ready && loadedMap.assetId === mapAssetId ? loadedMap.source : null;
  }
  if (
    activeVideo?.dataset.mapAssetId === mapAssetId &&
    activeVideo.readyState >= HTMLMediaElement.HAVE_METADATA &&
    activeVideo.videoWidth > 0 &&
    activeVideo.videoHeight > 0
  ) {
    return activeVideo;
  }
  return null;
}

function getCameraForMapFit(scene: Scene, source: CanvasImageSource, viewportWidth: number, viewportHeight: number): Camera {
  const sourceWidth = getSourceWidth(source);
  const sourceHeight = getSourceHeight(source);
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

function getFogSnapPoint(point: Point, scene: Scene): Point | null {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return null;
  }
  if (scene.grid.type === "hex") {
    return getNearestHexVertex(point, scene.grid);
  }
  return getNearestGridPoint(point, scene.grid);
}

function getCanvasInteractionClass({
  canvasTool,
  fogTool,
  weatherMaskTool,
  isPanning,
  tokenDragPreview
}: {
  canvasTool: "ruler" | "ping" | "laser" | null;
  fogTool: FogTool | null;
  weatherMaskTool: WeatherMaskTool | null;
  isPanning: boolean;
  tokenDragPreview: TokenDragPreview | null;
}): string {
  if (isPanning) {
    return "scene-canvas-panning";
  }
  if (tokenDragPreview) {
    return "scene-canvas-token-dragging";
  }
  if (canvasTool === "ruler") {
    return "scene-canvas-tool-ruler";
  }
  if (canvasTool === "ping") {
    return "scene-canvas-tool-ping";
  }
  if (canvasTool === "laser") {
    return "scene-canvas-tool-laser";
  }
  if (weatherMaskTool === "circle") {
    return "scene-canvas-tool-circle";
  }
  if (weatherMaskTool === "rectangle") {
    return "scene-canvas-tool-rectangle";
  }
  if (weatherMaskTool === "polygon") {
    return "scene-canvas-tool-polygon";
  }
  if (!fogTool) {
    return "";
  }
  if (fogTool.includes("brush")) {
    return "scene-canvas-tool-brush";
  }
  if (fogTool.includes("polygon")) {
    return "scene-canvas-tool-polygon";
  }
  if (fogTool.includes("circle")) {
    return "scene-canvas-tool-circle";
  }
  return "scene-canvas-tool-rectangle";
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
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.strokeStyle = "#8bc6ff";
  ctx.fillStyle = "rgb(139 198 255 / 0.16)";
  ctx.lineWidth = Math.max(1.75, 2.5 / camera.zoom);
  ctx.setLineDash([9 / camera.zoom, 5 / camera.zoom]);
  if (mask.kind === "circle" && mask.points[0] && mask.radius) {
    ctx.beginPath();
    ctx.arc(mask.points[0].x, mask.points[0].y, mask.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (mask.kind === "rectangle" && mask.points.length >= 2) {
    const x = Math.min(mask.points[0].x, mask.points[1].x);
    const y = Math.min(mask.points[0].y, mask.points[1].y);
    const width = Math.abs(mask.points[1].x - mask.points[0].x);
    const height = Math.abs(mask.points[1].y - mask.points[0].y);
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  } else if (mask.kind === "polygon" && mask.points.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(mask.points[0].x, mask.points[0].y);
    for (const point of mask.points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();
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
