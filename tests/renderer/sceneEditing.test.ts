import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import {
  getFitGridPatch,
  moveLayerOrder,
  moveSceneLayer,
  patchSceneFog,
  patchSceneGrid,
  patchSceneMapTransform,
  patchSceneVideoPlayback,
  setFogShapePlayerVisibility,
  setWeatherMaskVisibility,
  setSceneLayerOrderLocked
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
});
