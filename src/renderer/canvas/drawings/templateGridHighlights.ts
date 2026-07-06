import type { DrawingElement, GridSettings, Point } from "../../../shared/localvtt";
import { getNearestHexCoordinate, hexAxialToPoint } from "../tokens/tokenGeometry";
import { getDrawingBounds, type DrawingBounds } from "./drawingBounds";
import { distanceBetweenPoints, distanceToSegment, getConeTriangle, isPointInTriangle } from "./drawingGeometry";
import { getLineTemplateCorridorPoints } from "./templateEffectGeometry";
import { doesRectIntersectCircle, doesRectIntersectPolygon, doRectsIntersect } from "./templateGridIntersections";

export function getTemplateGridHighlightCells(drawing: DrawingElement, grid: GridSettings): Point[] {
  const bounds = getDrawingBounds(drawing);
  if (!bounds) {
    return [];
  }
  if (grid.type === "hex") {
    return getTemplateHexHighlightCells(drawing, grid, bounds);
  }
  const size = grid.sizePx;
  const columns = {
    start: Math.floor((bounds.left - grid.offsetX) / size) - 1,
    end: Math.ceil((bounds.right - grid.offsetX) / size) + 1
  };
  const rows = {
    start: Math.floor((bounds.top - grid.offsetY) / size) - 1,
    end: Math.ceil((bounds.bottom - grid.offsetY) / size) + 1
  };
  const cells: Point[] = [];
  const maxCells = 2000;
  for (let row = rows.start; row <= rows.end && cells.length < maxCells; row += 1) {
    for (let column = columns.start; column <= columns.end && cells.length < maxCells; column += 1) {
      const center = { x: grid.offsetX + column * size + size / 2, y: grid.offsetY + row * size + size / 2 };
      if (isSquareGridCellInsideTemplate(center, drawing, grid)) {
        cells.push(center);
      }
    }
  }
  return cells;
}

export function drawTemplateGridHighlights(ctx: CanvasRenderingContext2D, drawing: DrawingElement, grid: GridSettings) {
  if (grid.type === "gridless" || grid.sizePx <= 0 || drawing.points.length < 2) {
    return;
  }
  const cells = getTemplateGridHighlightCells(drawing, grid);
  if (cells.length === 0) {
    return;
  }
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(239, 68, 68, 0)";
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = Math.max(5, Math.min(8, grid.lineThickness * 4));
  for (const center of cells) {
    if (grid.type === "hex") {
      tracePointyHex(ctx, center.x, center.y, Math.max(8, grid.sizePx / 2));
      ctx.fill();
      ctx.stroke();
    } else {
      const size = grid.sizePx;
      ctx.fillRect(center.x - size / 2, center.y - size / 2, size, size);
      ctx.strokeRect(center.x - size / 2, center.y - size / 2, size, size);
    }
  }
  ctx.restore();
}

function isSquareGridCellInsideTemplate(center: Point, drawing: DrawingElement, grid: GridSettings): boolean {
  const halfSize = grid.sizePx / 2;
  const rect = {
    left: center.x - halfSize,
    top: center.y - halfSize,
    right: center.x + halfSize,
    bottom: center.y + halfSize
  };

  if (drawing.kind === "line") {
    const [start, end] = drawing.points;
    if (!start || !end) {
      return false;
    }
    const corridor = getLineTemplateCorridorPoints(drawing, 1, grid);
    if (corridor) {
      return doesRectIntersectPolygon(rect, corridor);
    }
    return distanceToSegment(center, start, end) <= 0.0001;
  }
  if (drawing.kind === "circle") {
    const [origin, edge] = drawing.points;
    return origin && edge ? doesRectIntersectCircle(rect, origin, distanceBetweenPoints(origin, edge)) : false;
  }
  if (drawing.kind === "rectangle") {
    const [start, end] = drawing.points;
    if (!start || !end) {
      return false;
    }
    return doRectsIntersect(rect, {
      left: Math.min(start.x, end.x),
      top: Math.min(start.y, end.y),
      right: Math.max(start.x, end.x),
      bottom: Math.max(start.y, end.y)
    });
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(drawing.points);
    return triangle ? doesRectIntersectPolygon(rect, triangle) : false;
  }
  return isPointInsideTemplate(center, drawing, Math.max(8, grid.sizePx * 0.42));
}

function getTemplateHexHighlightCells(drawing: DrawingElement, grid: GridSettings, bounds: DrawingBounds): Point[] {
  const cornerCoords = [
    getNearestHexCoordinate({ x: bounds.left, y: bounds.top }, grid),
    getNearestHexCoordinate({ x: bounds.right, y: bounds.top }, grid),
    getNearestHexCoordinate({ x: bounds.left, y: bounds.bottom }, grid),
    getNearestHexCoordinate({ x: bounds.right, y: bounds.bottom }, grid)
  ];
  const padding = 3;
  const qRange = {
    start: Math.min(...cornerCoords.map((coord) => coord.q)) - padding,
    end: Math.max(...cornerCoords.map((coord) => coord.q)) + padding
  };
  const rRange = {
    start: Math.min(...cornerCoords.map((coord) => coord.r)) - padding,
    end: Math.max(...cornerCoords.map((coord) => coord.r)) + padding
  };
  const cells: Point[] = [];
  const maxCells = 2000;
  for (let q = qRange.start; q <= qRange.end && cells.length < maxCells; q += 1) {
    for (let r = rRange.start; r <= rRange.end && cells.length < maxCells; r += 1) {
      const center = hexAxialToPoint({ q, r }, grid);
      if (
        center.x >= bounds.left - grid.sizePx &&
        center.x <= bounds.right + grid.sizePx &&
        center.y >= bounds.top - grid.sizePx &&
        center.y <= bounds.bottom + grid.sizePx &&
        isPointInsideTemplate(center, drawing, getTemplateHitRadius(drawing, grid))
      ) {
        cells.push(center);
      }
    }
  }
  return cells;
}

function isPointInsideTemplate(point: Point, drawing: DrawingElement, hitRadius: number): boolean {
  if (drawing.kind === "line") {
    return drawing.points[0] && drawing.points[1] ? distanceToSegment(point, drawing.points[0], drawing.points[1]) <= hitRadius : false;
  }
  if (drawing.kind === "circle") {
    const [center, edge] = drawing.points;
    return center && edge ? distanceBetweenPoints(center, point) <= distanceBetweenPoints(center, edge) : false;
  }
  if (drawing.kind === "rectangle") {
    const [start, end] = drawing.points;
    if (!start || !end) {
      return false;
    }
    const left = Math.min(start.x, end.x);
    const right = Math.max(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const bottom = Math.max(start.y, end.y);
    return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(drawing.points);
    return triangle ? isPointInTriangle(point, triangle[0], triangle[1], triangle[2]) : false;
  }
  return false;
}

function getTemplateHitRadius(drawing: DrawingElement, grid: GridSettings): number {
  return drawing.kind === "line" ? getTemplateWidthPixels(drawing, grid) / 2 : Math.max(8, grid.sizePx * 0.42);
}

function getTemplateWidthPixels(drawing: DrawingElement, grid: GridSettings): number {
  const widthFeet = Math.max(0, drawing.templateWidth ?? 5);
  const unitsPerCell = Math.max(0.01, grid.measurement.unitsPerGridCell);
  return (widthFeet / unitsPerCell) * grid.sizePx;
}

function tracePointyHex(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 180) * (60 * index - 30);
    const point = {
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius
    };
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.closePath();
}
