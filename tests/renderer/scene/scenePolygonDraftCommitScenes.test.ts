import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../../src/shared/localvtt";
import {
  getSceneAfterDrawingPolygonDraftCommit,
  getSceneAfterEnvironmentPolygonDraftCommit,
  getSceneAfterFogPolygonDraftCommit,
  getSceneAfterWeatherPolygonDraftCommit
} from "../../../src/renderer/components/scene/state/scenePolygonDraftCommitScenes";

const polygonPoints = [
  { x: 0, y: 0 },
  { x: 80, y: 0 },
  { x: 40, y: 60 }
];

describe("scene polygon draft commit scene helpers", () => {
  it("returns null instead of changing the scene for incomplete polygon drafts", () => {
    const scene = createDefaultScene("Incomplete Drafts");
    const draft = { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };

    expect(getSceneAfterFogPolygonDraftCommit(scene, { ...draft, operation: "hide" }, "fog-1")).toBeNull();
    expect(getSceneAfterDrawingPolygonDraftCommit(scene, draft, "drawing-1", drawingStyle())).toBeNull();
    expect(getSceneAfterWeatherPolygonDraftCommit(scene, draft, "weather-1")).toBeNull();
    expect(getSceneAfterEnvironmentPolygonDraftCommit(scene, draft, "effect-1", "fire", 0.5)).toBeNull();
  });

  it("commits fog, drawing, weather, and environment polygon drafts into scene state", () => {
    const scene = createDefaultScene("Drafts");
    scene.fog.gmOpacity = 0;
    scene.fog.playerOpacity = 0;

    const fogScene = getSceneAfterFogPolygonDraftCommit(scene, { operation: "hide", points: polygonPoints }, "fog-1");
    expect(fogScene?.fog.shapes).toEqual([
      expect.objectContaining({ id: "fog-1", kind: "polygon", operation: "hide", points: polygonPoints })
    ]);
    expect(fogScene?.fog).toMatchObject({ gmOpacity: 0.5, playerOpacity: 1, opacity: 1 });

    const drawingScene = getSceneAfterDrawingPolygonDraftCommit(scene, { points: polygonPoints }, "drawing-1", drawingStyle());
    expect(drawingScene?.drawings).toEqual([
      expect.objectContaining({ id: "drawing-1", kind: "polygon", points: polygonPoints, strokeWidth: 6 })
    ]);

    const weatherScene = getSceneAfterWeatherPolygonDraftCommit(scene, { points: polygonPoints }, "weather-1");
    expect(weatherScene?.weather.masks).toEqual([
      expect.objectContaining({ id: "weather-1", kind: "polygon", points: polygonPoints })
    ]);

    const environmentScene = getSceneAfterEnvironmentPolygonDraftCommit(scene, { points: polygonPoints }, "effect-1", "fire", 0.5);
    expect(environmentScene?.environment.effects).toEqual([
      expect.objectContaining({ id: "effect-1", kind: "polygon", effect: "fire", feather: 0.5, points: polygonPoints })
    ]);
  });
});

function drawingStyle() {
  return {
    color: "#112233",
    opacity: 0.8,
    fillColor: "#445566",
    fillOpacity: 0.25,
    strokeStyle: "dashed" as const,
    strokeWidth: 6
  };
}
