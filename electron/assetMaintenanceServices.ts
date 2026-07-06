import type { WebContents } from "electron";
import type {
  AssetPruneResult,
  Campaign,
  CampaignSummary,
  ThumbnailRegenerationProgress,
  ThumbnailRegenerationResult,
  TokenAssetPromotionResult
} from "../src/shared/localvtt.js";
import { requireCampaignRelativePath } from "./assetFiles.js";
import { inspectCampaignHealth } from "./campaignHealth.js";
import { unlinkIfExists } from "./fileOperations.js";
import type { MapThumbnailResult } from "./mapThumbnailRepair.js";
import { removeThumbnailIfUnused } from "./thumbnailFiles.js";
import { regenerateThumbnailAssets } from "./thumbnailRegeneration.js";
import { promoteTokenAssetThumbnails } from "./tokenAssetPromotion.js";
import { pruneUnreferencedAssets } from "./unreferencedAssetPruning.js";

export interface AssetMaintenanceServices {
  promoteCampaignTokenAssets: (campaignPath: string) => Promise<TokenAssetPromotionResult>;
  pruneCampaignUnreferencedAssets: (campaignPath: string) => Promise<AssetPruneResult>;
  regenerateCampaignThumbnails: (
    campaignPath: string,
    onProgress?: (progress: ThumbnailRegenerationProgress) => void,
    rendererWebContents?: WebContents
  ) => Promise<ThumbnailRegenerationResult>;
}

export interface CreateAssetMaintenanceServicesOptions {
  createMapThumbnail: (campaignPath: string, sourcePath: string, assetId: string, rendererWebContents?: WebContents) => Promise<MapThumbnailResult>;
  createTokenThumbnail: (campaignPath: string, sourcePath: string, assetId: string) => Promise<MapThumbnailResult>;
  inspectCampaignHealth?: typeof inspectCampaignHealth;
  loadCampaignFromPath: (campaignPath: string) => Promise<CampaignSummary>;
  promoteTokenAssetThumbnails?: typeof promoteTokenAssetThumbnails;
  pruneUnreferencedAssets?: typeof pruneUnreferencedAssets;
  regenerateThumbnailAssets?: typeof regenerateThumbnailAssets;
  removeThumbnailIfUnused?: typeof removeThumbnailIfUnused;
  requireCampaignRelativePath?: typeof requireCampaignRelativePath;
  unlinkIfExists?: typeof unlinkIfExists;
  writeCampaign: (campaignPath: string, campaign: Campaign) => Promise<void>;
}

export function createAssetMaintenanceServices({
  createMapThumbnail,
  createTokenThumbnail,
  inspectCampaignHealth: inspectHealth = inspectCampaignHealth,
  loadCampaignFromPath,
  promoteTokenAssetThumbnails: promoteTokens = promoteTokenAssetThumbnails,
  pruneUnreferencedAssets: pruneAssets = pruneUnreferencedAssets,
  regenerateThumbnailAssets: regenerateThumbnails = regenerateThumbnailAssets,
  removeThumbnailIfUnused: removeUnusedThumbnail = removeThumbnailIfUnused,
  requireCampaignRelativePath: requireRelativePath = requireCampaignRelativePath,
  unlinkIfExists: unlinkPathIfExists = unlinkIfExists,
  writeCampaign
}: CreateAssetMaintenanceServicesOptions): AssetMaintenanceServices {
  return {
    async regenerateCampaignThumbnails(campaignPath, onProgress, rendererWebContents) {
      const summary = await loadCampaignFromPath(campaignPath);
      const plan = await regenerateThumbnails(
        campaignPath,
        summary.campaign,
        (asset, sourcePath) =>
          asset.kind === "map"
            ? createMapThumbnail(campaignPath, sourcePath, asset.id, rendererWebContents)
            : createTokenThumbnail(campaignPath, sourcePath, asset.id),
        onProgress
      );
      const campaign = plan.campaign;
      if (plan.regenerated > 0) {
        await writeCampaign(campaignPath, campaign);
        for (const asset of campaign.assets) {
          await removeUnusedThumbnail(campaignPath, plan.previousThumbnailPaths.get(asset.id), campaign.assets);
        }
      }

      return {
        campaignSummary: await loadCampaignFromPath(campaignPath),
        regenerated: plan.regenerated,
        skipped: plan.skipped,
        failed: plan.failed
      };
    },

    async promoteCampaignTokenAssets(campaignPath) {
      const summary = await loadCampaignFromPath(campaignPath);
      const plan = await promoteTokens(campaignPath, summary.campaign);
      if (plan.promoted > 0) {
        await writeCampaign(campaignPath, plan.campaign);
        for (const replacedPaths of plan.replacedPaths.values()) {
          for (const replacedPath of replacedPaths) {
            if (plan.campaign.assets.some((asset) => asset.relativePath === replacedPath || asset.thumbnailRelativePath === replacedPath)) {
              continue;
            }
            await unlinkPathIfExists(requireRelativePath(campaignPath, replacedPath));
          }
        }
      }

      return {
        campaignSummary: await loadCampaignFromPath(campaignPath),
        promoted: plan.promoted,
        skipped: plan.skipped,
        failed: plan.failed
      };
    },

    async pruneCampaignUnreferencedAssets(campaignPath) {
      const summary = await loadCampaignFromPath(campaignPath);
      const health = await inspectHealth(campaignPath, summary.campaign);
      const unreferencedAssetIds = new Set(health.unreferencedAssets.map((asset) => asset.assetId));
      const plan = await pruneAssets(campaignPath, summary.campaign, unreferencedAssetIds);
      if (plan.pruned > 0) {
        await writeCampaign(campaignPath, plan.campaign);
      }

      return {
        campaignSummary: await loadCampaignFromPath(campaignPath),
        pruned: plan.pruned,
        skipped: plan.skipped,
        removedFiles: plan.removedFiles,
        failed: plan.failed
      };
    }
  };
}
