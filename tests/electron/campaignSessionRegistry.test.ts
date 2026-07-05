import path from "node:path";
import { describe, expect, it } from "vitest";
import { CampaignSessionRegistry } from "../../electron/campaignSessionRegistry";
import { createDefaultCampaign } from "../../src/shared/localvtt";

describe("CampaignSessionRegistry", () => {
  it("tracks opened campaign folders by resolved path", () => {
    const registry = new CampaignSessionRegistry();
    const campaignPath = path.join("campaign-root", ".");

    registry.registerCampaignPath(campaignPath);

    expect(() => registry.assertKnownCampaignPath("campaign-root")).not.toThrow();
    expect(() => registry.assertKnownCampaignPath("other-root")).toThrow("Campaign folder is not open.");
  });

  it("detects paths inside any opened campaign", () => {
    const registry = new CampaignSessionRegistry();
    registry.registerCampaignPath("campaign-one");
    registry.registerCampaignPath("campaign-two");

    expect(registry.isInsideOpenedCampaign(path.join("campaign-two", "assets", "maps", "map.png"))).toBe(true);
    expect(registry.isInsideOpenedCampaign(path.join("campaign-two", "..", "outside", "map.png"))).toBe(false);
  });

  it("tracks known hydrated campaign asset paths", () => {
    const registry = new CampaignSessionRegistry();
    const campaign = createDefaultCampaign("Test Campaign");
    const assetPath = path.resolve("campaign-root", "assets", "maps", "map.png");
    const thumbnailPath = path.resolve("campaign-root", "assets", "thumbnails", "map.jpg");
    campaign.assets = [
      {
        id: "asset-1",
        name: "Map",
        kind: "map",
        mediaType: "image",
        relativePath: "assets/maps/map.png",
        absolutePath: assetPath,
        thumbnailAbsolutePath: thumbnailPath,
        originalFileName: "map.png",
        createdAt: "2026-07-02T00:00:00.000Z"
      }
    ];

    registry.registerAssetPaths(campaign);

    expect(registry.isKnownAssetPath(assetPath)).toBe(true);
    expect(registry.isKnownAssetPath(thumbnailPath)).toBe(true);
    expect(registry.isKnownAssetPath(path.resolve("campaign-root", "assets", "maps", "other.png"))).toBe(false);
  });

  it("tracks individual imported asset paths", () => {
    const registry = new CampaignSessionRegistry();
    const assetPath = path.join("campaign-root", "assets", "tokens", "hero.png");

    registry.registerAssetPath(assetPath);

    expect(registry.isKnownAssetPath(path.resolve(assetPath))).toBe(true);
  });

  it("tracks temporary external asset paths separately from campaign asset paths", () => {
    const registry = new CampaignSessionRegistry();
    const assetPath = path.join("outside-source", "hero.png");

    registry.registerTemporaryExternalAssetPath(assetPath);

    expect(registry.isKnownAssetPath(path.resolve(assetPath))).toBe(false);
    expect(registry.isTemporaryExternalAssetPath(path.resolve(assetPath))).toBe(true);
    registry.unregisterTemporaryExternalAssetPath(assetPath);
    expect(registry.isTemporaryExternalAssetPath(path.resolve(assetPath))).toBe(false);
  });
});
