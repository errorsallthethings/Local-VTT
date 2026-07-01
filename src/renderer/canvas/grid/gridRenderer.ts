import type { Scene } from "../../../shared/localvtt";
import type { Camera } from "../core/camera";

export function drawSquareGrid(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  viewportWidth: number,
  viewportHeight: number,
  camera: Camera
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
    drawSquareGridCoordinates(ctx, scene, { startColumn, endColumn, startRow, endRow, size, camera });
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
    size: number;
    camera: Camera;
  }
) {
  const scale = 1 / Math.max(0.1, bounds.camera.zoom);
  const fontSize = Math.max(9, Math.min(14, 11 * scale));
  const padding = 4 * scale;

  ctx.save();
  ctx.globalAlpha = Math.min(1, scene.grid.opacity + 0.25);
  ctx.fillStyle = scene.grid.color;
  ctx.font = `${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (let row = bounds.startRow; row < bounds.endRow; row += 1) {
    const y = scene.grid.offsetY + row * bounds.size;
    for (let column = bounds.startColumn; column < bounds.endColumn; column += 1) {
      const x = scene.grid.offsetX + column * bounds.size;
      ctx.fillText(`${column},${row}`, x + padding, y + padding);
    }
  }

  ctx.restore();
}

export function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  viewportWidth: number,
  viewportHeight: number,
  camera: Camera
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
    drawHexGridCoordinates(ctx, scene, { startColumn, endColumn, startRow, endRow, columnStep, rowStep, camera });
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
    columnStep: number;
    rowStep: number;
    camera: Camera;
  }
) {
  const scale = 1 / Math.max(0.1, bounds.camera.zoom);
  const fontSize = Math.max(9, Math.min(14, 11 * scale));
  const padding = 4 * scale;

  ctx.save();
  ctx.globalAlpha = Math.min(1, scene.grid.opacity + 0.25);
  ctx.fillStyle = scene.grid.color;
  ctx.font = `${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
    for (let column = bounds.startColumn; column <= bounds.endColumn; column += 1) {
      const x = scene.grid.offsetX + column * bounds.columnStep + (row % 2 === 0 ? 0 : bounds.columnStep / 2);
      const y = scene.grid.offsetY + row * bounds.rowStep;
      ctx.fillText(`${column},${row}`, x + padding, y + padding);
    }
  }

  ctx.restore();
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
