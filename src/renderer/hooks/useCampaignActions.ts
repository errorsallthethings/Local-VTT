import type {
  Asset,
  AssetPruneResult,
  Campaign,
  CampaignSummary,
  MetadataBackupRestoreResult,
  PlayerSceneProjectionOptions,
  Scene,
  ThumbnailRegenerationResult,
  TokenAssetPromotionResult
} from "../../shared/localvtt";
import {
  applyMapAssetToCampaign,
  getDuplicateFolderName,
  getDuplicateSceneName,
  getDirtySceneIdsInFolder,
  getCampaignMaintenanceInitialBusyState,
  getMapAssetDeleteSceneUpdate,
  getThumbnailRegenerationBusyState,
  completeCampaignMaintenance,
  openSavedCampaignHealth,
  getSceneDraftToSave,
  insertSceneFolderAfterSource,
  moveSceneEntry,
  removeDirtySceneId,
  removeFolderFromCampaign,
  removeSceneDraft,
  runSavedCampaignMaintenance,
  type CampaignBusyState
} from "../lib/campaign";
import { showPlayerBlackout, updatePlayerSceneIfOpenInBackground } from "../lib/player-view";
import { stopActiveTurnOrder } from "../lib/turn-order";
import type { useCampaignWorkspace } from "./useCampaignWorkspace";

type CampaignWorkspace = ReturnType<typeof useCampaignWorkspace>;

export function getPlayerSyncCampaignForScene(campaign: Campaign, sceneId: string, shouldSyncSceneToPlayer: (sceneId: string) => boolean): Campaign | null {
  return shouldSyncSceneToPlayer(sceneId) ? campaign : null;
}

interface UseCampaignActionsOptions {
  workspace: CampaignWorkspace;
  mapAssetToDelete: Asset | null;
  onMapReplacementPreview: (preview: MapReplacementPreview) => void;
  onMapReplacementHandled: () => void;
  onBusyChange: (busyState: CampaignBusyState | null) => void;
  onResetSceneLibraryUi: () => void;
  onCloseSceneMenu: () => void;
  onCloseFolderMenu: () => void;
  onCampaignOpened: (summary: CampaignSummary) => void;
  onMapAssetDeleteHandled: () => void;
  onSceneDeleteHandled: () => void;
  onFolderDeleteHandled: () => void;
  onThumbnailRegenerationComplete: (result: ThumbnailRegenerationResult) => void;
  onTokenAssetPromotionComplete: (result: TokenAssetPromotionResult) => void;
  onAssetPruneComplete: (result: AssetPruneResult) => void;
  onCampaignHealthOpen: () => void;
  onMetadataRestoreOpen: () => void;
  onMetadataRestoreClosed: () => void;
  shouldSyncSceneToPlayer: (sceneId: string) => boolean;
  playerViewSyncOptions?: PlayerSceneProjectionOptions;
}

export type { CampaignBusyState };

export interface MapReplacementPreview {
  currentAssetId: string;
  replacementId: string;
  sourceName: string;
  currentAssetName: string;
  currentDimensions?: { width: number; height: number };
  nextDimensions?: { width: number; height: number };
  warning?: string;
}

