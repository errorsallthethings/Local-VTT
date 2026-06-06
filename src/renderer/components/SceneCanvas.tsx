import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_TOKEN_BORDER_COLOR, DEFAULT_TOKEN_BORDER_STYLE, DEFAULT_TOKEN_BORDER_WIDTH, DEFAULT_TOKEN_MASK, DEFAULT_VIDEO_PLAYBACK } from "../../shared/localvtt";
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
import { getVideoTransform } from "../canvas/videoMap";
import { useVideoMapPlayback } from "../hooks/useVideoMapPlayback";

interface SceneCanvasProps {
  campaign: Campaign | null;
  scene: Scene | null;
  mode: "gm" | "player";
  className?: string;
  interactive?: boolean;
  fogTool?: FogTool | null;
  selectedFogShapeId?: string | null;
  selectedTokenId?: string | null;
  onSceneChange?: (scene: Scene) => void;
  onSelectToken?: (tokenId: string | null) => void;
}

interface LoadedMap {
  assetId: string;
  source: CanvasImageSource;
  animate: boolean;
  mediaType: "image" | "video";
  ready: boolean;
}

type MapLoadStatus = "idle" | "loading" | "ready" | "error";
type TokenDragPreview = {
  tokenId: string;
  startPosition: Point;
  currentPosition: Point;
  snappedPosition: Point;
};

