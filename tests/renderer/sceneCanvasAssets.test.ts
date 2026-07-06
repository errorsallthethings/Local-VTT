import { describe, expect, it } from "vitest";
import type { Asset, Token } from "../../src/shared/localvtt";
import { createDefaultCampaign, createDefaultScene } from "../../src/shared/localvtt";
import { getSceneCanvasAssetModel } from "../../src/renderer/components/scene/useSceneCanvasAssets";

function asset(id: string, kind: Asset["kind"], absolutePath?: string, thumbnailAbsolutePath?: string): Asset {
  return {
    id,
    name: id,
    kind,
    mediaType: "image",
    relativePath: `assets/${id}.png`,
    originalFileName: `${id}.png`,
    createdAt: "2026-07-05T00:00:00.000Z",
    absolutePath,
    thumbnailAbsolutePath
  };
}

function token(id: string, assetId?: string): Token {
  return {
    id,
    name: id,
    position: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    assetId,
    hidden: false,
    visibleInPlayer: true
  };
}

describe("scene canvas asset model", () => {
  it("resolves map URLs and token image source keys for a scene", () => {
    const campaign = createDefaultCampaign("Campaign");
    const map = asset("map-1", "map", "C:/maps/one.png");
    const tokenOne = asset("token-1", "token", "C:/tokens/one-original.png", "C:/tokens/one-thumb.png");
    const tokenTwo = asset("token-2", "token", "C:/tokens/two.png");
    campaign.assets = [map, tokenOne, tokenTwo, asset("portrait-1", "portrait", "C:/portraits/one.png")];

    const scene = createDefaultScene("Scene");
    scene.mapAssetId = "map-1";
    scene.tokens = [token("a", "token-1"), token("b", "token-2"), token("c", "token-1")];

    const model = getSceneCanvasAssetModel(campaign, scene, (path) => `asset://${path}`);

    expect(model.mapAsset).toBe(map);
    expect(model.assetUrl).toBe("asset://C:/maps/one.png");
    expect(model.tokenAssetIds).toBe("token-1|token-2");
    expect(model.tokenAssets).toEqual([tokenOne, tokenTwo]);
    expect(JSON.parse(model.tokenImageSourceKey)).toEqual([
      { id: "token-1", path: "C:/tokens/one-thumb.png" },
      { id: "token-2", path: "C:/tokens/two.png" }
    ]);
  });

  it("returns empty canvas asset data when campaign or files are unavailable", () => {
    const scene = createDefaultScene("Scene");
    scene.mapAssetId = "missing-map";
    scene.tokens = [token("a", "missing-token")];

    const model = getSceneCanvasAssetModel(null, scene, (path) => `asset://${path}`);

    expect(model.mapAsset).toBeNull();
    expect(model.assetUrl).toBeNull();
    expect(model.tokenAssetIds).toBe("missing-token");
    expect(model.tokenAssets).toEqual([]);
    expect(model.tokenImageSourceKey).toBe("[]");
  });
});
