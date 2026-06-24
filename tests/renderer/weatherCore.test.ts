import { describe, expect, it } from "vitest";
import { createDefaultWeather } from "../../src/shared/localvtt";
import {
  clamp,
  clamp01,
  getMinimumWeatherDimension,
  getQualityMultiplier,
  getWeatherDriftVector,
  getWeatherIntensity,
  getWeatherParticleCount,
  type WeatherBounds
} from "../../src/renderer/canvas/weather";

describe("weatherCore shared helpers", () => {
  it("clamps numeric values with finite fallbacks", () => {
    expect(clamp(1.5, 0, 1)).toBe(1);
    expect(clamp(-0.5, 0, 1)).toBe(0);
    expect(clamp(Number.NaN, 0, 1)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
  });

  it("returns quality multipliers used by particle renderers", () => {
    const weather = createDefaultWeather();
    weather.quality = "low";
    expect(getQualityMultiplier(weather)).toBe(0.62);
    weather.quality = "balanced";
    expect(getQualityMultiplier(weather)).toBe(1);
    weather.quality = "high";
    expect(getQualityMultiplier(weather)).toBe(1.38);
  });

  it("enforces a minimum weather intensity for particle counts", () => {
    const weather = createDefaultWeather();
    weather.intensity = 0;
    expect(getWeatherIntensity(weather)).toBe(0.1);
    expect(getWeatherParticleCount(100, 2, weather)).toBe(20);
  });

  it("scales particle counts by density, quality, and intensity", () => {
    const weather = createDefaultWeather();
    weather.quality = "high";
    weather.intensity = 0.5;
    expect(getWeatherParticleCount(200, 1.5, weather)).toBe(207);
  });

  it("normalizes weather drift vectors and clamps strength", () => {
    const weather = createDefaultWeather();
    weather.directionDegrees = 90;
    weather.driftStrength = 1.4;
    const drift = getWeatherDriftVector(weather);
    expect(drift.strength).toBe(1);
    expect(drift.x).toBeCloseTo(0, 10);
    expect(drift.y).toBeCloseTo(1, 10);
  });

  it("honors minimum drift strength for effects that always need motion", () => {
    const weather = createDefaultWeather();
    weather.driftStrength = 0;
    expect(getWeatherDriftVector(weather, 0.08).strength).toBe(0.08);
  });

  it("returns the smaller weather bounds dimension", () => {
    const bounds: WeatherBounds = { left: 0, top: 0, width: 640, height: 360 };
    expect(getMinimumWeatherDimension(bounds)).toBe(360);
  });
});
