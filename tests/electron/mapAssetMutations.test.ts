import { describe, expect, it } from "vitest";
import { removeMapAssetFromCampaign, removeMapAssetFromScene } from "../../electron/mapAssetMutations";
import { createDefaultCampaign, createDefaultScene, type Asset } from "../../src/shared/localvtt";

describe("map asset mutations", () => {
  it("clears a matching scene map asset and updates timestamp", () => {
    const scene = createDefaultScene("Scene");
    scene.mapAssetId = "map-1";
    scene.updatedAt = "2026-07-02T00:00:00.000Z";

    const updated = removeMapAssetFromScene(scene, "map-1", "2026-07-02T12:00:00.000Z");

    expect(updated.mapAssetId).toBeUndefined();
    expect(updated.updatedAt).toBe("2026-07-02T12:00:00.000Z");
  });

  it("leaves scenes without the map asset unchanged except normalization", () => {
    const scene = createDefaultScene("Scene");
    scene.mapAssetId = "map-2";
    scene.updatedAt = "2026-07-02T00:00:00.000Z";

    const updated = removeMapAssetFromScene(scene, "map-1", "2026-07-02T12:00:00.000Z");

    expect(updated.mapAssetId).toBe("map-2");
    expect(updated.updatedAt).toBe("2026-07-02T00:00:00.000Z");
  });

  it("removes map assets and clears campaign scene summaries", () => {
    const campaign = createDefaultCampaign("Campaign");
    campaign.updatedAt = "2026-07-02T00:00:00.000Z";
    campaign.assets = [
      asset({ id: "map-1", kind: "map" }),
      asset({ id: "token-1", kind: "token", relativePath: "assets/tokens/token-1.png" })
    ];
    campaign.scenes = [
      { id: "scene-1", name: "One", file: "scenes/scene-1.scene.json", mapAssetId: "map-1" },
      { id: "scene-2", name: "Two", file: "scenes/scene-2.scene.json", mapAssetId: "map-2" }
    ];

    const updated = removeMapAssetFromCampaign(campaign, "map-1", "2026-07-02T12:00:00.000Z");

    expect(updated.assets.map((candidate) => candidate.id)).toEqual(["token-1"]);
    expect(updated.scenes).toEqual([
      { id: "scene-1", name: "One", file: "scenes/scene-1.scene.json", mapAssetId: undefined },
      { id: "scene-2", name: "Two", file: "scenes/scene-2.scene.json", mapAssetId: "map-2" }
    ]);
    expect(updated.updatedAt).toBe("2026-07-02T12:00:00.000Z");
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
