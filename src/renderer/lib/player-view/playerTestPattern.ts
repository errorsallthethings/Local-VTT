import type { DisplayCalibration, GridType, PlayerViewTestPattern } from "../../../shared/localvtt";

export type PlayerViewTestPatternGridMode = PlayerViewTestPattern["gridMode"];

export function getPhysicalGridCellSizePx(display: DisplayCalibration): number {
  return Math.max(24, Math.round(display.pixelsPerInch * display.inchesPerGridCell));
}

export function getPlayerTestPatternCellSize(gridMode: PlayerViewTestPatternGridMode, display: DisplayCalibration, fallbackCellSize = 80): number {
  if (gridMode === "physical-square") {
    return getPhysicalGridCellSizePx(display);
  }
  return Math.max(24, Math.round(fallbackCellSize));
}

export function getPlayerTestPatternMessage(gridMode: PlayerViewTestPatternGridMode, display: DisplayCalibration): string {
  if (gridMode === "none") {
    return "Check that all corners and the center marker are visible.";
  }
  if (gridMode === "physical-square") {
    return `${getPlayerTestPatternCellSize(gridMode, display)} px per physical grid cell.`;
  }
  return "Digital square grid test pattern.";
}

export function getInitialPlayerTestPatternGridMode(gridType: GridType, display: DisplayCalibration): PlayerViewTestPatternGridMode {
  if (gridType === "gridless") {
    return "none";
  }
  if (gridType === "hex") {
    return "hex";
  }
  return display.physicalScaleEnabled ? "physical-square" : "square";
}
