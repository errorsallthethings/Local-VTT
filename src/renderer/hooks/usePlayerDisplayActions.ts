import type { Campaign, DisplayCalibration } from "../../shared/localvtt";
import { applyPlayerDisplayProfileAction } from "../lib/player-display/playerDisplayProfiles";

interface UsePlayerDisplayActionsOptions {
  campaign: Campaign | null;
  updateCampaignDraft: (nextCampaign: Campaign) => void;
  createId?: () => string;
  getNow?: () => string;
}

export function usePlayerDisplayActions({
  campaign,
  updateCampaignDraft,
  createId = () => crypto.randomUUID(),
  getNow = () => new Date().toISOString()
}: UsePlayerDisplayActionsOptions) {
  const applyAction = (action: Parameters<typeof applyPlayerDisplayProfileAction>[1], updatedAt = getNow()) => {
    if (!campaign) {
      return;
    }
    const nextCampaign = applyPlayerDisplayProfileAction(campaign, action, updatedAt);
    if (nextCampaign) {
      updateCampaignDraft(nextCampaign);
    }
  };

  return {
    updatePlayerDisplay: (display: DisplayCalibration) => applyAction({ type: "update-display", display }),
    selectPlayerDisplayProfile: (profileId: string) => applyAction({ type: "select-profile", profileId }),
    createPlayerDisplayProfileFromDraft: (name: string, calibration: DisplayCalibration) => {
      const now = getNow();
      applyAction({ type: "create-profile", profileId: createId(), name, calibration }, now);
    },
    renamePlayerDisplayProfile: (profileId: string, name: string) => applyAction({ type: "rename-profile", profileId, name }),
    deletePlayerDisplayProfile: (profileId: string) => applyAction({ type: "delete-profile", profileId })
  };
}
