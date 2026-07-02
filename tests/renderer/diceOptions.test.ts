import { describe, expect, it } from "vitest";
import {
  DICE_DISPLAY_OPTIONS,
  DICE_PANEL_EDGE_OPTIONS,
  DICE_PANEL_FACING_OPTIONS,
  DICE_SCENE_SIZE_OPTIONS,
  getDiceDisplaySelectValue
} from "../../src/renderer/lib/dice";

describe("dice option helpers", () => {
  it("exposes stable dice display options", () => {
    expect(DICE_DISPLAY_OPTIONS).toEqual([
      { value: "results", label: "Text Result Only" },
      { value: "panel", label: "3D Panel" },
      { value: "scene", label: "3D Scene Roll" },
      { value: "hidden", label: "Hidden" }
    ]);
  });

  it("exposes stable scene size and panel placement options", () => {
    expect(DICE_SCENE_SIZE_OPTIONS.map((option) => option.value)).toEqual(["xs", "sm", "md", "lg", "xl"]);
    expect(DICE_PANEL_EDGE_OPTIONS.map((option) => option.value)).toEqual(["top", "right", "bottom", "left"]);
    expect(DICE_PANEL_FACING_OPTIONS.map((option) => option.value)).toEqual(["inward", "outward"]);
  });

  it("normalizes display modes for the settings select", () => {
    expect(getDiceDisplaySelectValue("panel")).toBe("panel");
    expect(getDiceDisplaySelectValue("hidden")).toBe("hidden");
    expect(getDiceDisplaySelectValue("scene")).toBe("scene");
    expect(getDiceDisplaySelectValue("results")).toBe("results");
    expect(getDiceDisplaySelectValue("scene-result")).toBe("results");
  });
});
