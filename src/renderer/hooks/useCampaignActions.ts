import type { Asset, CampaignSummary, Scene } from "../../shared/localvtt";
import {
  applyMapAssetToCampaign,
  getDuplicateSceneName,
  getDirtySceneIdsInFolder,
  getSceneDraftToSave,
  moveSceneEntryToFolder,
  removeDirtySceneId,
  removeFolderFromCampaign,
  removeSceneDraft
} from "../lib/campaignActions";
import type { useCampaignWorkspace } from "./useCampaignWorkspace";

type CampaignWorkspace = ReturnType<typeof useCampaignWorkspace>;

interface UseCampaignActionsOptions {
  workspace: CampaignWorkspace;
  mapAssetToDelete: Asset | null;
  onResetSceneLibraryUi: () => void;
  onCloseSceneMenu: () => void;
  onCloseFolderMenu: () => void;
  onMapAssetDeleteHandled: () => void;
  onSceneDeleteHandled: () => void;
  onFolderDeleteHandled: () => void;
}

export function useCampaignActions({
  workspace,
  mapAssetToDelete,
  onResetSceneLibraryUi,
  onCloseSceneMenu,
  onCloseFolderMenu,
  onMapAssetDeleteHandled,
  onSceneDeleteHandled,
  onFolderDeleteHandled
}: UseCampaignActionsOptions) {
  const {
    campaignPath,
    setCampaignPath,
    campaign,
    setCampaign,
    setMissingAssets,
    activeScene,
    setActiveScene,
    sceneDrafts,
    setSceneDrafts,
    dirtySceneIds,
    setDirtySceneIds,
    campaignDirty,
    setCampaignDirty,
    hasUnsavedChanges,
    run,
    applySummary,
    clearWorkspaceState,
    setSceneClean,
    updateScene,
    updateCampaignDraft,
    setSaveState
  } = workspace;

  const createCampaign = () =>
    run(async () => {
      const summary = await window.localVtt.createCampaign();
      if (summary) {
        applySummary(summary);
        clearWorkspaceState();
        onResetSceneLibraryUi();
      }
    });

  const openCampaign = () =>
    run(async () => {
      const summary = await window.localVtt.openCampaign();
      if (summary) {
        applySummary(summary);
        clearWorkspaceState();
        onResetSceneLibraryUi();
      }
    });

  const loadScene = (sceneId: string) =>
    run(async () => {
      if (!campaignPath) {
        return;
      }
      onCloseSceneMenu();
      const draft = sceneDrafts[sceneId];
      setActiveScene(draft ?? (await window.localVtt.loadScene(campaignPath, sceneId)));
    });

  const moveSceneToFolder = (sceneId: string, folderId?: string) => {
    if (!campaign) {
      return;
    }
    updateCampaignDraft(moveSceneEntryToFolder(campaign, sceneId, folderId, new Date().toISOString()));
  };

  const saveSceneById = async (sceneId: string) => {
    const ok = await run(async () => {
      if (!campaignPath) {
        return;
      }
      const sceneToSave = getSceneDraftToSave(sceneId, sceneDrafts, activeScene);
      if (!sceneToSave || !dirtySceneIds.has(sceneId)) {
        return;
      }

      setSaveState("saving");
      const result = await window.localVtt.saveScene(campaignPath, sceneToSave);
      applySummary(result.campaignSummary, campaignDirty);
      if (activeScene?.id === sceneId) {
        setActiveScene(result.scene);
      }
      setSceneClean(result.scene);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1500);
    });
    if (!ok) {
      setSaveState("error");
    }
  };

  const saveCampaign = async () => {
    const ok = await run(async () => {
      if (!campaignPath || !campaign || !hasUnsavedChanges) {
        return;
      }

      setSaveState("saving");
      let latestSummary: CampaignSummary | null = null;
      if (campaignDirty) {
        latestSummary = await window.localVtt.saveCampaign(campaignPath, campaign);
      }
      for (const sceneId of dirtySceneIds) {
        const scene = getSceneDraftToSave(sceneId, sceneDrafts, activeScene);
        if (scene) {
          const result = await window.localVtt.saveScene(campaignPath, scene);
          latestSummary = result.campaignSummary;
          if (activeScene?.id === sceneId) {
            setActiveScene(result.scene);
          }
        }
      }
      if (latestSummary) {
        applySummary(latestSummary);
      }
      setSceneDrafts({});
      setDirtySceneIds(new Set());
      setCampaignDirty(false);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1500);
    });
    if (!ok) {
      setSaveState("error");
    }
    return ok;
  };

  const importMap = () =>
    run(async () => {
      if (!campaignPath || !campaign || !activeScene) {
        return;
      }
      const result = await window.localVtt.importMap(campaignPath);
      if (!result) {
        return;
      }
      const nextCampaign = applyMapAssetToCampaign(
        result.campaignSummary.campaign,
        campaign,
        campaignDirty,
        activeScene.id,
        result.asset.id
      );
      setCampaignPath(result.campaignSummary.campaignPath);
      setMissingAssets(result.campaignSummary.missingAssets);
      setCampaign(nextCampaign);
      updateScene({ ...activeScene, mapAssetId: result.asset.id, updatedAt: new Date().toISOString() }, nextCampaign);
    });

  const confirmDeleteMapAsset = () =>
    run(async () => {
      if (!campaignPath || !activeScene || !mapAssetToDelete) {
        return;
      }
      const wasDirty = dirtySceneIds.has(activeScene.id);
      const result = await window.localVtt.deleteMapAsset(campaignPath, activeScene.id, mapAssetToDelete.id);
      applySummary(result.campaignSummary, campaignDirty);
      const updatedActiveScene = { ...activeScene, mapAssetId: undefined, updatedAt: new Date().toISOString() };
      setActiveScene(wasDirty ? updatedActiveScene : result.scene);
      if (wasDirty) {
        setSceneDrafts((drafts) => ({ ...drafts, [updatedActiveScene.id]: updatedActiveScene }));
        setDirtySceneIds((ids) => new Set(ids).add(updatedActiveScene.id));
      } else {
        setSceneClean(result.scene);
      }
      onMapAssetDeleteHandled();
    });

  const saveFolderScenes = async (folderId: string) => {
    if (!campaign) {
      return;
    }
    for (const sceneId of getDirtySceneIdsInFolder(campaign, dirtySceneIds, folderId)) {
      await saveSceneById(sceneId);
    }
  };

  const duplicateScene = (scene: Scene | { id: string } | null) =>
    run(async () => {
      if (!campaignPath || !campaign || !scene) {
        return;
      }
      const sourceEntry = campaign.scenes.find((entry) => entry.id === scene.id);
      if (!sourceEntry) {
        return;
      }
      onCloseSceneMenu();
      const sourceScene = getSceneDraftToSave(sourceEntry.id, sceneDrafts, activeScene) ?? (await window.localVtt.loadScene(campaignPath, sourceEntry.id));
      const duplicateName = getDuplicateSceneName(sourceEntry.name, campaign);
      const result = await window.localVtt.duplicateScene(campaignPath, sourceScene, duplicateName, sourceEntry.id, sourceEntry.folderId);
      applySummary(result.campaignSummary, campaignDirty);
      setActiveScene(result.scene);
      setSceneClean(result.scene);
    });

  const deleteScene = (scene: Scene | { id: string } | null) =>
    run(async () => {
      if (!campaignPath || !scene) {
        return;
      }
      const deletedSceneId = scene.id;
      const summary = await window.localVtt.deleteScene(campaignPath, deletedSceneId);
      applySummary(summary, campaignDirty);
      setSceneDrafts((drafts) => removeSceneDraft(drafts, deletedSceneId));
      setDirtySceneIds((ids) => removeDirtySceneId(ids, deletedSceneId));
      if (activeScene?.id === deletedSceneId) {
        setActiveScene(null);
      }
      onSceneDeleteHandled();
      onCloseSceneMenu();
    });

  const deleteFolder = (folder: { id: string } | null) => {
    if (!campaign || !folder) {
      return;
    }
    updateCampaignDraft(removeFolderFromCampaign(campaign, folder.id, new Date().toISOString()));
    onFolderDeleteHandled();
    onCloseFolderMenu();
  };

  return {
    createCampaign,
    openCampaign,
    loadScene,
    moveSceneToFolder,
    saveSceneById,
    saveCampaign,
    importMap,
    confirmDeleteMapAsset,
    saveFolderScenes,
    duplicateScene,
    deleteScene,
    deleteFolder
  };
}
