import { describe, expect, it } from "vitest";
import {
  getScenePointerMoveFallbackRoute,
  type ScenePointerMoveFallbackRoute,
  type ScenePointerMoveFallbackRoutingOptions
} from "../../../src/renderer/components/scene/input/scenePointerMoveFallbackRouting";

const baseOptions: ScenePointerMoveFallbackRoutingOptions = {
  drawingPolygonDraftActive: false,
  drawingTool: null,
  environmentEffectTool: null,
  environmentPolygonDraftActive: false,
  fogPolygonDraftActive: false,
  fogTool: null,
  hasScene: true,
  mode: "gm",
  weatherMaskTool: null,
  weatherPolygonDraftActive: false
};

describe("getScenePointerMoveFallbackRoute", () => {
  it.each<[ScenePointerMoveFallbackRoute, Partial<ScenePointerMoveFallbackRoutingOptions>]>([
    ["drawing-polygon-draft", { drawingTool: "polygon", drawingPolygonDraftActive: true }],
    ["fog-polygon-draft", { fogPolygonDraftActive: true }],
    ["weather-polygon-draft", { weatherMaskTool: "polygon", weatherPolygonDraftActive: true }],
    ["environment-polygon-draft", { environmentEffectTool: "polygon", environmentPolygonDraftActive: true }],
    ["fog-brush-hover", { fogTool: "brush" }],
    ["drawing-freehand-hover", { drawingTool: "freehand" }],
    ["hover-and-snap", {}]
  ])("routes %s", (route, overrides) => {
    expect(getScenePointerMoveFallbackRoute({ ...baseOptions, ...overrides })).toBe(route);
  });

  it("preserves fallback priority when multiple fallbacks are active", () => {
    expect(
      getScenePointerMoveFallbackRoute({
        ...baseOptions,
        drawingTool: "polygon",
        drawingPolygonDraftActive: true,
        fogPolygonDraftActive: true,
        weatherMaskTool: "polygon",
        weatherPolygonDraftActive: true,
        environmentEffectTool: "polygon",
        environmentPolygonDraftActive: true,
        fogTool: "brush"
      })
    ).toBe("drawing-polygon-draft");
  });

  it("requires matching polygon tools for weather and environment drafts", () => {
    expect(
      getScenePointerMoveFallbackRoute({
        ...baseOptions,
        weatherMaskTool: "brush",
        weatherPolygonDraftActive: true,
        environmentEffectTool: "ellipse",
        environmentPolygonDraftActive: true
      })
    ).toBe("hover-and-snap");
  });

  it("requires GM mode and a scene for hover brush routes", () => {
    expect(getScenePointerMoveFallbackRoute({ ...baseOptions, fogTool: "brush", hasScene: false })).toBe("hover-and-snap");
    expect(getScenePointerMoveFallbackRoute({ ...baseOptions, fogTool: "brush", mode: "player" })).toBe("hover-and-snap");
    expect(getScenePointerMoveFallbackRoute({ ...baseOptions, drawingTool: "freehand", hasScene: false })).toBe("hover-and-snap");
    expect(getScenePointerMoveFallbackRoute({ ...baseOptions, drawingTool: "freehand", mode: "player" })).toBe("hover-and-snap");
  });
});