export function SceneCanvas({
  campaign,
  scene,
  mode,
  className,
  interactive = true,
  fogTool = null,
  selectedFogShapeId = null,
  selectedTokenId = null,
  onSceneChange,
  onSelectToken
}: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [loadedMap, setLoadedMap] = useState<LoadedMap | null>(null);
  const [loadedTokenImages, setLoadedTokenImages] = useState<Map<string, HTMLImageElement>>(() => new Map());
  const [mapLoadStatus, setMapLoadStatus] = useState<MapLoadStatus>("idle");
  const [fogPreview, setFogPreview] = useState<FogDrag | null>(null);
  const [tokenDragPreview, setTokenDragPreview] = useState<TokenDragPreview | null>(null);
  const [polygonDraft, setPolygonDraft] = useState<FogPolygonDraft | null>(null);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; camera: Camera } | null>(null);
  const tokenDragRef = useRef<{ pointerId: number; tokenId: string; offset: Point; startPosition: Point } | null>(null);
  const fogDragRef = useRef<FogDrag | null>(null);
  const polygonDraftRef = useRef<FogPolygonDraft | null>(null);

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

  useEffect(() => {
    polygonDraftRef.current = polygonDraft;
  }, [polygonDraft]);

  useEffect(() => {
    setPolygonDraft(null);
    polygonDraftRef.current = null;
  }, [fogTool, scene?.id]);

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
  }, [polygonDraft, scene]);

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
      return;
    }

    let cancelled = false;
    const nextImages = new Map<string, HTMLImageElement>();
    for (const asset of tokenAssets) {
      if (!asset.absolutePath) {
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
      image.src = window.localVtt.toAssetUrl(asset.absolutePath);
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
        drawTokenDragHighlights(ctx, scene, tokenDragPreview);
      }

      if (canShowTokens) {
        drawTokens(ctx, scene, loadedTokenImages, mode, selectedTokenId, tokenDragPreview);
      }

      ctx.restore();

      if (canShowFog) {
        drawFog(ctx, scene, width, height, renderCamera, mode, fogPreview, polygonDraft, selectedFogShapeId);
      }
      if (mode === "gm" && snapPoint && fogTool) {
        drawSnapMarker(ctx, snapPoint, renderCamera, getFogOperationForTool(fogTool));
      }
    };

    let animationFrame = 0;
    const drawCurrentFrame = () => {
      const rect = canvas.getBoundingClientRect();
      drawScene(context, rect.width, rect.height);
      if (loadedMap?.animate) {
        animationFrame = window.requestAnimationFrame(drawCurrentFrame);
      }
    };

    resize();
    if (loadedMap?.animate) {
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
  }, [camera, canShowFog, canShowGrid, canShowMap, canShowTokens, fogPreview, fogTool, isVideoMap, loadedMap, loadedTokenImages, mapLayer?.opacity, mode, playerDisplayScale, polygonDraft, scene, selectedFogShapeId, selectedTokenId, snapPoint, tokenDragPreview]);

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
          offset: {
            x: point.x - token.position.x,
            y: point.y - token.position.y
          }
        };
        setTokenDragPreview({
          tokenId: token.id,
          startPosition: token.position,
          currentPosition: token.position,
          snappedPosition
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
    if (tokenDrag?.pointerId === event.pointerId && scene) {
      const point = eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale));
      const token = scene.tokens.find((candidate) => candidate.id === tokenDrag.tokenId);
      if (!token) {
        tokenDragRef.current = null;
        setTokenDragPreview(null);
        return;
      }
      const currentPosition = {
        x: point.x - tokenDrag.offset.x,
        y: point.y - tokenDrag.offset.y
      };
      setTokenDragPreview({
        tokenId: token.id,
        startPosition: tokenDrag.startPosition,
        currentPosition,
        snappedPosition: getSnappedTokenPosition(currentPosition, token, scene)
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
                radius: fogDrag.radius,
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

    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsPanning(false);
    }
    if (tokenDragRef.current?.pointerId === event.pointerId) {
      const tokenDrag = tokenDragRef.current;
      const token = scene?.tokens.find((candidate) => candidate.id === tokenDrag.tokenId);
      if (scene && token && onSceneChange) {
        const finalPosition = tokenDragPreview?.tokenId === token.id ? tokenDragPreview.snappedPosition : getSnappedTokenPosition(token.position, token, scene);
        onSceneChange({
          ...scene,
          tokens: scene.tokens.map((candidate) => (candidate.id === token.id ? { ...candidate, position: finalPosition } : candidate)),
          updatedAt: new Date().toISOString()
        });
      }
      tokenDragRef.current = null;
      setTokenDragPreview(null);
    }
  };

  const onPointerLeave = () => {
    setSnapPoint(null);
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (polygonDraftRef.current) {
      event.preventDefault();
      commitPolygonDraft();
    }
  };

  const onContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
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
    const snappedPoint = scene && isSnapModifier(event) ? getNearestGridPoint(worldPoint, scene.grid) : null;
    setSnapPoint(snappedPoint);
    return snappedPoint ?? worldPoint;
  };

  const updateSnapPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!scene || !fogTool || !isSnapModifier(event)) {
      setSnapPoint(null);
      return;
    }
    setSnapPoint(getNearestGridPoint(eventToWorldPoint(event, getRenderCamera(camera, playerDisplayScale)), scene.grid));
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
              onError={() => {
                if (index === activeVideoIndex) {
                  setMapLoadStatus("error");
                }
              }}
              onPause={() => recoverUnexpectedPause(index)}
            />
          )
        ))}
      <canvas
        ref={canvasRef}
        className={`scene-canvas ${isPanning ? "scene-canvas-panning" : getCanvasToolClass(fogTool)}`}
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
  const isReveal = fogTool.startsWith("reveal");
  const toolKind = fogTool.includes("brush") ? "Brush" : fogTool.includes("polygon") ? "Polygon" : "Rectangle";
  const action = isReveal ? "Reveal" : "Hide";
  const primaryHint = getFogToolHint(fogTool, polygonPointCount, brushSize);

  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>
        {action} {toolKind}
      </strong>
      <span>{primaryHint}</span>
      <span>Ctrl/Cmd snaps to grid corners.</span>
      <span>Middle-click drag pans.</span>
    </div>
  );
}

