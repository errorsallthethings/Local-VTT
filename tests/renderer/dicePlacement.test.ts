import { describe, expect, it } from "vitest";
import type { DiceDisplayMode } from "../../src/shared/localvtt";
import { getDicePlacementAvailable, getDicePlacementFacingAvailable, getDicePlacementHelp } from "../../src/renderer/lib/dice";

const DISPLAY_MODES: DiceDisplayMode[] = ["results", "panel", "scene", "scene-result", "hidden"];

describe("dice placement helpers", () => {
  it("allows placement only for result and panel modes when scene roll is disabled", () => {
    expect(DISPLAY_MODES.map((mode) => [mode, getDicePlacementAvailable(mode, false)])).toEqual([
      ["results", true],
      ["panel", true],
      ["scene", false],
      ["scene-result", false],
      ["hidden", false]
    ]);
  });

  it("disables placement while 3D scene roll is enabled", () => {
    expect(DISPLAY_MODES.every((mode) => !getDicePlacementAvailable(mode, true))).toBe(true);
  });

  it("allows facing controls only for text result placement", () => {
    expect(getDicePlacementFacingAvailable("results", false)).toBe(true);
    expect(getDicePlacementFacingAvailable("panel", false)).toBe(false);
    expect(getDicePlacementFacingAvailable("results", true)).toBe(false);
  });

  it("describes why placement controls are available or ignored", () => {
    expect(getDicePlacementHelp("GM", "results", true)).toBe("3D Scene Roll is always centered on the selected scene view, so display placement is ignored.");
    expect(getDicePlacementHelp("Player", "hidden", false)).toBe("Player display is hidden, so placement is ignored.");
    expect(getDicePlacementHelp("GM", "panel", false)).toBe("3D Panel uses Edge and Edge Position. Facing is only used by Text Result Only.");
    expect(getDicePlacementHelp("Player", "results", false)).toBe("Text Result Only uses Edge, Facing, and Edge Position. Turn placement off to keep it centered.");
  });
});
