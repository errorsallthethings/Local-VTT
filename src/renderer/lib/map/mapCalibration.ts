import { DEFAULT_MAP_TRANSFORM, type MapTransform, type Scene } from "../../../shared/localvtt";
import type { MapCalibrationBox } from "../../canvas/map";
import { getBoxCalibrationGridPatch } from "../../canvas/map";

export interface MapCalibrationDraft {
  fitMode: MapTransform["fitMode"];
  mapGridColumns: number;
  mapGridRows: number;
  alignGridToMap: boolean;
  boxColumns: number;
  boxRows: number;
}

export interface MapImageDimensions {
  width: number;
  height: number;
}

export function getMapCalibrationDraftFromScene(scene: Scene, alignGridToMap: boolean): MapCalibrationDraft {
  return {
    fitMode: scene.mapTransform.fitMode,
    mapGridColumns: scene.grid.mapGridColumns,
    mapGridRows: scene.grid.mapGridRows,
    alignGridToMap,
    boxColumns: 1,
    boxRows: 1
  };
}

export function applyMapCalibrationDraft(
  scene: Scene,
  draft: MapCalibrationDraft,
  options: { calibrationBox?: MapCalibrationBox | null; imageDimensions?: MapImageDimensions | null } = {},
  updatedAt = new Date().toISOString()
): Scene {
  const columns = Math.max(1, draft.mapGridColumns);
  const rows = Math.max(1, draft.mapGridRows);
  const boxGridPatch = getBoxCalibrationGridPatch(draft, options.calibrationBox ?? null);

  if (boxGridPatch) {
    return {
      ...scene,
      grid: {
        ...scene.grid,
        mapGridColumns: columns,
        mapGridRows: rows,
        ...boxGridPatch
      },
      mapTransform: {
        ...scene.mapTransform,
        fitMode: "manual"
      },
      updatedAt
    };
  }

  if (draft.alignGridToMap && options.imageDimensions) {
    const cellWidth = options.imageDimensions.width / columns;
    const cellHeight = options.imageDimensions.height / rows;
    return {
      ...scene,
      grid: {
        ...scene.grid,
        mapGridColumns: columns,
        mapGridRows: rows,
        sizePx: Math.max(1, Math.round(((cellWidth + cellHeight) / 2) * 100) / 100),
        offsetX: 0,
        offsetY: 0
      },
      mapTransform: { ...DEFAULT_MAP_TRANSFORM },
      updatedAt
    };
  }

  return {
    ...scene,
    grid: {
      ...scene.grid,
      mapGridColumns: columns,
      mapGridRows: rows
    },
    mapTransform: {
      ...scene.mapTransform,
      fitMode: draft.fitMode
    },
    updatedAt
  };
}
