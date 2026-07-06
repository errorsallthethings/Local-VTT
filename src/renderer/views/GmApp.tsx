import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  DEFAULT_VIDEO_PLAYBACK,
} from "../../shared/localvtt";
import type {
  Campaign,
  DiceSettings,
  LiveTableEvent,
  Point,
  Scene,
} from "../../shared/localvtt";
import { SceneCanvas } from "../components/SceneCanvas";
import type { MapCalibrationBox } from "../components/settings/MapCalibrationAssistant";
import { ToolsMenu, type SelectorSelectionFilters } from "../components/tools";
import { getImageMapAssetPath } from "../lib/map";
import { TokenLibraryDrawer } from "../components/tokens/TokenLibraryDrawer";
import { TurnOrderModal } from "../components/turn-order/TurnOrderModal";
import { TurnOrderPanel } from "../components/turn-order/TurnOrderPanel";
import { VideoMapControls } from "../components/workspace/VideoMapControls";
import { WorkspaceTopbar } from "../components/workspace/WorkspaceTopbar";
import { useAvailableDisplays } from "../hooks/useAvailableDisplays";
import { useCampaignActions } from "../hooks/useCampaignActions";
import { useCampaignPlayerActions } from "../hooks/useCampaignPlayerActions";
import { createCampaignWorkflowActions } from "../hooks/campaignWorkflowActions";
import { useCampaignWorkspace } from "../hooks/useCampaignWorkspace";
import { useDiceActions } from "../hooks/useDiceActions";
import { useDismissableMenu } from "../hooks/useDismissableMenu";
import { useEnvironmentEffectActions } from "../hooks/useEnvironmentEffectActions";
import {
  useEnvironmentEffectTuning
} from "../hooks/useEnvironmentEffectTuning";
import { useGmDialogEscape, useGmDialogState } from "../hooks/useGmDialogState";
import { useGmDialogActions } from "../hooks/useGmDialogActions";
import { useGmDialogDraftState } from "../hooks/useGmDialogDraftState";
import { useGmCampaignAssets } from "../hooks/useGmCampaignAssets";
import { useGmMaintenanceState } from "../hooks/useGmMaintenanceState";
import { useGmToolOptions } from "../hooks/useGmToolOptions";
import { useGmToolSelection } from "../hooks/useGmToolSelection";
import { useGmWorkspaceShellActions } from "../hooks/useGmWorkspaceShellActions";
import { useMapCalibrationActions } from "../hooks/useMapCalibrationActions";
import { usePlayerDisplayActions } from "../hooks/usePlayerDisplayActions";
import { usePlayerViewActions } from "../hooks/usePlayerViewActions";
import { useSavedProjectDialogActions } from "../hooks/useSavedProjectDialogActions";
import { usePlayerViewState } from "../hooks/usePlayerViewState";
import { useSceneEditingActions } from "../hooks/useSceneEditingActions";
import { useSceneSelection } from "../hooks/useSceneSelection";
import { useSceneTokenTurnOrderActions } from "../hooks/useSceneTokenTurnOrderActions";
import { useTokenDefaultsActions } from "../hooks/useTokenDefaultsActions";
import { useTokenImportActions } from "../hooks/useTokenImportActions";
import { getEffectiveDiceSettings, loadDiceSettingsPreference } from "../lib/dice";
import { buildSceneSelectionIds } from "../lib/scene";
import { loadRecentCampaigns, type RecentCampaign } from "../lib/campaign";
import { getSelectedTokenAssetIds } from "../lib/tokens";
import {
  loadTokenLibraryHeight,
  loadWorkspaceLayout,
  type WorkspaceLayout
} from "../lib/workspace";
import { formatSaveStatus } from "../lib/workspace";
import { GmDialogs } from "./GmDialogs";
import { GmEnvironmentEffectEditor } from "./GmEnvironmentEffectEditor";
import { GmInspector } from "./GmInspector";
import { GmMaintenanceDialogs } from "./GmMaintenanceDialogs";
import { GmSidebar } from "./GmSidebar";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;

const DEFAULT_SELECTOR_SELECTION_FILTERS: SelectorSelectionFilters = {
  tokens: true,
  templates: false,
  fogMasks: false,
  weatherMasks: false,
  drawings: true
};

