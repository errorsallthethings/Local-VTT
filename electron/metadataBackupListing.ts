import { readdir } from "node:fs/promises";
import type { CampaignSummary, MetadataBackupEntry } from "../src/shared/localvtt.js";
import { assertInsidePath } from "./campaignPathSafety.js";
import { listMetadataBackupFolder } from "./metadataBackupFiles.js";
import { campaignBackupFolder, sceneBackupFolder, sceneBackupsRootFolder } from "./metadataBackups.js";

export type LoadCampaignSummary = (campaignPath: string) => Promise<CampaignSummary>;

export async function listCampaignMetadataBackups(campaignPath: string, loadCampaignSummary: LoadCampaignSummary): Promise<MetadataBackupEntry[]> {
  const summary = await loadCampaignSummary(campaignPath);
  const sceneNames = new Map(summary.campaign.scenes.map((scene) => [scene.id, scene.name]));
  const entries: MetadataBackupEntry[] = [];
  entries.push(...(await listMetadataBackupFolder(campaignPath, campaignBackupFolder(campaignPath), "campaign")));

  const scenesRoot = sceneBackupsRootFolder(campaignPath);
  assertInsidePath(campaignPath, scenesRoot);
  try {
    const sceneFolders = await readdir(scenesRoot, { withFileTypes: true });
    for (const folder of sceneFolders) {
      if (!folder.isDirectory()) {
        continue;
      }
      const sceneId = folder.name;
      entries.push(...(await listMetadataBackupFolder(campaignPath, sceneBackupFolder(campaignPath, sceneId), "scene", sceneId, sceneNames.get(sceneId))));
    }
  } catch (caught) {
    if ((caught as NodeJS.ErrnoException).code !== "ENOENT") {
      throw caught;
    }
  }

  return entries.sort((left, right) => right.fileName.localeCompare(left.fileName));
}
