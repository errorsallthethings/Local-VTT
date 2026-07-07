import { describe, expect, it, vi } from "vitest";
import { createCampaignWorkflowActions } from "../../src/renderer/hooks/campaignWorkflowActions";
import type { CampaignSceneEntry } from "../../src/shared/localvtt";

function createActions({
  playerSceneId = "scene-1",
  deleteScene = vi.fn(async () => true),
  openRecentCampaign = vi.fn(async () => true),
  removeRecentCampaignPath = vi.fn(),
  showPlayerIdle = vi.fn(async () => undefined)
}: Partial<Parameters<typeof createCampaignWorkflowActions>[0]> = {}) {
  const run = vi.fn(async (task: () => Promise<void>) => {
    try {
      await task();
      return true;
    } catch {
      return false;
    }
  });

  return {
    actions: createCampaignWorkflowActions({
      playerSceneId,
      run,
      deleteScene,
      openRecentCampaign,
      removeRecentCampaignPath,
      showPlayerIdle
    }),
    run,
    deleteScene,
    openRecentCampaign,
    removeRecentCampaignPath,
    showPlayerIdle
  };
}

describe("campaign workflow actions", () => {
  it("removes a recent campaign path when reopening it fails", async () => {
    const openRecentCampaign = vi.fn(async () => false);
    const { actions, removeRecentCampaignPath } = createActions({ openRecentCampaign });

    await actions.reopenRecentCampaign("C:/Campaigns/Missing");

    expect(openRecentCampaign).toHaveBeenCalledWith("C:/Campaigns/Missing");
    expect(removeRecentCampaignPath).toHaveBeenCalledWith("C:/Campaigns/Missing");
  });

  it("keeps a recent campaign path when reopening succeeds", async () => {
    const { actions, removeRecentCampaignPath } = createActions();

    await actions.reopenRecentCampaign("C:/Campaigns/Ready");

    expect(removeRecentCampaignPath).not.toHaveBeenCalled();
  });

  it("shows Player View hold after deleting the scene currently shown to players", async () => {
    const scene: CampaignSceneEntry = { id: "scene-1", name: "Active", file: "scene-1.json" };
    const { actions, deleteScene, showPlayerIdle } = createActions();

    await actions.confirmDeleteScene(scene);

    expect(deleteScene).toHaveBeenCalledWith(scene);
    expect(showPlayerIdle).toHaveBeenCalledTimes(1);
  });

  it("does not change Player View hold after a failed scene delete", async () => {
    const scene: CampaignSceneEntry = { id: "scene-1", name: "Active", file: "scene-1.json" };
    const deleteScene = vi.fn(async () => false);
    const { actions, showPlayerIdle } = createActions({ deleteScene });

    await actions.confirmDeleteScene(scene);

    expect(showPlayerIdle).not.toHaveBeenCalled();
  });
});
