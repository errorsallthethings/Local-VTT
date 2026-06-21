import { describe, expect, it } from "vitest";
import type { Asset, CampaignSceneEntry } from "../../src/shared/localvtt";
import { createDefaultScene } from "../../src/shared/localvtt";
import { buildAssetsById, buildAssetsByKind, buildSceneThumbnailAssets } from "../../src/renderer/lib/assets";

function asset(id: string, kind: Asset["kind"]): Asset {
  return {
    id,
    name: id,
    kind,
    mediaType: "image",
    relativePath: `${id}.png`,
    originalFileName: `${id}.png`,
    createdAt: "2026-06-20T00:00:00.000Z"
  };
}

describe("asset library helpers", () => {
  it("builds asset lookup maps", () => {
    const mapAsset = asset("map-1", "map");
    const tokenAsset = asset("token-1", "token");

    expect(buildAssetsById([mapAsset, tokenAsset]).get("map-1")).toBe(mapAsset);
    expect([...buildAssetsByKind([mapAsset, tokenAsset], "token").keys()]).toEqual(["token-1"]);
  });

  it("uses draft and active scene map ids for scene thumbnails", () => {
    const mapOne = asset("map-1", "map");
    const mapTwo = asset("map-2", "map");
    const mapThree = asset("map-3", "map");
    const scenes: CampaignSceneEntry[] = [
      { id: "scene-1", name: "One", file: "one.json", mapAssetId: "map-1" },
      { id: "scene-2", name: "Two", file: "two.json", mapAssetId: "map-2" },
      { id: "scene-3", name: "Three", file: "three.json", mapAssetId: "missing-map" }
    ];
    const draft = createDefaultScene("Draft");
    draft.id = "scene-1";
    draft.mapAssetId = "map-2";
    const active = createDefaultScene("Active");
    active.id = "scene-2";
    active.mapAssetId = "map-3";
    const thumbnails = buildSceneThumbnailAssets(scenes, { "scene-1": draft }, active, buildAssetsById([mapOne, mapTwo, mapThree]));

    expect(thumbnails.get("scene-1")).toBe(mapTwo);
    expect(thumbnails.get("scene-2")).toBe(mapThree);
    expect(thumbnails.get("scene-3")).toBeNull();
  });

  it("returns null thumbnails for scenes without map assets", () => {
    const scene: CampaignSceneEntry = { id: "scene-1", name: "One", file: "one.json" };

    expect(buildSceneThumbnailAssets([scene], {}, null, buildAssetsById([])).get("scene-1")).toBeNull();
  });
});
