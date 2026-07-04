import { describe, expect, it } from "vitest";
import {
  DICE_DISPLAY_OPTIONS,
  DICE_PANEL_EDGE_OPTIONS,
  DICE_PANEL_FACING_OPTIONS,
  DICE_SCENE_SIZE_OPTIONS,
  DEFAULT_DICE_PANEL_EDGE,
  DEFAULT_DICE_PANEL_FACING,
  DEFAULT_DICE_PANEL_POSITION,
  getDiceDisplayModeChangePlan,
  getDiceDisplaySelectValue,
  getDiceDisplaySelectValueForView,
  getDicePanelAdvancedChangePlan
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

  it("derives display select values while scene rolls are enabled", () => {
    expect(getDiceDisplaySelectValueForView("panel", "gm", "gm", true)).toBe("scene");
    expect(getDiceDisplaySelectValueForView("panel", "player", "gm", true)).toBe("results");
    expect(getDiceDisplaySelectValueForView("hidden", "player", "player", true)).toBe("scene");
    expect(getDiceDisplaySelectValueForView("panel", "gm", "player", true)).toBe("hidden");
    expect(getDiceDisplaySelectValueForView("panel", "gm", "gm", false)).toBe("panel");
  });

  it("plans display mode changes for scene roll and normal display modes", () => {
    expect(getDiceDisplayModeChangePlan("scene", "gm", false)).toEqual({
      sceneRollTarget: "gm",
      sceneRollEnabled: true,
      displayMode: null
    });
    expect(getDiceDisplayModeChangePlan("panel", "player", true)).toEqual({
      sceneRollTarget: null,
      sceneRollEnabled: false,
      displayMode: "panel"
    });
    expect(getDiceDisplayModeChangePlan("hidden", "player", false)).toEqual({
      sceneRollTarget: null,
      sceneRollEnabled: null,
      displayMode: "hidden"
    });
  });

  it("exposes and applies default dice panel placement settings", () => {
    expect(DEFAULT_DICE_PANEL_EDGE).toBe("top");
    expect(DEFAULT_DICE_PANEL_FACING).toBe("inward");
    expect(DEFAULT_DICE_PANEL_POSITION).toBe(0.5);
    expect(getDicePanelAdvancedChangePlan(false)).toEqual({
      advanced: false,
      resetPlacement: true
    });
    expect(getDicePanelAdvancedChangePlan(true)).toEqual({
      advanced: true,
      resetPlacement: false
    });
  });
});
