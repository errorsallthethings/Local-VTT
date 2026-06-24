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
  const startX = Math.floor((left - grid.offsetX) / size) * size + grid.offsetX;
  const startY = Math.floor((top - grid.offsetY) / size) * size + grid.offsetY;

  // Grid is drawn in world coordinates so it stays aligned with map elements across both windows.
  ctx.save();
  ctx.strokeStyle = grid.color;
  ctx.globalAlpha = grid.opacity;
  ctx.lineWidth = grid.lineThickness / camera.zoom;
  ctx.beginPath();

  for (let x = startX; x <= right; x += size) {
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
  }
  for (let y = startY; y <= bottom; y += size) {
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
  }

  ctx.stroke();
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
  const startColumn = Math.floor((left - grid.offsetX) / columnStep) - 2;
  const endColumn = Math.ceil((right - grid.offsetX) / columnStep) + 2;
  const startRow = Math.floor((top - grid.offsetY) / rowStep) - 2;
  const endRow = Math.ceil((bottom - grid.offsetY) / rowStep) + 2;

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
