import type { Asset, GridSettings, MapTransform } from "../../../../shared/localvtt";
import { DEFAULT_MAP_TRANSFORM } from "../../../../shared/localvtt";

export type MapFitPresetMode = Exclude<MapTransform["fitMode"], "manual">;
export type MapFitAction =
  | { type: "update-grid"; gridPatch: Partial<GridSettings> }
  | { type: "apply-fit-preset"; fitMode: MapFitPresetMode; gridPatch?: Partial<GridSettings> }
  | { type: "update-map-transform"; mapTransformPatch: Partial<MapTransform> };

export interface MapFitActionHandlers {
  onApplyMapFitPreset: (fitMode: MapFitPresetMode, gridPatch?: Partial<GridSettings>) => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
}

export function applyMapFitAction(action: MapFitAction, handlers: MapFitActionHandlers): void {
  if (action.type === "apply-fit-preset") {
    handlers.onApplyMapFitPreset(action.fitMode, action.gridPatch);
  } else if (action.type === "update-map-transform") {
    handlers.onUpdateMapTransform(action.mapTransformPatch);
  } else {
    handlers.onUpdateGrid(action.gridPatch);
  }
}

export function getManualMapScalePatch(scale: number): Partial<MapTransform> {
  return {
    scale,
    scaleX: scale,
    scaleY: scale,
    fitMode: "manual"
  };
}

export function getMapCellSizeAction(sizePx: number, fitMode: MapTransform["fitMode"], mapAsset: Pick<Asset, "mediaType"> | null): MapFitAction {
  if (fitMode === "actual-size" && mapAsset?.mediaType === "image") {
    return { type: "apply-fit-preset", fitMode: "actual-size", gridPatch: { sizePx } };
  }
  return { type: "update-grid", gridPatch: { sizePx } };
}

export function getMapGridDimensionAction(
  dimension: "mapGridColumns" | "mapGridRows",
  value: number,
  fitMode: MapTransform["fitMode"]
): MapFitAction {
  const gridValue = Math.max(1, value);
  const gridPatch = { [dimension]: gridValue } as Pick<GridSettings, typeof dimension>;
  if (fitMode === "cover") {
    return { type: "apply-fit-preset", fitMode: "cover", gridPatch };
  }
  return { type: "update-grid", gridPatch };
}

export function getMapFitModeAction(fitMode: MapTransform["fitMode"]): MapFitAction {
  if (fitMode === "manual") {
    return { type: "update-map-transform", mapTransformPatch: { fitMode: "manual" } };
  }
  return { type: "apply-fit-preset", fitMode };
}

export function getManualMapRotationPatch(rotation: number): Partial<MapTransform> {
  return { rotation, fitMode: "manual" };
}

export function getResetMapTransformPatch(): Partial<MapTransform> {
  return { ...DEFAULT_MAP_TRANSFORM };
}

export function getMapFitHelpText(): string[] {
  return [
    "Fit Whole Map keeps the image aspect ratio, centers it in Player View, and starts the grid at the map's top-left.",
    "Stretch to Grid stretches the image to the configured grid columns and rows, which can reveal incorrect map dimensions.",
    "Image Size places the image at its original pixel size from the scene origin."
  ];
}
