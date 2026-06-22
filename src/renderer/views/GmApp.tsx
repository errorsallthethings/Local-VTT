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
  DEFAULT_DICE_SETTINGS,
  PLAYER_INDICATOR_THEMES,
  DEFAULT_SCENE_FOLDER_COLOR,
  DEFAULT_TOKEN_BORDER_COLOR,
  DEFAULT_VIDEO_PLAYBACK
} from "../../shared/localvtt";
import type {
  Asset,
  Campaign,
  CampaignSummary,
  CampaignSceneEntry,
  CampaignSceneFolder,
  DisplayCalibration,
  DiceSettings,
  EnvironmentEffectType,
  LiveTableEvent,
  Point,
  Scene,
  SquareCropRect,
  TokenPresentationDefaults
} from "../../shared/localvtt";
import { SceneCanvas } from "../components/SceneCanvas";
import { CampaignBusyOverlay } from "../components/modals/CampaignBusyOverlay";
import { EnvironmentEffectEditorModal } from "../components/layers";
import type { MapCalibrationBox } from "../components/settings/MapCalibrationAssistant";
import type { DisplayInfo } from "../components/settings/PlayerDisplayScalePanel";
import { ToolsMenu, type SelectorSelectionFilters } from "../components/tools";
import type { AcidEffectTuning, ArcaneEffectTuning, ChaosEffectTuning, ColdEffectTuning, DarknessEffectTuning, DistortionEffectTuning, FireEffectTuning, FogEffectTuning, ForceFieldEffectTuning, LavaEffectTuning, LightningEffectTuning, NatureEffectTuning, PoisonEffectTuning, RadiantEffectTuning, ShockwaveEffectTuning, SmokeEffectTuning, VoidEffectTuning, WaterEffectTuning } from "../canvas/effects";
import { applyMapCalibrationDraft, type MapCalibrationDraft } from "../lib/map";
import { TokenLibraryDrawer } from "../components/tokens/TokenLibraryDrawer";
import { TurnOrderModal } from "../components/turn-order/TurnOrderModal";
import { TurnOrderPanel } from "../components/turn-order/TurnOrderPanel";
import { VideoMapControls } from "../components/workspace/VideoMapControls";
import { WorkspaceTopbar } from "../components/workspace/WorkspaceTopbar";
import { useCampaignActions, type CampaignBusyState } from "../hooks/useCampaignActions";
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
import { usePlayerViewState } from "../hooks/usePlayerViewState";
import { useSceneEditingActions } from "../hooks/useSceneEditingActions";
import { useSceneSelection } from "../hooks/useSceneSelection";
import { buildAssetsById, buildAssetsByKind, buildSceneThumbnailAssets } from "../lib/assets";
import { moveSceneFolder } from "../lib/campaign";
import { getEffectiveDiceDisplayModes, rollDiceEvent, rollDiceExpression, type DiceType } from "../lib/dice";
import { loadDiceSettingsPreference, saveDiceSettingsPreference } from "../lib/dice";
import { loadImageDimensions } from "../lib/assets";
import { showDefaultPlayerHold, showPlayerBlackout as sendPlayerBlackout } from "../lib/player-view";
import { sendSceneToPlayer, updatePlayerSceneIfOpen } from "../lib/player-view";
import { removeLastDrawing, removeLastEnvironmentEffect, removeLastWeatherMask } from "../lib/scene";
import { patchSceneEnvironmentEffect, removeSelectedSceneItems, setSceneEnvironmentEffectType, setSelectedSceneItemsPlayerVisibility } from "../lib/scene";
import {
  addRecentCampaign,
  loadRecentCampaigns,
  removeRecentCampaign,
  saveRecentCampaigns,
  type RecentCampaign
} from "../lib/campaign";
import { createImportedToken } from "../lib/tokens";
import { getSelectedTokenAssetIds, mergeTokenAssetUsage, removeSceneTokensByAsset } from "../lib/tokens";
import { addTurnOrderEntry, createTurnOrderEntryFromToken, removeTurnOrderEntriesForPlayer, stopTurnOrder, updateTurnOrderEntriesForPlayer } from "../lib/turn-order";
import {
  COLLAPSED_RAIL_WIDTH,
  COMPACT_RIGHT_PANEL_WIDTH,
  DEFAULT_TOKEN_LIBRARY_HEIGHT,
  getWorkspacePanelWidth,
  loadTokenLibraryHeight,
  loadWorkspaceLayout,
  normalizeTokenLibraryHeight,
  resetPanelWidth as resetWorkspacePanelWidth,
  resizePanelWidth,
  saveTokenLibraryHeight,
  saveWorkspaceLayout,
  toggleWorkspacePanel as toggleWorkspacePanelLayout,
  type WorkspaceLayout,
  type WorkspacePanelSide
} from "../lib/workspace";
import { formatSaveStatus } from "../lib/workspace";
import {
  GmDialogs,
  type SceneColorDialog,
  type TokenCropDialogState,
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
  const workspace = useCampaignWorkspace();
  const {
    campaignPath,
    campaign,
    missingAssets,
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
  const [playersPanelOpen, setPlayersPanelOpen] = useState(false);
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
  const videoPlayback = activeScene?.videoPlayback ?? DEFAULT_VIDEO_PLAYBACK;
  const [diceSettingsPreference, setDiceSettingsPreference] = useState<DiceSettings>(() => loadDiceSettingsPreference());
  const diceSettings = useMemo<DiceSettings>(() => ({ ...DEFAULT_DICE_SETTINGS, ...(campaign?.diceSettings ?? diceSettingsPreference) }), [campaign?.diceSettings, diceSettingsPreference]);
  const diceSettingsDraftRef = useRef<DiceSettings>(diceSettings);
  const collapsedFolderIds = useMemo(
    () => new Set((campaign?.sceneFolders ?? []).filter((folder) => !expandedFolderIds.has(folder.id)).map((folder) => folder.id)),
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
    updateScene(setSelectedSceneItemsPlayerVisibility(activeScene, {
      tokenIds: selectedTokenIds,
      drawingIds: selectedDrawingIds,
      fogShapeIds: selectedFogShapeIds,
      weatherMaskIds: selectedWeatherMaskIds,
      environmentEffectId: selectedEnvironmentEffectId
    }, visibleInPlayer));
  };

  const deleteSelectedSceneItems = () => {
    if (!activeScene) {
      return;
    }
    updateScene(removeSelectedSceneItems(activeScene, {
      tokenIds: selectedTokenIds,
      drawingIds: selectedDrawingIds,
      fogShapeIds: selectedFogShapeIds,
      weatherMaskIds: selectedWeatherMaskIds,
      environmentEffectId: selectedEnvironmentEffectId
    }));
    clearSceneSelection();
  };

  const updateCampaignDraft = (nextCampaign: Campaign, syncActiveSceneToPlayer = true) => {
    updateWorkspaceCampaignDraft(nextCampaign, syncActiveSceneToPlayer && activeScene?.id === playerSceneId ? activeScene : null);
  };

  const updateDiceSettings = (patch: Partial<DiceSettings>) => {
    const nextDiceSettings = {
      ...diceSettingsDraftRef.current,
      ...patch
    };
    diceSettingsDraftRef.current = nextDiceSettings;
    if (!campaign) {
      setDiceSettingsPreference(nextDiceSettings);
      saveDiceSettingsPreference(nextDiceSettings);
      return;
    }
    updateCampaignDraft({
      ...campaign,
      diceSettings: nextDiceSettings,
      updatedAt: new Date().toISOString()
    });
  };

  const rollTableDie = (die: DiceType) => {
    const roll = rollDiceEvent(die);
    const diceDisplayModes = getEffectiveDiceDisplayModes(diceSettings);
    setError(null);
    emitLiveTableEvent({
      ...roll,
      id: crypto.randomUUID(),
      type: "dice",
      gmDiceDisplay: diceDisplayModes.gmDisplayMode,
      playerDiceDisplay: diceDisplayModes.playerDisplayMode,
      gmDiceSceneSize: diceSettings.gmSceneSize,
      playerDiceSceneSize: diceSettings.playerSceneSize,
      gmDicePanelEdge: diceSettings.gmPanelEdge,
      playerDicePanelEdge: diceSettings.playerPanelEdge,
      gmDicePanelFacing: diceSettings.gmPanelFacing,
      playerDicePanelFacing: diceSettings.playerPanelFacing,
      gmDicePanelPosition: diceSettings.gmPanelPosition,
      playerDicePanelPosition: diceSettings.playerPanelPosition,
      gmDicePanelAdvanced: diceDisplayModes.gmPanelAdvanced,
      playerDicePanelAdvanced: diceDisplayModes.playerPanelAdvanced,
      createdAt: Date.now()
    });
  };

  const rollTableExpression = (expression: string, rollLabel?: string) => {
    try {
      const roll = rollDiceExpression(expression);
      const trimmedLabel = rollLabel?.trim();
      const diceDisplayModes = getEffectiveDiceDisplayModes(diceSettings);
      setError(null);
      emitLiveTableEvent({
        ...roll,
        id: crypto.randomUUID(),
        type: "dice",
        ...(trimmedLabel ? { rollLabel: trimmedLabel } : {}),
        gmDiceDisplay: diceDisplayModes.gmDisplayMode,
        playerDiceDisplay: diceDisplayModes.playerDisplayMode,
        gmDiceSceneSize: diceSettings.gmSceneSize,
        playerDiceSceneSize: diceSettings.playerSceneSize,
        gmDicePanelEdge: diceSettings.gmPanelEdge,
        playerDicePanelEdge: diceSettings.playerPanelEdge,
        gmDicePanelFacing: diceSettings.gmPanelFacing,
        playerDicePanelFacing: diceSettings.playerPanelFacing,
        gmDicePanelPosition: diceSettings.gmPanelPosition,
        playerDicePanelPosition: diceSettings.playerPanelPosition,
        gmDicePanelAdvanced: diceDisplayModes.gmPanelAdvanced,
        playerDicePanelAdvanced: diceDisplayModes.playerPanelAdvanced,
        createdAt: Date.now()
      });
      return null;
    } catch (caught) {
      return caught instanceof Error ? caught.message : "Could not roll that dice expression.";
    }
  };

  const clearDiceRolls = () => {
    setError(null);
    emitLiveTableEvent({
      id: crypto.randomUUID(),
      type: "dice-clear",
      createdAt: Date.now()
    });
  };

  const refreshDisplays = useCallback(() =>
    run(async () => {
      setDisplays(await window.localVtt.getDisplays());
    }), [run]);

  const cancelTokenCrop = useCallback(() =>
    run(async () => {
      if (!campaignPath || !tokenCropDialog) {
        setTokenCropDialog(null);
        return;
      }
      const summary = await window.localVtt.discardTokenImport(campaignPath, tokenCropDialog.asset.id);
      applySummary(summary, campaignDirty);
      setTokenCropDialog(null);
    }), [applySummary, campaignDirty, campaignPath, run, setTokenCropDialog, tokenCropDialog]);

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
    confirmDeleteMapAsset,
    saveFolderScenes,
    duplicateFolder,
    duplicateScene,
    deleteScene,
    deleteFolder
  } = useCampaignActions({
    workspace,
    mapAssetToDelete,
    onBusyChange: setBusyState,
    onResetSceneLibraryUi: resetSceneLibraryUi,
    onCloseSceneMenu: () => setOpenSceneMenuId(null),
    onCloseFolderMenu: () => setOpenFolderMenuId(null),
    onCampaignOpened: handleCampaignOpened,
    onMapAssetDeleteHandled: () => setMapAssetToDelete(null),
    onSceneDeleteHandled: () => setSceneToDelete(null),
    onFolderDeleteHandled: () => setFolderToDelete(null),
    shouldSyncSceneToPlayer: (sceneId) => sceneId === playerSceneId
  });
  const saveBeforeCloseRef = useRef(saveCampaignBeforeClose);

  useEffect(() => {
    saveBeforeCloseRef.current = saveCampaignBeforeClose;
  }, [saveCampaignBeforeClose]);

  const {
    updateVideoPlayback,
    updateGrid,
    updateFog,
    undoFogShape,
    clearFogShapes,
    updateMapTransform,
    setLayerOrderLocked,
    moveLayer,
    fitGridToMapDimensions
  } = useSceneEditingActions({
    activeScene,
    mapAsset,
    run,
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

  const openBackupsFolder = () =>
    run(async () => {
      if (!campaignPath) {
        return;
      }
      await window.localVtt.openBackupsFolder(campaignPath);
    });

  const importToken = (mode: TokenCropDialogState["mode"] = "scene") =>
    run(async () => {
      if (!campaignPath || (mode === "scene" && !activeScene)) {
        return;
      }
      const result = await window.localVtt.importToken(campaignPath);
      if (!result) {
        return;
      }
      applySummary(result.campaignSummary, campaignDirty);
      setTokenCropDialog({ asset: result.asset, mode });
    });

  const addImportedTokenToScene = (asset: Asset, syncCampaign: Campaign | null = campaign, placementPoint: Point | null = gmCanvasCenter) => {
    if (!activeScene) {
      return;
    }
    const tokenId = crypto.randomUUID();
    const nextToken = createImportedToken(activeScene, asset, tokenId, placementPoint ?? undefined);
    updateScene(
      {
        ...activeScene,
        tokens: [...activeScene.tokens, nextToken],
        updatedAt: new Date().toISOString()
      },
      syncCampaign
    );
    selectTokens([tokenId]);
    setTokenCropDialog(null);
  };

  const addLibraryTokenToScene = (asset: Asset) => {
    addImportedTokenToScene(asset);
  };

  const addCampaignPlayer = () => {
    if (!campaign || campaign.players.length >= 7) {
      return;
    }
    updateCampaignDraft({
      ...campaign,
      players: [
        ...campaign.players,
        {
          id: crypto.randomUUID(),
          name: `Player ${campaign.players.length + 1}`,
          color: DEFAULT_TOKEN_BORDER_COLOR,
          indicatorTheme: PLAYER_INDICATOR_THEMES[0],
          defaultSeatEdge: "bottom",
          defaultSeatPosition: 0.5,
          visibleInPlayer: true
        }
      ],
      updatedAt: new Date().toISOString()
    });
  };

  const updateCampaignPlayer = (playerId: string, patch: Partial<Campaign["players"][number]>) => {
    if (!campaign) {
      return;
    }
    const updatedAt = new Date().toISOString();
    const players = campaign.players.map((player) => (player.id === playerId ? { ...player, ...patch } : player));
    const updatedPlayer = players.find((player) => player.id === playerId);
    const nextCampaign = { ...campaign, players, updatedAt };
    updateCampaignDraft(nextCampaign);
    if (activeScene && updatedPlayer && activeScene.turnOrder.entries.some((entry) => entry.playerId === playerId)) {
      updateScene(updateTurnOrderEntriesForPlayer(activeScene, updatedPlayer, updatedAt), nextCampaign);
    }
  };

  const deleteCampaignPlayer = (playerId: string) => {
    if (!campaign) {
      return;
    }
    const updatedAt = new Date().toISOString();
    const nextCampaign = {
      ...campaign,
      players: campaign.players.filter((player) => player.id !== playerId),
      updatedAt
    };
    updateCampaignDraft(nextCampaign);
    if (activeScene?.turnOrder.entries.some((entry) => entry.playerId === playerId)) {
      updateScene(removeTurnOrderEntriesForPlayer(activeScene, playerId, updatedAt), nextCampaign);
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
    updateCampaignDraft({
      ...campaign,
      assets: campaign.assets.map((candidate) =>
        candidate.id === tokenDefaultsDialog.assetId
          ? {
              ...candidate,
              tokenDefaults: tokenDefaultsDialog.draft
            }
          : candidate
      ),
      updatedAt: new Date().toISOString()
    });
    setTokenDefaultsDialog(null);
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

  const updatePlayerDisplay = (nextDisplay: DisplayCalibration) => {
    if (!campaign) {
      return;
    }
    const nextCampaign = {
      ...campaign,
      playerDisplay: nextDisplay,
      updatedAt: new Date().toISOString()
    };
    updateCampaignDraft(nextCampaign);
    if (activeScene) {
      void updatePlayerSceneIfOpen(window.localVtt, nextCampaign, activeScene, { showPlayerSeatIndicators: playersPanelOpen });
    }
  };

  const applyMapCalibration = (draft: MapCalibrationDraft) =>
    run(async () => {
      if (!activeScene) {
        return;
      }
      if (mapCalibrationBox) {
        updateScene(applyMapCalibrationDraft(activeScene, draft, { calibrationBox: mapCalibrationBox }));
      } else if (draft.alignGridToMap && mapAsset?.absolutePath && mapAsset.mediaType === "image") {
        const dimensions = await loadImageDimensions(window.localVtt.toAssetUrl(mapAsset.absolutePath));
        updateScene(applyMapCalibrationDraft(activeScene, draft, { imageDimensions: dimensions }));
      } else {
        updateScene(applyMapCalibrationDraft(activeScene, draft));
      }
      setMapCalibrationBox(null);
      setMapCalibrationAssistantOpen(false);
    });

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
    setNewSceneName("New Battle Map");
    setSceneDialog({ mode: "create" });
  };

  const openFolderDialog = () => {
    setNewFolderName("New Folder");
    setFolderDialog({ mode: "create" });
  };

  const openRenameDialog = (scene: CampaignSceneEntry) => {
    setOpenSceneMenuId(null);
    setNewSceneName(scene.name);
    setSceneDialog({ mode: "rename", sceneId: scene.id });
  };

  const openRenameFolderDialog = (folder: CampaignSceneFolder) => {
    setOpenFolderMenuId(null);
    setNewFolderName(folder.name);
    setFolderDialog({ mode: "rename", folderId: folder.id });
  };

  const openRenameFogShapeDialog = (shapeId: string, fallbackName: string) => {
    const shapeName = activeScene?.fog.shapes.find((shape) => shape.id === shapeId)?.name?.trim();
    setNewFogShapeName(shapeName || fallbackName);
    setFogShapeDialog({ shapeId });
  };

  const openRenameEnvironmentEffectDialog = (effectId: string, fallbackName: string) => {
    const effectName = activeScene?.environment.effects.find((effect) => effect.id === effectId)?.name?.trim();
    setNewEnvironmentEffectName(effectName || fallbackName);
    setEnvironmentEffectDialog({ effectId });
  };

  const openRenameTokenDialog = (tokenId: string, fallbackName: string) => {
    const tokenName = activeScene?.tokens.find((token) => token.id === tokenId)?.name?.trim();
    setNewTokenName(tokenName || fallbackName);
    setTokenDialog({ tokenId });
  };

  const openRenameTokenAssetDialog = (asset: Asset) => {
    setNewTokenName(asset.name || asset.originalFileName || "Token");
    setTokenAssetDialog({ assetId: asset.id });
  };

  const openDeleteTokenAssetDialog = (asset: Asset) =>
    run(async () => {
      if (!campaignPath || !campaign) {
        return;
      }
      const savedUsage = await window.localVtt.getTokenAssetUsage(campaignPath, asset.id);
      const usage = mergeTokenAssetUsage(savedUsage, campaign, sceneDrafts, activeScene, asset.id);
      setTokenAssetToDelete({ asset, usage });
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
    const name = newFolderName.trim();
    if (!name) {
      return;
    }

    const now = new Date().toISOString();
    const nextCampaign =
      folderDialog.mode === "create"
        ? {
            ...campaign,
            sceneFolders: [...campaign.sceneFolders, { id: crypto.randomUUID(), name, color: DEFAULT_SCENE_FOLDER_COLOR, createdAt: now }],
            updatedAt: now
          }
        : {
            ...campaign,
            sceneFolders: campaign.sceneFolders.map((folder) => (folder.id === folderDialog.folderId ? { ...folder, name } : folder)),
            updatedAt: now
          };
    updateCampaignDraft(nextCampaign);
    setFolderDialog(null);
  };

  const submitFogShapeName = () => {
    if (!activeScene || !fogShapeDialog) {
      return;
    }
    const name = newFogShapeName.trim();
    if (!name) {
      return;
    }
    updateFog({
      shapes: activeScene.fog.shapes.map((shape) => (shape.id === fogShapeDialog.shapeId ? { ...shape, name } : shape))
    });
    setFogShapeDialog(null);
  };

  const submitEnvironmentEffectName = () => {
    if (!activeScene || !environmentEffectDialog) {
      return;
    }
    const name = newEnvironmentEffectName.trim();
    if (!name) {
      return;
    }
    updateScene({
      ...activeScene,
      environment: {
        ...activeScene.environment,
        effects: activeScene.environment.effects.map((effect) => (effect.id === environmentEffectDialog.effectId ? { ...effect, name } : effect))
      },
      updatedAt: new Date().toISOString()
    });
    setEnvironmentEffectDialog(null);
  };

  const submitTokenName = () => {
    if (!activeScene || !tokenDialog) {
      return;
    }
    const name = newTokenName.trim();
    if (!name) {
      return;
    }
    updateScene({
      ...activeScene,
      tokens: activeScene.tokens.map((token) => (token.id === tokenDialog.tokenId ? { ...token, name } : token)),
      updatedAt: new Date().toISOString()
    });
    setTokenDialog(null);
  };

  const submitTokenAssetName = () => {
    if (!campaign || !tokenAssetDialog) {
      return;
    }
    const name = newTokenName.trim();
    if (!name) {
      return;
    }
    updateCampaignDraft({
      ...campaign,
      assets: campaign.assets.map((asset) => (asset.id === tokenAssetDialog.assetId ? { ...asset, name } : asset)),
      updatedAt: new Date().toISOString()
    });
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
      const changedScenesById = new Map(result.scenes.map((scene) => [scene.id, scene]));
      setSceneDrafts((drafts) => {
        const nextDrafts = { ...drafts };
        for (const [sceneId, draft] of Object.entries(nextDrafts)) {
          nextDrafts[sceneId] = removeSceneTokensByAsset(draft, deletedAssetId);
        }
        return nextDrafts;
      });
      const nextActiveScene =
        activeScene && (changedScenesById.has(activeScene.id) || activeScene.tokens.some((token) => token.assetId === deletedAssetId))
          ? removeSceneTokensByAsset(changedScenesById.get(activeScene.id) ?? activeScene, deletedAssetId)
          : activeScene;
      if (nextActiveScene) {
        setActiveScene(nextActiveScene);
        if (nextActiveScene.id === playerSceneId) {
          void updatePlayerSceneIfOpen(window.localVtt, result.campaignSummary.campaign, nextActiveScene, { showPlayerSeatIndicators: playersPanelOpen });
        }
      }
      selectTokens(nextActiveScene ? selectedTokenIds.filter((tokenId) => nextActiveScene.tokens.some((token) => token.id === tokenId)) : []);
      setTokenAssetToDelete(null);
    });

  const submitFolderColor = () => {
    if (!campaign || !folderColorDialog) {
      return;
    }
    updateCampaignDraft({
      ...campaign,
      sceneFolders: campaign.sceneFolders.map((folder) =>
        folder.id === folderColorDialog.folderId ? { ...folder, color: newFolderColor } : folder
      ),
      updatedAt: new Date().toISOString()
    });
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
    setSceneColorDialog({
      kind,
      title: kind === "fog" ? "Fog Color" : "Grid Color",
      value: kind === "fog" ? activeScene.fog.color : activeScene.grid.color
    });
  };

  const openTokenColorDialog = (tokenId: string, value: string, kind: "border" | "glow") => {
    const tokenName = activeScene?.tokens.find((token) => token.id === tokenId)?.name?.trim() || "Token";
    setNewTokenBorderColor(value);
    setTokenColorDialog({ tokenId, tokenName, value, kind });
  };

  const updateSceneColorDraft = (value: string) => {
    setSceneColorDialog((dialog) => (dialog ? { ...dialog, value } : dialog));
  };

  const submitSceneColor = () => {
    if (!sceneColorDialog) {
      return;
    }
    if (sceneColorDialog.kind === "fog") {
      updateFog({ color: sceneColorDialog.value });
    } else {
      updateGrid({ color: sceneColorDialog.value });
    }
    setSceneColorDialog(null);
  };

  const submitTokenBorderColor = () => {
    if (!activeScene || !tokenColorDialog) {
      return;
    }
    updateScene({
      ...activeScene,
      tokens: activeScene.tokens.map((token) =>
        token.id === tokenColorDialog.tokenId
          ? tokenColorDialog.kind === "glow"
            ? { ...token, glowColor: newTokenBorderColor }
            : { ...token, borderColor: newTokenBorderColor }
          : token
      ),
      updatedAt: new Date().toISOString()
    });
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
        setSceneDrafts((drafts) => {
          const draft = drafts[sceneDialog.sceneId];
          return draft ? { ...drafts, [sceneDialog.sceneId]: { ...draft, name } } : drafts;
        });
        if (activeScene?.id === sceneDialog.sceneId) {
          setActiveScene((scene) => (scene ? { ...scene, name } : result.scene));
        }
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
    const name = newCampaignName.trim();
    if (!name) {
      return;
    }
    updateCampaignDraft({ ...campaign, name, updatedAt: new Date().toISOString() });
    setCampaignNameDialogOpen(false);
  };

  const sendToPlayer = () =>
    run(async () => {
      if (!campaign || !activeScene) {
        return;
      }
      if (campaignPath && playerSceneId && playerSceneId !== activeScene.id) {
        const previousPlayerScene = sceneDrafts[playerSceneId] ?? (await window.localVtt.loadScene(campaignPath, playerSceneId));
        if (previousPlayerScene.turnOrder.active) {
          const pausedPreviousScene = stopTurnOrder(previousPlayerScene);
          setSceneDrafts((drafts) => ({ ...drafts, [pausedPreviousScene.id]: pausedPreviousScene }));
          setDirtySceneIds((ids) => new Set(ids).add(pausedPreviousScene.id));
        }
      }
      const openResult = await window.localVtt.openPlayerView({
        displayId: campaign.playerDisplay.selectedDisplayId,
        fullscreen: campaign.playerDisplay.openPlayerViewFullscreen
      });
      await sendSceneToPlayer(window.localVtt, campaign, activeScene, { showPlayerSeatIndicators: playersPanelOpen });
      setPlayerSceneId(activeScene.id);
      setPlayerDisplayMode("scene");
      if (!openResult.displayFound && campaign.playerDisplay.selectedDisplayLabel) {
        setError(`The saved Player View display (${campaign.playerDisplay.selectedDisplayLabel}) is not connected. Player View opened normally so you can move it manually.`);
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
      setPlayerSceneId(null);
      setPlayerDisplayMode("scene");
      setPlayerMenuOpen(false);
    });

  const showPlayerHold = () =>
    run(async () => {
      await showDefaultPlayerHold();
      setPlayerSceneId(null);
      setPlayerDisplayMode("hold");
      setPlayerMenuOpen(false);
    });

  const showPlayerBlackout = () =>
    run(async () => {
      await sendPlayerBlackout();
      setPlayerSceneId(null);
      setPlayerDisplayMode("blackout");
      setPlayerMenuOpen(false);
    });

  const showPlayerIdle = async () => {
    await showDefaultPlayerHold();
    setPlayerSceneId(null);
    setPlayerDisplayMode("hold");
    setPlayerMenuOpen(false);
  };

  const confirmDeleteScene = (scene: CampaignSceneEntry) =>
    run(async () => {
      const deletedPlayerScene = scene.id === playerSceneId;
      const ok = await deleteScene(scene);
      if (ok && deletedPlayerScene) {
        await showPlayerIdle();
      }
    });

  const toggleFolderCollapsed = (folderId: string) => {
    setExpandedFolderIds((ids) => {
      const nextIds = new Set(ids);
      if (nextIds.has(folderId)) {
        nextIds.delete(folderId);
      } else {
        nextIds.add(folderId);
      }
      return nextIds;
    });
  };

  useEffect(() => {
    setExpandedFolderIds((ids) => {
      if (!campaign) {
        return ids.size === 0 ? ids : new Set();
      }
      const folderIds = new Set(campaign.sceneFolders.map((folder) => folder.id));
      const nextIds = new Set([...ids].filter((folderId) => folderIds.has(folderId)));
      return nextIds.size === ids.size ? ids : nextIds;
    });
  }, [campaign?.sceneFolders, campaign]);

  const toggleWorkspacePanel = (side: WorkspacePanelSide) => {
    setWorkspaceLayout((layout) => toggleWorkspacePanelLayout(layout, side));
  };

  const startPanelResize = (side: WorkspacePanelSide, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = getWorkspacePanelWidth(workspaceLayout, side);

    const resizePanel = (moveEvent: PointerEvent) => {
      const delta = side === "left" ? moveEvent.clientX - startX : startX - moveEvent.clientX;
      setWorkspaceLayout((layout) => resizePanelWidth(layout, side, startWidth, delta));
    };
    const stopResize = () => {
      document.body.classList.remove("resizing-panels");
      window.removeEventListener("pointermove", resizePanel);
      window.removeEventListener("pointerup", stopResize);
    };

    document.body.classList.add("resizing-panels");
    window.addEventListener("pointermove", resizePanel);
    window.addEventListener("pointerup", stopResize, { once: true });
  };

  const resetPanelWidth = (side: WorkspacePanelSide) => {
    setWorkspaceLayout((layout) => resetWorkspacePanelWidth(layout, side));
  };

  const startTokenLibraryResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = tokenLibraryHeight;

    const resizeDrawer = (moveEvent: PointerEvent) => {
      setTokenLibraryHeight(normalizeTokenLibraryHeight(startHeight + startY - moveEvent.clientY));
    };
    const stopResize = () => {
      document.body.classList.remove("resizing-token-library");
      window.removeEventListener("pointermove", resizeDrawer);
      window.removeEventListener("pointerup", stopResize);
    };

    document.body.classList.add("resizing-token-library");
    window.addEventListener("pointermove", resizeDrawer);
    window.addEventListener("pointerup", stopResize, { once: true });
  };

  const resetTokenLibraryHeight = () => {
    setTokenLibraryHeight(DEFAULT_TOKEN_LIBRARY_HEIGHT);
  };

  const appShellStyle = {
    "--left-sidebar-width": `${workspaceLayout.leftCollapsed ? COLLAPSED_RAIL_WIDTH : workspaceLayout.leftWidth}px`,
    "--right-inspector-width": `${workspaceLayout.rightCollapsed ? COLLAPSED_RAIL_WIDTH : workspaceLayout.rightWidth}px`,
    "--token-library-expanded-height": `${tokenLibraryHeight}px`
  } as CSSProperties;
  const appShellClassName = [
    "app-shell",
    workspaceLayout.leftCollapsed ? "sidebar-collapsed" : "",
    workspaceLayout.rightCollapsed ? "inspector-collapsed" : "",
    !workspaceLayout.rightCollapsed && workspaceLayout.rightWidth <= COMPACT_RIGHT_PANEL_WIDTH ? "inspector-compact" : ""
  ]
    .filter(Boolean)
    .join(" ");

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
        onOpenBackupsFolder={() => void openBackupsFolder()}
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
        onFitGridToMapDimensions={fitGridToMapDimensions}
        onMoveLayer={moveLayer}
        onImportMap={importMap}
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
        playerDisplayDialogOpen={playerDisplayDialogOpen}
        mapCalibrationAssistantOpen={mapCalibrationAssistantOpen}
        sceneToDelete={sceneToDelete}
        folderToDelete={folderToDelete}
        mapAssetToDelete={mapAssetToDelete}
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
        onCancelPlayerDisplayDialog={() => setPlayerDisplayDialogOpen(false)}
        onCancelMapCalibrationAssistant={() => setMapCalibrationAssistantOpen(false)}
        onCancelSceneDelete={() => setSceneToDelete(null)}
        onCancelFolderDelete={() => setFolderToDelete(null)}
        onCancelMapAssetDelete={() => setMapAssetToDelete(null)}
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
        onUseDefaultTokenCrop={() => {
          if (!tokenCropDialog) {
            return;
          }
          if (tokenCropDialog.mode === "scene") {
            addImportedTokenToScene(tokenCropDialog.asset);
          } else {
            setTokenCropDialog(null);
          }
        }}
        onSubmitFolderColor={submitFolderColor}
        onUpdateSceneColorDraft={updateSceneColorDraft}
        onSubmitSceneColor={submitSceneColor}
        onSubmitTokenBorderColor={submitTokenBorderColor}
        onSubmitCampaignName={submitCampaignName}
        onUpdatePlayerDisplay={updatePlayerDisplay}
        onApplyMapCalibration={applyMapCalibration}
        onStartMapCalibrationBoxCapture={startMapCalibrationBoxCapture}
        onOpenPlayerViewSetupFromAssistant={() => {
          setMapCalibrationAssistantOpen(false);
          setPlayerDisplayDialogOpen(true);
        }}
        onRefreshDisplays={refreshDisplays}
        onConfirmDeleteScene={(scene) => void confirmDeleteScene(scene)}
        onConfirmDeleteFolder={deleteFolder}
        onConfirmDeleteMapAsset={() => void confirmDeleteMapAsset()}
        onConfirmDeleteTokenAsset={() => void confirmDeleteTokenAsset()}
        onConfirmClearFog={clearFogShapes}
      />
      {busyState && <CampaignBusyOverlay busyState={busyState} />}
    </div>
  );
}

