import { describe, expect, it } from "vitest";
import { TOOL_CATEGORY_RAIL_ENTRIES } from "../../src/renderer/components/tools/menu/ToolsMenuCategoryRail";

describe("tools menu category rail", () => {
  it("keeps category order and divider placement stable", () => {
    expect(
      TOOL_CATEGORY_RAIL_ENTRIES.map((entry) => entry.kind === "category" ? entry.id : entry.id)
    ).toEqual([
      "fog",
      "effects",
      "drawing",
      "text",
      "templates",
      "lighting",
      "tools-primary-secondary-divider",
      "dice",
      "turn-order",
      "table"
    ]);
  });

  it("marks only categories with subpanels as expandable", () => {
    const categories = TOOL_CATEGORY_RAIL_ENTRIES.filter((entry) => entry.kind === "category");
    const expandableCategoryIds = categories.filter((entry) => entry.hasPanelTools).map((entry) => entry.id);

    expect(expandableCategoryIds).toEqual(["fog", "effects", "drawing", "templates", "table"]);
    expect(categories.find((entry) => entry.id === "dice")?.label).toBe("Dice Bag");
  });
});
