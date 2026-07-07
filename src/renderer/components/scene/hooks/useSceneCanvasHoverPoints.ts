import { useCallback, type Dispatch, type PointerEvent, type RefObject, type SetStateAction } from "react";
import type { Point, Scene } from "../../../../shared/localvtt";
import { eventToWorldPoint, getRenderCamera, isSnapModifier, type Camera, type DrawingTransformHover } from "../../../canvas/core";
import { resolveDrawingToolEventPoint, resolveRulerEventPoint, resolveSceneToolEventPoint } from "../../../canvas/scene";
import type { DrawingPointOverrides, DrawingTool } from "../../../canvas/drawings";
import type { FogTool } from "../../../canvas/fog";
import type { EnvironmentEffectTool, WeatherMaskTool } from "../../tools";
import { getDrawingTransformHoverUpdate, getSceneItemHoverUpdate, getSceneSnapPointUpdate } from "../input/sceneHoverUpdates";

interface SceneCanvasHoverPointsOptions {
  authoringToolActive: boolean;
  camera: Camera;
  canShowDrawings: boolean | undefined;
  canShowFog: boolean | undefined;
  canShowTokens: boolean | undefined;
  canShowWeather: boolean | undefined;
  drawingDragPreview: DrawingPointOverrides | null;
  drawingTool: DrawingTool | null;
  environmentEffectTool: EnvironmentEffectTool | null;
  fogTool: FogTool | null;
  mode: "gm" | "player";
  playerDisplayScale: number;
  scene: Scene | null;
  selectedDrawingIds: string[];
  selectionDragRef: RefObject<unknown>;
  setDrawingTransformHover: Dispatch<SetStateAction<DrawingTransformHover>>;
  setSceneItemHover: Dispatch<SetStateAction<boolean>>;
  setSnapPoint: Dispatch<SetStateAction<Point | null>>;
  weatherMaskTool: WeatherMaskTool | null;
}

export function useSceneCanvasHoverPoints({
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
}: SceneCanvasHoverPointsOptions) {
  const getCameraState = useCallback(() => getRenderCamera(camera, playerDisplayScale), [camera, playerDisplayScale]);

  const updateDrawingTransformHover = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const cameraState = getCameraState();
    setDrawingTransformHover(
      getDrawingTransformHoverUpdate({
        mode,
        scene,
        point: eventToWorldPoint(event, cameraState),
        camera: cameraState,
        selectedDrawingIds,
        canShowDrawings: Boolean(canShowDrawings),
        hasActiveInteraction: Boolean(drawingDragPreview || authoringToolActive)
      })
    );
  }, [authoringToolActive, canShowDrawings, drawingDragPreview, getCameraState, mode, scene, selectedDrawingIds, setDrawingTransformHover]);

  const updateSceneItemHover = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const cameraState = getCameraState();
    setSceneItemHover(
      getSceneItemHoverUpdate({
        mode,
        scene,
        point: eventToWorldPoint(event, cameraState),
        camera: cameraState,
        canShowTokens: Boolean(canShowTokens),
        canShowDrawings: Boolean(canShowDrawings),
        canShowWeather: Boolean(canShowWeather),
        canShowFog: Boolean(canShowFog),
        hasActiveInteraction: Boolean(drawingDragPreview || authoringToolActive || selectionDragRef.current)
      })
    );
  }, [
    authoringToolActive,
    canShowDrawings,
    canShowFog,
    canShowTokens,
    canShowWeather,
    drawingDragPreview,
    getCameraState,
    mode,
    scene,
    selectionDragRef,
    setSceneItemHover
  ]);

  const getToolPoint = useCallback((event: PointerEvent<HTMLCanvasElement>, snapEnabled = true): Point => {
    const result = resolveSceneToolEventPoint(event, getCameraState(), scene, snapEnabled);
    setSnapPoint(result.snapPoint);
    return result.point;
  }, [getCameraState, scene, setSnapPoint]);

  const getRulerPoint = useCallback((event: PointerEvent<HTMLCanvasElement>): Point => {
    return resolveRulerEventPoint(event, getCameraState(), scene);
  }, [getCameraState, scene]);

  const getDrawingToolPoint = useCallback((event: PointerEvent<HTMLCanvasElement>, tool: DrawingTool): Point => {
    const result = resolveDrawingToolEventPoint(event, getCameraState(), scene, tool !== "freehand");
    setSnapPoint(result.snapPoint);
    return result.point;
  }, [getCameraState, scene, setSnapPoint]);

  const updateSnapPoint = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    setSnapPoint(
      getSceneSnapPointUpdate({
        scene,
        snapModifierActive: isSnapModifier(event),
        canSnapDrawing: Boolean(drawingTool && drawingTool !== "freehand"),
        canSnapFog: Boolean(fogTool && !fogTool.includes("brush")),
        canSnapWeather: Boolean(weatherMaskTool),
        canSnapEnvironment: Boolean(environmentEffectTool),
        point: eventToWorldPoint(event, getCameraState())
      })
    );
  }, [drawingTool, environmentEffectTool, fogTool, getCameraState, scene, setSnapPoint, weatherMaskTool]);

  return {
    getDrawingToolPoint,
    getRulerPoint,
    getToolPoint,
    updateDrawingTransformHover,
    updateSceneItemHover,
    updateSnapPoint
  };
}
