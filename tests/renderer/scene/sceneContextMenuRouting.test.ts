import { describe, expect, it } from "vitest";
import {
  getCanvasContextMenuKindForSceneTarget,
  getSceneContextMenuRoute,
  shouldPreventSceneContextMenuDefault,
  type SceneContextMenuRoutingOptions
} from "../../../src/renderer/components/scene/context-menu/sceneContextMenuRouting";
import type { DrawingElement, EnvironmentEffectMask, FogShape, Token, WeatherMask } from "../../../src/shared/localvtt";

function route(options: Partial<SceneContextMenuRoutingOptions>) {
  return getSceneContextMenuRoute({
    hasTokenDrag: false,
    hasRulerDrag: false,
    hasFogPolygonDraft: false,
    hasDrawingPolygonDraft: false,
    hasWeatherPolygonDraft: false,
    hasEnvironmentPolygonDraft: false,
    canOpenMenu: false,
    ...options
  });
}

describe("scene context menu routing", () => {
  it("prioritizes waypoint removal before polygon backtracking and menu opening", () => {
    expect(route({ hasTokenDrag: true, hasRulerDrag: true, hasFogPolygonDraft: true, canOpenMenu: true })).toBe("token-waypoint");
    expect(route({ hasRulerDrag: true, hasFogPolygonDraft: true, canOpenMenu: true })).toBe("ruler-waypoint");
  });

  it("backtracks polygon drafts in the existing handler order", () => {
    expect(route({ hasFogPolygonDraft: true, hasDrawingPolygonDraft: true })).toBe("fog-polygon-backtrack");
    expect(route({ hasDrawingPolygonDraft: true, hasWeatherPolygonDraft: true })).toBe("drawing-polygon-backtrack");
    expect(route({ hasWeatherPolygonDraft: true, hasEnvironmentPolygonDraft: true })).toBe("weather-polygon-backtrack");
    expect(route({ hasEnvironmentPolygonDraft: true })).toBe("environment-polygon-backtrack");
  });

  it("opens context menus only when no active backtracking route exists", () => {
    expect(route({ canOpenMenu: true })).toBe("open-menu");
    expect(route({ canOpenMenu: false })).toBe("none");
  });

  it("prevents browser context menus for handled routes or active authoring tools", () => {
    expect(shouldPreventSceneContextMenuDefault("none", false)).toBe(false);
    expect(shouldPreventSceneContextMenuDefault("none", true)).toBe(true);
    expect(shouldPreventSceneContextMenuDefault("open-menu", false)).toBe(true);
    expect(shouldPreventSceneContextMenuDefault("token-waypoint", false)).toBe(true);
  });

  it("maps scene context targets to canvas menu kinds", () => {
    expect(getCanvasContextMenuKindForSceneTarget({ kind: "token", token: { id: "token-1" } as Token })).toBe("token");
    expect(getCanvasContextMenuKindForSceneTarget({ kind: "drawing", drawing: { id: "drawing-1" } as DrawingElement, drawingIndex: 0 })).toBe("drawing");
    expect(getCanvasContextMenuKindForSceneTarget({ kind: "environment-effect", effect: { id: "effect-1" } as EnvironmentEffectMask, effectIndex: 0 })).toBe(
      "environment"
    );
    expect(getCanvasContextMenuKindForSceneTarget({ kind: "weather-mask", mask: { id: "weather-1" } as WeatherMask })).toBe("mask");
    expect(getCanvasContextMenuKindForSceneTarget({ kind: "fog", shape: { id: "fog-1" } as FogShape, shapeIndex: 0 })).toBe("mask");
  });
});
