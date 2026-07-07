import { describe, expect, it, vi } from "vitest";
import { createThumbnailServices } from "../../electron/thumbnailServices";

describe("thumbnail services", () => {
  it("writes image map thumbnails", async () => {
    const services = createThumbnailServices({
      createImageMapThumbnail: vi.fn(() => Buffer.from("map-image")),
      createSquareImageThumbnail: vi.fn(),
      createVideoMapThumbnailWithFallback: vi.fn(),
      writeAssetThumbnail: vi.fn(async (_campaignPath, assetId) => `assets/thumbnails/${assetId}.jpg`)
    });

    await expect(services.createMapThumbnail("campaign", "maps/cave.png", "map-1")).resolves.toEqual({
      thumbnailRelativePath: "assets/thumbnails/map-1.jpg"
    });
  });

  it("uses the video fallback path for video map thumbnails", async () => {
    const createVideoMapThumbnailWithFallback = vi.fn(async () => ({ thumbnail: Buffer.from("video-frame") }));
    const writeAssetThumbnail = vi.fn(async (_campaignPath, assetId) => `assets/thumbnails/${assetId}.jpg`);
    const rendererWebContents = { id: 7 } as never;
    const services = createThumbnailServices({
      createImageMapThumbnail: vi.fn(),
      createSquareImageThumbnail: vi.fn(),
      createVideoMapThumbnailWithFallback,
      writeAssetThumbnail
    });

    const result = await services.createMapThumbnail("campaign", "maps/animated.webm", "map-video", rendererWebContents);

    expect(result).toEqual({ thumbnailRelativePath: "assets/thumbnails/map-video.jpg" });
    expect(createVideoMapThumbnailWithFallback).toHaveBeenCalledWith("maps/animated.webm", "map-video", rendererWebContents);
    expect(writeAssetThumbnail).toHaveBeenCalledWith("campaign", "map-video", Buffer.from("video-frame"));
  });

  it("returns decode failures without writing thumbnails", async () => {
    const writeAssetThumbnail = vi.fn();
    const services = createThumbnailServices({
      createImageMapThumbnail: vi.fn(() => null),
      createSquareImageThumbnail: vi.fn(async () => null),
      createVideoMapThumbnailWithFallback: vi.fn(async () => ({ thumbnail: null, failureReason: "video failed" })),
      writeAssetThumbnail
    });

    await expect(services.createMapThumbnail("campaign", "maps/broken.png", "map-broken")).resolves.toEqual({
      failureReason: "Image file could not be decoded by Electron."
    });
    await expect(services.createMapThumbnail("campaign", "maps/broken.mp4", "video-broken")).resolves.toEqual({
      failureReason: "video failed"
    });
    await expect(services.createTokenThumbnail("campaign", "tokens/broken.png", "token-broken")).resolves.toEqual({
      failureReason: "Image file could not be decoded by Electron."
    });
    expect(writeAssetThumbnail).not.toHaveBeenCalled();
  });

  it("writes token thumbnails from square image thumbnails", async () => {
    const services = createThumbnailServices({
      createImageMapThumbnail: vi.fn(),
      createSquareImageThumbnail: vi.fn(async () => Buffer.from("token-image")),
      createVideoMapThumbnailWithFallback: vi.fn(),
      writeAssetThumbnail: vi.fn(async (_campaignPath, assetId) => `assets/thumbnails/${assetId}.jpg`)
    });

    await expect(services.createTokenThumbnail("campaign", "tokens/hero.webp", "token-1")).resolves.toEqual({
      thumbnailRelativePath: "assets/thumbnails/token-1.jpg"
    });
  });
});
