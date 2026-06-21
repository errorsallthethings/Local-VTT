import { describe, expect, it } from "vitest";
import { createDefaultScene, normalizeScene, type Asset, type Scene } from "../../src/shared/localvtt";
import {
  addTurnOrderEntry,
  addPlayersToTurnOrder,
  advanceTurnOrder,
  createManualTurnOrderEntry,
  createTurnOrderEntryFromAsset,
  createTurnOrderEntryFromToken,
  moveTurnOrderEntry,
  reorderTurnOrderEntry,
  removeTurnOrderEntry,
  rollInitiativeForEntry,
  rollInitiativeForNonPlayers,
  sortTurnOrderByInitiative,
  stopActiveTurnOrder,
  startTurnOrder,
  stopTurnOrder,
  updateTurnOrderEntry
} from "../../src/renderer/lib/turnOrder";

describe("turn order helpers", () => {
  it("adds, edits, sorts, and removes entries", () => {
    let scene = createDefaultScene("Turn Order");
    scene = addTurnOrderEntry(scene, createManualTurnOrderEntry("a", "Rogue", 12), "now");
    scene = addTurnOrderEntry(scene, createManualTurnOrderEntry("b", "Wizard", 18), "now");
    scene = updateTurnOrderEntry(scene, "a", { initiative: 20 }, "now");
    scene = sortTurnOrderByInitiative(scene, "now");

    expect(scene.turnOrder.entries.map((entry) => [entry.id, entry.initiative])).toEqual([
      ["a", 20],
      ["b", 18]
    ]);

    scene = removeTurnOrderEntry(scene, "a", "now");
    expect(scene.turnOrder.entries.map((entry) => entry.id)).toEqual(["b"]);
    expect(scene.turnOrder.currentEntryId).toBe("b");
  });

  it("moves entries manually without changing current turn", () => {
    let scene = sceneWithEntries(["a", "b", "c"]);
    scene.turnOrder.currentEntryId = "b";
    scene = moveTurnOrderEntry(scene, "c", "up", "now");

    expect(scene.turnOrder.entries.map((entry) => entry.id)).toEqual(["a", "c", "b"]);
    expect(scene.turnOrder.currentEntryId).toBe("b");
    expect(moveTurnOrderEntry(scene, "a", "up", "now")).toBe(scene);
  });

  it("reorders entries by target index", () => {
    let scene = sceneWithEntries(["a", "b", "c", "d"]);
    scene.turnOrder.currentEntryId = "c";
    scene = reorderTurnOrderEntry(scene, "d", 1, "now");

    expect(scene.turnOrder.entries.map((entry) => entry.id)).toEqual(["a", "d", "b", "c"]);
    expect(scene.turnOrder.currentEntryId).toBe("c");
  });

  it("starts, advances, wraps, and stops turn order", () => {
    let scene = sceneWithEntries(["a", "b"]);
    scene = startTurnOrder(scene, "now");
    expect(scene.turnOrder.active).toBe(true);
    expect(scene.turnOrder.playerViewVisible).toBe(true);
    expect(scene.turnOrder.currentEntryId).toBe("a");

    scene = advanceTurnOrder(scene, "next", "now");
    expect(scene.turnOrder.currentEntryId).toBe("b");
    scene = advanceTurnOrder(scene, "next", "now");
    expect(scene.turnOrder.currentEntryId).toBe("a");
    scene = advanceTurnOrder(scene, "previous", "now");
    expect(scene.turnOrder.currentEntryId).toBe("b");

    scene = stopTurnOrder(scene, "now");
    expect(scene.turnOrder.active).toBe(false);
    expect(scene.turnOrder.playerViewVisible).toBe(false);
  });

  it("resets stale current turn state when rebuilding a turn order list", () => {
    let scene = sceneWithEntries(["old-a", "old-b"]);
    scene = startTurnOrder(scene, "start");
    scene = advanceTurnOrder(scene, "next", "next");
    scene.turnOrder.currentEntryId = "old-b";
    scene.turnOrder.active = true;
    scene.turnOrder.playerViewVisible = true;

    scene = removeTurnOrderEntry(scene, "old-a", "remove-a");
    scene = removeTurnOrderEntry(scene, "old-b", "remove-b");

    expect(scene.turnOrder.entries).toEqual([]);
    expect(scene.turnOrder.currentEntryId).toBeUndefined();
    expect(scene.turnOrder.active).toBe(false);
    expect(scene.turnOrder.playerViewVisible).toBe(false);

    scene = addTurnOrderEntry(scene, createManualTurnOrderEntry("cleric", "Cleric", 12), "cleric");
    scene = addTurnOrderEntry(scene, createManualTurnOrderEntry("rogue", "Rogue", 19), "rogue");
    scene = addTurnOrderEntry(scene, createManualTurnOrderEntry("goblin", "Goblin", 8), "goblin");
    scene = sortTurnOrderByInitiative(scene, "sort");
    scene = startTurnOrder(scene, "restart");

    expect(scene.turnOrder.entries.map((entry) => entry.id)).toEqual(["rogue", "cleric", "goblin"]);
    expect(scene.turnOrder.currentEntryId).toBe("rogue");
  });

  it("ignores stale current turn ids when adding entries", () => {
    let scene = createDefaultScene("Stale Current");
    scene.turnOrder.currentEntryId = "missing";

    scene = addTurnOrderEntry(scene, createManualTurnOrderEntry("new", "New", 10), "now");

    expect(scene.turnOrder.currentEntryId).toBe("new");
  });

  it("stops active turn orders without dirtying already paused scenes", () => {
    let scene = sceneWithEntries(["a"]);
    expect(stopActiveTurnOrder(scene, "now")).toBe(scene);

    scene = startTurnOrder(scene, "now");
    const stopped = stopActiveTurnOrder(scene, "later");

    expect(stopped).not.toBe(scene);
    expect(stopped.turnOrder.active).toBe(false);
    expect(stopped.turnOrder.playerViewVisible).toBe(false);
    expect(stopped.updatedAt).toBe("later");
  });

  it("creates entries from token assets", () => {
    const asset: Asset = {
      id: "asset-1",
      name: "Goblin",
      kind: "token",
      mediaType: "image",
      relativePath: "assets/tokens/goblin.png",
      originalFileName: "goblin.png",
      createdAt: "now"
    };

    expect(createTurnOrderEntryFromAsset("entry-1", asset, 14)).toMatchObject({
      id: "entry-1",
      name: "Goblin",
      initiative: 14,
      assetId: "asset-1",
      visibleInPlayer: true
    });
  });

  it("creates entries from scene tokens", () => {
    const token = {
      id: "token-1",
      assetId: "asset-1",
      name: "Owlbear",
      position: { x: 0, y: 0 },
      size: { width: 70, height: 70 },
      visibleInGm: true,
      visibleInPlayer: false
    };

    expect(createTurnOrderEntryFromToken("entry-1", token, 8)).toMatchObject({
      id: "entry-1",
      name: "Owlbear",
      initiative: 8,
      tokenId: "token-1",
      assetId: "asset-1",
      visibleInPlayer: false
    });
  });

  it("adds campaign players without duplicating existing player entries", () => {
    const scene = createDefaultScene("Players");
    const players = [
      { id: "player-1", name: "Alice", color: "#ff0000", defaultSeatEdge: "bottom" as const, defaultSeatPosition: 0.25, visibleInPlayer: true },
      { id: "player-2", name: "Ben", color: "#00ff00", defaultSeatEdge: "left" as const, defaultSeatPosition: 0.5, visibleInPlayer: false }
    ];
    const withPlayers = addPlayersToTurnOrder(scene, players, "now");
    const unchanged = addPlayersToTurnOrder(withPlayers, players, "now");

    expect(withPlayers.turnOrder.entries.map((entry) => entry.playerId)).toEqual(["player-1", "player-2"]);
    expect(withPlayers.turnOrder.entries[0]).toMatchObject({ name: "Alice", visibleInPlayer: true });
    expect(withPlayers.turnOrder.entries[1]).toMatchObject({ name: "Ben", visibleInPlayer: true });
    expect(unchanged).toBe(withPlayers);
  });

  it("rolls initiative for non-player entries only", () => {
    let scene = createDefaultScene("Roll");
    scene.turnOrder.initiativeDiceCount = 2;
    scene.turnOrder.initiativeDiceSides = 6;
    scene.turnOrder.entries = [
      createManualTurnOrderEntry("monster", "Monster", 0),
      { ...createManualTurnOrderEntry("player", "Player", 12), playerId: "player-1" }
    ];

    scene = rollInitiativeForNonPlayers(scene, () => 0.5, "now");

    expect(scene.turnOrder.entries[0]).toMatchObject({ id: "monster", initiative: 8 });
    expect(scene.turnOrder.entries[1]).toMatchObject({ id: "player", initiative: 12 });
  });

  it("rolls initiative for a single entry", () => {
    let scene = sceneWithEntries(["a", "b"]);
    scene.turnOrder.initiativeDiceCount = 1;
    scene.turnOrder.initiativeDiceSides = 8;

    scene = rollInitiativeForEntry(scene, "b", () => 0.75, "now");

    expect(scene.turnOrder.entries.map((entry) => [entry.id, entry.initiative])).toEqual([
      ["a", 10],
      ["b", 7]
    ]);
  });

  it("normalizes turn order from partial scene data", () => {
    const scene = normalizeScene({
      ...createDefaultScene("Partial"),
      turnOrder: {
        active: true,
        currentEntryId: "missing",
        playerViewVisible: true,
        playerViewEdge: "sideways" as never,
        entries: [
          { id: "duplicate", name: "", initiative: 500, visibleInPlayer: undefined as never },
          { id: "duplicate", name: "Cleric", initiative: -500, visibleInPlayer: false }
        ],
        seats: [{ id: "", name: "", edge: "bad" as never, position: 2, color: "red", visibleInPlayer: undefined as never }]
      }
    });

    expect(scene.turnOrder.currentEntryId).toBe("duplicate");
    expect(scene.turnOrder.playerViewEdge).toBe("top");
    expect(scene.turnOrder.playerViewFacing).toBe("inward");
    expect(scene.turnOrder.playerViewSize).toBe("md");
    expect(scene.turnOrder.playerViewMaxEntries).toBe(9);
    expect(scene.turnOrder.playerTurnStatusSize).toBe("md");
    expect(scene.turnOrder.initiativeDiceCount).toBe(1);
    expect(scene.turnOrder.initiativeDiceSides).toBe(20);
    expect(scene.turnOrder.entries).toMatchObject([
      { id: "duplicate", name: "Entry 1", initiative: 99, visibleInPlayer: true },
      { id: "duplicate-2", name: "Cleric", initiative: -99, visibleInPlayer: false }
    ]);
    expect(scene.turnOrder.seats[0]).toMatchObject({
      id: "seat-1",
      name: "Seat 1",
      edge: "bottom",
      position: 1,
      color: "#7aa2f7",
      visibleInPlayer: true
    });
  });
});

function sceneWithEntries(ids: string[]): Scene {
  const scene = createDefaultScene("Turn Order");
  scene.turnOrder.entries = ids.map((id, index) => createManualTurnOrderEntry(id, id.toUpperCase(), 10 - index));
  return scene;
}
