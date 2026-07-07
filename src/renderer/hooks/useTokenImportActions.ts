import { useCallback } from "react";
import type { Asset, Campaign, CampaignSummary, Point, Scene, SquareCropRect } from "../../shared/localvtt";
import {
  canStartTokenImport,
  getTokenScenePlacementCompletion,
  getTokenCropDialogState,
  type TokenCropDialogState,
  type TokenImportMode
} from "../lib/tokens";

interface UseTokenImportActionsOptions {
  activeScene: Scene | null;
  campaign: Campaign | null;
  campaignDirty: boolean;
  campaignPath: string | null;
  gmCanvasCenter: Point | null;
  tokenCropDialog: TokenCropDialogState | null;
  applySummary: (summary: CampaignSummary, preserveCampaignDraft?: boolean) => void;
  run: (action: () => Promise<void>) => Promise<boolean>;
  selectTokens: (tokenIds: string[]) => void;
  setTokenCropDialog: (dialog: TokenCropDialogState | null) => void;
  updateScene: (nextScene: Scene, syncCampaign?: Campaign | null, syncScene?: Scene) => void;
}

export function useTokenImportActions({
  activeScene,
  campaign,
  campaignDirty,
  campaignPath,
  gmCanvasCenter,
  tokenCropDialog,
  applySummary,
  run,
  selectTokens,
  setTokenCropDialog,
  updateScene
}: UseTokenImportActionsOptions) {
  const cancelTokenCrop = useCallback(
    () =>
      run(async () => {
        if (!campaignPath || !tokenCropDialog) {
          setTokenCropDialog(null);
          return;
        }
        const summary = await window.localVtt.discardTokenImport(campaignPath, tokenCropDialog.asset.id);
        applySummary(summary, campaignDirty);
        setTokenCropDialog(null);
      }),
    [applySummary, campaignDirty, campaignPath, run, setTokenCropDialog, tokenCropDialog]
  );

  const importToken = (mode: TokenImportMode = "scene") =>
    run(async () => {
      if (!campaignPath || !canStartTokenImport(campaignPath, mode, activeScene)) {
        return;
      }
      const result = await window.localVtt.importToken(campaignPath);
      if (!result) {
        return;
      }
      applySummary(result.campaignSummary, campaignDirty);
      setTokenCropDialog(getTokenCropDialogState(result.asset, mode));
    });

  const addImportedTokenToScene = (asset: Asset, syncCampaign: Campaign | null = campaign, placementPoint: Point | null = gmCanvasCenter) => {
    const completion = getTokenScenePlacementCompletion({
      scene: activeScene,
      asset,
      tokenId: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      placementPoint: placementPoint ?? undefined,
      syncCampaign
    });
    if (!completion) {
      return;
    }
    updateScene(completion.scene, completion.syncCampaign);
    selectTokens(completion.selectedTokenIds);
    setTokenCropDialog(completion.tokenCropDialog);
  };

  const addLibraryTokenToScene = (asset: Asset) => {
    addImportedTokenToScene(asset);
  };

  const dropLibraryTokenOnScene = (asset: Asset, point: Point) => {
    addImportedTokenToScene(asset, campaign, point);
  };

  const submitTokenCrop = (crop: SquareCropRect) =>
    run(async () => {
      if (!campaignPath || !tokenCropDialog) {
        return;
      }
      const result = await window.localVtt.updateTokenThumbnail(campaignPath, tokenCropDialog.asset.id, crop);
      applySummary(result.campaignSummary, campaignDirty);
      if (tokenCropDialog.mode === "scene") {
        addImportedTokenToScene(result.asset, result.campaignSummary.campaign);
      } else {
        setTokenCropDialog(null);
      }
    });

  return {
    addImportedTokenToScene,
    addLibraryTokenToScene,
    cancelTokenCrop,
    dropLibraryTokenOnScene,
    importToken,
    submitTokenCrop
  };
}
