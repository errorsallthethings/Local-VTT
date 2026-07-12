import type { BrowserWindow, IpcMain, IpcMainInvokeEvent, WebContents } from "electron";
import path from "node:path";
import type { Asset, CampaignSummary, Scene } from "../src/shared/localvtt.js";
import {
  assertValidScene,
  createDefaultScene,
  normalizeScene
} from "../src/shared/localvtt.js";
import { assertAssetImportCandidate } from "./assetImportFiles.js";
import { addImportedAssetToCampaign } from "./importedAssets.js";
import { createCopiedMapAsset } from "./mapAssetImport.js";
import type { MapThumbnailResult } from "./mapThumbnailRepair.js";
import { sceneFile } from "./campaignPaths.js";
import {
  assertIpcSafeId,
  assertOptionalIpcSafeId
} from "./ipcPayloadValidation.js";
import { prepareLoadedScene } from "./sceneLoadDefaults.js";
import { createCampaignSceneEntry } from "./sceneEntries.js";
import {
  createSceneForCampaign,
  deleteSceneFromCampaign,
  duplicateSceneForCampaign,
  renameSceneInCampaign,
  saveSceneInCampaign
} from "./sceneLifecycle.js";

export interface RegisterSceneIpcOptions {
  assertInsideCampaign: (campaignPath: string, candidatePath: string) => void;
  assertKnownCampaignPath: (campaignPath: string) => void;
  backupSceneBeforeDelete: (campaignPath: string, sceneId: string) => Promise<void>;
  createMapThumbnail: (campaignPath: string, sourcePath: string, assetId: string, rendererWebContents?: WebContents) => Promise<MapThumbnailResult>;
  createAssetId: () => string;
  dialogs: {
    chooseMapFiles: (owner: BrowserWindow | null) => Promise<string[]>;
  };
  getGmWindow: () => BrowserWindow | null;
  getTimestamp: () => string;
  loadCampaignFromPath: (campaignPath: string) => Promise<CampaignSummary>;
  logThumbnailImportFailure: (kind: "map", sourcePath: string, reason: string | undefined) => void;
  readSceneMetadata: (campaignPath: string, sceneId: string) => Promise<Scene>;
  registerAssetPath: (destination: string) => void;
  unlinkIfExists: (filePath: string) => Promise<void>;
  writeCampaign: (campaignPath: string, campaign: CampaignSummary["campaign"]) => Promise<void>;
  writeScene: (campaignPath: string, scene: Scene) => Promise<void>;
}

export interface BulkSceneImportFailure {
  sourcePath: string;
  reason: string;
}

export interface BulkSceneImportResult {
  campaignSummary: CampaignSummary;
  scenes: Scene[];
  assets: Asset[];
  failures: BulkSceneImportFailure[];
}

