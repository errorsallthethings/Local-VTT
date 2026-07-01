import type { GridCoordinateAxisFormat, Scene } from "../../../shared/localvtt";
import type { Camera } from "../core/camera";

export type GridCoordinateView = "gm" | "player";

export function drawSquareGrid(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  viewportWidth: number,
  viewportHeight: number,
  camera: Camera,
  view: GridCoordinateView = "gm"
) {
  const grid = scene.grid;
  const size = Math.max(4, grid.sizePx);
  const left = -camera.x / camera.zoom;
  const top = -camera.y / camera.zoom;
  const right = left + viewportWidth / camera.zoom;
  const bottom = top + viewportHeight / camera.zoom;
  const columns = Math.max(1, Math.round(grid.mapGridColumns));
  const rows = Math.max(1, Math.round(grid.mapGridRows));
  const gridLeft = grid.offsetX;
  const gridTop = grid.offsetY;
  const gridRight = gridLeft + columns * size;
  const gridBottom = gridTop + rows * size;
  const visibleLeft = Math.max(left, gridLeft);
  const visibleTop = Math.max(top, gridTop);
  const visibleRight = Math.min(right, gridRight);
  const visibleBottom = Math.min(bottom, gridBottom);

  if (visibleLeft > visibleRight || visibleTop > visibleBottom) {
    return;
  }

  const startColumn = Math.max(0, Math.floor((visibleLeft - gridLeft) / size));
  const endColumn = Math.min(columns, Math.ceil((visibleRight - gridLeft) / size));
  const startRow = Math.max(0, Math.floor((visibleTop - gridTop) / size));
  const endRow = Math.min(rows, Math.ceil((visibleBottom - gridTop) / size));

  // Grid is drawn in world coordinates so it stays aligned with map elements across both windows.
  ctx.save();
  ctx.strokeStyle = grid.color;
  ctx.globalAlpha = grid.opacity;
  ctx.lineWidth = grid.lineThickness / camera.zoom;
  ctx.beginPath();

  for (let column = startColumn; column <= endColumn; column += 1) {
    const x = gridLeft + column * size;
    ctx.moveTo(x, visibleTop);
    ctx.lineTo(x, visibleBottom);
  }
  for (let row = startRow; row <= endRow; row += 1) {
    const y = gridTop + row * size;
    ctx.moveTo(visibleLeft, y);
    ctx.lineTo(visibleRight, y);
  }

  ctx.stroke();
  if (grid.showCoordinates) {
    drawSquareGridCoordinates(ctx, scene, { startColumn, endColumn, startRow, endRow, columns, rows, size, camera, view });
  }
  ctx.restore();
}

function drawSquareGridCoordinates(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  bounds: {
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;
    columns: number;
    rows: number;
    size: number;
    camera: Camera;
    view: GridCoordinateView;
  }
) {
  const baseFontSize = bounds.view === "gm" ? scene.grid.coordinateGmFontSize : scene.grid.coordinatePlayerFontSize;
  const fontSize = Math.max(8, baseFontSize);
  const padding = 4;
  const placement = scene.grid.coordinatePlacement;

  ctx.save();
  ctx.globalAlpha = Math.min(1, scene.grid.opacity + 0.25);
  ctx.fillStyle = scene.grid.coordinateColor;
  ctx.font = `${fontSize}px system-ui, sans-serif`;

  if (placement === "edge") {
    drawSquareEdgeCoordinates(ctx, scene, bounds, padding);
  } else {
    drawSquareInlineCoordinates(ctx, scene, bounds, padding);
  }

  ctx.restore();
}

