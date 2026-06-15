import { describe, expect, it } from "vitest";
import {
  FOG_GRID_SNAP_HINT,
  RULER_CLEAR_HINT,
  RULER_GRID_SNAP_HINT,
  getDrawingHelpLines,
  getDrawingToolHint,
  getDrawingToolLabel,
  getFogHelpLines,
  getFogToolHint,
  getFogToolLabel,
  getRulerHelpLines
} from "../../src/renderer/lib/toolCopy";

describe("tool copy helpers", () => {
  it("labels fog tools by operation and shape", () => {
    expect(getFogToolLabel("reveal-brush")).toBe("Reveal Brush");
    expect(getFogToolLabel("hide-circle")).toBe("Hide Circle");
    expect(getFogToolLabel("reveal-polygon")).toBe("Reveal Polygon");
  });

  it("describes fog tool interactions by shape", () => {
    expect(getFogToolHint("reveal-brush", 0, 48)).toBe("Left-drag to paint. Brush 48px.");
    expect(getFogToolHint("hide-rectangle", 0, 48)).toBe("Left-drag to draw. Hold Shift for square.");
    expect(getFogToolHint("reveal-circle", 0, 48)).toBe("Left-drag from center to set radius.");
    expect(getFogToolHint("hide-polygon", 2, 48)).toBe("Click to place points. Right-click removes last point. Escape cancels.");
    expect(getFogToolHint("hide-polygon", 3, 48)).toBe("Click to place points. Enter or double-click finishes. Right-click removes last point. Escape cancels.");
  });

  it("keeps help panel copy aligned with shared status hints", () => {
    expect(getFogHelpLines()).toContain(`${FOG_GRID_SNAP_HINT} Escape cancels active drawing.`);
    expect(getRulerHelpLines()).toContain(RULER_GRID_SNAP_HINT);
    expect(getRulerHelpLines()).toContain(RULER_CLEAR_HINT);
  });

  it("describes drawing tools", () => {
    expect(getDrawingToolLabel("freehand")).toBe("Brush");
    expect(getDrawingToolLabel("line")).toBe("Line");
    expect(getDrawingToolLabel("circle")).toBe("Ellipse");
    expect(getDrawingToolLabel("rectangle")).toBe("Rectangle");
    expect(getDrawingToolLabel("template-cone")).toBe("Cone Template");
    expect(getDrawingToolHint("line")).toContain("straight line");
    expect(getDrawingToolHint("circle")).toContain("Hold Shift for a circle");
    expect(getDrawingToolHint("template-cone")).toContain("aim a cone");
    expect(getDrawingToolHint("template-cone")).toContain("Ctrl/Cmd snaps");
    expect(getDrawingHelpLines()).toContain("Rectangle: left-drag to draw a rectangle; hold Shift for a square.");
    expect(getDrawingHelpLines()).toContain("Ellipse: left-drag from the center to set width and height; hold Shift for a circle.");
    expect(getDrawingHelpLines()).toContain("Drawings are saved as sub-layers under the Drawing layer.");
  });
});
