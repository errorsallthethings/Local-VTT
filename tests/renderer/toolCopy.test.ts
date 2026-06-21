import { describe, expect, it } from "vitest";
import {
  FOG_GRID_SNAP_HINT,
  RULER_CLEAR_HINT,
  RULER_GRID_SNAP_HINT,
  getDrawingHelpLines,
  getDrawingToolHint,
  getDrawingToolLabel,
  getEnvironmentEffectShapeLabel,
  getEnvironmentEffectStatusHint,
  getEnvironmentEffectStatusLabel,
  getFogHelpLines,
  getFogToolHint,
  getFogToolLabel,
  getRulerHelpLines,
  getWeatherMaskStatusHint,
  getWeatherMaskStatusLabel
} from "../../src/renderer/lib/tools";

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

  it("describes weather mask status strips", () => {
    expect(getWeatherMaskStatusLabel("rectangle")).toBe("Weather Effect Mask Rectangle");
    expect(getWeatherMaskStatusLabel("circle")).toBe("Weather Effect Mask Circle");
    expect(getWeatherMaskStatusLabel("polygon")).toBe("Weather Effect Mask Polygon");
    expect(getWeatherMaskStatusHint("rectangle", 0)).toBe("Left-drag to draw an excluded weather area. Hold Shift for square.");
    expect(getWeatherMaskStatusHint("circle", 0)).toBe("Left-drag from center to set the excluded weather radius.");
    expect(getWeatherMaskStatusHint("polygon", 2)).toBe("Click to place points. Right-click removes last point. Escape cancels.");
    expect(getWeatherMaskStatusHint("polygon", 3)).toBe("Click to place points. Enter or double-click finishes. Right-click removes last point. Escape cancels.");
  });

  it("describes environment effect status strips", () => {
    expect(getEnvironmentEffectShapeLabel("rectangle")).toBe("Rectangle");
    expect(getEnvironmentEffectShapeLabel("circle")).toBe("Radius");
    expect(getEnvironmentEffectShapeLabel("polygon")).toBe("Polygon");
    expect(getEnvironmentEffectStatusLabel("Water", "circle")).toBe("Water Radius");
    expect(getEnvironmentEffectStatusHint("rectangle", 0)).toBe("Left-drag to draw an animated effect area. Hold Shift for square.");
    expect(getEnvironmentEffectStatusHint("circle", 0)).toBe("Left-drag from center to set the animated effect radius.");
    expect(getEnvironmentEffectStatusHint("polygon", 2)).toBe("Click to place points. Right-click removes last point. Escape cancels.");
    expect(getEnvironmentEffectStatusHint("polygon", 3)).toBe("Click to place points. Enter or double-click finishes. Right-click removes last point. Escape cancels.");
  });
});
