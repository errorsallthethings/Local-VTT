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
