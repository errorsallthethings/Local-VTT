import type { IpcMain, IpcMainInvokeEvent, WebContents } from "electron";
import type {
  AssetPruneResult,
  ThumbnailRegenerationProgress,
  ThumbnailRegenerationResult,
  TokenAssetPromotionResult
} from "../src/shared/localvtt.js";

export interface RegisterAssetMaintenanceIpcOptions {
  assertKnownCampaignPath: (campaignPath: string) => void;
  promoteCampaignTokenAssets: (campaignPath: string) => Promise<TokenAssetPromotionResult>;
  pruneCampaignUnreferencedAssets: (campaignPath: string) => Promise<AssetPruneResult>;
  regenerateCampaignThumbnails: (
    campaignPath: string,
    onProgress?: (progress: ThumbnailRegenerationProgress) => void,
    rendererWebContents?: WebContents
  ) => Promise<ThumbnailRegenerationResult>;
}

export function registerAssetMaintenanceIpc(ipcMain: Pick<IpcMain, "handle">, options: RegisterAssetMaintenanceIpcOptions): void {
  ipcMain.handle("asset:regenerateThumbnails", async (event: IpcMainInvokeEvent, campaignPath: string) => {
    options.assertKnownCampaignPath(campaignPath);
    return options.regenerateCampaignThumbnails(campaignPath, (progress) => {
      event.sender.send("asset:thumbnailRegenerationProgress", progress);
    }, event.sender);
  });

  ipcMain.handle("asset:promoteTokenAssets", async (_event: IpcMainInvokeEvent, campaignPath: string) => {
    options.assertKnownCampaignPath(campaignPath);
    return options.promoteCampaignTokenAssets(campaignPath);
  });

  ipcMain.handle("asset:pruneUnreferencedAssets", async (_event: IpcMainInvokeEvent, campaignPath: string) => {
    options.assertKnownCampaignPath(campaignPath);
    return options.pruneCampaignUnreferencedAssets(campaignPath);
  });
}
