import { describe, expect, it } from "vitest";
import { createDefaultScene, type CampaignPlayer } from "../../src/shared/localvtt";
import { removeTurnOrderEntriesForPlayer, updateTurnOrderEntriesForPlayer } from "../../src/renderer/lib/turn-order";

const player: CampaignPlayer = {
  id: "player-1",
  name: "Rook",
  color: "#ffffff",
  assetId: "asset-1",
  defaultSeatEdge: "bottom",
  defaultSeatPosition: 0.5,
  visibleInPlayer: true
};

describe("turn order player entry helpers", () => {
  it("updates entries linked to a campaign player", () => {
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

    const updatedScene = updateTurnOrderEntriesForPlayer(scene, { ...player, name: "Rook Updated", assetId: "asset-2" }, "now");

    expect(updatedScene.turnOrder.entries[0]).toMatchObject({ name: "Rook Updated", assetId: "asset-2" });
    expect(updatedScene.turnOrder.entries[1]).toMatchObject({ name: "Monster" });
    expect(updatedScene.updatedAt).toBe("now");
  });

  it("removes entries linked to a campaign player and fixes current entry state", () => {
    const scene = {
      ...createDefaultScene("Scene"),
      turnOrder: {
        ...createDefaultScene("Scene").turnOrder,
        active: true,
        playerViewVisible: true,
        currentEntryId: "entry-1",
        entries: [
          { id: "entry-1", playerId: "player-1", name: "Rook", initiative: 12, visibleInPlayer: true },
          { id: "entry-2", name: "Monster", initiative: 10, visibleInPlayer: true }
        ]
      }
    };

    const updatedScene = removeTurnOrderEntriesForPlayer(scene, "player-1", "now");

    expect(updatedScene.turnOrder.entries.map((entry) => entry.id)).toEqual(["entry-2"]);
    expect(updatedScene.turnOrder.currentEntryId).toBe("entry-2");
    expect(updatedScene.turnOrder.active).toBe(true);
    expect(updatedScene.updatedAt).toBe("now");
  });
});
