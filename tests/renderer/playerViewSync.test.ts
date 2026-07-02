import { describe, expect, it, vi } from "vitest";
import { createDefaultCampaign, createDefaultScene, type Asset } from "../../src/shared/localvtt";
import { sendSceneToPlayer, updatePlayerSceneIfOpen, updatePlayerSceneIfOpenInBackground, type PlayerViewSceneSyncApi } from "../../src/renderer/lib/player-view";

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
    const visiblePlayerAsset: Asset = {
      id: "visible-player-avatar",
      name: "Visible Player Avatar",
      kind: "token",
      mediaType: "image",
      relativePath: "assets/tokens/visible-player.png",
      originalFileName: "visible-player.png",
      createdAt: "2026-06-01T00:00:00.000Z"
    };
    const hiddenPlayerAsset: Asset = {
      id: "hidden-player-avatar",
      name: "Hidden Player Avatar",
      kind: "token",
      mediaType: "image",
      relativePath: "assets/tokens/hidden-player.png",
      originalFileName: "hidden-player.png",
      createdAt: "2026-06-01T00:00:00.000Z"
    };
    campaign.assets = [visibleAsset, hiddenAsset, visiblePlayerAsset, hiddenPlayerAsset];
    campaign.players = [
      {
        id: "player-1",
        name: "Rhea",
        color: "#ff0000",
        assetId: "visible-player-avatar",
        defaultSeatEdge: "bottom",
        defaultSeatPosition: 50,
        visibleInPlayer: true
      },
      {
        id: "player-2",
        name: "Hidden Player",
        color: "#00ff00",
        assetId: "hidden-player-avatar",
        defaultSeatEdge: "top",
        defaultSeatPosition: 50,
        visibleInPlayer: false
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
      sendSceneToPlayer: vi.fn().mockResolvedValue(true),
      updatePlayerSceneIfOpen: vi.fn().mockResolvedValue(true)
    };

    await expect(updatePlayerSceneIfOpen(api, campaign, scene, { showPlayerSeatIndicators: true })).resolves.toBe(true);

    expect(api.updatePlayerSceneIfOpen).toHaveBeenCalledOnce();
    const projection = vi.mocked(api.updatePlayerSceneIfOpen).mock.calls[0][0];
    expect(projection.campaignName).toBe("Sync Campaign");
    expect(projection.scene.name).toBe("Sync Scene");
    expect(projection.scene.notes).toBe("");
    expect(projection.scene.tokens).toEqual([]);
    expect(projection.assets.map((asset) => asset.id)).toEqual(["visible-map", "visible-player-avatar"]);
    expect(projection.players.map((player) => player.id)).toEqual(["player-1"]);
    expect(projection.showPlayerSeatIndicators).toBe(true);
  });

  it("returns the IPC result when Player View is not open", async () => {
    const campaign = createDefaultCampaign("Closed Player View");
    const scene = createDefaultScene("Unsynced Scene");
    const api: PlayerViewSceneSyncApi = {
      sendSceneToPlayer: vi.fn().mockResolvedValue(true),
      updatePlayerSceneIfOpen: vi.fn().mockResolvedValue(false)
    };

    await expect(updatePlayerSceneIfOpen(api, campaign, scene)).resolves.toBe(false);

    expect(api.updatePlayerSceneIfOpen).toHaveBeenCalledOnce();
    expect(vi.mocked(api.updatePlayerSceneIfOpen).mock.calls[0][0].scene.name).toBe("Unsynced Scene");
  });

  it("sends the projected scene when explicitly opening Player View", async () => {
    const campaign = createDefaultCampaign("Player Send Campaign");
    const scene = createDefaultScene("Player Send Scene");
    scene.notes = "Private send notes";
    const api: PlayerViewSceneSyncApi = {
      sendSceneToPlayer: vi.fn().mockResolvedValue(true),
      updatePlayerSceneIfOpen: vi.fn().mockResolvedValue(false)
    };

    await expect(sendSceneToPlayer(api, campaign, scene, { showPlayerSeatIndicators: true })).resolves.toBe(true);

    expect(api.sendSceneToPlayer).toHaveBeenCalledOnce();
    expect(api.updatePlayerSceneIfOpen).not.toHaveBeenCalled();
    const projection = vi.mocked(api.sendSceneToPlayer).mock.calls[0][0];
    expect(projection.scene.name).toBe("Player Send Scene");
    expect(projection.scene.notes).toBe("");
    expect(projection.showPlayerSeatIndicators).toBe(true);
  });

  it("logs background Player View sync failures without throwing", async () => {
    const campaign = createDefaultCampaign("Background Sync Campaign");
    const scene = createDefaultScene("Background Sync Scene");
    const caught = new Error("Player window closed");
    const warningSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const api: PlayerViewSceneSyncApi = {
      sendSceneToPlayer: vi.fn().mockResolvedValue(true),
      updatePlayerSceneIfOpen: vi.fn().mockRejectedValue(caught)
    };

    try {
      expect(() => updatePlayerSceneIfOpenInBackground(api, campaign, scene)).not.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(api.updatePlayerSceneIfOpen).toHaveBeenCalledOnce();
      expect(warningSpy).toHaveBeenCalledWith(
        "LOCALVTT_PLAYER_VIEW_SYNC_FAILED",
        expect.objectContaining({ name: "Error", message: "Player window closed" })
      );
    } finally {
      warningSpy.mockRestore();
    }
  });
});
