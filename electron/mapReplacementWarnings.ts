import type { MediaDimensions } from "./assets.js";

export function getDimensionDifferenceWarning(currentDimensions: MediaDimensions | undefined, nextDimensions: MediaDimensions | undefined): string | null {
  if (!currentDimensions || !nextDimensions) {
    return null;
  }

  const widthRatio = getLargestRatio(currentDimensions.width, nextDimensions.width);
  const heightRatio = getLargestRatio(currentDimensions.height, nextDimensions.height);
  const currentAspect = currentDimensions.width / currentDimensions.height;
  const nextAspect = nextDimensions.width / nextDimensions.height;
  const aspectRatio = getLargestRatio(currentAspect, nextAspect);
  if (widthRatio < 1.25 && heightRatio < 1.25 && aspectRatio < 1.12) {
    return null;
  }

  return [
    `Current map: ${currentDimensions.width} x ${currentDimensions.height}`,
    `Replacement map: ${nextDimensions.width} x ${nextDimensions.height}`,
    "The scene keeps its current grid, calibration, fog, drawings, tokens, and effects. Review alignment after replacing the map."
  ].join("\n");
}

export function getLargestRatio(first: number, second: number): number {
  if (first <= 0 || second <= 0) {
    return 1;
  }
  return Math.max(first, second) / Math.min(first, second);
}
