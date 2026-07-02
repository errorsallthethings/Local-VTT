import { describe, expect, it } from "vitest";
import { getDrawingAtPoint, isDrawingVisible } from "../../src/renderer/canvas/drawings";
import { createDefaultScene, type DrawingElement } from "../../src/shared/localvtt";

describe("drawing hit testing", () => {
  it("finds the topmost visible drawing near a point", () => {
    expect(
      getDrawingAtPoint(
        [
          drawing({ id: "line", kind: "line", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }),
          drawing({ id: "circle", kind: "circle", points: [{ x: 50, y: 50 }, { x: 75, y: 50 }] })
        ],
        { x: 52, y: 50 }
      )?.id
    ).toBe("circle");
  });

  it("ignores drawings hidden in the GM view", () => {
    expect(getDrawingAtPoint([drawing({ id: "hidden", kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 100, y: 100 }], visibleInGm: false })], { x: 50, y: 50 })).toBeNull();
  });

  it("selects line templates across their grid-measured corridor width", () => {
    const scene = createDefaultScene("Line template");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "euclidean" };
    const lineTemplate = drawing({
      id: "line-template",
      kind: "line",
      points: [{ x: 0, y: 0 }, { x: 200, y: 0 }],
      templateWidth: 5,
      measurementLabelVisible: true
    });

    expect(getDrawingAtPoint([lineTemplate], { x: 100, y: 49 }, 8, scene.grid)?.id).toBe("line-template");
    expect(getDrawingAtPoint([lineTemplate], { x: 100, y: 60 }, 8, scene.grid)).toBeNull();
  });

  it("applies GM and player visibility defaults", () => {
    expect(isDrawingVisible(drawing({}), "gm")).toBe(true);
    expect(isDrawingVisible(drawing({}), "player")).toBe(true);
    expect(isDrawingVisible(drawing({ visibleInGm: false }), "gm")).toBe(false);
    expect(isDrawingVisible(drawing({ visibleInPlayer: false }), "player")).toBe(false);
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
