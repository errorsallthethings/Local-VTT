import { describe, expect, it } from "vitest";
import type { Scene, Token, WeatherMask } from "../../src/shared/localvtt";
import {
  isDrawingInSelectionRect,
  isFogShapeInSelectionRect,
  isPointInSelectionRect,
  isTokenInSelectionRect,
  isWeatherMaskInSelectionRect,
  pointsToSelectionRect
} from "../../src/renderer/canvas/selectionGeometry";

describe("selection geometry", () => {
  it("builds a positive selection rect from any drag direction", () => {
    expect(pointsToSelectionRect({ x: 20, y: 30 }, { x: 5, y: 10 })).toEqual({
      x: 5,
      y: 10,
      width: 15,
      height: 20
    });
  });

  it("treats selection rect edges as inclusive", () => {
    const rect = { x: 10, y: 20, width: 30, height: 40 };

    expect(isPointInSelectionRect({ x: 10, y: 20 }, rect)).toBe(true);
    expect(isPointInSelectionRect({ x: 40, y: 60 }, rect)).toBe(true);
    expect(isPointInSelectionRect({ x: 40.1, y: 60 }, rect)).toBe(false);
  });

  it("selects tokens by their center point", () => {
    const token: Token = {
      id: "token-1",
      name: "Token",
      position: { x: 10, y: 10 },
      size: { width: 20, height: 20 },
      hidden: false,
      visibleInPlayer: true
    };

    expect(isTokenInSelectionRect(token, { x: 19, y: 19, width: 2, height: 2 })).toBe(true);
    expect(isTokenInSelectionRect(token, { x: 10, y: 10, width: 5, height: 5 })).toBe(false);
  });

  it("selects drawings when any drawing point is inside", () => {
    const drawing = { points: [{ x: 0, y: 0 }, { x: 25, y: 25 }] };

    expect(isDrawingInSelectionRect(drawing, { x: 20, y: 20, width: 10, height: 10 })).toBe(true);
    expect(isDrawingInSelectionRect(drawing, { x: 5, y: 5, width: 10, height: 10 })).toBe(false);
  });

  it("selects circular weather masks by center point", () => {
    const mask: WeatherMask = {
      id: "mask-1",
      kind: "circle",
      points: [{ x: 40, y: 40 }],
      radius: 20
    };

    expect(isWeatherMaskInSelectionRect(mask, { x: 35, y: 35, width: 10, height: 10 })).toBe(true);
    expect(isWeatherMaskInSelectionRect(mask, { x: 55, y: 40, width: 10, height: 10 })).toBe(false);
  });

  it("selects fog shapes when any shape point is inside", () => {
    const shape: Scene["fog"]["shapes"][number] = {
      id: "fog-1",
      operation: "reveal",
      kind: "polygon",
      points: [{ x: 5, y: 5 }, { x: 50, y: 50 }],
      visible: true
    };

    expect(isFogShapeInSelectionRect(shape, { x: 45, y: 45, width: 10, height: 10 })).toBe(true);
    expect(isFogShapeInSelectionRect(shape, { x: 20, y: 20, width: 10, height: 10 })).toBe(false);
  });
});
