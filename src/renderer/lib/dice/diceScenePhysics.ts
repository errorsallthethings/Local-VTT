import * as THREE from "three";
import type { DiceVisualRoll } from "./dice";
import type { SceneRollBounds } from "./dicePoolLayout";

export type Vector3Like = {
  x: number;
  y: number;
  z: number;
};

export type QuaternionLike = Vector3Like & {
  w: number;
};

export type SceneDiceLaunchParameters = {
  angularDamping: number;
  angularVelocity: Vector3Like;
  coinLike: boolean;
  launchZ: number;
  startZ: number;
};

export function getSceneDiceLaunchParameters(visual: DiceVisualRoll, index: number, radius: number): SceneDiceLaunchParameters {
  const coinLike = isCoinLikeDie(visual.die);
  return {
    angularDamping: coinLike ? 0.28 : 0.3,
    angularVelocity: getSceneDiceAngularVelocity(visual, index),
    coinLike,
    launchZ: getSceneDiceLaunchZ(visual, index),
    startZ: 1.02 + radius * (coinLike ? 1.36 : 1.08)
  };
}

export function getSceneThrowVelocity(start: number, end: number, seed: number, offset: number, visual: DiceVisualRoll): number {
  const coinLike = isCoinLikeDie(visual.die);
  const travelTime = coinLike ? 0.28 + seedRange(seed, offset + 32, 0.16) : 0.23 + seedRange(seed, offset + 32, 0.13);
  const push = (seedRange(seed, offset + 42, 2) - 1) * (coinLike ? 9.4 : 13.2);
  return (end - start) / travelTime + push;
}

export function getSceneInitialRotation(visual: DiceVisualRoll, index: number): QuaternionLike {
  const euler = new THREE.Euler(seedRange(visual.seed, 90 + index, Math.PI * 2), seedRange(visual.seed, 100 + index, Math.PI * 2), seedRange(visual.seed, 110 + index, Math.PI * 2));
  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  return { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
}

export function getPhysicsColliderScale(die: DiceVisualRoll["die"], radius: number): number {
  const baseRadius = die === "d6" ? 0.95 : die === "coin" || die === "d2" ? 1.28 : die === "d4" ? 1.45 : die === "d8" ? 1.55 : die === "d10" || die === "d00" ? 1.32 : 1.48;
  return (radius / baseRadius) * 1.18;
}

export function getCoinCenterPush(entry: { x: number; y: number }, bounds: SceneRollBounds, linearSpeed: number, angularSpeed: number): Vector3Like | null {
  if (linearSpeed > 0.2 || angularSpeed > 0.45) {
    return null;
  }
  const wallMargin = 0.7;
  const push = { x: 0, y: 0, z: 0.004 };
  if (entry.x < bounds.minX + wallMargin) {
    push.x = 0.005;
  } else if (entry.x > bounds.maxX - wallMargin) {
    push.x = -0.005;
  }
  if (entry.y < bounds.minY + wallMargin) {
    push.y = 0.005;
  } else if (entry.y > bounds.maxY - wallMargin) {
    push.y = -0.005;
  }
  return push.x === 0 && push.y === 0 ? null : push;
}

function getSceneDiceLaunchZ(visual: DiceVisualRoll, index: number): number {
  return isCoinLikeDie(visual.die) ? 7.8 + seedRange(visual.seed, 50 + index, 2.8) : 8.4 + seedRange(visual.seed, 50 + index, 3.6);
}

function getSceneDiceAngularVelocity(visual: DiceVisualRoll, index: number): Vector3Like {
  if (isCoinLikeDie(visual.die)) {
    return {
      x: (seedRange(visual.seed, 60 + index, 2) - 1) * 8 + 38,
      y: (seedRange(visual.seed, 70 + index, 2) - 1) * 2.5,
      z: (seedRange(visual.seed, 80 + index, 2) - 1) * 6
    };
  }
  return {
    x: (seedRange(visual.seed, 60 + index, 2) - 1) * 23 + 36,
    y: (seedRange(visual.seed, 70 + index, 2) - 1) * 21 + 26,
    z: (seedRange(visual.seed, 80 + index, 2) - 1) * 23 + 31
  };
}

function isCoinLikeDie(die: DiceVisualRoll["die"]): boolean {
  return die === "coin" || die === "d2";
}

function seedRange(seed: number, offset: number, max: number): number {
  const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * max;
}
