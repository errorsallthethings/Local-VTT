import { describe, expect, it } from "vitest";
import { getDimensionDifferenceWarning, getLargestRatio } from "../../electron/mapReplacementWarnings";

describe("map replacement warnings", () => {
  it("does not warn when either map dimension could not be read", () => {
    expect(getDimensionDifferenceWarning(undefined, { width: 4000, height: 3000 })).toBeNull();
    expect(getDimensionDifferenceWarning({ width: 4000, height: 3000 }, undefined)).toBeNull();
  });

  it("does not warn for small dimension and aspect changes", () => {
    expect(getDimensionDifferenceWarning({ width: 4000, height: 3000 }, { width: 4200, height: 3100 })).toBeNull();
  });

  it("warns when map dimensions differ enough to affect alignment", () => {
    expect(getDimensionDifferenceWarning({ width: 4000, height: 3000 }, { width: 5200, height: 3000 })).toBe(
      [
        "Current map: 4000 x 3000",
        "Replacement map: 5200 x 3000",
        "The scene keeps its current grid, calibration, fog, drawings, tokens, and effects. Review alignment after replacing the map."
      ].join("\n")
    );
  });

  it("warns when aspect ratio changes even if individual dimensions are close", () => {
    expect(getDimensionDifferenceWarning({ width: 1000, height: 1000 }, { width: 1100, height: 900 })).toContain("Review alignment after replacing the map.");
  });

  it("treats nonpositive ratio inputs as equivalent", () => {
    expect(getLargestRatio(0, 10)).toBe(1);
    expect(getLargestRatio(-1, 10)).toBe(1);
  });

  it("returns the larger-to-smaller ratio for positive values", () => {
    expect(getLargestRatio(4, 10)).toBe(2.5);
    expect(getLargestRatio(10, 4)).toBe(2.5);
  });
});
