import { describe, expect, it } from "vitest";
import { getSceneCanvasReadiness } from "../../src/renderer/canvas/scene";

describe("scene canvas readiness", () => {
  it("is ready when map and token assets are hidden", () => {
    expect(
      getSceneCanvasReadiness({
        canShowMap: false,
        canShowTokens: false,
        failedTokenImageIds: new Set(),
        hasMapAsset: true,
        loadedTokenImages: new Map(),
        mapLoadStatus: "loading",
        mapMediaType: "image",
        tokenImageSourceKey: JSON.stringify([{ id: "token-1", path: "C:/tokens/one.png" }])
      })
    ).toMatchObject({
      mapOverlayActive: false,
      mapReady: true,
      ready: true,
      tokensReady: true
    });
  });

  it("waits for visible maps and token images before reporting ready", () => {
    const readiness = getSceneCanvasReadiness({
      canShowMap: true,
      canShowTokens: true,
      failedTokenImageIds: new Set(),
      hasMapAsset: true,
      loadedTokenImages: new Map([["token-1", {}]]),
      mapLoadStatus: "loading",
      mapMediaType: "image",
      tokenImageSourceKey: JSON.stringify([
        { id: "token-1", path: "C:/tokens/one.png" },
        { id: "token-2", path: "C:/tokens/two.png" }
      ])
    });

    expect(readiness).toMatchObject({
      mapOverlayActive: true,
      mapOverlayMessage: "Loading map...",
      mapReady: false,
      ready: false,
      tokensReady: false
    });
  });

  it("treats failed visible assets as ready while surfacing the map error overlay", () => {
    const readiness = getSceneCanvasReadiness({
      canShowMap: true,
      canShowTokens: true,
      failedTokenImageIds: new Set(["token-2"]),
      hasMapAsset: true,
      loadedTokenImages: new Map([["token-1", {}]]),
      mapLoadStatus: "error",
      mapMediaType: "video",
      tokenImageSourceKey: JSON.stringify([
        { id: "token-1", path: "C:/tokens/one.png" },
        { id: "token-2", path: "C:/tokens/two.png" }
      ])
    });

    expect(readiness).toEqual({
      mapOverlayActive: true,
      mapOverlayMessage: "Map asset unavailable. It may have been moved, renamed, or deleted.",
      mapReady: true,
      ready: true,
      tokensReady: true
    });
  });
});
