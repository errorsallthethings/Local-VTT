import { describe, expect, it } from "vitest";
import { createDefaultCampaign, type Asset } from "../../src/shared/localvtt";
import { tokenThumbnailVariant, updateTokenThumbnailInCampaign } from "../../electron/tokenThumbnailUpdate";

function tokenAsset(patch: Partial<Asset> = {}): Asset {
  return {
    id: "token-1",
    name: "Hero",
    kind: "token",
    mediaType: "image",
    relativePath: "assets/tokens/hero.png",
    originalFileName: "hero.png",
    createdAt: "2026-07-02T12:00:00.000Z",
    ...patch
  };
}

describe("token thumbnail updates", () => {
  it("builds stable crop thumbnail variants from timestamps", () => {
    expect(tokenThumbnailVariant(12345)).toBe("crop-12345");
  });

  it("updates only the selected token thumbnail and campaign timestamp", () => {
    const unchanged = tokenAsset({ id: "token-2", name: "Sidekick", thumbnailRelativePath: "assets/thumbnails/old-sidekick.jpg" });
    const campaign = {
      ...createDefaultCampaign("Thumbnail Test"),
      assets: [tokenAsset({ thumbnailRelativePath: "assets/thumbnails/old-hero.jpg" }), unchanged],
      updatedAt: "2026-07-02T12:00:00.000Z"
    };

    const updated = updateTokenThumbnailInCampaign(campaign, "token-1", "assets/thumbnails/token-1-crop-12345.jpg", "2026-07-02T12:05:00.000Z");

    expect(updated.assets[0]).toMatchObject({ id: "token-1", thumbnailRelativePath: "assets/thumbnails/token-1-crop-12345.jpg" });
    expect(updated.assets[1]).toBe(unchanged);
    expect(updated.updatedAt).toBe("2026-07-02T12:05:00.000Z");
    expect(campaign.assets[0].thumbnailRelativePath).toBe("assets/thumbnails/old-hero.jpg");
  });

  it("leaves assets unchanged when the asset id is not present", () => {
    const asset = tokenAsset();
    const campaign = { ...createDefaultCampaign("Thumbnail Test"), assets: [asset] };

    const updated = updateTokenThumbnailInCampaign(campaign, "missing", "assets/thumbnails/missing.jpg", "2026-07-02T12:05:00.000Z");

    expect(updated.assets).toEqual([asset]);
    expect(updated.updatedAt).toBe("2026-07-02T12:05:00.000Z");
  });
});
