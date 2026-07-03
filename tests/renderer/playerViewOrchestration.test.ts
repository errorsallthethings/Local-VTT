import { describe, expect, it } from "vitest";
import { DEFAULT_CALIBRATION, type DisplayCalibration } from "../../src/shared/localvtt";
import {
  getMissingPlayerDisplayWarning,
  getPlayerTestPatternState,
  getPlayerViewModeState
} from "../../src/renderer/lib/player-view";
import type { DisplayInfo } from "../../src/renderer/components/settings/PlayerDisplayScalePanel";

function calibration(overrides: Partial<DisplayCalibration> = {}): DisplayCalibration {
  return {
    ...DEFAULT_CALIBRATION,
    selectedDisplayId: 2,
    selectedDisplayLabel: "Saved Table TV",
    pixelsPerInch: 96,
    inchesPerGridCell: 1,
    ...overrides
  };
}

function display(overrides: Partial<DisplayInfo> = {}): DisplayInfo {
  return {
    id: 2,
    label: "Connected Table TV",
    bounds: { x: 0, y: 0, width: 3840, height: 2160 },
    workArea: { x: 0, y: 0, width: 3840, height: 2160 },
    nativeResolution: { width: 3840, height: 2160 },
    scaleFactor: 1,
    rotation: 0,
    ...overrides
  };
}

describe("player view orchestration helpers", () => {
  it("formats missing display warnings only when a saved display is unavailable", () => {
    expect(getMissingPlayerDisplayWarning(true, "Table TV")).toBeNull();
    expect(getMissingPlayerDisplayWarning(false)).toBeNull();
    expect(getMissingPlayerDisplayWarning(false, "Table TV")).toBe(
      "The saved Player View display (Table TV) is not connected. Player View opened normally so you can move it manually."
    );
  });

  it("builds display mode state and clears scene ids for non-scene modes", () => {
    expect(getPlayerViewModeState("scene", "scene-1")).toEqual({ playerSceneId: "scene-1", playerDisplayMode: "scene" });
    expect(getPlayerViewModeState("hold", "scene-1")).toEqual({ playerSceneId: null, playerDisplayMode: "hold" });
    expect(getPlayerViewModeState("blackout")).toEqual({ playerSceneId: null, playerDisplayMode: "blackout" });
    expect(getPlayerViewModeState("test-pattern")).toEqual({ playerSceneId: null, playerDisplayMode: "test-pattern" });
  });

  it("builds test pattern idle state with connected display metadata", () => {
    expect(getPlayerTestPatternState("square", calibration(), 72, [display()])).toEqual({
      type: "idle",
      variant: "test-pattern",
      title: "Local VTT Test Pattern",
      message: "Digital square grid test pattern.",
      testPattern: {
        gridMode: "square",
        cellSizePx: 72,
        displayLabel: "Connected Table TV",
        nativeResolution: { width: 3840, height: 2160 }
      }
    });
  });

  it("falls back to saved labels and physical grid sizing when display metadata is unavailable", () => {
    expect(getPlayerTestPatternState("physical-square", calibration({ pixelsPerInch: 110, inchesPerGridCell: 1.25 }), 72, [])).toMatchObject({
      message: "138 px per physical grid cell.",
      testPattern: {
        gridMode: "physical-square",
        cellSizePx: 138,
        displayLabel: "Saved Table TV",
        nativeResolution: undefined
      }
    });
  });
});
