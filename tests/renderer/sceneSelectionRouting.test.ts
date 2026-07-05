import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import {
  clearSceneSelectionsExcept,
  getSceneMarqueeSelectionPayload,
  getSceneSelectionClearTargets,
  getSceneSelectionKindsToClear,
  shouldClearSceneSelectionKind
} from "../../src/renderer/components/scene/sceneSelectionRouting";

describe("scene selection routing", () => {
  it("clears every other selection kind when a target is selected", () => {
    expect(getSceneSelectionClearTargets("token")).toEqual({
      token: false,
      drawing: true,
      fogShape: true,
      weatherMask: true,
      environmentEffect: true
    });

    expect(getSceneSelectionClearTargets("weatherMask")).toEqual({
      token: true,
      drawing: true,
      fogShape: true,
      weatherMask: false,
      environmentEffect: true
    });
  });

  it("clears all selection kinds for empty canvas selection", () => {
    expect(getSceneSelectionKindsToClear("empty")).toEqual(["token", "drawing", "fogShape", "weatherMask", "environmentEffect"]);
  });

  it("reports individual clear decisions for routing code", () => {
    expect(shouldClearSceneSelectionKind("drawing", "drawing")).toBe(false);
    expect(shouldClearSceneSelectionKind("drawing", "token")).toBe(true);
    expect(shouldClearSceneSelectionKind("empty", "drawing")).toBe(true);
  });

  it("applies clear callbacks for every inactive selection kind", () => {
    const callbacks = {
      token: vi.fn(),
      drawing: vi.fn(),
      fogShape: vi.fn(),
      weatherMask: vi.fn(),
      environmentEffect: vi.fn()
    };

    clearSceneSelectionsExcept("drawing", callbacks);

    expect(callbacks.token).toHaveBeenCalledWith(null);
    expect(callbacks.drawing).not.toHaveBeenCalled();
    expect(callbacks.fogShape).toHaveBeenCalledWith(null);
    expect(callbacks.weatherMask).toHaveBeenCalledWith(null);
    expect(callbacks.environmentEffect).toHaveBeenCalledWith(null);
  });

  it("creates marquee selection payloads with the drag mode", () => {
    const scene = createDefaultScene("Selection");
    scene.tokens = [
      {
        id: "token-1",
        name: "Token",
        assetId: null,
        position: { x: 10, y: 10 },
        size: { width: 50, height: 50 },
        hidden: false,
        visibleInPlayer: true
      }
    ];

    expect(
      getSceneMarqueeSelectionPayload(
        scene,
        { start: { x: 0, y: 0 }, current: { x: 100, y: 100 }, mode: "add" },
        { tokens: true, templates: false, fogMasks: false, weatherMasks: false, drawings: false },
        { tokens: true, drawings: true }
      )
    ).toEqual({
      tokenIds: ["token-1"],
      drawingIds: [],
      fogShapeIds: [],
      weatherMaskIds: [],
      mode: "add"
    });

    expect(
      getSceneMarqueeSelectionPayload(
        scene,
        { start: { x: 0, y: 0 }, current: { x: 1, y: 1 }, mode: "replace" },
        { tokens: true, templates: false, fogMasks: false, weatherMasks: false, drawings: false },
        { tokens: true, drawings: true }
      )
    ).toBeNull();
  });
});
