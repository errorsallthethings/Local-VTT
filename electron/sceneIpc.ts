import type { IpcMain } from "electron";
import type { CampaignSummary, Scene } from "../src/shared/localvtt.js";
import {
  assertValidScene
} from "../src/shared/localvtt.js";
import { sceneFile } from "./campaignPaths.js";
import {
  assertIpcSafeId,
  assertOptionalIpcSafeId
} from "./ipcPayloadValidation.js";
import { prepareLoadedScene } from "./sceneLoadDefaults.js";
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
  loadCampaignFromPath: (campaignPath: string) => Promise<CampaignSummary>;
  readSceneMetadata: (campaignPath: string, sceneId: string) => Promise<Scene>;
  unlinkIfExists: (filePath: string) => Promise<void>;
  writeCampaign: (campaignPath: string, campaign: CampaignSummary["campaign"]) => Promise<void>;
  writeScene: (campaignPath: string, scene: Scene) => Promise<void>;
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
