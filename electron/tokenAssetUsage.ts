import type { Campaign, Scene } from "../src/shared/localvtt.js";

export interface TokenAssetUsage {
  sceneId: string;
  sceneName: string;
  count: number;
}

export type ReadTokenUsageScene = (sceneId: string) => Promise<Scene>;

export async function getTokenAssetUsage(campaign: Campaign, assetId: string, readScene: ReadTokenUsageScene): Promise<TokenAssetUsage[]> {
  const usage: TokenAssetUsage[] = [];
  for (const entry of campaign.scenes) {
    try {
      const scene = await readScene(entry.id);
      const count = scene.tokens.filter((token) => token.assetId === assetId).length;
      if (count > 0) {
        usage.push({ sceneId: entry.id, sceneName: entry.name, count });
      }
    } catch {
      // Missing or invalid scenes are reported elsewhere by scene loading.
    }
  }
  return usage;
}