export function GmApp() {
  const [playersPanelOpen, setPlayersPanelOpen] = useState(false);
  const playerViewSyncOptions = useMemo(() => ({ showPlayerSeatIndicators: playersPanelOpen }), [playersPanelOpen]);
  const workspace = useCampaignWorkspace({ playerViewSyncOptions });
  const {
    campaignPath,
    campaign,
    missingAssets,
    campaignHealth,
    activeScene,
    setActiveScene,
    sceneDrafts,
    setSceneDrafts,
    dirtySceneIds,
    setDirtySceneIds,
    campaignDirty,
    saveState,
    error,
    setError,
    dirtyCount,
    hasUnsavedChanges,
    run,
    applySummary,
    setSceneClean,
    updateScene: updateWorkspaceScene,
    updateCampaignDraft: updateWorkspaceCampaignDraft
  } = workspace;
  const dialogs = useGmDialogState();
  const {
    sceneDialog,
    setSceneDialog,
    folderDialog,
    setFolderDialog,
    fogShapeDialog,
    setFogShapeDialog,
    environmentEffectDialog,
    setEnvironmentEffectDialog,
    tokenDialog,
    setTokenDialog,
    tokenCropDialog,
    setTokenCropDialog,
    tokenAssetDialog,
    setTokenAssetDialog,
    tokenDefaultsDialog,
    setTokenDefaultsDialog,
    tokenColorDialog,
    setTokenColorDialog,
    folderColorDialog,
    setFolderColorDialog,
    sceneColorDialog,
    setSceneColorDialog,
    campaignNameDialogOpen,
    setCampaignNameDialogOpen,
    sceneToDelete,
    setSceneToDelete,
    folderToDelete,
    setFolderToDelete,
    mapAssetToDelete,
    setMapAssetToDelete,
    tokenAssetToDelete,
    setTokenAssetToDelete,
    tableDisplayWizardOpen,
    setTableDisplayWizardOpen,
    playerDisplayDialogOpen,
    setPlayerDisplayDialogOpen,
    mapCalibrationAssistantOpen,
    setMapCalibrationAssistantOpen,
    confirmClearFogOpen,
    setConfirmClearFogOpen,
    mapCalibrationBoxPicking,
    setMapCalibrationBoxPicking
  } = dialogs;
  const [openSceneMenuId, setOpenSceneMenuId] = useState<string | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [playerMenuOpen, setPlayerMenuOpen] = useState(false);
  const maintenanceState = useGmMaintenanceState();
  const {
    activeCanvasTool,
    setActiveCanvasTool,
    activeDrawingTool,
    setActiveDrawingTool,
    activeFogTool,
    setActiveFogTool,
    activeWeatherMaskTool,
    setActiveWeatherMaskTool,
    activeEnvironmentEffectTool,
    setActiveEnvironmentEffectTool,
    mouseBehavior,
    setMouseBehavior,
    clearActiveCanvasTools
  } = useGmToolSelection();
  const {
    environmentEffectType,
    setEnvironmentEffectType,
    environmentEffectFeather,
    setEnvironmentEffectFeather,
    acidEffectTuning,
    setAcidEffectTuning,
    resetAcidEffectTuning,
    coldEffectTuning,
    setColdEffectTuning,
    resetColdEffectTuning,
    darknessEffectTuning,
    setDarknessEffectTuning,
    resetDarknessEffectTuning,
    poisonEffectTuning,
    setPoisonEffectTuning,
    resetPoisonEffectTuning,
    waterEffectTuning,
    setWaterEffectTuning,
    resetWaterEffectTuning,
    lavaEffectTuning,
    setLavaEffectTuning,
    resetLavaEffectTuning,
    fireEffectTuning,
    setFireEffectTuning,
    resetFireEffectTuning,
    lightningEffectTuning,
    setLightningEffectTuning,
    resetLightningEffectTuning,
    arcaneEffectTuning,
    setArcaneEffectTuning,
    resetArcaneEffectTuning,
    chaosEffectTuning,
    setChaosEffectTuning,
    resetChaosEffectTuning,
    voidEffectTuning,
    setVoidEffectTuning,
    resetVoidEffectTuning,
    natureEffectTuning,
    setNatureEffectTuning,
    resetNatureEffectTuning,
    distortionEffectTuning,
    setDistortionEffectTuning,
    resetDistortionEffectTuning,
    radiantEffectTuning,
    setRadiantEffectTuning,
    resetRadiantEffectTuning,
    forceFieldEffectTuning,
    setForceFieldEffectTuning,
    resetForceFieldEffectTuning,
    shockwaveEffectTuning,
    setShockwaveEffectTuning,
    resetShockwaveEffectTuning,
    smokeEffectTuning,
    setSmokeEffectTuning,
    resetSmokeEffectTuning,
    fogEffectTuning,
    setFogEffectTuning,
    resetFogEffectTuning
  } = useEnvironmentEffectTuning();
  const {
    tableToolsVisibleInPlayer,
    setTableToolsVisibleInPlayer,
    tableTools,
    setPingSize,
    setPingColor,
    setLaserThickness,
    setLaserColor,
    setRulerLinger,
    fogOperation,
    setFogOperation,
    fogBrushSize,
    setFogBrushSize,
    drawingColor,
    setDrawingColor,
    drawingOpacity,
    setDrawingOpacity,
    drawingFillColor,
    setDrawingFillColor,
    drawingFillOpacity,
    setDrawingFillOpacity,
    drawingStrokeStyle,
    setDrawingStrokeStyle,
    drawingStrokeWidth,
    setDrawingStrokeWidth,
    drawingTemplateSize,
    setDrawingTemplateSize,
    drawingTemplateEffect,
    setDrawingTemplateEffect,
    drawingTemplateWidth,
    setDrawingTemplateWidth,
    templatePreviewVisibleInPlayer,
    setTemplatePreviewVisibleInPlayer,
    playerTemplatePreviewDrawing,
    setPlayerTemplatePreviewDrawing
  } = useGmToolOptions();
  const dialogDrafts = useGmDialogDraftState();
  const [environmentEffectEditorPosition, setEnvironmentEffectEditorPosition] = useState<{ x: number; y: number } | null>(null);
  const [environmentEffectEditorSize, setEnvironmentEffectEditorSize] = useState<{ width: number; height: number } | null>(null);
  const [selectorSelectionFilters, setSelectorSelectionFilters] = useState<SelectorSelectionFilters>(DEFAULT_SELECTOR_SELECTION_FILTERS);
  const [mapCalibrationBox, setMapCalibrationBox] = useState<MapCalibrationBox | null>(null);
  const [diceRollHistory, setDiceRollHistory] = useState<DiceRollEvent[]>([]);
  const [dicePanelOpen, setDicePanelOpen] = useState(false);
  const [tokenLibraryExpanded, setTokenLibraryExpanded] = useState(false);
  const [turnOrderModalOpen, setTurnOrderModalOpen] = useState(false);
  const [turnOrderModalCollapsed, setTurnOrderModalCollapsed] = useState(false);
  const [turnOrderModalPosition, setTurnOrderModalPosition] = useState<{ x: number; y: number } | null>(null);
  const [turnOrderModalSize, setTurnOrderModalSize] = useState<{ width: number; height: number } | null>(null);
  const [turnOrderSettingsOpen, setTurnOrderSettingsOpen] = useState(false);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set());
  const [gmCanvasCenter, setGmCanvasCenter] = useState<Point | null>(null);
  const [tokenLibraryHeight, setTokenLibraryHeight] = useState(() => loadTokenLibraryHeight());
  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayout>(() => loadWorkspaceLayout());
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>(() => loadRecentCampaigns());
  const {
    activeMapIsVideo,
    mapAsset,
    sceneThumbnailAssets,
    tokenAssets,
    tokenLibraryAssets
  } = useGmCampaignAssets(campaign, activeScene, sceneDrafts);
  const {
    selectedFogShapeId,
    selectedWeatherMaskId,
    selectedEnvironmentEffectId,
    setEnvironmentEffectEditorId,
    environmentEffectEditorEffect,
    selectedDrawingId,
    selectedTokenId,
    selectedFogShapeIds,
    selectedWeatherMaskIds,
    selectedDrawingIds,
    selectedTokenIds,
    selectorSelectionCounts,
    selectTokens,
    selectDrawings,
    selectFogShapes,
    selectWeatherMasks,
    selectEnvironmentEffect,
    selectSceneItems,
    clearSceneSelection
  } = useSceneSelection(activeScene);
  const selectedTokenAssetIds = useMemo(
    () => getSelectedTokenAssetIds(activeScene?.tokens, selectedTokenId, selectedTokenIds),
    [activeScene?.tokens, selectedTokenId, selectedTokenIds]
  );
  const selectedSceneItemIds = useMemo(
    () =>
      buildSceneSelectionIds({
        tokenIds: selectedTokenIds,
        drawingIds: selectedDrawingIds,
        fogShapeIds: selectedFogShapeIds,
        weatherMaskIds: selectedWeatherMaskIds,
        environmentEffectId: selectedEnvironmentEffectId
      }),
    [selectedDrawingIds, selectedEnvironmentEffectId, selectedFogShapeIds, selectedTokenIds, selectedWeatherMaskIds]
  );
  const videoPlayback = activeScene?.videoPlayback ?? DEFAULT_VIDEO_PLAYBACK;
  const [diceSettingsPreference, setDiceSettingsPreference] = useState<DiceSettings>(() => loadDiceSettingsPreference());
  const diceSettings = useMemo<DiceSettings>(() => getEffectiveDiceSettings(campaign, diceSettingsPreference), [campaign, diceSettingsPreference]);
  const {
    playerSceneId,
    playerDisplayMode,
    liveTableEvents,
    emitLiveTableEvent,
    updateDiceRollHistory,
    applyPlayerViewModeState,
    skipNextPlayerSceneAutoSync
  } = usePlayerViewState({
    activeScene,
    campaign,
    playersPanelOpen,
    templatePreviewVisibleInPlayer,
    playerTemplatePreviewDrawing,
    onDiceRollHistoryChange: setDiceRollHistory,
    onClosePlayerMenu: () => setPlayerMenuOpen(false)
  });

  useEffect(() => {
    setMapCalibrationBox(null);
    setMapCalibrationBoxPicking(false);
    setPlayerTemplatePreviewDrawing(null);
  }, [activeScene?.id, setMapCalibrationBoxPicking, setPlayerTemplatePreviewDrawing]);

  const updateScene = (nextScene: Scene, syncCampaign: Campaign | null = campaign, syncScene: Scene = nextScene) => {
    // Only sync the active edit to Player View when that same scene is already being shown to players.
    if (syncScene !== nextScene) {
      skipNextPlayerSceneAutoSync();
    }
    updateWorkspaceScene(nextScene, nextScene.id === playerSceneId ? syncCampaign : null, syncScene);
  };

  const updateCanvasScene = (nextScene: Scene, syncScene: Scene = nextScene) => {
    updateScene(nextScene, campaign, syncScene);
  };

  const environmentEffectActions = useEnvironmentEffectActions({ activeScene, updateScene });

  const updateCampaignDraft = (nextCampaign: Campaign, syncActiveSceneToPlayer = true) => {
    updateWorkspaceCampaignDraft(nextCampaign, syncActiveSceneToPlayer && activeScene?.id === playerSceneId ? activeScene : null);
  };

  const {
    updatePlayerDisplay,
    selectPlayerDisplayProfile,
    createPlayerDisplayProfileFromDraft,
    renamePlayerDisplayProfile,
    deletePlayerDisplayProfile
  } = usePlayerDisplayActions({ campaign, updateCampaignDraft });

  const {
    addCampaignPlayer,
    updateCampaignPlayer,
    deleteCampaignPlayer
  } = useCampaignPlayerActions({ activeScene, campaign, updateCampaignDraft, updateScene });

  const { addSceneTokenToTurnOrder } = useSceneTokenTurnOrderActions({
    activeScene,
    updateScene,
    selectTokens
  });

  const {
    openTokenDefaultsDialog,
    updateTokenDefaultsDraft,
    submitTokenDefaults
  } = useTokenDefaultsActions({
    campaign,
    tokenDefaultsDialog,
    setTokenDefaultsDialog,
    updateCampaignDraft
  });

  const { displays, refreshDisplays } = useAvailableDisplays({ run });

  const {
    applyMapCalibration,
    fitMapToGridFromWizard,
    applyMapFitPreset,
    updateSceneGridFromWizard,
    startMapCalibrationBoxCapture,
    captureMapCalibrationBox,
    cancelMapCalibrationBoxCapture
  } = useMapCalibrationActions({
    activeScene,
    campaign,
    displays,
    mapAssetPath: getImageMapAssetPath(mapAsset),
    mapCalibrationBox,
    playerSceneId,
    playerViewSyncOptions,
    run,
    updateScene,
    updateWorkspaceCampaignDraft,
    applyPlayerViewModeState,
    clearActiveCanvasTools,
    setError,
    setMapCalibrationAssistantOpen,
    setMapCalibrationBox,
    setMapCalibrationBoxPicking
  });

  const {
    sendToPlayer,
    setPlayerFullscreen,
    closePlayerView,
    showPlayerHold,
    showPlayerBlackout,
    showPlayerTestPattern,
    showPlayerIdle
  } = usePlayerViewActions({
    activeScene,
    campaign,
    campaignPath,
    displays,
    playerSceneId,
    playerViewSyncOptions,
    sceneDrafts,
    run,
    applyPlayerViewModeState,
    setDirtySceneIds,
    setError,
    setPlayerMenuOpen,
    setSceneDrafts
  });

  const {
    openDeleteTokenAssetDialog,
    confirmDeleteTokenAsset,
    submitSceneName
  } = useSavedProjectDialogActions({
    activeScene,
    campaign,
    campaignDirty,
    campaignPath,
    newSceneName: dialogDrafts.values.newSceneName,
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
  });

  const {
    updateDiceSettings,
    rollTableDie,
    rollTableExpression,
    clearDiceRolls
  } = useDiceActions({
    campaign,
    diceSettings,
    emitLiveTableEvent,
    setDiceSettingsPreference,
    setError,
    updateCampaignDraft
  });

  const {
    addLibraryTokenToScene,
    cancelTokenCrop,
    dropLibraryTokenOnScene,
    importToken,
    submitTokenCrop
  } = useTokenImportActions({
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
    updateScene,
  });

  useGmDialogEscape({
    dialogs,
    openSceneMenuId,
    openFolderMenuId,
    playerMenuOpen,
    onCancelTokenCrop: () => void cancelTokenCrop(),
    onCloseSceneMenu: () => setOpenSceneMenuId(null),
    onCloseFolderMenu: () => setOpenFolderMenuId(null),
    onClosePlayerMenu: () => setPlayerMenuOpen(false)
  });

  useDismissableMenu({
    enabled: Boolean(openSceneMenuId || openFolderMenuId),
    menuRootClass: "scene-menu-wrap",
    onDismiss: () => {
      setOpenSceneMenuId(null);
      setOpenFolderMenuId(null);
    },
    closeOnEscape: false
  });

  useDismissableMenu({
    enabled: playerMenuOpen,
    menuRootClass: "player-view-menu-wrap",
    onDismiss: () => setPlayerMenuOpen(false),
    closeOnEscape: false
  });

  useEffect(() => {
    if (!activeScene) {
      setPlayerMenuOpen(false);
    }
  }, [activeScene]);

  const {
    appShellPresentation,
    collapsedFolderIds,
    handleCampaignOpened,
    removeRecentCampaignPath,
    resetPanelWidth,
    resetSceneLibraryUi,
    resetTokenLibraryHeight,
    startPanelResize,
    startTokenLibraryResize,
    toggleFolderCollapsed,
    toggleWorkspacePanel
  } = useGmWorkspaceShellActions({
    campaign,
    expandedFolderIds,
    recentCampaigns,
    tokenLibraryHeight,
    workspaceLayout,
    setExpandedFolderIds,
    setOpenFolderMenuId,
    setOpenSceneMenuId,
    setPlayersPanelOpen,
    setRecentCampaigns,
    setTokenLibraryExpanded,
    setTokenLibraryHeight,
    setWorkspaceLayout
  });

  const {
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
    duplicateFolder,
    duplicateScene,
    deleteScene,
    deleteFolder
  } = useCampaignActions({
    workspace,
    mapAssetToDelete,
    ...maintenanceState.campaignActionCallbacks,
    onResetSceneLibraryUi: resetSceneLibraryUi,
    onCloseSceneMenu: () => setOpenSceneMenuId(null),
    onCloseFolderMenu: () => setOpenFolderMenuId(null),
    onCampaignOpened: handleCampaignOpened,
    onMapAssetDeleteHandled: () => setMapAssetToDelete(null),
    onSceneDeleteHandled: () => setSceneToDelete(null),
    onFolderDeleteHandled: () => setFolderToDelete(null),
    shouldSyncSceneToPlayer: (sceneId) => sceneId === playerSceneId,
    playerViewSyncOptions
  });
  const saveBeforeCloseRef = useRef(saveCampaignBeforeClose);

  useEffect(() => {
    saveBeforeCloseRef.current = saveCampaignBeforeClose;
  }, [saveCampaignBeforeClose]);

  useEffect(() => {
    setGmCanvasCenter(null);
  }, [activeScene?.id]);

  const {
    updateVideoPlayback,
    updateGrid,
    updateFog,
    undoFogShape,
    clearFogShapes,
    updateMapTransform,
    setLayerOrderLocked,
    moveLayer,
    updateSelectedPlayerVisibility,
    deleteSelectedSceneItems,
    undoWeatherMask,
    undoEnvironmentEffect,
    undoDrawing
  } = useSceneEditingActions({
    activeScene,
    selectedSceneItemIds,
    updateScene,
    clearSceneSelection,
    onClearFogConfirmed: () => setConfirmClearFogOpen(false)
  });

  const {
    openSceneDialog,
    openFolderDialog,
    openRenameDialog,
    openRenameFolderDialog,
    openRenameFogShapeDialog,
    openRenameEnvironmentEffectDialog,
    openRenameTokenDialog,
    openRenameTokenAssetDialog,
    openFolderColorDialog,
    submitFolderName,
    submitFogShapeName,
    submitEnvironmentEffectName,
    submitTokenName,
    submitTokenAssetName,
    submitFolderColor,
    moveFolder,
    openSceneColorDialog,
    openTokenColorDialog,
    updateSceneColorDraft,
    submitSceneColor,
    submitTokenBorderColor,
    openCampaignRenameDialog,
    submitCampaignName
  } = useGmDialogActions({
    activeScene,
    campaign,
    environmentEffectDialog,
    fogShapeDialog,
    folderColorDialog,
    folderDialog,
    ...dialogDrafts.values,
    sceneColorDialog,
    tokenAssetDialog,
    tokenColorDialog,
    tokenDialog,
    setCampaignNameDialogOpen,
    setEnvironmentEffectDialog,
    setFolderColorDialog,
    setFolderDialog,
    setFogShapeDialog,
    ...dialogDrafts.setters,
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
    updateScene
  });

  const { reopenRecentCampaign, confirmDeleteScene } = createCampaignWorkflowActions({
    playerSceneId,
    run,
    deleteScene,
    openRecentCampaign,
    removeRecentCampaignPath,
    showPlayerIdle
  });

  const appShellStyle = appShellPresentation.style as CSSProperties;
  const appShellClassName = appShellPresentation.className;

  useEffect(() => {
    const removeListener = window.localVtt.onSaveBeforeClose(() => {
      void saveBeforeCloseRef.current().then((ok) => {
        if (ok) {
          window.localVtt.closeAfterSave();
        }
      });
    });
    return removeListener;
  }, []);

  return (
    <div className={appShellClassName} style={appShellStyle}>
      <GmSidebar
        campaign={campaign}
        campaignPath={campaignPath}
        missingAssets={missingAssets}
        hasUnsavedChanges={hasUnsavedChanges}
        activeScene={activeScene}
        playerSceneId={playerSceneId}
        dirtySceneIds={dirtySceneIds}
        sceneThumbnailAssets={sceneThumbnailAssets}
        collapsedFolderIds={collapsedFolderIds}
        openSceneMenuId={openSceneMenuId}
        openFolderMenuId={openFolderMenuId}
        workspaceLayout={workspaceLayout}
        tokenAssets={tokenLibraryAssets}
        onClearActiveFogTool={clearActiveCanvasTools}
        onToggleWorkspacePanel={toggleWorkspacePanel}
        onResetPanelWidth={resetPanelWidth}
        onStartPanelResize={startPanelResize}
        onCreateCampaign={createCampaign}
        onOpenCampaign={openCampaign}
        recentCampaigns={recentCampaigns}
        onOpenRecentCampaign={(recentCampaignPath) => void reopenRecentCampaign(recentCampaignPath)}
        onRemoveRecentCampaign={removeRecentCampaignPath}
        onSaveCampaign={() => void saveCampaign()}
        onRenameCampaign={openCampaignRenameDialog}
        onOpenCampaignHealth={openCampaignHealthDialog}
        onOpenBackupRestore={openMetadataRestoreDialog}
        onRegenerateThumbnails={() => void regenerateThumbnails()}
        onPromoteTokenAssets={() => void promoteTokenAssets()}
        onPruneUnreferencedAssets={maintenanceState.openAssetPruneConfirm}
        onAddPlayer={addCampaignPlayer}
        onUpdatePlayer={updateCampaignPlayer}
        onDeletePlayer={deleteCampaignPlayer}
        onPlayersPanelOpenChange={setPlayersPanelOpen}
        onOpenSceneDialog={openSceneDialog}
        onOpenFolderDialog={openFolderDialog}
        onLoadScene={(sceneId) => void loadScene(sceneId)}
        onSaveScene={(sceneId) => void saveSceneById(sceneId)}
        onSaveFolderScenes={(folderId) => void saveFolderScenes(folderId)}
        onMoveScene={moveScene}
        onToggleFolderCollapsed={toggleFolderCollapsed}
        onToggleSceneMenu={(sceneId) => {
          setOpenFolderMenuId(null);
          setOpenSceneMenuId(openSceneMenuId === sceneId ? null : sceneId);
        }}
        onToggleFolderMenu={(folderId) => {
          setOpenSceneMenuId(null);
          setOpenFolderMenuId(openFolderMenuId === folderId ? null : folderId);
        }}
        onRenameScene={openRenameDialog}
        onDuplicateScene={(scene) => void duplicateScene(scene)}
        onDeleteScene={setSceneToDelete}
        onRenameFolder={openRenameFolderDialog}
        onChangeFolderColor={openFolderColorDialog}
        onDuplicateFolder={(folder) => void duplicateFolder(folder)}
        onMoveFolder={moveFolder}
        onDeleteFolder={setFolderToDelete}
      />

      <main className="workspace">
        <WorkspaceTopbar
          campaign={campaign}
          activeScene={activeScene}
          mapAsset={mapAsset}
          playerMenuOpen={playerMenuOpen}
          playerDisplayMode={playerDisplayMode}
          onSendToPlayer={sendToPlayer}
          onTogglePlayerMenu={() => {
            if (activeScene) {
              setPlayerMenuOpen((open) => !open);
            }
          }}
          onShowPlayerHold={showPlayerHold}
          onShowPlayerBlackout={showPlayerBlackout}
          onOpenTableDisplaySetup={() => {
            setTableDisplayWizardOpen(true);
            setPlayerMenuOpen(false);
          }}
          onOpenPlayerDisplayScale={() => {
            setPlayerDisplayDialogOpen(true);
            setPlayerMenuOpen(false);
          }}
          onOpenMapCalibrationAssistant={() => {
            setMapCalibrationAssistantOpen(true);
            setPlayerMenuOpen(false);
          }}
          onSetPlayerFullscreen={(fullscreen) => void setPlayerFullscreen(fullscreen)}
          onClosePlayerView={closePlayerView}
          gmDiceDisplayMode={diceSettings.gmDisplayMode}
          playerDiceDisplayMode={diceSettings.playerDisplayMode}
          diceSceneRollEnabled={diceSettings.sceneRollEnabled}
          diceSceneRollTarget={diceSettings.sceneRollTarget}
          gmDiceSceneSize={diceSettings.gmSceneSize}
          playerDiceSceneSize={diceSettings.playerSceneSize}
          gmDicePanelEdge={diceSettings.gmPanelEdge}
          playerDicePanelEdge={diceSettings.playerPanelEdge}
          gmDicePanelFacing={diceSettings.gmPanelFacing}
          playerDicePanelFacing={diceSettings.playerPanelFacing}
          gmDicePanelPosition={diceSettings.gmPanelPosition}
          playerDicePanelPosition={diceSettings.playerPanelPosition}
          gmDicePanelAdvanced={diceSettings.gmPanelAdvanced}
          playerDicePanelAdvanced={diceSettings.playerPanelAdvanced}
          diceHistory={diceRollHistory}
          onGmDiceDisplayModeChange={(gmDisplayMode) => updateDiceSettings({ gmDisplayMode })}
          onPlayerDiceDisplayModeChange={(playerDisplayMode) => updateDiceSettings({ playerDisplayMode })}
          onDiceSceneRollEnabledChange={(sceneRollEnabled) => updateDiceSettings({ sceneRollEnabled })}
          onDiceSceneRollTargetChange={(sceneRollTarget) => updateDiceSettings({ sceneRollTarget })}
          onGmDiceSceneSizeChange={(gmSceneSize) => updateDiceSettings({ gmSceneSize })}
          onPlayerDiceSceneSizeChange={(playerSceneSize) => updateDiceSettings({ playerSceneSize })}
          onGmDicePanelEdgeChange={(gmPanelEdge) => updateDiceSettings({ gmPanelEdge })}
          onPlayerDicePanelEdgeChange={(playerPanelEdge) => updateDiceSettings({ playerPanelEdge })}
          onGmDicePanelFacingChange={(gmPanelFacing) => updateDiceSettings({ gmPanelFacing })}
          onPlayerDicePanelFacingChange={(playerPanelFacing) => updateDiceSettings({ playerPanelFacing })}
          onGmDicePanelPositionChange={(gmPanelPosition) => updateDiceSettings({ gmPanelPosition })}
          onPlayerDicePanelPositionChange={(playerPanelPosition) => updateDiceSettings({ playerPanelPosition })}
          onGmDicePanelAdvancedChange={(gmPanelAdvanced) => updateDiceSettings({ gmPanelAdvanced })}
          onPlayerDicePanelAdvancedChange={(playerPanelAdvanced) => updateDiceSettings({ playerPanelAdvanced })}
          onRollDie={rollTableDie}
          onRollExpression={rollTableExpression}
          onClearDiceRolls={clearDiceRolls}
          dicePanelOpen={dicePanelOpen}
          onDicePanelOpenChange={setDicePanelOpen}
        />

        <div className={error ? "error-banner" : "error-banner error-banner-empty"}>{error}</div>

        <div className="canvas-stage">
          {activeScene && (
            <ToolsMenu
              activeCanvasTool={activeCanvasTool}
              activeFogTool={activeFogTool}
              activeWeatherMaskTool={activeWeatherMaskTool}
              activeEnvironmentEffectTool={activeEnvironmentEffectTool}
              activeDrawingTool={activeDrawingTool}
              environmentEffectType={environmentEffectType}
              environmentEffectFeather={environmentEffectFeather}
              acidEffectTuning={acidEffectTuning}
              coldEffectTuning={coldEffectTuning}
              darknessEffectTuning={darknessEffectTuning}
              poisonEffectTuning={poisonEffectTuning}
              waterEffectTuning={waterEffectTuning}
              lavaEffectTuning={lavaEffectTuning}
              fireEffectTuning={fireEffectTuning}
              lightningEffectTuning={lightningEffectTuning}
              arcaneEffectTuning={arcaneEffectTuning}
              chaosEffectTuning={chaosEffectTuning}
              voidEffectTuning={voidEffectTuning}
              natureEffectTuning={natureEffectTuning}
              distortionEffectTuning={distortionEffectTuning}
              radiantEffectTuning={radiantEffectTuning}
              forceFieldEffectTuning={forceFieldEffectTuning}
              shockwaveEffectTuning={shockwaveEffectTuning}
              smokeEffectTuning={smokeEffectTuning}
              fogEffectTuning={fogEffectTuning}
              mouseBehavior={mouseBehavior}
              fogOperation={fogOperation}
              brushSize={fogBrushSize}
              drawingColor={drawingColor}
              drawingOpacity={drawingOpacity}
              drawingFillColor={drawingFillColor}
              drawingFillOpacity={drawingFillOpacity}
              drawingStrokeStyle={drawingStrokeStyle}
              drawingStrokeWidth={drawingStrokeWidth}
              drawingTemplateSize={drawingTemplateSize}
              drawingTemplateEffect={drawingTemplateEffect}
              drawingTemplateWidth={drawingTemplateWidth}
              templatePreviewVisibleInPlayer={templatePreviewVisibleInPlayer}
              pingSize={tableTools.pingSize}
              pingColor={tableTools.pingColor}
              laserThickness={tableTools.laserThickness}
              laserColor={tableTools.laserColor}
              rulerLinger={tableTools.rulerLinger}
              tableToolsVisibleInPlayer={tableToolsVisibleInPlayer}
              fogShapeCount={activeScene.fog.shapes.length}
              drawingCount={activeScene.drawings.length}
              weatherMaskCount={activeScene.weather.masks.length}
              environmentEffectCount={activeScene.environment.effects.length}
              weatherToolsEnabled={
                activeScene.weather.enabled &&
                (activeScene.weather.effects.rain.enabled || activeScene.weather.effects.fog.enabled || activeScene.weather.effects.snow.enabled || activeScene.weather.effects.sand.enabled)
              }
              dicePanelOpen={dicePanelOpen}
              turnOrderModalOpen={turnOrderModalOpen}
              selectorSelectionFilters={selectorSelectionFilters}
              selectorSelectionCounts={selectorSelectionCounts}
              onCanvasToolChange={setActiveCanvasTool}
              onFogToolChange={setActiveFogTool}
              onWeatherMaskToolChange={setActiveWeatherMaskTool}
              onEnvironmentEffectToolChange={setActiveEnvironmentEffectTool}
              onDrawingToolChange={setActiveDrawingTool}
              onEnvironmentEffectTypeChange={setEnvironmentEffectType}
              onEnvironmentEffectFeatherChange={setEnvironmentEffectFeather}
              onAcidEffectTuningChange={setAcidEffectTuning}
              onAcidEffectTuningReset={resetAcidEffectTuning}
              onColdEffectTuningChange={setColdEffectTuning}
              onColdEffectTuningReset={resetColdEffectTuning}
              onDarknessEffectTuningChange={setDarknessEffectTuning}
              onDarknessEffectTuningReset={resetDarknessEffectTuning}
              onPoisonEffectTuningChange={setPoisonEffectTuning}
              onPoisonEffectTuningReset={resetPoisonEffectTuning}
              onWaterEffectTuningChange={setWaterEffectTuning}
              onWaterEffectTuningReset={resetWaterEffectTuning}
              onLavaEffectTuningChange={setLavaEffectTuning}
              onLavaEffectTuningReset={resetLavaEffectTuning}
              onFireEffectTuningChange={setFireEffectTuning}
              onFireEffectTuningReset={resetFireEffectTuning}
              onLightningEffectTuningChange={setLightningEffectTuning}
              onLightningEffectTuningReset={resetLightningEffectTuning}
              onArcaneEffectTuningChange={setArcaneEffectTuning}
              onArcaneEffectTuningReset={resetArcaneEffectTuning}
              onChaosEffectTuningChange={setChaosEffectTuning}
              onChaosEffectTuningReset={resetChaosEffectTuning}
              onVoidEffectTuningChange={setVoidEffectTuning}
              onVoidEffectTuningReset={resetVoidEffectTuning}
              onNatureEffectTuningChange={setNatureEffectTuning}
              onNatureEffectTuningReset={resetNatureEffectTuning}
              onDistortionEffectTuningChange={setDistortionEffectTuning}
              onDistortionEffectTuningReset={resetDistortionEffectTuning}
              onRadiantEffectTuningChange={setRadiantEffectTuning}
              onRadiantEffectTuningReset={resetRadiantEffectTuning}
              onForceFieldEffectTuningChange={setForceFieldEffectTuning}
              onForceFieldEffectTuningReset={resetForceFieldEffectTuning}
              onShockwaveEffectTuningChange={setShockwaveEffectTuning}
              onShockwaveEffectTuningReset={resetShockwaveEffectTuning}
              onSmokeEffectTuningChange={setSmokeEffectTuning}
              onSmokeEffectTuningReset={resetSmokeEffectTuning}
              onFogEffectTuningChange={setFogEffectTuning}
              onFogEffectTuningReset={resetFogEffectTuning}
              onMouseBehaviorChange={setMouseBehavior}
              onFogOperationChange={setFogOperation}
              onBrushSizeChange={setFogBrushSize}
              onDrawingColorChange={setDrawingColor}
              onDrawingOpacityChange={setDrawingOpacity}
              onDrawingFillColorChange={setDrawingFillColor}
              onDrawingFillOpacityChange={setDrawingFillOpacity}
              onDrawingStrokeStyleChange={setDrawingStrokeStyle}
              onDrawingStrokeWidthChange={setDrawingStrokeWidth}
              onDrawingTemplateSizeChange={setDrawingTemplateSize}
              onDrawingTemplateEffectChange={setDrawingTemplateEffect}
              onDrawingTemplateWidthChange={setDrawingTemplateWidth}
              onTemplatePreviewVisibleInPlayerChange={setTemplatePreviewVisibleInPlayer}
              onPingSizeChange={setPingSize}
              onPingColorChange={setPingColor}
              onLaserThicknessChange={setLaserThickness}
              onLaserColorChange={setLaserColor}
              onRulerLingerChange={setRulerLinger}
              onTableToolsVisibleInPlayerChange={setTableToolsVisibleInPlayer}
              onSelectorSelectionFiltersChange={setSelectorSelectionFilters}
              onUndoFogShape={undoFogShape}
              onUndoDrawing={undoDrawing}
              onUndoWeatherMask={undoWeatherMask}
              onUndoEnvironmentEffect={undoEnvironmentEffect}
              onRequestClearFog={() => setConfirmClearFogOpen(true)}
              onToggleDicePanel={() => setDicePanelOpen((open) => !open)}
              onToggleTurnOrder={() =>
                setTurnOrderModalOpen((open) => {
                  if (!open) {
                    setTurnOrderModalCollapsed(false);
                  }
                  return !open;
                })
              }
              onShowSelectedOnPlayerView={() => updateSelectedPlayerVisibility(true)}
              onHideSelectedOnPlayerView={() => updateSelectedPlayerVisibility(false)}
              onDeleteSelected={deleteSelectedSceneItems}
              onClearSelection={clearSceneSelection}
            />
          )}
          <SceneCanvas
            campaign={campaign}
            scene={activeScene}
            mode="gm"
            canvasTool={activeCanvasTool}
            mouseBehavior={mouseBehavior}
            drawingTool={activeDrawingTool}
            drawingColor={drawingColor}
            drawingOpacity={drawingOpacity}
            drawingFillColor={drawingFillColor}
            drawingFillOpacity={drawingFillOpacity}
            drawingStrokeStyle={drawingStrokeStyle}
            drawingStrokeWidth={drawingStrokeWidth}
            drawingTemplateSize={drawingTemplateSize}
            drawingTemplateEffect={drawingTemplateEffect}
            drawingTemplateWidth={drawingTemplateWidth}
            fogBrushSize={fogBrushSize}
            fogTool={activeFogTool}
            weatherMaskTool={activeWeatherMaskTool}
            environmentEffectTool={activeEnvironmentEffectTool}
            environmentEffectType={environmentEffectType}
            environmentEffectFeather={environmentEffectFeather}
            acidEffectTuning={acidEffectTuning}
            coldEffectTuning={coldEffectTuning}
            darknessEffectTuning={darknessEffectTuning}
            poisonEffectTuning={poisonEffectTuning}
            waterEffectTuning={waterEffectTuning}
            lavaEffectTuning={lavaEffectTuning}
            fireEffectTuning={fireEffectTuning}
            lightningEffectTuning={lightningEffectTuning}
            arcaneEffectTuning={arcaneEffectTuning}
            chaosEffectTuning={chaosEffectTuning}
            voidEffectTuning={voidEffectTuning}
            natureEffectTuning={natureEffectTuning}
            distortionEffectTuning={distortionEffectTuning}
            radiantEffectTuning={radiantEffectTuning}
            forceFieldEffectTuning={forceFieldEffectTuning}
            shockwaveEffectTuning={shockwaveEffectTuning}
            smokeEffectTuning={smokeEffectTuning}
            fogEffectTuning={fogEffectTuning}
            liveTableEvents={liveTableEvents}
            tableTools={tableTools}
            tableToolsVisibleInPlayer={tableToolsVisibleInPlayer}
            selectedFogShapeId={selectedFogShapeId}
            selectedWeatherMaskId={selectedWeatherMaskId}
            selectedEnvironmentEffectId={selectedEnvironmentEffectId}
            selectedDrawingId={selectedDrawingId}
            selectedTokenId={selectedTokenId}
            selectedFogShapeIds={selectedFogShapeIds}
            selectedWeatherMaskIds={selectedWeatherMaskIds}
            selectedDrawingIds={selectedDrawingIds}
            selectedTokenIds={selectedTokenIds}
            selectorSelectionFilters={selectorSelectionFilters}
            onSceneChange={updateCanvasScene}
            onSelectToken={(tokenId) => selectTokens(tokenId ? [tokenId] : [])}
            onSelectFogShape={(shapeId) => selectFogShapes(shapeId ? [shapeId] : [])}
            onSelectWeatherMask={(maskId) => selectWeatherMasks(maskId ? [maskId] : [])}
            onSelectEnvironmentEffect={selectEnvironmentEffect}
            onEditEnvironmentEffect={setEnvironmentEffectEditorId}
            onSelectDrawing={(drawingId) => selectDrawings(drawingId ? [drawingId] : [])}
            onSelectSceneItems={selectSceneItems}
            onAddTokenToTurnOrder={addSceneTokenToTurnOrder}
            onDropTokenAsset={dropLibraryTokenOnScene}
            onLiveTableEvent={emitLiveTableEvent}
            onDiceRollResolved={updateDiceRollHistory}
            onTemplatePreviewChange={setPlayerTemplatePreviewDrawing}
            onViewportCenterChange={setGmCanvasCenter}
            onOpenTokenColor={openTokenColorDialog}
            mapCalibrationBox={mapCalibrationBox}
            onMapCalibrationBox={mapCalibrationBoxPicking ? captureMapCalibrationBox : undefined}
            onMapCalibrationCancel={mapCalibrationBoxPicking ? cancelMapCalibrationBoxCapture : undefined}
          />
          {activeMapIsVideo && <VideoMapControls videoPlayback={videoPlayback} onUpdateVideoPlayback={updateVideoPlayback} />}
        </div>

        <TokenLibraryDrawer
          assets={tokenLibraryAssets}
          expanded={tokenLibraryExpanded}
          campaignOpen={Boolean(campaignPath)}
          activeSceneName={activeScene?.name}
          onToggleExpanded={() => setTokenLibraryExpanded((expanded) => !expanded)}
          onStartResize={startTokenLibraryResize}
          onResetHeight={resetTokenLibraryHeight}
          onImportToken={() => void importToken("library")}
          onAddToken={addLibraryTokenToScene}
          selectedTokenAssetId={selectedTokenAssetIds.selectedTokenAssetId}
          selectedTokenAssetIds={selectedTokenAssetIds.selectedTokenAssetIds}
          onSetTokenDefaults={openTokenDefaultsDialog}
          onRenameToken={openRenameTokenAssetDialog}
          onDeleteToken={(asset) => void openDeleteTokenAssetDialog(asset)}
        />
        {turnOrderModalOpen && (
          <TurnOrderModal
            position={turnOrderModalPosition}
            size={turnOrderModalSize}
            settingsOpen={turnOrderSettingsOpen}
            settingsDisabled={!activeScene}
            collapsed={turnOrderModalCollapsed}
            onToggleSettings={() => setTurnOrderSettingsOpen((open) => !open)}
            onToggleCollapsed={() => setTurnOrderModalCollapsed((collapsed) => !collapsed)}
            onPositionChange={setTurnOrderModalPosition}
            onSizeChange={setTurnOrderModalSize}
            onClose={() => setTurnOrderModalOpen(false)}
          >
            <TurnOrderPanel
              scene={activeScene}
              campaignPlayers={campaign?.players ?? []}
              tokenAssets={tokenAssets}
              canStartTurnOrder={Boolean(activeScene && activeScene.id === playerSceneId && playerDisplayMode === "scene")}
              onChangeScene={updateScene}
              settingsOpen={turnOrderSettingsOpen}
              onSettingsOpenChange={setTurnOrderSettingsOpen}
              settingsControlVisible={false}
            />
          </TurnOrderModal>
        )}

        <footer className="statusbar">
          <span>Mouse wheel zooms. Grabber left-drags the scene. Middle/right drag pans. Scene data uses world/map coordinates.</span>
          <span>
            Save status: {formatSaveStatus({ dirtySceneCount: dirtyCount, campaignDirty, saveState })}
          </span>
        </footer>
      </main>

      <GmInspector
        activeScene={activeScene}
        mapAsset={mapAsset}
        tokenAssets={tokenAssets}
        selectedFogShapeId={selectedFogShapeId}
        selectedWeatherMaskId={selectedWeatherMaskId}
        selectedEnvironmentEffectId={selectedEnvironmentEffectId}
        selectedDrawingId={selectedDrawingId}
        selectedTokenId={selectedTokenId}
        selectedFogShapeIds={selectedFogShapeIds}
        selectedWeatherMaskIds={selectedWeatherMaskIds}
        selectedDrawingIds={selectedDrawingIds}
        selectedTokenIds={selectedTokenIds}
        workspaceLayout={workspaceLayout}
        onClearActiveFogTool={clearActiveCanvasTools}
        onToggleWorkspacePanel={toggleWorkspacePanel}
        onResetPanelWidth={resetPanelWidth}
        onStartPanelResize={startPanelResize}
        onSetLayerOrderLocked={setLayerOrderLocked}
        onChangeScene={updateScene}
        onUpdateGrid={updateGrid}
        onUpdateFog={updateFog}
        onUpdateMapTransform={updateMapTransform}
        onApplyMapFitPreset={applyMapFitPreset}
        onMoveLayer={moveLayer}
        onImportMap={importMap}
        onReplaceMap={replaceMap}
        onImportToken={() => void importToken("scene")}
        onDeleteMap={setMapAssetToDelete}
        onSelectFogShape={(shapeId) => selectSceneItems({ fogShapeIds: shapeId ? [shapeId] : [] })}
        onSelectWeatherMask={(maskId) => selectSceneItems({ weatherMaskIds: maskId ? [maskId] : [] })}
        onSelectEnvironmentEffect={selectEnvironmentEffect}
        onEditEnvironmentEffect={setEnvironmentEffectEditorId}
        onSelectDrawing={(drawingId) => selectSceneItems({ drawingIds: drawingId ? [drawingId] : [] })}
        onSelectToken={(tokenId) => selectSceneItems({ tokenIds: tokenId ? [tokenId] : [] })}
        onRenameFogShape={openRenameFogShapeDialog}
        onRenameEnvironmentEffect={openRenameEnvironmentEffectDialog}
        onRenameToken={openRenameTokenDialog}
        onOpenFogColor={() => openSceneColorDialog("fog")}
        onOpenGridColor={() => openSceneColorDialog("grid")}
        onOpenTokenColor={openTokenColorDialog}
      />

      {environmentEffectEditorEffect && (
        <GmEnvironmentEffectEditor
          actions={environmentEffectActions}
          effect={environmentEffectEditorEffect}
          position={environmentEffectEditorPosition}
          size={environmentEffectEditorSize}
          onClose={() => setEnvironmentEffectEditorId(null)}
          onPositionChange={setEnvironmentEffectEditorPosition}
          onSizeChange={setEnvironmentEffectEditorSize}
        />
      )}

      <GmDialogs
        sceneDialog={sceneDialog}
        folderDialog={folderDialog}
        fogShapeDialog={fogShapeDialog}
        environmentEffectDialog={environmentEffectDialog}
        tokenDialog={tokenDialog}
        tokenCropDialog={tokenCropDialog}
        tokenAssetDialog={tokenAssetDialog}
        tokenDefaultsDialog={tokenDefaultsDialog}
        folderColorDialog={folderColorDialog}
        sceneColorDialog={sceneColorDialog}
        tokenColorDialog={tokenColorDialog}
        campaignNameDialogOpen={campaignNameDialogOpen}
        tableDisplayWizardOpen={tableDisplayWizardOpen}
        playerDisplayDialogOpen={playerDisplayDialogOpen}
        mapCalibrationAssistantOpen={mapCalibrationAssistantOpen}
        sceneToDelete={sceneToDelete}
        folderToDelete={folderToDelete}
        mapAssetToDelete={mapAssetToDelete}
        mapReplacementPreview={maintenanceState.mapReplacementPreview}
        tokenAssetToDelete={tokenAssetToDelete}
        confirmClearFogOpen={confirmClearFogOpen}
        campaign={campaign}
        activeScene={activeScene}
        mapAsset={mapAsset}
        mapCalibrationBox={mapCalibrationBox}
        playerSceneId={playerSceneId}
        dirtySceneIds={dirtySceneIds}
        displays={displays}
        {...dialogDrafts.dialogProps}
        onCancelSceneDialog={() => setSceneDialog(null)}
        onCancelFolderDialog={() => setFolderDialog(null)}
        onCancelFogShapeDialog={() => setFogShapeDialog(null)}
        onCancelEnvironmentEffectDialog={() => setEnvironmentEffectDialog(null)}
        onCancelTokenDialog={() => setTokenDialog(null)}
        onCancelTokenCropDialog={() => void cancelTokenCrop()}
        onCancelTokenAssetDialog={() => setTokenAssetDialog(null)}
        onCancelTokenDefaultsDialog={() => setTokenDefaultsDialog(null)}
        onCancelFolderColorDialog={() => setFolderColorDialog(null)}
        onCancelSceneColorDialog={() => setSceneColorDialog(null)}
        onCancelTokenColorDialog={() => setTokenColorDialog(null)}
        onCancelCampaignNameDialog={() => setCampaignNameDialogOpen(false)}
        onCancelTableDisplayWizard={() => setTableDisplayWizardOpen(false)}
        onCancelPlayerDisplayDialog={() => setPlayerDisplayDialogOpen(false)}
        onCancelMapCalibrationAssistant={() => setMapCalibrationAssistantOpen(false)}
        onCancelSceneDelete={() => setSceneToDelete(null)}
        onCancelFolderDelete={() => setFolderToDelete(null)}
        onCancelMapAssetDelete={() => setMapAssetToDelete(null)}
        onCancelMapReplacement={maintenanceState.closeMapReplacementPreview}
        onCancelTokenAssetDelete={() => setTokenAssetToDelete(null)}
        onCancelClearFog={() => setConfirmClearFogOpen(false)}
        onSubmitSceneName={() => void submitSceneName()}
        onSubmitFolderName={submitFolderName}
        onSubmitFogShapeName={submitFogShapeName}
        onSubmitEnvironmentEffectName={submitEnvironmentEffectName}
        onSubmitTokenName={submitTokenName}
        onSubmitTokenCrop={(crop) => void submitTokenCrop(crop)}
        onSubmitTokenAssetName={submitTokenAssetName}
        onUpdateTokenDefaultsDraft={updateTokenDefaultsDraft}
        onSubmitTokenDefaults={submitTokenDefaults}
        onSubmitFolderColor={submitFolderColor}
        onUpdateSceneColorDraft={updateSceneColorDraft}
        onSubmitSceneColor={submitSceneColor}
        onSubmitTokenBorderColor={submitTokenBorderColor}
        onSubmitCampaignName={submitCampaignName}
        onUpdatePlayerDisplay={updatePlayerDisplay}
        onCreatePlayerDisplayProfile={createPlayerDisplayProfileFromDraft}
        onRenamePlayerDisplayProfile={renamePlayerDisplayProfile}
        onSelectPlayerDisplayProfile={selectPlayerDisplayProfile}
        onDeletePlayerDisplayProfile={deletePlayerDisplayProfile}
        onApplyMapCalibration={applyMapCalibration}
        onFitMapToGrid={fitMapToGridFromWizard}
        onUpdateSceneGrid={updateSceneGridFromWizard}
        onStartMapCalibrationBoxCapture={startMapCalibrationBoxCapture}
        onShowPlayerTestPattern={showPlayerTestPattern}
        onSendToPlayer={sendToPlayer}
        onImportMap={importMap}
        onOpenPlayerViewSetupFromWizard={() => {
          setTableDisplayWizardOpen(false);
          setPlayerDisplayDialogOpen(true);
        }}
        onOpenMapCalibrationAssistantFromWizard={() => {
          setTableDisplayWizardOpen(false);
          setMapCalibrationAssistantOpen(true);
        }}
        onOpenPlayerViewSetupFromAssistant={() => {
          setMapCalibrationAssistantOpen(false);
          setPlayerDisplayDialogOpen(true);
        }}
        onRefreshDisplays={refreshDisplays}
        onConfirmDeleteScene={(scene) => void confirmDeleteScene(scene)}
        onConfirmDeleteFolder={deleteFolder}
        onConfirmDeleteMapAsset={() => void confirmDeleteMapAsset()}
        onConfirmMapReplacement={() => {
          if (maintenanceState.mapReplacementPreview) {
            void commitMapReplacement(maintenanceState.mapReplacementPreview);
          }
        }}
        onConfirmDeleteTokenAsset={() => void confirmDeleteTokenAsset()}
        onConfirmClearFog={clearFogShapes}
      />
      <GmMaintenanceDialogs
        assetPruneConfirmOpen={maintenanceState.assetPruneConfirmOpen}
        assetPruneResult={maintenanceState.assetPruneResult}
        busyState={maintenanceState.busyState}
        campaignHealth={campaignHealth}
        campaignHealthOpen={maintenanceState.campaignHealthOpen}
        campaignPath={campaignPath}
        metadataRestoreOpen={maintenanceState.metadataRestoreOpen}
        thumbnailRegenerationResult={maintenanceState.thumbnailRegenerationResult}
        tokenAssetPromotionResult={maintenanceState.tokenAssetPromotionResult}
        {...maintenanceState.dialogActions}
        onMetadataRestore={handleMetadataRestore}
        onOpenBackupsFolder={() => void openBackupsFolder()}
        onPruneUnreferencedAssets={() => void pruneUnreferencedAssets()}
        onSetError={setError}
      />
    </div>
  );
}