function getFogToolHint(fogTool: FogTool, polygonPointCount: number, brushSize: number): string {
  if (fogTool.includes("brush")) {
    return `Left-drag to paint. Brush ${brushSize}px.`;
  }
  if (fogTool.includes("rectangle")) {
    return "Left-drag to draw. Hold Shift for square.";
  }
  const finishHint = polygonPointCount >= 3 ? " Enter or double-click finishes." : "";
  const undoHint = polygonPointCount > 0 ? " Right-click removes last point." : "";
  return `Click to place points.${finishHint}${undoHint} Escape cancels.`;
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

function getCanvasToolClass(fogTool: FogTool | null): string {
  if (!fogTool) {
    return "";
  }
  if (fogTool.includes("brush")) {
    return "scene-canvas-tool-brush";
  }
  if (fogTool.includes("polygon")) {
    return "scene-canvas-tool-polygon";
  }
  return "scene-canvas-tool-rectangle";
}

function formatDefaultFogShapeName(operation: "reveal" | "hide", kind: "brush" | "rectangle" | "polygon" | "circle", index: number): string {
  const operationLabel = operation === "reveal" ? "Reveal" : "Hide";
  const kindLabel = kind[0].toUpperCase() + kind.slice(1);
  return `${operationLabel} ${kindLabel} ${index + 1}`;
}

function getVisibleTokens(scene: Scene, mode: "gm" | "player"): Token[] {
  return [...scene.tokens]
    .filter((token) => (mode === "gm" ? token.visibleInGm ?? !token.hidden : token.visibleInPlayer))
    .filter((token) => mode === "gm" || scene.fog.mode === "revealed" || isTokenRevealedByFog(token, scene))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function isTokenRevealedByFog(token: Token, scene: Scene): boolean {
  const samplePoints = getTokenRevealSamplePoints(token);
  return scene.fog.shapes.some((shape) => {
    const isVisible = shape.visibleInPlayer ?? shape.visible ?? true;
    return isVisible && shape.operation === "reveal" && samplePoints.some((point) => isPointInsideFogShape(point, shape));
  });
}

function getTokenRevealSamplePoints(token: Token): Point[] {
  const { x, y } = token.position;
  const { width, height } = token.size;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  return [
    { x: centerX, y: centerY },
    { x, y },
    { x: x + width, y },
    { x, y: y + height },
    { x: x + width, y: y + height },
    { x: centerX, y },
    { x: centerX, y: y + height },
    { x, y: centerY },
    { x: x + width, y: centerY }
  ];
}

function isPointInsideFogShape(point: Point, shape: Scene["fog"]["shapes"][number]): boolean {
  if (shape.kind === "rectangle" && shape.points.length >= 2) {
    const [a, b] = shape.points;
    return point.x >= Math.min(a.x, b.x) && point.x <= Math.max(a.x, b.x) && point.y >= Math.min(a.y, b.y) && point.y <= Math.max(a.y, b.y);
  }
  if (shape.kind === "polygon" && shape.points.length >= 3) {
    return isPointInPolygon(point, shape.points);
  }
  if (shape.kind === "brush" && shape.points.length >= 1) {
    const radius = shape.radius ?? 1;
    return shape.points.some((candidate, index) => {
      const next = shape.points[index + 1];
      return next ? distanceToSegment(point, candidate, next) <= radius : distanceBetween(point, candidate) <= radius;
    });
  }
  if (shape.kind === "circle" && shape.points.length >= 2) {
    const [center, edge] = shape.points;
    return distanceBetween(point, center) <= distanceBetween(center, edge);
  }
  return false;
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const intersects = current.y > point.y !== previous.y > point.y && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (lengthSquared === 0) {
    return distanceBetween(point, start);
  }
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / lengthSquared));
  return distanceBetween(point, {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y)
  });
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getTokenAtPoint(tokens: Token[], point: Point): Token | null {
  const visibleTokens = [...tokens]
    .filter((token) => token.visibleInGm ?? !token.hidden)
    .sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  return (
    visibleTokens.find((token) => {
      return (
        point.x >= token.position.x &&
        point.x <= token.position.x + token.size.width &&
        point.y >= token.position.y &&
        point.y <= token.position.y + token.size.height
      );
    }) ?? null
  );
}

