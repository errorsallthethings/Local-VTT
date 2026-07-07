import { describe, expect, it, vi } from "vitest";
import { resetSceneHoverState } from "../../../src/renderer/components/scene/input/sceneHoverReset";

describe("scene hover reset", () => {
  it("clears all transient hover indicators", () => {
    const actions = {
      clearSnapPoint: vi.fn(),
      clearBrushHoverPoint: vi.fn(),
      clearDrawingTransformHover: vi.fn(),
      clearSceneItemHover: vi.fn()
    };

    resetSceneHoverState(actions);

    expect(actions.clearSnapPoint).toHaveBeenCalledOnce();
    expect(actions.clearBrushHoverPoint).toHaveBeenCalledOnce();
    expect(actions.clearDrawingTransformHover).toHaveBeenCalledOnce();
    expect(actions.clearSceneItemHover).toHaveBeenCalledOnce();
  });
});
