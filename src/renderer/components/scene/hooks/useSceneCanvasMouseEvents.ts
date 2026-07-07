import { useCallback, type Dispatch, type MouseEvent, type SetStateAction } from "react";
import type { LiveTableEvent, Point, Scene, TableToolSettings } from "../../../../shared/localvtt";
import { clientToWorldPoint, getRenderCamera, type Camera, type DrawingTransformHover } from "../../../canvas/core";
import type { DrawingTool } from "../../../canvas/drawings";
import { createPingLiveTableEvent, getRulerDragWithRemovedWaypoint } from "../../../canvas/live-table";
import type { RulerDrag } from "../../../canvas/measurement";
import type { TokenDragState } from "../../../canvas/scene";
import { getTokenDragWaypointRemovalUpdate, type TokenDragPreview } from "../../../canvas/tokens";
import { calculateCanvasContextMenuPosition, type CanvasContextMenuKind } from "../../../lib/ui";
import type { EnvironmentEffectTool, WeatherMaskTool } from "../../tools";
import { getSceneContextMenuOpening } from "../context-menu/sceneContextMenuOpening";
import {
  getCanvasContextMenuKindForSceneTarget,
  getSceneContextMenuRoute,
  shouldPreventSceneContextMenuDefault
} from "../context-menu/sceneContextMenuRouting";
import { getSceneContextMenuTarget } from "../context-menu/sceneContextMenuTarget";
import { getSceneDoubleClickActions } from "../input/sceneDoubleClickRouting";
import { resetSceneHoverState } from "../input/sceneHoverReset";

interface MutableRef<T> {
  current: T;
}

interface SceneCanvasMouseEventsOptions {
  activeTableTools: TableToolSettings;
  applySceneContextMenuOpening: (opening: ReturnType<typeof getSceneContextMenuOpening>) => void;
  authoringToolActive: boolean;
  camera: Camera;
  canShowDrawings: boolean | undefined;
  canShowTokens: boolean | undefined;
  canvasTool?: "ruler" | "ping" | "laser" | null;
  commitDrawingPolygonDraft: () => void;
  commitEnvironmentPolygonDraft: () => void;
  commitFogPolygonDraft: () => void;
  commitWeatherPolygonDraft: () => void;
  drawingPolygonDraftRef: MutableRef<unknown>;
  drawingTool?: DrawingTool | null;
  emitRulerEvent: (nextRulerDrag: RulerDrag) => void;
  environmentEffectTool?: EnvironmentEffectTool | null;
  environmentPolygonDraftRef: MutableRef<unknown>;
  fogPolygonDraftRef: MutableRef<unknown>;
  mode: "gm" | "player";
  onAddTokenToTurnOrder?: (tokenId: string) => void;
  onLiveTableEvent?: (event: LiveTableEvent) => void;
  playerDisplayScale: number;
  removeLastDrawingPolygonDraftPoint: () => void;
  removeLastEnvironmentPolygonDraftPoint: () => void;
  removeLastFogPolygonDraftPoint: () => void;
  removeLastWeatherPolygonDraftPoint: () => void;
  rulerDragRef: MutableRef<(RulerDrag & { pointerId: number }) | null>;
  scene: Scene | null;
  setBrushHoverPoint: Dispatch<SetStateAction<Point | null>>;
  setDrawingTransformHover: Dispatch<SetStateAction<DrawingTransformHover>>;
  setRulerDrag: Dispatch<SetStateAction<RulerDrag | null>>;
  setSceneItemHover: Dispatch<SetStateAction<boolean>>;
  setSnapPoint: Dispatch<SetStateAction<Point | null>>;
  setTokenDragPreview: Dispatch<SetStateAction<TokenDragPreview | null>>;
  tableToolsVisibleInPlayer: boolean;
  tokenDragPreview: TokenDragPreview | null;
  tokenDragRef: MutableRef<TokenDragState | null>;
  weatherMaskTool?: WeatherMaskTool | null;
  weatherPolygonDraftRef: MutableRef<unknown>;
}

