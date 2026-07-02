import { describe, expect, it } from "vitest";
import { DEFAULT_CALIBRATION, type DisplayCalibration } from "../../src/shared/localvtt";
import {
  getInitialPlayerTestPatternGridMode,
  getPhysicalGridCellSizePx,
  getPlayerTestPatternCellSize,
  getPlayerTestPatternMessage
} from "../../src/renderer/lib/player-view";

function calibration(overrides: Partial<DisplayCalibration> = {}): DisplayCalibration {
  return {
    ...DEFAULT_CALIBRATION,
    pixelsPerInch: 96,
    inchesPerGridCell: 1,
    ...overrides
  };
}

describe("player test pattern helpers", () => {
  it("derives physical grid cell size from display calibration with a minimum", () => {
    expect(getPhysicalGridCellSizePx(calibration({ pixelsPerInch: 110, inchesPerGridCell: 1.25 }))).toBe(138);
    expect(getPhysicalGridCellSizePx(calibration({ pixelsPerInch: 12, inchesPerGridCell: 1 }))).toBe(24);
  });

  it("uses physical calibration only for physical square test patterns", () => {
    const display = calibration({ pixelsPerInch: 100, inchesPerGridCell: 1.5 });

    expect(getPlayerTestPatternCellSize("physical-square", display, 64)).toBe(150);
    expect(getPlayerTestPatternCellSize("square", display, 64.4)).toBe(64);
    expect(getPlayerTestPatternCellSize("hex", display, 12)).toBe(24);
  });

  it("builds display messages for test pattern variants", () => {
    const display = calibration({ pixelsPerInch: 100, inchesPerGridCell: 1.5 });

    expect(getPlayerTestPatternMessage("none", display)).toBe("Check that all corners and the center marker are visible.");
    expect(getPlayerTestPatternMessage("physical-square", display)).toBe("150 px per physical grid cell.");
    expect(getPlayerTestPatternMessage("hex", display)).toBe("Digital square grid test pattern.");
  });

  it("chooses initial test grid mode from scene grid and physical scale settings", () => {
    expect(getInitialPlayerTestPatternGridMode("gridless", calibration({ physicalScaleEnabled: true }))).toBe("none");
    expect(getInitialPlayerTestPatternGridMode("hex", calibration({ physicalScaleEnabled: true }))).toBe("hex");
    expect(getInitialPlayerTestPatternGridMode("square", calibration({ physicalScaleEnabled: true }))).toBe("physical-square");
    expect(getInitialPlayerTestPatternGridMode("square", calibration({ physicalScaleEnabled: false }))).toBe("square");
  });
});
