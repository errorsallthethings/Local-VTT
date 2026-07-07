export type SceneCancelableInteractionKey =
  | "token-drag"
  | "drawing-transform"
  | "weather-mask-move"
  | "environment-effect-move"
  | "ruler"
  | "fog-preview"
  | "drawing-preview"
  | "environment-effect-preview";

export interface SceneInteractionCancellationState {
  tokenDragPreview?: unknown;
  drawingDragPreview?: unknown;
  weatherMaskMovePreview?: unknown;
  environmentEffectMovePreview?: unknown;
  rulerDrag?: unknown;
  fogPreview?: unknown;
  drawingPreview?: unknown;
  environmentEffectPreview?: unknown;
}

export interface SceneInteractionCancelers {
  cancelTokenDrag: () => void;
  cancelDrawingDrag: () => void;
  cancelWeatherMaskMove: () => void;
  cancelEnvironmentEffectMove: () => void;
  cancelRulerDrag: () => void;
  clearFogPreview: () => void;
  clearEnvironmentEffectPreview: () => void;
  clearDrawingPreview: () => void;
}

export interface SceneKeyboardCancelEvent {
  key: string;
  preventDefault: () => void;
}

export function getCancelableSceneInteractionKeys(state: SceneInteractionCancellationState): SceneCancelableInteractionKey[] {
  const keys: SceneCancelableInteractionKey[] = [];
  if (state.tokenDragPreview) {
    keys.push("token-drag");
  }
  if (state.drawingDragPreview) {
    keys.push("drawing-transform");
  }
  if (state.weatherMaskMovePreview) {
    keys.push("weather-mask-move");
  }
  if (state.environmentEffectMovePreview) {
    keys.push("environment-effect-move");
  }
  if (state.rulerDrag) {
    keys.push("ruler");
  }
  if (state.fogPreview) {
    keys.push("fog-preview");
  }
  if (state.drawingPreview) {
    keys.push("drawing-preview");
  }
  if (state.environmentEffectPreview) {
    keys.push("environment-effect-preview");
  }
  return keys;
}

export function hasCancelableSceneInteraction(state: SceneInteractionCancellationState): boolean {
  return getCancelableSceneInteractionKeys(state).length > 0;
}

export function cancelSceneInteractionsForKeyboardEvent(event: SceneKeyboardCancelEvent, cancelers: SceneInteractionCancelers): boolean {
  if (event.key !== "Escape") {
    return false;
  }

  event.preventDefault();
  cancelers.cancelTokenDrag();
  cancelers.cancelDrawingDrag();
  cancelers.cancelWeatherMaskMove();
  cancelers.cancelEnvironmentEffectMove();
  cancelers.cancelRulerDrag();
  cancelers.clearFogPreview();
  cancelers.clearEnvironmentEffectPreview();
  cancelers.clearDrawingPreview();
  return true;
}
