import { describe, expect, it } from "vitest";
import { createDefaultCampaign, createDefaultScene, type Asset } from "../../src/shared/localvtt";
import { assertSceneUsesMapAsset, requireCurrentMapAsset } from "../../electron/mapReplacementValidation";

describe("map replacement validation", () => {
  it("returns the current map asset when it exists", () => {
    const map = asset({ id: "map-1", kind: "map" });
    const campaign = {
      ...createDefaultCampaign("Validation Test"),
      assets: [asset({ id: "token-1", kind: "token" }), map]
    };

    expect(requireCurrentMapAsset(campaign, "map-1")).toBe(map);
  });

  it("rejects missing or non-map current assets", () => {
    const campaign = {
      ...createDefaultCampaign("Validation Test"),
      assets: [asset({ id: "token-1", kind: "token" })]
    };

    expect(() => requireCurrentMapAsset(campaign, "missing")).toThrow("Current map asset was not found in this campaign.");
    expect(() => requireCurrentMapAsset(campaign, "token-1")).toThrow("Current map asset was not found in this campaign.");
  });

  it("accepts scenes that still use the selected map asset", () => {
    const scene = createDefaultScene("Scene");
    scene.mapAssetId = "map-1";

    expect(() => assertSceneUsesMapAsset(scene, "map-1")).not.toThrow();
  });

  it("rejects scenes that no longer use the selected map asset", () => {
    const scene = createDefaultScene("Scene");
    scene.mapAssetId = "map-2";

    expect(() => assertSceneUsesMapAsset(scene, "map-1")).toThrow("The selected scene no longer uses this map asset.");
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
