import { describe, expect, it } from "vitest";
import {
  FOG_TOOL_BUTTONS,
  getHiddenFromPlayerToggleValue,
  getNextUtilityHelpTopic,
  TABLE_TOOL_BUTTONS
} from "../../src/renderer/components/tools/menu/ToolsMenuUtilityPanels";

describe("tools menu utility panels", () => {
  it("keeps table tool button order stable", () => {
    expect(TABLE_TOOL_BUTTONS.map((button) => [button.tool, button.label])).toEqual([
      ["ruler", "Ruler"],
      ["ping", "Sonar"],
      ["laser", "Laser Pointer"],
      ["arrow", "Arrow Pointer"]
    ]);
  });

  it("keeps fog mask button order stable", () => {
    expect(FOG_TOOL_BUTTONS.map((button) => [button.shape, button.label])).toEqual([
      ["brush", "Brush Mask"],
      ["rectangle", "Rectangle Mask"],
      ["circle", "Circle Mask"],
      ["polygon", "Polygon Mask"]
    ]);
  });

  it("maps visible state to the hide switch checked state", () => {
    expect(getHiddenFromPlayerToggleValue(true)).toBe(false);
    expect(getHiddenFromPlayerToggleValue(false)).toBe(true);
  });

  it("toggles utility help topics predictably", () => {
    expect(getNextUtilityHelpTopic(null, "table")).toBe("table");
    expect(getNextUtilityHelpTopic("table", "table")).toBeNull();
    expect(getNextUtilityHelpTopic("table", "fog")).toBe("fog");
  });
});
