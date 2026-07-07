import type { IpcMainInvokeEvent } from "electron";
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

function createSceneHarness(initialCampaign = createDefaultCampaign("Scene IPC Campaign")) {
  const campaignPath = "C:\\Campaigns\\One";
  let campaign = initialCampaign;
  const scenes = new Map<string, Scene>();
  for (const entry of campaign.scenes) {
    scenes.set(entry.id, createDefaultScene(entry.name));
  }
  const options: RegisterSceneIpcOptions = {
    assertInsideCampaign: vi.fn(),
    assertKnownCampaignPath: vi.fn(),
    backupSceneBeforeDelete: vi.fn().mockResolvedValue(undefined),
    loadCampaignFromPath: vi.fn(async () => campaignSummary(campaignPath, campaign)),
    readSceneMetadata: vi.fn(async (_campaignPath: string, sceneId: string) => scenes.get(sceneId) ?? { ...createDefaultScene("Loaded"), id: sceneId }),
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
