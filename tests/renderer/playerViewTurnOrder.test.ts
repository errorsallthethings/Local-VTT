import { describe, expect, it } from "vitest";
import {
  easeInCubic,
  easeOutCubic,
  getEdgeSlideTransform,
  getPlayerSeatStyle,
  getPlayerTurnStatusLabel,
  getPlayerTurnStatusStyle,
  getTurnOrderFacingRotation,
  getTurnOrderPlayerBarLayout,
  getVisibleTurnOrderState
} from "../../src/renderer/lib/player-view";

describe("player view turn order helpers", () => {
  it("positions player seat indicators on the selected edge with clamped position", () => {
    expect(getPlayerSeatStyle("top", 0.25, "#ff0000")).toMatchObject({
      "--player-seat-color": "#ff0000",
      left: "25%",
      top: "12px"
    });
    expect(getPlayerSeatStyle("right", 2, "#00ff00")).toMatchObject({
      "--player-seat-color": "#00ff00",
      top: "100%",
      right: "12px"
    });
  });

  it("labels player turn status consistently", () => {
    expect(getPlayerTurnStatusLabel("current")).toBe("Turn Now");
    expect(getPlayerTurnStatusLabel("next")).toBe("Up Next");
    expect(getPlayerTurnStatusLabel("waiting")).toBe("Waiting");
  });

  it("builds edge slide transforms with optional rotation", () => {
    expect(getEdgeSlideTransform("top", 0)).toBe("translate(-50%, calc(-100% - 36px))");
    expect(getEdgeSlideTransform("bottom", 1)).toBe("translate(-50%, calc(0% + 0px))");
    expect(getEdgeSlideTransform("left", 0.5, 90)).toBe("translate(calc(-50% - 18px), -50%) rotate(90deg)");
    expect(getEdgeSlideTransform("right", 2, -90)).toBe("translate(calc(0% + 0px), -50%) rotate(-90deg)");
  });

  it("adds status rotation to player turn status styles", () => {
    expect(getPlayerTurnStatusStyle("left", 0.5, "#ffaa00", 1)).toMatchObject({
      "--player-seat-color": "#ffaa00",
      top: "50%",
      left: "calc(12px - var(--player-turn-edge-offset, 57px))",
      transform: "translate(calc(-0% - 0px), -50%) rotate(90deg)"
    });
  });

  it("computes easing values", () => {
    expect(easeInCubic(0.5)).toBe(0.125);
    expect(easeOutCubic(0.5)).toBe(0.875);
  });

  it("computes turn order bar layout from edge and facing", () => {
    expect(getTurnOrderPlayerBarLayout("right", "outward")).toEqual({
      entryRotation: -90,
      reverseEntries: true,
      arrowAtEnd: true,
      arrowRotation: -90
    });
    expect(getTurnOrderPlayerBarLayout("left", "outward")).toEqual({
      entryRotation: 90,
      reverseEntries: false,
      arrowAtEnd: false,
      arrowRotation: 90
    });
  });

  it("computes facing rotation for each edge", () => {
    expect(getTurnOrderFacingRotation("top", "outward")).toBe(180);
    expect(getTurnOrderFacingRotation("top", "inward")).toBe(0);
    expect(getTurnOrderFacingRotation("right", "outward")).toBe(-90);
    expect(getTurnOrderFacingRotation("right", "inward")).toBe(90);
    expect(getTurnOrderFacingRotation("bottom", "outward")).toBe(0);
    expect(getTurnOrderFacingRotation("bottom", "inward")).toBe(180);
    expect(getTurnOrderFacingRotation("left", "outward")).toBe(90);
    expect(getTurnOrderFacingRotation("left", "inward")).toBe(270);
  });

  it("builds visible Player View turn order state", () => {
    const turnOrder = {
      currentEntryId: "entry-2",
      entries: [
        { id: "entry-1", name: "Hidden", initiative: 20, visibleInPlayer: false },
        { id: "entry-2", name: "Current", initiative: 15, visibleInPlayer: true },
        { id: "entry-3", name: "Next", initiative: 10, visibleInPlayer: true }
      ]
    };

    expect(getVisibleTurnOrderState(turnOrder)).toMatchObject({
      entries: [turnOrder.entries[1], turnOrder.entries[2]],
      displayedEntries: [turnOrder.entries[1], turnOrder.entries[2]],
      currentIndex: 0,
      currentEntry: turnOrder.entries[1],
      nextEntry: turnOrder.entries[2]
    });
  });

  it("wraps next visible turn entry and tolerates a hidden current entry", () => {
    const entries = [
      { id: "entry-1", name: "First", initiative: 20, visibleInPlayer: true },
      { id: "entry-2", name: "Hidden Current", initiative: 15, visibleInPlayer: false },
      { id: "entry-3", name: "Last", initiative: 10, visibleInPlayer: true }
    ];

    expect(getVisibleTurnOrderState({ currentEntryId: "entry-3", entries })).toMatchObject({
      currentIndex: 1,
      currentEntry: entries[2],
      nextEntry: entries[0]
    });
    expect(getVisibleTurnOrderState({ currentEntryId: "entry-2", entries })).toMatchObject({
      currentIndex: 0,
      currentEntry: null,
      nextEntry: entries[2]
    });
  });

  it("pins the current Player View tracker entry first and counts hidden entries until wrap", () => {
    const entries = Array.from({ length: 12 }, (_, index) => ({
      id: `entry-${index + 1}`,
      name: `Entry ${index + 1}`,
      initiative: 20 - index,
      visibleInPlayer: true
    }));

    expect(getVisibleTurnOrderState({ currentEntryId: "entry-8", entries, playerViewMaxEntries: 5 }).displayedEntries.map((entry) => entry.id)).toEqual([
      "entry-8",
      "entry-9",
      "entry-10",
      "entry-11",
      "entry-12"
    ]);
    expect(getVisibleTurnOrderState({ currentEntryId: "entry-11", entries, playerViewMaxEntries: 5 }).displayedEntries.map((entry) => entry.id)).toEqual([
      "entry-11",
      "entry-12",
      "entry-1",
      "entry-2",
      "entry-3"
    ]);
    expect(getVisibleTurnOrderState({ currentEntryId: "entry-3", entries, playerViewMaxEntries: 5 }).hiddenEntryCount).toBe(5);
    expect(getVisibleTurnOrderState({ currentEntryId: "entry-8", entries, playerViewMaxEntries: 5 }).hiddenEntryCount).toBe(0);
    expect(getVisibleTurnOrderState({ currentEntryId: "entry-11", entries, playerViewMaxEntries: 5 }).hiddenEntryCount).toBe(0);
  });
});
