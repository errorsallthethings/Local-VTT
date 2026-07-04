import type { CanvasContextMenuKind } from "../../lib/ui";
import type { SceneContextMenuTarget } from "./sceneContextMenuTarget";

export type SceneContextMenuRoute =
  | "token-waypoint"
  | "ruler-waypoint"
  | "open-menu"
  | "fog-polygon-backtrack"
  | "drawing-polygon-backtrack"
  | "weather-polygon-backtrack"
  | "environment-polygon-backtrack"
  | "none";

export interface SceneContextMenuRoutingOptions {
  hasTokenDrag: boolean;
  hasRulerDrag: boolean;
  hasFogPolygonDraft: boolean;
  hasDrawingPolygonDraft: boolean;
  hasWeatherPolygonDraft: boolean;
  hasEnvironmentPolygonDraft: boolean;
  canOpenMenu: boolean;
}

export function getSceneContextMenuRoute(options: SceneContextMenuRoutingOptions): SceneContextMenuRoute {
  if (options.hasTokenDrag) {
    return "token-waypoint";
  }
  if (options.hasRulerDrag) {
    return "ruler-waypoint";
  }
  if (options.hasFogPolygonDraft) {
    return "fog-polygon-backtrack";
  }
  if (options.hasDrawingPolygonDraft) {
    return "drawing-polygon-backtrack";
  }
  if (options.hasWeatherPolygonDraft) {
    return "weather-polygon-backtrack";
  }
  if (options.hasEnvironmentPolygonDraft) {
    return "environment-polygon-backtrack";
  }
  return options.canOpenMenu ? "open-menu" : "none";
}

export function shouldPreventSceneContextMenuDefault(route: SceneContextMenuRoute, authoringToolActive: boolean): boolean {
  return authoringToolActive || route !== "none";
}

export function getCanvasContextMenuKindForSceneTarget(target: SceneContextMenuTarget): CanvasContextMenuKind {
  if (target.kind === "token") {
    return "token";
  }
  if (target.kind === "drawing") {
    return "drawing";
  }
  if (target.kind === "environment-effect") {
    return "environment";
  }
  return "mask";
}
