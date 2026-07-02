import { describe, expect, it } from "vitest";
import { clampDicePanelPosition } from "../../src/renderer/lib/dice";

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
});
