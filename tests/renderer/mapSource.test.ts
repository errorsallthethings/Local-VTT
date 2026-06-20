import { describe, expect, it, vi } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import { closeCanvasImageSource, getLargeMapCacheScale, getMapDrawSource, getReadyMapSourceForFit, prepareLoadedImageMap, type LoadedMap } from "../../src/renderer/canvas/mapSource";

function imageSource(id: string): HTMLImageElement {
  return { id } as unknown as HTMLImageElement;
}

function loadedImage(overrides: Partial<HTMLImageElement> = {}): HTMLImageElement {
  return {
    naturalWidth: 1000,
    naturalHeight: 1000,
    width: 1000,
    height: 1000,
    ...overrides
  } as HTMLImageElement;
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

  it("skips prepared optimized image maps for GIFs, invalid dimensions, unavailable bitmap support, and small maps", async () => {
    const createImageBitmapSpy = vi.fn();
    vi.stubGlobal("createImageBitmap", createImageBitmapSpy);

    await expect(prepareLoadedImageMap(loadedImage(), "C:/maps/animated.GIF")).resolves.toEqual({ optimizedSource: null, optimizedScale: 1 });
    await expect(prepareLoadedImageMap(loadedImage({ naturalWidth: 0, width: 0 }), "C:/maps/map.png")).resolves.toEqual({ optimizedSource: null, optimizedScale: 1 });

    vi.stubGlobal("createImageBitmap", undefined);
    await expect(prepareLoadedImageMap(loadedImage(), "C:/maps/map.png")).resolves.toEqual({ optimizedSource: null, optimizedScale: 1 });

    vi.stubGlobal("createImageBitmap", createImageBitmapSpy);
    await expect(prepareLoadedImageMap(loadedImage(), "C:/maps/map.png")).resolves.toEqual({ optimizedSource: null, optimizedScale: 1 });
    expect(createImageBitmapSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("prepares an optimized bitmap for large image maps", async () => {
    const optimizedSource = canvasSource("optimized");
    const createImageBitmapSpy = vi.fn().mockResolvedValue(optimizedSource);
    vi.stubGlobal("createImageBitmap", createImageBitmapSpy);

    await expect(prepareLoadedImageMap(loadedImage({ naturalWidth: 8192, naturalHeight: 2000, width: 8192, height: 2000 }), "C:/maps/large.png")).resolves.toEqual({
      optimizedSource,
      optimizedScale: 0.5
    });
    expect(createImageBitmapSpy).toHaveBeenCalledWith(expect.any(Object), {
      resizeWidth: 4096,
      resizeHeight: 1000,
      resizeQuality: "high"
    });

    vi.unstubAllGlobals();
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
