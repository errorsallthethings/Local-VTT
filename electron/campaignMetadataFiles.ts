import { mkdir, readFile } from "node:fs/promises";

import type { Campaign, Scene } from "../src/shared/localvtt.js";
import { assertInsidePath } from "./campaignPathSafety.js";
import { campaignFile, requiredCampaignFolders, sceneFile } from "./campaignPaths.js";
import { backupExistingMetadataFile } from "./metadataBackupFiles.js";
import { writeMetadataFileAtomically } from "./metadataAtomicWrite.js";
import { campaignBackupFolder, sceneBackupFolder } from "./metadataBackups.js";
import { formatMetadataReadError, formatMetadataWriteError } from "./metadataErrors.js";
import {
  parseCampaignMetadata,
  parseSceneMetadata,
  toPortableCampaignMetadata,
  toPortableSceneMetadata
} from "./persistenceCodecs.js";

export async function ensureCampaignFolders(campaignPath: string): Promise<void> {
  await Promise.all(requiredCampaignFolders(campaignPath).map((folder) => mkdir(folder, { recursive: true })));
}

export async function readCampaignMetadata(campaignPath: string): Promise<Campaign> {
  try {
    const raw = await readFile(campaignFile(campaignPath), "utf8");
    return parseCampaignMetadata(raw);
  } catch (caught) {
    throw formatMetadataReadError("campaign", campaignBackupFolder(campaignPath), caught);
  }
}

export async function readSceneMetadata(campaignPath: string, sceneId: string): Promise<Scene> {
  const filePath = sceneFile(campaignPath, sceneId);
  assertInsidePath(campaignPath, filePath);
  try {
    const raw = await readFile(filePath, "utf8");
    return parseSceneMetadata(raw);
  } catch (caught) {
    throw formatMetadataReadError("scene", sceneBackupFolder(campaignPath, sceneId), caught);
  }
}

export async function writeCampaign(campaignPath: string, campaign: Campaign): Promise<void> {
  try {
    await ensureCampaignFolders(campaignPath);
    await backupExistingMetadataFile(campaignPath, campaignFile(campaignPath), campaignBackupFolder(campaignPath), "campaign.json");
    const portable = toPortableCampaignMetadata(campaign);
    await writeMetadataFileAtomically(campaignFile(campaignPath), `${JSON.stringify(portable, null, 2)}\n`);
  } catch (caught) {
    throw formatMetadataWriteError("campaign", caught);
  }
}

export async function writeScene(campaignPath: string, scene: Scene): Promise<void> {
  try {
    await ensureCampaignFolders(campaignPath);
    await backupExistingMetadataFile(campaignPath, sceneFile(campaignPath, scene.id), sceneBackupFolder(campaignPath, scene.id), `${scene.id}.scene.json`);
    const normalizedScene = toPortableSceneMetadata(scene);
    await writeMetadataFileAtomically(sceneFile(campaignPath, normalizedScene.id), `${JSON.stringify(normalizedScene, null, 2)}\n`);
  } catch (caught) {
    throw formatMetadataWriteError("scene", caught);
  }
}
