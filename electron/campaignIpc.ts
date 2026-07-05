import type { BrowserWindow, IpcMain, IpcMainInvokeEvent } from "electron";
import { stat } from "node:fs/promises";
import type { Campaign, CampaignSummary, MetadataBackupRef } from "../src/shared/localvtt.js";
import {
  assertValidCampaign
} from "../src/shared/localvtt.js";
import { campaignFile } from "./campaignPaths.js";
import { assertMetadataBackupRef } from "./ipcPayloadValidation.js";

export interface CampaignDialogProvider {
  chooseDirectory: (owner: BrowserWindow | null, title: string, createDirectory?: boolean) => Promise<string | null>;
}

export interface RegisterCampaignIpcOptions {
  assertKnownCampaignPath: (campaignPath: string) => void;
  createCampaignForFolder: (campaignPath: string) => Campaign;
  dialogs: CampaignDialogProvider;
  getGmWindow: () => BrowserWindow | null;
  listMetadataBackups: (campaignPath: string) => Promise<unknown>;
  loadCampaignFromPath: (campaignPath: string) => Promise<CampaignSummary>;
  loadCampaignWithPausedTurnOrders: (campaignPath: string) => Promise<CampaignSummary>;
  openMetadataBackupsFolder: (campaignPath: string) => Promise<unknown>;
  previewMetadataBackup: (campaignPath: string, ref: MetadataBackupRef) => Promise<unknown>;
  registerCampaignPath: (campaignPath: string) => void;
  resolveCurrentCampaignPath: (campaignPath: string) => string;
  restoreMetadataBackup: (campaignPath: string, ref: MetadataBackupRef) => Promise<unknown>;
  setCurrentCampaignPath: (campaignPath: string | null) => void;
  writeCampaign: (campaignPath: string, campaign: Campaign) => Promise<void>;
}

export function registerCampaignIpc(ipcMain: Pick<IpcMain, "handle">, options: RegisterCampaignIpcOptions): void {
  ipcMain.handle("campaign:create", async () => {
    const campaignPath = await options.dialogs.chooseDirectory(options.getGmWindow(), "Choose a folder for the new Local VTT campaign", true);
    if (!campaignPath) {
      return null;
    }

    const campaign = options.createCampaignForFolder(campaignPath);
    options.registerCampaignPath(campaignPath);
    options.setCurrentCampaignPath(options.resolveCurrentCampaignPath(campaignPath));
    await options.writeCampaign(campaignPath, campaign);
    return options.loadCampaignFromPath(campaignPath);
  });

  ipcMain.handle("campaign:open", async () => {
    const campaignPath = await options.dialogs.chooseDirectory(options.getGmWindow(), "Open Local VTT campaign folder");
    if (!campaignPath) {
      return null;
    }

    return options.loadCampaignWithPausedTurnOrders(campaignPath);
  });

  ipcMain.handle("campaign:openRecent", async (_event: IpcMainInvokeEvent, campaignPath: string) => {
    await stat(campaignFile(campaignPath));
    return options.loadCampaignWithPausedTurnOrders(campaignPath);
  });

  ipcMain.handle("campaign:save", async (_event: IpcMainInvokeEvent, campaignPath: string, campaign: Campaign) => {
    options.assertKnownCampaignPath(campaignPath);
    assertValidCampaign(campaign);
    await options.writeCampaign(campaignPath, campaign);
    return options.loadCampaignFromPath(campaignPath);
  });

  ipcMain.handle("campaign:refresh", async (_event: IpcMainInvokeEvent, campaignPath: string) => {
    options.assertKnownCampaignPath(campaignPath);
    return options.loadCampaignFromPath(campaignPath);
  });

  ipcMain.handle("campaign:openBackupsFolder", async (_event: IpcMainInvokeEvent, campaignPath: string) => {
    options.assertKnownCampaignPath(campaignPath);
    return options.openMetadataBackupsFolder(campaignPath);
  });

  ipcMain.handle("campaign:listMetadataBackups", async (_event: IpcMainInvokeEvent, campaignPath: string) => {
    options.assertKnownCampaignPath(campaignPath);
    return options.listMetadataBackups(campaignPath);
  });

  ipcMain.handle("campaign:previewMetadataBackup", async (_event: IpcMainInvokeEvent, campaignPath: string, ref: MetadataBackupRef) => {
    options.assertKnownCampaignPath(campaignPath);
    assertMetadataBackupRef(ref);
    return options.previewMetadataBackup(campaignPath, ref);
  });

  ipcMain.handle("campaign:restoreMetadataBackup", async (_event: IpcMainInvokeEvent, campaignPath: string, ref: MetadataBackupRef) => {
    options.assertKnownCampaignPath(campaignPath);
    assertMetadataBackupRef(ref);
    return options.restoreMetadataBackup(campaignPath, ref);
  });
}
