import { describe, expect, it, vi } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import { closeCanvasImageSource, getLargeMapCacheScale, getMapDrawSource, getReadyMapSourceForFit, type LoadedMap } from "../../src/renderer/canvas/mapSource";

function imageSource(id: string): HTMLImageElement {
  return { id } as unknown as HTMLImageElement;
}

function canvasSource(id: string): CanvasImageSource {
  return { id } as unknown as CanvasImageSource;
}

function loadedMap(overrides: Partial<LoadedMap> = {}): LoadedMap {
  return {
    assetId: "map-1",
    originalSource: imageSource("original"),
    optimizedSource: canvasSource("optimized"),
    sourceWidth: 1000,
    sourceHeight: 1000,
    optimizedScale: 0.5,
    animate: false,
    mediaType: "image",
    ready: true,
    ...overrides
  };
}

describe("map source helpers", () => {
  it("keeps small maps at full scale and downscales by edge or pixel limits", () => {
    expect(getLargeMapCacheScale(1000, 1000)).toBe(1);
    expect(getLargeMapCacheScale(8192, 2000)).toBe(0.5);
    expect(getLargeMapCacheScale(8000, 8000)).toBe(0.5);
  });

  it("closes closeable canvas image sources only", () => {
    const close = vi.fn();
    closeCanvasImageSource({ close } as unknown as CanvasImageSource);
    closeCanvasImageSource(null);
    closeCanvasImageSource({} as CanvasImageSource);

    expect(close).toHaveBeenCalledOnce();
  });

  it("uses original source for player view, animated maps, and maps without an optimized source", () => {
    const scene = createDefaultScene("Map");
    const map = loadedMap();

    expect(getMapDrawSource(map, scene, 1000, 1000, 1, "player")).toBe(map.originalSource);
    expect(getMapDrawSource({ ...map, animate: true }, scene, 1000, 1000, 1, "gm")).toBe(map.originalSource);
    expect(getMapDrawSource({ ...map, optimizedSource: null }, scene, 1000, 1000, 1, "gm")).toBe(map.originalSource);
  });

  it("uses optimized source for zoomed-out GM maps and original source near full quality", () => {
    const scene = createDefaultScene("Map");
    scene.mapTransform = { ...scene.mapTransform, fitMode: "manual", scale: 1 };
    const map = loadedMap({ optimizedScale: 0.5 });

    expect(getMapDrawSource(map, scene, 1000, 1000, 0.4, "gm")).toBe(map.optimizedSource);
    expect(getMapDrawSource(map, scene, 1000, 1000, 0.57, "gm")).toBe(map.originalSource);
  });

  it("returns ready image map source only when the requested asset matches", () => {
    const map = loadedMap();

    expect(getReadyMapSourceForFit(map, "map-1", null, false)).toEqual({
      source: map.originalSource,
      width: 1000,
      height: 1000
    });
    expect(getReadyMapSourceForFit({ ...map, ready: false }, "map-1", null, false)).toBeNull();
    expect(getReadyMapSourceForFit(map, "other-map", null, false)).toBeNull();
  });

  it("returns ready video source only after metadata is available", () => {
    const video = {
      dataset: { mapAssetId: "video-1" },
      readyState: 1,
      videoWidth: 1920,
      videoHeight: 1080
    } as HTMLVideoElement;

    expect(getReadyMapSourceForFit(null, "video-1", video, true)).toEqual({
      source: video,
      width: 1920,
      height: 1080
    });
    expect(getReadyMapSourceForFit(null, "other-video", video, true)).toBeNull();
    expect(getReadyMapSourceForFit(null, "video-1", { ...video, readyState: 0 } as HTMLVideoElement, true)).toBeNull();
  });
});
