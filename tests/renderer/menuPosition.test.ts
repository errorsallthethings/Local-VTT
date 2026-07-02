import { describe, expect, it } from "vitest";
import { calculateCanvasContextMenuPosition, calculateFloatingMenuPosition, getEstimatedCanvasContextMenuSize, type MenuRect } from "../../src/renderer/lib/ui";

function rect(partial: Partial<MenuRect>): MenuRect {
  return {
    top: 100,
    right: 220,
    bottom: 132,
    left: 180,
    width: 40,
    height: 32,
    ...partial
  };
}

describe("calculateFloatingMenuPosition", () => {
  it("opens below the anchor when there is room", () => {
    expect(
      calculateFloatingMenuPosition({
        anchorRect: rect({ top: 80, bottom: 112, right: 220 }),
        menuWidth: 150,
        menuHeight: 120,
        viewportWidth: 800,
        viewportHeight: 600
      })
    ).toEqual({ top: 118, left: 70 });
  });

  it("flips above the anchor when the menu would run below the viewport", () => {
    expect(
      calculateFloatingMenuPosition({
        anchorRect: rect({ top: 520, bottom: 552, right: 220 }),
        menuWidth: 150,
        menuHeight: 160,
        viewportWidth: 800,
        viewportHeight: 600
      })
    ).toEqual({ top: 354, left: 70 });
  });

  it("clamps menus against the right viewport edge", () => {
    expect(
      calculateFloatingMenuPosition({
        anchorRect: rect({ top: 80, bottom: 112, right: 900 }),
        menuWidth: 180,
        menuHeight: 120,
        viewportWidth: 800,
        viewportHeight: 600
      })
    ).toEqual({ top: 118, left: 614 });
  });

  it("clamps menus against the left viewport edge", () => {
    expect(
      calculateFloatingMenuPosition({
        anchorRect: rect({ top: 80, bottom: 112, right: 90 }),
        menuWidth: 180,
        menuHeight: 120,
        viewportWidth: 800,
        viewportHeight: 600
      })
    ).toEqual({ top: 118, left: 6 });
  });

  it("keeps oversized menus inside the viewport padding instead of returning negative coordinates", () => {
    expect(
      calculateFloatingMenuPosition({
        anchorRect: rect({ top: 20, bottom: 52, right: 90 }),
        menuWidth: 320,
        menuHeight: 420,
        viewportWidth: 260,
        viewportHeight: 300
      })
    ).toEqual({ top: 6, left: 6 });
  });

  it("honors custom gap and viewport padding", () => {
    expect(
      calculateFloatingMenuPosition({
        anchorRect: rect({ top: 80, bottom: 112, right: 220 }),
        menuWidth: 150,
        menuHeight: 120,
        viewportWidth: 800,
        viewportHeight: 600,
        gap: 10,
        viewportPadding: 12
      })
    ).toEqual({ top: 122, left: 70 });
  });
});

describe("calculateCanvasContextMenuPosition", () => {
  it("opens down and right from the pointer when there is room", () => {
    expect(
      calculateCanvasContextMenuPosition({
        anchorX: 100,
        anchorY: 120,
        kind: "drawing",
        viewportWidth: 800,
        viewportHeight: 600
      })
    ).toEqual({ x: 108, y: 128 });
  });

  it("flips left and up near the lower-right viewport edge", () => {
    expect(
      calculateCanvasContextMenuPosition({
        anchorX: 780,
        anchorY: 580,
        kind: "token",
        viewportWidth: 800,
        viewportHeight: 600
      })
    ).toEqual({ x: 472, y: 32 });
  });

  it("clamps oversized context menus to the viewport padding", () => {
    expect(
      calculateCanvasContextMenuPosition({
        anchorX: 40,
        anchorY: 40,
        kind: "token",
        viewportWidth: 260,
        viewportHeight: 300
      })
    ).toEqual({ x: 12, y: 12 });
  });

  it("uses stable menu size estimates by kind", () => {
    expect(getEstimatedCanvasContextMenuSize("token")).toEqual({ width: 300, height: 540 });
    expect(getEstimatedCanvasContextMenuSize("drawing")).toEqual({ width: 260, height: 270 });
    expect(getEstimatedCanvasContextMenuSize("mask")).toEqual({ width: 230, height: 250 });
    expect(getEstimatedCanvasContextMenuSize("environment")).toEqual({ width: 230, height: 250 });
  });
});
