import type { Campaign, Scene } from "../src/shared/localvtt.js";
import { pauseSceneTurnOrder } from "./turnOrderPause.js";

export type ReadTurnOrderScene = (sceneId: string) => Promise<Scene>;
export type WriteTurnOrderScene = (scene: Scene) => Promise<void>;

export async function pauseCampaignTurnOrders(
  campaign: Campaign,
  readScene: ReadTurnOrderScene,
  writeScene: WriteTurnOrderScene
): Promise<Scene[]> {
  const changedScenes: Scene[] = [];

  for (const entry of campaign.scenes) {
    try {
      const normalized = await readScene(entry.id);
      const paused = pauseSceneTurnOrder(normalized);
      if (!paused) {
        continue;
      }
      await writeScene(paused);
      changedScenes.push(paused);
    } catch {
      // Missing or invalid scenes are reported by the normal campaign loading flow.
    }
  }

  return changedScenes;
}
