import { describe, expect, it } from "vitest";
import {
  getBrushHoverPointForPointerMove,
  getScenePolygonDraftPointerMoveUpdate,
  isPolygonDraftPointerMoveRoute
} from "../../../src/renderer/components/scene/input/scenePointerMoveFallbackUpdates";

describe("scene pointer move fallback updates", () => {
  it("updates polygon draft current point without changing existing points", () => {
    const update = getScenePolygonDraftPointerMoveUpdate(
      {
        operation: "hide" as const,
        points: [{ x: 1, y: 2 }],
        current: { x: 3, y: 4 }
      },
      { x: 9, y: 10 }
    );

    expect(update).toEqual({
      draft: {
        operation: "hide",
        points: [{ x: 1, y: 2 }],
        current: { x: 9, y: 10 }
      },
      point: { x: 9, y: 10 }
    });
  });

  it("returns null when there is no active draft", () => {
    expect(getScenePolygonDraftPointerMoveUpdate(null, { x: 1, y: 2 })).toBeNull();
  });

  it("identifies polygon draft fallback routes", () => {
    expect(isPolygonDraftPointerMoveRoute("drawing-polygon-draft")).toBe(true);
    expect(isPolygonDraftPointerMoveRoute("fog-polygon-draft")).toBe(true);
    expect(isPolygonDraftPointerMoveRoute("weather-polygon-draft")).toBe(true);
    expect(isPolygonDraftPointerMoveRoute("environment-polygon-draft")).toBe(true);
    expect(isPolygonDraftPointerMoveRoute("fog-brush-hover")).toBe(false);
    expect(isPolygonDraftPointerMoveRoute("hover-and-snap")).toBe(false);
  });

  it("selects brush hover points by fallback route", () => {
    const toolPoint = { x: 1, y: 2 };
    const worldPoint = { x: 3, y: 4 };

    expect(getBrushHoverPointForPointerMove("fog-brush-hover", toolPoint, worldPoint)).toBe(toolPoint);
    expect(getBrushHoverPointForPointerMove("drawing-freehand-hover", toolPoint, worldPoint)).toBe(worldPoint);
    expect(getBrushHoverPointForPointerMove("hover-and-snap", toolPoint, worldPoint)).toBeNull();
  });
});
