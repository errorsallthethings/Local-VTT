import type { Point, Scene } from "../../shared/localvtt";
import { getNearestSquareGridSnapPoint } from "./gridMath";
import { distanceBetween, getNearestGridCellCenter, getNearestHexCenter, getNearestHexVertex } from "./tokenGeometry";

export interface SceneSnapResult {
  point: Point;
  snapPoint: Point | null;
}

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

export function resolveSceneToolPoint(point: Point, scene: Scene | null, snapEnabled: boolean, snapModifierActive: boolean): SceneSnapResult {
  const snapPoint = scene && snapEnabled && snapModifierActive ? getNearestSceneSnapPoint(point, scene) : null;
  return {
    point: snapPoint ?? point,
    snapPoint
  };
}

export function resolveDrawingToolPoint(point: Point, scene: Scene | null, canSnap: boolean, snapModifierActive: boolean): SceneSnapResult {
  if (!scene || !canSnap || !snapModifierActive) {
    return { point, snapPoint: null };
  }
  const snapPoint = getNearestSceneSnapPoint(point, scene);
  return {
    point: snapPoint ?? point,
    snapPoint
  };
}

export function shouldShowSceneSnapPreview(options: {
  scene: Scene | null;
  snapModifierActive: boolean;
  canSnapDrawing?: boolean | null;
  canSnapFog?: boolean | null;
  canSnapWeather?: boolean | null;
  canSnapEnvironment?: boolean | null;
}): boolean {
  return Boolean(
    options.scene &&
      options.snapModifierActive &&
      (options.canSnapDrawing || options.canSnapFog || options.canSnapWeather || options.canSnapEnvironment)
  );
}
