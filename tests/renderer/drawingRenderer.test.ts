import { describe, expect, it } from "vitest";
import {
  getTemplateLabel,
  getConeTriangle,
  getDrawingPreviewPoints,
  getDrawingAtPoint,
  isMeaningfulDrawingPreview,
  shouldAddDrawingPoint,
  type DrawingPreview
} from "../../src/renderer/canvas/drawingRenderer";
import { createDefaultScene } from "../../src/shared/localvtt";

describe("drawing renderer helpers", () => {
  it("keeps line previews to start and current points", () => {
    const preview: DrawingPreview = {
      pointerId: 1,
      kind: "line",
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 40 }
      ],
      current: { x: 50, y: 60 },
      color: "#f6d365",
      opacity: 1,
      strokeWidth: 6
    };

    expect(getDrawingPreviewPoints(preview)).toEqual([
      { x: 10, y: 20 },
      { x: 50, y: 60 }
    ]);
  });

  it("keeps template previews to start and current points", () => {
    const preview: DrawingPreview = {
      pointerId: 1,
      kind: "circle",
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 40 }
      ],
      current: { x: 50, y: 60 },
      color: "#f6d365",
      opacity: 1,
      strokeWidth: 80
    };

    expect(getDrawingPreviewPoints(preview)).toEqual([
      { x: 10, y: 20 },
      { x: 50, y: 60 }
    ]);
    expect(getDrawingPreviewPoints({ ...preview, kind: "rectangle" })).toEqual([
      { x: 10, y: 20 },
      { x: 50, y: 60 }
    ]);
    expect(getDrawingPreviewPoints({ ...preview, kind: "cone" })).toEqual([
      { x: 10, y: 20 },
      { x: 50, y: 60 }
    ]);
  });

  it("filters tiny freehand movements", () => {
    expect(shouldAddDrawingPoint({ x: 10, y: 10 }, { x: 11, y: 11 })).toBe(false);
    expect(shouldAddDrawingPoint({ x: 10, y: 10 }, { x: 14, y: 10 })).toBe(true);
  });

  it("requires meaningful drag distance before committing", () => {
    const preview: DrawingPreview = {
      pointerId: 1,
      kind: "freehand",
      points: [{ x: 10, y: 10 }],
      current: { x: 11, y: 11 },
      color: "#f6d365",
      opacity: 1,
      strokeWidth: 6
    };

    expect(isMeaningfulDrawingPreview(preview)).toBe(false);
    expect(isMeaningfulDrawingPreview({ ...preview, current: { x: 20, y: 10 } })).toBe(true);
  });

  it("labels cube templates by side length instead of diagonal distance", () => {
    const scene = createDefaultScene("Templates");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "euclidean" };

    expect(
      getTemplateLabel(
        {
          id: "cube",
          kind: "rectangle",
          points: [{ x: 0, y: 0 }, { x: 200, y: 200 }],
          color: "#7dd3fc",
          opacity: 1,
          strokeWidth: 16,
          measurementLabelVisible: true,
          visibleInPlayer: true
        },
        scene
      )
    ).toBe("10 feet square");
  });

  it("labels line templates with length and width while radius and cone use origin to edge", () => {
    const scene = createDefaultScene("Templates");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "euclidean" };
    const base = {
      id: "template",
      points: [{ x: 0, y: 0 }, { x: 300, y: 400 }],
      color: "#7dd3fc",
      opacity: 1,
      strokeWidth: 16,
      measurementLabelVisible: true,
      visibleInPlayer: true
    } as const;

    expect(getTemplateLabel({ ...base, kind: "line" }, scene)).toBe("25 feet x 5 feet");
    expect(getTemplateLabel({ ...base, kind: "line", templateWidth: 10 }, scene)).toBe("25 feet x 10 feet");
    expect(getTemplateLabel({ ...base, kind: "line", templateWidth: 0 }, scene)).toBe("25 feet");
    expect(getTemplateLabel({ ...base, kind: "circle" }, scene)).toBe("25 feet radius");
    expect(getTemplateLabel({ ...base, kind: "cone" }, scene)).toBe("25 feet cone");
  });

  it("uses the dragged point as the cone template far-edge center", () => {
    const triangle = getConeTriangle([
      { x: 0, y: 0 },
      { x: 200, y: 0 }
    ]);

    expect(triangle).not.toBeNull();
    const [, left, right] = triangle!;
    expect({ x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 }).toEqual({ x: 200, y: 0 });
    expect(Math.hypot(left.x - right.x, left.y - right.y)).toBe(200);
  });
});

describe("drawing hit testing", () => {
  it("finds the topmost drawing near a point", () => {
    expect(
      getDrawingAtPoint(
        [
          { id: "line", kind: "line", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }], color: "#fff", opacity: 1, strokeWidth: 4, visibleInPlayer: true },
          { id: "circle", kind: "circle", points: [{ x: 50, y: 50 }, { x: 75, y: 50 }], color: "#fff", opacity: 1, strokeWidth: 4, visibleInPlayer: true }
        ],
        { x: 52, y: 50 }
      )?.id
    ).toBe("circle");
  });

  it("ignores drawings hidden in the GM view", () => {
    expect(
      getDrawingAtPoint(
        [{ id: "hidden", kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 100, y: 100 }], color: "#fff", opacity: 1, strokeWidth: 4, visibleInGm: false, visibleInPlayer: true }],
        { x: 50, y: 50 }
      )
    ).toBeNull();
  });
});
