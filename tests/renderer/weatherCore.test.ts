import { describe, expect, it } from "vitest";
import { createDefaultWeather } from "../../src/shared/localvtt";
import {
  clamp,
  clamp01,
  getDistanceToBoundsExit,
  getDriftEntryPoint,
  getMinimumWeatherDimension,
  getQualityMultiplier,
  getQuietAreaFade,
  getQuietAreaBounds,
  getScreenWeatherArea,
  getTransformedMapWeatherBounds,
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

  it("fades weather particles by current quiet-area position", () => {
    const bounds: WeatherBounds = { left: 100, top: 50, width: 400, height: 200 };
    const quiet = getQuietAreaBounds(bounds, 0.5);

    expect(getQuietAreaFade(bounds, { x: quiet.left + quiet.width / 2, y: quiet.top + quiet.height / 2 }, 0.5, 0)).toBe(0);
    expect(getQuietAreaFade(bounds, { x: bounds.left, y: bounds.top }, 0.5, 0)).toBe(1);
    expect(getQuietAreaFade(bounds, { x: quiet.left + quiet.width / 2, y: quiet.top + quiet.height / 2 }, 0.5, 0.5)).toBeCloseTo(0.21);
  });

  it("starts drift-driven particles upwind and measures their downwind exit", () => {
    const bounds: WeatherBounds = { left: 100, top: 50, width: 400, height: 200 };
    const rightwardEntry = getDriftEntryPoint(bounds, 1, 0, 1);
    const leftwardEntry = getDriftEntryPoint(bounds, -1, 0, 1);

    expect(rightwardEntry.x).toBeLessThan(bounds.left);
    expect(leftwardEntry.x).toBeGreaterThan(bounds.left + bounds.width);
    expect(getDistanceToBoundsExit(bounds, rightwardEntry.x, rightwardEntry.y, 1, 0, 0)).toBeGreaterThan(bounds.width);
    expect(getDistanceToBoundsExit(bounds, leftwardEntry.x, leftwardEntry.y, -1, 0, 0)).toBeGreaterThan(bounds.width);
  });

  it("centers quiet areas from explicit transformed map dimensions", () => {
    const weather = createDefaultWeather();
    const scene = {
      weather,
      mapTransform: { x: 120, y: 80, scale: 1, scaleX: 1, scaleY: 1, rotation: 0 }
    } as Parameters<typeof getScreenWeatherArea>[0];
    const source = { width: 0, height: 0 } as unknown as CanvasImageSource;

    const area = getScreenWeatherArea(scene, 1200, 900, { x: 40, y: 50, zoom: 1.5 }, source, { width: 320, height: 180 });
    const quiet = getQuietAreaBounds(area.clip, 0.6);

    expect(area.clip).toEqual({ left: 220, top: 170, width: 480, height: 270 });
    expect(quiet.left + quiet.width / 2).toBe(area.clip.left + area.clip.width / 2);
    expect(quiet.top + quiet.height / 2).toBe(area.clip.top + area.clip.height / 2);
  });

  it("uses rotated map corners for weather bounds", () => {
    const scene = {
      mapTransform: { x: 10, y: 20, scale: 1, scaleX: 2, scaleY: 1, rotation: 90 }
    } as Parameters<typeof getTransformedMapWeatherBounds>[0];

    const bounds = getTransformedMapWeatherBounds(scene, 100, 50, 800, 600, { x: 5, y: 7, zoom: 1 });

    expect(bounds.left).toBeCloseTo(-35);
    expect(bounds.top).toBeCloseTo(27);
    expect(bounds.width).toBeCloseTo(50);
    expect(bounds.height).toBeCloseTo(200);
  });
});