export function useSceneCanvasMouseEvents({
  activeTableTools,
  applySceneContextMenuOpening,
  authoringToolActive,
  camera,
  canShowDrawings,
  canShowTokens,
  canvasTool,
  commitDrawingPolygonDraft,
  commitEnvironmentPolygonDraft,
  commitFogPolygonDraft,
  commitWeatherPolygonDraft,
  drawingPolygonDraftRef,
  drawingTool,
  emitRulerEvent,
  environmentEffectTool,
  environmentPolygonDraftRef,
  fogPolygonDraftRef,
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
}: SceneCanvasMouseEventsOptions) {
  const onPointerLeave = useCallback(() => {
    resetSceneHoverState({
      clearSnapPoint: () => setSnapPoint(null),
      clearBrushHoverPoint: () => setBrushHoverPoint(null),
      clearDrawingTransformHover: () => setDrawingTransformHover(null),
      clearSceneItemHover: () => setSceneItemHover(false)
    });
  }, [setBrushHoverPoint, setDrawingTransformHover, setSceneItemHover, setSnapPoint]);

  const onClick = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "gm" || canvasTool !== "ping" || !scene) {
      return;
    }
    event.preventDefault();
    onLiveTableEvent?.(
      createPingLiveTableEvent(
        crypto.randomUUID(),
        clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, getRenderCamera(camera, playerDisplayScale)),
        activeTableTools,
        tableToolsVisibleInPlayer
      )
    );
  }, [activeTableTools, camera, canvasTool, mode, onLiveTableEvent, playerDisplayScale, scene, tableToolsVisibleInPlayer]);

  const onDoubleClick = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    const actions = getSceneDoubleClickActions({
      canvasTool,
      drawingTool,
      environmentEffectTool,
      hasDrawingPolygonDraft: Boolean(drawingPolygonDraftRef.current),
      hasEnvironmentPolygonDraft: Boolean(environmentPolygonDraftRef.current),
      hasFogPolygonDraft: Boolean(fogPolygonDraftRef.current),
      hasScene: Boolean(scene),
      hasWeatherPolygonDraft: Boolean(weatherPolygonDraftRef.current),
      mode,
      weatherMaskTool
    });
    if (actions.length > 0) {
      event.preventDefault();
    }
    for (const action of actions) {
      if (action === "suppress-ping") {
        return;
      }
      if (action === "commit-fog-polygon") {
        commitFogPolygonDraft();
      } else if (action === "commit-drawing-polygon") {
        commitDrawingPolygonDraft();
      } else if (action === "commit-weather-polygon") {
        commitWeatherPolygonDraft();
      } else {
        commitEnvironmentPolygonDraft();
      }
    }
  }, [
    canvasTool,
    commitDrawingPolygonDraft,
    commitEnvironmentPolygonDraft,
    commitFogPolygonDraft,
    commitWeatherPolygonDraft,
    drawingPolygonDraftRef,
    drawingTool,
    environmentEffectTool,
    environmentPolygonDraftRef,
    fogPolygonDraftRef,
    mode,
    scene,
    weatherMaskTool,
    weatherPolygonDraftRef
  ]);

  const onContextMenu = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    const activeRulerDrag = rulerDragRef.current;
    const tokenDrag = tokenDragRef.current;
    const route = getSceneContextMenuRoute({
      hasTokenDrag: Boolean(tokenDrag),
      hasRulerDrag: Boolean(activeRulerDrag),
      hasFogPolygonDraft: Boolean(fogPolygonDraftRef.current),
      hasDrawingPolygonDraft: Boolean(drawingPolygonDraftRef.current),
      hasWeatherPolygonDraft: Boolean(weatherPolygonDraftRef.current),
      hasEnvironmentPolygonDraft: Boolean(environmentPolygonDraftRef.current),
      canOpenMenu: mode === "gm" && Boolean(scene)
    });
    if (shouldPreventSceneContextMenuDefault(route, authoringToolActive)) {
      event.preventDefault();
    }
    if (route === "token-waypoint" && tokenDrag) {
      const update = getTokenDragWaypointRemovalUpdate(tokenDrag, tokenDragPreview);
      if (!update) {
        return;
      }
      tokenDragRef.current = update.drag;
      setTokenDragPreview(update.preview);
      return;
    }

    if (route === "ruler-waypoint" && activeRulerDrag) {
      const nextRulerDrag = getRulerDragWithRemovedWaypoint(activeRulerDrag);
      if (!nextRulerDrag) {
        return;
      }
      rulerDragRef.current = nextRulerDrag;
      setRulerDrag(nextRulerDrag);
      emitRulerEvent(nextRulerDrag);
      return;
    }

    if (route === "open-menu") {
      if (mode === "gm" && scene) {
        const cameraState = getRenderCamera(camera, playerDisplayScale);
        const point = clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, cameraState);
        const contextTarget = getSceneContextMenuTarget({
          authoringToolActive,
          camera: cameraState,
          canOpenTokenMenu: Boolean(onAddTokenToTurnOrder),
          canShowDrawings: Boolean(canShowDrawings),
          canShowTokens: Boolean(canShowTokens),
          point,
          scene
        });
        if (contextTarget) {
          const menuKind: CanvasContextMenuKind = getCanvasContextMenuKindForSceneTarget(contextTarget);
          applySceneContextMenuOpening(getSceneContextMenuOpening(contextTarget, getCanvasContextMenuPosition(event, menuKind)));
        }
      }
      return;
    }
    if (route === "fog-polygon-backtrack") {
      removeLastFogPolygonDraftPoint();
      return;
    }
    if (route === "drawing-polygon-backtrack") {
      removeLastDrawingPolygonDraftPoint();
      return;
    }
    if (route === "weather-polygon-backtrack") {
      removeLastWeatherPolygonDraftPoint();
      return;
    }
    if (route === "environment-polygon-backtrack") {
      removeLastEnvironmentPolygonDraftPoint();
    }
  }, [
    applySceneContextMenuOpening,
    authoringToolActive,
    camera,
    canShowDrawings,
    canShowTokens,
    drawingPolygonDraftRef,
    emitRulerEvent,
    environmentPolygonDraftRef,
    fogPolygonDraftRef,
    mode,
    onAddTokenToTurnOrder,
    playerDisplayScale,
    removeLastDrawingPolygonDraftPoint,
    removeLastEnvironmentPolygonDraftPoint,
    removeLastFogPolygonDraftPoint,
    removeLastWeatherPolygonDraftPoint,
    rulerDragRef,
    scene,
    setRulerDrag,
    setTokenDragPreview,
    tokenDragPreview,
    tokenDragRef,
    weatherPolygonDraftRef
  ]);

  return {
    onClick,
    onContextMenu,
    onDoubleClick,
    onPointerLeave
  };
}

function getCanvasContextMenuPosition(event: MouseEvent<HTMLCanvasElement>, kind: CanvasContextMenuKind): { x: number; y: number } {
  return calculateCanvasContextMenuPosition({
    anchorX: event.clientX,
    anchorY: event.clientY,
    kind,
    viewportWidth: window.innerWidth || document.documentElement.clientWidth,
    viewportHeight: window.innerHeight || document.documentElement.clientHeight
  });
}
