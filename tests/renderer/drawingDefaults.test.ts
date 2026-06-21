import { describe, expect, it } from "vitest";
import { duplicateDrawingElement, DUPLICATE_DRAWING_OFFSET_PX, getDuplicateDrawingName } from "../../src/renderer/lib/drawings";
import type { DrawingElement } from "../../src/shared/localvtt";

describe("drawing defaults", () => {
  it("generates duplicate drawing names without re-copying copy suffixes", () => {
    const drawings = [
      { id: "one", name: "Template Line", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true },
      { id: "two", name: "Template Line Copy", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true },
      { id: "three", name: "template line copy 2", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true }
    ] as DrawingElement[];

    expect(getDuplicateDrawingName("Template Line Copy", drawings)).toBe("Template Line Copy 3");
  });

  it("duplicates drawings while preserving template settings and offsetting points", () => {
    const source = {
      id: "source",
      name: "Web Line",
      kind: "line",
      points: [{ x: 10, y: 20 }, { x: 110, y: 20 }],
      color: "#7dd3fc",
      opacity: 0.8,
      strokeWidth: 8,
      templateEffect: "web",
      templateFootprintVisible: true,
      templateWidth: 10,
      measurementLabelVisible: true,
      visibleInPlayer: false
    } as const satisfies DrawingElement;

    const duplicate = duplicateDrawingElement(source, [source], "duplicate");

    expect(duplicate).toMatchObject({
      id: "duplicate",
      name: "Web Line Copy",
      templateEffect: "web",
      templateFootprintVisible: true,
      templateWidth: 10,
      measurementLabelVisible: true,
      visibleInPlayer: false
    });
    expect(duplicate.points).toEqual([
      { x: 10 + DUPLICATE_DRAWING_OFFSET_PX, y: 20 + DUPLICATE_DRAWING_OFFSET_PX },
      { x: 110 + DUPLICATE_DRAWING_OFFSET_PX, y: 20 + DUPLICATE_DRAWING_OFFSET_PX }
    ]);
  });
});
