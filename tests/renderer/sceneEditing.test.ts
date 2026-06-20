import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import {
  duplicateSceneDrawing,
  duplicateSceneToken,
  getFitGridPatch,
  moveLayerOrder,
  moveSceneLayer,
  patchSceneFog,
  patchSceneDrawing,
  patchSceneGrid,
  patchSceneMapTransform,
  patchSceneToken,
  patchSceneVideoPlayback,
  removeEnvironmentEffect,
  removeSceneDrawing,
  removeSceneToken,
  setDrawingPlayerVisibility,
  setDrawingTemplateFootprintVisibility,
  setFogShapePlayerVisibility,
  setWeatherMaskVisibility,
  setSceneLayerOrderLocked,
  updateSceneDrawingPoints,
  updateSceneTokenPositions
} from "../../src/renderer/lib/sceneEditing";

describe("scene editing helpers", () => {
  it("patches nested scene settings without dropping existing values", () => {
    const scene = createDefaultScene("Edit");

    expect(patchSceneGrid(scene, { sizePx: 80 }).grid).toMatchObject({ ...scene.grid, sizePx: 80 });
    expect(patchSceneFog(scene, { brushSize: 140 }).fog).toMatchObject({ ...scene.fog, brushSize: 140 });
    expect(patchSceneMapTransform(scene, { scale: 1.5 }).mapTransform).toMatchObject({ ...scene.mapTransform, scale: 1.5 });
    expect(patchSceneVideoPlayback(scene, { paused: true }).videoPlayback).toMatchObject({ ...scene.videoPlayback, paused: true });
    expect(setSceneLayerOrderLocked(scene, false).layerOrderLocked).toBe(false);
  });

  it("moves layers in visual order and reassigns stable order values", () => {
    const scene = createDefaultScene("Layers");
    const moved = moveSceneLayer(scene, "token", "up");
    const visualOrder = [...moved.layers].sort((a, b) => b.order - a.order).map((layer) => layer.id);

    expect(visualOrder.slice(0, 7)).toEqual(["gm", "fog", "effects", "drawing", "token", "foreground", "object"]);
    expect([...moved.layers].sort((a, b) => b.order - a.order).map((layer) => layer.order)).toEqual([100, 90, 80, 70, 60, 50, 40, 30, 20, 10]);
  });

  it("leaves layer order unchanged when move target is invalid", () => {
    const scene = createDefaultScene("Layers");

    expect(moveLayerOrder(scene.layers, "missing", "up")).toEqual(scene.layers);
    expect(moveLayerOrder(scene.layers, "gm", "up")).toEqual(scene.layers);
  });

  it("calculates grid fit patches from map dimensions and scene grid counts", () => {
    const scene = createDefaultScene("Fit");
    scene.grid = { ...scene.grid, mapGridColumns: 20, mapGridRows: 10 };

    expect(getFitGridPatch(scene, { width: 1000, height: 600 })).toEqual({
      sizePx: 55,
      offsetX: 0,
      offsetY: 0
    });
  });

  it("preserves manual map transform offsets when fitting the grid", () => {
    const scene = createDefaultScene("Manual Fit");
    scene.grid = { ...scene.grid, mapGridColumns: 10, mapGridRows: 10 };
    scene.mapTransform = { ...scene.mapTransform, fitMode: "manual", x: 42, y: 18 };

    expect(getFitGridPatch(scene, { width: 1000, height: 500 })).toEqual({
      sizePx: 75,
      offsetX: 42,
      offsetY: 18
    });
  });

  it("sets fog shape Player View visibility while preserving GM-visible shapes", () => {
    const scene = createDefaultScene("Fog");
    scene.fog.shapes = [
      {
        id: "fog-1",
        kind: "rectangle",
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        visible: true,
        visibleInGm: true,
        visibleInPlayer: true
      }
    ];

    const next = setFogShapePlayerVisibility(scene, "fog-1", false, "updated");

    expect(next.fog.shapes[0]).toMatchObject({
      id: "fog-1",
      visible: true,
      visibleInPlayer: false
    });
    expect(next.updatedAt).toBe("updated");
  });

  it("sets fog shape visibility false when hidden everywhere", () => {
    const scene = createDefaultScene("Fog");
    scene.fog.shapes = [
      {
        id: "fog-1",
        kind: "rectangle",
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        visible: false,
        visibleInGm: false,
        visibleInPlayer: true
      }
    ];

    const next = setFogShapePlayerVisibility(scene, "fog-1", false, "updated");

    expect(next.fog.shapes[0]).toMatchObject({
      visible: false,
      visibleInPlayer: false
    });
  });

  it("sets weather mask visibility", () => {
    const scene = createDefaultScene("Weather");
    scene.weather.masks = [
      {
        id: "weather-1",
        kind: "circle",
        points: [{ x: 20, y: 20 }],
        radius: 10,
        visible: true
      }
    ];

    const next = setWeatherMaskVisibility(scene, "weather-1", false, "updated");

    expect(next.weather.masks[0]).toMatchObject({
      id: "weather-1",
      visible: false
    });
    expect(next.updatedAt).toBe("updated");
  });

  it("patches a single token without changing other tokens", () => {
    const scene = createDefaultScene("Tokens");
    scene.tokens = [
      { id: "token-1", name: "One", assetId: "asset-1", position: { x: 0, y: 0 }, size: { width: 50, height: 50 }, order: 0, visibleInPlayer: true },
      { id: "token-2", name: "Two", assetId: "asset-2", position: { x: 10, y: 10 }, size: { width: 50, height: 50 }, order: 1, visibleInPlayer: true }
    ];

    const next = patchSceneToken(scene, "token-1", { name: "Changed" }, "updated");

    expect(next.tokens[0]).toMatchObject({ id: "token-1", name: "Changed" });
    expect(next.tokens[1]).toMatchObject({ id: "token-2", name: "Two" });
    expect(next.updatedAt).toBe("updated");
  });

  it("updates token positions from start positions and a delta", () => {
    const scene = createDefaultScene("Tokens");
    scene.tokens = [
      { id: "token-1", name: "One", assetId: "asset-1", position: { x: 0, y: 0 }, size: { width: 50, height: 50 }, order: 0, visibleInPlayer: true },
      { id: "token-2", name: "Two", assetId: "asset-2", position: { x: 10, y: 10 }, size: { width: 50, height: 50 }, order: 1, visibleInPlayer: true },
      { id: "token-3", name: "Three", assetId: "asset-3", position: { x: 20, y: 20 }, size: { width: 50, height: 50 }, order: 2, visibleInPlayer: true }
    ];

    const next = updateSceneTokenPositions(
      scene,
      new Map([
        ["token-1", { x: 0, y: 0 }],
        ["token-2", { x: 10, y: 10 }]
      ]),
      { x: 5, y: -3 },
      "updated"
    );

    expect(next.tokens.map((token) => token.position)).toEqual([{ x: 5, y: -3 }, { x: 15, y: 7 }, { x: 20, y: 20 }]);
    expect(next.updatedAt).toBe("updated");
  });

  it("duplicates a token and returns the new token id", () => {
    const scene = createDefaultScene("Tokens");
    scene.tokens = [
      { id: "token-1", name: "Goblin", assetId: "asset-1", position: { x: 0, y: 0 }, size: { width: 50, height: 50 }, order: 0, visibleInPlayer: true }
    ];

    const result = duplicateSceneToken(scene, "token-1", "token-2", "updated");

    expect(result.duplicatedTokenId).toBe("token-2");
    expect(result.scene.tokens).toHaveLength(2);
    expect(result.scene.tokens[1]).toMatchObject({ id: "token-2", name: "Goblin Copy", order: 1 });
    expect(result.scene.updatedAt).toBe("updated");
  });

  it("returns the original scene when duplicating a missing token", () => {
    const scene = createDefaultScene("Tokens");

    expect(duplicateSceneToken(scene, "missing", "token-2")).toEqual({ scene });
  });

  it("removes a token", () => {
    const scene = createDefaultScene("Tokens");
    scene.tokens = [
      { id: "token-1", name: "One", assetId: "asset-1", position: { x: 0, y: 0 }, size: { width: 50, height: 50 }, order: 0, visibleInPlayer: true },
      { id: "token-2", name: "Two", assetId: "asset-2", position: { x: 10, y: 10 }, size: { width: 50, height: 50 }, order: 1, visibleInPlayer: true }
    ];

    const next = removeSceneToken(scene, "token-1", "updated");

    expect(next.tokens.map((token) => token.id)).toEqual(["token-2"]);
    expect(next.updatedAt).toBe("updated");
  });

  it("patches a single drawing without changing other drawings", () => {
    const scene = createDefaultScene("Drawings");
    scene.drawings = [
      { id: "drawing-1", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true },
      { id: "drawing-2", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true }
    ];

    const next = patchSceneDrawing(scene, "drawing-1", { opacity: 0.5 }, "updated");

    expect(next.drawings[0]).toMatchObject({ id: "drawing-1", opacity: 0.5 });
    expect(next.drawings[1]).toMatchObject({ id: "drawing-2", opacity: 1 });
    expect(next.updatedAt).toBe("updated");
  });

  it("updates drawing points from a drawing id map", () => {
    const scene = createDefaultScene("Drawings");
    scene.drawings = [
      { id: "drawing-1", kind: "line", points: [{ x: 0, y: 0 }], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true },
      { id: "drawing-2", kind: "line", points: [{ x: 5, y: 5 }], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true }
    ];

    const next = updateSceneDrawingPoints(
      scene,
      new Map([
        ["drawing-1", [{ x: 10, y: 20 }]],
        ["missing", [{ x: 100, y: 200 }]]
      ]),
      "updated"
    );

    expect(next.drawings[0].points).toEqual([{ x: 10, y: 20 }]);
    expect(next.drawings[1].points).toEqual([{ x: 5, y: 5 }]);
    expect(next.updatedAt).toBe("updated");
  });

  it("sets drawing Player View visibility", () => {
    const scene = createDefaultScene("Drawings");
    scene.drawings = [{ id: "drawing-1", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true }];

    const next = setDrawingPlayerVisibility(scene, "drawing-1", false, "updated");

    expect(next.drawings[0]).toMatchObject({ visibleInPlayer: false });
    expect(next.updatedAt).toBe("updated");
  });

  it("sets template footprint visibility", () => {
    const scene = createDefaultScene("Drawings");
    scene.drawings = [
      {
        id: "drawing-1",
        kind: "line",
        points: [],
        color: "#fff",
        opacity: 1,
        strokeWidth: 8,
        visibleInPlayer: true,
        templateFootprintVisible: true
      }
    ];

    const next = setDrawingTemplateFootprintVisibility(scene, "drawing-1", false, "updated");

    expect(next.drawings[0]).toMatchObject({ templateFootprintVisible: false });
    expect(next.updatedAt).toBe("updated");
  });

  it("duplicates a drawing and returns the new drawing id", () => {
    const scene = createDefaultScene("Drawings");
    scene.drawings = [
      {
        id: "drawing-1",
        name: "Template Line",
        kind: "line",
        points: [{ x: 10, y: 20 }, { x: 30, y: 40 }],
        color: "#fff",
        opacity: 1,
        strokeWidth: 8,
        visibleInPlayer: true
      }
    ];

    const result = duplicateSceneDrawing(scene, "drawing-1", "drawing-2", "Template Line", "updated");

    expect(result.duplicatedDrawingId).toBe("drawing-2");
    expect(result.scene.drawings).toHaveLength(2);
    expect(result.scene.drawings[1]).toMatchObject({
      id: "drawing-2",
      name: "Template Line Copy"
    });
    expect(result.scene.drawings[1].points).toEqual([{ x: 34, y: 44 }, { x: 54, y: 64 }]);
    expect(result.scene.updatedAt).toBe("updated");
  });

  it("returns the original scene when duplicating a missing drawing", () => {
    const scene = createDefaultScene("Drawings");

    expect(duplicateSceneDrawing(scene, "missing", "drawing-2")).toEqual({ scene });
  });

  it("removes a drawing", () => {
    const scene = createDefaultScene("Drawings");
    scene.drawings = [
      { id: "drawing-1", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true },
      { id: "drawing-2", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true }
    ];

    const next = removeSceneDrawing(scene, "drawing-1", "updated");

    expect(next.drawings.map((drawing) => drawing.id)).toEqual(["drawing-2"]);
    expect(next.updatedAt).toBe("updated");
  });

  it("removes an environment effect", () => {
    const scene = createDefaultScene("Effects");
    scene.environment.effects = [
      { id: "effect-1", kind: "rectangle", effect: "water", points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] },
      { id: "effect-2", kind: "circle", effect: "fire", points: [{ x: 20, y: 20 }], radius: 10 }
    ];

    const next = removeEnvironmentEffect(scene, "effect-1", "updated");

    expect(next.environment.effects.map((effect) => effect.id)).toEqual(["effect-2"]);
    expect(next.updatedAt).toBe("updated");
  });
});
