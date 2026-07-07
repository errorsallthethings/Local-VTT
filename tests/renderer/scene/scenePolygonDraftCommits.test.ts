import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../../src/shared/localvtt";
import {
  getDrawingPolygonDraftCommit,
  getDrawingPolygonDraftCommitAction,
  getEnvironmentPolygonDraftCommit,
  getEnvironmentPolygonDraftCommitAction,
  getFogPolygonDraftCommit,
  getFogPolygonDraftCommitAction,
  getWeatherPolygonDraftCommit,
  getWeatherPolygonDraftCommitAction
} from "../../../src/renderer/canvas/scene";

const polygonPoints = [
  { x: 0, y: 0 },
  { x: 80, y: 0 },
  { x: 40, y: 60 }
];

describe("scene polygon draft commits", () => {
  it("returns null for drafts that are not meaningful polygons", () => {
    const scene = createDefaultScene("Drafts");
    const draft = { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };

    expect(getDrawingPolygonDraftCommit(scene, draft, "drawing-1", drawingStyle())).toBeNull();
    expect(getWeatherPolygonDraftCommit(scene, draft, "weather-1")).toBeNull();
    expect(getFogPolygonDraftCommit(scene, { ...draft, operation: "hide" }, "fog-1")).toBeNull();
    expect(getEnvironmentPolygonDraftCommit(scene, draft, "effect-1", "fire", 0.25)).toBeNull();
  });

  it("maps drafts that are not meaningful polygons to no-op actions", () => {
    const scene = createDefaultScene("Draft Noop Actions");
    const draft = { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };

    expect(getDrawingPolygonDraftCommitAction(scene, draft, "drawing-1", drawingStyle())).toEqual({ kind: "none" });
    expect(getWeatherPolygonDraftCommitAction(scene, draft, "weather-1")).toEqual({ kind: "none" });
    expect(getFogPolygonDraftCommitAction(scene, { ...draft, operation: "hide" }, "fog-1")).toEqual({ kind: "none" });
    expect(getEnvironmentPolygonDraftCommitAction(scene, draft, "effect-1", "fire", 0.25)).toEqual({ kind: "none" });
  });

  it("builds fog polygon commits with default names and visibility patches", () => {
    const scene = createDefaultScene("Drafts");
    scene.fog.newShapesVisibleInPlayer = false;
    scene.fog.shapes = [
      {
        id: "existing-fog",
        operation: "hide",
        kind: "rectangle",
        points: []
      }
    ];

    const commit = getFogPolygonDraftCommit(scene, { operation: "reveal", points: polygonPoints }, "fog-2");

    expect(commit).toEqual({
      shape: {
        id: "fog-2",
        name: "Reveal Polygon 2",
        operation: "reveal",
        kind: "polygon",
        points: polygonPoints,
        visibleInGm: true,
        visibleInPlayer: false,
        visible: true
      },
      fogPatch: {}
    });

    const hiddenFogScene = createDefaultScene("Hidden Fog");
    hiddenFogScene.fog.gmOpacity = 0;
    hiddenFogScene.fog.playerOpacity = 0;
    expect(getFogPolygonDraftCommit(hiddenFogScene, { operation: "hide", points: polygonPoints }, "fog-1")?.fogPatch).toEqual({
      gmOpacity: 0.5,
      playerOpacity: 1,
      opacity: 1
    });
  });

  it("builds drawing polygon commits from scene count and style", () => {
    const scene = createDefaultScene("Drafts");
    scene.drawings = [
      {
        id: "existing-drawing",
        kind: "rectangle",
        points: [],
        color: "#ffffff",
        opacity: 1,
        strokeWidth: 2,
        visibleInPlayer: true
      }
    ];

    expect(getDrawingPolygonDraftCommit(scene, { points: polygonPoints }, "drawing-2", drawingStyle())).toMatchObject({
      id: "drawing-2",
      name: "Polygon 2",
      kind: "polygon",
      points: polygonPoints,
      color: "#112233",
      opacity: 0.8,
      fillColor: "#445566",
      fillOpacity: 0.25,
      strokeStyle: "dashed",
      strokeWidth: 6,
      visibleInGm: true,
      visibleInPlayer: true
    });
  });

  it("builds weather and environment polygon commits with default names", () => {
    const scene = createDefaultScene("Drafts");
    scene.weather.masks = [{ id: "existing-weather", kind: "rectangle", points: [] }];
    scene.environment.effects = [{ id: "existing-effect", kind: "rectangle", effect: "water", points: [] }];

    expect(getWeatherPolygonDraftCommit(scene, { points: polygonPoints }, "weather-2")).toEqual({
      id: "weather-2",
      name: "Weather Effect Mask 2",
      kind: "polygon",
      points: polygonPoints,
      visible: true
    });

    expect(getEnvironmentPolygonDraftCommit(scene, { points: polygonPoints }, "effect-2", "fire", 0.4)).toMatchObject({
      id: "effect-2",
      name: "Fire Effect 2",
      kind: "polygon",
      effect: "fire",
      feather: 0.4,
      points: polygonPoints,
      visibleInGm: true,
      visibleInPlayer: true
    });
  });

  it("maps meaningful polygon drafts to creation commit actions", () => {
    const scene = createDefaultScene("Draft Commit Actions");
    scene.fog.newShapesVisibleInPlayer = false;

    expect(getDrawingPolygonDraftCommitAction(scene, { points: polygonPoints }, "drawing-1", drawingStyle())).toMatchObject({
      kind: "commit-drawing",
      drawing: {
        id: "drawing-1",
        kind: "polygon",
        points: polygonPoints
      }
    });
    expect(getWeatherPolygonDraftCommitAction(scene, { points: polygonPoints }, "weather-1")).toEqual({
      kind: "commit-weather-mask",
      mask: {
        id: "weather-1",
        name: "Weather Effect Mask 1",
        kind: "polygon",
        points: polygonPoints,
        visible: true
      }
    });
    expect(getFogPolygonDraftCommitAction(scene, { operation: "hide", points: polygonPoints }, "fog-1")).toEqual({
      kind: "commit-fog",
      shape: {
        id: "fog-1",
        name: "Hide Polygon 1",
        operation: "hide",
        kind: "polygon",
        points: polygonPoints,
        visibleInGm: true,
        visibleInPlayer: false,
        visible: true
      },
      fogPatch: {
        gmOpacity: 0.5,
        playerOpacity: 1,
        opacity: 1
      }
    });
    expect(getEnvironmentPolygonDraftCommitAction(scene, { points: polygonPoints }, "effect-1", "fire", 0.4)).toMatchObject({
      kind: "commit-environment-effect",
      effect: {
        id: "effect-1",
        kind: "polygon",
        effect: "fire",
        feather: 0.4,
        points: polygonPoints
      }
    });
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
