import type { Point } from "../../../shared/localvtt";
import { appendPolygonDraftPoint, appendScopedPolygonDraftPoint, removeLastPolygonDraftPoint, type PointPolygonDraft } from "../../canvas/scene";

export interface ScenePolygonDraftState<TDraft extends PointPolygonDraft> {
  ref: { current: TDraft | null };
  setDraft: (draft: TDraft | null) => void;
}

export function setScenePolygonDraft<TDraft extends PointPolygonDraft>(state: ScenePolygonDraftState<TDraft>, draft: TDraft | null): TDraft | null {
  state.ref.current = draft;
  state.setDraft(draft);
  return draft;
}

export function clearScenePolygonDraft<TDraft extends PointPolygonDraft>(state: ScenePolygonDraftState<TDraft>): null {
  setScenePolygonDraft(state, null);
  return null;
}

export function appendScenePolygonDraftPoint<TDraft extends PointPolygonDraft>(state: ScenePolygonDraftState<TDraft>, point: Point): TDraft {
  return setScenePolygonDraft(state, appendPolygonDraftPoint(state.ref.current, point) as TDraft) as TDraft;
}

export function appendScopedScenePolygonDraftPoint<TDraft extends PointPolygonDraft, TScopeKey extends keyof TDraft>(
  state: ScenePolygonDraftState<TDraft>,
  point: Point,
  scopeKey: TScopeKey,
  scopeValue: TDraft[TScopeKey]
): TDraft {
  return setScenePolygonDraft(state, appendScopedPolygonDraftPoint(state.ref.current, point, scopeKey, scopeValue)) as TDraft;
}

export function removeLastScenePolygonDraftPoint<TDraft extends PointPolygonDraft>(state: ScenePolygonDraftState<TDraft>): TDraft | null {
  return setScenePolygonDraft(state, state.ref.current ? removeLastPolygonDraftPoint(state.ref.current) : null);
}
