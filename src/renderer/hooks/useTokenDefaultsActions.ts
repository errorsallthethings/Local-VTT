import type { Dispatch, SetStateAction } from "react";
import type { Asset, Campaign, TokenPresentationDefaults } from "../../shared/localvtt";
import { setCampaignTokenAssetDefaults } from "../lib/campaign";
import type { TokenDefaultsDialog } from "../views/GmDialogs";

interface UseTokenDefaultsActionsOptions {
  campaign: Campaign | null;
  tokenDefaultsDialog: TokenDefaultsDialog | null;
  setTokenDefaultsDialog: Dispatch<SetStateAction<TokenDefaultsDialog | null>>;
  updateCampaignDraft: (nextCampaign: Campaign) => void;
  getNow?: () => string;
}

export function useTokenDefaultsActions({
  campaign,
  tokenDefaultsDialog,
  setTokenDefaultsDialog,
  updateCampaignDraft,
  getNow = () => new Date().toISOString()
}: UseTokenDefaultsActionsOptions) {
  return {
    openTokenDefaultsDialog: (asset: Asset) => {
      setTokenDefaultsDialog({
        assetId: asset.id,
        assetName: asset.name || asset.originalFileName || "Token",
        draft: { ...(asset.tokenDefaults ?? {}) }
      });
    },
    updateTokenDefaultsDraft: (draft: TokenPresentationDefaults) => {
      setTokenDefaultsDialog((dialog) => (dialog ? { ...dialog, draft } : dialog));
    },
    submitTokenDefaults: () => {
      if (!campaign || !tokenDefaultsDialog) {
        return;
      }
      updateCampaignDraft(setCampaignTokenAssetDefaults(campaign, tokenDefaultsDialog.assetId, tokenDefaultsDialog.draft, getNow()));
      setTokenDefaultsDialog(null);
    }
  };
}
