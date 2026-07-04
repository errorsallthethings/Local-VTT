import { describe, expect, it } from "vitest";
import { getSceneCanvasRenderPlan } from "../../src/renderer/canvas/scene";
import { createDefaultScene, type Asset } from "../../src/shared/localvtt";
import type { LoadedMap } from "../../src/renderer/canvas/map";

describe("scene canvas render plan", () => {
  it("uses ready image maps for map drawing and weather sampling", () => {
    const scene = createDefaultScene("Render Plan");
    const source = {} as CanvasImageSource;
    const plan = getSceneCanvasRenderPlan({
      activeVideo: null,
      camera: { x: 10, y: 20, zoom: 2 },
      canShowGrid: true,
      canShowMap: true,
      height: 600,
      loadedMap: loadedMap(source),
      mapAsset: mapAsset(),
      mode: "gm",
      playerDisplayScale: 1,
      scene,
      width: 800
    });

    expect(plan.renderCamera).toEqual({ x: 10, y: 20, zoom: 2 });
    expect(plan.mapDrawSource).toBe(source);
    expect(plan.weatherMapSource).toBe(source);
    expect(plan.weatherMapReady).toBe(true);
    expect(plan.showGrid).toBe(true);
  });

  it("uses ready video maps for weather sampling while image map drawing stays empty", () => {
    const scene = createDefaultScene("Render Plan");
    const activeVideo = { readyState: 1 } as HTMLVideoElement;
    const plan = getSceneCanvasRenderPlan({
      activeVideo,
      camera: { x: 0, y: 0, zoom: 1 },
      canShowGrid: true,
      canShowMap: true,
      height: 600,
      loadedMap: null,
      mapAsset: mapAsset("video"),
      mode: "gm",
      playerDisplayScale: 1,
      scene,
      width: 800
    });

    expect(plan.mapDrawSource).toBeNull();
    expect(plan.weatherMapSource).toBe(activeVideo);
    expect(plan.weatherMapReady).toBe(true);
  });

  it("waits for video metadata before weather sampling", () => {
    const scene = createDefaultScene("Render Plan");
    const plan = getSceneCanvasRenderPlan({
      activeVideo: { readyState: 0 } as HTMLVideoElement,
      camera: { x: 0, y: 0, zoom: 1 },
      canShowGrid: true,
      canShowMap: true,
      height: 600,
      loadedMap: null,
      mapAsset: mapAsset("video"),
      mode: "gm",
      playerDisplayScale: 1,
      scene,
      width: 800
    });

    expect(plan.weatherMapSource).toBeNull();
    expect(plan.weatherMapReady).toBe(false);
  });

  it("respects view-specific grid visibility and player display scale", () => {
    const scene = createDefaultScene("Render Plan");
    scene.grid.showOnGm = true;
    scene.grid.showOnPlayer = false;

    const plan = getSceneCanvasRenderPlan({
      activeVideo: null,
      camera: { x: 10, y: 20, zoom: 2 },
      canShowGrid: true,
      canShowMap: false,
      height: 600,
      loadedMap: null,
      mapAsset: null,
      mode: "player",
      playerDisplayScale: 1.5,
      scene,
      width: 800
    });

    expect(plan.showGrid).toBe(false);
    expect(plan.renderCamera).toEqual({ x: 10, y: 20, zoom: 3 });
    expect(plan.weatherMapReady).toBe(true);
  });
});

function loadedMap(source: CanvasImageSource): LoadedMap {
  return {
    animate: false,
    assetId: "map",
    mediaType: "image",
    optimizedScale: 1,
    optimizedSource: null,
    originalSource: source as HTMLImageElement,
    ready: true,
    sourceHeight: 600,
    sourceWidth: 800
  };
}

function mapAsset(mediaType: Asset["mediaType"] = "image"): Asset {
  return {
    createdAt: "2026-07-04T00:00:00.000Z",
    id: "map",
    kind: "map",
    mediaType,
    name: "Map",
    originalFileName: mediaType === "video" ? "map.mp4" : "map.png",
    relativePath: mediaType === "video" ? "assets/maps/map.mp4" : "assets/maps/map.png"
  };
}
