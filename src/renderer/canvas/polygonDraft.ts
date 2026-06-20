import type { Point } from "../../shared/localvtt";

export type PointPolygonDraft = {
  points: Point[];
  current?: Point;
};

export function removeLastPolygonDraftPoint<TDraft extends PointPolygonDraft>(draft: TDraft): TDraft | null {
  const nextPoints = draft.points.slice(0, -1);
  return nextPoints.length > 0 ? { ...draft, points: nextPoints, current: nextPoints[nextPoints.length - 1] } : null;
}
