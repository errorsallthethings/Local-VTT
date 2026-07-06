import type { Dispatch, SetStateAction } from "react";
import type { Asset, Campaign, CampaignSceneEntry, CampaignSceneFolder, FogSettings, GridSettings, Scene } from "../../shared/localvtt";
import {
  getCreateSceneFolderNameDialogState,
  getCreateSceneNameDialogState,
  getRenameSceneFolderNameDialogState,
  getRenameSceneNameDialogState,
  moveSceneFolder,
  renameCampaign,
  renameCampaignTokenAsset,
  setSceneFolderColor,
  submitSceneFolderName
} from "../lib/campaign";
import {
  applySceneColorDialog,
  getSceneColorDialogState,
  getSceneItemRenameName,
  getTokenColorDialogState,
  renameEnvironmentEffect,
  renameFogShape,
  renameSceneToken,
  setSceneTokenColor
} from "../lib/scene";
import { getTokenAssetRenameDialogState } from "../lib/tokens";
import type {
  GmDialogDraftSetters,
  GmDialogDraftValues
} from "./useGmDialogDraftState";
import type {
  EnvironmentEffectNameDialog,
  FogShapeNameDialog,
  FolderColorDialog,
  FolderNameDialog,
  SceneColorDialog,
  SceneNameDialog,
  TokenAssetNameDialog,
  TokenColorDialog,
  TokenNameDialog
} from "../views/GmDialogs";

interface UseGmDialogActionsOptions extends GmDialogDraftValues, GmDialogDraftSetters {
  activeScene: Scene | null;
  campaign: Campaign | null;
  environmentEffectDialog: EnvironmentEffectNameDialog | null;
  fogShapeDialog: FogShapeNameDialog | null;
  folderColorDialog: FolderColorDialog | null;
  folderDialog: FolderNameDialog | null;
  sceneColorDialog: SceneColorDialog | null;
  tokenAssetDialog: TokenAssetNameDialog | null;
  tokenColorDialog: TokenColorDialog | null;
  tokenDialog: TokenNameDialog | null;
  setCampaignNameDialogOpen: (open: boolean) => void;
  setEnvironmentEffectDialog: Dispatch<SetStateAction<EnvironmentEffectNameDialog | null>>;
  setFolderColorDialog: Dispatch<SetStateAction<FolderColorDialog | null>>;
  setFolderDialog: Dispatch<SetStateAction<FolderNameDialog | null>>;
  setFogShapeDialog: Dispatch<SetStateAction<FogShapeNameDialog | null>>;
  setOpenFolderMenuId: (folderId: string | null) => void;
  setOpenSceneMenuId: (sceneId: string | null) => void;
  setSceneColorDialog: Dispatch<SetStateAction<SceneColorDialog | null>>;
  setSceneDialog: Dispatch<SetStateAction<SceneNameDialog | null>>;
  setTokenAssetDialog: Dispatch<SetStateAction<TokenAssetNameDialog | null>>;
  setTokenColorDialog: Dispatch<SetStateAction<TokenColorDialog | null>>;
  setTokenDialog: Dispatch<SetStateAction<TokenNameDialog | null>>;
  updateCampaignDraft: (nextCampaign: Campaign, syncActiveSceneToPlayer?: boolean) => void;
  updateFog: (patch: Partial<FogSettings>) => void;
  updateGrid: (patch: Partial<GridSettings>) => void;
  updateScene: (nextScene: Scene) => void;
  createId?: () => string;
  getNow?: () => string;
}

