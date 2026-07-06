import { describe, expect, it } from "vitest";
import type { DrawingElement } from "../../src/shared/localvtt";
import { getDrawingRowState } from "../../src/renderer/components/layers/panel/drawingRowState";

function createDrawing(overrides: Partial<DrawingElement> = {}): DrawingElement {
  return {
    id: "drawing-1",
    kind: "rectangle",
    points: [],
    visibleInPlayer: false,
    ...overrides
  };
}

describe("getDrawingRowState", () => {
  it("uses trimmed names and derives visibility, selection, and drop placement", () => {
    const state = getDrawingRowState({
      draggedDrawingId: "drawing-2",
      drawing: createDrawing({ name: "  North Wall  ", visibleInGm: false, visibleInPlayer: true }),
      drawingDropTarget: { itemId: "drawing-1", placement: "after" },
      drawingIndex: 0,
      selectedIds: new Set(["drawing-1"])
    });

    expect(state).toEqual({
      dropPlacement: "after",
      isDragging: false,
      isSelected: true,
      isVisibleInGm: false,
      isVisibleInPlayer: true,
      label: "North Wall"
    });
  });

  it("falls back to the default drawing name and suppresses self drop placement", () => {
    const state = getDrawingRowState({
      draggedDrawingId: "drawing-1",
      drawing: createDrawing({ name: " ", kind: "circle", visibleInGm: undefined }),
      drawingDropTarget: { itemId: "drawing-1", placement: "before" },
      drawingIndex: 2,
      selectedIds: new Set()
    });

    expect(state).toMatchObject({
      dropPlacement: null,
      isDragging: true,
      isSelected: false,
      isVisibleInGm: true,
      label: "Circle 3"
    });
  });
});