function getSnappedTokenPosition(position: Point, token: Token, scene: Scene): Point {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return position;
  }
  if (scene.grid.type === "hex") {
    const center = {
      x: position.x + token.size.width / 2,
      y: position.y + token.size.height / 2
    };
    const snappedCenter = token.sizePreset === "large" ? getNearestHexVertex(center, scene.grid) : getNearestHexCenter(center, scene.grid);
    return {
      x: snappedCenter.x - token.size.width / 2,
      y: snappedCenter.y - token.size.height / 2
    };
  }
  const isHalfCell = token.size.width <= scene.grid.sizePx * 0.75 && token.size.height <= scene.grid.sizePx * 0.75;
  if (isHalfCell) {
    const center = {
      x: position.x + token.size.width / 2,
      y: position.y + token.size.height / 2
    };
    const snappedCenter = getNearestGridCellCenter(center, scene.grid);
    return {
      x: snappedCenter.x - token.size.width / 2,
      y: snappedCenter.y - token.size.height / 2
    };
  }

  return getNearestGridPoint(position, scene.grid) ?? position;
}

function getNearestHexVertex(point: Point, grid: Scene["grid"]): Point {
  const radius = Math.max(8, grid.sizePx / 2);
  const center = getNearestHexCenter(point, grid);
  let nearest = center;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let side = 0; side < 6; side += 1) {
    const angle = (Math.PI / 180) * (60 * side - 30);
    const vertex = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };
    const distance = (vertex.x - point.x) ** 2 + (vertex.y - point.y) ** 2;
    if (distance < nearestDistance) {
      nearest = vertex;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function getNearestHexCenter(point: Point, grid: Scene["grid"]): Point {
  const radius = Math.max(8, grid.sizePx / 2);
  const hexWidth = Math.sqrt(3) * radius;
  const rowStep = radius * 1.5;
  const approximateRow = Math.round((point.y - grid.offsetY) / rowStep);
  let nearest = { x: grid.offsetX, y: grid.offsetY };
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let row = approximateRow - 2; row <= approximateRow + 2; row += 1) {
    const rowOffset = row % 2 === 0 ? 0 : hexWidth / 2;
    const approximateColumn = Math.round((point.x - grid.offsetX - rowOffset) / hexWidth);
    for (let column = approximateColumn - 2; column <= approximateColumn + 2; column += 1) {
      const center = {
        x: grid.offsetX + column * hexWidth + rowOffset,
        y: grid.offsetY + row * rowStep
      };
      const distance = (center.x - point.x) ** 2 + (center.y - point.y) ** 2;
      if (distance < nearestDistance) {
        nearest = center;
        nearestDistance = distance;
      }
    }
  }
  return nearest;
}

function getNearestGridCellCenter(point: Point, grid: Scene["grid"]): Point {
  const size = grid.sizePx;
  return {
    x: Math.floor((point.x - grid.offsetX) / size) * size + grid.offsetX + size / 2,
    y: Math.floor((point.y - grid.offsetY) / size) * size + grid.offsetY + size / 2
  };
}

function drawTokens(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  loadedImages: Map<string, HTMLImageElement>,
  mode: "gm" | "player",
  selectedTokenId: string | null,
  tokenDragPreview: TokenDragPreview | null
) {
  for (const token of getVisibleTokens(scene, mode)) {
    if (!token.assetId) {
      continue;
    }
    const renderToken = mode === "gm" && tokenDragPreview?.tokenId === token.id ? { ...token, position: tokenDragPreview.currentPosition } : token;
    const shouldClipToFog = mode === "player" && scene.fog.mode !== "revealed";
    ctx.save();
    if (shouldClipToFog && !clipToPlayerRevealShapes(ctx, scene)) {
      ctx.restore();
      continue;
    }
    if (renderToken.footprintVisible) {
      drawTokenFootprint(ctx, scene, renderToken, mode);
    }
    const image = loadedImages.get(token.assetId);
    if (!image) {
      drawTokenPlaceholder(ctx, renderToken, selectedTokenId === token.id);
      ctx.restore();
      continue;
    }
    drawToken(ctx, renderToken, image, selectedTokenId === token.id && mode === "gm");
    ctx.restore();
  }
}

