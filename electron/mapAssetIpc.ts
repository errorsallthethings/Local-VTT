import type { BrowserWindow, IpcMain, IpcMainInvokeEvent, WebContents } from "electron";
import path from "node:path";
import type { Asset, Campaign, CampaignSummary, Scene } from "../src/shared/localvtt.js";
import { requireCampaignRelativePath } from "./assetFiles.js";
import { assertAssetImportCandidate } from "./assetImportFiles.js";
import { mapMediaType } from "./assetImportValidation.js";
import { requireCampaignAsset } from "./campaignAssetLookup.js";
import { addImportedAssetToCampaign } from "./importedAssets.js";
import { assertIpcSafeId } from "./ipcPayloadValidation.js";
import { createCopiedMapAsset } from "./mapAssetImport.js";
import { addMapVariantToScene, removeMapAssetFromCampaign, removeMapAssetFromScene, replaceSceneMapAsset } from "./mapAssetMutations.js";
import { getMapAssetSceneNames, mapAssetUsedByOtherScenes } from "./mapAssetUsage.js";
import { getMapReplacementPreview } from "./mapReplacementPreview.js";
import {
  consumeMapReplacementToken,
  createMapReplacementToken,
  type MapReplacementTokenStore
} from "./mapReplacementTokens.js";
import { assertSceneUsesMapAsset, requireCurrentMapAsset } from "./mapReplacementValidation.js";
import type { MapThumbnailResult } from "./mapThumbnailRepair.js";

export interface MapAssetDialogProvider {
  chooseMapFile: (owner: BrowserWindow | null) => Promise<string | null>;
}

export interface RegisterMapAssetIpcOptions {
  assertKnownCampaignPath: (campaignPath: string) => void;
  createAssetId: () => string;
  createMapThumbnail: (campaignPath: string, sourcePath: string, assetId: string, rendererWebContents?: WebContents) => Promise<MapThumbnailResult>;
  dialogs: MapAssetDialogProvider;
  getGmWindow: () => BrowserWindow | null;
  getTimestamp: () => string;
  loadCampaignFromPath: (campaignPath: string) => Promise<CampaignSummary>;
  logThumbnailImportFailure: (kind: "map", sourcePath: string, reason: string | undefined) => void;
  mapReplacementTokens: MapReplacementTokenStore;
  readSceneMetadata: (campaignPath: string, sceneId: string) => Promise<Scene>;
  registerAssetPath: (destination: string) => void;
  removeCampaignAssetFiles: (campaignPath: string, asset: Asset) => Promise<void>;
  writeCampaign: (campaignPath: string, campaign: Campaign) => Promise<void>;
  writeScene: (campaignPath: string, scene: Scene) => Promise<void>;
}

