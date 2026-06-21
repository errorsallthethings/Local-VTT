import type { Point, Scene, Token, WeatherMask } from "../../shared/localvtt";

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SceneMarqueeSelectionFilters = {
  tokens: boolean;
  templates: boolean;
  fogMasks: boolean;
  weatherMasks: boolean;
  drawings: boolean;
};

export type SceneMarqueeVisibility = {
  tokens: boolean;
  drawings: boolean;
};

export type SceneMarqueeSelection = {
  tokenIds: string[];
  drawingIds: string[];
  fogShapeIds: string[];
  weatherMaskIds: string[];
};

export type SelectionDragLike = {
  start: Point;
  current: Point;
};

export function getUpdatedSelectionDrag<TDrag extends { current: Point }>(drag: TDrag, point: Point): TDrag {
  return { ...drag, current: point };
}

export function getSelectionDragFromPoint<TMode extends string>(pointerId: number, point: Point, mode: TMode): { pointerId: number; start: Point; current: Point; mode: TMode } {
  return {
    pointerId,
    start: point,
    current: point,
    mode
  };
}

export function getCompletedSceneMarqueeSelection(
  scene: Scene,
  drag: SelectionDragLike,
  filters: SceneMarqueeSelectionFilters,
  visibility: SceneMarqueeVisibility,
  minimumSize = 4
): SceneMarqueeSelection | null {
  const rect = pointsToSelectionRect(drag.start, drag.current);
  if (rect.width < minimumSize && rect.height < minimumSize) {
    return null;
  }
  return getSceneMarqueeSelection(scene, rect, filters, visibility);
}

export function getSceneMarqueeSelection(
  scene: Scene,
  rect: SelectionRect,
  filters: SceneMarqueeSelectionFilters,
  visibility: SceneMarqueeVisibility
): SceneMarqueeSelection {
  const tokenIds = filters.tokens
    ? scene.tokens.filter((candidate) => visibility.tokens && isTokenInSelectionRect(candidate, rect)).map((token) => token.id)
    : [];
  const drawingIds =
    filters.drawings || filters.templates
      ? scene.drawings
          .filter((candidate) => visibility.drawings && isDrawingInSelectionRect(candidate, rect))
          .filter((drawing) => {
            const isTemplate = Boolean(drawing.measurementLabelVisible);
            return isTemplate ? filters.templates : filters.drawings;
          })
          .map((drawing) => drawing.id)
      : [];
  const weatherMaskIds = filters.weatherMasks
    ? scene.weather.masks.filter((candidate) => (candidate.visible ?? true) && isWeatherMaskInSelectionRect(candidate, rect)).map((mask) => mask.id)
    : [];
  const fogShapeIds = filters.fogMasks
    ? scene.fog.shapes.filter((candidate) => (candidate.visibleInGm ?? candidate.visible ?? true) && isFogShapeInSelectionRect(candidate, rect)).map((shape) => shape.id)
    : [];

  return { tokenIds, drawingIds, fogShapeIds, weatherMaskIds };
}

export function pointsToSelectionRect(start: Point, end: Point): SelectionRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  };
}

export function isPointInSelectionRect(point: Point, rect: SelectionRect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

export function isTokenInSelectionRect(token: Token, rect: SelectionRect): boolean {
  const center = { x: token.position.x + token.size.width / 2, y: token.position.y + token.size.height / 2 };
  return isPointInSelectionRect(center, rect);
}

export function isDrawingInSelectionRect(drawing: { points: Point[] }, rect: SelectionRect): boolean {
  return drawing.points.some((point) => isPointInSelectionRect(point, rect));
}

export function isWeatherMaskInSelectionRect(mask: WeatherMask, rect: SelectionRect): boolean {
  if (mask.kind === "circle" && mask.points[0]) {
    return isPointInSelectionRect(mask.points[0], rect);
  }
  return mask.points.some((point) => isPointInSelectionRect(point, rect));
}

export function isFogShapeInSelectionRect(shape: Scene["fog"]["shapes"][number], rect: SelectionRect): boolean {
  return shape.points.some((point) => isPointInSelectionRect(point, rect));
}
