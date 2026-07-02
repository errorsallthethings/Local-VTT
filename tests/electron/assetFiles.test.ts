import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildAssetThumbnailRelativePath, getAssetFileRemovalPaths, getKnownAssetPaths, hydrateCampaignAssetPaths } from "../../electron/assetFiles";
import { createDefaultCampaign } from "../../src/shared/localvtt";
import type { Asset } from "../../src/shared/localvtt";

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

  it("hydrates campaign asset paths from portable paths", () => {
    const campaign = createDefaultCampaign("Test Campaign");
    campaign.assets = [
      asset({ id: "map-1", relativePath: "assets/maps/map.png", thumbnailRelativePath: "assets/thumbnails/map.jpg" }),
      asset({ id: "token-1", kind: "token", relativePath: "assets/tokens/hero.png" })
    ];

    expect(hydrateCampaignAssetPaths("campaign-root", campaign).assets).toMatchObject([
      {
        id: "map-1",
        absolutePath: path.resolve("campaign-root", "assets/maps/map.png"),
        thumbnailAbsolutePath: path.resolve("campaign-root", "assets/thumbnails/map.jpg")
      },
      {
        id: "token-1",
        absolutePath: path.resolve("campaign-root", "assets/tokens/hero.png"),
        thumbnailAbsolutePath: undefined
      }
    ]);
  });

  it("returns deduped known asset paths from hydrated assets", () => {
    const sharedPath = path.resolve("campaign-root", "assets/maps/map.png");
    const campaign = createDefaultCampaign("Test Campaign");
    campaign.assets = [
      asset({ id: "map-1", absolutePath: sharedPath, thumbnailAbsolutePath: path.resolve("campaign-root", "assets/thumbnails/map.jpg") }),
      asset({ id: "map-2", absolutePath: sharedPath })
    ];

    expect(getKnownAssetPaths(campaign)).toEqual([sharedPath, path.resolve("campaign-root", "assets/thumbnails/map.jpg")]);
  });
});

function asset(patch: Partial<Asset>): Asset {
  return {
    id: "asset-1",
    name: "Asset",
    kind: "map",
    mediaType: "image",
    relativePath: "assets/maps/map.png",
    originalFileName: "map.png",
    createdAt: "2026-07-02T00:00:00.000Z",
    ...patch
  };
}
