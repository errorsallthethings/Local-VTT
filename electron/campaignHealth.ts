import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  collectCampaignAssetReferences,
  collectSceneAssetReferences,
  createEmptyCampaignHealthReport,
  type CampaignHealthReport,
  type CampaignHealthSceneReferenceKind
} from "../src/shared/campaignHealth.js";
import { assertValidScene, normalizeCampaign, normalizeScene, type Asset, type Campaign, type Scene } from "../src/shared/localvtt.js";
import { requireCampaignRelativePath } from "./assetFiles.js";
import { findMissingCampaignAssetFiles, type MissingCampaignAssetFile } from "./campaignAssetRecovery.js";

export type ReadSceneMetadata = (campaignPath: string, sceneId: string, sceneFile: string) => Promise<Scene>;

export async function inspectCampaignHealth(
  campaignPath: string,
  campaign: Campaign,
  readSceneMetadata: ReadSceneMetadata = readSceneFromDisk
): Promise<CampaignHealthReport> {
  const normalizedCampaign = normalizeCampaign(campaign);
  const report = createEmptyCampaignHealthReport();
  const assetIds = new Set(normalizedCampaign.assets.map((asset) => asset.id));
  const referencedAssetIds = new Set<string>();

  const missingAssetFiles = await findMissingCampaignAssetFiles(campaignPath, normalizedCampaign.assets);
  report.missingAssetFiles = missingAssetFiles;
  report.staleThumbnailReferences = missingAssetFiles.filter((asset) => asset.kind === "thumbnail");

  for (const reference of collectCampaignAssetReferences(normalizedCampaign)) {
    addAssetReference(report, assetIds, referencedAssetIds, reference.assetId, reference.owner);
  }

  for (const entry of normalizedCampaign.scenes) {
    if (entry.mapAssetId) {
      addAssetReference(report, assetIds, referencedAssetIds, entry.mapAssetId, "campaign-scene", entry.id, entry.name);
    }

    let scene: Scene;
    try {
      scene = await readSceneMetadata(campaignPath, entry.id, entry.file);
    } catch (caught) {
      report.sceneFileIssues.push({
        sceneId: entry.id,
        sceneName: entry.name,
        file: entry.file,
        reason: caught instanceof Error ? caught.message : "Scene file could not be read."
      });
      continue;
    }

    for (const reference of collectSceneAssetReferences(normalizeScene(scene))) {
      addAssetReference(report, assetIds, referencedAssetIds, reference.assetId, reference.owner, entry.id, entry.name);
    }
  }

  report.unreferencedAssets = normalizedCampaign.assets
    .filter((asset) => !referencedAssetIds.has(asset.id))
    .map(toUnreferencedAsset);

  return report;
}

async function readSceneFromDisk(campaignPath: string, sceneId: string, sceneFile: string): Promise<Scene> {
  const filePath = requireCampaignRelativePath(campaignPath, sceneFile || path.join("scenes", `${sceneId}.scene.json`), "Scene file is outside the selected campaign folder.");
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  assertValidScene(parsed);
  return parsed;
}

function addAssetReference(
  report: CampaignHealthReport,
  assetIds: ReadonlySet<string>,
  referencedAssetIds: Set<string>,
  assetId: string,
  owner: CampaignHealthSceneReferenceKind,
  sceneId?: string,
  sceneName?: string
): void {
  referencedAssetIds.add(assetId);
  if (assetIds.has(assetId)) {
    return;
  }
  report.unknownAssetReferences.push({
    assetId,
    owner,
    ...(sceneId ? { sceneId } : {}),
    ...(sceneName ? { sceneName } : {})
  });
}

function toUnreferencedAsset(asset: Asset) {
  return {
    assetId: asset.id,
    assetName: asset.name,
    kind: asset.kind,
    relativePath: asset.relativePath
  };
}

export async function campaignFileExists(absolutePath: string): Promise<boolean> {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export type { MissingCampaignAssetFile };
