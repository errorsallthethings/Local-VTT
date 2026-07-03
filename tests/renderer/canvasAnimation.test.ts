import { describe, expect, it } from "vitest";
import {
  getCanvasAnimationFramePlan,
  hasCanvasAnimationSources,
  WEATHER_ONLY_FRAME_INTERVAL_MS,
  type CanvasAnimationSources
} from "../../src/renderer/canvas/core";

const idleSources: CanvasAnimationSources = {
  mapAnimating: false,
  tokenAnimating: false,
  tokenConditionAnimating: false,
  tableEventsAnimating: false,
  weatherAnimating: false,
  environmentAnimating: false,
  selectionAnimating: false
};

describe("canvas animation planning", () => {
  it("does not request animation frames when no sources are active", () => {
    expect(hasCanvasAnimationSources(idleSources)).toBe(false);
    expect(getCanvasAnimationFramePlan(idleSources, 100, 0)).toMatchObject({
      shouldDrawFrame: true,
      shouldRequestNextFrame: false,
      shouldUpdateEffectOnlyFrameAt: false,
      hasFullRateAnimation: false,
      effectAnimating: false
    });
  });

  it("draws and requests the next frame at full rate for direct canvas animations", () => {
    const plan = getCanvasAnimationFramePlan({ ...idleSources, tokenAnimating: true, weatherAnimating: true }, 100, 99);

    expect(plan).toMatchObject({
      shouldDrawFrame: true,
      shouldRequestNextFrame: true,
      shouldUpdateEffectOnlyFrameAt: false,
      hasFullRateAnimation: true,
      effectAnimating: true
    });
  });

  it("throttles weather-only and environment-only frames", () => {
    const sources = { ...idleSources, weatherAnimating: true };

    expect(getCanvasAnimationFramePlan(sources, 100, 75)).toMatchObject({
      shouldDrawFrame: false,
      shouldRequestNextFrame: true,
      shouldUpdateEffectOnlyFrameAt: false,
      hasFullRateAnimation: false,
      effectAnimating: true
    });
    expect(getCanvasAnimationFramePlan(sources, 100, 100 - WEATHER_ONLY_FRAME_INTERVAL_MS)).toMatchObject({
      shouldDrawFrame: true,
      shouldRequestNextFrame: true,
      shouldUpdateEffectOnlyFrameAt: true,
      hasFullRateAnimation: false,
      effectAnimating: true
    });
    expect(getCanvasAnimationFramePlan({ ...idleSources, environmentAnimating: true }, 100, 0).shouldUpdateEffectOnlyFrameAt).toBe(true);
  });
});