function clipToPlayerRevealShapes(ctx: CanvasRenderingContext2D, scene: Scene): boolean {
  const revealShapes = scene.fog.shapes.filter((shape) => {
    const isVisible = shape.visibleInPlayer ?? shape.visible ?? true;
    return isVisible && shape.operation === "reveal";
  });
  if (revealShapes.length === 0) {
    return false;
  }

  ctx.beginPath();
  for (const shape of revealShapes) {
    traceFogShapePath(ctx, shape);
  }
  ctx.clip();
  return true;
}

function traceFogShapePath(ctx: CanvasRenderingContext2D, shape: Scene["fog"]["shapes"][number]) {
  if (shape.kind === "rectangle" && shape.points.length >= 2) {
    const [a, b] = shape.points;
    ctx.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    return;
  }
  if (shape.kind === "polygon" && shape.points.length >= 3) {
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    for (const point of shape.points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    return;
  }
  if (shape.kind === "brush" && shape.points.length >= 1) {
    const radius = Math.max(1, shape.radius ?? 24);
    for (const point of shape.points) {
      ctx.moveTo(point.x + radius, point.y);
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    }
    return;
  }
  if (shape.kind === "circle" && shape.points[0] && shape.radius) {
    ctx.moveTo(shape.points[0].x + shape.radius, shape.points[0].y);
    ctx.arc(shape.points[0].x, shape.points[0].y, shape.radius, 0, Math.PI * 2);
  }
}

function drawTokenDragHighlights(ctx: CanvasRenderingContext2D, scene: Scene, preview: TokenDragPreview) {
  const token = scene.tokens.find((candidate) => candidate.id === preview.tokenId);
  if (!token || scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return;
  }
  drawTokenFootprintHighlight(ctx, scene, token, preview.startPosition, "#f6d365", 0.12);
  drawTokenFootprintHighlight(ctx, scene, token, preview.snappedPosition, "#7aa2f7", 0.16);
}

function drawTokenFootprintHighlight(ctx: CanvasRenderingContext2D, scene: Scene, token: Token, position: Point, color: string, alpha: number) {
  if (scene.grid.type === "hex") {
    drawTokenHexFootprint(ctx, scene, { ...token, position }, color, alpha, true);
    return;
  }
  const bounds = getTokenGridFootprint(scene, token, position);
  ctx.save();
  ctx.fillStyle = hexToRgbAlpha(color, alpha);
  ctx.strokeStyle = hexToRgbAlpha(color, 0.78);
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}

function drawTokenFootprint(ctx: CanvasRenderingContext2D, scene: Scene, token: Token, mode: "gm" | "player") {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return;
  }
  const color = mode === "gm" ? "#f6d365" : token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR;
  if (scene.grid.type === "hex") {
    drawTokenHexFootprint(ctx, scene, token, color, 0.14, false);
    return;
  }
  drawTokenFootprintHighlight(ctx, scene, token, token.position, color, 0.12);
}

