import { describe, expect, it } from "vitest";
import { createDefaultCampaign, createDefaultScene, DEFAULT_TOKEN_BORDER_COLOR, PLAYER_INDICATOR_THEMES, type CampaignPlayer } from "../../src/shared/localvtt";
import {
  addCampaignPlayerToCampaign,
  deleteCampaignPlayerFromCampaign,
  MAX_CAMPAIGN_PLAYERS,
  updateCampaignPlayerInCampaign
} from "../../src/renderer/lib/campaign";

const now = "2026-07-03T12:00:00.000Z";

function player(id: string, patch: Partial<CampaignPlayer> = {}): CampaignPlayer {
  return {
    id,
    name: id,
    color: "#ffffff",
    defaultSeatEdge: "bottom",
    defaultSeatPosition: 0.5,
    visibleInPlayer: true,
    ...patch
  };
}

describe("campaign player helpers", () => {
  it("adds campaign players with default presentation and a capped count", () => {
    const campaign = createDefaultCampaign("Players");
    const next = addCampaignPlayerToCampaign(campaign, "player-1", now);

    expect(next?.players).toEqual([
      {
        id: "player-1",
        name: "Player 1",
        color: DEFAULT_TOKEN_BORDER_COLOR,
        indicatorTheme: PLAYER_INDICATOR_THEMES[0],
        defaultSeatEdge: "bottom",
        defaultSeatPosition: 0.5,
        visibleInPlayer: true
      }
    ]);
    expect(next?.updatedAt).toBe(now);

    const fullCampaign = {
      ...campaign,
      players: Array.from({ length: MAX_CAMPAIGN_PLAYERS }, (_, index) => player(`player-${index + 1}`))
    };
    expect(addCampaignPlayerToCampaign(fullCampaign, "extra", now)).toBeNull();
  });

  it("updates campaign players and matching active-scene turn order entries", () => {
    const campaign = {
      ...createDefaultCampaign("Players"),
      players: [player("player-1", { name: "Old Name", assetId: "asset-1" })]
    };
    const scene = {
      ...createDefaultScene("Scene"),
      turnOrder: {
        ...createDefaultScene("Scene").turnOrder,
        entries: [
          { id: "entry-1", playerId: "player-1", name: "Old Name", initiative: 12, visibleInPlayer: true },
          { id: "entry-2", name: "Monster", initiative: 10, visibleInPlayer: true }
        ]
      }
    };

    const result = updateCampaignPlayerInCampaign(campaign, scene, "player-1", { name: "New Name", assetId: "asset-2" }, now);

    expect(result.campaign.players[0]).toMatchObject({ name: "New Name", assetId: "asset-2" });
    expect(result.campaign.updatedAt).toBe(now);
    expect(result.scene?.turnOrder.entries[0]).toMatchObject({ name: "New Name", assetId: "asset-2" });
    expect(result.scene?.turnOrder.entries[1]).toMatchObject({ name: "Monster" });
    expect(result.scene?.updatedAt).toBe(now);
  });

  it("updates campaign players without scene changes when no active entry exists", () => {
    const campaign = {
      ...createDefaultCampaign("Players"),
      players: [player("player-1")]
    };
    const scene = createDefaultScene("Scene");

    const result = updateCampaignPlayerInCampaign(campaign, scene, "player-1", { name: "New Name" }, now);

    expect(result.campaign.players[0].name).toBe("New Name");
    expect(result.scene).toBeNull();
  });

  it("deletes campaign players and removes matching active-scene turn order entries", () => {
    const campaign = {
      ...createDefaultCampaign("Players"),
      players: [player("player-1"), player("player-2")]
    };
    const scene = {
      ...createDefaultScene("Scene"),
      turnOrder: {
        ...createDefaultScene("Scene").turnOrder,
        active: true,
        currentEntryId: "entry-1",
        entries: [
          { id: "entry-1", playerId: "player-1", name: "Player 1", initiative: 12, visibleInPlayer: true },
          { id: "entry-2", playerId: "player-2", name: "Player 2", initiative: 10, visibleInPlayer: true }
        ]
      }
    };

    const result = deleteCampaignPlayerFromCampaign(campaign, scene, "player-1", now);

    expect(result.campaign.players.map((candidate) => candidate.id)).toEqual(["player-2"]);
    expect(result.campaign.updatedAt).toBe(now);
    expect(result.scene?.turnOrder.entries.map((entry) => entry.id)).toEqual(["entry-2"]);
    expect(result.scene?.turnOrder.currentEntryId).toBe("entry-2");
    expect(result.scene?.updatedAt).toBe(now);
  });
});
