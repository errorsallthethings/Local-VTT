import { describe, expect, it } from "vitest";
import {
  clampDicePanelPosition,
  getDicePanelDragPosition,
  getDicePanelDragStart,
  getDicePanelPresentation,
  getDicePanelPositionInViewport
} from "../../src/renderer/lib/dice";

describe("dice panel position helpers", () => {
  it("keeps panel positions inside viewport margins", () => {
    const viewport = { width: 800, height: 600 };
    const size = { width: 300, height: 200 };

    expect(clampDicePanelPosition(-20, -30, viewport, size)).toEqual({ x: 8, y: 8 });
    expect(clampDicePanelPosition(700, 500, viewport, size)).toEqual({ x: 492, y: 392 });
    expect(clampDicePanelPosition(120, 140, viewport, size)).toEqual({ x: 120, y: 140 });
  });

  it("uses the default dice panel size when no size is available", () => {
    expect(clampDicePanelPosition(900, 900, { width: 1000, height: 800 }, null)).toEqual({ x: 692, y: 272 });
  });

  it("clamps oversized panels to the viewport margin instead of returning negative coordinates", () => {
    expect(clampDicePanelPosition(100, 100, { width: 260, height: 300 }, { width: 400, height: 500 })).toEqual({ x: 8, y: 8 });
  });

  it("honors a custom margin", () => {
    expect(clampDicePanelPosition(0, 0, { width: 800, height: 600 }, { width: 300, height: 200 }, 16)).toEqual({ x: 16, y: 16 });
  });

  it("builds drag state from the grabbed offset", () => {
    expect(getDicePanelDragStart(7, 150, 180, { left: 100, top: 120, width: 300, height: 200 })).toEqual({
      pointerId: 7,
      offsetX: 50,
      offsetY: 60
    });
  });

  it("derives dragged panel position from pointer movement", () => {
    const drag = getDicePanelDragStart(7, 150, 180, { left: 100, top: 120, width: 300, height: 200 });

    expect(getDicePanelDragPosition(drag, 250, 300, { width: 800, height: 600 }, { left: 100, top: 120, width: 300, height: 200 })).toEqual({
      x: 200,
      y: 240
    });
    expect(getDicePanelDragPosition(drag, 900, 900, { width: 800, height: 600 }, { left: 100, top: 120, width: 300, height: 200 })).toEqual({
      x: 492,
      y: 392
    });
  });

  it("wraps viewport-aware panel clamping for DOM rect callers", () => {
    expect(getDicePanelPositionInViewport(700, 500, { width: 800, height: 600 }, { left: 0, top: 0, width: 300, height: 200 })).toEqual({
      x: 492,
      y: 392
    });
  });

  it("builds floating panel presentation without positional styles", () => {
    expect(getDicePanelPresentation(null, null, false)).toEqual({
      className: "dice-popover dice-popover-floating",
      style: {}
    });
  });

  it("builds dragged and resized panel presentation", () => {
    expect(getDicePanelPresentation({ x: 24, y: 36 }, { width: 320, height: 480 }, false)).toEqual({
      className: "dice-popover dice-popover-dragged",
      style: {
        left: 24,
        top: 36,
        width: 320,
        height: 480
      }
    });
  });

  it("omits resized height when the panel is collapsed", () => {
    expect(getDicePanelPresentation({ x: 24, y: 36 }, { width: 320, height: 480 }, true)).toEqual({
      className: "dice-popover dice-popover-dragged dice-popover-collapsed",
      style: {
        left: 24,
        top: 36,
        width: 320,
        height: undefined
      }
    });
  });
});
