import { describe, expect, it } from "vitest";
import {
  easeInCubic,
  easeOutCubic,
  getEdgeSlideTransform,
  getPlayerSeatStyle,
  getPlayerTurnStatusLabel,
  getPlayerTurnStatusStyle,
  getTurnOrderFacingRotation,
  getTurnOrderPlayerBarLayout
} from "../../src/renderer/lib/playerViewTurnOrder";

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
      left: "12px",
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
});
