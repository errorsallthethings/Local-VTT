import { describe, expect, it } from "vitest";
import { getPathDistance, getPathMidpoint, getPointAlongPath, hasMeaningfulPath, normalizeMovementPath } from "../../src/renderer/canvas/movementPath";

describe("movement path helpers", () => {
  it("removes near-duplicate points while preserving meaningful turns", () => {
    expect(
      normalizeMovementPath([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 10, y: 0 },
        { x: 10, y: 1 },
        { x: 20, y: 0 }
      ])
    ).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 }
    ]);
  });

  it("measures full path distance across waypoints", () => {
    expect(getPathDistance([{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 6, y: 4 }])).toBe(8);
  });

  it("finds a point at a distance along a multi-segment path", () => {
    expect(getPointAlongPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], 15)).toEqual({ x: 10, y: 5 });
  });

  it("uses total path distance to find the midpoint", () => {
    expect(getPathMidpoint([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }])).toEqual({ x: 10, y: 0 });
  });

  it("ignores tiny movement when deciding whether a path is meaningful", () => {
    expect(hasMeaningfulPath([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
    expect(hasMeaningfulPath([{ x: 0, y: 0 }, { x: 3, y: 0 }])).toBe(true);
  });
});
