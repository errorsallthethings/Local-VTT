import type { WebContents } from "electron";
import { describe, expect, it, vi } from "vitest";
import { createAssetMaintenanceServices } from "../../electron/assetMaintenanceServices";
import { createDefaultCampaign, type Asset, type Campaign, type CampaignSummary } from "../../src/shared/localvtt";

function campaignSummary(campaignPath: string, campaign: Campaign): CampaignSummary {
  return {
    campaign,
    campaignPath,
    health: {
      duplicateSceneIds: [],
      invalidSceneFiles: [],
      missingAssetFiles: [],
      missingSceneFiles: [],
      orphanedSceneFiles: [],
      unreferencedAssets: []
    },
    missingAssets: []
  };
}

function asset(patch: Partial<Asset> & Pick<Asset, "id" | "kind" | "relativePath">): Asset {
  return {
    id: patch.id,
    name: patch.id,
    kind: patch.kind,
    mediaType: "image",
    relativePath: patch.relativePath,
    originalFileName: `${patch.id}.png`,
    createdAt: "2026-07-05T00:00:00.000Z",
    ...patch
  };
}

describe("asset maintenance services", () => {
  it("regenerates thumbnails and removes replaced thumbnail files after writing the campaign", async () => {
    const campaign = createDefaultCampaign("Maintenance");
    campaign.assets = [asset({ id: "map-1", kind: "map", relativePath: "assets/maps/map.png" })];
    const updatedCampaign = {
      ...campaign,
      assets: [{ ...campaign.assets[0], thumbnailRelativePath: "assets/thumbnails/map-1.jpg" }]
    };
    const loadCampaignFromPath = vi.fn().mockResolvedValue(campaignSummary("campaign-root", campaign));
    const writeCampaign = vi.fn();
    const removeThumbnailIfUnused = vi.fn();
    const rendererWebContents = { id: 1 } as WebContents;
    const regenerateThumbnailAssets = vi.fn().mockResolvedValue({
      campaign: updatedCampaign,
      failed: [],
      previousThumbnailPaths: new Map([["map-1", "assets/thumbnails/old-map.jpg"]]),
      regenerated: 1,
      skipped: 0
    });

    const services = createAssetMaintenanceServices({
      createMapThumbnail: vi.fn(),
      createTokenThumbnail: vi.fn(),
      loadCampaignFromPath,
      regenerateThumbnailAssets,
      removeThumbnailIfUnused,
      writeCampaign
    });
    const onProgress = vi.fn();

    await expect(services.regenerateCampaignThumbnails("campaign-root", onProgress, rendererWebContents)).resolves.toMatchObject({
      regenerated: 1,
      skipped: 0
    });

    expect(regenerateThumbnailAssets).toHaveBeenCalledWith("campaign-root", campaign, expect.any(Function), onProgress);
    expect(writeCampaign).toHaveBeenCalledWith("campaign-root", updatedCampaign);
    expect(removeThumbnailIfUnused).toHaveBeenCalledWith("campaign-root", "assets/thumbnails/old-map.jpg", updatedCampaign.assets);
  });

  it("promotes token thumbnails and deletes replaced files no longer referenced by assets", async () => {
    const campaign = createDefaultCampaign("Promote");
    const promotedCampaign = {
      ...campaign,
      assets: [asset({ id: "token-1", kind: "token", relativePath: "assets/tokens/token-1.jpg", thumbnailRelativePath: "assets/tokens/token-1.jpg" })]
    };
    const writeCampaign = vi.fn();
    const unlinkIfExists = vi.fn();
    const services = createAssetMaintenanceServices({
      createMapThumbnail: vi.fn(),
      createTokenThumbnail: vi.fn(),
      loadCampaignFromPath: vi.fn().mockResolvedValue(campaignSummary("campaign-root", campaign)),
      promoteTokenAssetThumbnails: vi.fn().mockResolvedValue({
        campaign: promotedCampaign,
        failed: [],
        promoted: 1,
        replacedPaths: new Map([["token-1", ["assets/tokens/old.png", "assets/thumbnails/old.jpg"]]]),
        skipped: 0
      }),
      requireCampaignRelativePath: vi.fn((campaignPath, relativePath) => `${campaignPath}/${relativePath}`),
      unlinkIfExists,
      writeCampaign
    });

    await expect(services.promoteCampaignTokenAssets("campaign-root")).resolves.toMatchObject({ promoted: 1, skipped: 0 });

    expect(writeCampaign).toHaveBeenCalledWith("campaign-root", promotedCampaign);
    expect(unlinkIfExists).toHaveBeenCalledWith("campaign-root/assets/tokens/old.png");
    expect(unlinkIfExists).toHaveBeenCalledWith("campaign-root/assets/thumbnails/old.jpg");
  });

  it("prunes unreferenced assets based on campaign health diagnostics", async () => {
    const campaign = createDefaultCampaign("Prune");
    const prunedCampaign = { ...campaign, assets: [] };
    const writeCampaign = vi.fn();
    const pruneUnreferencedAssets = vi.fn().mockResolvedValue({
      campaign: prunedCampaign,
      failed: [],
      pruned: 1,
      removedFiles: 2,
      skipped: 0
    });
    const services = createAssetMaintenanceServices({
      createMapThumbnail: vi.fn(),
      createTokenThumbnail: vi.fn(),
      inspectCampaignHealth: vi.fn().mockResolvedValue({
        missingAssetFiles: [],
        staleThumbnailReferences: [],
        sceneFileIssues: [],
        unknownAssetReferences: [],
        unreferencedAssets: [{ assetId: "asset-1" }]
      }),
      loadCampaignFromPath: vi.fn().mockResolvedValue(campaignSummary("campaign-root", campaign)),
      createAssetCleanupPlan: vi.fn().mockResolvedValue({
        unreferencedAssets: [],
        staleThumbnailReferences: [],
        orphanedFiles: [{ relativePath: "assets/maps/orphan.png", kind: "map", sizeBytes: 12 }],
        retainedAssetCount: 0,
        totalFilesToRemove: 1,
        totalBytesToRemove: 12
      }),
      pruneUnreferencedAssets,
      removeOrphanedAssetFiles: vi.fn().mockResolvedValue({ removed: 1, failed: [] }),
      writeCampaign
    });

    await expect(services.pruneCampaignUnreferencedAssets("campaign-root")).resolves.toMatchObject({ pruned: 1, removedFiles: 3, removedOrphanedFiles: 1 });

    expect(pruneUnreferencedAssets).toHaveBeenCalledWith("campaign-root", campaign, new Set(["asset-1"]));
    expect(writeCampaign).toHaveBeenCalledWith("campaign-root", prunedCampaign);
  });

  it("previews campaign asset cleanup without writing metadata or deleting files", async () => {
    const campaign = createDefaultCampaign("Preview");
    const health = {
      missingAssetFiles: [],
      staleThumbnailReferences: [],
      sceneFileIssues: [],
      unknownAssetReferences: [],
      unreferencedAssets: [{ assetId: "asset-1" }]
    };
    const previewPlan = {
      unreferencedAssets: [],
      staleThumbnailReferences: [],
      orphanedFiles: [],
      retainedAssetCount: 3,
      totalFilesToRemove: 0,
      totalBytesToRemove: 0
    };
    const writeCampaign = vi.fn();
    const createAssetCleanupPlan = vi.fn().mockResolvedValue(previewPlan);
    const services = createAssetMaintenanceServices({
      createMapThumbnail: vi.fn(),
      createTokenThumbnail: vi.fn(),
      inspectCampaignHealth: vi.fn().mockResolvedValue(health),
      createAssetCleanupPlan,
      loadCampaignFromPath: vi.fn().mockResolvedValue(campaignSummary("campaign-root", campaign)),
      writeCampaign
    });

    await expect(services.previewCampaignAssetCleanup("campaign-root")).resolves.toMatchObject({
      retainedAssetCount: 3,
      campaignSummary: { health }
    });

    expect(createAssetCleanupPlan).toHaveBeenCalledWith("campaign-root", campaign, health);
    expect(writeCampaign).not.toHaveBeenCalled();
  });
});
