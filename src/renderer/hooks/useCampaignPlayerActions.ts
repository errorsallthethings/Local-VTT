import type { Campaign, CampaignPlayer, Scene } from "../../shared/localvtt";
import { addCampaignPlayerToCampaign, deleteCampaignPlayerFromCampaign, updateCampaignPlayerInCampaign } from "../lib/campaign";

interface UseCampaignPlayerActionsOptions {
  activeScene: Scene | null;
  campaign: Campaign | null;
  updateCampaignDraft: (nextCampaign: Campaign) => void;
  updateScene: (nextScene: Scene, syncCampaign?: Campaign | null) => void;
  createId?: () => string;
  getNow?: () => string;
}

export function useCampaignPlayerActions({
  activeScene,
  campaign,
  updateCampaignDraft,
  updateScene,
  createId = () => crypto.randomUUID(),
  getNow = () => new Date().toISOString()
}: UseCampaignPlayerActionsOptions) {
  const applyPlayerMutation = (mutation: { campaign: Campaign; scene: Scene | null }) => {
    updateCampaignDraft(mutation.campaign);
    if (mutation.scene) {
      updateScene(mutation.scene, mutation.campaign);
    }
  };

  return {
    addCampaignPlayer: () => {
      if (!campaign) {
        return;
      }
      const nextCampaign = addCampaignPlayerToCampaign(campaign, createId(), getNow());
      if (nextCampaign) {
        updateCampaignDraft(nextCampaign);
      }
    },
    updateCampaignPlayer: (playerId: string, patch: Partial<CampaignPlayer>) => {
      if (!campaign) {
        return;
      }
      applyPlayerMutation(updateCampaignPlayerInCampaign(campaign, activeScene, playerId, patch, getNow()));
    },
    deleteCampaignPlayer: (playerId: string) => {
      if (!campaign) {
        return;
      }
      applyPlayerMutation(deleteCampaignPlayerFromCampaign(campaign, activeScene, playerId, getNow()));
    }
  };
}
