import type { GridSettings, Point } from "../../shared/localvtt";

export function getNearestGridPoint(point: Point, grid: GridSettings): Point | null {
  if (grid.type === "gridless" || grid.sizePx <= 0) {
    return null;
  }

  const size = grid.sizePx;
  return {
    x: Math.round((point.x - grid.offsetX) / size) * size + grid.offsetX,
    y: Math.round((point.y - grid.offsetY) / size) * size + grid.offsetY
  };
}

export function getNearestSquareGridSnapPoint(point: Point, grid: GridSettings): Point | null {
  if (grid.type !== "square" || grid.sizePx <= 0) {
    return null;
  }

  const size = grid.sizePx;
  const left = Math.floor((point.x - grid.offsetX) / size) * size + grid.offsetX;
  const top = Math.floor((point.y - grid.offsetY) / size) * size + grid.offsetY;
  const centerX = left + size / 2;
  const centerY = top + size / 2;
  const right = left + size;
  const bottom = top + size;
  const candidates = [
    { x: centerX, y: centerY },
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
    { x: centerX, y: top },
    { x: right, y: centerY },
    { x: centerX, y: bottom },
    { x: left, y: centerY }
  ];

  return candidates.reduce((nearest, candidate) => {
    const nearestDistance = (nearest.x - point.x) ** 2 + (nearest.y - point.y) ** 2;
    const candidateDistance = (candidate.x - point.x) ** 2 + (candidate.y - point.y) ** 2;
    return candidateDistance < nearestDistance ? candidate : nearest;
  });
}

export function constrainSquarePoint(start: Point, current: Point): Point {
  const width = current.x - start.x;
  const height = current.y - start.y;
  const size = Math.max(Math.abs(width), Math.abs(height));
  return {
    x: start.x + Math.sign(width || 1) * size,
    y: start.y + Math.sign(height || 1) * size
  };
}
