import { describe, expect, it } from "vitest";
import { createEmptyCampaignHealthReport } from "../../src/shared/campaignHealth";
import { createDefaultCampaign, type AssetPruneResult, type CampaignSummary, type ThumbnailRegenerationResult, type TokenAssetPromotionResult } from "../../src/shared/localvtt";
import {
  gmMaintenanceReducer,
  INITIAL_GM_MAINTENANCE_STATE
} from "../../src/renderer/hooks/useGmMaintenanceState";
import type { CampaignBusyState, MapReplacementPreview } from "../../src/renderer/hooks/useCampaignActions";

function makeCampaignSummary(): CampaignSummary {
  return {
    campaignPath: "C:\\Campaigns\\SmokeTesting",
    campaign: createDefaultCampaign("SmokeTesting"),
    missingAssets: [],
    health: createEmptyCampaignHealthReport()
  };
}

describe("GM maintenance state", () => {
  it("tracks modal open and close actions independently", () => {
    const opened = gmMaintenanceReducer(INITIAL_GM_MAINTENANCE_STATE, { type: "campaignHealthOpened" });
    expect(opened.campaignHealthOpen).toBe(true);

    const restoreOpened = gmMaintenanceReducer(opened, { type: "metadataRestoreOpened" });
    expect(restoreOpened).toMatchObject({
      campaignHealthOpen: true,
      metadataRestoreOpen: true
    });

    const closed = gmMaintenanceReducer(restoreOpened, { type: "campaignHealthClosed" });
    expect(closed.campaignHealthOpen).toBe(false);
    expect(closed.metadataRestoreOpen).toBe(true);
  });

  it("stores and clears campaign maintenance operation results", () => {
    const summary = makeCampaignSummary();
    const thumbnailResult: ThumbnailRegenerationResult = { campaignSummary: summary, regenerated: 4, skipped: 1, failed: [] };
    const promotionResult: TokenAssetPromotionResult = { campaignSummary: summary, promoted: 2, skipped: 3, failed: [] };
    const pruneResult: AssetPruneResult = { campaignSummary: summary, pruned: 5, skipped: 1, removedFiles: 10, failed: [] };

    const withThumbnail = gmMaintenanceReducer(INITIAL_GM_MAINTENANCE_STATE, {
      type: "thumbnailRegenerationCompleted",
      result: thumbnailResult
    });
    const withPromotion = gmMaintenanceReducer(withThumbnail, {
      type: "tokenAssetPromotionCompleted",
      result: promotionResult
    });
    const withPrune = gmMaintenanceReducer(withPromotion, {
      type: "assetPruneCompleted",
      result: pruneResult
    });

    expect(withPrune.thumbnailRegenerationResult).toBe(thumbnailResult);
    expect(withPrune.tokenAssetPromotionResult).toBe(promotionResult);
    expect(withPrune.assetPruneResult).toBe(pruneResult);

    expect(gmMaintenanceReducer(withPrune, { type: "assetPruneResultClosed" }).assetPruneResult).toBeNull();
    expect(gmMaintenanceReducer(withPrune, { type: "thumbnailRegenerationResultClosed" }).thumbnailRegenerationResult).toBeNull();
    expect(gmMaintenanceReducer(withPrune, { type: "tokenAssetPromotionResultClosed" }).tokenAssetPromotionResult).toBeNull();
  });

  it("tracks busy overlay state and map replacement previews", () => {
    const busyState: CampaignBusyState = {
      title: "Regenerating Thumbnails",
      message: "Working",
      current: 1,
      total: 3,
      unitLabel: "assets"
    };
    const preview: MapReplacementPreview = {
      currentAssetId: "map-old",
      replacementId: "map-new",
      sourceName: "replacement.png",
      currentAssetName: "old.png"
    };

    const busy = gmMaintenanceReducer(INITIAL_GM_MAINTENANCE_STATE, { type: "busyChanged", busyState });
    expect(busy.busyState).toBe(busyState);

    const previewed = gmMaintenanceReducer(busy, { type: "mapReplacementPreviewed", preview });
    expect(previewed.mapReplacementPreview).toBe(preview);

    const cleared = gmMaintenanceReducer(previewed, { type: "mapReplacementHandled" });
    expect(cleared.busyState).toBe(busyState);
    expect(cleared.mapReplacementPreview).toBeNull();

    expect(gmMaintenanceReducer(cleared, { type: "busyChanged", busyState: null }).busyState).toBeNull();
  });
});
