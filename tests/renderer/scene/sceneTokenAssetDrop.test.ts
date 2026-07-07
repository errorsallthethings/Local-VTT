import { describe, expect, it, vi } from "vitest";
import type { Asset, Campaign } from "../../../src/shared/localvtt";
import { TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../../../src/renderer/lib/tokens";
import { canAcceptTokenAssetDrop, getDroppedTokenAsset } from "../../../src/renderer/components/scene/input/sceneTokenAssetDrop";

function asset(id: string, kind: Asset["kind"] = "token"): Asset {
  return {
    id,
    name: id,
    kind,
    mediaType: "image",
    relativePath: `assets/${kind}s/${id}.png`,
    originalFileName: `${id}.png`,
    createdAt: "2026-01-01T00:00:00.000Z"
  };
}

function campaign(assets: Asset[]): Campaign {
  return {
    id: "campaign-1",
    name: "Campaign",
    schemaVersion: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    assets,
    scenes: [],
    activeSceneId: null
  };
}

describe("scene token asset drop helpers", () => {
  it("accepts token asset drops only when the scene can handle them", () => {
    const base = {
      dataTransferTypes: [TOKEN_LIBRARY_ASSET_DRAG_TYPE],
      hasCampaign: true,
      hasDropHandler: true,
      hasScene: true,
      mode: "gm" as const
    };

    expect(canAcceptTokenAssetDrop(base)).toBe(true);
    expect(canAcceptTokenAssetDrop({ ...base, mode: "player" })).toBe(false);
    expect(canAcceptTokenAssetDrop({ ...base, hasScene: false })).toBe(false);
    expect(canAcceptTokenAssetDrop({ ...base, hasCampaign: false })).toBe(false);
    expect(canAcceptTokenAssetDrop({ ...base, hasDropHandler: false })).toBe(false);
    expect(canAcceptTokenAssetDrop({ ...base, dataTransferTypes: ["text/plain"] })).toBe(false);
  });

  it("resolves dropped token assets and rejects non-token assets", () => {
    const token = asset("token-1", "token");
    const map = asset("map-1", "map");
    const getData = vi.fn((type: string) => (type === TOKEN_LIBRARY_ASSET_DRAG_TYPE ? "token-1" : ""));

    expect(getDroppedTokenAsset(campaign([map, token]), { getData })).toBe(token);
    expect(getData).toHaveBeenCalledWith(TOKEN_LIBRARY_ASSET_DRAG_TYPE);
    expect(getDroppedTokenAsset(campaign([map]), { getData })).toBeNull();
    expect(getDroppedTokenAsset(null, { getData })).toBeNull();
  });
});
