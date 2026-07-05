import type { Point } from "../../../shared/localvtt";
import { updatePolygonDraftCurrent, type PointPolygonDraft } from "../../canvas/scene";
import type { ScenePointerMoveFallbackRoute } from "./scenePointerMoveFallbackRouting";

export type PolygonDraftPointerMoveRoute =
  | "drawing-polygon-draft"
  | "fog-polygon-draft"
  | "weather-polygon-draft"
  | "environment-polygon-draft";

export interface ScenePolygonDraftPointerMoveUpdate<TDraft extends PointPolygonDraft> {
  draft: TDraft | null;
  point: Point;
}

export function getScenePolygonDraftPointerMoveUpdate<TDraft extends PointPolygonDraft>(
  draft: TDraft | null,
  point: Point
): ScenePolygonDraftPointerMoveUpdate<TDraft> | null {
  if (!draft) {
    return null;
  }
  return {
    draft: updatePolygonDraftCurrent(draft, point),
    point
  };
}

export function isPolygonDraftPointerMoveRoute(route: ScenePointerMoveFallbackRoute): route is PolygonDraftPointerMoveRoute {
  return (
    route === "drawing-polygon-draft" ||
    route === "fog-polygon-draft" ||
    route === "weather-polygon-draft" ||
    route === "environment-polygon-draft"
  );
}

export function getBrushHoverPointForPointerMove(route: ScenePointerMoveFallbackRoute, toolPoint: Point, worldPoint: Point): Point | null {
  if (route === "fog-brush-hover") {
    return toolPoint;
  }
  if (route === "drawing-freehand-hover") {
    return worldPoint;
  }
  return null;
}
