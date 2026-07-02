import type { Campaign, Scene } from "../src/shared/localvtt.js";

export type ReadMapUsageScene = (sceneId: string) => Promise<Scene>;

export async function mapAssetUsedByOtherScenes(campaign: Campaign, assetId: string, currentSceneId: string, readScene: ReadMapUsageScene): Promise<boolean> {
  for (const entry of campaign.scenes) {
    if (entry.id === currentSceneId) {
      continue;
    }
    try {
      const scene = await readScene(entry.id);
      if (scene.mapAssetId === assetId) {
        return true;
      }
    } catch {
      // Missing or invalid scenes are reported elsewhere by scene loading.
    }
  }
  return false;
}
