import type { CampaignSceneEntry } from "../../shared/localvtt";
import { shouldShowPlayerHoldAfterSceneDelete } from "./usePlayerViewState";

interface CampaignWorkflowActionsOptions {
  playerSceneId: string | null;
  run: (task: () => Promise<void>) => Promise<boolean>;
  deleteScene: (scene: CampaignSceneEntry) => Promise<boolean>;
  openRecentCampaign: (campaignPath: string) => Promise<boolean>;
  removeRecentCampaignPath: (campaignPath: string) => void;
  showPlayerIdle: () => Promise<void>;
}

export function createCampaignWorkflowActions({
  playerSceneId,
  run,
  deleteScene,
  openRecentCampaign,
  removeRecentCampaignPath,
  showPlayerIdle
}: CampaignWorkflowActionsOptions) {
  const reopenRecentCampaign = async (recentCampaignPath: string) => {
    const ok = await openRecentCampaign(recentCampaignPath);
    if (!ok) {
      removeRecentCampaignPath(recentCampaignPath);
    }
  };

  const confirmDeleteScene = (scene: CampaignSceneEntry) =>
    run(async () => {
      const ok = await deleteScene(scene);
      if (shouldShowPlayerHoldAfterSceneDelete(scene.id, playerSceneId, ok)) {
        await showPlayerIdle();
      }
    });

  return {
    reopenRecentCampaign,
    confirmDeleteScene
  };
}
