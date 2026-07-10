import { describe, expect, it } from "vitest";
import { DICE_IMPACT_AUDIO_COOLDOWN_MS, getSceneDiceImpact } from "../../src/renderer/lib/dice";

const bounds = {
  maxX: 6,
  maxY: 4,
  minX: -6,
  minY: -4
};

describe("dice impact audio detection", () => {
  it("detects a floor impact from a sharp upward velocity change near the floor", () => {
    expect(
      getSceneDiceImpact({
        bounds,
        currentVelocity: { x: 0.8, y: 0.1, z: 0.35 },
        lastImpactAt: 0,
        now: 500,
        previousVelocity: { x: 0.8, y: 0.1, z: -5.2 },
        radius: 0.8,
        translation: { x: 0, y: 0, z: 0.82 }
      })
    ).toMatchObject({ surface: "floor" });
  });

  it("detects a wall impact near a scene roll bound", () => {
    expect(
      getSceneDiceImpact({
        bounds,
        currentVelocity: { x: -1.2, y: 0, z: 0.1 },
        lastImpactAt: 0,
        now: 500,
        previousVelocity: { x: 4.4, y: 0, z: 0.1 },
        radius: 0.8,
        translation: { x: 5.4, y: 0, z: 1.2 }
      })
    ).toMatchObject({ surface: "wall" });
  });

  it("ignores weak motion changes and impacts inside the cooldown window", () => {
    const weakImpact = getSceneDiceImpact({
      bounds,
      currentVelocity: { x: 0, y: 0, z: -1 },
      lastImpactAt: 0,
      now: 500,
      previousVelocity: { x: 0, y: 0, z: -1.6 },
      radius: 0.8,
      translation: { x: 0, y: 0, z: 0.82 }
    });
    const cooldownImpact = getSceneDiceImpact({
      bounds,
      currentVelocity: { x: 0, y: 0, z: 0.5 },
      lastImpactAt: 500,
      now: 500 + DICE_IMPACT_AUDIO_COOLDOWN_MS - 1,
      previousVelocity: { x: 0, y: 0, z: -5 },
      radius: 0.8,
      translation: { x: 0, y: 0, z: 0.82 }
    });

    expect(weakImpact).toBeNull();
    expect(cooldownImpact).toBeNull();
  });
});
