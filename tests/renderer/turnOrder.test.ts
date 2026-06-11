import { describe, expect, it } from "vitest";
import { createDefaultScene, normalizeScene, type Asset, type Scene } from "../../src/shared/localvtt";
import {
  addTurnOrderEntry,
  advanceTurnOrder,
  createManualTurnOrderEntry,
  createTurnOrderEntryFromAsset,
  moveTurnOrderEntry,
  removeTurnOrderEntry,
  sortTurnOrderByInitiative,
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
