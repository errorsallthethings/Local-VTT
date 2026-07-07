import { describe, expect, it } from "vitest";
import { removeAssetFromCampaign, removeTokenAssetFromScene } from "../../electron/tokenAssetMutations";
import { createDefaultCampaign, createDefaultScene, type Asset } from "../../src/shared/localvtt";

describe("token asset mutations", () => {
  it("removes an asset from a campaign and updates the timestamp", () => {
    const campaign = createDefaultCampaign("Campaign");
    campaign.updatedAt = "2026-07-02T00:00:00.000Z";
    campaign.assets = [
      asset({ id: "asset-1", kind: "token" }),
      asset({ id: "asset-2", kind: "map", relativePath: "assets/maps/map.png" })
    ];

    const updated = removeAssetFromCampaign(campaign, "asset-1", "2026-07-02T12:00:00.000Z");

    expect(updated.assets.map((candidate) => candidate.id)).toEqual(["asset-2"]);
    expect(updated.updatedAt).toBe("2026-07-02T12:00:00.000Z");
  });

  it("removes token asset references from scenes", () => {
    const scene = createDefaultScene("Scene");
    scene.updatedAt = "2026-07-02T00:00:00.000Z";
    scene.tokens = [
      token("token-1", "asset-1"),
      token("token-2", "asset-2"),
      token("token-3", "asset-1")
    ];

    const updated = removeTokenAssetFromScene(scene, "asset-1", "2026-07-02T12:00:00.000Z");

    expect(updated?.tokens.map((candidate) => candidate.id)).toEqual(["token-2"]);
    expect(updated?.updatedAt).toBe("2026-07-02T12:00:00.000Z");
  });

  it("returns null when a scene does not reference the token asset", () => {
    const scene = createDefaultScene("Scene");
    scene.tokens = [token("token-1", "asset-2")];

    expect(removeTokenAssetFromScene(scene, "asset-1")).toBeNull();
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

function token(id: string, assetId: string) {
  return {
    id,
    assetId,
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    hidden: false
  };
}
