import { describe, expect, it } from "vitest";
import { getTemplateGridHighlightCells } from "../../src/renderer/canvas/drawings";
import { createDefaultScene, type DrawingElement } from "../../src/shared/localvtt";

describe("template grid highlights", () => {
  it("returns no cells for drawings without bounds", () => {
    const scene = createDefaultScene("Empty template");

    expect(getTemplateGridHighlightCells(drawing({ points: [] }), scene.grid)).toEqual([]);
  });

  it("selects square grid cells touched by a cube template", () => {
    const scene = createDefaultScene("Cube template");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;

    expect(getTemplateGridHighlightCells(drawing({ kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 200, y: 200 }] }), scene.grid)).toEqual([
      { x: 50, y: 50 },
      { x: 150, y: 50 },
      { x: 50, y: 150 },
      { x: 150, y: 150 }
    ]);
  });

  it("uses measured width for square-grid line templates", () => {
    const scene = createDefaultScene("Line template");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "euclidean" };

    expect(
      getTemplateGridHighlightCells(
        drawing({
          kind: "line",
          points: [{ x: 0, y: 0 }, { x: 200, y: 0 }],
          templateWidth: 5
        }),
        scene.grid
      )
    ).toEqual([
      { x: 50, y: -50 },
      { x: 150, y: -50 },
      { x: 50, y: 50 },
      { x: 150, y: 50 }
    ]);
  });

  it("returns bounded hex cells for hex templates", () => {
    const scene = createDefaultScene("Hex template");
    scene.grid.type = "hex";
    scene.grid.sizePx = 100;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;

    const cells = getTemplateGridHighlightCells(drawing({ kind: "circle", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }), scene.grid);

    expect(cells.length).toBeGreaterThan(0);
    expect(cells.length).toBeLessThan(20);
    expect(cells).toContainEqual({ x: 0, y: 0 });
  });
});

function drawing(patch: Partial<DrawingElement>): DrawingElement {
  return {
    id: "template",
    kind: "line",
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    color: "#7dd3fc",
    opacity: 1,
    strokeWidth: 8,
    templateWidth: 5,
    measurementLabelVisible: true,
    visibleInPlayer: true,
    ...patch
  };
}
