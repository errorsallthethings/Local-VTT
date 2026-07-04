import { describe, expect, it } from "vitest";
import { getSceneSelectionClearTargets, getSceneSelectionKindsToClear, shouldClearSceneSelectionKind } from "../../src/renderer/components/scene/sceneSelectionRouting";

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
});
