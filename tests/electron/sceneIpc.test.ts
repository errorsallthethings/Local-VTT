import type { IpcMainInvokeEvent } from "electron";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { registerSceneIpc, type RegisterSceneIpcOptions } from "../../electron/sceneIpc";
import { createCampaignSceneEntry } from "../../electron/sceneEntries";
import {
  createDefaultCampaign,
  createDefaultScene,
  DEFAULT_LAYERS,
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
      return handler({ sender: {} } as IpcMainInvokeEvent, ...args);
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

function createSceneHarness(initialCampaign = createDefaultCampaign("Scene IPC Campaign"), campaignPath = "C:\\Campaigns\\One") {
  let campaign = initialCampaign;
  const scenes = new Map<string, Scene>();
  for (const entry of campaign.scenes) {
    scenes.set(entry.id, createDefaultScene(entry.name));
  }
  let assetIndex = 0;
  const options: RegisterSceneIpcOptions = {
    assertInsideCampaign: vi.fn(),
    assertKnownCampaignPath: vi.fn(),
    backupSceneBeforeDelete: vi.fn().mockResolvedValue(undefined),
    createAssetId: vi.fn(() => `asset-${++assetIndex}`),
    createMapThumbnail: vi.fn(async () => ({ thumbnailRelativePath: "assets/thumbnails/map.png" })),
    dialogs: {
      chooseMapFiles: vi.fn(async () => [])
    },
    getGmWindow: vi.fn(() => null),
    getTimestamp: vi.fn(() => "2026-01-01T00:00:00.000Z"),
    loadCampaignFromPath: vi.fn(async () => campaignSummary(campaignPath, campaign)),
    logThumbnailImportFailure: vi.fn(),
    readSceneMetadata: vi.fn(async (_campaignPath: string, sceneId: string) => scenes.get(sceneId) ?? { ...createDefaultScene("Loaded"), id: sceneId }),
    registerAssetPath: vi.fn(),
    unlinkIfExists: vi.fn().mockResolvedValue(undefined),
    writeCampaign: vi.fn(async (_campaignPath: string, nextCampaign: Campaign) => {
      campaign = nextCampaign;
    }),
    writeScene: vi.fn(async (_campaignPath: string, scene: Scene) => {
      scenes.set(scene.id, scene);
    })
  };
  const ipc = createIpcRegistry();
  registerSceneIpc(ipc.ipcMain, options);
  return { campaignPath, getCampaign: () => campaign, ipc, options, scenes };
}

describe("scene IPC", () => {
  it("registers scene lifecycle handlers", () => {
    const ipc = createIpcRegistry();
    registerSceneIpc(ipc.ipcMain, createSceneHarness().options);

    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("scene:create", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("scene:bulkImportMaps", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("scene:duplicate", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("scene:load", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("scene:save", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("scene:rename", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("scene:delete", expect.any(Function));
  });

  it("creates a scene, writes scene metadata, and refreshes the campaign summary", async () => {
    const harness = createSceneHarness();

    const result = await harness.ipc.invoke("scene:create", harness.campaignPath, "First Scene") as { campaignSummary: CampaignSummary; scene: Scene };

    expect(harness.options.assertKnownCampaignPath).toHaveBeenCalledWith(harness.campaignPath);
    expect(harness.options.writeScene).toHaveBeenCalledWith(harness.campaignPath, expect.objectContaining({ name: "First Scene" }));
    expect(harness.options.writeCampaign).toHaveBeenCalledWith(harness.campaignPath, expect.objectContaining({ scenes: expect.any(Array) }));
    expect(result.scene.name).toBe("First Scene");
    expect(result.campaignSummary.campaign.scenes).toHaveLength(1);
  });

  it("cancels bulk map scene import when no files are selected", async () => {
    const harness = createSceneHarness();
    vi.mocked(harness.options.dialogs.chooseMapFiles).mockResolvedValue([]);

    const result = await harness.ipc.invoke("scene:bulkImportMaps", harness.campaignPath);

    expect(result).toBeNull();
    expect(harness.options.writeScene).not.toHaveBeenCalled();
    expect(harness.options.writeCampaign).not.toHaveBeenCalled();
  });

  it("bulk imports selected map files as one scene per map", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "local-vtt-scene-ipc-"));
    try {
      const campaignPath = path.join(tempRoot, "campaign");
      const firstMap = path.join(tempRoot, "Forest.png");
      const secondMap = path.join(tempRoot, "Forest.jpg");
      await writeFile(firstMap, "first map");
      await writeFile(secondMap, "second map");
      const harness = createSceneHarness(createDefaultCampaign("Campaign"), campaignPath);
      vi.mocked(harness.options.dialogs.chooseMapFiles).mockResolvedValue([firstMap, secondMap]);

      const result = await harness.ipc.invoke("scene:bulkImportMaps", harness.campaignPath) as {
        campaignSummary: CampaignSummary;
        scenes: Scene[];
      };

      expect(result.scenes.map((scene) => scene.name)).toEqual(["Forest", "Forest 2"]);
      expect(result.scenes.map((scene) => scene.mapAssetId)).toEqual(["asset-1", "asset-2"]);
      expect(result.campaignSummary.campaign.scenes).toHaveLength(2);
      expect(result.campaignSummary.campaign.assets).toHaveLength(2);
      expect(harness.options.writeScene).toHaveBeenCalledTimes(2);
      expect(harness.options.writeCampaign).toHaveBeenCalledTimes(1);
      expect(harness.options.registerAssetPath).toHaveBeenCalledTimes(2);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("keeps valid bulk imports when one selected map fails validation", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "local-vtt-scene-ipc-"));
    try {
      const campaignPath = path.join(tempRoot, "campaign");
      const validMap = path.join(tempRoot, "Cave.webp");
      const invalidMap = path.join(tempRoot, "notes.txt");
      await writeFile(validMap, "valid map");
      await writeFile(invalidMap, "not a map");
      const harness = createSceneHarness(createDefaultCampaign("Campaign"), campaignPath);
      vi.mocked(harness.options.dialogs.chooseMapFiles).mockResolvedValue([validMap, invalidMap]);

      const result = await harness.ipc.invoke("scene:bulkImportMaps", harness.campaignPath) as {
        scenes: Scene[];
        failures: Array<{ sourcePath: string; reason: string }>;
      };

      expect(result.scenes).toHaveLength(1);
      expect(result.scenes[0].name).toBe("Cave");
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].sourcePath).toBe(invalidMap);
      expect(harness.options.writeScene).toHaveBeenCalledTimes(1);
      expect(harness.options.writeCampaign).toHaveBeenCalledTimes(1);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("loads scenes through scene defaults preparation", async () => {
    const harness = createSceneHarness();
    const legacyScene = { ...createDefaultScene("Legacy"), id: "scene-1", layers: [] };
    harness.scenes.set("scene-1", legacyScene);

    const result = await harness.ipc.invoke("scene:load", harness.campaignPath, "scene-1") as Scene;

    expect(harness.options.readSceneMetadata).toHaveBeenCalledWith(harness.campaignPath, "scene-1");
    expect(result.layers).toEqual(DEFAULT_LAYERS);
  });

  it("saves a scene only after path safety validation", async () => {
    const scene = { ...createDefaultScene("Saved Scene"), id: "scene-1" };
    const campaign = createDefaultCampaign("Campaign");
    campaign.scenes = [createCampaignSceneEntry(scene)];
    const harness = createSceneHarness(campaign);

    const result = await harness.ipc.invoke("scene:save", harness.campaignPath, { ...scene, name: "Updated Scene" }) as { scene: Scene };

    expect(harness.options.assertInsideCampaign).toHaveBeenCalledWith(harness.campaignPath, expect.stringContaining("scene-1.scene.json"));
    expect(harness.options.writeScene).toHaveBeenCalledWith(harness.campaignPath, expect.objectContaining({ name: "Updated Scene" }));
    expect(harness.options.writeCampaign).toHaveBeenCalledOnce();
    expect(result.scene.name).toBe("Updated Scene");
  });

  it("backs up and removes scene files before deleting campaign entries", async () => {
    const scene = { ...createDefaultScene("Deleted Scene"), id: "scene-1" };
    const campaign = createDefaultCampaign("Campaign");
    campaign.scenes = [createCampaignSceneEntry(scene)];
    const harness = createSceneHarness(campaign);

    const result = await harness.ipc.invoke("scene:delete", harness.campaignPath, "scene-1") as CampaignSummary;

    expect(harness.options.backupSceneBeforeDelete).toHaveBeenCalledWith(harness.campaignPath, "scene-1");
    expect(harness.options.unlinkIfExists).toHaveBeenCalledWith(expect.stringContaining("scene-1.scene.json"));
    expect(harness.options.writeCampaign).toHaveBeenCalledWith(harness.campaignPath, expect.objectContaining({ scenes: [] }));
    expect(result.campaign.scenes).toEqual([]);
  });
});
