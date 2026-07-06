import type { BrowserWindow, IpcMain, IpcMainInvokeEvent } from "electron";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Asset, Campaign, CampaignSummary, Scene, SquareCropRect } from "../src/shared/localvtt.js";
import { assertAssetImportCandidate } from "./assetImportFiles.js";
import { buildTokenAssetRelativePath, requireCampaignRelativePath } from "./assetFiles.js";
import { requireCampaignAsset, findCampaignAsset, requireTokenAssetWithAbsolutePath } from "./campaignAssetLookup.js";
import { addImportedAssetToCampaign, createImportedAsset, createStagedTokenImportAsset } from "./importedAssets.js";
import { assertIpcSafeId, assertSquareCropRect } from "./ipcPayloadValidation.js";
import { removeThumbnailIfUnused, writeAssetThumbnail } from "./thumbnailFiles.js";
import { getTokenAssetUsage } from "./tokenAssetUsage.js";
import { removeAssetFromCampaign } from "./tokenAssetMutations.js";
import { removeTokenAssetFromCampaignScenes } from "./tokenAssetSceneCleanup.js";
import { createStagedTokenImportStore, type StagedTokenImport } from "./stagedTokenImports.js";
import { tokenThumbnailVariant, updateTokenThumbnailInCampaign } from "./tokenThumbnailUpdate.js";

export interface TokenAssetDialogProvider {
  chooseTokenFile: (owner: BrowserWindow | null) => Promise<string | null>;
}

export interface RegisterTokenAssetIpcOptions {
  assertInsideCampaign: (campaignPath: string, candidatePath: string) => void;
  assertKnownCampaignPath: (campaignPath: string) => void;
  createAssetId: () => string;
  createSquareImageThumbnail: (sourcePath: string, crop?: SquareCropRect) => Promise<Buffer | undefined>;
  dialogs: TokenAssetDialogProvider;
  getGmWindow: () => BrowserWindow | null;
  getTimestamp: () => string;
  loadCampaignFromPath: (campaignPath: string) => Promise<CampaignSummary>;
  readSceneMetadata: (campaignPath: string, sceneId: string) => Promise<Scene>;
  registerTemporaryExternalAssetPath: (sourcePath: string) => void;
  removeCampaignAssetFiles: (campaignPath: string, asset: Asset) => Promise<void>;
  unregisterTemporaryExternalAssetPath: (sourcePath: string) => void;
  writeCampaign: (campaignPath: string, campaign: Campaign) => Promise<void>;
  writeScene: (campaignPath: string, scene: Scene) => Promise<void>;
}

