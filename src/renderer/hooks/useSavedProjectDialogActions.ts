import type { Dispatch, SetStateAction } from "react";
import type { Asset, Campaign, CampaignSummary, Scene } from "../../shared/localvtt";
import {
  getActiveSceneAfterSceneRename,
  getSceneDraftsAfterSceneRename,
  getTokenAssetDeleteCompletion
} from "../lib/campaign";
import { updatePlayerSceneIfOpenInBackground } from "../lib/player-view";
import { getTokenAssetDeleteDialogState } from "../lib/tokens";
import type { SceneNameDialog, TokenAssetDeleteDialog } from "../views/GmDialogs";

interface UseSavedProjectDialogActionsOptions {
  activeScene: Scene | null;
  campaign: Campaign | null;
  campaignDirty: boolean;
  campaignPath: string | null;
  newSceneName: string;
  playerSceneId: string | null;
  playerViewSyncOptions: { showPlayerSeatIndicators: boolean };
  sceneDialog: SceneNameDialog | null;
  sceneDrafts: Record<string, Scene>;
  selectedTokenIds: readonly string[];
  tokenAssetToDelete: TokenAssetDeleteDialog | null;
  applySummary: (summary: CampaignSummary, preserveCampaignDraft?: boolean) => void;
  run: (task: () => Promise<void>) => Promise<unknown>;
  selectTokens: (tokenIds: string[]) => void;
  setActiveScene: Dispatch<SetStateAction<Scene | null>>;
  setSceneClean: (scene: Scene) => void;
  setSceneDialog: Dispatch<SetStateAction<SceneNameDialog | null>>;
  setSceneDrafts: Dispatch<SetStateAction<Record<string, Scene>>>;
  setTokenAssetToDelete: Dispatch<SetStateAction<TokenAssetDeleteDialog | null>>;
}

export function useSavedProjectDialogActions({
  activeScene,
  campaign,
  campaignDirty,
  campaignPath,
  newSceneName,
  playerSceneId,
  playerViewSyncOptions,
  sceneDialog,
  sceneDrafts,
  selectedTokenIds,
  tokenAssetToDelete,
  applySummary,
  run,
  selectTokens,
  setActiveScene,
  setSceneClean,
  setSceneDialog,
  setSceneDrafts,
  setTokenAssetToDelete
}: UseSavedProjectDialogActionsOptions) {
  return {
    openDeleteTokenAssetDialog: (asset: Asset) =>
      run(async () => {
        if (!campaignPath || !campaign) {
          return;
        }
        const savedUsage = await window.localVtt.getTokenAssetUsage(campaignPath, asset.id);
        setTokenAssetToDelete(getTokenAssetDeleteDialogState(asset, savedUsage, campaign, sceneDrafts, activeScene));
      }),
    confirmDeleteTokenAsset: () =>
      run(async () => {
        if (!campaignPath || !tokenAssetToDelete) {
          return;
        }
        const deletedAssetId = tokenAssetToDelete.asset.id;
        const result = await window.localVtt.deleteTokenAsset(campaignPath, deletedAssetId);
        applySummary(result.campaignSummary, campaignDirty);
        const completion = getTokenAssetDeleteCompletion({
          sceneDrafts,
          activeScene,
          changedScenes: result.scenes,
          deletedAssetId,
          selectedTokenIds,
          playerSceneId
        });
        setSceneDrafts(completion.sceneDrafts);
        if (completion.activeScene) {
          setActiveScene(completion.activeScene);
        }
        if (completion.playerSyncScene) {
          updatePlayerSceneIfOpenInBackground(window.localVtt, result.campaignSummary.campaign, completion.playerSyncScene, playerViewSyncOptions);
        }
        selectTokens(completion.selectedTokenIds);
        setTokenAssetToDelete(null);
      }),
    submitSceneName: () =>
      run(async () => {
        if (!campaignPath || !sceneDialog) {
          return;
        }
        const name = newSceneName.trim();
        if (!name) {
          return;
        }

        if (sceneDialog.mode === "create") {
          const result = await window.localVtt.createScene(campaignPath, name);
          applySummary(result.campaignSummary, campaignDirty);
          setActiveScene(result.scene);
          setSceneClean(result.scene);
        } else {
          const result = await window.localVtt.renameScene(campaignPath, sceneDialog.sceneId, name);
          applySummary(result.campaignSummary, campaignDirty);
          setSceneDrafts((drafts) => getSceneDraftsAfterSceneRename(drafts, sceneDialog.sceneId, name));
          setActiveScene((scene) => getActiveSceneAfterSceneRename(scene, sceneDialog.sceneId, name, result.scene));
        }
        setSceneDialog(null);
      })
  };
}