function drawSquareInlineCoordinates(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  bounds: {
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;
    size: number;
  },
  padding: number
) {
  const centered = scene.grid.coordinateCellPosition === "center";
  ctx.textAlign = centered ? "center" : "left";
  ctx.textBaseline = centered ? "middle" : "top";
  for (let row = bounds.startRow; row < bounds.endRow; row += 1) {
    for (let column = bounds.startColumn; column < bounds.endColumn; column += 1) {
      const x = scene.grid.offsetX + column * bounds.size;
      const y = scene.grid.offsetY + row * bounds.size;
      ctx.fillText(
        formatGridCellCoordinate(column, row, scene.grid.coordinateXFormat, scene.grid.coordinateYFormat),
        centered ? x + bounds.size / 2 : x + padding,
        centered ? y + bounds.size / 2 : y + padding
      );
    }
  }
}

function drawSquareEdgeCoordinates(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  bounds: {
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;
    columns: number;
    rows: number;
    size: number;
  },
  padding: number
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const top = scene.grid.offsetY + padding;
  const bottom = scene.grid.offsetY + bounds.rows * bounds.size - padding;
  for (let column = bounds.startColumn; column < bounds.endColumn; column += 1) {
    const x = scene.grid.offsetX + column * bounds.size + bounds.size / 2;
    const label = formatGridAxisCoordinate(column, scene.grid.coordinateXFormat);
    ctx.fillText(label, x, top);
    ctx.textBaseline = "bottom";
    ctx.fillText(label, x, bottom);
    ctx.textBaseline = "top";
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const left = scene.grid.offsetX + padding;
  const right = scene.grid.offsetX + bounds.columns * bounds.size - padding;
  for (let row = bounds.startRow; row < bounds.endRow; row += 1) {
    const y = scene.grid.offsetY + row * bounds.size + bounds.size / 2;
    const label = formatGridAxisCoordinate(row, scene.grid.coordinateYFormat);
    ctx.fillText(label, left, y);
    ctx.textAlign = "right";
    ctx.fillText(label, right, y);
    ctx.textAlign = "left";
  }
}

export function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  viewportWidth: number,
  viewportHeight: number,
  camera: Camera,
  view: GridCoordinateView = "gm"
) {
  const grid = scene.grid;
  const radius = Math.max(8, grid.sizePx / 2);
  const hexWidth = Math.sqrt(3) * radius;
  const hexHeight = radius * 2;
  const columnStep = hexWidth;
  const rowStep = hexHeight * 0.75;
  const left = -camera.x / camera.zoom;
  const top = -camera.y / camera.zoom;
  const right = left + viewportWidth / camera.zoom;
  const bottom = top + viewportHeight / camera.zoom;
  const maxColumns = Math.max(1, Math.round(grid.mapGridColumns));
  const maxRows = Math.max(1, Math.round(grid.mapGridRows));
  const startColumn = Math.max(0, Math.floor((left - grid.offsetX) / columnStep) - 2);
  const endColumn = Math.min(maxColumns - 1, Math.ceil((right - grid.offsetX) / columnStep) + 2);
  const startRow = Math.max(0, Math.floor((top - grid.offsetY) / rowStep) - 2);
  const endRow = Math.min(maxRows - 1, Math.ceil((bottom - grid.offsetY) / rowStep) + 2);

  if (startColumn > endColumn || startRow > endRow) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = grid.color;
  ctx.globalAlpha = grid.opacity;
  ctx.lineWidth = grid.lineThickness / camera.zoom;
  ctx.beginPath();

  for (let row = startRow; row <= endRow; row += 1) {
    for (let column = startColumn; column <= endColumn; column += 1) {
      const centerX = grid.offsetX + column * columnStep + (row % 2 === 0 ? 0 : columnStep / 2);
      const centerY = grid.offsetY + row * rowStep;
      tracePointyHex(ctx, centerX, centerY, radius);
    }
  }

  ctx.stroke();
  if (grid.showCoordinates) {
    drawHexGridCoordinates(ctx, scene, { startColumn, endColumn, startRow, endRow, maxColumns, maxRows, columnStep, rowStep, camera, view });
  }
  ctx.restore();
}

