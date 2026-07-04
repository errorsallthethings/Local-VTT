import { readFile } from "node:fs/promises";
import { assertValidScene, normalizeCampaign, type Campaign } from "../src/shared/localvtt.js";
import { requireCampaignRelativePath } from "./assetFiles.js";
import { hydrateCampaignSceneEntry } from "./persistenceCodecs.js";

export async function hydrateSceneSummaries(campaignPath: string, campaign: Campaign): Promise<Campaign> {
  const normalizedCampaign = normalizeCampaign(campaign);
  const scenes = await Promise.all(
    normalizedCampaign.scenes.map(async (entry) => {
      if (entry.mapAssetId && entry.weather) {
        return entry;
      }

      try {
        const filePath = requireCampaignRelativePath(campaignPath, entry.file, "Scene file is outside the selected campaign folder.");
        const raw = await readFile(filePath, "utf8");
        const scene = JSON.parse(raw) as unknown;
        assertValidScene(scene);
        return hydrateCampaignSceneEntry(entry, scene);
      } catch {
        return entry;
      }
    })
  );

  return { ...normalizedCampaign, scenes };
}
