import { describe, expect, it } from "vitest";
import type { DrawingElement, EnvironmentEffectMask, FogShape, WeatherMask } from "../../src/shared/localvtt";
import {
  formatDefaultEnvironmentEffectName,
  formatDefaultWeatherMaskName,
  getDrawingContextLabel,
  getEnvironmentEffectContextLabel,
  getFogShapeContextLabel,
  getWeatherMaskContextLabel
} from "../../src/renderer/canvas/sceneContextLabels";

function drawing(overrides: Partial<DrawingElement> = {}): DrawingElement {
  return {
    id: "drawing-1",
    kind: "rectangle",
    points: [],
    color: "#ffffff",
    opacity: 1,
    strokeWidth: 2,
    visibleInPlayer: true,
    ...overrides
  };
}

function fogShape(overrides: Partial<FogShape> = {}): FogShape {
  return {
    id: "fog-1",
    operation: "hide",
    kind: "rectangle",
    points: [],
    ...overrides
  };
}

function weatherMask(overrides: Partial<WeatherMask> = {}): WeatherMask {
  return {
    id: "weather-1",
    kind: "rectangle",
    points: [],
    ...overrides
  };
}

function environmentEffect(overrides: Partial<EnvironmentEffectMask> = {}): EnvironmentEffectMask {
  return {
    id: "effect-1",
    kind: "rectangle",
    effect: "water",
    points: [],
    ...overrides
  };
}

describe("scene context menu labels", () => {
  it("formats default weather mask names for creation", () => {
    expect(formatDefaultWeatherMaskName(0)).toBe("Weather Effect Mask 1");
    expect(formatDefaultWeatherMaskName(4)).toBe("Weather Effect Mask 5");
    expect(formatDefaultWeatherMaskName(-2)).toBe("Weather Effect Mask 1");
  });

  it("formats default environment effect names for creation", () => {
    expect(formatDefaultEnvironmentEffectName("water", 0)).toBe("Water Effect 1");
    expect(formatDefaultEnvironmentEffectName("electric", 2)).toBe("Electric Effect 3");
    expect(formatDefaultEnvironmentEffectName("fog", -2)).toBe("Mist Effect 1");
  });

  it("uses trimmed custom names when present", () => {
    expect(getDrawingContextLabel(drawing({ name: "  Bridge  " }), 4)).toBe("Bridge");
    expect(getFogShapeContextLabel(fogShape({ name: "  Hidden Room  " }), 2)).toBe("Hidden Room");
    expect(getWeatherMaskContextLabel(weatherMask({ name: "  Rain Gap  " }))).toBe("Rain Gap");
    expect(getEnvironmentEffectContextLabel(environmentEffect({ name: "  River  " }), 3)).toBe("River");
  });

  it("falls back to default drawing and fog labels", () => {
    expect(getDrawingContextLabel(drawing({ kind: "ellipse" }), 2)).toBe("Ellipse 3");
    expect(getFogShapeContextLabel(fogShape({ operation: "reveal", kind: "circle" }), 1)).toBe("Reveal Circle 2");
  });

  it("falls back to stable weather and environment effect labels", () => {
    expect(getWeatherMaskContextLabel(weatherMask())).toBe("Weather Effect Mask");
    expect(getEnvironmentEffectContextLabel(environmentEffect({ effect: "electric" }), 0)).toBe("Electric Effect 1");
  });

  it("clamps negative fallback indexes", () => {
    expect(getDrawingContextLabel(drawing({ kind: "line" }), -4)).toBe("Line 1");
    expect(getFogShapeContextLabel(fogShape({ operation: "hide", kind: "polygon" }), -2)).toBe("Hide Polygon 1");
    expect(getEnvironmentEffectContextLabel(environmentEffect({ effect: "fog" }), -5)).toBe("Mist Effect 1");
  });
});
