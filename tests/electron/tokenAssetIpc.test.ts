import type { BrowserWindow, IpcMainInvokeEvent } from "electron";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerTokenAssetIpc, type RegisterTokenAssetIpcOptions } from "../../electron/tokenAssetIpc";
import {
  createDefaultCampaign,
  createDefaultScene,
  type Asset,
  type Campaign,
  type CampaignSummary,
  type Scene
} from "../../src/shared/localvtt";

type IpcHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>;

function createIpcRegistry() {
  const handlers = new Map<string, IpcHandler>();
  return {
    ipcMain: {
      handle: vi.fn((channel: string, handler: IpcHandler) => {
        handlers.set(channel, handler);
      })
    },
    invoke: (channel: string, ...args: unknown[]) => {
      const handler = handlers.get(channel);
      if (!handler) {
        throw new Error(`No handler registered for ${channel}.`);
      }
      return handler({} as IpcMainInvokeEvent, ...args);
    }
  };
}

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

function tokenAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "token-1",
    name: "Hero",
    kind: "token",
    mediaType: "image",
    relativePath: "assets/tokens/hero.png",
    originalFileName: "hero.png",
    createdAt: "2026-07-05T00:00:00.000Z",
    ...overrides
  };
}

describe("token asset IPC", () => {
  let campaignPath: string;
  let sourcePath: string;
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "local-vtt-token-asset-ipc-"));
    campaignPath = path.join(tempRoot, "campaign");
    sourcePath = path.join(tempRoot, "source", "hero.png");
    await mkdir(path.join(campaignPath, "assets", "tokens"), { recursive: true });
    await mkdir(path.dirname(sourcePath), { recursive: true });
    await writeFile(sourcePath, "source token image", "utf8");
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  function createTokenHarness(initialCampaign = createDefaultCampaign("Token IPC Campaign"), initialScenes: Scene[] = []) {
    let campaign = initialCampaign;
    const scenes = new Map(initialScenes.map((scene) => [scene.id, scene]));
    const ipc = createIpcRegistry();
    const options: RegisterTokenAssetIpcOptions = {
      assertInsideCampaign: vi.fn(),
      assertKnownCampaignPath: vi.fn(),
      createAssetId: vi.fn(() => "token-new"),
      createSquareImageThumbnail: vi.fn().mockResolvedValue(Buffer.from("thumbnail")),
      dialogs: {
        chooseTokenFile: vi.fn().mockResolvedValue(sourcePath)
      },
      getGmWindow: vi.fn(() => null as BrowserWindow | null),
      getTimestamp: vi.fn(() => "2026-07-05T12:00:00.000Z"),
      loadCampaignFromPath: vi.fn(async (selectedCampaignPath: string) => campaignSummary(selectedCampaignPath, campaign)),
      readSceneMetadata: vi.fn(async (_campaignPath: string, sceneId: string) => scenes.get(sceneId) ?? { ...createDefaultScene("Loaded"), id: sceneId }),
      registerTemporaryExternalAssetPath: vi.fn(),
      removeCampaignAssetFiles: vi.fn().mockResolvedValue(undefined),
      unregisterTemporaryExternalAssetPath: vi.fn(),
      writeCampaign: vi.fn(async (_campaignPath: string, nextCampaign: Campaign) => {
        campaign = nextCampaign;
      }),
      writeScene: vi.fn(async (_campaignPath: string, scene: Scene) => {
        scenes.set(scene.id, scene);
      })
    };
    registerTokenAssetIpc(ipc.ipcMain, options);
    return { getCampaign: () => campaign, ipc, options, scenes };
  }

  it("registers token asset handlers", () => {
    const harness = createTokenHarness();

    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:importToken", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:updateTokenThumbnail", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:discardTokenImport", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:getTokenUsage", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:deleteToken", expect.any(Function));
  });

  it("stages a selected token import and registers temporary external access", async () => {
    const harness = createTokenHarness();

    const result = await harness.ipc.invoke("asset:importToken", campaignPath) as { asset: Asset };

    expect(harness.options.assertKnownCampaignPath).toHaveBeenCalledWith(campaignPath);
    expect(harness.options.registerTemporaryExternalAssetPath).toHaveBeenCalledWith(sourcePath);
    expect(result.asset).toMatchObject({
      id: "token-new",
      kind: "token",
      relativePath: "assets/tokens/token-new.jpg"
    });
    expect(result.asset.thumbnailRelativePath).toBeUndefined();
    expect(harness.options.writeCampaign).not.toHaveBeenCalled();
  });

  it("commits a staged token import as a cropped campaign token asset", async () => {
    const harness = createTokenHarness();
    await harness.ipc.invoke("asset:importToken", campaignPath);

    const result = await harness.ipc.invoke("asset:updateTokenThumbnail", campaignPath, "token-new", {
      x: 0,
      y: 0,
      size: 1
    }) as { asset: Asset; campaignSummary: CampaignSummary };

    await expect(readFile(path.join(campaignPath, "assets", "tokens", "token-new.jpg"), "utf8")).resolves.toBe("thumbnail");
    expect(harness.options.unregisterTemporaryExternalAssetPath).toHaveBeenCalledWith(sourcePath);
    expect(result.asset).toMatchObject({ id: "token-new", kind: "token", thumbnailRelativePath: "assets/tokens/token-new.jpg" });
    expect(result.campaignSummary.campaign.assets.map((asset) => asset.id)).toContain("token-new");
  });

  it("discards a staged token import without writing campaign assets", async () => {
    const harness = createTokenHarness();
    await harness.ipc.invoke("asset:importToken", campaignPath);

    await harness.ipc.invoke("asset:discardTokenImport", campaignPath, "token-new");

    expect(harness.options.unregisterTemporaryExternalAssetPath).toHaveBeenCalledWith(sourcePath);
    expect(harness.options.removeCampaignAssetFiles).not.toHaveBeenCalled();
    expect(harness.options.writeCampaign).not.toHaveBeenCalled();
  });

  it("does not discard a staged token import from a different campaign", async () => {
    const harness = createTokenHarness();
    await harness.ipc.invoke("asset:importToken", campaignPath);

    await harness.ipc.invoke("asset:discardTokenImport", path.join(tempRoot, "other-campaign"), "token-new");

    expect(harness.options.unregisterTemporaryExternalAssetPath).not.toHaveBeenCalled();
    await harness.ipc.invoke("asset:updateTokenThumbnail", campaignPath, "token-new", {
      x: 0,
      y: 0,
      size: 1
    });
    expect(harness.options.unregisterTemporaryExternalAssetPath).toHaveBeenCalledWith(sourcePath);
  });

  it("keeps existing token files when discard metadata cannot be written", async () => {
    const asset = tokenAsset();
    const campaign = createDefaultCampaign("Campaign");
    campaign.assets = [asset];
    const harness = createTokenHarness(campaign);
    vi.mocked(harness.options.writeCampaign).mockRejectedValueOnce(new Error("write failed"));

    await expect(harness.ipc.invoke("asset:discardTokenImport", campaignPath, asset.id)).rejects.toThrow("write failed");

    expect(harness.options.removeCampaignAssetFiles).not.toHaveBeenCalled();
  });

  it("updates an existing token thumbnail from its campaign file", async () => {
    const tokenPath = path.join(campaignPath, "assets", "tokens", "hero.png");
    await writeFile(tokenPath, "old token image", "utf8");
    const campaign = createDefaultCampaign("Campaign");
    campaign.assets = [tokenAsset({ absolutePath: tokenPath, thumbnailRelativePath: "assets/thumbnails/old-hero.png" })];
    const harness = createTokenHarness(campaign);

    const result = await harness.ipc.invoke("asset:updateTokenThumbnail", campaignPath, "token-1", {
      x: 0,
      y: 0,
      size: 1
    }) as { asset: Asset };

    expect(harness.options.assertInsideCampaign).toHaveBeenCalledWith(campaignPath, tokenPath);
    expect(result.asset.thumbnailRelativePath).toMatch(/^assets\/thumbnails\/token-1-crop-\d+\.jpg$/);
  });

  it("reports token usage across campaign scenes", async () => {
    const scene = { ...createDefaultScene("Scene One"), id: "scene-1" };
    scene.tokens = [
      { id: "placed-1", assetId: "token-1", x: 0, y: 0, rotation: 0, scale: 1, hidden: false },
      { id: "placed-2", assetId: "token-1", x: 1, y: 1, rotation: 0, scale: 1, hidden: false }
    ];
    const campaign = createDefaultCampaign("Campaign");
    campaign.scenes = [{ id: scene.id, name: scene.name, file: "scenes/scene-1.scene.json" }];
    const harness = createTokenHarness(campaign, [scene]);

    await expect(harness.ipc.invoke("asset:getTokenUsage", campaignPath, "token-1")).resolves.toEqual([
      { sceneId: "scene-1", sceneName: "Scene One", count: 2 }
    ]);
  });

  it("deletes a token asset and removes placed tokens from scenes", async () => {
    const asset = tokenAsset();
    const scene = { ...createDefaultScene("Scene One"), id: "scene-1" };
    scene.tokens = [{ id: "placed-1", assetId: asset.id, x: 0, y: 0, rotation: 0, scale: 1, hidden: false }];
    const campaign = createDefaultCampaign("Campaign");
    campaign.assets = [asset];
    campaign.scenes = [{ id: scene.id, name: scene.name, file: "scenes/scene-1.scene.json" }];
    const harness = createTokenHarness(campaign, [scene]);

    const result = await harness.ipc.invoke("asset:deleteToken", campaignPath, asset.id) as { campaignSummary: CampaignSummary; scenes: Scene[] };

    expect(harness.options.removeCampaignAssetFiles).toHaveBeenCalledWith(campaignPath, asset);
    expect(result.scenes[0].tokens).toEqual([]);
    expect(result.campaignSummary.campaign.assets).toEqual([]);
  });

  it("keeps token files when delete metadata cannot be written", async () => {
    const asset = tokenAsset();
    const scene = { ...createDefaultScene("Scene One"), id: "scene-1" };
    scene.tokens = [{ id: "placed-1", assetId: asset.id, x: 0, y: 0, rotation: 0, scale: 1, hidden: false }];
    const campaign = createDefaultCampaign("Campaign");
    campaign.assets = [asset];
    campaign.scenes = [{ id: scene.id, name: scene.name, file: "scenes/scene-1.scene.json" }];
    const harness = createTokenHarness(campaign, [scene]);
    vi.mocked(harness.options.writeCampaign).mockRejectedValueOnce(new Error("write failed"));

    await expect(harness.ipc.invoke("asset:deleteToken", campaignPath, asset.id)).rejects.toThrow("write failed");

    expect(harness.options.writeScene).toHaveBeenCalledWith(campaignPath, expect.objectContaining({ id: scene.id, tokens: [] }));
    expect(harness.options.removeCampaignAssetFiles).not.toHaveBeenCalled();
  });
});
