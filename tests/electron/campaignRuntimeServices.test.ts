import { describe, expect, it, vi } from "vitest";
import { CampaignSessionRegistry } from "../../electron/campaignSessionRegistry";
import { createCampaignRuntimeServices } from "../../electron/campaignRuntimeServices";
import { createDefaultCampaign, createDefaultScene, type Campaign, type CampaignHealthReport } from "../../src/shared/localvtt";

function health(patch: Partial<CampaignHealthReport> = {}): CampaignHealthReport {
  return {
    duplicateSceneIds: [],
    invalidSceneFiles: [],
    missingAssetFiles: [],
    missingSceneFiles: [],
    orphanedSceneFiles: [],
    unreferencedAssets: [],
    ...patch
  };
}

function createRuntimeHarness(campaign: Campaign = createDefaultCampaign("Runtime Campaign")) {
  const campaignSessions = new CampaignSessionRegistry();
  let currentCampaignPath: string | null = null;
  const writeCampaign = vi.fn();
  const writeScene = vi.fn();
  const services = createCampaignRuntimeServices({
    campaignSessions,
    createMapThumbnail: vi.fn().mockResolvedValue({ thumbnailRelativePath: "assets/thumbnails/map.jpg" }),
    ensureCampaignFolders: vi.fn().mockResolvedValue(undefined),
    ensureMapThumbnails: vi.fn(async (_campaignPath, candidateCampaign) => candidateCampaign),
    hydrateCampaignAssetPaths: vi.fn((campaignPath, candidateCampaign) => ({
      ...candidateCampaign,
      assets: candidateCampaign.assets.map((asset) => ({
        ...asset,
        absolutePath: `${campaignPath}/${asset.relativePath}`
      }))
    })),
    hydrateSceneSummaries: vi.fn().mockResolvedValue(campaign),
    inspectCampaignHealth: vi.fn().mockResolvedValue(health()),
    pauseCampaignTurnOrders: vi.fn().mockResolvedValue(undefined),
    readCampaignMetadata: vi.fn().mockResolvedValue(campaign),
    readSceneMetadata: vi.fn().mockResolvedValue(createDefaultScene("Scene")),
    setCurrentCampaignPath: vi.fn((campaignPath) => {
      currentCampaignPath = campaignPath;
    }),
    writeCampaign,
    writeScene
  });

  return { campaignSessions, getCurrentCampaignPath: () => currentCampaignPath, services, writeCampaign, writeScene };
}

describe("campaign runtime services", () => {
  it("loads campaigns with scene summaries, thumbnails, health, and registered asset paths", async () => {
    const campaign = createDefaultCampaign("Runtime Campaign");
    campaign.assets = [
      {
        id: "map-1",
        name: "Map",
        kind: "map",
        mediaType: "image",
        relativePath: "assets/maps/map.png",
        originalFileName: "map.png",
        createdAt: "2026-07-05T00:00:00.000Z"
      }
    ];
    const harness = createRuntimeHarness(campaign);

    const summary = await harness.services.loadCampaignFromPath("campaign-root");

    expect(summary.campaign.assets[0].absolutePath).toBe("campaign-root/assets/maps/map.png");
    expect(harness.services.isKnownAssetPath("campaign-root/assets/maps/map.png")).toBe(true);
    expect(summary.health).toEqual(health());
  });

  it("writes campaign metadata when map thumbnail repair changes the campaign", async () => {
    const campaign = createDefaultCampaign("Runtime Campaign");
    const repairedCampaign = { ...campaign, updatedAt: "2026-07-05T12:00:00.000Z" };
    const ensureMapThumbnails = vi.fn().mockResolvedValue(repairedCampaign);
    const writeCampaign = vi.fn();
    const services = createCampaignRuntimeServices({
      campaignSessions: new CampaignSessionRegistry(),
      createMapThumbnail: vi.fn(),
      ensureCampaignFolders: vi.fn().mockResolvedValue(undefined),
      ensureMapThumbnails,
      hydrateCampaignAssetPaths: vi.fn((_campaignPath, candidateCampaign) => candidateCampaign),
      hydrateSceneSummaries: vi.fn().mockResolvedValue(campaign),
      inspectCampaignHealth: vi.fn().mockResolvedValue(health()),
      pauseCampaignTurnOrders: vi.fn(),
      readCampaignMetadata: vi.fn().mockResolvedValue(campaign),
      readSceneMetadata: vi.fn(),
      setCurrentCampaignPath: vi.fn(),
      writeCampaign,
      writeScene: vi.fn()
    });

    await services.loadCampaignFromPath("campaign-root");

    expect(ensureMapThumbnails).toHaveBeenCalledWith("campaign-root", campaign, expect.any(Function));
    expect(writeCampaign).toHaveBeenCalledWith("campaign-root", repairedCampaign);
  });

  it("opens campaigns by registering the path, setting current campaign path, and pausing turn orders", async () => {
    const campaign = createDefaultCampaign("Runtime Campaign");
    const pauseCampaignTurnOrders = vi.fn().mockResolvedValue(undefined);
    let currentCampaignPath: string | null = null;
    const services = createCampaignRuntimeServices({
      campaignSessions: new CampaignSessionRegistry(),
      createMapThumbnail: vi.fn(),
      ensureCampaignFolders: vi.fn().mockResolvedValue(undefined),
      ensureMapThumbnails: vi.fn(async (_campaignPath, candidateCampaign) => candidateCampaign),
      hydrateCampaignAssetPaths: vi.fn((_campaignPath, candidateCampaign) => candidateCampaign),
      hydrateSceneSummaries: vi.fn().mockResolvedValue(campaign),
      inspectCampaignHealth: vi.fn().mockResolvedValue(health()),
      pauseCampaignTurnOrders,
      readCampaignMetadata: vi.fn().mockResolvedValue(campaign),
      readSceneMetadata: vi.fn().mockResolvedValue(createDefaultScene("Scene")),
      setCurrentCampaignPath: (campaignPath) => {
        currentCampaignPath = campaignPath;
      },
      writeCampaign: vi.fn(),
      writeScene: vi.fn()
    });

    await services.loadCampaignWithPausedTurnOrders("campaign-root");

    expect(currentCampaignPath).toContain("campaign-root");
    expect(pauseCampaignTurnOrders).toHaveBeenCalledOnce();
    expect(() => services.assertKnownCampaignPath("campaign-root")).not.toThrow();
  });

  it("tracks temporary external asset paths for staged imports", () => {
    const harness = createRuntimeHarness();

    harness.services.registerTemporaryExternalAssetPath("C:/Imports/hero.png");

    expect(harness.services.isTemporaryExternalAssetPath("C:/Imports/hero.png")).toBe(true);
    harness.services.unregisterTemporaryExternalAssetPath("C:/Imports/hero.png");
    expect(harness.services.isTemporaryExternalAssetPath("C:/Imports/hero.png")).toBe(false);
  });
});
