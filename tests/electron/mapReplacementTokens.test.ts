import { describe, expect, it } from "vitest";
import {
  MAP_REPLACEMENT_TOKEN_TTL_MS,
  consumeMapReplacementToken,
  createMapReplacementToken,
  pruneExpiredMapReplacementTokens,
  type MapReplacementTokenStore
} from "../../electron/mapReplacementTokens";

const tokenInput = {
  campaignPath: "C:\\Campaigns\\One",
  sceneId: "scene-1",
  currentAssetId: "asset-1",
  sourcePath: "C:\\Imports\\next-map.png"
};

describe("map replacement tokens", () => {
  it("returns the selected source path once for the matching scene and asset", () => {
    const store: MapReplacementTokenStore = new Map();
    const token = createMapReplacementToken(store, tokenInput, 1000);

    expect(
      consumeMapReplacementToken(
        store,
        token.id,
        {
          campaignPath: tokenInput.campaignPath,
          sceneId: tokenInput.sceneId,
          currentAssetId: tokenInput.currentAssetId
        },
        1001
      )
    ).toBe(tokenInput.sourcePath);
    expect(() =>
      consumeMapReplacementToken(
        store,
        token.id,
        {
          campaignPath: tokenInput.campaignPath,
          sceneId: tokenInput.sceneId,
          currentAssetId: tokenInput.currentAssetId
        },
        1002
      )
    ).toThrow(/expired/i);
  });

  it("rejects tokens that do not match the selected scene", () => {
    const store: MapReplacementTokenStore = new Map();
    const token = createMapReplacementToken(store, tokenInput, 1000);

    expect(() =>
      consumeMapReplacementToken(
        store,
        token.id,
        {
          campaignPath: tokenInput.campaignPath,
          sceneId: "scene-2",
          currentAssetId: tokenInput.currentAssetId
        },
        1001
      )
    ).toThrow(/does not match/i);
  });

  it("prunes stale selections before they can be consumed", () => {
    const store: MapReplacementTokenStore = new Map();
    const token = createMapReplacementToken(store, tokenInput, 1000);

    pruneExpiredMapReplacementTokens(store, 1000 + MAP_REPLACEMENT_TOKEN_TTL_MS + 1);

    expect(store.has(token.id)).toBe(false);
    expect(() =>
      consumeMapReplacementToken(
        store,
        token.id,
        {
          campaignPath: tokenInput.campaignPath,
          sceneId: tokenInput.sceneId,
          currentAssetId: tokenInput.currentAssetId
        },
        1000 + MAP_REPLACEMENT_TOKEN_TTL_MS + 2
      )
    ).toThrow(/expired/i);
  });
});
