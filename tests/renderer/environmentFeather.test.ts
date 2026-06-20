import { describe, expect, it } from "vitest";
import {
  getDistanceToPolygonEdge,
  getDistanceToSegment,
  getEnvironmentFeatherAlpha,
  isPointInPolygon,
  roundMaskValue
} from "../../src/renderer/canvas/environmentFeather";

describe("environment feather helpers", () => {
  it("clamps and curves feather alpha progress", () => {
    expect(getEnvironmentFeatherAlpha(-1)).toBe(0);
    expect(getEnvironmentFeatherAlpha(0)).toBe(0);
    expect(getEnvironmentFeatherAlpha(1)).toBe(1);
    expect(getEnvironmentFeatherAlpha(2)).toBe(1);
    expect(getEnvironmentFeatherAlpha(0.5)).toBeCloseTo(Math.pow(0.5, 1.85));
  });

  it("rounds mask cache values to one decimal place", () => {
    expect(roundMaskValue(1.24)).toBe(1.2);
    expect(roundMaskValue(1.25)).toBe(1.3);
  });

  it("detects points inside polygons", () => {
    const polygon = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];

    expect(isPointInPolygon({ x: 5, y: 5 }, polygon)).toBe(true);
    expect(isPointInPolygon({ x: 15, y: 5 }, polygon)).toBe(false);
  });

  it("measures distance to a segment and handles degenerate segments", () => {
    expect(getDistanceToSegment({ x: 5, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(4);
    expect(getDistanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
  });

  it("measures nearest distance to polygon edges", () => {
    const polygon = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];

    expect(getDistanceToPolygonEdge({ x: 5, y: 5 }, polygon)).toBe(5);
    expect(getDistanceToPolygonEdge({ x: 9, y: 5 }, polygon)).toBe(1);
  });
});
