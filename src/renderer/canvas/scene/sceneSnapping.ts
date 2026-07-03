import type { FogShape, Point, Scene } from "../../../shared/localvtt";
import type { Camera } from "../core/camera";
import { getNearestSquareGridSnapPoint } from "../grid/gridMath";
import { distanceBetween, getNearestGridCellCenter, getNearestHexCenter, getNearestHexVertex } from "../tokens/tokenGeometry";
import { eventToWorldPoint, isSnapModifier, type CanvasPointerLike } from "../core/viewportGeometry";

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

export function resolveSceneToolEventPoint(event: CanvasPointerLike, camera: Camera, scene: Scene | null, snapEnabled = true): SceneSnapResult {
  return resolveSceneToolPoint(eventToWorldPoint(event, camera), scene, snapEnabled, isSnapModifier(event));
}

export function resolveRulerEventPoint(event: CanvasPointerLike, camera: Camera, scene: Scene | null): Point {
  const point = eventToWorldPoint(event, camera);
  if (!scene || !isSnapModifier(event)) {
    return point;
  }
  return getRulerSnapPoint(point, scene) ?? point;
}

export function resolveDrawingToolEventPoint(event: CanvasPointerLike, camera: Camera, scene: Scene | null, canSnap: boolean): SceneSnapResult {
  return resolveDrawingToolPoint(eventToWorldPoint(event, camera), scene, canSnap, isSnapModifier(event));
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

export interface SceneSnapMarkerOptions {
  mode: "gm" | "player";
  hasSnapPoint: boolean;
  fogOperation?: FogShape["operation"] | null;
  drawingTool?: string | null;
  drawingDragActive?: boolean;
  weatherMaskTool?: string | null;
  weatherMaskMoveActive?: boolean;
  environmentEffectTool?: string | null;
  environmentEffectMoveActive?: boolean;
}

export function getSceneSnapMarkerOperations({
  mode,
  hasSnapPoint,
  fogOperation,
  drawingTool,
  drawingDragActive,
  weatherMaskTool,
  weatherMaskMoveActive,
  environmentEffectTool,
  environmentEffectMoveActive
}: SceneSnapMarkerOptions): FogShape["operation"][] {
  if (mode !== "gm" || !hasSnapPoint) {
    return [];
  }

  const operations: FogShape["operation"][] = [];
  if (fogOperation) {
    operations.push(fogOperation);
  }
  if ((drawingTool && drawingTool !== "freehand") || drawingDragActive) {
    operations.push("reveal");
  }
  if (weatherMaskTool || weatherMaskMoveActive) {
    operations.push("reveal");
  }
  if (environmentEffectTool || environmentEffectMoveActive) {
    operations.push("reveal");
  }
  return operations;
}
