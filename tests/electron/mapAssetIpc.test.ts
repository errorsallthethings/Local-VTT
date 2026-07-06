import type { BrowserWindow, IpcMainInvokeEvent, WebContents } from "electron";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerMapAssetIpc, type RegisterMapAssetIpcOptions } from "../../electron/mapAssetIpc";
import type { MapReplacementTokenStore } from "../../electron/mapReplacementTokens";
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
      return handler({ sender: { id: 1 } as WebContents } as IpcMainInvokeEvent, ...args);
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

function mapAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "map-1",
    name: "Map One",
    kind: "map",
    mediaType: "image",
    relativePath: "assets/maps/map-one.png",
    originalFileName: "map-one.png",
    createdAt: "2026-07-05T00:00:00.000Z",
    ...overrides
  };
}

describe("map asset IPC", () => {
  let tempRoot: string;
  let campaignPath: string;
  let sourcePath: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "local-vtt-map-asset-ipc-"));
    campaignPath = path.join(tempRoot, "campaign");
    sourcePath = path.join(tempRoot, "source", "replacement-map.png");
    await mkdir(path.join(campaignPath, "assets", "maps"), { recursive: true });
    await mkdir(path.dirname(sourcePath), { recursive: true });
    await writeFile(sourcePath, "map data", "utf8");
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  function createMapHarness(initialCampaign = createDefaultCampaign("Map IPC Campaign"), initialScenes: Scene[] = []) {
    let campaign = initialCampaign;
    const scenes = new Map(initialScenes.map((scene) => [scene.id, scene]));
    const mapReplacementTokens: MapReplacementTokenStore = new Map();
    const ipc = createIpcRegistry();
    const options: RegisterMapAssetIpcOptions = {
      assertKnownCampaignPath: vi.fn(),
      createAssetId: vi.fn(() => "map-new"),
      createMapThumbnail: vi.fn().mockResolvedValue({ thumbnailRelativePath: "assets/thumbnails/map-new.png" }),
      dialogs: {
        chooseMapFile: vi.fn().mockResolvedValue(sourcePath)
      },
      getGmWindow: vi.fn(() => null as BrowserWindow | null),
      getTimestamp: vi.fn(() => "2026-07-05T12:00:00.000Z"),
      loadCampaignFromPath: vi.fn(async (selectedCampaignPath: string) => campaignSummary(selectedCampaignPath, campaign)),
      logThumbnailImportFailure: vi.fn(),
      mapReplacementTokens,
      readSceneMetadata: vi.fn(async (_campaignPath: string, sceneId: string) => scenes.get(sceneId) ?? { ...createDefaultScene("Loaded"), id: sceneId }),
      registerAssetPath: vi.fn(),
      removeCampaignAssetFiles: vi.fn().mockResolvedValue(undefined),
      writeCampaign: vi.fn(async (_campaignPath: string, nextCampaign: Campaign) => {
        campaign = nextCampaign;
      }),
      writeScene: vi.fn(async (_campaignPath: string, scene: Scene) => {
        scenes.set(scene.id, scene);
      })
    };
    registerMapAssetIpc(ipc.ipcMain, options);
    return { getCampaign: () => campaign, ipc, mapReplacementTokens, options, scenes };
  }

  it("registers map asset handlers", () => {
    const harness = createMapHarness();

    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:importMap", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:previewMapReplacement", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:replaceMap", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:deleteMap", expect.any(Function));
  });

  it("imports a selected map into the campaign and registers the copied asset path", async () => {
    const harness = createMapHarness();

    const result = await harness.ipc.invoke("asset:importMap", campaignPath) as { asset: Asset; campaignSummary: CampaignSummary };

    expect(harness.options.assertKnownCampaignPath).toHaveBeenCalledWith(campaignPath);
    expect(harness.options.registerAssetPath).toHaveBeenCalledWith(expect.stringContaining(`${path.sep}assets${path.sep}maps${path.sep}`));
    expect(harness.options.createMapThumbnail).toHaveBeenCalledWith(campaignPath, expect.stringContaining(`${path.sep}assets${path.sep}maps${path.sep}`), "map-new", expect.any(Object));
    expect(result.asset).toMatchObject({
      id: "map-new",
      kind: "map",
      mediaType: "image",
      thumbnailRelativePath: "assets/thumbnails/map-new.png"
    });
    expect(result.campaignSummary.campaign.assets.map((asset) => asset.id)).toContain("map-new");
  });

  it("returns null when map import is canceled", async () => {
    const harness = createMapHarness();
    vi.mocked(harness.options.dialogs.chooseMapFile).mockResolvedValueOnce(null);

    await expect(harness.ipc.invoke("asset:importMap", campaignPath)).resolves.toBeNull();

    expect(harness.options.writeCampaign).not.toHaveBeenCalled();
    expect(harness.options.registerAssetPath).not.toHaveBeenCalled();
  });

  it("replaces a scene map and removes the previous asset when it is not reused", async () => {
    const currentMap = mapAsset();
    const scene = { ...createDefaultScene("Scene One"), id: "scene-1", mapAssetId: currentMap.id };
    const campaign = createDefaultCampaign("Campaign");
    campaign.assets = [currentMap];
    campaign.scenes = [{ id: scene.id, name: scene.name, file: "scenes/scene-1.scene.json", mapAssetId: currentMap.id }];
    const harness = createMapHarness(campaign, [scene]);
    harness.mapReplacementTokens.set("replace-1", {
      id: "replace-1",
      campaignPath: path.resolve(campaignPath),
      sceneId: scene.id,
      currentAssetId: currentMap.id,
      sourcePath: path.resolve(sourcePath),
      createdAt: Date.now()
    });

    const result = await harness.ipc.invoke("asset:replaceMap", campaignPath, scene.id, currentMap.id, "replace-1") as { asset: Asset; scene: Scene };

    expect(result.asset.id).toBe("map-new");
    expect(result.scene.mapAssetId).toBe("map-new");
    expect(harness.options.writeScene).toHaveBeenCalledWith(campaignPath, expect.objectContaining({ id: scene.id, mapAssetId: "map-new" }));
    expect(harness.options.removeCampaignAssetFiles).toHaveBeenCalledWith(campaignPath, currentMap);
    expect(harness.getCampaign().assets.map((asset) => asset.id)).toEqual(["map-new"]);
  });

  it("deletes a map asset when it is not used by other scenes", async () => {
    const currentMap = mapAsset();
    const scene = { ...createDefaultScene("Scene One"), id: "scene-1", mapAssetId: currentMap.id };
    const campaign = createDefaultCampaign("Campaign");
    campaign.assets = [currentMap];
    campaign.scenes = [{ id: scene.id, name: scene.name, file: "scenes/scene-1.scene.json", mapAssetId: currentMap.id }];
    const harness = createMapHarness(campaign, [scene]);

    const result = await harness.ipc.invoke("asset:deleteMap", campaignPath, scene.id, currentMap.id) as { scene: Scene; campaignSummary: CampaignSummary };

    expect(harness.options.removeCampaignAssetFiles).toHaveBeenCalledWith(campaignPath, currentMap);
    expect(harness.options.writeScene).toHaveBeenCalledWith(campaignPath, expect.objectContaining({ id: scene.id, mapAssetId: undefined }));
    expect(result.scene.mapAssetId).toBeUndefined();
    expect(result.campaignSummary.campaign.assets).toEqual([]);
  });

  it("blocks deleting a map asset that is still used by another scene", async () => {
    const currentMap = mapAsset();
    const scene = { ...createDefaultScene("Scene One"), id: "scene-1", mapAssetId: currentMap.id };
    const otherScene = { ...createDefaultScene("Scene Two"), id: "scene-2", mapAssetId: currentMap.id };
    const campaign = createDefaultCampaign("Campaign");
    campaign.assets = [currentMap];
    campaign.scenes = [
      { id: scene.id, name: scene.name, file: "scenes/scene-1.scene.json", mapAssetId: currentMap.id },
      { id: otherScene.id, name: otherScene.name, file: "scenes/scene-2.scene.json", mapAssetId: currentMap.id }
    ];
    const harness = createMapHarness(campaign, [scene, otherScene]);

    await expect(harness.ipc.invoke("asset:deleteMap", campaignPath, scene.id, currentMap.id)).rejects.toThrow("This map asset is still used by: Scene Two.");

    expect(harness.options.removeCampaignAssetFiles).not.toHaveBeenCalled();
    expect(harness.options.writeCampaign).not.toHaveBeenCalled();
  });
});
