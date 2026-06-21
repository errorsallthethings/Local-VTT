import { describe, expect, it, vi } from "vitest";
import { createDefaultCampaign, createDefaultScene, type Asset } from "../../src/shared/localvtt";
import { updatePlayerSceneIfOpen, type PlayerViewSceneSyncApi } from "../../src/renderer/lib/playerViewSync";

describe("player view sync", () => {
  it("sends a projected scene through the Player View IPC API", async () => {
    const campaign = createDefaultCampaign("Sync Campaign");
    const visibleAsset: Asset = {
      id: "visible-map",
      name: "Visible Map",
      kind: "map",
      mediaType: "image",
      relativePath: "assets/maps/visible.png",
      originalFileName: "visible.png",
      createdAt: "2026-06-01T00:00:00.000Z"
    };
    const hiddenAsset: Asset = {
      id: "hidden-token",
      name: "Hidden Token",
      kind: "token",
      mediaType: "image",
      relativePath: "assets/tokens/hidden.png",
      originalFileName: "hidden.png",
      createdAt: "2026-06-01T00:00:00.000Z"
    };
    campaign.assets = [visibleAsset, hiddenAsset];
    campaign.players = [
      {
        id: "player-1",
        name: "Rhea",
        color: "#ff0000",
        defaultSeatEdge: "bottom",
        defaultSeatPosition: 50,
        visibleInPlayer: true
      }
    ];

    const scene = createDefaultScene("Sync Scene");
    scene.mapAssetId = "visible-map";
    scene.tokens = [
      {
        id: "hidden-token-instance",
        name: "Hidden Goblin",
        assetId: "hidden-token",
        position: { x: 10, y: 10 },
        size: { width: 1, height: 1 },
        hidden: true,
        visibleInPlayer: false
      }
    ];
    scene.notes = "GM-only notes";

    const api: PlayerViewSceneSyncApi = {
      updatePlayerSceneIfOpen: vi.fn().mockResolvedValue(true)
    };

    await expect(updatePlayerSceneIfOpen(api, campaign, scene, { showPlayerSeatIndicators: true })).resolves.toBe(true);

    expect(api.updatePlayerSceneIfOpen).toHaveBeenCalledOnce();
    const projection = vi.mocked(api.updatePlayerSceneIfOpen).mock.calls[0][0];
    expect(projection.campaignName).toBe("Sync Campaign");
    expect(projection.scene.name).toBe("Sync Scene");
    expect(projection.scene.notes).toBe("");
    expect(projection.scene.tokens).toEqual([]);
    expect(projection.assets.map((asset) => asset.id)).toEqual(["visible-map"]);
    expect(projection.players.map((player) => player.id)).toEqual(["player-1"]);
    expect(projection.showPlayerSeatIndicators).toBe(true);
  });

  it("returns the IPC result when Player View is not open", async () => {
    const campaign = createDefaultCampaign("Closed Player View");
    const scene = createDefaultScene("Unsynced Scene");
    const api: PlayerViewSceneSyncApi = {
      updatePlayerSceneIfOpen: vi.fn().mockResolvedValue(false)
    };

    await expect(updatePlayerSceneIfOpen(api, campaign, scene)).resolves.toBe(false);

    expect(api.updatePlayerSceneIfOpen).toHaveBeenCalledOnce();
    expect(vi.mocked(api.updatePlayerSceneIfOpen).mock.calls[0][0].scene.name).toBe("Unsynced Scene");
  });
});
