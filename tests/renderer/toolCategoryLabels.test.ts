import { describe, expect, it } from "vitest";
import { getToolCategoryLabel, type ToolCategory } from "../../src/renderer/components/tools/menu/toolCategoryLabels";

describe("tool category labels", () => {
  it("formats all tool category labels used by the tools menu", () => {
    const labels: Record<ToolCategory, string> = {
      mouse: "Mouse Behavior",
      drawing: "Drawing Tools",
      templates: "Template Tools",
      text: "Text Tool",
      table: "Table Tools",
      dice: "Dice Bag",
      "turn-order": "Turn Order",
      pin: "Pin Tools",
      fog: "Fog Of War Tools",
      effects: "Effects Tools",
      lighting: "Dynamic Lighting"
    };

    for (const [category, label] of Object.entries(labels) as Array<[ToolCategory, string]>) {
      expect(getToolCategoryLabel(category)).toBe(label);
    }
  });

  it("falls back to the generic tools label without an active category", () => {
    expect(getToolCategoryLabel(null)).toBe("Tools");
    expect(getToolCategoryLabel(undefined)).toBe("Tools");
  });
});
