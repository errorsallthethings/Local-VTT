import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type { Asset, DrawingStrokeStyle, LiveTableEvent, Point, Scene, TableToolSettings } from "../../../../shared/localvtt";
import {
  WEATHER_ONLY_FRAME_INTERVAL_MS,
  createCanvasAnimationSources,
  getCanvasAnimationFramePlan,
  hasCanvasAnimationSources,
  type Camera,
  type CanvasAnimationSources
} from "../../../canvas/core";
import {
  drawDrawings,
  getDrawingPolygonDraftPreview,
  type DrawingPointOverrides,
  type DrawingPreview,
  type DrawingTool
} from "../../../canvas/drawings";
import { drawEnvironmentEffectPreview, drawEnvironmentEffects, drawEnvironmentEffectShape } from "../../../canvas/effects";
import type {
  AcidEffectTuning,
  ArcaneEffectTuning,
  ChaosEffectTuning,
  ColdEffectTuning,
  DarknessEffectTuning,
  DistortionEffectTuning,
  EnvironmentEffectDrag,
  EnvironmentPolygonDraft,
  FireEffectTuning,
  FogEffectTuning,
  ForceFieldEffectTuning,
  LavaEffectTuning,
  LightningEffectTuning,
  NatureEffectTuning,
  PoisonEffectTuning,
  RadiantEffectTuning,
  ShockwaveEffectTuning,
  SmokeEffectTuning,
  VoidEffectTuning,
  WaterEffectTuning
} from "../../../canvas/effects";
import { drawFog, getFogOperationForTool, type FogDrag, type FogPolygonDraft, type FogTool } from "../../../canvas/fog";
import { drawHexGrid, drawSquareGrid } from "../../../canvas/grid";
import { drawLiveTableEvents, getRulerLabel, hasActiveLiveTableEvents } from "../../../canvas/live-table";
import { drawMapSource, getVisibleMapCalibrationBox, type LoadedMap, type MapCanvasBackgroundPlan, type MapCalibrationBox, type MapCalibrationDrag } from "../../../canvas/map";
import { drawRuler, type RulerDrag } from "../../../canvas/measurement";
import {
  drawBrushHoverPreview,
  drawDrawingBrushHoverPreview,
  drawDrawingResizeHandles,
  drawMapCalibrationBox,
  drawSelectionMarquee,
  drawSnapMarker,
  getSceneCanvasRenderPlan,
  getSceneSnapMarkerOperations,
  type DrawingDragState,
  type DrawingRotateState,
  type SelectionDrag
} from "../../../canvas/scene";
import { drawTokenDragHighlights, drawTokens, type TokenDragPreview, type TokenTurnOrderIndicator } from "../../../canvas/tokens";
import { drawWeather, drawWeatherMaskOutlines, drawWeatherMaskPreview, drawWeatherMaskSelection, drawWeatherPolygonDraft, type WeatherMaskDrag, type WeatherPolygonDraft } from "../../../canvas/weather";
import type { EnvironmentEffectTool, WeatherMaskTool } from "../../tools";
import type { getSceneEffectRenderState } from "../../../canvas/scene";

type LayerOpacity = { opacity?: number } | null | undefined;
type SceneEffectRenderState = ReturnType<typeof getSceneEffectRenderState>;
type SceneAnimationState = Pick<CanvasAnimationSources, "environmentAnimating" | "tokenConditionAnimating" | "weatherAnimating">;

