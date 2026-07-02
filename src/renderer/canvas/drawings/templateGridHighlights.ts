import type { DrawingElement, GridSettings, Point } from "../../../shared/localvtt";
import { getNearestHexCoordinate, hexAxialToPoint } from "../tokens/tokenGeometry";
import { getDrawingBounds, type DrawingBounds } from "./drawingBounds";
import { distanceBetweenPoints, distanceToSegment, getConeTriangle, isPointInTriangle } from "./drawingGeometry";
import { getLineTemplateCorridorPoints } from "./templateEffectGeometry";

type Rect = { left: number; top: number; right: number; bottom: number };

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

function doesRectIntersectCircle(rect: Rect, center: Point, radius: number): boolean {
  const closestX = Math.max(rect.left, Math.min(center.x, rect.right));
  const closestY = Math.max(rect.top, Math.min(center.y, rect.bottom));
  return distanceBetweenPoints(center, { x: closestX, y: closestY }) < radius - 0.0001;
}

function doRectsIntersect(a: Rect, b: Rect): boolean {
  return a.left < b.right - 0.0001 && a.right > b.left + 0.0001 && a.top < b.bottom - 0.0001 && a.bottom > b.top + 0.0001;
}

function doesRectIntersectPolygon(rect: Rect, polygon: Point[]): boolean {
  return getPolygonArea(clipPolygonToRect(polygon, rect)) > 0.01;
}

function clipPolygonToRect(polygon: Point[], rect: Rect): Point[] {
  return clipPolygonEdge(
    clipPolygonEdge(
      clipPolygonEdge(
        clipPolygonEdge(polygon, (point) => point.x > rect.left, (start, end) => getLineIntersectionWithVertical(start, end, rect.left)),
        (point) => point.x < rect.right,
        (start, end) => getLineIntersectionWithVertical(start, end, rect.right)
      ),
      (point) => point.y > rect.top,
      (start, end) => getLineIntersectionWithHorizontal(start, end, rect.top)
    ),
    (point) => point.y < rect.bottom,
    (start, end) => getLineIntersectionWithHorizontal(start, end, rect.bottom)
  );
}

function clipPolygonEdge(polygon: Point[], isInside: (point: Point) => boolean, getIntersection: (start: Point, end: Point) => Point): Point[] {
  if (polygon.length === 0) {
    return [];
  }
  const result: Point[] = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentInside = isInside(current);
    const previousInside = isInside(previous);
    if (currentInside) {
      if (!previousInside) {
        result.push(getIntersection(previous, current));
      }
      result.push(current);
    } else if (previousInside) {
      result.push(getIntersection(previous, current));
    }
  }
  return result;
}

function getLineIntersectionWithVertical(start: Point, end: Point, x: number): Point {
  const t = (x - start.x) / getSafeDelta(end.x - start.x);
  return { x, y: start.y + (end.y - start.y) * t };
}

function getLineIntersectionWithHorizontal(start: Point, end: Point, y: number): Point {
  const t = (y - start.y) / getSafeDelta(end.y - start.y);
  return { x: start.x + (end.x - start.x) * t, y };
}

function getSafeDelta(delta: number): number {
  if (Math.abs(delta) >= 0.0001) {
    return delta;
  }
  return delta < 0 ? -0.0001 : 0.0001;
}

function getPolygonArea(points: Point[]): number {
  if (points.length < 3) {
    return 0;
  }
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}
