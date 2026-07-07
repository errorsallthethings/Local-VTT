import { describe, expect, it } from "vitest";
import {
  getCoinCenterPush,
  getPhysicsColliderScale,
  getSceneDiceLaunchParameters,
  getSceneInitialRotation,
  getSceneThrowVelocity,
  getUpdatedSceneDieSettleState,
  getVectorSpeed,
  isSceneDieResting,
  shouldNudgeCoinOffEdge
} from "../../src/renderer/lib/dice";

describe("dice scene physics helpers", () => {
  it("calculates distinct launch parameters for coin-like and polyhedral dice", () => {
    const coin = getSceneDiceLaunchParameters({ die: "coin", result: 1, label: "Heads", seed: 0.25 }, 2, 0.5);
    const d20 = getSceneDiceLaunchParameters({ die: "d20", result: 17, label: "17", seed: 0.25 }, 2, 0.5);

    expect(coin.coinLike).toBe(true);
    expect(coin.angularDamping).toBe(0.28);
    expect(coin.startZ).toBeCloseTo(1.7);
    expect(coin.launchZ).toBeGreaterThanOrEqual(7.8);
    expect(coin.launchZ).toBeLessThan(10.6);
    expect(d20.coinLike).toBe(false);
    expect(d20.angularDamping).toBe(0.3);
    expect(d20.startZ).toBeCloseTo(1.56);
    expect(d20.launchZ).toBeGreaterThanOrEqual(8.4);
    expect(d20.launchZ).toBeLessThan(12);
  });

  it("returns deterministic throw velocities for identical seeds", () => {
    const visual = { die: "d8" as const, result: 6, label: "6", seed: 0.812 };

    expect(getSceneThrowVelocity(-4, 1.5, visual.seed, 3, visual)).toBe(getSceneThrowVelocity(-4, 1.5, visual.seed, 3, visual));
    expect(getSceneThrowVelocity(-4, 1.5, visual.seed, 3, visual)).not.toBe(getSceneThrowVelocity(-4, 1.5, visual.seed, 4, visual));
  });

  it("produces normalized initial rotation quaternions", () => {
    const rotation = getSceneInitialRotation({ die: "d12", result: 9, label: "9", seed: 0.4 }, 5);
    const length = Math.hypot(rotation.x, rotation.y, rotation.z, rotation.w);

    expect(length).toBeCloseTo(1, 10);
  });

  it("scales physics colliders by die family", () => {
    expect(getPhysicsColliderScale("d6", 0.5)).toBeCloseTo(0.6210526316);
    expect(getPhysicsColliderScale("coin", 0.5)).toBeCloseTo(0.4609375);
    expect(getPhysicsColliderScale("d20", 0.5)).toBeCloseTo(0.3986486486);
  });

  it("pushes slow coins away from nearby walls only", () => {
    const bounds = { minX: -5, maxX: 5, minY: -3, maxY: 3 };

    expect(getCoinCenterPush({ x: -4.5, y: 0 }, bounds, 0.1, 0.1)).toEqual({ x: 0.005, y: 0, z: 0.004 });
    expect(getCoinCenterPush({ x: 4.5, y: 2.5 }, bounds, 0.1, 0.1)).toEqual({ x: -0.005, y: -0.005, z: 0.004 });
    expect(getCoinCenterPush({ x: 0, y: 0 }, bounds, 0.1, 0.1)).toBeNull();
    expect(getCoinCenterPush({ x: -4.5, y: 0 }, bounds, 0.21, 0.1)).toBeNull();
    expect(getCoinCenterPush({ x: -4.5, y: 0 }, bounds, 0.1, 0.46)).toBeNull();
  });

  it("calculates vector speed from x/y/z components", () => {
    expect(getVectorSpeed({ x: 3, y: 4, z: 12 })).toBe(13);
  });

  it("checks die resting thresholds with coin face-normal requirements", () => {
    expect(isSceneDieResting({ die: "d20", linearSpeed: 0.18, angularSpeed: 0.32 })).toBe(true);
    expect(isSceneDieResting({ die: "d20", linearSpeed: 0.181, angularSpeed: 0.1 })).toBe(false);
    expect(isSceneDieResting({ die: "d20", linearSpeed: 0.1, angularSpeed: 0.321 })).toBe(false);
    expect(isSceneDieResting({ die: "coin", linearSpeed: 0.1, angularSpeed: 0.1, coinFaceNormalZ: 0.61 })).toBe(false);
    expect(isSceneDieResting({ die: "coin", linearSpeed: 0.1, angularSpeed: 0.1, coinFaceNormalZ: -0.62 })).toBe(true);
  });

  it("updates stable label state until a die has held the same face long enough", () => {
    expect(getUpdatedSceneDieSettleState({ label: "8", now: 1000, resting: false, stableLabel: "8", stableStartedAt: 500 })).toEqual({
      settled: false,
      stableLabel: null,
      stableStartedAt: 0
    });
    expect(getUpdatedSceneDieSettleState({ label: "12", now: 1200, resting: true, stableLabel: "8", stableStartedAt: 500 })).toEqual({
      settled: false,
      stableLabel: "12",
      stableStartedAt: 1200
    });
    expect(getUpdatedSceneDieSettleState({ label: "12", now: 1500, resting: true, stableLabel: "12", stableStartedAt: 1200 })).toEqual({
      settled: false,
      stableLabel: "12",
      stableStartedAt: 1200
    });
    expect(getUpdatedSceneDieSettleState({ label: "12", now: 1620, resting: true, stableLabel: "12", stableStartedAt: 1200 })).toEqual({
      settled: true,
      stableLabel: "12",
      stableStartedAt: 1200
    });
  });

  it("gates coin edge nudges by timing, face angle, and motion", () => {
    const ready = {
      angularSpeed: 0.5,
      coinEdgeNudgeCount: 0,
      die: "coin" as const,
      faceNormalZ: 0.2,
      linearSpeed: 0.2,
      msSinceLastNudge: 650,
      translationZ: 0.9,
      velocityZ: 0.1
    };

    expect(shouldNudgeCoinOffEdge(ready)).toBe(true);
    expect(shouldNudgeCoinOffEdge({ ...ready, die: "d2" })).toBe(false);
    expect(shouldNudgeCoinOffEdge({ ...ready, coinEdgeNudgeCount: 8 })).toBe(false);
    expect(shouldNudgeCoinOffEdge({ ...ready, msSinceLastNudge: 649 })).toBe(false);
    expect(shouldNudgeCoinOffEdge({ ...ready, faceNormalZ: 0.381 })).toBe(false);
    expect(shouldNudgeCoinOffEdge({ ...ready, translationZ: 0.921 })).toBe(false);
    expect(shouldNudgeCoinOffEdge({ ...ready, velocityZ: 0.121 })).toBe(false);
    expect(shouldNudgeCoinOffEdge({ ...ready, linearSpeed: 0.451 })).toBe(false);
    expect(shouldNudgeCoinOffEdge({ ...ready, angularSpeed: 0.851 })).toBe(false);
  });
});
