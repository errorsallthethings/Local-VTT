import type { GridSettings, MeasurementSettings, Point } from "../../../shared/localvtt";
import { drawDashedMovementPath, drawPathMarker, getPathMidpoint, MOVEMENT_PATH_COLORS } from "../tokens/movementPath";
import { getNearestHexCoordinate, hexAxialToPoint, roundAxial } from "../tokens/tokenGeometry";

export interface RulerDrag {
  start: Point;
  current: Point;
  waypoints: Point[];
}

export interface RulerLabel {
  primary: string;
  secondary?: string;
}

export function getMeasurementDistance(start: Point, end: Point, grid: GridSettings): number {
  const measurement = grid.measurement;
  if (grid.type === "gridless" || grid.sizePx <= 0) {
    return getPixelDistance(start, end);
  }

  const dxCells = Math.abs(end.x - start.x) / grid.sizePx;
  const dyCells = Math.abs(end.y - start.y) / grid.sizePx;
  const distanceCells = getDistanceCells(dxCells, dyCells, measurement);
  return distanceCells * measurement.unitsPerGridCell;
}

export function getStraightLineMeasurementDistance(start: Point, end: Point, grid: GridSettings): number {
  if (grid.type === "gridless" || grid.sizePx <= 0) {
    return getPixelDistance(start, end);
  }

  return (getPixelDistance(start, end) / grid.sizePx) * grid.measurement.unitsPerGridCell;
}

export function getMeasurementPathDistance(points: Point[], grid: GridSettings, getDistance = getMeasurementDistance): number {
  return points.reduce((total, point, index) => {
    const previous = points[index - 1];
    return previous ? total + getDistance(previous, point, grid) : total;
  }, 0);
}

export function formatMeasurementDistance(distance: number, measurement: MeasurementSettings, gridType: GridSettings["type"]): string {
  if (gridType === "gridless") {
    return `${Math.round(distance)} px`;
  }

  const roundedDistance = Math.round(distance * 10) / 10;
  const label = roundedDistance === 1 ? getSingularUnit(measurement.unit) : measurement.unit;
  return `${Number.isInteger(roundedDistance) ? roundedDistance.toFixed(0) : roundedDistance.toFixed(1)} ${label}`;
}

export function drawRuler(
  ctx: CanvasRenderingContext2D,
  drag: RulerDrag,
  label: RulerLabel,
  grid: GridSettings,
  zoom = 1
) {
  const scale = 1 / Math.max(0.1, zoom);
  const pathPoints = getRulerPathPoints(drag);
  const midPoint = getPathMidpoint(pathPoints);

  ctx.save();
  drawRulerGridHighlights(ctx, drag, grid);
  drawDashedMovementPath(ctx, pathPoints, scale);
  drawPathMarker(ctx, drag.start, MOVEMENT_PATH_COLORS.start, scale);
  for (const waypoint of drag.waypoints) {
    drawPathMarker(ctx, waypoint, MOVEMENT_PATH_COLORS.waypoint, scale * 0.82, "small");
  }
  drawPathMarker(ctx, drag.current, MOVEMENT_PATH_COLORS.target, scale);
  drawRulerLabel(ctx, midPoint, label, zoom);
  ctx.restore();
}

export function getRulerGridHighlightCells(drag: RulerDrag, grid: GridSettings): Point[] {
  if (grid.type === "gridless" || grid.sizePx <= 0) {
    return [];
  }
  if (grid.type === "square") {
    return getSquareGridHighlightCells(drag, grid);
  }

  if (grid.type === "hex") {
    return getHexGridHighlightCells(drag, grid);
  }

  return [];
}

