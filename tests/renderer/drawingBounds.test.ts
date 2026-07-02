import { describe, expect, it } from "vitest";
import { getDrawingBounds } from "../../src/renderer/canvas/drawings";
import { createDefaultScene, type DrawingElement } from "../../src/shared/localvtt";

describe("drawing bounds", () => {
  it("returns null for drawings without points", () => {
    expect(getDrawingBounds(drawing({ points: [] }))).toBeNull();
  });

  it("includes stroke inset for regular point bounds", () => {
    expect(getDrawingBounds(drawing({ kind: "rectangle", points: [{ x: 10, y: 20 }, { x: 50, y: 80 }], strokeWidth: 8 }))).toEqual({
      left: 6,
      top: 16,
      right: 54,
      bottom: 84
    });
  });

  it("bounds circles by radius instead of only control points", () => {
    expect(getDrawingBounds(drawing({ kind: "circle", points: [{ x: 100, y: 100 }, { x: 130, y: 100 }], strokeWidth: 10 }))).toEqual({
      left: 65,
      top: 65,
      right: 135,
      bottom: 135
    });
  });

  it("uses measured corridor width for line templates", () => {
    const scene = createDefaultScene("Line template");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "euclidean" };

    expect(
      getDrawingBounds(
        drawing({
          kind: "line",
          points: [{ x: 0, y: 0 }, { x: 200, y: 0 }],
          measurementLabelVisible: true,
          templateWidth: 10,
          strokeWidth: 8
        }),
        scene.grid
      )
    ).toEqual({
      left: -4,
      top: -104,
      right: 204,
      bottom: 104
    });
  });
});

function drawing(patch: Partial<DrawingElement>): DrawingElement {
  return {
    id: "drawing",
    kind: "line",
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    color: "#ffffff",
    opacity: 1,
    strokeWidth: 4,
    visibleInPlayer: true,
    ...patch
  };
}