export function registerMapAssetIpc(ipcMain: Pick<IpcMain, "handle">, options: RegisterMapAssetIpcOptions): void {
  ipcMain.handle("asset:importMap", async (event: IpcMainInvokeEvent, campaignPath: string) => {
    options.assertKnownCampaignPath(campaignPath);
    const sourcePath = await options.dialogs.chooseMapFile(options.getGmWindow());
    if (!sourcePath) {
      return null;
    }

    await assertAssetImportCandidate(sourcePath, "map");

    const summary = await options.loadCampaignFromPath(campaignPath);
    const imported = await importMapAsset(campaignPath, sourcePath, summary.campaign, event.sender, options);
    return { campaignSummary: await options.loadCampaignFromPath(campaignPath), asset: imported };
  });

  ipcMain.handle("asset:previewMapReplacement", async (_event: IpcMainInvokeEvent, campaignPath: string, sceneId: string, currentAssetId: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(sceneId, "Scene id");
    assertIpcSafeId(currentAssetId, "Asset id");
    const sourcePath = await options.dialogs.chooseMapFile(options.getGmWindow());
    if (!sourcePath) {
      return null;
    }

    await assertAssetImportCandidate(sourcePath, "map");

    const summary = await options.loadCampaignFromPath(campaignPath);
    const currentAsset = requireCurrentMapAsset(summary.campaign, currentAssetId);
    const currentScene = await options.readSceneMetadata(campaignPath, sceneId);
    assertSceneUsesMapAsset(currentScene, currentAssetId);

    const currentAssetPath = requireCampaignRelativePath(campaignPath, currentAsset.relativePath);
    const nextMediaType = mapMediaType(sourcePath);
    const dimensions = await getMapReplacementPreview(currentAssetPath, currentAsset.mediaType, sourcePath, nextMediaType);
    const replacementToken = createMapReplacementToken(options.mapReplacementTokens, {
      campaignPath,
      sceneId,
      currentAssetId,
      sourcePath
    });

    return {
      replacementId: replacementToken.id,
      sourceName: path.basename(sourcePath),
      currentAssetName: currentAsset.name,
      currentDimensions: dimensions.currentDimensions,
      nextDimensions: dimensions.nextDimensions,
      warning: dimensions.warning
    };
  });

  ipcMain.handle("asset:previewMapVariant", async (_event: IpcMainInvokeEvent, campaignPath: string, sceneId: string, currentAssetId: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(sceneId, "Scene id");
    assertIpcSafeId(currentAssetId, "Asset id");
    const sourcePath = await options.dialogs.chooseMapFile(options.getGmWindow());
    if (!sourcePath) {
      return null;
    }

    await assertAssetImportCandidate(sourcePath, "map");

    const summary = await options.loadCampaignFromPath(campaignPath);
    const currentAsset = requireCurrentMapAsset(summary.campaign, currentAssetId);
    const currentScene = await options.readSceneMetadata(campaignPath, sceneId);
    assertSceneUsesMapAsset(currentScene, currentAssetId);

    const currentAssetPath = requireCampaignRelativePath(campaignPath, currentAsset.relativePath);
    const nextMediaType = mapMediaType(sourcePath);
    const dimensions = await getMapReplacementPreview(currentAssetPath, currentAsset.mediaType, sourcePath, nextMediaType);
    const replacementToken = createMapReplacementToken(options.mapReplacementTokens, {
      campaignPath,
      sceneId,
      currentAssetId,
      sourcePath
    });

    return {
      replacementId: replacementToken.id,
      sourceName: path.basename(sourcePath),
      currentAssetName: currentAsset.name,
      currentDimensions: dimensions.currentDimensions,
      nextDimensions: dimensions.nextDimensions,
      warning: dimensions.warning
    };
  });

  ipcMain.handle("asset:replaceMap", async (event: IpcMainInvokeEvent, campaignPath: string, sceneId: string, currentAssetId: string, replacementId: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(sceneId, "Scene id");
    assertIpcSafeId(currentAssetId, "Asset id");
    assertIpcSafeId(replacementId, "Map replacement id");
    const sourcePath = consumeMapReplacementToken(options.mapReplacementTokens, replacementId, {
      campaignPath,
      sceneId,
      currentAssetId
    });
    await assertAssetImportCandidate(sourcePath, "map");

    const summary = await options.loadCampaignFromPath(campaignPath);
    const currentAsset = requireCurrentMapAsset(summary.campaign, currentAssetId);
    const currentScene = await options.readSceneMetadata(campaignPath, sceneId);
    assertSceneUsesMapAsset(currentScene, currentAssetId);

    const imported = await createCopiedMapAsset(campaignPath, sourcePath, event.sender, options);
    const keepCurrentAsset = await mapAssetUsedByOtherScenes(summary.campaign, currentAsset.id, sceneId, (candidateSceneId) =>
      options.readSceneMetadata(campaignPath, candidateSceneId)
    );
    const { campaign, scene: updatedScene } = replaceSceneMapAsset(summary.campaign, currentScene, currentAsset.id, imported, keepCurrentAsset, options.getTimestamp());
    await options.writeScene(campaignPath, updatedScene);
    await options.writeCampaign(campaignPath, campaign);
    if (!keepCurrentAsset) {
      await options.removeCampaignAssetFiles(campaignPath, currentAsset);
    }
    return { campaignSummary: await options.loadCampaignFromPath(campaignPath), scene: updatedScene, asset: imported };
  });

  ipcMain.handle("asset:addMapVariant", async (event: IpcMainInvokeEvent, campaignPath: string, sceneId: string, currentAssetId: string, replacementId: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(sceneId, "Scene id");
    assertIpcSafeId(currentAssetId, "Asset id");
    assertIpcSafeId(replacementId, "Map variant id");
    const sourcePath = consumeMapReplacementToken(options.mapReplacementTokens, replacementId, {
      campaignPath,
      sceneId,
      currentAssetId
    });
    await assertAssetImportCandidate(sourcePath, "map");

    const summary = await options.loadCampaignFromPath(campaignPath);
    requireCurrentMapAsset(summary.campaign, currentAssetId);
    const currentScene = await options.readSceneMetadata(campaignPath, sceneId);
    assertSceneUsesMapAsset(currentScene, currentAssetId);

    const imported = await createCopiedMapAsset(campaignPath, sourcePath, event.sender, options);
    const { campaign, scene: updatedScene } = addMapVariantToScene(summary.campaign, currentScene, imported, path.parse(sourcePath).name, options.getTimestamp());
    await options.writeScene(campaignPath, updatedScene);
    await options.writeCampaign(campaignPath, campaign);
    return { campaignSummary: await options.loadCampaignFromPath(campaignPath), scene: updatedScene, asset: imported };
  });

  ipcMain.handle("asset:deleteMap", async (_event: IpcMainInvokeEvent, campaignPath: string, sceneId: string, assetId: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(sceneId, "Scene id");
    assertIpcSafeId(assetId, "Asset id");
    const summary = await options.loadCampaignFromPath(campaignPath);
    const asset = requireCampaignAsset(summary.campaign, assetId, "map", "Map asset was not found in this campaign.");

    const otherSceneNames = await getMapAssetSceneNames(summary.campaign, assetId, sceneId, (candidateSceneId) =>
      options.readSceneMetadata(campaignPath, candidateSceneId)
    );

    if (otherSceneNames.length > 0) {
      throw new Error(`This map asset is still used by: ${otherSceneNames.join(", ")}.`);
    }

    const currentScene = await options.readSceneMetadata(campaignPath, sceneId);
    const updatedScene = removeMapAssetFromScene(currentScene, assetId);
    await options.writeScene(campaignPath, updatedScene);

    const campaign = removeMapAssetFromCampaign(summary.campaign, assetId);
    await options.writeCampaign(campaignPath, campaign);
    await options.removeCampaignAssetFiles(campaignPath, asset);
    return { campaignSummary: await options.loadCampaignFromPath(campaignPath), scene: updatedScene };
  });
}

async function importMapAsset(
  campaignPath: string,
  sourcePath: string,
  campaign: Campaign,
  rendererWebContents: WebContents,
  options: RegisterMapAssetIpcOptions
): Promise<Asset> {
  const imported = await createCopiedMapAsset(campaignPath, sourcePath, rendererWebContents, options);
  const campaignWithAsset = addImportedAssetToCampaign(campaign, imported, options.getTimestamp());
  await options.writeCampaign(campaignPath, campaignWithAsset);
  return imported;
}

