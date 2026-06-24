import type { Point } from "../../../shared/localvtt";

export type PointPolygonDraft = {
  points: Point[];
  current?: Point;
};

export function appendPolygonDraftPoint<TDraft extends PointPolygonDraft>(draft: TDraft | null, point: Point): PointPolygonDraft {
  return draft ? { ...draft, points: [...draft.points, point], current: point } : { points: [point], current: point };
}

export function appendScopedPolygonDraftPoint<TDraft extends PointPolygonDraft, TScopeKey extends keyof TDraft>(
  draft: TDraft | null,
  point: Point,
  scopeKey: TScopeKey,
  scopeValue: TDraft[TScopeKey]
): TDraft {
  return draft && draft[scopeKey] === scopeValue
    ? { ...draft, points: [...draft.points, point], current: point }
    : ({ [scopeKey]: scopeValue, points: [point], current: point } as TDraft);
}

export function updatePolygonDraftCurrent<TDraft extends PointPolygonDraft>(draft: TDraft, point: Point): TDraft {
  return { ...draft, current: point };
}

export function removeLastPolygonDraftPoint<TDraft extends PointPolygonDraft>(draft: TDraft): TDraft | null {
  const nextPoints = draft.points.slice(0, -1);
  return nextPoints.length > 0 ? { ...draft, points: nextPoints, current: nextPoints[nextPoints.length - 1] } : null;
}
