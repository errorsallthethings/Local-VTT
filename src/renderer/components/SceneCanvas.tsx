import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_VIDEO_PLAYBACK, formatDefaultFogShapeName } from "../../shared/localvtt";
import type { Campaign, Point, Scene, Token } from "../../shared/localvtt";
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
import { drawMapSource } from "../canvas/mapRenderer";
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
import { getPathDistance, getPointAlongPath, normalizeMovementPath } from "../canvas/movementPath";
import { distanceBetween, getNearestGridCellCenter, getNearestHexCenter, getNearestHexVertex, getSnappedTokenPosition, getTokenAtPoint } from "../canvas/tokenGeometry";
import { drawTokenDragHighlights, drawTokens, type TokenDragPreview, type TokenPositionOverrides } from "../canvas/tokenRenderer";
import { getVideoTransform } from "../canvas/videoMap";
import { useVideoMapPlayback } from "../hooks/useVideoMapPlayback";
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
  canvasTool?: "ruler" | null;
  fogTool?: FogTool | null;
  selectedFogShapeId?: string | null;
  selectedTokenId?: string | null;
  onSceneChange?: (scene: Scene, syncScene?: Scene) => void;
  onSelectToken?: (tokenId: string | null) => void;
  onReady?: () => void;
}

interface LoadedMap {
  assetId: string;
  source: CanvasImageSource;
  animate: boolean;
  mediaType: "image" | "video";
  ready: boolean;
}

type MapLoadStatus = "idle" | "loading" | "ready" | "error";

type TokenTween = {
  id: string;
  points: Point[];
  distance: number;
  durationMs: number;
};

type TokenDragState = {
  pointerId: number;
  tokenId: string;
  offset: Point;
  startPosition: Point;
  waypoints: Point[];
};