interface SceneCanvasRendererOptions {
  acidEffectTuning?: AcidEffectTuning;
  activeFogBrushSize: number;
  activeVideoIndex: number;
  arcaneEffectTuning?: ArcaneEffectTuning;
  autoFitCameraRef: MutableRefObject<boolean>;
  brushHoverPoint: Point | null;
  camera: Camera;
  canShowDrawings: boolean | undefined;
  canShowFog: boolean | undefined;
  canShowGrid: boolean | undefined;
  canShowMap: boolean | undefined;
  canShowTokens: boolean | undefined;
  canShowWeather: boolean | undefined;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  chaosEffectTuning?: ChaosEffectTuning;
  coldEffectTuning?: ColdEffectTuning;
  darknessEffectTuning?: DarknessEffectTuning;
  distortionEffectTuning?: DistortionEffectTuning;
  drawingColor: string;
  drawingDragPreview: DrawingPointOverrides | null;
  drawingFillColor: string;
  drawingFillOpacity: number;
  drawingDragRef: MutableRefObject<DrawingDragState | null>;
  drawingLayer: LayerOpacity;
  drawingOpacity: number;
  drawingPolygonDraft: { points: Point[]; current?: Point } | null;
  drawingPreview: DrawingPreview | null;
  drawingRotateRef: MutableRefObject<DrawingRotateState | null>;
  drawingStrokeStyle: DrawingStrokeStyle;
  drawingStrokeWidth: number;
  drawingTool: DrawingTool | null;
  effectRenderState: SceneEffectRenderState;
  effectiveSelectedDrawingIds: string[];
  effectiveSelectedFogShapeIds: string[];
  effectiveSelectedTokenIds: string[];
  environmentEffectMovePreview: Map<string, Point[]> | null;
  environmentEffectMoveRef: MutableRefObject<unknown>;
  environmentEffectPreview: EnvironmentEffectDrag | null;
  environmentEffectTool: EnvironmentEffectTool | null;
  environmentPolygonDraft: EnvironmentPolygonDraft | null;
  fireEffectTuning?: FireEffectTuning;
  fitGmCameraToReadyMap: (viewportWidth: number, viewportHeight: number, force?: boolean) => boolean;
  fogEffectTuning?: FogEffectTuning;
  fogPreview: FogDrag | null;
  fogTool: FogTool | null;
  forceFieldEffectTuning?: ForceFieldEffectTuning;
  isVideoMap: boolean;
  lavaEffectTuning?: LavaEffectTuning;
  lightningEffectTuning?: LightningEffectTuning;
  liveTableEvents: LiveTableEvent[];
  loadedMap: LoadedMap | null;
  loadedTokenImages: Map<string, HTMLImageElement>;
  mapAsset: Asset | null;
  mapCalibrationBox: MapCalibrationBox | null;
  mapCalibrationDraftBox: MapCalibrationBox | null;
  mapCalibrationDrag: MapCalibrationDrag | null;
  mapCanvasBackgroundPlan: MapCanvasBackgroundPlan;
  mapLayer: LayerOpacity;
  mode: "gm" | "player";
  natureEffectTuning?: NatureEffectTuning;
  onMapCalibrationBox?: (box: MapCalibrationBox) => void;
  playerDisplayScale: number;
  playerTokenTweenPositions: unknown;
  playerTokenTweenPositionsRef: MutableRefObject<Map<string, Point> | null>;
  poisonEffectTuning?: PoisonEffectTuning;
  polygonDraft: FogPolygonDraft | null;
  radiantEffectTuning?: RadiantEffectTuning;
  releasedRulerDrag: RulerDrag | null;
  rulerDrag: RulerDrag | null;
  scene: Scene | null;
  sceneAnimationState: SceneAnimationState;
  sceneSelectionAnimating: boolean;
  selectionDrag: SelectionDrag | null;
  shockwaveEffectTuning?: ShockwaveEffectTuning;
  smokeEffectTuning?: SmokeEffectTuning;
  snapPoint: Point | null;
  tableTools: TableToolSettings;
  tokenDragPreview: TokenDragPreview | null;
  turnOrderTokenIndicators: Map<string, TokenTurnOrderIndicator> | null;
  videoRefs: MutableRefObject<Array<HTMLVideoElement | null>>;
  visibleCanvasLiveTableEvents: LiveTableEvent[];
  voidEffectTuning?: VoidEffectTuning;
  waterEffectTuning?: WaterEffectTuning;
  weatherLayer: LayerOpacity;
  weatherMaskMovePreview: Map<string, Point[]> | null;
  weatherMaskMoveRef: MutableRefObject<unknown>;
  weatherMaskPreview: WeatherMaskDrag | null;
  weatherMaskTool: WeatherMaskTool | null;
  weatherPolygonDraft: WeatherPolygonDraft | null;
  mapOverlayActive: boolean;
}

