import { describe, expect, it } from "vitest";
import { createDefaultCampaign, type Asset } from "../../src/shared/localvtt";
import { findCampaignAsset, requireCampaignAsset, requireTokenAssetWithAbsolutePath } from "../../electron/campaignAssetLookup";

describe("campaign asset lookup", () => {
  it("finds assets by id and kind", () => {
    const token = asset({ id: "asset-1", kind: "token" });
    const campaign = { ...createDefaultCampaign("Lookup Test"), assets: [asset({ id: "asset-1", kind: "map" }), token] };

    expect(findCampaignAsset(campaign, "asset-1", "token")).toBe(token);
    expect(findCampaignAsset(campaign, "asset-1", "map")?.kind).toBe("map");
    expect(findCampaignAsset(campaign, "missing", "token")).toBeUndefined();
  });

  it("requires assets by id and kind with caller-provided errors", () => {
    const campaign = { ...createDefaultCampaign("Lookup Test"), assets: [asset({ id: "map-1", kind: "map" })] };

    expect(requireCampaignAsset(campaign, "map-1", "map", "missing")).toBe(campaign.assets[0]);
    expect(() => requireCampaignAsset(campaign, "map-1", "token", "token missing")).toThrow("token missing");
  });

  it("requires token assets to have absolute paths", () => {
    const tokenWithPath = asset({ id: "token-1", kind: "token", absolutePath: "C:\\Campaign\\assets\\tokens\\token-1.png" });
    const campaign = {
      ...createDefaultCampaign("Lookup Test"),
      assets: [asset({ id: "token-2", kind: "token" }), tokenWithPath]
    };

    expect(requireTokenAssetWithAbsolutePath(campaign, "token-1")).toBe(tokenWithPath);
    expect(() => requireTokenAssetWithAbsolutePath(campaign, "token-2")).toThrow("Token asset was not found in this campaign.");
    expect(() => requireTokenAssetWithAbsolutePath(campaign, "missing")).toThrow("Token asset was not found in this campaign.");
  });
});

function asset(patch: Partial<Asset> & Pick<Asset, "id" | "kind">): Asset {
  return {
    id: patch.id,
    name: patch.id,
    kind: patch.kind,
    mediaType: "image",
    relativePath: patch.kind === "map" ? `assets/maps/${patch.id}.png` : `assets/tokens/${patch.id}.png`,
    originalFileName: `${patch.id}.png`,
    createdAt: "2026-07-02T00:00:00.000Z",
    ...patch
  };
}
