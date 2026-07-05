import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_EFFECT_TOOL_BUTTONS,
  getNextEffectsHelpTopic,
  WEATHER_MASK_BUTTONS
} from "../../src/renderer/components/tools/menu/ToolsMenuEffectsPanel";

describe("tools menu effects panel", () => {
  it("keeps weather mask tool button order stable", () => {
    expect(WEATHER_MASK_BUTTONS.map((button) => [button.tool, button.label])).toEqual([
      ["rectangle", "Rectangle Weather Mask"],
      ["circle", "Circle Weather Mask"],
      ["polygon", "Polygon Weather Mask"]
    ]);
  });

  it("keeps animated effect tool button order stable", () => {
    expect(ENVIRONMENT_EFFECT_TOOL_BUTTONS.map((button) => [button.tool, button.label])).toEqual([
      ["circle", "Radius Animated Effect"],
      ["rectangle", "Rectangle Animated Effect"],
      ["polygon", "Polygon Animated Effect"]
    ]);
  });

  it("toggles the effects help topic predictably", () => {
    expect(getNextEffectsHelpTopic(null)).toBe("effects");
    expect(getNextEffectsHelpTopic("effects")).toBeNull();
    expect(getNextEffectsHelpTopic("fog")).toBe("effects");
  });
});
