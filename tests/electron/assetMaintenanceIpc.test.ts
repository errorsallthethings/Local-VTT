import type { IpcMainInvokeEvent, WebContents } from "electron";
import { describe, expect, it, vi } from "vitest";
import { registerAssetMaintenanceIpc, type RegisterAssetMaintenanceIpcOptions } from "../../electron/assetMaintenanceIpc";
import type { ThumbnailRegenerationProgress } from "../../src/shared/localvtt";

type IpcHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>;

function createIpcRegistry() {
  const handlers = new Map<string, IpcHandler>();
  return {
    ipcMain: {
      handle: vi.fn((channel: string, handler: IpcHandler) => {
        handlers.set(channel, handler);
      })
    },
    invoke: (channel: string, event: Partial<IpcMainInvokeEvent>, ...args: unknown[]) => {
      const handler = handlers.get(channel);
      if (!handler) {
        throw new Error(`No handler registered for ${channel}.`);
      }
      return handler(event as IpcMainInvokeEvent, ...args);
    }
  };
}

function createMaintenanceHarness() {
  const ipc = createIpcRegistry();
  const options: RegisterAssetMaintenanceIpcOptions = {
    assertKnownCampaignPath: vi.fn(),
    previewCampaignAssetCleanup: vi.fn().mockResolvedValue({
      campaignSummary: { campaignPath: "campaign-root" },
      unreferencedAssets: [],
      staleThumbnailReferences: [],
      orphanedFiles: [],
      retainedAssetCount: 2,
      totalFilesToRemove: 0,
      totalBytesToRemove: 0
    }),
    promoteCampaignTokenAssets: vi.fn().mockResolvedValue({ campaignSummary: { campaignPath: "campaign-root" }, promoted: 1, skipped: 2, failed: [] }),
    pruneCampaignUnreferencedAssets: vi.fn().mockResolvedValue({ campaignSummary: { campaignPath: "campaign-root" }, pruned: 3, skipped: 4, removedFiles: 5, failed: [], removedOrphanedFiles: 1, failedOrphanedFiles: [] }),
    regenerateCampaignThumbnails: vi.fn(async (_campaignPath, onProgress) => {
      onProgress?.({ assetId: "asset-1", completed: 1, message: "Processed asset-1.", total: 1 } as ThumbnailRegenerationProgress);
      return { campaignSummary: { campaignPath: "campaign-root" }, regenerated: 1, skipped: 0, failed: [] };
    })
  };
  registerAssetMaintenanceIpc(ipc.ipcMain, options);
  return { ipc, options };
}

describe("asset maintenance IPC", () => {
  it("registers asset maintenance handlers", () => {
    const harness = createMaintenanceHarness();

    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:regenerateThumbnails", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:promoteTokenAssets", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:previewCleanup", expect.any(Function));
    expect(harness.ipc.ipcMain.handle).toHaveBeenCalledWith("asset:pruneUnreferencedAssets", expect.any(Function));
  });

  it("regenerates thumbnails and forwards progress through the renderer sender", async () => {
    const harness = createMaintenanceHarness();
    const sender = { send: vi.fn() } as unknown as WebContents;

    const result = await harness.ipc.invoke("asset:regenerateThumbnails", { sender }, "campaign-root");

    expect(harness.options.assertKnownCampaignPath).toHaveBeenCalledWith("campaign-root");
    expect(harness.options.regenerateCampaignThumbnails).toHaveBeenCalledWith("campaign-root", expect.any(Function), sender);
    expect(sender.send).toHaveBeenCalledWith("asset:thumbnailRegenerationProgress", {
      assetId: "asset-1",
      completed: 1,
      message: "Processed asset-1.",
      total: 1
    });
    expect(result).toMatchObject({ regenerated: 1, skipped: 0 });
  });

  it("promotes token assets from known campaigns", async () => {
    const harness = createMaintenanceHarness();

    const result = await harness.ipc.invoke("asset:promoteTokenAssets", {}, "campaign-root");

    expect(harness.options.assertKnownCampaignPath).toHaveBeenCalledWith("campaign-root");
    expect(harness.options.promoteCampaignTokenAssets).toHaveBeenCalledWith("campaign-root");
    expect(result).toMatchObject({ promoted: 1, skipped: 2 });
  });

  it("prunes unreferenced assets from known campaigns", async () => {
    const harness = createMaintenanceHarness();

    const result = await harness.ipc.invoke("asset:pruneUnreferencedAssets", {}, "campaign-root");

    expect(harness.options.assertKnownCampaignPath).toHaveBeenCalledWith("campaign-root");
    expect(harness.options.pruneCampaignUnreferencedAssets).toHaveBeenCalledWith("campaign-root");
    expect(result).toMatchObject({ pruned: 3, skipped: 4, removedFiles: 5 });
  });

  it("previews asset cleanup for known campaigns", async () => {
    const harness = createMaintenanceHarness();

    const result = await harness.ipc.invoke("asset:previewCleanup", {}, "campaign-root");

    expect(harness.options.assertKnownCampaignPath).toHaveBeenCalledWith("campaign-root");
    expect(harness.options.previewCampaignAssetCleanup).toHaveBeenCalledWith("campaign-root");
    expect(result).toMatchObject({ retainedAssetCount: 2, totalFilesToRemove: 0 });
  });
});