function drawTokenHexFootprint(ctx: CanvasRenderingContext2D, scene: Scene, token: Token, color: string, alpha: number, dashed: boolean) {
  const centers = getTokenHexFootprintCenters(scene, token);
  if (centers.length === 0) {
    return;
  }
  const radius = Math.max(8, scene.grid.sizePx / 2);
  ctx.save();
  ctx.fillStyle = hexToRgbAlpha(color, alpha);
  ctx.strokeStyle = hexToRgbAlpha(color, 0.72);
  ctx.lineWidth = 2;
  if (dashed) {
    ctx.setLineDash([8, 5]);
  }
  for (const center of centers) {
    ctx.beginPath();
    tracePointyHex(ctx, center.x, center.y, radius);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function getTokenHexFootprintCenters(scene: Scene, token: Token): Point[] {
  if (scene.grid.type !== "hex") {
    return [];
  }
  const anchor = token.sizePreset === "large" ? getNearestHexVertex(
    {
      x: token.position.x + token.size.width / 2,
      y: token.position.y + token.size.height / 2
    },
    scene.grid
  ) : getNearestHexCenter(
    {
      x: token.position.x + token.size.width / 2,
      y: token.position.y + token.size.height / 2
    },
    scene.grid
  );
  if (token.sizePreset === "large") {
    return getNearestHexCenters(anchor, scene.grid, 3);
  }
  const footprintRadius = getTokenHexFootprintRadius(token);
  const centerCoord = getNearestHexCoordinate(anchor, scene.grid);
  const coords = [];
  for (let q = -footprintRadius; q <= footprintRadius; q += 1) {
    const r1 = Math.max(-footprintRadius, -q - footprintRadius);
    const r2 = Math.min(footprintRadius, -q + footprintRadius);
    for (let r = r1; r <= r2; r += 1) {
      coords.push({ q: centerCoord.q + q, r: centerCoord.r + r });
    }
  }
  return coords.map((coord) => hexAxialToPoint(coord, scene.grid));
}

function getNearestHexCenters(point: Point, grid: Scene["grid"], count: number): Point[] {
  const centerCoord = getNearestHexCoordinate(point, grid);
  const candidates = [];
  for (let q = -2; q <= 2; q += 1) {
    for (let r = -2; r <= 2; r += 1) {
      const coord = { q: centerCoord.q + q, r: centerCoord.r + r };
      const center = hexAxialToPoint(coord, grid);
      candidates.push({ center, distance: (center.x - point.x) ** 2 + (center.y - point.y) ** 2 });
    }
  }
  return candidates.sort((a, b) => a.distance - b.distance).slice(0, count).map((candidate) => candidate.center);
}

function getTokenHexFootprintRadius(token: Token): number {
  switch (token.sizePreset) {
    case "huge":
      return 1;
    case "gargantuan":
      return 2;
    case "tiny":
    case "medium":
    case "custom":
    default:
      return 0;
  }
}

function getNearestHexCoordinate(point: Point, grid: Scene["grid"]): { q: number; r: number } {
  const radius = Math.max(8, grid.sizePx / 2);
  const x = point.x - grid.offsetX;
  const y = point.y - grid.offsetY;
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / radius;
  const r = ((2 / 3) * y) / radius;
  return roundAxial(q, r);
}

function hexAxialToPoint(coord: { q: number; r: number }, grid: Scene["grid"]): Point {
  const radius = Math.max(8, grid.sizePx / 2);
  return {
    x: grid.offsetX + radius * Math.sqrt(3) * (coord.q + coord.r / 2),
    y: grid.offsetY + radius * 1.5 * coord.r
  };
}

function roundAxial(q: number, r: number): { q: number; r: number } {
  let x = q;
  let z = r;
  let y = -x - z;
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);
  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  return { q: rx, r: rz };
}

function tracePointyHex(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  for (let side = 0; side < 6; side += 1) {
    const angle = (Math.PI / 180) * (60 * side - 30);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    if (side === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function getTokenGridFootprint(scene: Scene, token: Token, position: Point): { x: number; y: number; width: number; height: number } {
  const size = scene.grid.sizePx;
  const isHalfCell = token.size.width <= size * 0.75 && token.size.height <= size * 0.75;
  if (isHalfCell) {
    const center = {
      x: position.x + token.size.width / 2,
      y: position.y + token.size.height / 2
    };
    return {
      x: Math.floor((center.x - scene.grid.offsetX) / size) * size + scene.grid.offsetX,
      y: Math.floor((center.y - scene.grid.offsetY) / size) * size + scene.grid.offsetY,
      width: size,
      height: size
    };
  }

  return {
    x: position.x,
    y: position.y,
    width: token.size.width,
    height: token.size.height
  };
}

function hexToRgbAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgb(${red} ${green} ${blue} / ${alpha})`;
}

function drawToken(ctx: CanvasRenderingContext2D, token: Token, image: HTMLImageElement, selected: boolean) {
  const mask = token.mask ?? DEFAULT_TOKEN_MASK;
  const borderStyle = token.borderStyle ?? DEFAULT_TOKEN_BORDER_STYLE;
  const borderColor = token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR;
  const glowColor = token.glowColor ?? borderColor;
  const borderWidth = token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH;
  const { x, y } = token.position;
  const { width, height } = token.size;

  ctx.save();
  applyTokenMask(ctx, x, y, width, height, mask);
  ctx.clip();
  drawCroppedImage(ctx, image, x, y, width, height);
  ctx.restore();

  drawTokenBorder(ctx, x, y, width, height, mask, borderStyle, borderColor, borderWidth, glowColor);
  if (selected) {
    drawTokenSelectionOutline(ctx, x, y, width, height, mask);
  }
}

function drawCroppedImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return;
  }
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = width / height;
  let cropX = 0;
  let cropY = 0;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (sourceAspect > targetAspect) {
    cropWidth = sourceHeight * targetAspect;
    cropX = (sourceWidth - cropWidth) / 2;
  } else if (sourceAspect < targetAspect) {
    cropHeight = sourceWidth / targetAspect;
    cropY = (sourceHeight - cropHeight) / 2;
  }
  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, x, y, width, height);
}

function drawTokenPlaceholder(ctx: CanvasRenderingContext2D, token: Token, selected: boolean) {
  const { x, y } = token.position;
  const { width, height } = token.size;
  ctx.save();
  applyTokenMask(ctx, x, y, width, height, token.mask ?? DEFAULT_TOKEN_MASK);
  ctx.fillStyle = "#202733";
  ctx.fill();
  ctx.restore();
  drawTokenBorder(
    ctx,
    x,
    y,
    width,
    height,
    token.mask ?? DEFAULT_TOKEN_MASK,
    token.borderStyle ?? DEFAULT_TOKEN_BORDER_STYLE,
    token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR,
    token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH,
    token.glowColor ?? token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR
  );
  if (selected) {
    drawTokenSelectionOutline(ctx, x, y, width, height, token.mask ?? DEFAULT_TOKEN_MASK);
  }
}

function applyTokenMask(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, mask: Token["mask"]) {
  ctx.beginPath();
  if (mask === "circle") {
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    return;
  }
  ctx.rect(x, y, width, height);
}

function drawTokenBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  mask: Token["mask"],
  borderStyle: Token["borderStyle"],
  borderColor: string,
  borderWidth: number,
  glowColor: string
) {
  if (borderStyle === "none") {
    return;
  }

  ctx.save();
  applyTokenMask(ctx, x, y, width, height, mask);
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = borderColor;
  if (borderStyle === "glow") {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = Math.max(18, borderWidth * 5);
    ctx.strokeStyle = glowColor;
  }
  if (borderStyle === "inner-shadow") {
    ctx.strokeStyle = "rgb(0 0 0 / 0.72)";
    ctx.lineWidth = Math.max(borderWidth, 7);
  }
  ctx.stroke();

  if (borderStyle === "embossed") {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgb(255 255 255 / 0.35)";
    ctx.lineWidth = Math.max(2, borderWidth * 0.45);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTokenSelectionOutline(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, mask: Token["mask"]) {
  const offset = 6;
  ctx.save();
  applyTokenMask(ctx, x - offset, y - offset, width + offset * 2, height + offset * 2, mask);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#f6d365";
  ctx.shadowColor = "#f6d365";
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
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