export function useGmDialogActions({
  activeScene,
  campaign,
  environmentEffectDialog,
  fogShapeDialog,
  folderColorDialog,
  folderDialog,
  newCampaignName,
  newEnvironmentEffectName,
  newFogShapeName,
  newFolderColor,
  newFolderName,
  newTokenBorderColor,
  newTokenName,
  sceneColorDialog,
  tokenAssetDialog,
  tokenColorDialog,
  tokenDialog,
  setCampaignNameDialogOpen,
  setEnvironmentEffectDialog,
  setFolderColorDialog,
  setFolderDialog,
  setFogShapeDialog,
  setNewCampaignName,
  setNewEnvironmentEffectName,
  setNewFogShapeName,
  setNewFolderColor,
  setNewFolderName,
  setNewSceneName,
  setNewTokenBorderColor,
  setNewTokenName,
  setOpenFolderMenuId,
  setOpenSceneMenuId,
  setSceneColorDialog,
  setSceneDialog,
  setTokenAssetDialog,
  setTokenColorDialog,
  setTokenDialog,
  updateCampaignDraft,
  updateFog,
  updateGrid,
  updateScene,
  createId = () => crypto.randomUUID(),
  getNow = () => new Date().toISOString()
}: UseGmDialogActionsOptions) {
  return {
    openSceneDialog: () => {
      const state = getCreateSceneNameDialogState();
      setNewSceneName(state.name);
      setSceneDialog(state.dialog);
    },
    openFolderDialog: () => {
      const state = getCreateSceneFolderNameDialogState();
      setNewFolderName(state.name);
      setFolderDialog(state.dialog);
    },
    openRenameDialog: (scene: CampaignSceneEntry) => {
      const state = getRenameSceneNameDialogState(scene);
      setOpenSceneMenuId(null);
      setNewSceneName(state.name);
      setSceneDialog(state.dialog);
    },
    openRenameFolderDialog: (folder: CampaignSceneFolder) => {
      const state = getRenameSceneFolderNameDialogState(folder);
      setOpenFolderMenuId(null);
      setNewFolderName(state.name);
      setFolderDialog(state.dialog);
    },
    openRenameFogShapeDialog: (shapeId: string, fallbackName: string) => {
      setNewFogShapeName(getSceneItemRenameName(activeScene, "fog-shape", shapeId, fallbackName));
      setFogShapeDialog({ shapeId });
    },
    openRenameEnvironmentEffectDialog: (effectId: string, fallbackName: string) => {
      setNewEnvironmentEffectName(getSceneItemRenameName(activeScene, "environment-effect", effectId, fallbackName));
      setEnvironmentEffectDialog({ effectId });
    },
    openRenameTokenDialog: (tokenId: string, fallbackName: string) => {
      setNewTokenName(getSceneItemRenameName(activeScene, "token", tokenId, fallbackName));
      setTokenDialog({ tokenId });
    },
    openRenameTokenAssetDialog: (asset: Asset) => {
      const dialog = getTokenAssetRenameDialogState(asset);
      setNewTokenName(dialog.name);
      setTokenAssetDialog({ assetId: dialog.assetId });
    },
    openFolderColorDialog: (folder: CampaignSceneFolder) => {
      setOpenFolderMenuId(null);
      setNewFolderColor(folder.color);
      setFolderColorDialog({ folderId: folder.id, folderName: folder.name });
    },
    submitFolderName: () => {
      if (!campaign || !folderDialog) {
        return;
      }
      const nextCampaign = submitSceneFolderName(
        campaign,
        folderDialog.mode === "create"
          ? { mode: "create", folderId: createId(), name: newFolderName }
          : { mode: "rename", folderId: folderDialog.folderId, name: newFolderName },
        getNow()
      );
      if (!nextCampaign) {
        return;
      }
      updateCampaignDraft(nextCampaign);
      setFolderDialog(null);
    },
    submitFogShapeName: () => {
      if (!activeScene || !fogShapeDialog) {
        return;
      }
      const nextScene = renameFogShape(activeScene, fogShapeDialog.shapeId, newFogShapeName);
      if (!nextScene) {
        return;
      }
      updateScene(nextScene);
      setFogShapeDialog(null);
    },
    submitEnvironmentEffectName: () => {
      if (!activeScene || !environmentEffectDialog) {
        return;
      }
      const nextScene = renameEnvironmentEffect(activeScene, environmentEffectDialog.effectId, newEnvironmentEffectName);
      if (!nextScene) {
        return;
      }
      updateScene(nextScene);
      setEnvironmentEffectDialog(null);
    },
    submitTokenName: () => {
      if (!activeScene || !tokenDialog) {
        return;
      }
      const nextScene = renameSceneToken(activeScene, tokenDialog.tokenId, newTokenName);
      if (!nextScene) {
        return;
      }
      updateScene(nextScene);
      setTokenDialog(null);
    },
    submitTokenAssetName: () => {
      if (!campaign || !tokenAssetDialog) {
        return;
      }
      const nextCampaign = renameCampaignTokenAsset(campaign, tokenAssetDialog.assetId, newTokenName, getNow());
      if (!nextCampaign) {
        return;
      }
      updateCampaignDraft(nextCampaign);
      setTokenAssetDialog(null);
    },
    submitFolderColor: () => {
      if (!campaign || !folderColorDialog) {
        return;
      }
      updateCampaignDraft(setSceneFolderColor(campaign, folderColorDialog.folderId, newFolderColor, getNow()));
      setFolderColorDialog(null);
    },
    moveFolder: (folderId: string, direction: "up" | "down") => {
      if (!campaign) {
        return;
      }
      updateCampaignDraft(moveSceneFolder(campaign, folderId, direction, getNow()), false);
      setOpenFolderMenuId(null);
    },
    openSceneColorDialog: (kind: SceneColorDialog["kind"]) => {
      if (!activeScene) {
        return;
      }
      setSceneColorDialog(getSceneColorDialogState(activeScene, kind));
    },
    openTokenColorDialog: (tokenId: string, value: string, kind: "border" | "glow") => {
      setNewTokenBorderColor(value);
      setTokenColorDialog(getTokenColorDialogState(activeScene, tokenId, value, kind));
    },
    updateSceneColorDraft: (value: string) => {
      setSceneColorDialog((dialog) => (dialog ? { ...dialog, value } : dialog));
    },
    submitSceneColor: () => {
      if (!sceneColorDialog) {
        return;
      }
      const colorPatch = applySceneColorDialog(sceneColorDialog);
      if (colorPatch.fogPatch) {
        updateFog(colorPatch.fogPatch);
      }
      if (colorPatch.gridPatch) {
        updateGrid(colorPatch.gridPatch);
      }
      setSceneColorDialog(null);
    },
    submitTokenBorderColor: () => {
      if (!activeScene || !tokenColorDialog) {
        return;
      }
      updateScene(setSceneTokenColor(activeScene, tokenColorDialog.tokenId, newTokenBorderColor, tokenColorDialog.kind));
      setTokenColorDialog(null);
    },
    openCampaignRenameDialog: () => {
      if (!campaign) {
        return;
      }
      setNewCampaignName(campaign.name);
      setCampaignNameDialogOpen(true);
    },
    submitCampaignName: () => {
      if (!campaign) {
        return;
      }
      const nextCampaign = renameCampaign(campaign, newCampaignName, getNow());
      if (!nextCampaign) {
        return;
      }
      updateCampaignDraft(nextCampaign);
      setCampaignNameDialogOpen(false);
    }
  };
}
