import { describe, expect, it } from "vitest";
import { addMapVariantToScene, removeMapAssetFromCampaign, removeMapAssetFromScene, replaceSceneMapAsset } from "../../electron/mapAssetMutations";
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

  it("removes a matching map variant and activates the next variant", () => {
    const scene = createDefaultScene("Scene");
    scene.mapAssetId = "map-1";
    scene.mapVariants = [
      { id: "day", name: "Day", assetId: "map-1", createdAt: "2026-07-02T00:00:00.000Z" },
      { id: "night", name: "Night", assetId: "map-2", createdAt: "2026-07-02T00:00:00.000Z" }
    ];

    const updated = removeMapAssetFromScene(scene, "map-1", "2026-07-02T12:00:00.000Z");

    expect(updated.mapAssetId).toBe("map-2");
    expect(updated.mapVariants.map((variant) => variant.assetId)).toEqual(["map-2"]);
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

  it("replaces scene maps while preserving reused current map assets", () => {
    const campaign = campaignWithMapAssets();
    const scene = createDefaultScene("One");
    scene.id = "scene-1";
    scene.mapAssetId = "map-1";
    const imported = asset({ id: "map-3", kind: "map" });

    const updated = replaceSceneMapAsset(campaign, scene, "map-1", imported, true, "2026-07-02T12:05:00.000Z");

    expect(updated.scene.mapAssetId).toBe("map-3");
    expect(updated.scene.updatedAt).toBe("2026-07-02T12:05:00.000Z");
    expect(updated.campaign.assets.map((candidate) => candidate.id)).toEqual(["map-1", "map-2", "map-3"]);
    expect(updated.campaign.scenes.find((entry) => entry.id === "scene-1")?.mapAssetId).toBe("map-3");
    expect(updated.campaign.updatedAt).toBe("2026-07-02T12:05:00.000Z");
  });

  it("replaces scene maps while removing unused current map assets", () => {
    const campaign = campaignWithMapAssets();
    const scene = createDefaultScene("One");
    scene.id = "scene-1";
    scene.mapAssetId = "map-1";
    const imported = asset({ id: "map-3", kind: "map" });

    const updated = replaceSceneMapAsset(campaign, scene, "map-1", imported, false, "2026-07-02T12:05:00.000Z");

    expect(updated.campaign.assets.map((candidate) => candidate.id)).toEqual(["map-2", "map-3"]);
    expect(campaign.assets.map((candidate) => candidate.id)).toEqual(["map-1", "map-2"]);
  });

  it("replaces only the selected map variant", () => {
    const campaign = campaignWithMapAssets();
    const scene = createDefaultScene("One");
    scene.id = "scene-1";
    scene.mapAssetId = "map-1";
    scene.mapVariants = [
      { id: "day", name: "Day", assetId: "map-1", createdAt: "2026-07-02T00:00:00.000Z" },
      { id: "night", name: "Night", assetId: "map-2", createdAt: "2026-07-02T00:00:00.000Z" }
    ];
    const imported = asset({ id: "map-3", kind: "map" });

    const updated = replaceSceneMapAsset(campaign, scene, "map-2", imported, true, "2026-07-02T12:05:00.000Z");

    expect(updated.scene.mapAssetId).toBe("map-1");
    expect(updated.scene.mapVariants.map((variant) => variant.assetId)).toEqual(["map-1", "map-3"]);
  });

  it("adds imported map assets as inactive variants when a scene already has a map", () => {
    const campaign = campaignWithMapAssets();
    const scene = createDefaultScene("One");
    scene.id = "scene-1";
    scene.mapAssetId = "map-1";
    const imported = asset({ id: "map-3", kind: "map" });

    const updated = addMapVariantToScene(campaign, scene, imported, "Night", "2026-07-02T12:05:00.000Z");

    expect(updated.scene.mapAssetId).toBe("map-1");
    expect(updated.scene.mapVariants.map((variant) => ({ name: variant.name, assetId: variant.assetId }))).toEqual([
      { name: "Primary Map", assetId: "map-1" },
      { name: "Night", assetId: "map-3" }
    ]);
    expect(updated.campaign.assets.map((candidate) => candidate.id)).toEqual(["map-1", "map-2", "map-3"]);
  });
});

function campaignWithMapAssets() {
  const campaign = createDefaultCampaign("Campaign");
  campaign.assets = [asset({ id: "map-1", kind: "map" }), asset({ id: "map-2", kind: "map" })];
  campaign.scenes = [
    { id: "scene-1", name: "One", file: "scenes/scene-1.scene.json", mapAssetId: "map-1" },
    { id: "scene-2", name: "Two", file: "scenes/scene-2.scene.json", mapAssetId: "map-2" }
  ];
  return campaign;
}

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
