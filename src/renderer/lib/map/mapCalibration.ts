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

export interface MapFitTargetDimensions {
  width: number;
  height: number;
}

export type MapGridFitMode = "contain" | "cover";

export interface MapGridFitDraft {
  mapGridColumns: number;
  mapGridRows: number;
  fitMode: MapGridFitMode;
}

export interface MapGridFitPreview {
  columns: number;
  rows: number;
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  emptyWidth: number;
  emptyHeight: number;
  cropWidth: number;
  cropHeight: number;
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

export function applyMapGridFit(
  scene: Scene,
  draft: MapGridFitDraft,
  imageDimensions: MapImageDimensions,
  updatedAt = new Date().toISOString()
): Scene {
  const preview = getMapGridFitPreview(scene, draft, imageDimensions);
  const stretchToGrid = draft.fitMode === "cover";

  return {
    ...scene,
    grid: {
      ...scene.grid,
      mapGridColumns: preview.columns,
      mapGridRows: preview.rows
    },
    mapTransform: {
      ...scene.mapTransform,
      fitMode: draft.fitMode,
      x: stretchToGrid ? scene.grid.offsetX : Math.round((scene.grid.offsetX + (preview.targetWidth - preview.sourceWidth * preview.scale) / 2) * 100) / 100,
      y: stretchToGrid ? scene.grid.offsetY : Math.round((scene.grid.offsetY + (preview.targetHeight - preview.sourceHeight * preview.scale) / 2) * 100) / 100,
      scale: Math.round(preview.scale * 10000) / 10000,
      scaleX: Math.round((stretchToGrid ? preview.scaleX : preview.scale) * 10000) / 10000,
      scaleY: Math.round((stretchToGrid ? preview.scaleY : preview.scale) * 10000) / 10000
    },
    updatedAt
  };
}

export function getMapGridFitPreview(scene: Scene, draft: MapGridFitDraft, imageDimensions: MapImageDimensions): MapGridFitPreview {
  const columns = Math.max(1, draft.mapGridColumns);
  const rows = Math.max(1, draft.mapGridRows);
  const sourceWidth = Math.max(1, imageDimensions.width);
  const sourceHeight = Math.max(1, imageDimensions.height);
  const targetWidth = columns * Math.max(1, scene.grid.sizePx);
  const targetHeight = rows * Math.max(1, scene.grid.sizePx);
  const containScale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const coverScale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const scale = draft.fitMode === "cover" ? coverScale : containScale;
  const scaleX = targetWidth / sourceWidth;
  const scaleY = targetHeight / sourceHeight;
  const fittedWidth = sourceWidth * scale;
  const fittedHeight = sourceHeight * scale;

  return {
    columns,
    rows,
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    scale,
    scaleX,
    scaleY,
    emptyWidth: Math.max(0, targetWidth - fittedWidth),
    emptyHeight: Math.max(0, targetHeight - fittedHeight),
    cropWidth: Math.max(0, fittedWidth - targetWidth),
    cropHeight: Math.max(0, fittedHeight - targetHeight)
  };
}

export function buildWholeMapFitScene(
  scene: Scene,
  draft: Pick<MapGridFitDraft, "mapGridColumns" | "mapGridRows">,
  imageDimensions: MapImageDimensions,
  targetDimensions: MapFitTargetDimensions,
  updatedAt = new Date().toISOString()
): Scene {
  const sourceWidth = Math.max(1, imageDimensions.width);
  const sourceHeight = Math.max(1, imageDimensions.height);
  const targetWidth = Math.max(1, targetDimensions.width);
  const targetHeight = Math.max(1, targetDimensions.height);
  const scale = Math.round(Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight) * 10000) / 10000;
  const fittedWidth = sourceWidth * scale;
  const fittedHeight = sourceHeight * scale;
  const { columns, rows } = getWholeMapGridDimensions(scene.grid.sizePx, draft.mapGridColumns, draft.mapGridRows, sourceWidth, sourceHeight);
  const cellSize = Math.max(1, Math.min(fittedWidth / columns, fittedHeight / rows));
  const originX = Math.round(((targetWidth - fittedWidth) / 2) * 100) / 100;
  const originY = Math.round(((targetHeight - fittedHeight) / 2) * 100) / 100;

  return {
    ...scene,
    grid: {
      ...scene.grid,
      mapGridColumns: columns,
      mapGridRows: rows,
      sizePx: Math.round(cellSize * 100) / 100,
      offsetX: originX,
      offsetY: originY,
      showOnGm: true,
      showOnPlayer: true
    },
    mapTransform: {
      ...scene.mapTransform,
      fitMode: "contain",
      x: originX,
      y: originY,
      scale,
      scaleX: scale,
      scaleY: scale
    },
    updatedAt
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

function getAspectAdjustedGridDimensions(columnsValue: number, rowsValue: number, sourceWidth: number, sourceHeight: number): { columns: number; rows: number } {
  const columns = Math.max(1, Math.round(columnsValue));
  const rows = Math.max(1, Math.round(rowsValue));
  const aspect = Math.max(0.01, sourceWidth / Math.max(1, sourceHeight));
  const rowsFromColumns = Math.max(1, Math.round(columns / aspect));
  const columnsFromRows = Math.max(1, Math.round(rows * aspect));
  const rowAdjustment = Math.abs(rowsFromColumns - rows) / rows;
  const columnAdjustment = Math.abs(columnsFromRows - columns) / columns;
  return rowAdjustment <= columnAdjustment ? { columns, rows: rowsFromColumns } : { columns: columnsFromRows, rows };
}

function getWholeMapGridDimensions(gridSize: number, columnsValue: number, rowsValue: number, sourceWidth: number, sourceHeight: number): { columns: number; rows: number } {
  const safeGridSize = Math.max(1, gridSize);
  const inferredColumns = sourceWidth / safeGridSize;
  const inferredRows = sourceHeight / safeGridSize;
  const roundedColumns = Math.max(1, Math.round(inferredColumns));
  const roundedRows = Math.max(1, Math.round(inferredRows));
  const columnsAreClean = Math.abs(inferredColumns - roundedColumns) < 0.02;
  const rowsAreClean = Math.abs(inferredRows - roundedRows) < 0.02;
  if (columnsAreClean && rowsAreClean) {
    return { columns: roundedColumns, rows: roundedRows };
  }
  return getAspectAdjustedGridDimensions(columnsValue, rowsValue, sourceWidth, sourceHeight);
}