function drawHexGridCoordinates(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  bounds: {
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;
    maxColumns: number;
    maxRows: number;
    columnStep: number;
    rowStep: number;
    camera: Camera;
    view: GridCoordinateView;
  }
) {
  const baseFontSize = bounds.view === "gm" ? scene.grid.coordinateGmFontSize : scene.grid.coordinatePlayerFontSize;
  const fontSize = Math.max(8, baseFontSize);
  const padding = 4;
  const placement = scene.grid.coordinatePlacement;

  ctx.save();
  ctx.globalAlpha = Math.min(1, scene.grid.opacity + 0.25);
  ctx.fillStyle = scene.grid.coordinateColor;
  ctx.font = `${fontSize}px system-ui, sans-serif`;

  if (placement === "edge") {
    drawHexEdgeCoordinates(ctx, scene, bounds, padding);
  } else {
    drawHexInlineCoordinates(ctx, scene, bounds);
  }

  ctx.restore();
}

function drawHexInlineCoordinates(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  bounds: {
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;
    columnStep: number;
    rowStep: number;
  }
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
    for (let column = bounds.startColumn; column <= bounds.endColumn; column += 1) {
      const x = scene.grid.offsetX + column * bounds.columnStep + (row % 2 === 0 ? 0 : bounds.columnStep / 2);
      const y = scene.grid.offsetY + row * bounds.rowStep;
      ctx.fillText(formatGridCellCoordinate(column, row, scene.grid.coordinateXFormat, scene.grid.coordinateYFormat), x, y);
    }
  }
}

function drawHexEdgeCoordinates(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  bounds: {
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;
    maxColumns: number;
    maxRows: number;
    columnStep: number;
    rowStep: number;
  },
  padding: number
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const top = scene.grid.offsetY + padding;
  const bottom = scene.grid.offsetY + (bounds.maxRows - 1) * bounds.rowStep + padding;
  for (let column = bounds.startColumn; column <= bounds.endColumn; column += 1) {
    const x = scene.grid.offsetX + column * bounds.columnStep;
    const label = formatGridAxisCoordinate(column, scene.grid.coordinateXFormat);
    ctx.fillText(label, x, top);
    ctx.textBaseline = "bottom";
    ctx.fillText(label, x, bottom);
    ctx.textBaseline = "top";
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const left = scene.grid.offsetX + padding;
  const right = scene.grid.offsetX + (bounds.maxColumns - 1) * bounds.columnStep + bounds.columnStep - padding;
  for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
    const y = scene.grid.offsetY + row * bounds.rowStep;
    const label = formatGridAxisCoordinate(row, scene.grid.coordinateYFormat);
    ctx.fillText(label, left, y);
    ctx.textAlign = "right";
    ctx.fillText(label, right, y);
    ctx.textAlign = "left";
  }
}

export function formatGridCellCoordinate(column: number, row: number, xFormat: GridCoordinateAxisFormat, yFormat: GridCoordinateAxisFormat): string {
  const xLabel = formatGridAxisCoordinate(column, xFormat);
  const yLabel = formatGridAxisCoordinate(row, yFormat);
  return xFormat === "alpha" && yFormat === "numeric" ? `${xLabel}${yLabel}` : `${xLabel},${yLabel}`;
}

function formatGridAxisCoordinate(index: number, format: GridCoordinateAxisFormat): string {
  return format === "alpha" ? numberToLetters(index + 1) : String(index + 1);
}

function numberToLetters(value: number): string {
  let remaining = Math.max(1, Math.floor(value));
  let label = "";
  while (remaining > 0) {
    remaining -= 1;
    label = String.fromCharCode(65 + (remaining % 26)) + label;
    remaining = Math.floor(remaining / 26);
  }
  return label;
}

function tracePointyHex(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  for (let side = 0; side < 6; side += 1) {
    const angle = (Math.PI / 180) * (60 * side - 30);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    if (side === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}
