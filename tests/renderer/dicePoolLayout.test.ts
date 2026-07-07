import { describe, expect, it } from "vitest";
import {
  getDicePoolLayout,
  getDicePoolPosition,
  getPanelDiceLanding,
  getSceneDiceLanding,
  getSceneDiceSizeScale,
  getSceneRollBounds,
  type DicePoolLayout
} from "../../src/renderer/lib/dice";

describe("dice pool layout helpers", () => {
  it("chooses compact panel layouts as dice count grows", () => {
    expect(getDicePoolLayout(1, "panel")).toEqual({ count: 1, columns: 1, rows: 1, scale: 1, xSpacing: 1.2, ySpacing: 1.02 });
    expect(getDicePoolLayout(4, "panel")).toEqual({ count: 4, columns: 2, rows: 2, scale: 0.54, xSpacing: 1.62, ySpacing: 1.56 });
    expect(getDicePoolLayout(9, "panel")).toEqual({ count: 9, columns: 4, rows: 3, scale: 0.32, xSpacing: 1.16, ySpacing: 1.08 });
  });

  it("scales scene layouts from scene size preferences", () => {
    expect(getSceneDiceSizeScale("xs")).toBe(0.55);
    expect(getSceneDiceSizeScale("md")).toBe(1);
    expect(getSceneDiceSizeScale("xl")).toBe(1.75);
    expect(getDicePoolLayout(2, "scene", "lg")).toEqual({ count: 2, columns: 2, rows: 1, scale: 0.5940000000000001, xSpacing: 1.35, ySpacing: 1.62 });
  });

  it("centers partial last rows", () => {
    const layout: DicePoolLayout = { count: 5, columns: 4, rows: 2, scale: 0.32, xSpacing: 1.16, ySpacing: 1.08 };

    expect(getDicePoolPosition(0, layout)).toEqual({ x: -1.7399999999999998, y: 0.78 });
    expect(getDicePoolPosition(3, layout)).toEqual({ x: 1.7399999999999998, y: 0.78 });
    expect(getDicePoolPosition(4, layout)).toEqual({ x: 0, y: -0.30000000000000004 });
  });

  it("uses the arranged position for panel landings", () => {
    const layout = getDicePoolLayout(2, "panel");

    expect(getPanelDiceLanding(0, layout)).toEqual({ baseX: -1.14, baseY: 0, startX: -1.14, startY: 0 });
    expect(getPanelDiceLanding(1, layout)).toEqual({ baseX: 1.14, baseY: 0, startX: 1.14, startY: 0 });
  });

  it("derives physics roll bounds from visible world dimensions", () => {
    expect(getSceneRollBounds({ width: 12, height: 8 })).toEqual({ minX: -6, maxX: 6, minY: -4, maxY: 4 });
  });

  it("keeps seeded scene landings inside visible bounds", () => {
    const layout = getDicePoolLayout(6, "scene", "md");
    const landing = getSceneDiceLanding(4, layout, { die: "d20", result: 17, label: "17", seed: 0.371 }, { width: 10, height: 6 });
    const margin = Math.max(0.62, layout.scale * 1.85);
    const landingWidth = Math.max(margin * 2, 10 - margin * 2);
    const landingHeight = Math.max(margin * 2, 6 - margin * 2);

    expect(landing.baseX).toBeGreaterThanOrEqual(-landingWidth / 2 + margin);
    expect(landing.baseX).toBeLessThanOrEqual(landingWidth / 2 - margin);
    expect(landing.baseY).toBeGreaterThanOrEqual(-landingHeight / 2 + margin);
    expect(landing.baseY).toBeLessThanOrEqual(landingHeight / 2 - margin);
    expect(Math.abs(landing.startX) >= margin || Math.abs(landing.startY) >= margin).toBe(true);
  });
});
