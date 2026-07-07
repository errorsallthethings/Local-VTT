import { describe, expect, it } from "vitest";
import { degreesToRadians, getEffectWorldOrigin, getEffectWorldSize } from "../../src/renderer/canvas/effects";

describe("environment effect renderer math", () => {
  it("converts screen bounds to effect world origin using camera zoom", () => {
    expect(getEffectWorldOrigin({ x: 220, y: 140, width: 300, height: 200 }, { x: 20, y: 40, zoom: 2 })).toEqual({
      x: 100,
      y: 50
    });
  });

  it("clamps near-zero zoom when computing world origin and size", () => {
    expect(getEffectWorldOrigin({ x: 1, y: 2, width: 0.002, height: 0.004 }, { x: 0, y: 0, zoom: 0 })).toEqual({
      x: 100,
      y: 200
    });
    expect(getEffectWorldSize({ x: 0, y: 0, width: 0.002, height: 0.004 }, { x: 0, y: 0, zoom: 0 })).toEqual({
      width: 1,
      height: 1
    });
  });

  it("converts degrees to radians", () => {
    expect(degreesToRadians(180)).toBe(Math.PI);
    expect(degreesToRadians(90)).toBe(Math.PI / 2);
  });
});
