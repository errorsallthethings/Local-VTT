import { describe, expect, it } from "vitest";
import {
  DRAWING_TOOL_BUTTONS,
  getDrawingPanelFillSettingsVisible,
  getNextToolHelpTopic,
  TEMPLATE_TOOL_BUTTONS
} from "../../src/renderer/components/tools/menu/ToolsMenuDrawingPanels";

describe("tools menu drawing panels", () => {
  it("keeps drawing tool button order stable", () => {
    expect(DRAWING_TOOL_BUTTONS.map((button) => [button.tool, button.label])).toEqual([
      ["freehand", "Brush"],
      ["line", "Line"],
      ["rectangle", "Rectangle"],
      ["circle", "Ellipse"],
      ["triangle", "Triangle"],
      ["polygon", "Polygon"]
    ]);
  });

  it("keeps template tool button order stable", () => {
    expect(TEMPLATE_TOOL_BUTTONS.map((button) => [button.tool, button.label])).toEqual([
      ["template-line", "Line Template"],
      ["template-circle", "Radius Template"],
      ["template-rectangle", "Cube Template"],
      ["template-cone", "Cone Template"]
    ]);
  });

  it("shows fill settings only for drawing shapes that can be filled", () => {
    expect(getDrawingPanelFillSettingsVisible("freehand")).toBe(false);
    expect(getDrawingPanelFillSettingsVisible("line")).toBe(false);
    expect(getDrawingPanelFillSettingsVisible("rectangle")).toBe(true);
    expect(getDrawingPanelFillSettingsVisible("circle")).toBe(true);
    expect(getDrawingPanelFillSettingsVisible(null)).toBe(true);
  });

  it("toggles help topics predictably", () => {
    expect(getNextToolHelpTopic(null, "drawing")).toBe("drawing");
    expect(getNextToolHelpTopic("drawing", "drawing")).toBeNull();
    expect(getNextToolHelpTopic("drawing", "templates")).toBe("templates");
  });
});
