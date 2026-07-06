import { useCallback } from "react";
import type { Scene } from "../../../shared/localvtt";
import type { RulerDrag } from "../../canvas/measurement";
import type { TokenDragState } from "../../canvas/scene";
import type { TokenDragPreview } from "../../canvas/tokens";
import { useWindowKeyDown } from "../../hooks/useWindowKeyDown";
import {
  cancelSceneInteractionsForKeyboardEvent,
  hasCancelableSceneInteraction,
  type SceneInteractionCancelers,
  type SceneInteractionCancellationState
} from "./sceneInteractionCancellation";
import { getRulerWaypointAppendKeyboardAction, getTokenWaypointAppendKeyboardAction } from "./sceneWaypointKeyboard";

interface MutableRef<T> {
  current: T;
}

type StateSetter<T> = (value: T | ((current: T) => T)) => void;

interface SceneCanvasKeyboardInteractionOptions extends SceneInteractionCancellationState, SceneInteractionCancelers {
  emitRulerEvent: (drag: RulerDrag) => void;
  mode: "gm" | "player";
  rulerDrag: RulerDrag | null;
  rulerDragRef: MutableRef<(RulerDrag & { pointerId: number }) | null>;
  scene: Scene | null;
  setRulerDrag: StateSetter<RulerDrag | null>;
  setTokenDragPreview: StateSetter<TokenDragPreview | null>;
  tokenDragPreview: TokenDragPreview | null;
  tokenDragRef: MutableRef<TokenDragState | null>;
}

export function useSceneCanvasKeyboardInteractions({
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
}: SceneCanvasKeyboardInteractionOptions): void {
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

  const cancelSceneInteractionOnEscape = useCallback(
    (event: KeyboardEvent) => {
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
    },
    [
      cancelDrawingDrag,
      cancelEnvironmentEffectMove,
      cancelRulerDrag,
      cancelTokenDrag,
      cancelWeatherMaskMove,
      clearDrawingPreview,
      clearEnvironmentEffectPreview,
      clearFogPreview
    ]
  );
  useWindowKeyDown(mode === "gm" && sceneInteractionCancelable, cancelSceneInteractionOnEscape);

  const appendTokenWaypointOnShift = useCallback(
    (event: KeyboardEvent) => {
      if (!scene) {
        return;
      }
      const action = getTokenWaypointAppendKeyboardAction(scene, tokenDragRef.current, tokenDragPreview, event);
      if (action.kind !== "set-token-waypoint") {
        return;
      }

      event.preventDefault();
      tokenDragRef.current = action.update.drag;
      setTokenDragPreview(action.update.preview);
    },
    [scene, setTokenDragPreview, tokenDragPreview, tokenDragRef]
  );
  useWindowKeyDown(mode === "gm" && Boolean(scene && tokenDragPreview), appendTokenWaypointOnShift);

  const appendRulerWaypointOnShift = useCallback(
    (event: KeyboardEvent) => {
      if (!scene) {
        return;
      }
      const action = getRulerWaypointAppendKeyboardAction(scene, rulerDragRef.current, event);
      if (action.kind !== "set-ruler-waypoint") {
        return;
      }

      event.preventDefault();
      rulerDragRef.current = action.drag;
      setRulerDrag(action.drag);
      emitRulerEvent(action.drag);
    },
    [emitRulerEvent, rulerDragRef, scene, setRulerDrag]
  );
  useWindowKeyDown(mode === "gm" && Boolean(scene && rulerDrag), appendRulerWaypointOnShift);
}
