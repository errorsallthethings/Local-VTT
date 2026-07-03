import path from "node:path";
import { describe, expect, it } from "vitest";
import { createDefaultCampaign } from "../../src/shared/localvtt";
import { addImportedAssetToCampaign, createImportedAsset } from "../../electron/importedAssets";

describe("imported assets", () => {
  it("creates imported asset metadata with resolved thumbnail paths", () => {
    const campaignPath = path.resolve("fixtures", "campaign");

    expect(
      createImportedAsset({
        assetId: "asset-1",
        kind: "map",
        mediaType: "image",
        sourcePath: path.join("source", "Battle Map.PNG"),
        relativePath: "assets/maps/Battle Map.PNG",
        destination: path.join(campaignPath, "assets", "maps", "Battle Map.PNG"),
        campaignPath,
        thumbnailRelativePath: "assets/thumbnails/asset-1.jpg",
        createdAt: "2026-07-02T12:00:00.000Z"
      })
    ).toEqual({
      id: "asset-1",
      name: "Battle Map.PNG",
      kind: "map",
      mediaType: "image",
      relativePath: "assets/maps/Battle Map.PNG",
      thumbnailRelativePath: "assets/thumbnails/asset-1.jpg",
      originalFileName: "Battle Map.PNG",
      createdAt: "2026-07-02T12:00:00.000Z",
      absolutePath: path.join(campaignPath, "assets", "maps", "Battle Map.PNG"),
      thumbnailAbsolutePath: path.join(campaignPath, "assets", "thumbnails", "asset-1.jpg")
    });
  });

  it("omits thumbnail absolute paths when thumbnail creation failed", () => {
    const campaignPath = path.resolve("fixtures", "campaign");
    const asset = createImportedAsset({
      assetId: "asset-2",
      kind: "token",
      mediaType: "image",
      sourcePath: path.join("source", "Hero.png"),
      relativePath: "assets/tokens/Hero.png",
      destination: path.join(campaignPath, "assets", "tokens", "Hero.png"),
      campaignPath,
      createdAt: "2026-07-02T12:00:00.000Z"
    });

    expect(asset.thumbnailRelativePath).toBeUndefined();
    expect(asset.thumbnailAbsolutePath).toBeUndefined();
  });

  it("appends imported assets while updating campaign timestamps", () => {
    const campaign = createDefaultCampaign("Import Test");
    const asset = createImportedAsset({
      assetId: "asset-3",
      kind: "token",
      mediaType: "image",
      sourcePath: "Hero.png",
      relativePath: "assets/tokens/Hero.png",
      destination: path.resolve("fixtures", "campaign", "assets", "tokens", "Hero.png"),
      campaignPath: path.resolve("fixtures", "campaign"),
      createdAt: "2026-07-02T12:00:00.000Z"
    });

    const updated = addImportedAssetToCampaign(campaign, asset, "2026-07-02T12:05:00.000Z");

    expect(updated.assets).toEqual([asset]);
    expect(updated.updatedAt).toBe("2026-07-02T12:05:00.000Z");
    expect(campaign.assets).toEqual([]);
  });
});
