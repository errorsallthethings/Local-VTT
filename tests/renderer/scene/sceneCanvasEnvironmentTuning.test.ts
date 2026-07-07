import { describe, expect, it } from "vitest";
import type { EnvironmentEffectMask } from "../../../src/shared/localvtt";
import { getSceneCanvasEnvironmentTuning } from "../../../src/renderer/components/scene/hooks/useSceneCanvasEnvironmentTuning";

describe("scene canvas environment tuning", () => {
  it("maps all current tuning drafts into an environment effect patch", () => {
    const acidTuning: NonNullable<EnvironmentEffectMask["acidTuning"]> = { color: "#00ff00", bubbleDensity: 2, opacity: 0.5 };
    const fieldTuning: NonNullable<EnvironmentEffectMask["fieldTuning"]> = { color: "#00aaff", opacity: 0.7, ringCount: 3, rippleSpeed: 1 };
    const fogTuning: NonNullable<EnvironmentEffectMask["fogTuning"]> = { color: "#cccccc", opacity: 0.4, drift: 1, density: 2 };

    expect(getSceneCanvasEnvironmentTuning({
      acidTuning,
      arcaneTuning: undefined,
      chaosTuning: undefined,
      coldTuning: undefined,
      darknessTuning: undefined,
      distortionTuning: undefined,
      fieldTuning,
      fireTuning: undefined,
      fogTuning,
      lavaTuning: undefined,
      lightningTuning: undefined,
      natureTuning: undefined,
      poisonTuning: undefined,
      radiantTuning: undefined,
      shockwaveTuning: undefined,
      smokeTuning: undefined,
      voidTuning: undefined,
      waterTuning: undefined
    })).toMatchObject({
      acidTuning,
      fieldTuning,
      fogTuning
    });
  });
});
