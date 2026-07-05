import { describe, expect, it, vi } from "vitest";
import {
  getCampaignMaintenanceInitialBusyState,
  getThumbnailRegenerationBusyState,
  openSavedCampaignHealth,
  runSavedCampaignMaintenance,
  type CampaignBusyState
} from "../../src/renderer/lib/campaign";

describe("campaign maintenance helpers", () => {
  it("builds initial busy states for maintenance operations", () => {
    expect(getCampaignMaintenanceInitialBusyState("thumbnail-regeneration")).toEqual({
      title: "Regenerating Thumbnails",
      message: "Preparing thumbnail regeneration.",
      current: 0,
      total: 0,
      unitLabel: "assets"
    });
    expect(getCampaignMaintenanceInitialBusyState("token-asset-promotion")).toMatchObject({
      title: "Optimizing Tokens",
      message: "Promoting framed token images."
    });
    expect(getCampaignMaintenanceInitialBusyState("unreferenced-asset-pruning")).toMatchObject({
      title: "Pruning Assets",
      message: "Removing unreferenced campaign assets."
    });
  });

  it("maps thumbnail progress into busy state", () => {
    expect(getThumbnailRegenerationBusyState({ current: 3, total: 8, assetName: "map.png", message: "Processing map.png" })).toEqual({
      title: "Regenerating Thumbnails",
      message: "Processing map.png",
      current: 3,
      total: 8,
      unitLabel: "assets"
    });
  });

  it("runs maintenance after saving unsaved changes and clears busy state", async () => {
    const busyStates: Array<CampaignBusyState | null> = [];
    const removeProgressListener = vi.fn();
    const result = { ok: true };
    const onComplete = vi.fn();
    const runOperation = vi.fn().mockResolvedValue(result);

    await expect(
      runSavedCampaignMaintenance({
        campaignPath: "campaign-path",
        campaignAvailable: true,
        hasUnsavedChanges: true,
        initialBusyState: getCampaignMaintenanceInitialBusyState("token-asset-promotion"),
        onBusyChange: (busyState) => busyStates.push(busyState),
        onComplete,
        runOperation,
        saveCampaign: vi.fn().mockResolvedValue(true),
        subscribeProgress: () => removeProgressListener
      })
    ).resolves.toBe(true);

    expect(runOperation).toHaveBeenCalledWith("campaign-path");
    expect(onComplete).toHaveBeenCalledWith(result);
    expect(removeProgressListener).toHaveBeenCalledOnce();
    expect(busyStates).toEqual([getCampaignMaintenanceInitialBusyState("token-asset-promotion"), null]);
  });

  it("skips maintenance when unavailable or save fails", async () => {
    const runOperation = vi.fn();
    const onBusyChange = vi.fn();

    await expect(
      runSavedCampaignMaintenance({
        campaignPath: null,
        campaignAvailable: true,
        hasUnsavedChanges: false,
        initialBusyState: getCampaignMaintenanceInitialBusyState("thumbnail-regeneration"),
        onBusyChange,
        onComplete: vi.fn(),
        runOperation,
        saveCampaign: vi.fn()
      })
    ).resolves.toBe(false);
    await expect(
      runSavedCampaignMaintenance({
        campaignPath: "campaign-path",
        campaignAvailable: true,
        hasUnsavedChanges: true,
        initialBusyState: getCampaignMaintenanceInitialBusyState("thumbnail-regeneration"),
        onBusyChange,
        onComplete: vi.fn(),
        runOperation,
        saveCampaign: vi.fn().mockResolvedValue(false)
      })
    ).resolves.toBe(false);

    expect(runOperation).not.toHaveBeenCalled();
    expect(onBusyChange).not.toHaveBeenCalled();
  });

  it("clears busy state when maintenance fails", async () => {
    const busyStates: Array<CampaignBusyState | null> = [];

    await expect(
      runSavedCampaignMaintenance({
        campaignPath: "campaign-path",
        campaignAvailable: true,
        hasUnsavedChanges: false,
        initialBusyState: getCampaignMaintenanceInitialBusyState("unreferenced-asset-pruning"),
        onBusyChange: (busyState) => busyStates.push(busyState),
        onComplete: vi.fn(),
        runOperation: vi.fn().mockRejectedValue(new Error("boom")),
        saveCampaign: vi.fn()
      })
    ).rejects.toThrow("boom");

    expect(busyStates).toEqual([getCampaignMaintenanceInitialBusyState("unreferenced-asset-pruning"), null]);
  });

  it("opens campaign health after saving unsaved changes and refreshing the campaign", async () => {
    const summary = { campaign: { id: "campaign-1" }, missingAssets: [], campaignPath: "campaign-path", health: {} };
    const saveCampaign = vi.fn().mockResolvedValue(true);
    const refreshCampaign = vi.fn().mockResolvedValue(summary);
    const applySummary = vi.fn();
    const onOpen = vi.fn();

    await expect(
      openSavedCampaignHealth({
        campaignPath: "campaign-path",
        campaignAvailable: true,
        hasUnsavedChanges: true,
        saveCampaign,
        refreshCampaign,
        applySummary,
        onOpen
      })
    ).resolves.toBe(true);

    expect(saveCampaign).toHaveBeenCalledOnce();
    expect(refreshCampaign).toHaveBeenCalledWith("campaign-path");
    expect(applySummary).toHaveBeenCalledWith(summary);
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("skips campaign health when unavailable or save fails", async () => {
    const refreshCampaign = vi.fn();
    const applySummary = vi.fn();
    const onOpen = vi.fn();

    await expect(
      openSavedCampaignHealth({
        campaignPath: null,
        campaignAvailable: true,
        hasUnsavedChanges: false,
        saveCampaign: vi.fn(),
        refreshCampaign,
        applySummary,
        onOpen
      })
    ).resolves.toBe(false);
    await expect(
      openSavedCampaignHealth({
        campaignPath: "campaign-path",
        campaignAvailable: true,
        hasUnsavedChanges: true,
        saveCampaign: vi.fn().mockResolvedValue(false),
        refreshCampaign,
        applySummary,
        onOpen
      })
    ).resolves.toBe(false);

    expect(refreshCampaign).not.toHaveBeenCalled();
    expect(applySummary).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