export function useCampaignActions({
  workspace,
  mapAssetToDelete,
  onMapReplacementPreview,
  onMapReplacementHandled,
  onBusyChange,
  onResetSceneLibraryUi,
  onCloseSceneMenu,
  onCloseFolderMenu,
  onCampaignOpened,
  onMapAssetDeleteHandled,
  onSceneDeleteHandled,
  onFolderDeleteHandled,
  onThumbnailRegenerationComplete,
  onTokenAssetPromotionComplete,
  onAssetPruneComplete,
  onCampaignHealthOpen,
  onMetadataRestoreOpen,
  onMetadataRestoreClosed,
  shouldSyncSceneToPlayer,
  playerViewSyncOptions = {}
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
    setSaveState,
    setError
  } = workspace;

  const createCampaign = () =>
    run(async () => {
      const summary = await window.localVtt.createCampaign();
      if (summary) {
        applySummary(summary);
        clearWorkspaceState();
        onResetSceneLibraryUi();
        onCampaignOpened(summary);
      }
    });

  const openCampaign = () =>
    run(async () => {
      const summary = await window.localVtt.openCampaign();
      if (summary) {
        applySummary(summary);
        clearWorkspaceState();
        onResetSceneLibraryUi();
        onCampaignOpened(summary);
      }
    });

  const openRecentCampaign = (campaignPath: string) =>
    run(async () => {
      const summary = await window.localVtt.openRecentCampaign(campaignPath);
      applySummary(summary);
      clearWorkspaceState();
      onResetSceneLibraryUi();
      onCampaignOpened(summary);
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

  const moveScene = (sceneId: string, target: { folderId?: string; beforeSceneId?: string; afterSceneId?: string }) => {
    if (!campaign) {
      return;
    }
    updateCampaignDraft(moveSceneEntry(campaign, sceneId, target, new Date().toISOString()), null);
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

  const saveCampaignBeforeClose = async () => {
    const ok = await run(async () => {
      if (!campaignPath || !campaign) {
        return;
      }

      setSaveState("saving");
      let latestSummary: CampaignSummary | null = null;
      const scenesToSave = new Map<string, Scene>();
      for (const sceneEntry of campaign.scenes) {
        const localScene = getSceneDraftToSave(sceneEntry.id, sceneDrafts, activeScene);
        if (localScene) {
          const stoppedScene = stopActiveTurnOrder(localScene, new Date().toISOString());
          if (dirtySceneIds.has(sceneEntry.id) || stoppedScene !== localScene) {
            scenesToSave.set(sceneEntry.id, stoppedScene);
          }
          continue;
        }

        const savedScene = await window.localVtt.loadScene(campaignPath, sceneEntry.id);
        const stoppedScene = stopActiveTurnOrder(savedScene, new Date().toISOString());
        if (stoppedScene !== savedScene) {
          scenesToSave.set(sceneEntry.id, stoppedScene);
        }
      }

      if (campaignDirty) {
        latestSummary = await window.localVtt.saveCampaign(campaignPath, campaign);
      }
      for (const [sceneId, scene] of scenesToSave) {
        const result = await window.localVtt.saveScene(campaignPath, scene);
        latestSummary = result.campaignSummary;
        if (activeScene?.id === sceneId) {
          setActiveScene(result.scene);
        }
      }
      if (latestSummary) {
        applySummary(latestSummary);
      }
      setSceneDrafts({});
      setDirtySceneIds(new Set());
      setCampaignDirty(false);
      setSaveState("saved");
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
      const nextScene = { ...activeScene, mapAssetId: result.asset.id, updatedAt: new Date().toISOString() };
      updateScene(nextScene, getPlayerSyncCampaignForScene(nextCampaign, nextScene.id, shouldSyncSceneToPlayer));
    });

  const commitMapReplacement = (preview: MapReplacementPreview) =>
    run(async () => {
      if (!campaignPath || !campaign || !activeScene) {
        return;
      }
      const result = await window.localVtt.replaceMap(campaignPath, activeScene.id, preview.currentAssetId, preview.replacementId);
      applySummary(result.campaignSummary);
      setActiveScene(result.scene);
      setSceneClean(result.scene);
      setError(null);
      onMapReplacementHandled();
      const syncCampaign = getPlayerSyncCampaignForScene(result.campaignSummary.campaign, result.scene.id, shouldSyncSceneToPlayer);
      if (syncCampaign) {
        updatePlayerSceneIfOpenInBackground(window.localVtt, syncCampaign, result.scene, playerViewSyncOptions);
      }
    });

  const replaceMap = (asset: Asset) =>
    run(async () => {
      if (!campaignPath || !campaign || !activeScene) {
        return;
      }
      if (hasUnsavedChanges) {
        const saved = await saveCampaign();
        if (!saved) {
          return;
        }
      }
      const preview = await window.localVtt.previewMapReplacement(campaignPath, activeScene.id, asset.id);
      if (!preview) {
        return;
      }
      const nextPreview = { ...preview, currentAssetId: asset.id };
      if (nextPreview.warning) {
        onMapReplacementPreview(nextPreview);
        return;
      }
      await commitMapReplacement(nextPreview);
    });

  const regenerateThumbnails = () =>
    run(async () => {
      await runSavedCampaignMaintenance({
        campaignPath,
        campaignAvailable: Boolean(campaign),
        hasUnsavedChanges,
        initialBusyState: getCampaignMaintenanceInitialBusyState("thumbnail-regeneration"),
        onBusyChange,
        saveCampaign,
        subscribeProgress: () => window.localVtt.onThumbnailRegenerationProgress((progress) => onBusyChange(getThumbnailRegenerationBusyState(progress))),
        runOperation: (path) => window.localVtt.regenerateThumbnails(path),
        onComplete: (result) =>
          completeCampaignMaintenance({ result, applySummary, setCampaignDirty, setError, onComplete: onThumbnailRegenerationComplete })
      });
    });

  const promoteTokenAssets = () =>
    run(async () => {
      await runSavedCampaignMaintenance({
        campaignPath,
        campaignAvailable: Boolean(campaign),
        hasUnsavedChanges,
        initialBusyState: getCampaignMaintenanceInitialBusyState("token-asset-promotion"),
        onBusyChange,
        saveCampaign,
        runOperation: (path) => window.localVtt.promoteTokenAssets(path),
        onComplete: (result) =>
          completeCampaignMaintenance({ result, applySummary, setCampaignDirty, setError, onComplete: onTokenAssetPromotionComplete })
      });
    });

  const pruneUnreferencedAssets = () =>
    run(async () => {
      await runSavedCampaignMaintenance({
        campaignPath,
        campaignAvailable: Boolean(campaign),
        hasUnsavedChanges,
        initialBusyState: getCampaignMaintenanceInitialBusyState("unreferenced-asset-pruning"),
        onBusyChange,
        saveCampaign,
        runOperation: (path) => window.localVtt.pruneUnreferencedAssets(path),
        onComplete: (result) => completeCampaignMaintenance({ result, applySummary, setCampaignDirty, setError, onComplete: onAssetPruneComplete })
      });
    });

  const openCampaignHealthDialog = () =>
    run(async () => {
      await openSavedCampaignHealth({
        campaignPath,
        campaignAvailable: Boolean(campaign),
        hasUnsavedChanges,
        saveCampaign,
        refreshCampaign: (path) => window.localVtt.refreshCampaign(path),
        applySummary: (summary) => applySummary(summary, false),
        onOpen: onCampaignHealthOpen
      });
    });

  const openBackupsFolder = () =>
    run(async () => {
      if (!campaignPath) {
        return;
      }
      await window.localVtt.openBackupsFolder(campaignPath);
    });

  const openMetadataRestoreDialog = () => {
    if (!campaignPath) {
      return;
    }
    onMetadataRestoreOpen();
  };

  const handleMetadataRestore = (result: MetadataBackupRestoreResult) => {
    applySummary(result.campaignSummary, false);
    setCampaignDirty(false);
    if (result.scene) {
      setActiveScene(result.scene);
      setSceneClean(result.scene);
    } else {
      setActiveScene(null);
      setSceneDrafts({});
      setDirtySceneIds(new Set());
    }
    onMetadataRestoreClosed();
    void showPlayerBlackout();
  };

  const confirmDeleteMapAsset = () =>
    run(async () => {
      if (!campaignPath || !activeScene || !mapAssetToDelete) {
        return;
      }
      const wasDirty = dirtySceneIds.has(activeScene.id);
      const result = await window.localVtt.deleteMapAsset(campaignPath, activeScene.id, mapAssetToDelete.id);
      applySummary(result.campaignSummary, campaignDirty);
      const sceneUpdate = getMapAssetDeleteSceneUpdate(activeScene, result.scene, wasDirty, new Date().toISOString());
      setActiveScene(sceneUpdate.activeScene);
      const draftScene = sceneUpdate.draftScene;
      if (draftScene) {
        setSceneDrafts((drafts) => ({ ...drafts, [draftScene.id]: draftScene }));
        setDirtySceneIds((ids) => new Set(ids).add(draftScene.id));
      }
      if (sceneUpdate.cleanScene) {
        setSceneClean(sceneUpdate.cleanScene);
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

  const duplicateFolder = (folder: { id: string; name: string; color: string } | null) =>
    run(async () => {
      if (!campaignPath || !campaign || !folder) {
        return;
      }
      try {
        onCloseFolderMenu();
        const sourceScenes = campaign.scenes.filter((scene) => scene.folderId === folder.id);
        const now = new Date().toISOString();
        const duplicateFolderId = crypto.randomUUID();
        const duplicateFolderName = getDuplicateFolderName(folder.name, campaign);
        const campaignWithFolder = insertSceneFolderAfterSource(
          campaign,
          folder.id,
          {
            id: duplicateFolderId,
            name: duplicateFolderName,
            color: folder.color,
            createdAt: now
          },
          now
        );

        onBusyChange({
          title: "Duplicating Folder",
          message: sourceScenes.length > 0 ? `Preparing ${duplicateFolderName}...` : `Creating ${duplicateFolderName}...`,
          current: 0,
          total: sourceScenes.length
        });

        let latestSummary = await window.localVtt.saveCampaign(campaignPath, campaignWithFolder);
        let workingCampaign = latestSummary.campaign;
        let insertAfterSceneId = sourceScenes[sourceScenes.length - 1]?.id;
        let firstDuplicateScene: Scene | null = null;

        for (const [index, sourceEntry] of sourceScenes.entries()) {
          onBusyChange({
            title: "Duplicating Folder",
            message: `Duplicating ${sourceEntry.name}...`,
            current: index,
            total: sourceScenes.length
          });
          const sourceScene = getSceneDraftToSave(sourceEntry.id, sceneDrafts, activeScene) ?? (await window.localVtt.loadScene(campaignPath, sourceEntry.id));
          const duplicateName = getDuplicateSceneName(sourceEntry.name, workingCampaign);
          const result = await window.localVtt.duplicateScene(
            campaignPath,
            sourceScene,
            duplicateName,
            insertAfterSceneId ?? sourceEntry.id,
            duplicateFolderId
          );
          latestSummary = result.campaignSummary;
          workingCampaign = result.campaignSummary.campaign;
          insertAfterSceneId = result.scene.id;
          firstDuplicateScene ??= result.scene;
          onBusyChange({
            title: "Duplicating Folder",
            message: `Duplicated ${index + 1} of ${sourceScenes.length} scenes.`,
            current: index + 1,
            total: sourceScenes.length
          });
        }

        applySummary(latestSummary);
        setCampaignDirty(false);
        if (firstDuplicateScene) {
          setActiveScene(firstDuplicateScene);
          setSceneClean(firstDuplicateScene);
        }
      } finally {
        onBusyChange(null);
      }
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
    updateCampaignDraft(removeFolderFromCampaign(campaign, folder.id, new Date().toISOString()), null);
    onFolderDeleteHandled();
    onCloseFolderMenu();
  };

  return {
    createCampaign,
    openCampaign,
    openRecentCampaign,
    loadScene,
    moveScene,
    saveSceneById,
    saveCampaign,
    saveCampaignBeforeClose,
    importMap,
    replaceMap,
    commitMapReplacement,
    regenerateThumbnails,
    promoteTokenAssets,
    pruneUnreferencedAssets,
    openCampaignHealthDialog,
    openBackupsFolder,
    openMetadataRestoreDialog,
    handleMetadataRestore,
    confirmDeleteMapAsset,
    saveFolderScenes,
    duplicateScene,
    duplicateFolder,
    deleteScene,
    deleteFolder
  };
}
