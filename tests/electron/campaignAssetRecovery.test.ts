import path from "node:path";
import { describe, expect, it } from "vitest";
import { findMissingCampaignAssetFiles } from "../../electron/campaignAssetRecovery";
import type { Asset } from "../../src/shared/localvtt";

function asset(patch: Partial<Asset> & Pick<Asset, "id" | "kind" | "relativePath">): Asset {
  return {
    id: patch.id,
    name: patch.name ?? patch.id,
    kind: patch.kind,
    mediaType: "image",
    relativePath: patch.relativePath,
    thumbnailRelativePath: patch.thumbnailRelativePath,
    originalFileName: patch.originalFileName ?? path.basename(patch.relativePath),
    createdAt: "2026-06-01T00:00:00.000Z"
  };
}

describe("campaign asset recovery", () => {
  it("reports missing map assets, token images, and thumbnails", async () => {
    const campaignPath = "C:/Campaigns/Keep";
    const existingPaths = new Set([
      path.resolve(campaignPath, "assets/maps/keep.png"),
      path.resolve(campaignPath, "assets/tokens/hero.png")
    ]);
    const assets = [
      asset({ id: "map-keep", kind: "map", relativePath: "assets/maps/keep.png" }),
      asset({ id: "map-missing", kind: "map", relativePath: "assets/maps/missing.png" }),
      asset({ id: "token-hero", kind: "token", relativePath: "assets/tokens/hero.png", thumbnailRelativePath: "assets/thumbnails/hero.jpg" }),
      asset({ id: "token-lost", kind: "token", relativePath: "assets/tokens/lost.png" })
    ];

    const missing = await findMissingCampaignAssetFiles(campaignPath, assets, async (candidatePath) => existingPaths.has(path.resolve(candidatePath)));

    expect(missing).toEqual([
      { assetId: "map-missing", assetName: "map-missing", kind: "map", relativePath: "assets/maps/missing.png" },
      { assetId: "token-hero", assetName: "token-hero", kind: "thumbnail", relativePath: "assets/thumbnails/hero.jpg" },
      { assetId: "token-lost", assetName: "token-lost", kind: "token", relativePath: "assets/tokens/lost.png" }
    ]);
  });

  it("treats asset paths outside the campaign folder as missing", async () => {
    const missing = await findMissingCampaignAssetFiles("C:/Campaigns/Keep", [
      asset({ id: "escape", kind: "map", relativePath: "../outside.png" })
    ]);

    expect(missing).toEqual([{ assetId: "escape", assetName: "escape", kind: "map", relativePath: "../outside.png" }]);
  });
});