function getDistanceCells(dxCells: number, dyCells: number, measurement: MeasurementSettings): number {
  // Distance modes are tabletop rules, not geometry modes; the same path can report multiple rule interpretations.
  if (measurement.distanceMode === "manhattan") {
    return dxCells + dyCells;
  }
  if (measurement.distanceMode === "grid") {
    return Math.max(dxCells, dyCells);
  }
  if (measurement.distanceMode === "diagonal-5-10") {
    const diagonalSteps = Math.floor(Math.min(dxCells, dyCells));
    const straightSteps = Math.abs(Math.round(dxCells) - Math.round(dyCells));
    return straightSteps + Math.floor(diagonalSteps / 2) * 3 + (diagonalSteps % 2);
  }
  return Math.hypot(dxCells, dyCells);
}

function getPixelDistance(start: Point, end: Point): number {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

function getSquareGridHighlightCells(drag: RulerDrag, grid: GridSettings): Point[] {
  const size = grid.sizePx;
  if (!isFinitePoint(drag.start) || !isFinitePoint(drag.current) || !Number.isFinite(size) || size <= 0) {
    return [];
  }
  const start = getSquareCellCoordinate(drag.start, grid);
  const end = getSquareCellCoordinate(drag.current, grid);
  if (!Number.isFinite(start.column) || !Number.isFinite(start.row) || !Number.isFinite(end.column) || !Number.isFinite(end.row)) {
    return [];
  }
  const cells: Point[] = [];
  const visited = new Set<string>();
  const addCell = (column: number, row: number) => {
    const key = `${column},${row}`;
    if (visited.has(key)) {
      return;
    }
    visited.add(key);
    cells.push({
      x: grid.offsetX + column * size + size / 2,
      y: grid.offsetY + row * size + size / 2
    });
  };

  // Walk the grid with a supercover-style traversal so highlighted cells match the measured path.
  let column = start.column;
  let row = start.row;
  const endColumn = end.column;
  const endRow = end.row;
  const dx = drag.current.x - drag.start.x;
  const dy = drag.current.y - drag.start.y;
  const stepColumn = Math.sign(dx);
  const stepRow = Math.sign(dy);
  const tDeltaX = stepColumn === 0 ? Number.POSITIVE_INFINITY : size / Math.abs(dx);
  const tDeltaY = stepRow === 0 ? Number.POSITIVE_INFINITY : size / Math.abs(dy);
  let tMaxX = stepColumn === 0 ? Number.POSITIVE_INFINITY : getNextGridLineT(drag.start.x, grid.offsetX, size, stepColumn, dx);
  let tMaxY = stepRow === 0 ? Number.POSITIVE_INFINITY : getNextGridLineT(drag.start.y, grid.offsetY, size, stepRow, dy);

  addCell(column, row);
  const maxSteps = getGridTraversalLimit(start, end);
  let steps = 0;
  while ((column !== endColumn || row !== endRow) && steps < maxSteps) {
    if (Math.abs(tMaxX - tMaxY) < 1e-9) {
      column += stepColumn;
      row += stepRow;
      tMaxX += tDeltaX;
      tMaxY += tDeltaY;
    } else if (tMaxX < tMaxY) {
      column += stepColumn;
      tMaxX += tDeltaX;
    } else {
      row += stepRow;
      tMaxY += tDeltaY;
    }
    addCell(column, row);
    steps += 1;
  }

  return cells;
}

function getHexGridHighlightCells(drag: RulerDrag, grid: GridSettings): Point[] {
  if (!isFinitePoint(drag.start) || !isFinitePoint(drag.current)) {
    return [];
  }
  const start = getNearestHexCoordinate(drag.start, grid);
  const end = getNearestHexCoordinate(drag.current, grid);
  const distance = getHexCoordinateDistance(start, end);
  if (!Number.isFinite(distance) || distance > MAX_GRID_HIGHLIGHT_CELLS) {
    return [];
  }
  const cells = new Map<string, Point>();
  for (let step = 0; step <= distance; step += 1) {
    const progress = distance === 0 ? 0 : step / distance;
    const coord = roundAxial(lerp(start.q, end.q, progress), lerp(start.r, end.r, progress));
    cells.set(`${coord.q},${coord.r}`, hexAxialToPoint(coord, grid));
  }
  return [...cells.values()];
}

function getSquareCellCoordinate(point: Point, grid: GridSettings) {
  return {
    column: Math.floor((point.x - grid.offsetX) / grid.sizePx),
    row: Math.floor((point.y - grid.offsetY) / grid.sizePx)
  };
}

const MAX_GRID_HIGHLIGHT_CELLS = 5000;

function getGridTraversalLimit(start: { column: number; row: number }, end: { column: number; row: number }): number {
  return Math.min(MAX_GRID_HIGHLIGHT_CELLS - 1, Math.abs(end.column - start.column) + Math.abs(end.row - start.row));
}

function isFinitePoint(point: Point) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function getNextGridLineT(start: number, offset: number, size: number, step: number, delta: number) {
  const local = (start - offset) / size;
  const nextLine = step > 0 ? Math.floor(local) + 1 : Math.ceil(local) - 1;
  const nextCoordinate = offset + nextLine * size;
  return (nextCoordinate - start) / delta;
}

function getHexCoordinateDistance(a: { q: number; r: number }, b: { q: number; r: number }) {
  const aS = -a.q - a.r;
  const bS = -b.q - b.r;
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(aS - bS));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function getSingularUnit(unit: MeasurementSettings["unit"]) {
  if (unit === "feet") {
    return "foot";
  }
  if (unit === "meters") {
    return "meter";
  }
  return "mile";
}

function drawRulerGridHighlights(ctx: CanvasRenderingContext2D, drag: RulerDrag, grid: GridSettings) {
  const cells = getRulerPathHighlightCells(drag, grid);
  if (cells.length === 0) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgb(122 162 247 / 0.2)";
  ctx.strokeStyle = "rgb(255 255 255 / 0.42)";
  ctx.lineWidth = Math.max(1, grid.lineThickness);
  for (const cell of cells) {
    if (grid.type === "hex") {
      tracePointyHex(ctx, cell.x, cell.y, Math.max(8, grid.sizePx / 2));
      ctx.fill();
      ctx.stroke();
    } else {
      const size = grid.sizePx;
      ctx.fillRect(cell.x - size / 2, cell.y - size / 2, size, size);
      ctx.strokeRect(cell.x - size / 2, cell.y - size / 2, size, size);
    }
  }
  ctx.restore();
}

export function getRulerPathPoints(drag: RulerDrag): Point[] {
  return [drag.start, ...drag.waypoints, drag.current];
}

export function getRulerPathHighlightCells(drag: RulerDrag, grid: GridSettings): Point[] {
  const points = getRulerPathPoints(drag);
  const cells = new Map<string, Point>();
  for (let index = 1; index < points.length; index += 1) {
    for (const cell of getRulerGridHighlightCells({ start: points[index - 1], current: points[index], waypoints: [] }, grid)) {
      cells.set(`${Math.round(cell.x * 100) / 100},${Math.round(cell.y * 100) / 100}`, cell);
    }
  }
  return [...cells.values()];
}

function drawRulerLabel(ctx: CanvasRenderingContext2D, point: Point, label: RulerLabel, zoom: number) {
  const scale = 1 / Math.max(0.1, zoom);
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.scale(scale, scale);
  ctx.font = "700 18px system-ui, sans-serif";
  const primaryMetrics = ctx.measureText(label.primary);
  ctx.font = "600 12px system-ui, sans-serif";
  const secondaryMetrics = label.secondary ? ctx.measureText(label.secondary) : { width: 0 };
  const width = Math.max(primaryMetrics.width, secondaryMetrics.width) + 24;
  const height = label.secondary ? 52 : 36;
  const x = -width / 2;
  const y = -height - 14;

  ctx.fillStyle = "rgb(8 12 18 / 0.9)";
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f2f6fb";
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.fillText(label.primary, x + 12, y + 24);
  if (label.secondary) {
    ctx.fillStyle = "#aeb9c7";
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.fillText(label.secondary, x + 12, y + 42);
  }
  ctx.restore();
}

function tracePointyHex(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  ctx.beginPath();
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
