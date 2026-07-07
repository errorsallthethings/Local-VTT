import type { Asset } from "../src/shared/localvtt.js";
import type { MediaDimensions } from "./assets.js";
import { readMapMediaDimensions } from "./assets.js";
import { getDimensionDifferenceWarning } from "./mapReplacementWarnings.js";

export interface MapReplacementPreview {
  currentDimensions?: MediaDimensions;
  nextDimensions?: MediaDimensions;
  warning?: string;
}

export type ReadMapMediaDimensions = (sourcePath: string, mediaType: "image" | "video") => Promise<MediaDimensions | undefined>;

export async function getMapReplacementPreview(
  currentPath: string,
  currentMediaType: Asset["mediaType"],
  nextPath: string,
  nextMediaType: Asset["mediaType"],
  readDimensions: ReadMapMediaDimensions = readMapMediaDimensions
): Promise<MapReplacementPreview> {
  const [currentDimensions, nextDimensions] = await Promise.all([
    readDimensions(currentPath, currentMediaType),
    readDimensions(nextPath, nextMediaType)
  ]);
  return { currentDimensions, nextDimensions, warning: getDimensionDifferenceWarning(currentDimensions, nextDimensions) ?? undefined };
}
