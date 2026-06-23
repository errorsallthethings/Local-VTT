import { describe, expect, it } from "vitest";
import { createDefaultScene, normalizeScene, type Asset, type Scene } from "../../src/shared/localvtt";
import {
  addTurnOrderEntry,
  addPlayersToTurnOrder,
  advanceTurnOrder,
  createCountTrackerTurnOrderEntry,
  createManualTurnOrderEntry,
  createTurnOrderEntryFromAsset,
  createTurnOrderEntryFromToken,
  getTurnOrderTokenIndicators,
  linkTurnOrderEntryToToken,
  moveTurnOrderEntry,
  reorderTurnOrderEntry,
  removeTurnOrderEntry,
  resetTurnOrder,
  rollInitiativeForEntry,
  rollInitiativeForNonPlayers,
  sortTurnOrderByInitiative,
  stopActiveTurnOrder,
  startTurnOrder,
  stopTurnOrder,
  updateTurnOrderEntry
} from "../../src/renderer/lib/turn-order";

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
    expect(scene.turnOrder.round).toBe(1);

    scene = advanceTurnOrder(scene, "next", "now");
    expect(scene.turnOrder.currentEntryId).toBe("b");
    expect(scene.turnOrder.round).toBe(1);
    scene = advanceTurnOrder(scene, "next", "now");
    expect(scene.turnOrder.currentEntryId).toBe("a");
    expect(scene.turnOrder.round).toBe(2);
    scene = advanceTurnOrder(scene, "previous", "now");
    expect(scene.turnOrder.currentEntryId).toBe("b");
    expect(scene.turnOrder.round).toBe(2);

    scene = stopTurnOrder(scene, "now");
    expect(scene.turnOrder.active).toBe(false);
    expect(scene.turnOrder.playerViewVisible).toBe(false);
  });

  it("resets round state when the turn order list is emptied", () => {
    let scene = sceneWithEntries(["a"]);
    scene.turnOrder.round = 4;

    scene = removeTurnOrderEntry(scene, "a", "now");

    expect(scene.turnOrder.entries).toEqual([]);
    expect(scene.turnOrder.round).toBe(1);
  });

  it("decrements countdown entries when a forward round completes", () => {
    let scene = sceneWithEntries(["a", "b"]);
    scene.turnOrder.entries = [
      { ...scene.turnOrder.entries[0], countdown: 2 },
      { ...scene.turnOrder.entries[1], countdown: 0 }
    ];
    scene = startTurnOrder(scene, "start");

    scene = advanceTurnOrder(scene, "next", "b");
    expect(scene.turnOrder.round).toBe(1);
    expect(scene.turnOrder.entries.map((entry) => entry.countdown)).toEqual([2, 0]);

    scene = advanceTurnOrder(scene, "next", "wrap");
    expect(scene.turnOrder.round).toBe(2);
    expect(scene.turnOrder.entries.map((entry) => entry.countdown)).toEqual([1, 0]);
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

  it("creates count tracker entries", () => {
    expect(createCountTrackerTurnOrderEntry("tracker-1", "Bless", 3, 15)).toMatchObject({
      id: "tracker-1",
      name: "Bless",
      initiative: 15,
      visibleInPlayer: true,
      type: "count-tracker",
      countdown: 3,
      trackerColor: "#f5d98a"
    });
  });

  it("builds GM token indicators for linked scene turn order entries", () => {
    const scene = createDefaultScene("Linked Tokens");
    scene.tokens = [
      {
        id: "token-1",
        assetId: "asset-1",
        name: "Goblin A",
        position: { x: 0, y: 0 },
        size: { width: 70, height: 70 },
        visibleInGm: true,
        visibleInPlayer: true
      },
      {
        id: "token-2",
        assetId: "asset-2",
        name: "Goblin B",
        position: { x: 80, y: 0 },
        size: { width: 70, height: 70 },
        visibleInGm: true,
        visibleInPlayer: true
      }
    ];
    scene.turnOrder.active = true;
    scene.turnOrder.currentEntryId = "entry-2";
    scene.turnOrder.entries = [
      { ...createManualTurnOrderEntry("entry-1", "Goblin A"), tokenId: "token-1" },
      { ...createManualTurnOrderEntry("entry-2", "Goblin B"), tokenId: "token-2" },
      createManualTurnOrderEntry("entry-3", "Floating Reminder"),
      { ...createManualTurnOrderEntry("entry-4", "Missing Token"), tokenId: "missing-token" }
    ];

    const indicators = getTurnOrderTokenIndicators(scene);

    expect([...indicators.entries()]).toEqual([
      ["token-1", { label: "1", current: false }],
      ["token-2", { label: "2", current: true }]
    ]);
  });

  it("keeps the first turn order indicator when duplicate token links exist", () => {
    const scene = createDefaultScene("Duplicate Token Link");
    scene.tokens = [
      {
        id: "token-1",
        assetId: "asset-1",
        name: "Goblin",
        position: { x: 0, y: 0 },
        size: { width: 70, height: 70 },
        visibleInGm: true,
        visibleInPlayer: true
      }
    ];
    scene.turnOrder.active = false;
    scene.turnOrder.currentEntryId = "entry-2";
    scene.turnOrder.entries = [
      { ...createManualTurnOrderEntry("entry-1", "Goblin first"), tokenId: "token-1" },
      { ...createManualTurnOrderEntry("entry-2", "Goblin duplicate"), tokenId: "token-1" }
    ];

    expect(getTurnOrderTokenIndicators(scene).get("token-1")).toEqual({ label: "1", current: false });
  });

  it("links and unlinks turn order entries to scene tokens", () => {
    let scene = createDefaultScene("Link Tokens");
    scene.tokens = [
      {
        id: "token-1",
        assetId: "asset-1",
        name: "Knight",
        position: { x: 0, y: 0 },
        size: { width: 70, height: 70 },
        visibleInGm: true,
        visibleInPlayer: true
      }
    ];
    scene.turnOrder.entries = [createManualTurnOrderEntry("entry-1", "Player Character")];

    scene = linkTurnOrderEntryToToken(scene, "entry-1", "token-1", "linked");

    expect(scene.turnOrder.entries[0]).toMatchObject({ tokenId: "token-1", assetId: "asset-1" });
    expect(scene.updatedAt).toBe("linked");

    scene = linkTurnOrderEntryToToken(scene, "entry-1", null, "unlinked");

    expect(scene.turnOrder.entries[0].tokenId).toBeUndefined();
    expect(scene.turnOrder.entries[0].assetId).toBe("asset-1");
    expect(scene.updatedAt).toBe("unlinked");
  });

  it("resets turn order playback state without clearing entries", () => {
    let scene = sceneWithEntries(["a", "b", "c"]);
    scene = startTurnOrder(scene, "start");
    scene = advanceTurnOrder(scene, "next", "next");
    scene.turnOrder.round = 3;

    scene = resetTurnOrder(scene, "reset");

    expect(scene.turnOrder.entries.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
    expect(scene.turnOrder.active).toBe(false);
    expect(scene.turnOrder.playerViewVisible).toBe(false);
    expect(scene.turnOrder.currentEntryId).toBe("a");
    expect(scene.turnOrder.round).toBe(1);
    expect(scene.updatedAt).toBe("reset");
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
      { ...createManualTurnOrderEntry("player", "Player", 12), playerId: "player-1" },
      createCountTrackerTurnOrderEntry("tracker", "Bless", 2, 14)
    ];

    scene = rollInitiativeForNonPlayers(scene, () => 0.5, "now");

    expect(scene.turnOrder.entries[0]).toMatchObject({ id: "monster", initiative: 8 });
    expect(scene.turnOrder.entries[1]).toMatchObject({ id: "player", initiative: 12 });
    expect(scene.turnOrder.entries[2]).toMatchObject({ id: "tracker", initiative: 14 });
  });

  it("does not roll initiative for count tracker entries", () => {
    const scene = sceneWithEntries(["a"]);
    scene.turnOrder.entries = [createCountTrackerTurnOrderEntry("tracker", "Bless", 2, 14)];

    const unchanged = rollInitiativeForEntry(scene, "tracker", () => 0.75, "now");

    expect(unchanged).toBe(scene);
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
          { id: "duplicate", name: "", initiative: 500, type: "count-tracker", countdown: 1000, trackerColor: "bad", visibleInPlayer: undefined as never },
          { id: "duplicate", name: "Cleric", initiative: -500, countdown: -10, visibleInPlayer: false }
        ],
        seats: [{ id: "", name: "", edge: "bad" as never, position: 2, color: "red", visibleInPlayer: undefined as never }]
      }
    });

    expect(scene.turnOrder.currentEntryId).toBe("duplicate");
    expect(scene.turnOrder.playerViewEdge).toBe("top");
    expect(scene.turnOrder.playerViewFacing).toBe("inward");
    expect(scene.turnOrder.playerViewSize).toBe("md");
    expect(scene.turnOrder.playerViewTrackers).toEqual({
      top: { enabled: true, facing: "inward", size: "md" },
      right: { enabled: false, facing: "inward", size: "md" },
      bottom: { enabled: false, facing: "inward", size: "md" },
      left: { enabled: false, facing: "inward", size: "md" }
    });
    expect(scene.turnOrder.playerViewMaxEntries).toBe(9);
    expect(scene.turnOrder.round).toBe(1);
    expect(scene.turnOrder.trackerAvatarMask).toBe("circle");
    expect(scene.turnOrder.playerTurnStatusSize).toBe("md");
    expect(scene.turnOrder.playerTurnAvatarMask).toBe("circle");
    expect(scene.turnOrder.initiativeDiceCount).toBe(1);
    expect(scene.turnOrder.initiativeDiceSides).toBe(20);
    expect(scene.turnOrder.entries).toMatchObject([
      { id: "duplicate", name: "Entry 1", initiative: 99, type: "count-tracker", countdown: 999, trackerColor: "#f5d98a", visibleInPlayer: true },
      { id: "duplicate-2", name: "Cleric", initiative: -99, countdown: 0, visibleInPlayer: false }
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

  it("normalizes legacy turn order tracker placement into the per-edge tracker display settings", () => {
    const scene = normalizeScene({
      ...createDefaultScene("Legacy Tracker"),
      turnOrder: {
        ...createDefaultScene("Legacy Tracker").turnOrder,
        playerViewEdge: "left",
        playerViewFacing: "outward",
        playerViewSize: "lg",
        playerViewTrackers: undefined as never
      }
    });

    expect(scene.turnOrder.playerViewTrackers).toEqual({
      top: { enabled: false, facing: "inward", size: "md" },
      right: { enabled: false, facing: "inward", size: "md" },
      bottom: { enabled: false, facing: "inward", size: "md" },
      left: { enabled: true, facing: "outward", size: "lg" }
    });
  });
});

function sceneWithEntries(ids: string[]): Scene {
  const scene = createDefaultScene("Turn Order");
  scene.turnOrder.entries = ids.map((id, index) => createManualTurnOrderEntry(id, id.toUpperCase(), 10 - index));
  return scene;
}
