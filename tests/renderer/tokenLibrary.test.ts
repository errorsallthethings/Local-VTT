import { describe, expect, it } from "vitest";
import type { Asset, Token } from "../../src/shared/localvtt";
import { filterTokenLibraryAssets, getSelectedTokenAssetIds, getSelectedTokenLibraryAsset, getSelectedTokenLibraryAssetIds } from "../../src/renderer/lib/tokenLibrary";

function tokenAsset(id: string, name: string, originalFileName: string, createdAt: string): Asset {
  return {
    id,
    name,
    kind: "token",
    mediaType: "image",
    relativePath: `tokens/${id}.png`,
    originalFileName,
    createdAt
  };
}

function sceneToken(id: string, assetId?: string): Token {
  return {
    id,
    assetId,
    name: id,
    position: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    rotation: 0,
    hidden: false,
    visibleInPlayer: true
  };
}

describe("token library helpers", () => {
  const assets = [
    tokenAsset("goblin", "Goblin", "goblin.png", "2026-06-01T00:00:00.000Z"),
    tokenAsset("archer", "Archer", "bandit-archer.png", "2026-06-03T00:00:00.000Z"),
    tokenAsset("zombie", "zombie", "undead.png", "2026-06-02T00:00:00.000Z")
  ];

  it("filters token assets by display name or original file name", () => {
    expect(filterTokenLibraryAssets(assets, "bandit", "name-asc").map((asset) => asset.id)).toEqual(["archer"]);
    expect(filterTokenLibraryAssets(assets, "ZOMB", "name-asc").map((asset) => asset.id)).toEqual(["zombie"]);
  });

  it("sorts token assets by name or created time", () => {
    expect(filterTokenLibraryAssets(assets, "", "name-asc").map((asset) => asset.id)).toEqual(["archer", "goblin", "zombie"]);
    expect(filterTokenLibraryAssets(assets, "", "newest").map((asset) => asset.id)).toEqual(["archer", "zombie", "goblin"]);
    expect(filterTokenLibraryAssets(assets, "", "oldest").map((asset) => asset.id)).toEqual(["goblin", "zombie", "archer"]);
  });

  it("prefers multi-selected token ids over a single selected id", () => {
    expect([...getSelectedTokenLibraryAssetIds("goblin", ["archer", "zombie"])]).toEqual(["archer", "zombie"]);
    expect([...getSelectedTokenLibraryAssetIds("goblin", [])]).toEqual(["goblin"]);
    expect([...getSelectedTokenLibraryAssetIds(undefined, [])]).toEqual([]);
  });

  it("finds the selected token asset", () => {
    expect(getSelectedTokenLibraryAsset(assets, "zombie")?.name).toBe("zombie");
    expect(getSelectedTokenLibraryAsset(assets, "missing")).toBeNull();
    expect(getSelectedTokenLibraryAsset(assets, undefined)).toBeNull();
  });

  it("derives selected token asset ids from scene token selections", () => {
    const selected = getSelectedTokenAssetIds(
      [sceneToken("token-1", "asset-1"), sceneToken("token-2"), sceneToken("token-3", "asset-3")],
      "token-1",
      ["token-1", "token-2", "token-3"]
    );

    expect(selected).toEqual({
      selectedTokenAssetId: "asset-1",
      selectedTokenAssetIds: ["asset-1", "asset-3"]
    });
  });

  it("returns empty selected token asset ids without tokens", () => {
    expect(getSelectedTokenAssetIds(undefined, "token-1", ["token-1"])).toEqual({
      selectedTokenAssetId: undefined,
      selectedTokenAssetIds: []
    });
  });
});
