export type ToolCategory = "mouse" | "drawing" | "templates" | "text" | "table" | "dice" | "turn-order" | "pin" | "fog" | "effects" | "lighting";

const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
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

export function getToolCategoryLabel(category: ToolCategory | null | undefined): string {
  return category ? (TOOL_CATEGORY_LABELS[category] ?? "Tools") : "Tools";
}
