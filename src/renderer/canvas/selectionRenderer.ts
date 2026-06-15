export const SELECTION_FILL = "rgb(122 162 247 / 0.18)";
export const SELECTION_OUTER_STROKE = "#05070a";
export const SELECTION_INNER_STROKE = "#f7fbff";
export const SELECTION_CORNER_STROKE = "#f6d365";

export function strokeSelectionPath(ctx: CanvasRenderingContext2D, zoom = 1) {
  const scale = Math.max(0.1, zoom);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = SELECTION_INNER_STROKE;
  ctx.lineWidth = Math.max(1.25, 1.6 / scale);
  const screenDashLength = Math.max(5, Math.min(11, 6.5 * scale));
  const screenGapLength = Math.max(5, Math.min(11, 6 * scale));
  const dashLength = screenDashLength / scale;
  const gapLength = screenGapLength / scale;
  const dashCycle = dashLength + gapLength;
  ctx.setLineDash([dashLength, gapLength]);
  ctx.lineDashOffset = -((performance.now() / 70) % dashCycle);
  ctx.stroke();
  ctx.restore();
}

export function applySelectionFill(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = SELECTION_FILL;
}

export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  zoom = 1,
  padding = 8
) {
  const scale = Math.max(0.1, zoom);
  const inset = padding / scale;
  const x = bounds.x - inset;
  const y = bounds.y - inset;
  const width = bounds.width + inset * 2;
  const height = bounds.height + inset * 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  strokeSelectionPath(ctx, zoom);
  drawSelectionCorners(ctx, x, y, width, height, zoom);
  ctx.restore();
}

export function drawSelectionEllipse(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  zoom = 1,
  padding = 8
) {
  const scale = Math.max(0.1, zoom);
  const inset = padding / scale;
  const x = bounds.x - inset;
  const y = bounds.y - inset;
  const width = bounds.width + inset * 2;
  const height = bounds.height + inset * 2;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  strokeSelectionPath(ctx, zoom);
  ctx.restore();
}

function drawSelectionCorners(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, zoom: number) {
  const scale = Math.max(0.1, zoom);
  const screenLength = Math.max(12, Math.min(28, 18 * scale));
  const screenLineWidth = Math.max(2, Math.min(4, 2.5 * scale));
  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle = SELECTION_CORNER_STROKE;
  ctx.lineWidth = screenLineWidth / scale;
  const length = screenLength / scale;
  const corners = [
    [x, y, 1, 1],
    [x + width, y, -1, 1],
    [x, y + height, 1, -1],
    [x + width, y + height, -1, -1]
  ];
  for (const [cornerX, cornerY, xDirection, yDirection] of corners) {
    ctx.beginPath();
    ctx.moveTo(cornerX, cornerY + yDirection * length);
    ctx.lineTo(cornerX, cornerY);
    ctx.lineTo(cornerX + xDirection * length, cornerY);
    ctx.stroke();
  }
  ctx.restore();
}