export function registerTokenAssetIpc(ipcMain: Pick<IpcMain, "handle">, options: RegisterTokenAssetIpcOptions): void {
  const stagedTokenImports = createStagedTokenImportStore(options);

  ipcMain.handle("asset:importToken", async (_event: IpcMainInvokeEvent, campaignPath: string) => {
    options.assertKnownCampaignPath(campaignPath);
    const sourcePath = await options.dialogs.chooseTokenFile(options.getGmWindow());
    if (!sourcePath) {
      return null;
    }

    await assertAssetImportCandidate(sourcePath, "token");

    const assetId = options.createAssetId();
    const updatedAt = options.getTimestamp();
    const finalRelativePath = buildTokenAssetRelativePath(assetId);
    stagedTokenImports.register({
      assetId,
      sourcePath,
      campaignPath,
      finalRelativePath,
      createdAt: updatedAt
    });
    const stagedAsset = createStagedTokenImportAsset({
      assetId,
      sourcePath,
      finalRelativePath,
      campaignPath,
      createdAt: updatedAt
    });

    return { campaignSummary: await options.loadCampaignFromPath(campaignPath), asset: stagedAsset };
  });

  ipcMain.handle("asset:updateTokenThumbnail", async (_event: IpcMainInvokeEvent, campaignPath: string, assetId: string, crop: SquareCropRect) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(assetId, "Asset id");
    assertSquareCropRect(crop);
    const summary = await options.loadCampaignFromPath(campaignPath);
    const stagedImport = stagedTokenImports.get(assetId);

    if (stagedImport) {
      return commitStagedTokenImport(campaignPath, assetId, crop, stagedImport, stagedTokenImports.consume, summary, options);
    }

    const asset = requireTokenAssetWithAbsolutePath(summary.campaign, assetId);

    options.assertInsideCampaign(campaignPath, asset.absolutePath);
    const thumbnail = await options.createSquareImageThumbnail(asset.absolutePath, crop);
    if (!thumbnail) {
      throw new Error("Unable to generate token thumbnail.");
    }
    const thumbnailRelativePath = await writeAssetThumbnail(campaignPath, assetId, thumbnail, tokenThumbnailVariant(Date.now()));
    const campaign = updateTokenThumbnailInCampaign(summary.campaign, assetId, thumbnailRelativePath, options.getTimestamp());
    await options.writeCampaign(campaignPath, campaign);
    await removeThumbnailIfUnused(campaignPath, asset.thumbnailRelativePath, campaign.assets);
    const campaignSummary = await options.loadCampaignFromPath(campaignPath);
    const updatedAsset = campaignSummary.campaign.assets.find((candidate) => candidate.id === assetId);
    if (!updatedAsset) {
      throw new Error("Token asset was not available after updating thumbnail.");
    }
    return { campaignSummary, asset: updatedAsset };
  });

  ipcMain.handle("asset:discardTokenImport", async (_event: IpcMainInvokeEvent, campaignPath: string, assetId: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(assetId, "Asset id");
    if (stagedTokenImports.discardForCampaign(assetId, campaignPath)) {
      return options.loadCampaignFromPath(campaignPath);
    }
    const summary = await options.loadCampaignFromPath(campaignPath);
    const asset = findCampaignAsset(summary.campaign, assetId, "token");
    if (!asset) {
      return summary;
    }

    const campaign = removeAssetFromCampaign(summary.campaign, assetId);
    await options.writeCampaign(campaignPath, campaign);
    await options.removeCampaignAssetFiles(campaignPath, asset);
    return options.loadCampaignFromPath(campaignPath);
  });

  ipcMain.handle("asset:getTokenUsage", async (_event: IpcMainInvokeEvent, campaignPath: string, assetId: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(assetId, "Asset id");
    const summary = await options.loadCampaignFromPath(campaignPath);
    return getTokenAssetUsage(summary.campaign, assetId, (sceneId) => options.readSceneMetadata(campaignPath, sceneId));
  });

  ipcMain.handle("asset:deleteToken", async (_event: IpcMainInvokeEvent, campaignPath: string, assetId: string) => {
    options.assertKnownCampaignPath(campaignPath);
    assertIpcSafeId(assetId, "Asset id");
    const summary = await options.loadCampaignFromPath(campaignPath);
    const asset = requireCampaignAsset(summary.campaign, assetId, "token", "Token asset was not found in this campaign.");

    const changedScenes = await removeTokenAssetFromCampaignScenes(
      summary.campaign,
      assetId,
      (sceneId) => options.readSceneMetadata(campaignPath, sceneId),
      (scene) => options.writeScene(campaignPath, scene)
    );

    const campaign = removeAssetFromCampaign(summary.campaign, assetId);
    await options.writeCampaign(campaignPath, campaign);
    await options.removeCampaignAssetFiles(campaignPath, asset);
    return { campaignSummary: await options.loadCampaignFromPath(campaignPath), scenes: changedScenes };
  });
}

async function commitStagedTokenImport(
  campaignPath: string,
  assetId: string,
  crop: SquareCropRect,
  stagedImport: StagedTokenImport,
  consumeStagedTokenImport: (assetId: string) => StagedTokenImport | null,
  summary: CampaignSummary,
  options: RegisterTokenAssetIpcOptions
): Promise<{ campaignSummary: CampaignSummary; asset: Asset }> {
  if (path.resolve(stagedImport.campaignPath) !== path.resolve(campaignPath)) {
    throw new Error("Token import belongs to a different campaign.");
  }
  const thumbnail = await options.createSquareImageThumbnail(stagedImport.sourcePath, crop);
  if (!thumbnail) {
    throw new Error("Unable to generate token thumbnail.");
  }
  const destination = requireCampaignRelativePath(campaignPath, stagedImport.finalRelativePath);
  await writeFile(destination, thumbnail);
  const updatedAt = options.getTimestamp();
  const imported = createImportedAsset({
    assetId,
    kind: "token",
    mediaType: "image",
    sourcePath: stagedImport.sourcePath,
    relativePath: stagedImport.finalRelativePath,
    destination,
    campaignPath,
    thumbnailRelativePath: stagedImport.finalRelativePath,
    createdAt: updatedAt
  });
  const campaign = addImportedAssetToCampaign(summary.campaign, imported, updatedAt);
  await options.writeCampaign(campaignPath, campaign);
  consumeStagedTokenImport(assetId);
  const campaignSummary = await options.loadCampaignFromPath(campaignPath);
  const updatedAsset = campaignSummary.campaign.assets.find((candidate) => candidate.id === assetId);
  if (!updatedAsset) {
    throw new Error("Token asset was not available after importing token.");
  }
  return { campaignSummary, asset: updatedAsset };
}