export function registerSceneIpc(ipcMain: Pick<IpcMain, "handle">, options: RegisterSceneIpcOptions): void {
  ipcMain.handle("scene:create", async (_event, campaignPath: string, sceneName: string) => {
    options.assertKnownCampaignPath(campaignPath);
    const summary = await options.loadCampaignFromPath(campaignPath);
    const { campaign, scene } = createSceneForCampaign(summary.campaign, sceneName);
    await options.writeScene(campaignPath, scene);
    await options.writeCampaign(campaignPath, campaign);
    return { campaignSummary: await options.loadCampaignFromPath(campaignPath), scene };
  });

  ipcMain.handle("scene:bulkImportMaps", async (event: IpcMainInvokeEvent, campaignPath: string): Promise<BulkSceneImportResult | null> => {
    options.assertKnownCampaignPath(campaignPath);
    const sourcePaths = await options.dialogs.chooseMapFiles(options.getGmWindow());
    if (sourcePaths.length === 0) {
      return null;
    }

    let summary = await options.loadCampaignFromPath(campaignPath);
    let campaign = summary.campaign;
    const importedScenes: Scene[] = [];
    const importedAssets: Asset[] = [];
    const failures: BulkSceneImportFailure[] = [];
    const reservedNames = new Set(campaign.scenes.map((scene) => scene.name.trim().toLowerCase()).filter(Boolean));

    for (const sourcePath of sourcePaths) {
      try {
        await assertAssetImportCandidate(sourcePath, "map");
        const imported = await createCopiedMapAsset(campaignPath, sourcePath, event.sender, options);
        const sceneName = getBulkImportedSceneName(path.parse(sourcePath).name, reservedNames);
        reservedNames.add(sceneName.toLowerCase());
        const scene = normalizeScene({
          ...createDefaultScene(sceneName),
          mapAssetId: imported.id,
          updatedAt: options.getTimestamp()
        });
        await options.writeScene(campaignPath, scene);
        campaign = addImportedAssetToCampaign(campaign, imported, options.getTimestamp());
        campaign = {
          ...campaign,
          scenes: [...campaign.scenes, createCampaignSceneEntry(scene)],
          updatedAt: options.getTimestamp()
        };
        importedScenes.push(scene);
        importedAssets.push(imported);
      } catch (caught) {
        failures.push({ sourcePath, reason: caught instanceof Error ? caught.message : "Map could not be imported." });
      }
    }

    if (importedScenes.length > 0) {
      await options.writeCampaign(campaignPath, campaign);
    }

    summary = await options.loadCampaignFromPath(campaignPath);
    return { campaignSummary: summary, scenes: importedScenes, assets: importedAssets, failures };
  });

  ipcMain.handle("scene:duplicate", async (_event, campaignPath: string, sourceScene: Scene, sceneName: string, afterSceneId: string, folderId?: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertValidScene(sourceScene);
    assertIpcSafeId(afterSceneId, "Scene id");
    assertOptionalIpcSafeId(folderId, "Scene folder id");
    const summary = await options.loadCampaignFromPath(campaignPath);
    const { campaign, scene } = duplicateSceneForCampaign(summary.campaign, sourceScene, sceneName, afterSceneId, folderId);
    await options.writeScene(campaignPath, scene);
    await options.writeCampaign(campaignPath, campaign);
    return { campaignSummary: await options.loadCampaignFromPath(campaignPath), scene };
  });

  ipcMain.handle("scene:load", async (_event, campaignPath: string, sceneId: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(sceneId, "Scene id");
    const scene = await options.readSceneMetadata(campaignPath, sceneId);
    return prepareLoadedScene(scene);
  });

  ipcMain.handle("scene:save", async (_event, campaignPath: string, scene: Scene) => {
    options.assertKnownCampaignPath(campaignPath);
    assertValidScene(scene);
    options.assertInsideCampaign(campaignPath, sceneFile(campaignPath, scene.id));
    const summary = await options.loadCampaignFromPath(campaignPath);
    const { campaign, scene: updated } = saveSceneInCampaign(summary.campaign, scene);
    await options.writeScene(campaignPath, updated);

    await options.writeCampaign(campaignPath, campaign);
    return { campaignSummary: await options.loadCampaignFromPath(campaignPath), scene: updated };
  });

  ipcMain.handle("scene:rename", async (_event, campaignPath: string, sceneId: string, sceneName: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(sceneId, "Scene id");
    const filePath = sceneFile(campaignPath, sceneId);
    options.assertInsideCampaign(campaignPath, filePath);
    const scene = await options.readSceneMetadata(campaignPath, sceneId);
    const summary = await options.loadCampaignFromPath(campaignPath);
    const { campaign, scene: updatedScene } = renameSceneInCampaign(summary.campaign, scene, sceneId, sceneName);
    await options.writeScene(campaignPath, updatedScene);

    await options.writeCampaign(campaignPath, campaign);
    return { campaignSummary: await options.loadCampaignFromPath(campaignPath), scene: updatedScene };
  });

  ipcMain.handle("scene:delete", async (_event, campaignPath: string, sceneId: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(sceneId, "Scene id");
    const filePath = sceneFile(campaignPath, sceneId);
    options.assertInsideCampaign(campaignPath, filePath);
    await options.backupSceneBeforeDelete(campaignPath, sceneId);
    await options.unlinkIfExists(filePath);

    const summary = await options.loadCampaignFromPath(campaignPath);
    const campaign = deleteSceneFromCampaign(summary.campaign, sceneId);
    await options.writeCampaign(campaignPath, campaign);
    return options.loadCampaignFromPath(campaignPath);
  });
}

function getBulkImportedSceneName(sourceName: string, reservedNames: Set<string>): string {
  const baseName = sourceName.trim() || "Imported Scene";
  if (!reservedNames.has(baseName.toLowerCase())) {
    return baseName;
  }
  let index = 2;
  while (reservedNames.has(`${baseName} ${index}`.toLowerCase())) {
    index += 1;
  }
  return `${baseName} ${index}`;
}
