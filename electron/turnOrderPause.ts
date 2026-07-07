import { normalizeScene, type Scene } from "../src/shared/localvtt.js";

export function pauseSceneTurnOrder(scene: Scene, timestamp = new Date().toISOString()): Scene | null {
  if (!scene.turnOrder.active && !scene.turnOrder.playerViewVisible) {
    return null;
  }

  return normalizeScene({
    ...scene,
    turnOrder: {
      ...scene.turnOrder,
      active: false,
      playerViewVisible: false
    },
    updatedAt: timestamp
  });
}