export function useSceneCanvasRenderer(options: SceneCanvasRendererOptions) {
  const lastResizeRef = useRef<{ height: number; scale: number; width: number } | null>(null);

  useEffect(() => {
    const canvas = options.canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const scene = options.scene;
    if (!scene) {
      const resizeEmptyCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        const pixelWidth = Math.max(1, Math.floor(rect.width * scale));
        const pixelHeight = Math.max(1, Math.floor(rect.height * scale));
        lastResizeRef.current = { height: pixelHeight, scale, width: pixelWidth };
        if (canvas.width !== pixelWidth) {
          canvas.width = pixelWidth;
        }
        if (canvas.height !== pixelHeight) {
          canvas.height = pixelHeight;
        }
        context.setTransform(scale, 0, 0, scale, 0, 0);
        drawEmptyScenePrompt(context, rect.width, rect.height);
      };

      resizeEmptyCanvas();
      const observer = new ResizeObserver(resizeEmptyCanvas);
      observer.observe(canvas);
      return () => observer.disconnect();
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      const pixelWidth = Math.max(1, Math.floor(rect.width * scale));
      const pixelHeight = Math.max(1, Math.floor(rect.height * scale));
      const lastResize = lastResizeRef.current;
      const sizeChanged = !lastResize || lastResize.width !== pixelWidth || lastResize.height !== pixelHeight || lastResize.scale !== scale;
      lastResizeRef.current = { height: pixelHeight, scale, width: pixelWidth };
      if (canvas.width !== pixelWidth) {
        canvas.width = pixelWidth;
      }
      if (canvas.height !== pixelHeight) {
        canvas.height = pixelHeight;
      }
      context.setTransform(scale, 0, 0, scale, 0, 0);
      if (sizeChanged && options.autoFitCameraRef.current) {
        options.fitGmCameraToReadyMap(rect.width, rect.height, true);
      }
      drawScene(context, rect.width, rect.height);
    };

    const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      if (!options.isVideoMap) {
        ctx.fillStyle = scene.playerView.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      const activeVideo = options.isVideoMap ? (options.videoRefs.current[options.activeVideoIndex] ?? null) : null;
      const {
        mapDrawSource,
        renderCamera,
        showGrid,
        weatherMapDimensions,
        weatherMapReady,
        weatherMapSource
      } = getSceneCanvasRenderPlan({
        activeVideo,
        camera: options.camera,
        canShowGrid: options.canShowGrid,
        canShowMap: options.canShowMap,
        height,
        loadedMap: options.loadedMap,
        mapAsset: options.mapAsset,
        mode: options.mode,
        outputPixelRatio: window.devicePixelRatio || 1,
        playerDisplayScale: options.playerDisplayScale,
        scene,
        width
      });

      ctx.save();
      ctx.translate(renderCamera.x, renderCamera.y);
      ctx.scale(renderCamera.zoom, renderCamera.zoom);

      if (options.mapCanvasBackgroundPlan === "image-map" && options.loadedMap?.ready) {
        ctx.globalAlpha = options.mapLayer?.opacity ?? 1;
        try {
          drawMapSource(ctx, mapDrawSource ?? options.loadedMap.originalSource, scene, width, height, options.loadedMap.sourceWidth, options.loadedMap.sourceHeight);
        } catch {
          // Keep the canvas pass resilient if an image asset is temporarily unavailable.
        }
        ctx.globalAlpha = 1;
      } else if (options.mapCanvasBackgroundPlan === "empty-map-prompt") {
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
      } else if (options.mapCanvasBackgroundPlan === "fallback-fill") {
        ctx.fillStyle = "#111720";
        ctx.fillRect(0, 0, 1600, 1000);
      }

      if (showGrid && scene.grid.type === "square") {
        drawSquareGrid(ctx, scene, width, height, renderCamera, options.mode);
      } else if (showGrid && scene.grid.type === "hex") {
        drawHexGrid(ctx, scene, width, height, renderCamera, options.mode);
      }

      if (options.mode === "gm" && options.tokenDragPreview) {
        drawTokenDragHighlights(ctx, scene, options.tokenDragPreview, renderCamera.zoom);
      }

      const now = Date.now();
      if (options.canShowTokens) {
        drawTokens(ctx, scene, options.loadedTokenImages, options.mode, options.effectiveSelectedTokenIds, options.tokenDragPreview, options.playerTokenTweenPositionsRef.current, renderCamera.zoom, options.turnOrderTokenIndicators, now);
      }

      if (options.canShowDrawings) {
        const drawingPolygonPreview = getDrawingPolygonDraftPreview(options.drawingPolygonDraft, {
          color: options.drawingColor,
          opacity: options.drawingOpacity,
          fillColor: options.drawingFillColor,
          fillOpacity: options.drawingFillOpacity,
          strokeStyle: options.drawingStrokeStyle,
          strokeWidth: options.drawingStrokeWidth
        });
        drawDrawings(
          ctx,
          scene,
          options.mode,
          options.drawingLayer?.opacity ?? 1,
          options.mode === "gm" ? (options.drawingPreview ?? drawingPolygonPreview) : null,
          renderCamera.zoom,
          options.effectiveSelectedDrawingIds,
          options.drawingDragPreview,
          options.drawingRotateRef.current ? options.drawingRotateRef.current.groupStartPoints : options.drawingDragPreview
        );
      }

      const visibleGmRuler = options.rulerDrag ?? options.releasedRulerDrag;
      if (options.mode === "gm" && visibleGmRuler) {
        drawRuler(ctx, visibleGmRuler, getRulerLabel(visibleGmRuler, scene), scene.grid, renderCamera.zoom);
      }

      ctx.restore();

      if (options.canShowFog) {
        drawFog(ctx, scene, width, height, renderCamera, options.mode, options.fogPreview, options.polygonDraft, options.effectiveSelectedFogShapeIds);
      }
      if (options.canShowWeather && !options.mapOverlayActive) {
        if (weatherMapReady) {
          drawWeather(ctx, scene, width, height, renderCamera, now, options.weatherLayer?.opacity ?? 1, weatherMapSource, weatherMapDimensions);
        }
        drawEnvironmentEffects(ctx, options.effectRenderState.environmentEffects, renderCamera, options.mode, now, options.weatherLayer?.opacity ?? 1, options.acidEffectTuning, options.coldEffectTuning, options.darknessEffectTuning, options.poisonEffectTuning, options.waterEffectTuning, options.lavaEffectTuning, options.fireEffectTuning, options.lightningEffectTuning, options.arcaneEffectTuning, options.chaosEffectTuning, options.voidEffectTuning, options.natureEffectTuning, options.distortionEffectTuning, options.radiantEffectTuning, options.forceFieldEffectTuning, options.shockwaveEffectTuning, options.smokeEffectTuning, options.fogEffectTuning);
      }
      if (options.mode === "gm") {
        drawWeatherMaskOutlines(ctx, options.effectRenderState.weatherMasks, renderCamera);
      }
      if (options.mode === "gm" && options.weatherMaskPreview) {
        drawWeatherMaskPreview(ctx, options.weatherMaskPreview, renderCamera);
      }
      if (options.mode === "gm" && options.environmentEffectPreview) {
        drawEnvironmentEffectPreview(ctx, options.environmentEffectPreview, renderCamera);
      }
      if (options.mode === "gm" && options.weatherMaskTool === "polygon" && options.weatherPolygonDraft) {
        drawWeatherPolygonDraft(ctx, options.weatherPolygonDraft, renderCamera);
      }
      if (options.mode === "gm" && options.environmentEffectTool === "polygon" && options.environmentPolygonDraft) {
        drawWeatherPolygonDraft(ctx, options.environmentPolygonDraft, renderCamera);
      }
      if (options.mode === "gm") {
        for (const selectedWeatherMask of options.effectRenderState.selectedWeatherMasks) {
          drawWeatherMaskSelection(ctx, selectedWeatherMask, renderCamera);
        }
        if (options.effectRenderState.selectedEnvironmentEffect) {
          drawEnvironmentEffectShape(ctx, options.effectRenderState.selectedEnvironmentEffect, renderCamera, { fill: false, selected: true });
        }
      }
      if (options.mode === "gm" && options.brushHoverPoint && options.fogTool?.includes("brush") && !options.fogPreview) {
        drawBrushHoverPreview(ctx, options.brushHoverPoint, Math.max(4, options.activeFogBrushSize / 2), renderCamera, getFogOperationForTool(options.fogTool));
      }
      if (options.mode === "gm" && options.brushHoverPoint && options.drawingTool === "freehand" && !options.drawingPreview) {
        drawDrawingBrushHoverPreview(ctx, options.brushHoverPoint, Math.max(4, options.drawingStrokeWidth / 2), renderCamera, options.drawingColor, options.drawingOpacity);
      }
      for (const snapMarkerOperation of getSceneSnapMarkerOperations({
        mode: options.mode,
        hasSnapPoint: Boolean(options.snapPoint),
        fogOperation: options.fogTool && !options.fogTool.includes("brush") ? getFogOperationForTool(options.fogTool) : null,
        drawingTool: options.drawingTool,
        drawingDragActive: Boolean(options.drawingDragPreview && options.drawingDragRef.current),
        weatherMaskTool: options.weatherMaskTool,
        weatherMaskMoveActive: Boolean(options.weatherMaskMovePreview && options.weatherMaskMoveRef.current),
        environmentEffectTool: options.environmentEffectTool,
        environmentEffectMoveActive: Boolean(options.environmentEffectMovePreview && options.environmentEffectMoveRef.current)
      })) {
        if (options.snapPoint) {
          drawSnapMarker(ctx, options.snapPoint, renderCamera, snapMarkerOperation);
        }
      }
      if (options.mode === "gm" && (options.onMapCalibrationBox || options.mapCalibrationBox)) {
        drawMapCalibrationBox(ctx, getVisibleMapCalibrationBox(options.mapCalibrationDrag, options.mapCalibrationDraftBox ?? options.mapCalibrationBox), renderCamera);
      }
      if (options.mode === "gm" && options.selectionDrag) {
        drawSelectionMarquee(ctx, options.selectionDrag, renderCamera);
      }
      if (options.mode === "gm" && options.canShowDrawings && !options.drawingDragPreview && options.effectiveSelectedDrawingIds.length > 0) {
        drawDrawingResizeHandles(ctx, scene.drawings, options.effectiveSelectedDrawingIds, renderCamera);
      }
      if (options.visibleCanvasLiveTableEvents.length > 0) {
        drawLiveTableEvents(ctx, options.visibleCanvasLiveTableEvents, renderCamera, scene.grid);
      }
    };

    let animationFrame = 0;
    let lastWeatherOnlyFrameAt = 0;
    const getAnimationSources = (): CanvasAnimationSources =>
      createCanvasAnimationSources({
        mapAnimating: Boolean(options.loadedMap?.animate),
        tokenAnimating: Boolean(options.playerTokenTweenPositionsRef.current),
        tableEventsAnimating: hasActiveLiveTableEvents(options.liveTableEvents),
        selectionAnimating: options.sceneSelectionAnimating,
        ...options.sceneAnimationState
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
  }, [options]);
}

function drawEmptyScenePrompt(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#111720";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#8792a2";
  ctx.font = "24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Select a scene to view", width / 2, height / 2);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}
