import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  DEFAULT_SCENE_FOLDER_COLOR,
  DEFAULT_TOKEN_BORDER_COLOR,
  DEFAULT_VIDEO_PLAYBACK,
} from "../../shared/localvtt";
import type {
  Asset,
  AssetPruneResult,
  Campaign,
  CampaignSummary,
  CampaignSceneEntry,
  CampaignSceneFolder,
  DisplayCalibration,
  DiceSettings,
  EnvironmentEffectType,
  GridType,
  LiveTableEvent,
  PlayerViewTestPattern,
  Point,
  Scene,
  ThumbnailRegenerationResult,
  TokenAssetPromotionResult,
  TokenPresentationDefaults
} from "../../shared/localvtt";
import { SceneCanvas } from "../components/SceneCanvas";
import { AssetPruneResultDialog } from "../components/modals/AssetPruneResultDialog";
import { CampaignBusyOverlay } from "../components/modals/CampaignBusyOverlay";
import { CampaignHealthDialog } from "../components/modals/CampaignHealthDialog";
import { ConfirmDialog } from "../components/modals/ConfirmDialog";
import { MetadataBackupRestoreDialog } from "../components/modals/MetadataBackupRestoreDialog";
import { ThumbnailRegenerationResultDialog } from "../components/modals/ThumbnailRegenerationResultDialog";
import { TokenAssetPromotionResultDialog } from "../components/modals/TokenAssetPromotionResultDialog";
import { EnvironmentEffectEditorModal } from "../components/layers";
import type { MapCalibrationBox } from "../components/settings/MapCalibrationAssistant";
import type { DisplayInfo } from "../components/settings/PlayerDisplayScalePanel";
import type { WizardMapFitMode } from "../components/settings/TableDisplaySetupWizard";
import { ToolsMenu, type SelectorSelectionFilters } from "../components/tools";
import type { AcidEffectTuning, ArcaneEffectTuning, ChaosEffectTuning, ColdEffectTuning, DarknessEffectTuning, DistortionEffectTuning, FireEffectTuning, FogEffectTuning, ForceFieldEffectTuning, LavaEffectTuning, LightningEffectTuning, NatureEffectTuning, PoisonEffectTuning, RadiantEffectTuning, ShockwaveEffectTuning, SmokeEffectTuning, VoidEffectTuning, WaterEffectTuning } from "../canvas/effects";
import { applyMapCalibrationDraft, buildMapFitPresetScene, buildWizardMapFitScene, getImageMapAssetPath, type MapCalibrationDraft } from "../lib/map";
import { TokenLibraryDrawer } from "../components/tokens/TokenLibraryDrawer";
import { TurnOrderModal } from "../components/turn-order/TurnOrderModal";
import { TurnOrderPanel } from "../components/turn-order/TurnOrderPanel";
import { VideoMapControls } from "../components/workspace/VideoMapControls";
import { WorkspaceTopbar } from "../components/workspace/WorkspaceTopbar";
import { useCampaignActions, type CampaignBusyState, type MapReplacementPreview } from "../hooks/useCampaignActions";
import { useCampaignWorkspace } from "../hooks/useCampaignWorkspace";
import { useDismissableMenu } from "../hooks/useDismissableMenu";
import {
  getDefaultAcidEffectTuning,
  getDefaultArcaneEffectTuning,
  getDefaultChaosEffectTuning,
  getDefaultColdEffectTuning,
  getDefaultDarknessEffectTuning,
  getDefaultDistortionEffectTuning,
  getDefaultFireEffectTuning,
  getDefaultFogEffectTuning,
  getDefaultForceFieldEffectTuning,
  getDefaultLavaEffectTuning,
  getDefaultLightningEffectTuning,
  getDefaultNatureEffectTuning,
  getDefaultPoisonEffectTuning,
  getDefaultRadiantEffectTuning,
  getDefaultShockwaveEffectTuning,
  getDefaultSmokeEffectTuning,
  getDefaultVoidEffectTuning,
  getDefaultWaterEffectTuning,
  useEnvironmentEffectTuning
} from "../hooks/useEnvironmentEffectTuning";
import { useGmDialogEscape, useGmDialogState } from "../hooks/useGmDialogState";
import { useGmToolOptions } from "../hooks/useGmToolOptions";
import { useGmToolSelection } from "../hooks/useGmToolSelection";
import { shouldShowPlayerHoldAfterSceneDelete, usePlayerViewState } from "../hooks/usePlayerViewState";
import { useSceneEditingActions } from "../hooks/useSceneEditingActions";
import { useSceneSelection } from "../hooks/useSceneSelection";
import { useTokenImportActions } from "../hooks/useTokenImportActions";
import { buildAssetsById, buildAssetsByKind, buildSceneThumbnailAssets } from "../lib/assets";
import {
  addCampaignPlayerToCampaign,
  deleteCampaignPlayerFromCampaign,
  getActiveSceneAfterSceneRename,
  getCreateSceneFolderNameDialogState,
  getCreateSceneNameDialogState,
  getRenameSceneFolderNameDialogState,
  getRenameSceneNameDialogState,
  getSceneDraftsAfterSceneRename,
  getTokenAssetDeleteSceneUpdate,
  moveSceneFolder,
  renameCampaign,
  renameCampaignTokenAsset,
  setCampaignTokenAssetDefaults,
  setSceneFolderColor,
  submitSceneFolderName,
  updateCampaignPlayerInCampaign
} from "../lib/campaign";
import { buildLiveTableDiceClearEvent, buildLiveTableDiceRollEvent, rollDiceEvent, rollDiceExpression, type DiceType } from "../lib/dice";
import { applyDiceSettingsPatch, getEffectiveDiceSettings, loadDiceSettingsPreference, saveDiceSettingsPreference } from "../lib/dice";
import { formatUserFacingError } from "../lib/errors";
import { logRendererError } from "../lib/rendererDiagnostics";
import { loadImageDimensions } from "../lib/assets";
import {
  getDirtySceneIdsAfterPreviousPlayerScenePause,
  getPlayerViewOpenOptions,
  getPlayerViewOpenWarning,
  getPreviousPlayerScenePauseUpdate,
  getPlayerTestPatternState,
  getPlayerViewModeState,
  getSceneDraftsAfterPreviousPlayerScenePause,
  showDefaultPlayerHold,
  showPlayerBlackout as sendPlayerBlackout
} from "../lib/player-view";
import {
  applyPlayerDisplayProfileAction,
} from "../lib/player-display/playerDisplayProfiles";
import { sendSceneToPlayer, updatePlayerSceneIfOpenInBackground } from "../lib/player-view";
import {
  getCollapsedFolderIds,
  pruneExpandedFolderIds,
  removeLastDrawing,
  removeLastEnvironmentEffect,
  removeLastWeatherMask,
  toggleExpandedFolderId
} from "../lib/scene";
import { buildSceneSelectionIds, patchSceneEnvironmentEffect, removeSelectedSceneItems, setSceneEnvironmentEffectType, setSelectedSceneItemsPlayerVisibility } from "../lib/scene";
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
import {
  addRecentCampaign,
  loadRecentCampaigns,
  removeRecentCampaign,
  saveRecentCampaigns,
  type RecentCampaign
} from "../lib/campaign";
import { getSelectedTokenAssetIds, getTokenAssetDeleteDialogState, getTokenAssetRenameDialogState } from "../lib/tokens";
import { addTurnOrderEntry, createTurnOrderEntryFromToken } from "../lib/turn-order";
import {
  DEFAULT_TOKEN_LIBRARY_HEIGHT,
  getResizedTokenLibraryHeight,
  getResizedWorkspacePanelLayout,
  getTokenLibraryResizePlan,
  getWorkspacePanelResizePlan,
  getWorkspaceShellPresentation,
  loadTokenLibraryHeight,
  loadWorkspaceLayout,
  resetPanelWidth as resetWorkspacePanelWidth,
  saveTokenLibraryHeight,
  saveWorkspaceLayout,
  startWindowPointerDrag,
  toggleWorkspacePanel as toggleWorkspacePanelLayout,
  type WorkspaceLayout,
  type WorkspacePanelSide
} from "../lib/workspace";
import { formatSaveStatus } from "../lib/workspace";
import {
  GmDialogs,
  type SceneColorDialog,
} from "./GmDialogs";
import { GmInspector } from "./GmInspector";
import { GmSidebar } from "./GmSidebar";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;

