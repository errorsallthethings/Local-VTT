import { describe, expect, it } from "vitest";
import type { Asset, Token } from "../../src/shared/localvtt";
import {
  areTokenImagesReady,
  getTokenAssetIds,
  getTokenImageAssets,
  getRequiredTokenImageAssetIds,
  getTokenImageSourceKey,
  parseTokenImageSourceKey
} from "../../src/renderer/canvas/tokens";

function token(assetId?: string): Token {
  return {
    id: `token-${assetId ?? "none"}`,
    name: "Token",
    assetId,
    position: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    hidden: false,
    visibleInPlayer: true
  };
}

function asset(id: string, absolutePath?: string, thumbnailAbsolutePath?: string): Asset {
  return {
    id,
    name: id,
    kind: "token",
    mediaType: "image",
    relativePath: `${id}.png`,
    originalFileName: `${id}.png`,
    createdAt: "2026-01-01T00:00:00.000Z",
    absolutePath,
    thumbnailAbsolutePath
  };
}

describe("token image source parsing", () => {
  it("builds a stable deduped token asset id key", () => {
    expect(getTokenAssetIds([token("asset-1"), token("asset-2"), token("asset-1"), token()])).toBe("asset-1|asset-2");
  });

  it("resolves token image assets with usable absolute paths", () => {
    expect(getTokenImageAssets([asset("asset-1", "C:/tokens/one.png"), asset("asset-2"), asset("asset-3", "C:/tokens/three.png")], "asset-3|asset-2|missing|asset-1")).toEqual([
      asset("asset-3", "C:/tokens/three.png"),
      asset("asset-1", "C:/tokens/one.png")
    ]);
  });

  it("prefers thumbnail paths when building source keys", () => {
    const key = getTokenImageSourceKey([
      asset("asset-1", "C:/tokens/one.png", "C:/tokens/one-thumb.png"),
      asset("asset-2", "C:/tokens/two.png")
    ]);

    expect(JSON.parse(key)).toEqual([
      { id: "asset-1", path: "C:/tokens/one-thumb.png" },
      { id: "asset-2", path: "C:/tokens/two.png" }
    ]);
  });

  it("falls back to token image paths when thumbnails are not available", () => {
    const key = getTokenImageSourceKey([asset("asset-1", "C:/tokens/one.png")]);

    expect(JSON.parse(key)).toEqual([{ id: "asset-1", path: "C:/tokens/one.png" }]);
  });

  it("returns required token image asset ids from source keys", () => {
    const key = JSON.stringify([
      { id: "asset-1", path: "C:/tokens/one.png" },
      { id: "asset-2", path: "C:/tokens/two.png" }
    ]);

    expect(getRequiredTokenImageAssetIds(key)).toEqual(["asset-1", "asset-2"]);
  });

  it("treats token images as ready when token rendering is hidden", () => {
    expect(areTokenImagesReady(false, JSON.stringify([{ id: "asset-1", path: "C:/tokens/one.png" }]), new Map(), new Set())).toBe(true);
  });

  it("treats token images as ready when each required asset loaded or failed", () => {
    const key = JSON.stringify([
      { id: "asset-1", path: "C:/tokens/one.png" },
      { id: "asset-2", path: "C:/tokens/two.png" }
    ]);

    expect(areTokenImagesReady(true, key, new Map([["asset-1", {}]]), new Set(["asset-2"]))).toBe(true);
  });

  it("waits while any required visible token image is still pending", () => {
    const key = JSON.stringify([
      { id: "asset-1", path: "C:/tokens/one.png" },
      { id: "asset-2", path: "C:/tokens/two.png" }
    ]);

    expect(areTokenImagesReady(true, key, new Map([["asset-1", {}]]), new Set())).toBe(false);
  });

  it("returns valid image sources from a JSON array", () => {
    expect(parseTokenImageSourceKey(JSON.stringify([{ id: "asset-1", path: "C:/maps/token.png" }]))).toEqual([
      { id: "asset-1", path: "C:/maps/token.png" }
    ]);
  });

  it("filters entries without usable ids or paths", () => {
    const key = JSON.stringify([
      { id: "asset-1", path: "C:/maps/token.png" },
      { id: "", path: "C:/maps/missing-id.png" },
      { id: "asset-2", path: "" },
      { id: "asset-3" },
      null,
      "not-an-object"
    ]);

    expect(parseTokenImageSourceKey(key)).toEqual([{ id: "asset-1", path: "C:/maps/token.png" }]);
  });

  it("returns an empty list for invalid or unexpected JSON", () => {
    expect(parseTokenImageSourceKey("{")).toEqual([]);
    expect(parseTokenImageSourceKey(JSON.stringify({ id: "asset-1", path: "C:/maps/token.png" }))).toEqual([]);
  });
});
