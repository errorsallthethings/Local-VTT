import { describe, expect, it } from "vitest";
import type { Asset } from "../../src/shared/localvtt";
import { createDefaultCampaign, createDefaultScene } from "../../src/shared/localvtt";
import { getGmCampaignAssetModel } from "../../src/renderer/hooks/useGmCampaignAssets";

function asset(id: string, kind: Asset["kind"], mediaType: Asset["mediaType"] = "image"): Asset {
  return {
    id,
    name: id,
    kind,
    mediaType,
    relativePath: `${id}.png`,
    originalFileName: `${id}.png`,
    createdAt: "2026-06-20T00:00:00.000Z"
  };
}

describe("GM campaign asset model", () => {
  it("builds the GM shell asset model from campaign assets and scene drafts", () => {
    const mapOne = asset("map-1", "map");
    const mapTwo = asset("map-2", "map", "video");
    const tokenOne = asset("token-1", "token");
    const portraitOne = asset("portrait-1", "portrait");
    const campaign = createDefaultCampaign("Campaign");
    campaign.assets = [mapOne, mapTwo, tokenOne, portraitOne];
    campaign.scenes = [
      { id: "scene-1", name: "One", file: "one.json", mapAssetId: "map-1" },
      { id: "scene-2", name: "Two", file: "two.json", mapAssetId: "map-1" }
    ];

    const activeScene = createDefaultScene("Two");
    activeScene.id = "scene-2";
    activeScene.mapAssetId = "map-2";

    const draftScene = createDefaultScene("One Draft");
    draftScene.id = "scene-1";
    draftScene.mapAssetId = "map-2";

    const model = getGmCampaignAssetModel(campaign, activeScene, { "scene-1": draftScene });

    expect(model.campaignAssets).toBe(campaign.assets);
    expect(model.campaignScenes).toBe(campaign.scenes);
    expect(model.assetsById.get("map-2")).toBe(mapTwo);
    expect(model.mapAsset).toBe(mapTwo);
    expect(model.activeMapIsVideo).toBe(true);
    expect([...model.tokenAssets.keys()]).toEqual(["token-1"]);
    expect(model.tokenLibraryAssets).toEqual([tokenOne]);
    expect(model.sceneThumbnailAssets.get("scene-1")).toBe(mapTwo);
    expect(model.sceneThumbnailAssets.get("scene-2")).toBe(mapTwo);
  });

  it("returns empty model data when no campaign is open", () => {
    const model = getGmCampaignAssetModel(null, null, {});

    expect(model.campaignAssets).toEqual([]);
    expect(model.campaignScenes).toEqual([]);
    expect(model.assetsById.size).toBe(0);
    expect(model.mapAsset).toBeNull();
    expect(model.activeMapIsVideo).toBe(false);
    expect(model.tokenAssets.size).toBe(0);
    expect(model.tokenLibraryAssets).toEqual([]);
  });
});
