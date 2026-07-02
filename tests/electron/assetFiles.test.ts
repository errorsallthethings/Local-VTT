import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildAssetThumbnailRelativePath, getAssetFileRemovalPaths } from "../../electron/assetFiles";

describe("asset file helpers", () => {
  it("resolves portable asset paths relative to the campaign folder", () => {
    expect(
      getAssetFileRemovalPaths("campaign-root", {
        relativePath: "assets/maps/dungeon.png",
        thumbnailRelativePath: "assets/thumbnails/dungeon.jpg"
      })
    ).toEqual([path.resolve("campaign-root", "assets/maps/dungeon.png"), path.resolve("campaign-root", "assets/thumbnails/dungeon.jpg")]);
  });

  it("prefers hydrated absolute paths when available", () => {
    expect(
      getAssetFileRemovalPaths("campaign-root", {
        relativePath: "assets/maps/dungeon.png",
        thumbnailRelativePath: "assets/thumbnails/dungeon.jpg",
        absolutePath: path.resolve("other-root", "map.png"),
        thumbnailAbsolutePath: path.resolve("other-root", "thumb.jpg")
      })
    ).toEqual([path.resolve("other-root", "map.png"), path.resolve("other-root", "thumb.jpg")]);
  });

  it("omits missing thumbnail paths", () => {
    expect(
      getAssetFileRemovalPaths("campaign-root", {
        relativePath: "assets/tokens/hero.png"
      })
    ).toEqual([path.resolve("campaign-root", "assets/tokens/hero.png")]);
  });

  it("deduplicates equivalent asset and thumbnail paths", () => {
    const assetPath = path.resolve("campaign-root", "assets/tokens/hero.png");
    expect(
      getAssetFileRemovalPaths("campaign-root", {
        relativePath: "assets/tokens/hero.png",
        thumbnailRelativePath: "assets/tokens/hero.png",
        absolutePath: assetPath
      })
    ).toEqual([assetPath]);
  });

  it("builds portable thumbnail paths", () => {
    expect(buildAssetThumbnailRelativePath("asset-1")).toBe("assets/thumbnails/asset-1.jpg");
  });

  it("builds variant thumbnail paths with safe variant characters only", () => {
    expect(buildAssetThumbnailRelativePath("asset-1", "crop-123:../bad value")).toBe("assets/thumbnails/asset-1-crop-123badvalue.jpg");
  });
});
