import type { Point, Scene } from "../../shared/localvtt";
import { getNearestSquareGridSnapPoint } from "./gridMath";
import { distanceBetween, getNearestGridCellCenter, getNearestHexCenter, getNearestHexVertex } from "./tokenGeometry";

export function getRulerSnapPoint(point: Point, scene: Scene): Point | null {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return null;
  }
  if (scene.grid.type === "hex") {
    return getNearestHexCenter(point, scene.grid);
  }
  return getNearestGridCellCenter(point, scene.grid);
}

export function getNearestSceneSnapPoint(point: Point, scene: Scene): Point | null {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return null;
  }
  const candidates =
    scene.grid.type === "hex"
      ? [getNearestHexCenter(point, scene.grid), getNearestHexVertex(point, scene.grid)]
      : [getNearestSquareGridSnapPoint(point, scene.grid)].filter((candidate): candidate is Point => Boolean(candidate));

  return candidates.reduce<Point | null>((nearest, candidate) => {
    if (!nearest) {
      return candidate;
    }
    return distanceBetween(candidate, point) < distanceBetween(nearest, point) ? candidate : nearest;
  }, null);
}
