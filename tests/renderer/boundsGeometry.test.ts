import { describe, expect, it } from "vitest";
import type { EnvironmentEffectMask, WeatherMask } from "../../src/shared/localvtt";
import { getEnvironmentEffectBounds, getPointBounds, getWeatherMaskBounds } from "../../src/renderer/canvas/boundsGeometry";

describe("bounds geometry", () => {
  it("builds point bounds from unordered points", () => {
    expect(getPointBounds([{ x: 30, y: -5 }, { x: 10, y: 20 }, { x: 40, y: 15 }])).toEqual({
      x: 10,
      y: -5,
      width: 30,
      height: 25
    });
  });

  it("uses radius bounds for circular environment effects", () => {
    const effect: EnvironmentEffectMask = {
      id: "effect-1",
      kind: "circle",
      effect: "water",
      points: [{ x: 50, y: 60 }],
      radius: 15
    };

    expect(getEnvironmentEffectBounds(effect)).toEqual({
      x: 35,
      y: 45,
      width: 30,
      height: 30
    });
  });

  it("uses point bounds for rectangular and polygon environment effects", () => {
    const rectangle: EnvironmentEffectMask = {
      id: "effect-rectangle",
      kind: "rectangle",
      effect: "fire",
      points: [{ x: 80, y: 10 }, { x: 20, y: 70 }]
    };
    const polygon: EnvironmentEffectMask = {
      id: "effect-polygon",
      kind: "polygon",
      effect: "fog",
      points: [{ x: -5, y: 10 }, { x: 20, y: 40 }, { x: 5, y: 5 }]
    };

    expect(getEnvironmentEffectBounds(rectangle)).toEqual({ x: 20, y: 10, width: 60, height: 60 });
    expect(getEnvironmentEffectBounds(polygon)).toEqual({ x: -5, y: 5, width: 25, height: 35 });
  });

  it("returns null for environment effects with no points", () => {
    expect(getEnvironmentEffectBounds({ id: "empty-effect", kind: "polygon", effect: "smoke", points: [] })).toBeNull();
  });

  it("uses minimum one-pixel dimensions for rectangular weather masks", () => {
    const mask: WeatherMask = {
      id: "mask-rectangle",
      kind: "rectangle",
      points: [{ x: 12, y: 18 }, { x: 12, y: 30 }]
    };

    expect(getWeatherMaskBounds(mask)).toEqual({
      x: 12,
      y: 18,
      width: 1,
      height: 12
    });
  });

  it("uses radius bounds for circular weather masks", () => {
    const mask: WeatherMask = {
      id: "mask-circle",
      kind: "circle",
      points: [{ x: 20, y: 30 }],
      radius: 8
    };

    expect(getWeatherMaskBounds(mask)).toEqual({
      x: 12,
      y: 22,
      width: 16,
      height: 16
    });
  });

  it("uses minimum one-pixel dimensions for polygon weather masks", () => {
    const mask: WeatherMask = {
      id: "mask-polygon",
      kind: "polygon",
      points: [{ x: 10, y: 10 }, { x: 10, y: 20 }, { x: 10, y: 40 }]
    };

    expect(getWeatherMaskBounds(mask)).toEqual({
      x: 10,
      y: 10,
      width: 1,
      height: 30
    });
  });

  it("returns null for weather masks with no points", () => {
    expect(getWeatherMaskBounds({ id: "empty-mask", kind: "polygon", points: [] })).toBeNull();
  });
});
