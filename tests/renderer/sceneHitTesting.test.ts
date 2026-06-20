import { describe, expect, it } from "vitest";
import type { EnvironmentEffectMask, Scene, WeatherMask } from "../../src/shared/localvtt";
import {
  getEnvironmentEffectAtPoint,
  getMaskHitAtPoint,
  isMaskHitVisibleForLayers,
  isPointInsideEnvironmentEffect,
  isPointInsidePolygon,
  isPointInsideWeatherMask
} from "../../src/renderer/canvas/sceneHitTesting";

function makeScene(overrides: Partial<Scene>): Scene {
  return {
    weather: { masks: [] },
    fog: { shapes: [] },
    environment: { effects: [] },
    ...overrides
  } as Scene;
}

describe("scene hit testing", () => {
  it("checks circles, rectangles, and polygons for environment effects", () => {
    const circle: EnvironmentEffectMask = {
      id: "circle",
      kind: "circle",
      effect: "water",
      points: [{ x: 10, y: 10 }],
      radius: 5
    };
    const rectangle: EnvironmentEffectMask = {
      id: "rectangle",
      kind: "rectangle",
      effect: "fire",
      points: [{ x: 20, y: 20 }, { x: 40, y: 40 }]
    };
    const polygon: EnvironmentEffectMask = {
      id: "polygon",
      kind: "polygon",
      effect: "fog",
      points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }]
    };

    expect(isPointInsideEnvironmentEffect({ x: 14, y: 10 }, circle)).toBe(true);
    expect(isPointInsideEnvironmentEffect({ x: 16, y: 10 }, circle)).toBe(false);
    expect(isPointInsideEnvironmentEffect({ x: 30, y: 30 }, rectangle)).toBe(true);
    expect(isPointInsideEnvironmentEffect({ x: 45, y: 30 }, rectangle)).toBe(false);
    expect(isPointInsideEnvironmentEffect({ x: 5, y: 5 }, polygon)).toBe(true);
    expect(isPointInsideEnvironmentEffect({ x: 9, y: 9 }, polygon)).toBe(false);
  });

  it("checks circles, rectangles, and polygons for weather masks", () => {
    const circle: WeatherMask = {
      id: "circle",
      kind: "circle",
      points: [{ x: 10, y: 10 }],
      radius: 5
    };
    const rectangle: WeatherMask = {
      id: "rectangle",
      kind: "rectangle",
      points: [{ x: 40, y: 40 }, { x: 20, y: 20 }]
    };
    const polygon: WeatherMask = {
      id: "polygon",
      kind: "polygon",
      points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }]
    };

    expect(isPointInsideWeatherMask({ x: 10, y: 15 }, circle)).toBe(true);
    expect(isPointInsideWeatherMask({ x: 10, y: 16 }, circle)).toBe(false);
    expect(isPointInsideWeatherMask({ x: 30, y: 30 }, rectangle)).toBe(true);
    expect(isPointInsideWeatherMask({ x: 19, y: 30 }, rectangle)).toBe(false);
    expect(isPointInsideWeatherMask({ x: 5, y: 5 }, polygon)).toBe(true);
    expect(isPointInsideWeatherMask({ x: -1, y: 5 }, polygon)).toBe(false);
  });

  it("ignores incomplete polygons", () => {
    expect(isPointInsidePolygon({ x: 5, y: 5 }, [{ x: 0, y: 0 }, { x: 10, y: 0 }])).toBe(false);
  });

  it("returns the topmost visible environment effect at a point", () => {
    const bottom: EnvironmentEffectMask = {
      id: "bottom",
      kind: "rectangle",
      effect: "water",
      points: [{ x: 0, y: 0 }, { x: 20, y: 20 }]
    };
    const top: EnvironmentEffectMask = {
      id: "top",
      kind: "rectangle",
      effect: "fire",
      points: [{ x: 0, y: 0 }, { x: 20, y: 20 }]
    };

    expect(getEnvironmentEffectAtPoint(makeScene({ environment: { effects: [bottom, top] } }), { x: 10, y: 10 })?.id).toBe("top");
    expect(getEnvironmentEffectAtPoint(makeScene({ environment: { effects: [bottom, { ...top, visibleInGm: false }] } }), { x: 10, y: 10 })?.id).toBe("bottom");
  });

  it("returns weather masks before fog shapes and respects visibility", () => {
    const weatherMask: WeatherMask = {
      id: "weather",
      kind: "rectangle",
      points: [{ x: 0, y: 0 }, { x: 20, y: 20 }]
    };
    const fogShape: Scene["fog"]["shapes"][number] = {
      id: "fog",
      operation: "hide",
      kind: "rectangle",
      points: [{ x: 0, y: 0 }, { x: 20, y: 20 }],
      visibleInGm: true
    };
    const scene = makeScene({
      weather: { masks: [weatherMask] },
      fog: { shapes: [fogShape] }
    });

    expect(getMaskHitAtPoint(scene, { x: 10, y: 10 })).toEqual({ kind: "weather", mask: weatherMask });
    expect(getMaskHitAtPoint(makeScene({ weather: { masks: [{ ...weatherMask, visible: false }] }, fog: { shapes: [fogShape] } }), { x: 10, y: 10 })).toEqual({
      kind: "fog",
      shape: fogShape
    });
  });

  it("checks whether mask hits are visible for the active layers", () => {
    const weatherMask: WeatherMask = {
      id: "weather",
      kind: "rectangle",
      points: []
    };
    const fogShape: Scene["fog"]["shapes"][number] = {
      id: "fog",
      operation: "hide",
      kind: "rectangle",
      points: []
    };

    expect(isMaskHitVisibleForLayers({ kind: "weather", mask: weatherMask }, true, false)).toBe(true);
    expect(isMaskHitVisibleForLayers({ kind: "weather", mask: weatherMask }, false, true)).toBe(false);
    expect(isMaskHitVisibleForLayers({ kind: "fog", shape: fogShape }, false, true)).toBe(true);
    expect(isMaskHitVisibleForLayers({ kind: "fog", shape: fogShape }, true, false)).toBe(false);
    expect(isMaskHitVisibleForLayers(null, true, true)).toBe(false);
  });
});
