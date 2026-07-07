export interface SceneHoverResetActions {
  clearSnapPoint: () => void;
  clearBrushHoverPoint: () => void;
  clearDrawingTransformHover: () => void;
  clearSceneItemHover: () => void;
}

export function resetSceneHoverState(actions: SceneHoverResetActions): void {
  actions.clearSnapPoint();
  actions.clearBrushHoverPoint();
  actions.clearDrawingTransformHover();
  actions.clearSceneItemHover();
}
