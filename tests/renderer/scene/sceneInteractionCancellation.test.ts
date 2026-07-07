import { describe, expect, it, vi } from "vitest";
import {
  cancelSceneInteractionsForKeyboardEvent,
  getCancelableSceneInteractionKeys,
  hasCancelableSceneInteraction,
  type SceneInteractionCancelers
} from "../../../src/renderer/components/scene/input/sceneInteractionCancellation";

function cancelers(): SceneInteractionCancelers {
  return {
    cancelTokenDrag: vi.fn(),
    cancelDrawingDrag: vi.fn(),
    cancelWeatherMaskMove: vi.fn(),
    cancelEnvironmentEffectMove: vi.fn(),
    cancelRulerDrag: vi.fn(),
    clearFogPreview: vi.fn(),
    clearEnvironmentEffectPreview: vi.fn(),
    clearDrawingPreview: vi.fn()
  };
}

describe("scene interaction cancellation", () => {
  it("reports active cancelable scene interactions in a stable order", () => {
    expect(
      getCancelableSceneInteractionKeys({
        tokenDragPreview: {},
        drawingDragPreview: {},
        weatherMaskMovePreview: {},
        environmentEffectMovePreview: {},
        rulerDrag: {},
        fogPreview: {},
        drawingPreview: {},
        environmentEffectPreview: {}
      })
    ).toEqual([
      "token-drag",
      "drawing-transform",
      "weather-mask-move",
      "environment-effect-move",
      "ruler",
      "fog-preview",
      "drawing-preview",
      "environment-effect-preview"
    ]);
  });

  it("detects whether any scene interaction can be canceled", () => {
    expect(hasCancelableSceneInteraction({})).toBe(false);
    expect(hasCancelableSceneInteraction({ rulerDrag: {} })).toBe(true);
    expect(hasCancelableSceneInteraction({ drawingPreview: null })).toBe(false);
  });

  it("ignores non-Escape keyboard events", () => {
    const actions = cancelers();
    const event = { key: "Enter", preventDefault: vi.fn() };

    expect(cancelSceneInteractionsForKeyboardEvent(event, actions)).toBe(false);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(actions.cancelTokenDrag).not.toHaveBeenCalled();
    expect(actions.clearDrawingPreview).not.toHaveBeenCalled();
  });

  it("cancels every scene interaction on Escape", () => {
    const actions = cancelers();
    const event = { key: "Escape", preventDefault: vi.fn() };

    expect(cancelSceneInteractionsForKeyboardEvent(event, actions)).toBe(true);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(actions.cancelTokenDrag).toHaveBeenCalledOnce();
    expect(actions.cancelDrawingDrag).toHaveBeenCalledOnce();
    expect(actions.cancelWeatherMaskMove).toHaveBeenCalledOnce();
    expect(actions.cancelEnvironmentEffectMove).toHaveBeenCalledOnce();
    expect(actions.cancelRulerDrag).toHaveBeenCalledOnce();
    expect(actions.clearFogPreview).toHaveBeenCalledOnce();
    expect(actions.clearEnvironmentEffectPreview).toHaveBeenCalledOnce();
    expect(actions.clearDrawingPreview).toHaveBeenCalledOnce();
  });
});
