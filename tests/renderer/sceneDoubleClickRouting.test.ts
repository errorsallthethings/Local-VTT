import { describe, expect, it } from "vitest";
import { getSceneDoubleClickActions } from "../../src/renderer/components/scene/sceneDoubleClickRouting";

describe("scene double-click routing", () => {
  it("suppresses ping double-clicks before draft commits", () => {
    expect(
      getSceneDoubleClickActions({
        canvasTool: "ping",
        drawingTool: "polygon",
        environmentEffectTool: "polygon",
        hasDrawingPolygonDraft: true,
        hasEnvironmentPolygonDraft: true,
        hasFogPolygonDraft: true,
        hasScene: true,
        hasWeatherPolygonDraft: true,
        mode: "gm",
        weatherMaskTool: "polygon"
      })
    ).toEqual(["suppress-ping"]);
  });

  it("returns polygon commit actions in the existing handler order", () => {
    expect(
      getSceneDoubleClickActions({
        canvasTool: null,
        drawingTool: "polygon",
        environmentEffectTool: "polygon",
        hasDrawingPolygonDraft: true,
        hasEnvironmentPolygonDraft: true,
        hasFogPolygonDraft: true,
        hasScene: true,
        hasWeatherPolygonDraft: true,
        mode: "gm",
        weatherMaskTool: "polygon"
      })
    ).toEqual(["commit-fog-polygon", "commit-drawing-polygon", "commit-weather-polygon", "commit-environment-polygon"]);
  });

  it("ignores inactive tools and missing drafts", () => {
    expect(
      getSceneDoubleClickActions({
        canvasTool: null,
        drawingTool: "line",
        environmentEffectTool: "rectangle",
        hasDrawingPolygonDraft: true,
        hasEnvironmentPolygonDraft: true,
        hasFogPolygonDraft: false,
        hasScene: true,
        hasWeatherPolygonDraft: true,
        mode: "gm",
        weatherMaskTool: "rectangle"
      })
    ).toEqual([]);
  });
});
