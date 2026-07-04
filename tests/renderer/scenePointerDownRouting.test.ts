import { describe, expect, it } from "vitest";
import { getScenePointerDownRoute, type ScenePointerDownRoutingOptions } from "../../src/renderer/components/scene/scenePointerDownRouting";

describe("scene pointer down routing", () => {
  it("routes non-primary buttons to panning before any tool handling", () => {
    expect(route({ button: 2, canvasTool: "ruler", hasMapCalibrationTool: true })).toBe("pan");
  });

  it("keeps ping pointer down as a no-op so click can emit the ping", () => {
    expect(route({ canvasTool: "ping" })).toBe("ignore-ping");
  });

  it("prioritizes map calibration before table tools", () => {
    expect(route({ canvasTool: "ruler", hasMapCalibrationTool: true })).toBe("map-calibration");
    expect(route({ canvasTool: "laser", hasMapCalibrationTool: true })).toBe("map-calibration");
  });

  it("routes ruler and laser table tools", () => {
    expect(route({ canvasTool: "ruler" })).toBe("ruler");
    expect(route({ canvasTool: "laser" })).toBe("laser");
  });

  it("routes authoring tools before selector interaction", () => {
    expect(route({ drawingTool: "polygon" })).toBe("drawing-polygon");
    expect(route({ drawingTool: "rectangle" })).toBe("drawing");
    expect(route({ fogTool: "hide-rectangle" })).toBe("fog");
    expect(route({ weatherMaskTool: "rectangle" })).toBe("weather-mask");
    expect(route({ environmentEffectTool: "rectangle" })).toBe("environment-effect");
  });

  it("routes additive marquee before selector hit testing", () => {
    expect(route({ shiftKey: true })).toBe("marquee-additive");
    expect(route({ ctrlKey: true })).toBe("marquee-additive");
    expect(route({ metaKey: true })).toBe("marquee-additive");
  });

  it("routes selector, plain marquee, grabber pan, and unavailable actions", () => {
    expect(route()).toBe("selector");
    expect(route({ onSceneChangeAvailable: false })).toBe("marquee");
    expect(route({ mouseBehavior: "grabber", onSceneChangeAvailable: false })).toBe("pan");
    expect(route({ mode: "player" })).toBe("none");
  });
});

function route(patch: Partial<ScenePointerDownRoutingOptions> = {}) {
  return getScenePointerDownRoute({
    authoringToolActive: false,
    button: 0,
    canvasTool: null,
    drawingTool: null,
    environmentEffectTool: null,
    fogTool: null,
    hasMapCalibrationTool: false,
    hasScene: true,
    mode: "gm",
    mouseBehavior: "selector",
    onSceneChangeAvailable: true,
    weatherMaskTool: null,
    ...patch
  });
}
