import type { Campaign, Scene } from "../src/shared/localvtt.js";
import { removeTokenAssetFromScene } from "./tokenAssetMutations.js";

export type ReadScene = (sceneId: string) => Promise<Scene>;
export type WriteScene = (scene: Scene) => Promise<void>;

export async function removeTokenAssetFromCampaignScenes(
  campaign: Campaign,
  assetId: string,
  readScene: ReadScene,
  writeScene: WriteScene
): Promise<Scene[]> {
  const changedScenes: Scene[] = [];

  for (const entry of campaign.scenes) {
    try {
      const scene = await readScene(entry.id);
      const updatedScene = removeTokenAssetFromScene(scene, assetId);
      if (!updatedScene) {
        continue;
      }
      await writeScene(updatedScene);
      changedScenes.push(updatedScene);
    } catch {
      // Missing or invalid scenes are reported by the normal campaign loading flow.
    }
  }

  return changedScenes;
}
