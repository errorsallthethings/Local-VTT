import { describe, expect, it } from "vitest";
import {
  getDrawingPreviewPoints,
  isMeaningfulDrawingPreview,
  shouldAddDrawingPoint,
  type DrawingPreview
} from "../../src/renderer/canvas/drawingRenderer";

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
});
