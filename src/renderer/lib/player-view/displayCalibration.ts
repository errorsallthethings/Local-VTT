import type { DisplayCalibration, PlayerDisplayProfile, PlayerViewTestPattern } from "../../../shared/localvtt";
import { getPlayerTestPatternCellSize } from "./playerTestPattern";

export interface PlayerDisplayInfo {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  nativeResolution: { width: number; height: number };
  scaleFactor: number;
}

export interface DisplayCalibrationMetrics {
  estimatedPixelsPerInch: number;
  targetPlayerCellSize: number;
  effectiveTargetCellSize: number;
  playerScale: number;
}

export function estimateDisplayPixelsPerInch(width: number, height: number, diagonalInches: number, fallback = 0): number {
  if (width <= 0 || height <= 0 || diagonalInches <= 0) {
    return fallback;
  }
  return Math.sqrt(width ** 2 + height ** 2) / diagonalInches;
}

export function normalizeDisplayCalibrationDraft(display: DisplayCalibration): DisplayCalibration {
  if (display.mode !== "screen-size") {
    return display;
  }
  return {
    ...display,
    pixelsPerInch: Math.round(estimateDisplayPixelsPerInch(display.screenResolutionWidth, display.screenResolutionHeight, display.screenDiagonalInches, 96))
  };
}

export function getDisplayCalibrationMetrics(display: DisplayCalibration, sceneGridSizePx: number): DisplayCalibrationMetrics {
  const estimatedPixelsPerInch = estimateDisplayPixelsPerInch(display.screenResolutionWidth, display.screenResolutionHeight, display.screenDiagonalInches);
  const targetPlayerCellSize = Math.max(1, Math.round(display.pixelsPerInch * display.inchesPerGridCell));
  const effectiveTargetCellSize =
    display.mode === "screen-size" ? Math.max(1, Math.round(estimatedPixelsPerInch * display.inchesPerGridCell)) : targetPlayerCellSize;
  const playerScale = sceneGridSizePx > 0 ? effectiveTargetCellSize / sceneGridSizePx : 1;
  return { estimatedPixelsPerInch, targetPlayerCellSize, effectiveTargetCellSize, playerScale };
}

export function getDisplayLabel(display: Pick<PlayerDisplayInfo, "id" | "label" | "nativeResolution">): string {
  const name = display.label?.trim() ? display.label.trim() : `Display ${display.id}`;
  return `${name} - ${display.nativeResolution.width}x${display.nativeResolution.height}`;
}

export function getDisplayDetails(display: PlayerDisplayInfo): string {
  return `${getDisplayLabel(display)}, bounds ${display.bounds.x},${display.bounds.y} ${display.bounds.width}x${display.bounds.height}, scale ${display.scaleFactor}`;
}

export function getDisplayAspect(display: Pick<PlayerDisplayInfo, "nativeResolution"> | null, calibration: DisplayCalibration): number {
  const width = display?.nativeResolution.width ?? calibration.screenResolutionWidth;
  const height = display?.nativeResolution.height ?? calibration.screenResolutionHeight;
  return height > 0 ? width / height : 16 / 9;
}

export function formatDisplayAspect(value: number): string {
  return `${value.toFixed(2)}:1`;
}

export function formatDisplayPixels(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function getNextDisplayProfileName(nameDraft: string, profiles: Pick<PlayerDisplayProfile, "name">[]): string {
  const baseName = nameDraft.trim() || "Display Profile";
  const existingNames = new Set(profiles.map((profile) => profile.name));
  let nextName = existingNames.has(baseName) ? `${baseName} Copy` : baseName;
  let suffix = 2;
  while (existingNames.has(nextName)) {
    nextName = `${baseName} Copy ${suffix}`;
    suffix += 1;
  }
  return nextName;
}

export function getTestPatternCellSize(gridMode: PlayerViewTestPattern["gridMode"], patternCellSize: number, display: DisplayCalibration): number {
  return getPlayerTestPatternCellSize(gridMode, display, patternCellSize);
}

export function getDisplayCalibrationForTestGridMode(
  gridMode: PlayerViewTestPattern["gridMode"],
  display: DisplayCalibration,
  patternCellSize: number
): DisplayCalibration {
  if (gridMode === "physical-square") {
    return {
      ...display,
      physicalScaleEnabled: true,
      mode: "grid-cell",
      pixelsPerInch: getTestPatternCellSize(gridMode, patternCellSize, display),
      inchesPerGridCell: 1
    };
  }
  return { ...display, physicalScaleEnabled: false };
}
