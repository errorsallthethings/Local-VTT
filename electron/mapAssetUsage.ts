import { sceneUsesMapAsset, type Campaign, type Scene } from "../src/shared/localvtt.js";

export type ReadMapUsageScene = (sceneId: string) => Promise<Scene>;

export async function mapAssetUsedByOtherScenes(campaign: Campaign, assetId: string, currentSceneId: string, readScene: ReadMapUsageScene): Promise<boolean> {
  return (await getMapAssetSceneNames(campaign, assetId, currentSceneId, readScene)).length > 0;
}

export async function getMapAssetSceneNames(campaign: Campaign, assetId: string, currentSceneId: string, readScene: ReadMapUsageScene): Promise<string[]> {
  const sceneNames: string[] = [];
  for (const entry of campaign.scenes) {
    if (entry.id === currentSceneId) {
      continue;
    }
    try {
      const scene = await readScene(entry.id);
      if (sceneUsesMapAsset(scene, assetId)) {
        sceneNames.push(entry.name);
      }
    } catch {
      // Missing or invalid scenes are reported elsewhere by scene loading.
    }
  }
  return sceneNames;
}
