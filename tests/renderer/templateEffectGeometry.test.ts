import { describe, expect, it } from "vitest";
import { createSeededRandom, getLineTemplateCorridorPoints, getRectanglePathPoints, hashString, pointsSeed, scalePointsToCenter } from "../../src/renderer/canvas/drawings";
import type { DrawingElement } from "../../src/shared/localvtt";

describe("template effect geometry", () => {
  it("creates line template corridor points from template width", () => {
    expect(getLineTemplateCorridorPoints(lineTemplate({ templateWidth: 10 }), 1)).toEqual([
      { x: 0, y: 50 },
      { x: 100, y: 50 },
      { x: 100, y: -50 },
      { x: 0, y: -50 }
    ]);
  });

  it("returns null for line corridors without a usable segment", () => {
    expect(getLineTemplateCorridorPoints(lineTemplate({ points: [{ x: 0, y: 0 }] }))).toBeNull();
    expect(getLineTemplateCorridorPoints(lineTemplate({ points: [{ x: 0, y: 0 }, { x: 0, y: 0 }] }))).toBeNull();
  });

  it("builds rectangle path points from opposite corners", () => {
    expect(getRectanglePathPoints([{ x: 0, y: 0 }, { x: 10, y: 20 }])).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 20 },
      { x: 0, y: 20 }
    ]);
  });

  it("scales points around their center", () => {
    expect(scalePointsToCenter([{ x: 0, y: 0 }, { x: 10, y: 10 }], 0.5)).toEqual([
      { x: 2.5, y: 2.5 },
      { x: 7.5, y: 7.5 }
    ]);
  });

  it("creates stable point seeds and seeded random sequences", () => {
    expect(pointsSeed([{ x: 1.24, y: 5.56 }])).toBe("12,56");
    expect(hashString("local-vtt")).toBe(hashString("local-vtt"));
    const firstRandom = createSeededRandom(42);
    const secondRandom = createSeededRandom(42);
    expect([firstRandom(), firstRandom(), firstRandom()]).toEqual([secondRandom(), secondRandom(), secondRandom()]);
  });
});

function lineTemplate(patch: Partial<DrawingElement>): DrawingElement {
  return {
    id: "line-template",
    kind: "line",
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    color: "#7dd3fc",
    opacity: 1,
    strokeWidth: 8,
    templateWidth: 10,
    measurementLabelVisible: true,
    visibleInPlayer: true,
    ...patch
  };
}
