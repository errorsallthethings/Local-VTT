import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import type {
  CampaignSummary,
  MetadataBackupPreview,
  MetadataBackupRef,
  MetadataBackupRestoreResult
} from "../src/shared/localvtt.js";
import { normalizeScene } from "../src/shared/localvtt.js";
import { assertInsidePath } from "./campaignPathSafety.js";
import { campaignFile, sceneFile } from "./campaignPaths.js";
import { backupExistingMetadataFile } from "./metadataBackupFiles.js";
import { writeMetadataFileAtomically } from "./metadataAtomicWrite.js";
import {
  campaignBackupFolder,
  createMetadataBackupEntry,
  metadataBackupPathFromRef,
  requireSceneBackupId,
  sceneBackupFolder
} from "./metadataBackups.js";
import {
  parseCampaignMetadata,
  parseSceneMetadata,
  toPortableCampaignMetadata,
  toPortableSceneMetadata
} from "./persistenceCodecs.js";

export type LoadCampaignSummary = (campaignPath: string) => Promise<CampaignSummary>;

export async function previewMetadataBackup(campaignPath: string, ref: MetadataBackupRef): Promise<MetadataBackupPreview> {
  const backupPath = backupPathFromRef(campaignPath, ref);
  const raw = await readFile(backupPath, "utf8");
  const stats = await stat(backupPath);
  if (ref.kind === "campaign") {
    const campaign = parseCampaignMetadata(raw);
    return {
      ...createMetadataBackupEntry("campaign", path.basename(backupPath), stats.size),
      summary: `${campaign.name} - ${campaign.scenes.length} scene${campaign.scenes.length === 1 ? "" : "s"}, ${campaign.assets.length} asset${campaign.assets.length === 1 ? "" : "s"}`,
      json: JSON.stringify(toPortableCampaignMetadata(campaign), null, 2)
    };
  }

  const scene = parseSceneMetadata(raw);
  const sceneId = requireSceneBackupId(ref);
  if (scene.id !== sceneId) {
    throw new Error("Scene backup does not match the selected scene.");
  }
  return {
    ...createMetadataBackupEntry("scene", path.basename(backupPath), stats.size, sceneId, scene.name),
    summary: `${scene.name} - ${scene.tokens.length} token${scene.tokens.length === 1 ? "" : "s"}, ${scene.layers.length} layer${scene.layers.length === 1 ? "" : "s"}`,
    json: JSON.stringify(toPortableSceneMetadata(scene), null, 2)
  };
}

export async function restoreMetadataBackup(
  campaignPath: string,
  ref: MetadataBackupRef,
  loadCampaignSummary: LoadCampaignSummary
): Promise<MetadataBackupRestoreResult> {
  const preview = await previewMetadataBackup(campaignPath, ref);
  const raw = await readFile(backupPathFromRef(campaignPath, ref), "utf8");
  if (ref.kind === "campaign") {
    const campaign = toPortableCampaignMetadata(parseCampaignMetadata(raw));
    await backupExistingMetadataFile(campaignPath, campaignFile(campaignPath), campaignBackupFolder(campaignPath), "campaign.json");
    await writeMetadataFileAtomically(campaignFile(campaignPath), `${JSON.stringify(campaign, null, 2)}\n`);
    return { campaignSummary: await loadCampaignSummary(campaignPath), restored: preview };
  }

  const scene = toPortableSceneMetadata(parseSceneMetadata(raw));
  const sceneId = requireSceneBackupId(ref);
  if (scene.id !== sceneId) {
    throw new Error("Scene backup does not match the selected scene.");
  }
  await backupExistingMetadataFile(campaignPath, sceneFile(campaignPath, sceneId), sceneBackupFolder(campaignPath, sceneId), `${sceneId}.scene.json`);
  await writeMetadataFileAtomically(sceneFile(campaignPath, sceneId), `${JSON.stringify(scene, null, 2)}\n`);
  return { campaignSummary: await loadCampaignSummary(campaignPath), scene: normalizeScene(scene), restored: preview };
}

function backupPathFromRef(campaignPath: string, ref: MetadataBackupRef): string {
  const backupPath = metadataBackupPathFromRef(campaignPath, ref);
  assertInsidePath(campaignPath, backupPath);
  return backupPath;
}