const EMPTY_ASSETS: Asset[] = [];
const EMPTY_SCENE_ENTRIES: CampaignSceneEntry[] = [];
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
  const [metadataRestoreOpen, setMetadataRestoreOpen] = useState(false);
  const [campaignHealthOpen, setCampaignHealthOpen] = useState(false);
  const [thumbnailRegenerationResult, setThumbnailRegenerationResult] = useState<ThumbnailRegenerationResult | null>(null);
  const [tokenAssetPromotionResult, setTokenAssetPromotionResult] = useState<TokenAssetPromotionResult | null>(null);
  const [assetPruneConfirmOpen, setAssetPruneConfirmOpen] = useState(false);
  const [assetPruneResult, setAssetPruneResult] = useState<AssetPruneResult | null>(null);
  const [mapReplacementPreview, setMapReplacementPreview] = useState<MapReplacementPreview | null>(null);
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
  const [newSceneName, setNewSceneName] = useState("New Battle Map");
  const [newFolderName, setNewFolderName] = useState("New Folder");
  const [newFogShapeName, setNewFogShapeName] = useState("");
  const [newEnvironmentEffectName, setNewEnvironmentEffectName] = useState("");
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenBorderColor, setNewTokenBorderColor] = useState(DEFAULT_TOKEN_BORDER_COLOR);
  const [newFolderColor, setNewFolderColor] = useState(DEFAULT_SCENE_FOLDER_COLOR);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
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
  const [busyState, setBusyState] = useState<CampaignBusyState | null>(null);
  const campaignAssets = campaign?.assets ?? EMPTY_ASSETS;
  const campaignScenes = campaign?.scenes ?? EMPTY_SCENE_ENTRIES;
  const assetsById = useMemo(() => buildAssetsById(campaignAssets), [campaignAssets]);
  const mapAsset = useMemo(() => (activeScene?.mapAssetId ? (assetsById.get(activeScene.mapAssetId) ?? null) : null), [activeScene?.mapAssetId, assetsById]);
  const activeMapIsVideo = mapAsset?.mediaType === "video";
  const tokenAssets = useMemo(() => buildAssetsByKind(campaignAssets, "token"), [campaignAssets]);
  const tokenLibraryAssets = useMemo(() => [...tokenAssets.values()], [tokenAssets]);
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
  const diceSettingsDraftRef = useRef<DiceSettings>(diceSettings);
  const collapsedFolderIds = useMemo(
    () => getCollapsedFolderIds(campaign?.sceneFolders, expandedFolderIds),
    [campaign?.sceneFolders, expandedFolderIds]
  );
  const sceneThumbnailAssets = useMemo(
    () => buildSceneThumbnailAssets(campaignScenes, sceneDrafts, activeScene, assetsById),
    [activeScene, assetsById, campaignScenes, sceneDrafts]
  );
  const {
    playerSceneId,
    setPlayerSceneId,
    playerDisplayMode,
    setPlayerDisplayMode,
    liveTableEvents,
    emitLiveTableEvent,
    updateDiceRollHistory,
    skipNextPlayerSceneAutoSync
  } = usePlayerViewState({
    activeScene,
    campaign,
    playersPanelOpen,
    templatePreviewVisibleInPlayer,
    playerTemplatePreviewDrawing,
    onDiceRollHistoryChange: setDiceRollHistory
  });

  const applyPlayerViewModeState = (
    playerDisplayMode: Parameters<typeof getPlayerViewModeState>[0],
    playerSceneId: string | null = null,
    closeMenu = true
  ) => {
    const playerViewState = getPlayerViewModeState(playerDisplayMode, playerSceneId);
    setPlayerSceneId(playerViewState.playerSceneId);
    setPlayerDisplayMode(playerViewState.playerDisplayMode);
    if (closeMenu) {
      setPlayerMenuOpen(false);
    }
  };

  useEffect(() => {
    diceSettingsDraftRef.current = diceSettings;
  }, [diceSettings]);

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

  type SceneEnvironmentEffect = Scene["environment"]["effects"][number];

  const updateEnvironmentEffect = (effectId: string, updateEffect: (effect: SceneEnvironmentEffect) => SceneEnvironmentEffect) => {
    if (!activeScene) {
      return;
    }
    updateScene(patchSceneEnvironmentEffect(activeScene, effectId, updateEffect));
  };

  const updateEnvironmentEffectAcidTuning = (effectId: string, acidTuning: AcidEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, acidTuning }));
  const updateEnvironmentEffectPoisonTuning = (effectId: string, poisonTuning: PoisonEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, poisonTuning }));
  const updateEnvironmentEffectColdTuning = (effectId: string, coldTuning: ColdEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, coldTuning }));
  const updateEnvironmentEffectDarknessTuning = (effectId: string, darknessTuning: DarknessEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, darknessTuning }));
  const updateEnvironmentEffectWaterTuning = (effectId: string, waterTuning: WaterEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, waterTuning }));
  const updateEnvironmentEffectLavaTuning = (effectId: string, lavaTuning: LavaEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, lavaTuning }));
  const updateEnvironmentEffectFireTuning = (effectId: string, fireTuning: FireEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, fireTuning }));
  const updateEnvironmentEffectLightningTuning = (effectId: string, lightningTuning: LightningEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, lightningTuning }));
  const updateEnvironmentEffectArcaneTuning = (effectId: string, arcaneTuning: ArcaneEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, arcaneTuning }));
  const updateEnvironmentEffectChaosTuning = (effectId: string, chaosTuning: ChaosEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, chaosTuning }));
  const updateEnvironmentEffectVoidTuning = (effectId: string, voidTuning: VoidEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, voidTuning }));
  const updateEnvironmentEffectNatureTuning = (effectId: string, natureTuning: NatureEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, natureTuning }));
  const updateEnvironmentEffectDistortionTuning = (effectId: string, distortionTuning: DistortionEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, distortionTuning }));
  const updateEnvironmentEffectRadiantTuning = (effectId: string, radiantTuning: RadiantEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, radiantTuning }));
  const updateEnvironmentEffectForceFieldTuning = (effectId: string, fieldTuning: ForceFieldEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, fieldTuning }));
  const updateEnvironmentEffectShockwaveTuning = (effectId: string, shockwaveTuning: ShockwaveEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, shockwaveTuning }));
  const updateEnvironmentEffectSmokeTuning = (effectId: string, smokeTuning: SmokeEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, smokeTuning }));
  const updateEnvironmentEffectFogTuning = (effectId: string, fogTuning: FogEffectTuning) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, fogTuning }));
  const updateEnvironmentEffectFeather = (effectId: string, feather: number) => updateEnvironmentEffect(effectId, (effect) => ({ ...effect, feather }));

  const updateEnvironmentEffectType = (effectId: string, effectType: EnvironmentEffectType) => {
    if (!activeScene) {
      return;
    }
    updateScene(setSceneEnvironmentEffectType(activeScene, effectId, effectType));
  };

  const updateSelectedPlayerVisibility = (visibleInPlayer: boolean) => {
    if (!activeScene) {
      return;
    }
    updateScene(setSelectedSceneItemsPlayerVisibility(activeScene, selectedSceneItemIds, visibleInPlayer));
  };

  const deleteSelectedSceneItems = () => {
    if (!activeScene) {
      return;
    }
    updateScene(removeSelectedSceneItems(activeScene, selectedSceneItemIds));
    clearSceneSelection();
  };

  const updateCampaignDraft = (nextCampaign: Campaign, syncActiveSceneToPlayer = true) => {
    updateWorkspaceCampaignDraft(nextCampaign, syncActiveSceneToPlayer && activeScene?.id === playerSceneId ? activeScene : null);
  };

  const updateDiceSettings = (patch: Partial<DiceSettings>) => {
    const result = applyDiceSettingsPatch(diceSettingsDraftRef.current, patch, campaign, new Date().toISOString());
    diceSettingsDraftRef.current = result.settings;
    if (result.kind === "preference") {
      setDiceSettingsPreference(result.settings);
      saveDiceSettingsPreference(result.settings);
      return;
    }
    updateCampaignDraft(result.campaign);
  };

  const rollTableDie = (die: DiceType) => {
    const roll = rollDiceEvent(die);
    setError(null);
    emitLiveTableEvent(buildLiveTableDiceRollEvent(roll, diceSettings, crypto.randomUUID(), Date.now()));
  };

  const rollTableExpression = (expression: string, rollLabel?: string) => {
    try {
      const roll = rollDiceExpression(expression);
      setError(null);
      emitLiveTableEvent(buildLiveTableDiceRollEvent(roll, diceSettings, crypto.randomUUID(), Date.now(), rollLabel));
      return null;
    } catch (caught) {
      return caught instanceof Error ? caught.message : "Could not roll that dice expression.";
    }
  };

  const clearDiceRolls = () => {
    setError(null);
    emitLiveTableEvent(buildLiveTableDiceClearEvent(crypto.randomUUID(), Date.now()));
  };

  const refreshDisplays = useCallback(() =>
    run(async () => {
      setDisplays(await window.localVtt.getDisplays());
    }), [run]);

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

  useEffect(() => {
    void refreshDisplays();
    // Displays are refreshed once on mount; later updates happen when the GM opens display settings.
  }, [refreshDisplays]);

  useEffect(() => {
    saveWorkspaceLayout(workspaceLayout);
  }, [workspaceLayout]);

  useEffect(() => {
    saveTokenLibraryHeight(tokenLibraryHeight);
  }, [tokenLibraryHeight]);

  useEffect(() => {
    saveRecentCampaigns(recentCampaigns);
  }, [recentCampaigns]);

  const rememberCampaign = useCallback((summary: CampaignSummary) => {
    setRecentCampaigns((recents) => addRecentCampaign(recents, summary.campaign, summary.campaignPath));
  }, []);

  const removeRecentCampaignPath = useCallback((campaignPathToRemove: string) => {
    setRecentCampaigns((recents) => removeRecentCampaign(recents, campaignPathToRemove));
  }, []);

  const resetSceneLibraryUi = () => {
    setOpenSceneMenuId(null);
    setOpenFolderMenuId(null);
    setExpandedFolderIds(new Set());
    setPlayersPanelOpen(false);
    setTokenLibraryExpanded(false);
    setWorkspaceLayout((layout) => ({ ...layout, leftCollapsed: false, rightCollapsed: false }));
  };

  const handleCampaignOpened = useCallback(
    (summary: CampaignSummary) => {
      resetSceneLibraryUi();
      rememberCampaign(summary);
    },
    [rememberCampaign]
  );

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
    onMapReplacementPreview: setMapReplacementPreview,
    onMapReplacementHandled: () => setMapReplacementPreview(null),
    onBusyChange: setBusyState,
    onResetSceneLibraryUi: resetSceneLibraryUi,
    onCloseSceneMenu: () => setOpenSceneMenuId(null),
    onCloseFolderMenu: () => setOpenFolderMenuId(null),
    onCampaignOpened: handleCampaignOpened,
    onMapAssetDeleteHandled: () => setMapAssetToDelete(null),
    onSceneDeleteHandled: () => setSceneToDelete(null),
    onFolderDeleteHandled: () => setFolderToDelete(null),
    onThumbnailRegenerationComplete: setThumbnailRegenerationResult,
    onTokenAssetPromotionComplete: setTokenAssetPromotionResult,
    onAssetPruneComplete: setAssetPruneResult,
    onCampaignHealthOpen: () => setCampaignHealthOpen(true),
    onMetadataRestoreOpen: () => setMetadataRestoreOpen(true),
    onMetadataRestoreClosed: () => setMetadataRestoreOpen(false),
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
    moveLayer
  } = useSceneEditingActions({
    activeScene,
    updateScene,
    onClearFogConfirmed: () => setConfirmClearFogOpen(false)
  });

  const undoWeatherMask = () => {
    if (!activeScene || activeScene.weather.masks.length === 0) {
      return;
    }
    updateScene(removeLastWeatherMask(activeScene));
  };

  const undoEnvironmentEffect = () => {
    if (!activeScene || activeScene.environment.effects.length === 0) {
      return;
    }
    updateScene(removeLastEnvironmentEffect(activeScene));
  };

  const undoDrawing = () => {
    if (!activeScene || activeScene.drawings.length === 0) {
      return;
    }
    updateScene(removeLastDrawing(activeScene));
  };

  const reopenRecentCampaign = async (recentCampaignPath: string) => {
    const ok = await openRecentCampaign(recentCampaignPath);
    if (!ok) {
      removeRecentCampaignPath(recentCampaignPath);
    }
  };

  const addCampaignPlayer = () => {
    if (!campaign) {
      return;
    }
    const nextCampaign = addCampaignPlayerToCampaign(campaign, crypto.randomUUID(), new Date().toISOString());
    if (nextCampaign) {
      updateCampaignDraft(nextCampaign);
    }
  };

  const updateCampaignPlayer = (playerId: string, patch: Partial<Campaign["players"][number]>) => {
    if (!campaign) {
      return;
    }
    const updatedAt = new Date().toISOString();
    const result = updateCampaignPlayerInCampaign(campaign, activeScene, playerId, patch, updatedAt);
    updateCampaignDraft(result.campaign);
    if (result.scene) {
      updateScene(result.scene, result.campaign);
    }
  };

  const deleteCampaignPlayer = (playerId: string) => {
    if (!campaign) {
      return;
    }
    const updatedAt = new Date().toISOString();
    const result = deleteCampaignPlayerFromCampaign(campaign, activeScene, playerId, updatedAt);
    updateCampaignDraft(result.campaign);
    if (result.scene) {
      updateScene(result.scene, result.campaign);
    }
  };

  const addSceneTokenToTurnOrder = (tokenId: string) => {
    if (!activeScene) {
      return;
    }
    const token = activeScene.tokens.find((candidate) => candidate.id === tokenId);
    if (!token || activeScene.turnOrder.entries.some((entry) => entry.tokenId === token.id)) {
      selectTokens([tokenId]);
      return;
    }
    updateScene(addTurnOrderEntry(activeScene, createTurnOrderEntryFromToken(crypto.randomUUID(), token)));
    selectTokens([token.id]);
  };

  const openTokenDefaultsDialog = (asset: Asset) => {
    setTokenDefaultsDialog({
      assetId: asset.id,
      assetName: asset.name || asset.originalFileName || "Token",
      draft: { ...(asset.tokenDefaults ?? {}) }
    });
  };

  const updateTokenDefaultsDraft = (draft: TokenPresentationDefaults) => {
    setTokenDefaultsDialog((dialog) => (dialog ? { ...dialog, draft } : dialog));
  };

  const submitTokenDefaults = () => {
    if (!campaign || !tokenDefaultsDialog) {
      return;
    }
    updateCampaignDraft(setCampaignTokenAssetDefaults(campaign, tokenDefaultsDialog.assetId, tokenDefaultsDialog.draft, new Date().toISOString()));
    setTokenDefaultsDialog(null);
  };

  const updatePlayerDisplay = (nextDisplay: DisplayCalibration) => {
    if (!campaign) {
      return;
    }
    const nextCampaign = applyPlayerDisplayProfileAction(
      campaign,
      { type: "update-display", display: nextDisplay },
      new Date().toISOString()
    );
    if (nextCampaign) {
      updateCampaignDraft(nextCampaign);
    }
  };

  const selectPlayerDisplayProfile = (profileId: string) => {
    if (!campaign) {
      return;
    }
    const nextCampaign = applyPlayerDisplayProfileAction(
      campaign,
      { type: "select-profile", profileId },
      new Date().toISOString()
    );
    if (nextCampaign) {
      updateCampaignDraft(nextCampaign);
    }
  };

  const createPlayerDisplayProfileFromDraft = (name: string, calibration: DisplayCalibration) => {
    if (!campaign) {
      return;
    }
    const now = new Date().toISOString();
    const nextCampaign = applyPlayerDisplayProfileAction(
      campaign,
      { type: "create-profile", profileId: crypto.randomUUID(), name, calibration },
      now
    );
    if (nextCampaign) {
      updateCampaignDraft(nextCampaign);
    }
  };

  const renamePlayerDisplayProfile = (profileId: string, name: string) => {
    if (!campaign) {
      return;
    }
    const nextCampaign = applyPlayerDisplayProfileAction(
      campaign,
      { type: "rename-profile", profileId, name },
      new Date().toISOString()
    );
    if (nextCampaign) {
      updateCampaignDraft(nextCampaign);
    }
  };

  const deletePlayerDisplayProfile = (profileId: string) => {
    if (!campaign) {
      return;
    }
    const nextCampaign = applyPlayerDisplayProfileAction(
      campaign,
      { type: "delete-profile", profileId },
      new Date().toISOString()
    );
    if (nextCampaign) {
      updateCampaignDraft(nextCampaign);
    }
  };

  const buildMapCalibratedScene = async (draft: MapCalibrationDraft) => {
    if (!activeScene) {
      return null;
    }
    if (mapCalibrationBox) {
      return applyMapCalibrationDraft(activeScene, draft, { calibrationBox: mapCalibrationBox });
    }
    const imageMapAssetPath = getImageMapAssetPath(mapAsset);
    if (draft.alignGridToMap && imageMapAssetPath) {
      const dimensions = await loadImageDimensions(window.localVtt.toAssetUrl(imageMapAssetPath));
      return applyMapCalibrationDraft(activeScene, draft, { imageDimensions: dimensions });
    }
    return applyMapCalibrationDraft(activeScene, draft);
  };

  const applyMapCalibration = (draft: MapCalibrationDraft) =>
    run(async () => {
      const nextScene = await buildMapCalibratedScene(draft);
      if (!nextScene) {
        return;
      }
      updateScene(nextScene);
      setMapCalibrationBox(null);
      setMapCalibrationAssistantOpen(false);
    });

  const fitMapToGridFromWizard = (columns: number, rows: number, fitMode: WizardMapFitMode) =>
    run(async () => {
      const imageMapAssetPath = getImageMapAssetPath(mapAsset);
      if (!campaign || !activeScene || !imageMapAssetPath) {
        return;
      }
      const dimensions = await loadImageDimensions(window.localVtt.toAssetUrl(imageMapAssetPath));
      const nextScene = buildWizardMapFitScene(
        activeScene,
        columns,
        rows,
        fitMode,
        dimensions,
        getPlayerViewTargetDimensions(campaign.playerDisplay, displays)
      );
      updateScene(nextScene);
      const openResult = await window.localVtt.openPlayerView(getPlayerViewOpenOptions(campaign.playerDisplay));
      await sendSceneToPlayer(window.localVtt, campaign, nextScene, playerViewSyncOptions);
      applyPlayerViewModeState("scene", nextScene.id);
      const warning = getPlayerViewOpenWarning(openResult, campaign.playerDisplay);
      if (warning) {
        setError(warning);
      }
    });

  const applyMapFitPreset = (fitMode: Exclude<Scene["mapTransform"]["fitMode"], "manual">, gridPatch: Partial<Scene["grid"]> = {}) =>
    run(async () => {
      const imageMapAssetPath = getImageMapAssetPath(mapAsset);
      if (!campaign || !activeScene || !imageMapAssetPath) {
        return;
      }
      const dimensions = await loadImageDimensions(window.localVtt.toAssetUrl(imageMapAssetPath));
      const nextScene = buildMapFitPresetScene(
        activeScene,
        fitMode,
        dimensions,
        getPlayerViewTargetDimensions(campaign.playerDisplay, displays),
        gridPatch
      );
      updateScene(nextScene);
      if (playerSceneId === activeScene.id) {
        await sendSceneToPlayer(window.localVtt, campaign, nextScene, playerViewSyncOptions);
      }
    });

  const updateSceneGridFromWizard = (gridType: GridType, sizePx: number, nextDisplay: DisplayCalibration) => {
    if (!campaign || !activeScene) {
      return;
    }
    const nextCampaign = {
      ...campaign,
      playerDisplay: nextDisplay,
      updatedAt: new Date().toISOString()
    };
    const nextScene = {
      ...activeScene,
      grid: {
        ...activeScene.grid,
        type: gridType,
        sizePx: Math.max(4, Math.round(sizePx)),
        showOnPlayer: gridType !== "gridless" ? true : activeScene.grid.showOnPlayer
      },
      updatedAt: new Date().toISOString()
    };
    updateWorkspaceCampaignDraft(nextCampaign, null);
    updateScene(nextScene, nextCampaign, nextScene);
  };

  const startMapCalibrationBoxCapture = () => {
    setMapCalibrationBox(null);
    setMapCalibrationBoxPicking(true);
    setMapCalibrationAssistantOpen(false);
    clearActiveCanvasTools();
  };

  const captureMapCalibrationBox = (box: MapCalibrationBox) => {
    setMapCalibrationBox(box);
    setMapCalibrationBoxPicking(false);
    setMapCalibrationAssistantOpen(true);
  };

  const cancelMapCalibrationBoxCapture = () => {
    setMapCalibrationBoxPicking(false);
    setMapCalibrationAssistantOpen(true);
  };

  const openSceneDialog = () => {
    const state = getCreateSceneNameDialogState();
    setNewSceneName(state.name);
    setSceneDialog(state.dialog);
  };

  const openFolderDialog = () => {
    const state = getCreateSceneFolderNameDialogState();
    setNewFolderName(state.name);
    setFolderDialog(state.dialog);
  };

  const openRenameDialog = (scene: CampaignSceneEntry) => {
    const state = getRenameSceneNameDialogState(scene);
    setOpenSceneMenuId(null);
    setNewSceneName(state.name);
    setSceneDialog(state.dialog);
  };

  const openRenameFolderDialog = (folder: CampaignSceneFolder) => {
    const state = getRenameSceneFolderNameDialogState(folder);
    setOpenFolderMenuId(null);
    setNewFolderName(state.name);
    setFolderDialog(state.dialog);
  };

  const openRenameFogShapeDialog = (shapeId: string, fallbackName: string) => {
    setNewFogShapeName(getSceneItemRenameName(activeScene, "fog-shape", shapeId, fallbackName));
    setFogShapeDialog({ shapeId });
  };

  const openRenameEnvironmentEffectDialog = (effectId: string, fallbackName: string) => {
    setNewEnvironmentEffectName(getSceneItemRenameName(activeScene, "environment-effect", effectId, fallbackName));
    setEnvironmentEffectDialog({ effectId });
  };

  const openRenameTokenDialog = (tokenId: string, fallbackName: string) => {
    setNewTokenName(getSceneItemRenameName(activeScene, "token", tokenId, fallbackName));
    setTokenDialog({ tokenId });
  };

  const openRenameTokenAssetDialog = (asset: Asset) => {
    const dialog = getTokenAssetRenameDialogState(asset);
    setNewTokenName(dialog.name);
    setTokenAssetDialog({ assetId: dialog.assetId });
  };

  const openDeleteTokenAssetDialog = (asset: Asset) =>
    run(async () => {
      if (!campaignPath || !campaign) {
        return;
      }
      const savedUsage = await window.localVtt.getTokenAssetUsage(campaignPath, asset.id);
      setTokenAssetToDelete(getTokenAssetDeleteDialogState(asset, savedUsage, campaign, sceneDrafts, activeScene));
    });

  const openFolderColorDialog = (folder: CampaignSceneFolder) => {
    setOpenFolderMenuId(null);
    setNewFolderColor(folder.color);
    setFolderColorDialog({ folderId: folder.id, folderName: folder.name });
  };

  const submitFolderName = () => {
    if (!campaign || !folderDialog) {
      return;
    }
    const now = new Date().toISOString();
    const nextCampaign = submitSceneFolderName(
      campaign,
      folderDialog.mode === "create"
        ? { mode: "create", folderId: crypto.randomUUID(), name: newFolderName }
        : { mode: "rename", folderId: folderDialog.folderId, name: newFolderName },
      now
    );
    if (!nextCampaign) {
      return;
    }
    updateCampaignDraft(nextCampaign);
    setFolderDialog(null);
  };

  const submitFogShapeName = () => {
    if (!activeScene || !fogShapeDialog) {
      return;
    }
    const nextScene = renameFogShape(activeScene, fogShapeDialog.shapeId, newFogShapeName);
    if (!nextScene) {
      return;
    }
    updateScene(nextScene);
    setFogShapeDialog(null);
  };

  const submitEnvironmentEffectName = () => {
    if (!activeScene || !environmentEffectDialog) {
      return;
    }
    const nextScene = renameEnvironmentEffect(activeScene, environmentEffectDialog.effectId, newEnvironmentEffectName);
    if (!nextScene) {
      return;
    }
    updateScene(nextScene);
    setEnvironmentEffectDialog(null);
  };

  const submitTokenName = () => {
    if (!activeScene || !tokenDialog) {
      return;
    }
    const nextScene = renameSceneToken(activeScene, tokenDialog.tokenId, newTokenName);
    if (!nextScene) {
      return;
    }
    updateScene(nextScene);
    setTokenDialog(null);
  };

  const submitTokenAssetName = () => {
    if (!campaign || !tokenAssetDialog) {
      return;
    }
    const nextCampaign = renameCampaignTokenAsset(campaign, tokenAssetDialog.assetId, newTokenName, new Date().toISOString());
    if (!nextCampaign) {
      return;
    }
    updateCampaignDraft(nextCampaign);
    setTokenAssetDialog(null);
  };

  const confirmDeleteTokenAsset = () =>
    run(async () => {
      if (!campaignPath || !tokenAssetToDelete) {
        return;
      }
      const deletedAssetId = tokenAssetToDelete.asset.id;
      const result = await window.localVtt.deleteTokenAsset(campaignPath, deletedAssetId);
      applySummary(result.campaignSummary, campaignDirty);
      const sceneUpdate = getTokenAssetDeleteSceneUpdate(sceneDrafts, activeScene, result.scenes, deletedAssetId, selectedTokenIds);
      setSceneDrafts((drafts) => getTokenAssetDeleteSceneUpdate(drafts, activeScene, result.scenes, deletedAssetId, selectedTokenIds).sceneDrafts);
      if (sceneUpdate.activeScene) {
        setActiveScene(sceneUpdate.activeScene);
        if (sceneUpdate.activeScene.id === playerSceneId) {
          updatePlayerSceneIfOpenInBackground(window.localVtt, result.campaignSummary.campaign, sceneUpdate.activeScene, playerViewSyncOptions);
        }
      }
      selectTokens(sceneUpdate.selectedTokenIds);
      setTokenAssetToDelete(null);
    });

  const submitFolderColor = () => {
    if (!campaign || !folderColorDialog) {
      return;
    }
    updateCampaignDraft(setSceneFolderColor(campaign, folderColorDialog.folderId, newFolderColor, new Date().toISOString()));
    setFolderColorDialog(null);
  };

  const moveFolder = (folderId: string, direction: "up" | "down") => {
    if (!campaign) {
      return;
    }
    updateCampaignDraft(moveSceneFolder(campaign, folderId, direction, new Date().toISOString()), false);
    setOpenFolderMenuId(null);
  };

  const openSceneColorDialog = (kind: SceneColorDialog["kind"]) => {
    if (!activeScene) {
      return;
    }
    setSceneColorDialog(getSceneColorDialogState(activeScene, kind));
  };

  const openTokenColorDialog = (tokenId: string, value: string, kind: "border" | "glow") => {
    setNewTokenBorderColor(value);
    setTokenColorDialog(getTokenColorDialogState(activeScene, tokenId, value, kind));
  };

  const updateSceneColorDraft = (value: string) => {
    setSceneColorDialog((dialog) => (dialog ? { ...dialog, value } : dialog));
  };

  const submitSceneColor = () => {
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
  };

  const submitTokenBorderColor = () => {
    if (!activeScene || !tokenColorDialog) {
      return;
    }
    updateScene(setSceneTokenColor(activeScene, tokenColorDialog.tokenId, newTokenBorderColor, tokenColorDialog.kind));
    setTokenColorDialog(null);
  };

  const submitSceneName = () =>
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
    });

  const openCampaignRenameDialog = () => {
    if (!campaign) {
      return;
    }
    setNewCampaignName(campaign.name);
    setCampaignNameDialogOpen(true);
  };

  const submitCampaignName = () => {
    if (!campaign) {
      return;
    }
    const nextCampaign = renameCampaign(campaign, newCampaignName, new Date().toISOString());
    if (!nextCampaign) {
      return;
    }
    updateCampaignDraft(nextCampaign);
    setCampaignNameDialogOpen(false);
  };

  const sendToPlayer = () =>
    run(async () => {
      if (!campaign || !activeScene) {
        return;
      }
      if (campaignPath && playerSceneId && playerSceneId !== activeScene.id) {
        const previousPlayerScene = sceneDrafts[playerSceneId] ?? (await window.localVtt.loadScene(campaignPath, playerSceneId));
        const pausedPreviousScene = getPreviousPlayerScenePauseUpdate({
          previousPlayerScene,
          previousPlayerSceneId: playerSceneId,
          nextPlayerSceneId: activeScene.id,
          updatedAt: new Date().toISOString()
        });
        if (pausedPreviousScene) {
          setSceneDrafts((drafts) => getSceneDraftsAfterPreviousPlayerScenePause(drafts, pausedPreviousScene));
          setDirtySceneIds((ids) => getDirtySceneIdsAfterPreviousPlayerScenePause(ids, pausedPreviousScene));
        }
      }
      const openResult = await window.localVtt.openPlayerView(getPlayerViewOpenOptions(campaign.playerDisplay));
      await sendSceneToPlayer(window.localVtt, campaign, activeScene, playerViewSyncOptions);
      applyPlayerViewModeState("scene", activeScene.id, false);
      const warning = getPlayerViewOpenWarning(openResult, campaign.playerDisplay);
      if (warning) {
        setError(warning);
      }
    });

  const setPlayerFullscreen = (fullscreen: boolean) =>
    run(async () => {
      await window.localVtt.setPlayerFullscreen(fullscreen);
      setPlayerMenuOpen(false);
    });

  const closePlayerView = () =>
    run(async () => {
      await window.localVtt.closePlayerView();
      applyPlayerViewModeState("scene");
    });

  const showPlayerHold = () =>
    run(async () => {
      await showDefaultPlayerHold();
      applyPlayerViewModeState("hold");
    });

  const showPlayerBlackout = () =>
    run(async () => {
      await sendPlayerBlackout();
      applyPlayerViewModeState("blackout");
    });

  const showPlayerTestPattern = async (gridMode: PlayerViewTestPattern["gridMode"], display: DisplayCalibration, cellSizePx: number) =>
    run(async () => {
      const openResult = await window.localVtt.openPlayerView(getPlayerViewOpenOptions(display));
      await window.localVtt.showPlayerTestPattern(getPlayerTestPatternState(gridMode, display, cellSizePx, displays));
      applyPlayerViewModeState("test-pattern");
      const warning = getPlayerViewOpenWarning(openResult, display);
      if (warning) {
        setError(warning);
      }
    });

  const showPlayerIdle = async () => {
    await showDefaultPlayerHold();
    applyPlayerViewModeState("hold");
  };

  const confirmDeleteScene = (scene: CampaignSceneEntry) =>
    run(async () => {
      const ok = await deleteScene(scene);
      if (shouldShowPlayerHoldAfterSceneDelete(scene.id, playerSceneId, ok)) {
        await showPlayerIdle();
      }
    });

  const toggleFolderCollapsed = (folderId: string) => {
    setExpandedFolderIds((ids) => toggleExpandedFolderId(ids, folderId));
  };

  useEffect(() => {
    setExpandedFolderIds((ids) => pruneExpandedFolderIds(ids, campaign?.sceneFolders));
  }, [campaign?.sceneFolders, campaign]);

  const toggleWorkspacePanel = (side: WorkspacePanelSide) => {
    setWorkspaceLayout((layout) => toggleWorkspacePanelLayout(layout, side));
  };

  const startPanelResize = (side: WorkspacePanelSide, event: ReactPointerEvent<HTMLButtonElement>) => {
    const resizePlan = getWorkspacePanelResizePlan(workspaceLayout, side, event.clientX);

    startWindowPointerDrag({
      startEvent: event,
      bodyClassName: "resizing-panels",
      onPointerMove: (moveEvent) => {
        setWorkspaceLayout((layout) => getResizedWorkspacePanelLayout(layout, resizePlan, moveEvent.clientX));
      }
    });
  };

  const resetPanelWidth = (side: WorkspacePanelSide) => {
    setWorkspaceLayout((layout) => resetWorkspacePanelWidth(layout, side));
  };

  const startTokenLibraryResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const resizePlan = getTokenLibraryResizePlan(tokenLibraryHeight, event.clientY);

    startWindowPointerDrag({
      startEvent: event,
      bodyClassName: "resizing-token-library",
      onPointerMove: (moveEvent) => {
        setTokenLibraryHeight(getResizedTokenLibraryHeight(resizePlan, moveEvent.clientY));
      }
    });
  };

  const resetTokenLibraryHeight = () => {
    setTokenLibraryHeight(DEFAULT_TOKEN_LIBRARY_HEIGHT);
  };

  const appShellPresentation = getWorkspaceShellPresentation(workspaceLayout, tokenLibraryHeight);
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
        onPruneUnreferencedAssets={() => setAssetPruneConfirmOpen(true)}
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
        <EnvironmentEffectEditorModal
          effect={environmentEffectEditorEffect}
          position={environmentEffectEditorPosition}
          size={environmentEffectEditorSize}
          onClose={() => setEnvironmentEffectEditorId(null)}
          onPositionChange={setEnvironmentEffectEditorPosition}
          onSizeChange={setEnvironmentEffectEditorSize}
          onAcidTuningChange={(acidTuning) => updateEnvironmentEffectAcidTuning(environmentEffectEditorEffect.id, acidTuning)}
          onAcidTuningReset={() => updateEnvironmentEffectAcidTuning(environmentEffectEditorEffect.id, getDefaultAcidEffectTuning())}
          onColdTuningChange={(coldTuning) => updateEnvironmentEffectColdTuning(environmentEffectEditorEffect.id, coldTuning)}
          onColdTuningReset={() => updateEnvironmentEffectColdTuning(environmentEffectEditorEffect.id, getDefaultColdEffectTuning())}
          onDarknessTuningChange={(darknessTuning) => updateEnvironmentEffectDarknessTuning(environmentEffectEditorEffect.id, darknessTuning)}
          onDarknessTuningReset={() => updateEnvironmentEffectDarknessTuning(environmentEffectEditorEffect.id, getDefaultDarknessEffectTuning())}
          onPoisonTuningChange={(poisonTuning) => updateEnvironmentEffectPoisonTuning(environmentEffectEditorEffect.id, poisonTuning)}
          onPoisonTuningReset={() => updateEnvironmentEffectPoisonTuning(environmentEffectEditorEffect.id, getDefaultPoisonEffectTuning())}
          onWaterTuningChange={(waterTuning) => updateEnvironmentEffectWaterTuning(environmentEffectEditorEffect.id, waterTuning)}
          onWaterTuningReset={() => updateEnvironmentEffectWaterTuning(environmentEffectEditorEffect.id, getDefaultWaterEffectTuning())}
          onLavaTuningChange={(lavaTuning) => updateEnvironmentEffectLavaTuning(environmentEffectEditorEffect.id, lavaTuning)}
          onLavaTuningReset={() => updateEnvironmentEffectLavaTuning(environmentEffectEditorEffect.id, getDefaultLavaEffectTuning())}
          onFireTuningChange={(fireTuning) => updateEnvironmentEffectFireTuning(environmentEffectEditorEffect.id, fireTuning)}
          onFireTuningReset={() => updateEnvironmentEffectFireTuning(environmentEffectEditorEffect.id, getDefaultFireEffectTuning())}
          onLightningTuningChange={(lightningTuning) => updateEnvironmentEffectLightningTuning(environmentEffectEditorEffect.id, lightningTuning)}
          onLightningTuningReset={() => updateEnvironmentEffectLightningTuning(environmentEffectEditorEffect.id, getDefaultLightningEffectTuning())}
          onArcaneTuningChange={(arcaneTuning) => updateEnvironmentEffectArcaneTuning(environmentEffectEditorEffect.id, arcaneTuning)}
          onArcaneTuningReset={() => updateEnvironmentEffectArcaneTuning(environmentEffectEditorEffect.id, getDefaultArcaneEffectTuning())}
          onChaosTuningChange={(chaosTuning) => updateEnvironmentEffectChaosTuning(environmentEffectEditorEffect.id, chaosTuning)}
          onChaosTuningReset={() => updateEnvironmentEffectChaosTuning(environmentEffectEditorEffect.id, getDefaultChaosEffectTuning())}
          onVoidTuningChange={(voidTuning) => updateEnvironmentEffectVoidTuning(environmentEffectEditorEffect.id, voidTuning)}
          onVoidTuningReset={() => updateEnvironmentEffectVoidTuning(environmentEffectEditorEffect.id, getDefaultVoidEffectTuning())}
          onNatureTuningChange={(natureTuning) => updateEnvironmentEffectNatureTuning(environmentEffectEditorEffect.id, natureTuning)}
          onNatureTuningReset={() => updateEnvironmentEffectNatureTuning(environmentEffectEditorEffect.id, getDefaultNatureEffectTuning())}
          onDistortionTuningChange={(distortionTuning) => updateEnvironmentEffectDistortionTuning(environmentEffectEditorEffect.id, distortionTuning)}
          onDistortionTuningReset={() => updateEnvironmentEffectDistortionTuning(environmentEffectEditorEffect.id, getDefaultDistortionEffectTuning())}
          onRadiantTuningChange={(radiantTuning) => updateEnvironmentEffectRadiantTuning(environmentEffectEditorEffect.id, radiantTuning)}
          onRadiantTuningReset={() => updateEnvironmentEffectRadiantTuning(environmentEffectEditorEffect.id, getDefaultRadiantEffectTuning())}
          onForceFieldTuningChange={(fieldTuning) => updateEnvironmentEffectForceFieldTuning(environmentEffectEditorEffect.id, fieldTuning)}
          onForceFieldTuningReset={() => updateEnvironmentEffectForceFieldTuning(environmentEffectEditorEffect.id, getDefaultForceFieldEffectTuning())}
          onShockwaveTuningChange={(shockwaveTuning) => updateEnvironmentEffectShockwaveTuning(environmentEffectEditorEffect.id, shockwaveTuning)}
          onShockwaveTuningReset={() => updateEnvironmentEffectShockwaveTuning(environmentEffectEditorEffect.id, getDefaultShockwaveEffectTuning())}
          onSmokeTuningChange={(smokeTuning) => updateEnvironmentEffectSmokeTuning(environmentEffectEditorEffect.id, smokeTuning)}
          onSmokeTuningReset={() => updateEnvironmentEffectSmokeTuning(environmentEffectEditorEffect.id, getDefaultSmokeEffectTuning())}
          onFogTuningChange={(fogTuning) => updateEnvironmentEffectFogTuning(environmentEffectEditorEffect.id, fogTuning)}
          onFogTuningReset={() => updateEnvironmentEffectFogTuning(environmentEffectEditorEffect.id, getDefaultFogEffectTuning())}
          onFeatherChange={(feather) => updateEnvironmentEffectFeather(environmentEffectEditorEffect.id, feather)}
          onEffectTypeChange={(effectType) => updateEnvironmentEffectType(environmentEffectEditorEffect.id, effectType)}
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
        mapReplacementPreview={mapReplacementPreview}
        tokenAssetToDelete={tokenAssetToDelete}
        confirmClearFogOpen={confirmClearFogOpen}
        campaign={campaign}
        activeScene={activeScene}
        mapAsset={mapAsset}
        mapCalibrationBox={mapCalibrationBox}
        playerSceneId={playerSceneId}
        dirtySceneIds={dirtySceneIds}
        displays={displays}
        newSceneName={newSceneName}
        newFolderName={newFolderName}
        newFogShapeName={newFogShapeName}
        newEnvironmentEffectName={newEnvironmentEffectName}
        newTokenName={newTokenName}
        newFolderColor={newFolderColor}
        newTokenBorderColor={newTokenBorderColor}
        newCampaignName={newCampaignName}
        onNewSceneNameChange={setNewSceneName}
        onNewFolderNameChange={setNewFolderName}
        onNewFogShapeNameChange={setNewFogShapeName}
        onNewEnvironmentEffectNameChange={setNewEnvironmentEffectName}
        onNewTokenNameChange={setNewTokenName}
        onNewFolderColorChange={setNewFolderColor}
        onNewTokenBorderColorChange={setNewTokenBorderColor}
        onNewCampaignNameChange={setNewCampaignName}
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
        onCancelMapReplacement={() => setMapReplacementPreview(null)}
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
          if (mapReplacementPreview) {
            void commitMapReplacement(mapReplacementPreview);
          }
        }}
        onConfirmDeleteTokenAsset={() => void confirmDeleteTokenAsset()}
        onConfirmClearFog={clearFogShapes}
      />
      {metadataRestoreOpen && campaignPath && (
        <MetadataBackupRestoreDialog
          campaignPath={campaignPath}
          onCancel={() => setMetadataRestoreOpen(false)}
          onOpenBackupsFolder={() => void openBackupsFolder()}
          onRestore={handleMetadataRestore}
          onError={(caught) => {
            logRendererError("LOCALVTT_METADATA_BACKUP_RESTORE_FAILED", caught);
            setError(formatUserFacingError(caught));
          }}
        />
      )}
      {campaignHealthOpen && <CampaignHealthDialog health={campaignHealth} onClose={() => setCampaignHealthOpen(false)} />}
      {assetPruneConfirmOpen && (
        <ConfirmDialog
          title="Prune Unreferenced Assets?"
          confirmLabel="Prune Assets"
          onCancel={() => setAssetPruneConfirmOpen(false)}
          onConfirm={() => {
            setAssetPruneConfirmOpen(false);
            void pruneUnreferencedAssets();
          }}
        >
          <p>
            This will remove {campaignHealth.unreferencedAssets.length} unreferenced asset
            {campaignHealth.unreferencedAssets.length === 1 ? "" : "s"} from the campaign and delete their unused files from the campaign folder.
          </p>
          <p>Referenced maps, tokens, player portraits, scene overlays, and turn-order assets will be kept.</p>
        </ConfirmDialog>
      )}
      {busyState && <CampaignBusyOverlay busyState={busyState} />}
      {thumbnailRegenerationResult && (
        <ThumbnailRegenerationResultDialog result={thumbnailRegenerationResult} onClose={() => setThumbnailRegenerationResult(null)} />
      )}
      {tokenAssetPromotionResult && (
        <TokenAssetPromotionResultDialog result={tokenAssetPromotionResult} onClose={() => setTokenAssetPromotionResult(null)} />
      )}
      {assetPruneResult && <AssetPruneResultDialog result={assetPruneResult} onClose={() => setAssetPruneResult(null)} />}
    </div>
  );
}

function getPlayerViewTargetDimensions(display: DisplayCalibration, displays: DisplayInfo[]): { width: number; height: number } {
  const selectedDisplay = displays.find((candidate) => candidate.id === display.selectedDisplayId);
  const width = selectedDisplay?.bounds.width ?? display.screenResolutionWidth;
  const height = selectedDisplay?.bounds.height ?? display.screenResolutionHeight;
  return {
    width: Math.max(1, width || 1920),
    height: Math.max(1, height || 1080)
  };
}
