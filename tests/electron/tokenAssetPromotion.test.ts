import { describe, expect, it } from "vitest";
import path from "node:path";
import { promoteTokenAssetThumbnails, shouldPromoteTokenAsset } from "../../electron/tokenAssetPromotion";
import { createDefaultCampaign, type Asset } from "../../src/shared/localvtt";

describe("token asset promotion", () => {
  it("promotes only old-style token assets with separate thumbnails", async () => {
    const oldToken = asset({
      id: "old-token",
      kind: "token",
      relativePath: "assets/tokens/original.png",
      thumbnailRelativePath: "assets/thumbnails/old-token-crop-123.jpg"
    });
    const canonicalToken = asset({
      id: "canonical-token",
      kind: "token",
      relativePath: "assets/tokens/canonical-token.jpg",
      thumbnailRelativePath: "assets/tokens/canonical-token.jpg"
    });
    const mapAsset = asset({
      id: "map-1",
      kind: "map",
      relativePath: "assets/maps/map.png",
      thumbnailRelativePath: "assets/thumbnails/map-1.jpg"
    });
    const copied: Array<{ source: string; destination: string }> = [];

    const plan = await promoteTokenAssetThumbnails(
      "campaign-root",
      { ...createDefaultCampaign("Promote"), assets: [oldToken, canonicalToken, mapAsset], updatedAt: "2026-07-02T00:00:00.000Z" },
      async (source, destination) => {
        copied.push({ source, destination });
      }
    );

    expect(plan.promoted).toBe(1);
    expect(plan.skipped).toBe(2);
    expect(plan.failed).toEqual([]);
    expect(plan.campaign.assets[0]).toMatchObject({
      id: "old-token",
      relativePath: "assets/tokens/old-token.jpg",
      thumbnailRelativePath: "assets/tokens/old-token.jpg"
    });
    expect(plan.campaign.assets[1]).toBe(canonicalToken);
    expect(plan.campaign.assets[2]).toBe(mapAsset);
    expect(plan.campaign.updatedAt).not.toBe("2026-07-02T00:00:00.000Z");
    expect(copied).toEqual([
      {
        source: expect.stringContaining(path.join("assets", "thumbnails", "old-token-crop-123.jpg")),
        destination: expect.stringContaining(path.join("assets", "tokens", "old-token.jpg"))
      }
    ]);
    expect(plan.replacedPaths.get("old-token")).toEqual(["assets/tokens/original.png", "assets/thumbnails/old-token-crop-123.jpg"]);
  });

  it("records copy failures and leaves the asset unchanged", async () => {
    const oldToken = asset({
      id: "old-token",
      kind: "token",
      relativePath: "assets/tokens/original.png",
      thumbnailRelativePath: "assets/thumbnails/old-token.jpg"
    });
    const campaign = { ...createDefaultCampaign("Promote"), assets: [oldToken] };

    const plan = await promoteTokenAssetThumbnails("campaign-root", campaign, async () => {
      throw new Error("copy failed");
    });

    expect(plan.promoted).toBe(0);
    expect(plan.skipped).toBe(0);
    expect(plan.campaign).toEqual(campaign);
    expect(plan.failed).toMatchObject([{ assetId: "old-token", reason: "copy failed" }]);
  });

  it("classifies promotable token assets", () => {
    expect(shouldPromoteTokenAsset(asset({ id: "old", kind: "token", relativePath: "assets/tokens/original.png", thumbnailRelativePath: "assets/thumbnails/old.jpg" }))).toBe(true);
    expect(shouldPromoteTokenAsset(asset({ id: "canonical", kind: "token", relativePath: "assets/tokens/canonical.jpg", thumbnailRelativePath: "assets/tokens/canonical.jpg" }))).toBe(false);
    expect(shouldPromoteTokenAsset(asset({ id: "missing-thumb", kind: "token", relativePath: "assets/tokens/original.png" }))).toBe(false);
    expect(shouldPromoteTokenAsset(asset({ id: "map", kind: "map", relativePath: "assets/maps/map.png", thumbnailRelativePath: "assets/thumbnails/map.jpg" }))).toBe(false);
  });
});

function asset(patch: Partial<Asset> & Pick<Asset, "id" | "kind" | "relativePath">): Asset {
  return {
    id: patch.id,
    name: patch.id,
    kind: patch.kind,
    mediaType: "image",
    relativePath: patch.relativePath,
    originalFileName: `${patch.id}.png`,
    createdAt: "2026-07-02T00:00:00.000Z",
    ...patch
  };
}
