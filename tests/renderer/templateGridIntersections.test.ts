import { describe, expect, it } from "vitest";
import { doesRectIntersectCircle, doesRectIntersectPolygon, doRectsIntersect } from "../../src/renderer/canvas/drawings";

describe("template grid intersections", () => {
  it("detects rectangle overlap using strict edge intersections", () => {
    expect(doRectsIntersect({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 5, top: 5, right: 15, bottom: 15 })).toBe(true);
    expect(doRectsIntersect({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 10, top: 0, right: 20, bottom: 10 })).toBe(false);
  });

  it("detects circle and polygon intersections with grid cells", () => {
    expect(doesRectIntersectCircle({ left: 0, top: 0, right: 10, bottom: 10 }, { x: 5, y: 5 }, 6)).toBe(true);
    expect(doesRectIntersectCircle({ left: 0, top: 0, right: 10, bottom: 10 }, { x: 30, y: 30 }, 6)).toBe(false);
    expect(doesRectIntersectPolygon({ left: 0, top: 0, right: 10, bottom: 10 }, [{ x: 5, y: -5 }, { x: 15, y: 5 }, { x: 5, y: 15 }])).toBe(true);
    expect(doesRectIntersectPolygon({ left: 0, top: 0, right: 10, bottom: 10 }, [{ x: 20, y: 20 }, { x: 30, y: 20 }, { x: 20, y: 30 }])).toBe(false);
  });
});
