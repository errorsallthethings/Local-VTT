import type { BrowserWindow, IpcMainInvokeEvent } from "electron";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { campaignFile } from "../../electron/campaignPaths";
import { registerCampaignIpc, type RegisterCampaignIpcOptions } from "../../electron/campaignIpc";
import { createDefaultCampaign, type Campaign, type CampaignSummary } from "../../src/shared/localvtt";

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

function createCampaignHarness(dialogPath: string | null = "C:\\Campaigns\\Created") {
  let campaign = createDefaultCampaign("Existing Campaign");
  let currentCampaignPath: string | null = null;
  const ipc = createIpcRegistry();
  const options: RegisterCampaignIpcOptions = {
    assertKnownCampaignPath: vi.fn(),
    createCampaignForFolder: vi.fn((campaignPath: string) => createDefaultCampaign(path.basename(campaignPath))),
    dialogs: {
      chooseDirectory: vi.fn().mockResolvedValue(dialogPath)
    },
    getGmWindow: vi.fn(() => null as BrowserWindow | null),
    listMetadataBackups: vi.fn().mockResolvedValue([{ id: "backup-1" }]),
    loadCampaignFromPath: vi.fn(async (campaignPath: string) => campaignSummary(campaignPath, campaign)),
    loadCampaignWithPausedTurnOrders: vi.fn(async (campaignPath: string) => campaignSummary(campaignPath, campaign)),
    openMetadataBackupsFolder: vi.fn().mockResolvedValue(""),
    previewMetadataBackup: vi.fn().mockResolvedValue({ kind: "preview" }),
    registerCampaignPath: vi.fn(),
    resolveCurrentCampaignPath: vi.fn((campaignPath: string) => path.resolve(campaignPath)),
    restoreMetadataBackup: vi.fn().mockResolvedValue({ kind: "restore" }),
    setCurrentCampaignPath: vi.fn((campaignPath: string | null) => {
      currentCampaignPath = campaignPath;
    }),
    writeCampaign: vi.fn(async (_campaignPath: string, nextCampaign: Campaign) => {
      campaign = nextCampaign;
    })
  };

  registerCampaignIpc(ipc.ipcMain, options);
  return { getCampaign: () => campaign, getCurrentCampaignPath: () => currentCampaignPath, ipc, options };
}

describe("campaign IPC", () => {
  const tempRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(tempRoots.map((root) => rm(root, { force: true, recursive: true })));
    tempRoots.length = 0;
  });

  it("registers campaign and metadata backup handlers", () => {
    const harness = createCampaignHarness();

    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("campaign:create", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("campaign:open", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("campaign:openRecent", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("campaign:save", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("campaign:refresh", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("campaign:openBackupsFolder", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("campaign:listMetadataBackups", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("campaign:previewMetadataBackup", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("campaign:restoreMetadataBackup", expect.any(Function));
  });

  it("creates a campaign after choosing a folder", async () => {
    const harness = createCampaignHarness("C:\\Campaigns\\New Campaign");

    const result = await harness.ipc.invoke("campaign:create") as CampaignSummary;

    expect(harness.options.dialogs.chooseDirectory).toHaveBeenCalledWith(null, "Choose a folder for the new Local VTT campaign", true);
    expect(harness.options.registerCampaignPath).toHaveBeenCalledWith("C:\\Campaigns\\New Campaign");
    expect(harness.options.setCurrentCampaignPath).toHaveBeenCalledWith(path.resolve("C:\\Campaigns\\New Campaign"));
    expect(harness.options.writeCampaign).toHaveBeenCalledWith("C:\\Campaigns\\New Campaign", expect.objectContaining({ name: "New Campaign" }));
    expect(result.campaignPath).toBe("C:\\Campaigns\\New Campaign");
  });

  it("returns null when campaign creation is canceled", async () => {
    const harness = createCampaignHarness(null);

    await expect(harness.ipc.invoke("campaign:create")).resolves.toBeNull();

    expect(harness.options.writeCampaign).not.toHaveBeenCalled();
    expect(harness.options.registerCampaignPath).not.toHaveBeenCalled();
  });

  it("opens campaigns through the paused-turn-order loading path", async () => {
    const harness = createCampaignHarness("C:\\Campaigns\\Existing");

    await harness.ipc.invoke("campaign:open");

    expect(harness.options.dialogs.chooseDirectory).toHaveBeenCalledWith(null, "Open Local VTT campaign folder");
    expect(harness.options.loadCampaignWithPausedTurnOrders).toHaveBeenCalledWith("C:\\Campaigns\\Existing");
  });

  it("checks the metadata file before opening recent campaigns", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "local-vtt-campaign-ipc-"));
    tempRoots.push(tempRoot);
    await mkdir(path.dirname(campaignFile(tempRoot)), { recursive: true });
    await writeFile(campaignFile(tempRoot), JSON.stringify(createDefaultCampaign("Recent")));
    const harness = createCampaignHarness();

    await harness.ipc.invoke("campaign:openRecent", tempRoot);

    expect(harness.options.loadCampaignWithPausedTurnOrders).toHaveBeenCalledWith(tempRoot);
  });

  it("saves only validated campaigns from known paths", async () => {
    const harness = createCampaignHarness();
    const campaign = createDefaultCampaign("Saved Campaign");

    const result = await harness.ipc.invoke("campaign:save", "C:\\Campaigns\\Saved", campaign) as CampaignSummary;

    expect(harness.options.assertKnownCampaignPath).toHaveBeenCalledWith("C:\\Campaigns\\Saved");
    expect(harness.options.writeCampaign).toHaveBeenCalledWith("C:\\Campaigns\\Saved", campaign);
    expect(result.campaign.name).toBe("Saved Campaign");
  });

  it("validates backup references before previewing and restoring metadata backups", async () => {
    const harness = createCampaignHarness();
    const ref = { kind: "campaign", fileName: "campaign.2026-01-01T00-00-00-000Z.json" };

    await expect(harness.ipc.invoke("campaign:previewMetadataBackup", "C:\\Campaigns\\One", ref)).resolves.toEqual({ kind: "preview" });
    await expect(harness.ipc.invoke("campaign:restoreMetadataBackup", "C:\\Campaigns\\One", ref)).resolves.toEqual({ kind: "restore" });

    expect(harness.options.previewMetadataBackup).toHaveBeenCalledWith("C:\\Campaigns\\One", ref);
    expect(harness.options.restoreMetadataBackup).toHaveBeenCalledWith("C:\\Campaigns\\One", ref);
  });
});