export function SceneCanvas({
  campaign,
  scene,
  mode,
  className,
  interactive = true,
  canvasTool = null,
  fogTool = null,
  selectedFogShapeId = null,
  selectedTokenId = null,
  onSceneChange,
  onSelectToken,
  onReady
}: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [loadedMap, setLoadedMap] = useState<LoadedMap | null>(null);
  const [loadedTokenImages, setLoadedTokenImages] = useState<Map<string, HTMLImageElement>>(() => new Map());
  const [failedTokenImageIds, setFailedTokenImageIds] = useState<Set<string>>(() => new Set());
  const [mapLoadStatus, setMapLoadStatus] = useState<MapLoadStatus>("idle");
  const [fogPreview, setFogPreview] = useState<FogDrag | null>(null);
  const [rulerDrag, setRulerDrag] = useState<RulerDrag | null>(null);
  const [tokenDragPreview, setTokenDragPreview] = useState<TokenDragPreview | null>(null);
  const [playerTokenTweenPositions, setPlayerTokenTweenPositions] = useState<TokenPositionOverrides | null>(null);
  const [polygonDraft, setPolygonDraft] = useState<FogPolygonDraft | null>(null);
  const [brushHoverPoint, setBrushHoverPoint] = useState<Point | null>(null);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; camera: Camera } | null>(null);
  const rulerDragRef = useRef<(RulerDrag & { pointerId: number }) | null>(null);
  const tokenDragRef = useRef<TokenDragState | null>(null);
  const fogDragRef = useRef<FogDrag | null>(null);
  const polygonDraftRef = useRef<FogPolygonDraft | null>(null);
  const previousSceneRef = useRef<Scene | null>(null);
  const playerTokenTweenPositionsRef = useRef<TokenPositionOverrides | null>(null);

  const mapAsset = useMemo(() => {
    if (!campaign || !scene?.mapAssetId) {
      return null;
    }
    return campaign.assets.find((asset) => asset.id === scene.mapAssetId) ?? null;
  }, [campaign, scene?.mapAssetId]);

  const assetUrl = useMemo(() => {
    return mapAsset?.absolutePath ? window.localVtt.toAssetUrl(mapAsset.absolutePath) : null;
  }, [mapAsset?.absolutePath]);

  const tokenAssetIds = useMemo(() => {
    return [...new Set(scene?.tokens.map((token) => token.assetId).filter(Boolean) ?? [])].join("|");
  }, [scene?.tokens]);

  const tokenAssets = useMemo(() => {
    if (!campaign) {
      return [];
    }
    const assetsById = new Map(campaign.assets.map((asset) => [asset.id, asset]));
    return tokenAssetIds
      .split("|")
      .filter(Boolean)
      .map((assetId) => assetsById.get(assetId) ?? null)
      .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset?.absolutePath));
  }, [campaign, tokenAssetIds]);

  const mapLayer = scene?.layers.find((layer) => layer.id === "map");
  const gridLayer = scene?.layers.find((layer) => layer.id === "grid");
  const fogLayer = scene?.layers.find((layer) => layer.id === "fog");
  const tokenLayer = scene?.layers.find((layer) => layer.id === "token");
  const canShowMap = mode === "gm" ? mapLayer?.visibleInGm : mapLayer?.visibleInPlayer;
  const canShowGrid = mode === "gm" ? gridLayer?.visibleInGm : gridLayer?.visibleInPlayer;
  const canShowFog = mode === "gm" ? fogLayer?.visibleInGm : fogLayer?.visibleInPlayer;
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

  const requiredTokenAssetIds = useMemo(() => tokenAssets.map((asset) => asset.id), [tokenAssets]);
  const tokensReady = !canShowTokens || requiredTokenAssetIds.every((assetId) => loadedTokenImages.has(assetId) || failedTokenImageIds.has(assetId));
  const mapReady =
    !canShowMap ||
    !mapAsset ||
    mapLoadStatus === "ready" ||
    mapLoadStatus === "error";

  useEffect(() => {
    if (scene && mapReady && tokensReady) {
      onReady?.();
    }
  }, [mapReady, onReady, scene, tokensReady]);

  useEffect(() => {
    polygonDraftRef.current = polygonDraft;
  }, [polygonDraft]);

  useEffect(() => {
    setPolygonDraft(null);
    polygonDraftRef.current = null;
    fogDragRef.current = null;
    setFogPreview(null);
    setBrushHoverPoint(null);
    setSnapPoint(null);
  }, [fogTool, scene?.id]);

  useEffect(() => {
    setRulerDrag(null);
    rulerDragRef.current = null;
  }, [canvasTool, scene?.id]);

  useEffect(() => {
    tokenDragRef.current = null;
    setTokenDragPreview(null);
    dragRef.current = null;
    setIsPanning(false);
    setSnapPoint(null);
    setBrushHoverPoint(null);
  }, [mode, scene?.id]);

  useEffect(() => {
    const previousScene = previousSceneRef.current;
    previousSceneRef.current = scene;

    if (mode !== "player" || !previousScene || !scene || previousScene.id !== scene.id) {
      playerTokenTweenPositionsRef.current = null;
      setPlayerTokenTweenPositions(null);
      return;
    }

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
    if (tokenAssets.length === 0) {
      setLoadedTokenImages(new Map());
      setFailedTokenImageIds(new Set());
      return;
    }

    let cancelled = false;
    const nextImages = new Map<string, HTMLImageElement>();
    const nextFailedIds = new Set<string>();
    setLoadedTokenImages(new Map());
    setFailedTokenImageIds(new Set());
    for (const asset of tokenAssets) {
      const tokenImagePath = asset.thumbnailAbsolutePath ?? asset.absolutePath;
      if (!tokenImagePath) {
        continue;
      }
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (cancelled) {
          return;
        }
        nextImages.set(asset.id, image);
        setLoadedTokenImages(new Map(nextImages));
      };
      image.onerror = () => {
        if (cancelled) {
          return;
        }
        nextFailedIds.add(asset.id);
        setFailedTokenImageIds(new Set(nextFailedIds));
      };
      image.src = window.localVtt.toAssetUrl(tokenImagePath);
    }

    return () => {
      cancelled = true;
    };
  }, [tokenAssets]);

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
      canvas.width = Math.max(1, Math.floor(rect.width * scale));
      canvas.height = Math.max(1, Math.floor(rect.height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      drawScene(context, rect.width, rect.height);
    };

    const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      if (!isVideoMap) {
        ctx.fillStyle = scene.playerView.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.save();
      const renderCamera = getRenderCamera(camera, playerDisplayScale);
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
        drawFog(ctx, scene, width, height, renderCamera, mode, fogPreview, polygonDraft, selectedFogShapeId);
      }
      if (mode === "gm" && brushHoverPoint && fogTool?.includes("brush") && !fogPreview) {
        drawBrushHoverPreview(ctx, brushHoverPoint, Math.max(4, scene.fog.brushSize / 2), renderCamera, getFogOperationForTool(fogTool));
      }
      if (mode === "gm" && snapPoint && fogTool) {
        drawSnapMarker(ctx, snapPoint, renderCamera, getFogOperationForTool(fogTool));
      }
    };

    let animationFrame = 0;
    const drawCurrentFrame = () => {
      const rect = canvas.getBoundingClientRect();
      drawScene(context, rect.width, rect.height);
      if (loadedMap?.animate || playerTokenTweenPositionsRef.current) {
        animationFrame = window.requestAnimationFrame(drawCurrentFrame);
      }
    };

    resize();
    if (loadedMap?.animate || playerTokenTweenPositionsRef.current) {
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
  }, [brushHoverPoint, camera, canShowFog, canShowGrid, canShowMap, canShowTokens, fogPreview, fogTool, isVideoMap, loadedMap, loadedTokenImages, mapAsset, mapLayer?.opacity, mode, playerDisplayScale, playerTokenTweenPositions, polygonDraft, rulerDrag, scene, selectedFogShapeId, selectedTokenId, snapPoint, tokenDragPreview]);

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

    setCamera({
      zoom: nextZoom,
      x: mouseX - worldX * nextZoom,
      y: mouseY - worldY * nextZoom
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    if (event.button === 2 && polygonDraftRef.current) {
      return;
    }
    if (mode === "gm" && canvasTool === "ruler" && scene && event.button === 0) {
      const point = getRulerPoint(event);
      const nextRulerDrag = { pointerId: event.pointerId, start: point, current: point, waypoints: [] };
      rulerDragRef.current = nextRulerDrag;
      setRulerDrag(nextRulerDrag);
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
    const rulerDragValue = rulerDragRef.current;
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

    if (polygonDraftRef.current) {
      setPolygonDraft({ ...polygonDraftRef.current, current: getToolPoint(event) });
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
    setCamera({
      ...drag.camera,
      x: drag.camera.x + event.clientX - drag.x,
      y: drag.camera.y + event.clientY - drag.y
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
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

  const onDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (polygonDraftRef.current) {
      event.preventDefault();
      commitPolygonDraft();
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
    if (!draft) {
      return;
    }
    event.preventDefault();
    const nextPoints = draft.points.slice(0, -1);
    const nextDraft = nextPoints.length > 0 ? { ...draft, points: nextPoints, current: nextPoints[nextPoints.length - 1] } : null;
    polygonDraftRef.current = nextDraft;
    setPolygonDraft(nextDraft);
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

  const showMapOverlay = Boolean(canShowMap && mapAsset && (mapLoadStatus === "loading" || mapLoadStatus === "error"));
  const mapOverlayMessage = mapLoadStatus === "error" ? "Map preview unavailable" : mapAsset?.mediaType === "video" ? "Loading video map..." : "Loading map...";

  return (
    <div className={className ?? "scene-canvas-frame"}>
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
              muted={videoMuted}
              autoPlay={index === activeVideoIndex && !videoPaused}
              playsInline
              preload="auto"
              style={{
                opacity: index === activeVideoIndex ? (mapLayer?.opacity ?? 1) : 0,
                transform: getVideoTransform(getRenderCamera(camera, playerDisplayScale), scene)
              }}
              onCanPlay={() => {
                setMapLoadStatus("ready");
                playActiveWhenReady(index);
              }}
              onLoadedData={() => {
                setMapLoadStatus("ready");
              }}
              onPlaying={() => {
                setMapLoadStatus("ready");
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
        className={`scene-canvas ${getCanvasInteractionClass({ canvasTool, fogTool, isPanning, tokenDragPreview })}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      />
      {mode === "gm" && fogTool && (
        <FogToolStatusStrip fogTool={fogTool} polygonPointCount={polygonDraft?.points.length ?? 0} brushSize={scene?.fog.brushSize ?? 0} />
      )}
      {mode === "gm" && canvasTool === "ruler" && <RulerStatusStrip rulerDrag={rulerDrag} scene={scene} />}
      {mode === "gm" && tokenDragPreview && <TokenMoveStatusStrip scene={scene} tokenDragPreview={tokenDragPreview} />}
      {showMapOverlay && <MapLoadOverlay message={mapOverlayMessage} showSpinner={mapLoadStatus === "loading"} />}
      {mode === "gm" && showVideoDiagnostics && isVideoMap && videoDebug && <div className="video-debug">{videoDebug}</div>}
    </div>
  );
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

function eventToWorldPoint(event: React.PointerEvent<HTMLCanvasElement>, camera: Camera): Point {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - camera.x) / camera.zoom,
    y: (event.clientY - rect.top - camera.y) / camera.zoom
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
  isPanning,
  tokenDragPreview
}: {
  canvasTool: "ruler" | null;
  fogTool: FogTool | null;
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

function getTokenMovementPath(startPosition: Point, waypoints: Point[], finalPosition: Point): Point[] | null {
  const points = normalizeMovementPath([startPosition, ...waypoints, finalPosition]);
  return points.length > 1 ? points : null;
}

function getTokenMovementTweens(previousTokens: Token[], nextTokens: Token[], scene: Scene): TokenTween[] {
  const previousById = new Map(previousTokens.map((token) => [token.id, token]));
  const tweens: TokenTween[] = [];
  for (const nextToken of nextTokens) {
    const previousToken = previousById.get(nextToken.id);
    if (!previousToken || previousToken.assetId !== nextToken.assetId || hasTokenSizeChanged(previousToken, nextToken)) {
      continue;
    }
    if (distanceBetween(previousToken.position, nextToken.position) <= 2) {
      continue;
    }
    const points =
      scene.tokenMovementPath?.tokenId === nextToken.id
        ? normalizeMovementPath([previousToken.position, ...scene.tokenMovementPath.points.slice(1, -1), nextToken.position])
        : [previousToken.position, nextToken.position];
    const distance = getPathDistance(points);
    if (points.length < 2 || distance <= 2) {
      continue;
    }
    tweens.push({
      id: nextToken.id,
      points,
      distance,
      durationMs: getTokenMovementDurationMs(distance, nextToken, scene)
    });
  }
  return tweens;
}

function getTokenMovementDurationMs(distance: number, token: Token, scene: Scene) {
  const movementUnit = scene.grid.type === "gridless" || scene.grid.sizePx <= 0 ? Math.max(1, token.size.width) : scene.grid.sizePx;
  return Math.max(320, Math.round((distance / movementUnit) * 400));
}

function hasTokenSizeChanged(previousToken: Token, nextToken: Token) {
  return previousToken.size.width !== nextToken.size.width || previousToken.size.height !== nextToken.size.height;
}

function isDuplicateTokenWaypoint(existingPosition: Point, waypoint: Point, token: Token, scene: Scene) {
  const duplicateDistance = scene.grid.type === "gridless" ? Math.max(2, token.size.width) : 2;
  return distanceBetween(existingPosition, waypoint) <= duplicateDistance;
}

function getTokenWaypointPosition(position: Point, token: Token, scene: Scene): Point {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return position;
  }

  const tokenCenter = {
    x: position.x + token.size.width / 2,
    y: position.y + token.size.height / 2
  };
  const waypointCenter = scene.grid.type === "hex" ? getNearestHexCenter(tokenCenter, scene.grid) : getNearestGridCellCenter(tokenCenter, scene.grid);
  return {
    x: waypointCenter.x - token.size.width / 2,
    y: waypointCenter.y - token.size.height / 2
  };
}

function isDuplicateRulerWaypoint(existingPosition: Point, waypoint: Point, scene: Scene) {
  const duplicateDistance = scene.grid.type === "gridless" ? 12 : 2;
  return distanceBetween(existingPosition, waypoint) <= duplicateDistance;
}
