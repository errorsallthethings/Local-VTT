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
  DEFAULT_MAP_TRANSFORM,
  PLAYER_INDICATOR_THEMES,
  DEFAULT_SCENE_FOLDER_COLOR,
  DEFAULT_TOKEN_BORDER_COLOR,
  DEFAULT_VIDEO_PLAYBACK,
  isLiveTableEvent,
  isPlayerIdleState,
  isPlayerSceneProjection,
  projectSceneForPlayer
} from "../../shared/localvtt";
import type {
  Asset,
  Campaign,
  CampaignSummary,
  CampaignSceneEntry,
  CampaignSceneFolder,
  DisplayCalibration,
  DiceSettings,
  LiveTableEvent,
  Point,
  Scene,
  SquareCropRect,
  TokenPresentationDefaults
} from "../../shared/localvtt";
import { SceneCanvas } from "../components/SceneCanvas";
import type { MapCalibrationBox, MapCalibrationDraft } from "../components/settings/MapCalibrationAssistant";
import type { DisplayInfo } from "../components/settings/PlayerDisplayScalePanel";
import { ToolsMenu, type CanvasTool, type DrawingTemplateSize, type FogOperation, type WeatherMaskTool } from "../components/tools/ToolsMenu";
import type { DrawingTool } from "../canvas/drawingRenderer";
import { TokenLibraryDrawer } from "../components/tokens/TokenLibraryDrawer";
import { TurnOrderPanel } from "../components/turn-order/TurnOrderPanel";
import { VideoMapControls } from "../components/workspace/VideoMapControls";
import { WorkspaceTopbar } from "../components/workspace/WorkspaceTopbar";
import type { FogTool } from "../canvas/fogRenderer";
import { useCampaignActions, type CampaignBusyState } from "../hooks/useCampaignActions";
import { useCampaignWorkspace } from "../hooks/useCampaignWorkspace";
import { useDismissableMenu } from "../hooks/useDismissableMenu";
import { useSceneEditingActions } from "../hooks/useSceneEditingActions";
import { moveSceneFolder } from "../lib/campaignActions";
import { DICE_HISTORY_DURATION_MS, getEffectiveDiceDisplayModes, rollDiceEvent, rollDiceExpression, type DiceType } from "../lib/dice";
import {
  RECENT_CAMPAIGNS_STORAGE_KEY,
  addRecentCampaign,
  parseRecentCampaigns,
  removeRecentCampaign,
  type RecentCampaign
} from "../lib/recentCampaigns";
import { createImportedToken } from "../lib/tokenDefaults";
import { addTurnOrderEntry, createTurnOrderEntryFromToken, stopTurnOrder } from "../lib/turnOrder";
import {
  COLLAPSED_RAIL_WIDTH,
  COMPACT_RIGHT_PANEL_WIDTH,
  DEFAULT_TOKEN_LIBRARY_HEIGHT,
  TOKEN_LIBRARY_HEIGHT_STORAGE_KEY,
  WORKSPACE_LAYOUT_STORAGE_KEY,
  getWorkspacePanelWidth,
  loadTokenLibraryHeight,
  loadWorkspaceLayout,
  normalizeTokenLibraryHeight,
  resetPanelWidth as resetWorkspacePanelWidth,
  resizePanelWidth,
  toggleWorkspacePanel as toggleWorkspacePanelLayout,
  type WorkspaceLayout,
  type WorkspacePanelSide
} from "../lib/workspaceLayout";
import {
  GmDialogs,
  type FogShapeNameDialog,
  type FolderColorDialog,
  type FolderNameDialog,
  type SceneColorDialog,
  type TokenAssetDeleteDialog,
  type TokenAssetNameDialog,
  type TokenCropDialogState,
  type TokenDefaultsDialog,
  type SceneNameDialog,
  type TokenColorDialog,
  type TokenNameDialog
} from "./GmDialogs";
import { GmInspector } from "./GmInspector";
import { GmSidebar } from "./GmSidebar";

type PlayerDisplayMode = "scene" | "hold" | "blackout";
type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;

const MAX_DICE_ROLL_HISTORY = 100;
const DICE_SETTINGS_PREFERENCES_STORAGE_KEY = "localvtt.diceSettingsPreferences";

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
  const [sceneDialog, setSceneDialog] = useState<SceneNameDialog | null>(null);
  const [folderDialog, setFolderDialog] = useState<FolderNameDialog | null>(null);
  const [fogShapeDialog, setFogShapeDialog] = useState<FogShapeNameDialog | null>(null);
  const [tokenDialog, setTokenDialog] = useState<TokenNameDialog | null>(null);
  const [tokenCropDialog, setTokenCropDialog] = useState<TokenCropDialogState | null>(null);
  const [tokenAssetDialog, setTokenAssetDialog] = useState<TokenAssetNameDialog | null>(null);
  const [tokenDefaultsDialog, setTokenDefaultsDialog] = useState<TokenDefaultsDialog | null>(null);
  const [tokenColorDialog, setTokenColorDialog] = useState<TokenColorDialog | null>(null);
  const [folderColorDialog, setFolderColorDialog] = useState<FolderColorDialog | null>(null);
  const [sceneColorDialog, setSceneColorDialog] = useState<SceneColorDialog | null>(null);
  const [campaignNameDialogOpen, setCampaignNameDialogOpen] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState<CampaignSceneEntry | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<CampaignSceneFolder | null>(null);
  const [mapAssetToDelete, setMapAssetToDelete] = useState<Asset | null>(null);
  const [tokenAssetToDelete, setTokenAssetToDelete] = useState<TokenAssetDeleteDialog | null>(null);
  const [openSceneMenuId, setOpenSceneMenuId] = useState<string | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [playerMenuOpen, setPlayerMenuOpen] = useState(false);
  const [playerDisplayDialogOpen, setPlayerDisplayDialogOpen] = useState(false);
  const [mapCalibrationAssistantOpen, setMapCalibrationAssistantOpen] = useState(false);
  const [activeCanvasTool, setActiveCanvasTool] = useState<CanvasTool | null>(null);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool | null>(null);
  const [activeFogTool, setActiveFogTool] = useState<FogTool | null>(null);
  const [activeWeatherMaskTool, setActiveWeatherMaskTool] = useState<WeatherMaskTool | null>(null);
  const [fogOperation, setFogOperation] = useState<FogOperation>("reveal");
  const [drawingColor, setDrawingColor] = useState("#ff0000");
  const [drawingOpacity, setDrawingOpacity] = useState(1);
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(80);
  const [drawingTemplateSize, setDrawingTemplateSize] = useState<DrawingTemplateSize>("custom");
  const [confirmClearFogOpen, setConfirmClearFogOpen] = useState(false);
  const [newSceneName, setNewSceneName] = useState("New Battle Map");
  const [newFolderName, setNewFolderName] = useState("New Folder");
  const [newFogShapeName, setNewFogShapeName] = useState("");
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenBorderColor, setNewTokenBorderColor] = useState(DEFAULT_TOKEN_BORDER_COLOR);
  const [newFolderColor, setNewFolderColor] = useState(DEFAULT_SCENE_FOLDER_COLOR);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selectedFogShapeId, setSelectedFogShapeId] = useState<string | null>(null);
  const [selectedWeatherMaskId, setSelectedWeatherMaskId] = useState<string | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [mapCalibrationBox, setMapCalibrationBox] = useState<MapCalibrationBox | null>(null);
  const [mapCalibrationBoxPicking, setMapCalibrationBoxPicking] = useState(false);
  const [playerSceneId, setPlayerSceneId] = useState<string | null>(null);
  const [playerDisplayMode, setPlayerDisplayMode] = useState<PlayerDisplayMode>("scene");
  const [liveTableEvents, setLiveTableEvents] = useState<LiveTableEvent[]>([]);
  const [diceRollHistory, setDiceRollHistory] = useState<DiceRollEvent[]>([]);
  const [tokenLibraryExpanded, setTokenLibraryExpanded] = useState(false);
  const [playersPanelOpen, setPlayersPanelOpen] = useState(false);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set());
  const [gmCanvasCenter, setGmCanvasCenter] = useState<Point | null>(null);
  const [tokenLibraryHeight, setTokenLibraryHeight] = useState(() => loadTokenLibraryHeight());
  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayout>(() => loadWorkspaceLayout());
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>(() =>
    parseRecentCampaigns(window.localStorage.getItem(RECENT_CAMPAIGNS_STORAGE_KEY))
  );
  const [busyState, setBusyState] = useState<CampaignBusyState | null>(null);
  const skipNextPlayerSceneAutoSyncRef = useRef(false);

  const mapAsset = useMemo(() => {
    if (!campaign || !activeScene?.mapAssetId) {
      return null;
    }
    return campaign.assets.find((asset) => asset.id === activeScene.mapAssetId) ?? null;
  }, [activeScene?.mapAssetId, campaign]);
  const activeMapIsVideo = mapAsset?.mediaType === "video";
  const tokenAssets = useMemo(() => new Map((campaign?.assets ?? []).filter((asset) => asset.kind === "token").map((asset) => [asset.id, asset])), [campaign?.assets]);
  const tokenLibraryAssets = useMemo(() => [...tokenAssets.values()], [tokenAssets]);
  const videoPlayback = activeScene?.videoPlayback ?? DEFAULT_VIDEO_PLAYBACK;
  const [diceSettingsPreference, setDiceSettingsPreference] = useState<DiceSettings>(() => loadDiceSettingsPreference());
  const diceSettings = useMemo<DiceSettings>(() => ({ ...DEFAULT_DICE_SETTINGS, ...(campaign?.diceSettings ?? diceSettingsPreference) }), [campaign?.diceSettings, diceSettingsPreference]);
  const diceSettingsDraftRef = useRef<DiceSettings>(diceSettings);
  const collapsedFolderIds = useMemo(
    () => new Set((campaign?.sceneFolders ?? []).filter((folder) => !expandedFolderIds.has(folder.id)).map((folder) => folder.id)),
    [campaign?.sceneFolders, expandedFolderIds]
  );
  const sceneThumbnailAssets = useMemo(() => {
    const assetsById = new Map((campaign?.assets ?? []).map((asset) => [asset.id, asset]));
    return new Map(
      (campaign?.scenes ?? []).map((sceneEntry) => {
        const draftScene = sceneDrafts[sceneEntry.id] ?? (activeScene?.id === sceneEntry.id ? activeScene : null);
        const mapAssetId = draftScene?.mapAssetId ?? sceneEntry.mapAssetId;
        return [sceneEntry.id, mapAssetId ? (assetsById.get(mapAssetId) ?? null) : null];
      })
    );
  }, [activeScene, campaign?.assets, campaign?.scenes, sceneDrafts]);

  useEffect(() => {
    diceSettingsDraftRef.current = diceSettings;
  }, [diceSettings]);

  useEffect(() => {
    setMapCalibrationBox(null);
    setMapCalibrationBoxPicking(false);
  }, [activeScene?.id]);

  const updateScene = (nextScene: Scene, syncCampaign: Campaign | null = campaign, syncScene: Scene = nextScene) => {
    // Only sync the active edit to Player View when that same scene is already being shown to players.
    skipNextPlayerSceneAutoSyncRef.current = syncScene !== nextScene;
    updateWorkspaceScene(nextScene, nextScene.id === playerSceneId ? syncCampaign : null, syncScene);
  };

  const updateCanvasScene = (nextScene: Scene, syncScene: Scene = nextScene) => {
    updateScene(nextScene, campaign, syncScene);
  };

  const clearActiveCanvasTools = () => {
    setActiveCanvasTool(null);
    setActiveDrawingTool(null);
    setActiveFogTool(null);
    setActiveWeatherMaskTool(null);
  };

  const updateCampaignDraft = (nextCampaign: Campaign) => {
    updateWorkspaceCampaignDraft(nextCampaign, activeScene?.id === playerSceneId ? activeScene : null);
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

  const updateDiceRollHistory = useCallback((event: DiceRollEvent) => {
    setDiceRollHistory((history) => [event, ...history.filter((roll) => roll.id !== event.id)].slice(0, MAX_DICE_ROLL_HISTORY));
  }, []);

  const emitLiveTableEvent = (event: LiveTableEvent) => {
    setLiveTableEvents((events) => mergeLiveTableEvent(events, event));
    if (event.type === "dice") {
      updateDiceRollHistory(event);
    } else if (event.type === "dice-clear") {
      setDiceRollHistory([]);
    }
    void window.localVtt.sendLiveTableEvent(event);
  };

  useEffect(() => {
    const removeListener = window.localVtt.onLiveTableEvent((event) => {
      if (isLiveTableEvent(event)) {
        setLiveTableEvents((events) => mergeLiveTableEvent(events, event));
        if (event.type === "dice") {
          updateDiceRollHistory(event);
        } else if (event.type === "dice-clear") {
          setDiceRollHistory([]);
        }
      }
    });
    return removeListener;
  }, [updateDiceRollHistory]);

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

  const refreshDisplays = () =>
    run(async () => {
      setDisplays(await window.localVtt.getDisplays());
    });

  const cancelTokenCrop = useCallback(() =>
    run(async () => {
      if (!campaignPath || !tokenCropDialog) {
        setTokenCropDialog(null);
        return;
      }
      const summary = await window.localVtt.discardTokenImport(campaignPath, tokenCropDialog.asset.id);
      applySummary(summary, campaignDirty);
      setTokenCropDialog(null);
    }), [applySummary, campaignDirty, campaignPath, run, tokenCropDialog]);

  useEffect(() => {
    if (
      !sceneDialog &&
      !folderDialog &&
      !fogShapeDialog &&
      !tokenDialog &&
      !tokenCropDialog &&
      !tokenAssetDialog &&
      !tokenDefaultsDialog &&
      !folderColorDialog &&
      !tokenColorDialog &&
      !sceneColorDialog &&
      !campaignNameDialogOpen &&
      !playerDisplayDialogOpen &&
      !mapCalibrationAssistantOpen &&
      !mapCalibrationBoxPicking &&
      !sceneToDelete &&
      !folderToDelete &&
      !mapAssetToDelete &&
      !tokenAssetToDelete &&
      !confirmClearFogOpen &&
      !openSceneMenuId &&
      !openFolderMenuId &&
      !playerMenuOpen
    ) {
      return;
    }

    const closeModal = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSceneDialog(null);
        setFolderDialog(null);
        setFogShapeDialog(null);
        setTokenDialog(null);
        void cancelTokenCrop();
        setTokenAssetDialog(null);
        setTokenDefaultsDialog(null);
        setFolderColorDialog(null);
        setTokenColorDialog(null);
        setSceneColorDialog(null);
        setCampaignNameDialogOpen(false);
        setPlayerDisplayDialogOpen(false);
        setMapCalibrationAssistantOpen(false);
        setMapCalibrationBoxPicking(false);
        setSceneToDelete(null);
        setFolderToDelete(null);
        setMapAssetToDelete(null);
        setTokenAssetToDelete(null);
        setConfirmClearFogOpen(false);
        setOpenSceneMenuId(null);
        setOpenFolderMenuId(null);
        setPlayerMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeModal);
    return () => window.removeEventListener("keydown", closeModal);
  }, [
    campaignNameDialogOpen,
    cancelTokenCrop,
    confirmClearFogOpen,
    folderColorDialog,
    folderDialog,
    fogShapeDialog,
    tokenDialog,
    tokenCropDialog,
    tokenAssetDialog,
    tokenDefaultsDialog,
    tokenColorDialog,
    folderToDelete,
    mapAssetToDelete,
    tokenAssetToDelete,
    openFolderMenuId,
    openSceneMenuId,
    mapCalibrationAssistantOpen,
    mapCalibrationBoxPicking,
    playerDisplayDialogOpen,
    playerMenuOpen,
    sceneColorDialog,
    sceneDialog,
    sceneToDelete
  ]);

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
    setLiveTableEvents([]);
  }, [activeScene?.id]);

  useEffect(() => {
    if (liveTableEvents.length === 0) {
      return;
    }
    const cleanupTimer = window.setTimeout(() => {
      setLiveTableEvents((events) => filterActiveLiveTableEvents(events));
    }, 250);
    return () => window.clearTimeout(cleanupTimer);
  }, [liveTableEvents]);

  useEffect(() => {
    void refreshDisplays();
    // Displays are refreshed once on mount; later updates happen when the GM opens display settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedFogShapeId || activeScene?.fog.shapes.some((shape) => shape.id === selectedFogShapeId)) {
      return;
    }
    setSelectedFogShapeId(null);
  }, [activeScene?.fog.shapes, selectedFogShapeId]);

  useEffect(() => {
    if (!selectedWeatherMaskId || activeScene?.weather.masks.some((mask) => mask.id === selectedWeatherMaskId)) {
      return;
    }
    setSelectedWeatherMaskId(null);
  }, [activeScene?.weather.masks, selectedWeatherMaskId]);

  useEffect(() => {
    if (!selectedFogShapeId) {
      return;
    }
    const clearFogShapeSelection = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.closest(".fog-layer-shape-row") || target.closest(".scene-canvas-frame"))) {
        return;
      }
      setSelectedFogShapeId(null);
    };
    window.addEventListener("mousedown", clearFogShapeSelection);
    return () => window.removeEventListener("mousedown", clearFogShapeSelection);
  }, [selectedFogShapeId]);

  useEffect(() => {
    if (!selectedTokenId || activeScene?.tokens.some((token) => token.id === selectedTokenId)) {
      return;
    }
    setSelectedTokenId(null);
  }, [activeScene?.tokens, selectedTokenId]);

  useEffect(() => {
    if (!playerSceneId || campaign?.scenes.some((scene) => scene.id === playerSceneId)) {
      return;
    }
    void window.localVtt.showPlayerIdle("Waiting for Next Scene", "The GM is preparing the next map.", "hold");
    setPlayerSceneId(null);
    setPlayerDisplayMode("hold");
  }, [campaign?.scenes, playerSceneId]);

  useEffect(() => {
    let cancelled = false;
    void window.localVtt.getLastPlayerState().then((state) => {
      if (cancelled) {
        return;
      }
      if (isPlayerSceneProjection(state) && campaign?.scenes.some((scene) => scene.id === state.scene.id)) {
        setPlayerSceneId(state.scene.id);
        setPlayerDisplayMode("scene");
      } else if (isPlayerIdleState(state)) {
        setPlayerSceneId(null);
        setPlayerDisplayMode(state.variant ?? "hold");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [campaign?.scenes]);

  useEffect(() => {
    if (!campaign || !activeScene || activeScene.id !== playerSceneId || playerDisplayMode !== "scene") {
      return;
    }
    if (skipNextPlayerSceneAutoSyncRef.current) {
      skipNextPlayerSceneAutoSyncRef.current = false;
      return;
    }
    void window.localVtt.updatePlayerSceneIfOpen(projectSceneForPlayer(campaign, activeScene, { showPlayerSeatIndicators: playersPanelOpen }));
  }, [activeScene, campaign, playerDisplayMode, playerSceneId, playersPanelOpen]);

  useEffect(() => {
    window.localStorage.setItem(WORKSPACE_LAYOUT_STORAGE_KEY, JSON.stringify(workspaceLayout));
  }, [workspaceLayout]);

  useEffect(() => {
    window.localStorage.setItem(TOKEN_LIBRARY_HEIGHT_STORAGE_KEY, String(tokenLibraryHeight));
  }, [tokenLibraryHeight]);

  useEffect(() => {
    window.localStorage.setItem(RECENT_CAMPAIGNS_STORAGE_KEY, JSON.stringify(recentCampaigns));
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
    updateScene({
      ...activeScene,
      weather: {
        ...activeScene.weather,
        masks: activeScene.weather.masks.slice(0, -1)
      },
      updatedAt: new Date().toISOString()
    });
  };

  const undoDrawing = () => {
    if (!activeScene || activeScene.drawings.length === 0) {
      return;
    }
    updateScene({
      ...activeScene,
      drawings: activeScene.drawings.slice(0, -1),
      updatedAt: new Date().toISOString()
    });
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
    setSelectedTokenId(tokenId);
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
      updateScene(
        {
          ...activeScene,
          turnOrder: {
            ...activeScene.turnOrder,
            entries: activeScene.turnOrder.entries.map((entry) =>
              entry.playerId === playerId
                ? {
                    ...entry,
                    name: updatedPlayer.name,
                    assetId: updatedPlayer.assetId
                  }
                : entry
            )
          },
          updatedAt
        },
        nextCampaign
      );
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
      updateScene(
        {
          ...activeScene,
          turnOrder: {
            ...activeScene.turnOrder,
            entries: activeScene.turnOrder.entries.filter((entry) => entry.playerId !== playerId)
          },
          updatedAt
        },
        nextCampaign
      );
    }
  };

  const addSceneTokenToTurnOrder = (tokenId: string) => {
    if (!activeScene) {
      return;
    }
    const token = activeScene.tokens.find((candidate) => candidate.id === tokenId);
    if (!token || activeScene.turnOrder.entries.some((entry) => entry.tokenId === token.id)) {
      setSelectedTokenId(tokenId);
      return;
    }
    updateScene(addTurnOrderEntry(activeScene, createTurnOrderEntryFromToken(crypto.randomUUID(), token)));
    setSelectedTokenId(token.id);
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
      void window.localVtt.updatePlayerSceneIfOpen(projectSceneForPlayer(nextCampaign, activeScene, { showPlayerSeatIndicators: playersPanelOpen }));
    }
  };

  const applyMapCalibration = (draft: MapCalibrationDraft) =>
    run(async () => {
      if (!activeScene) {
        return;
      }
      const columns = Math.max(1, draft.mapGridColumns);
      const rows = Math.max(1, draft.mapGridRows);
      const boxGridPatch = getBoxCalibrationGridPatch(draft, mapCalibrationBox);
      if (boxGridPatch) {
        updateScene({
          ...activeScene,
          grid: {
            ...activeScene.grid,
            mapGridColumns: columns,
            mapGridRows: rows,
            ...boxGridPatch
          },
          mapTransform: {
            ...activeScene.mapTransform,
            fitMode: "manual"
          },
          updatedAt: new Date().toISOString()
        });
      } else if (draft.alignGridToMap && mapAsset?.absolutePath && mapAsset.mediaType === "image") {
        const dimensions = await loadImageDimensions(window.localVtt.toAssetUrl(mapAsset.absolutePath));
        const cellWidth = dimensions.width / columns;
        const cellHeight = dimensions.height / rows;
        updateScene({
          ...activeScene,
          grid: {
            ...activeScene.grid,
            mapGridColumns: columns,
            mapGridRows: rows,
            sizePx: Math.max(1, Math.round(((cellWidth + cellHeight) / 2) * 100) / 100),
            offsetX: 0,
            offsetY: 0
          },
          mapTransform: { ...DEFAULT_MAP_TRANSFORM },
          updatedAt: new Date().toISOString()
        });
      } else {
        updateScene({
          ...activeScene,
          grid: {
            ...activeScene.grid,
            mapGridColumns: columns,
            mapGridRows: rows
          },
          mapTransform: {
            ...activeScene.mapTransform,
            fitMode: draft.fitMode
          },
          updatedAt: new Date().toISOString()
        });
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
          void window.localVtt.updatePlayerSceneIfOpen(projectSceneForPlayer(result.campaignSummary.campaign, nextActiveScene, { showPlayerSeatIndicators: playersPanelOpen }));
        }
      }
      setSelectedTokenId((tokenId) => (nextActiveScene?.tokens.some((token) => token.id === tokenId) ? tokenId : null));
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
    updateCampaignDraft(moveSceneFolder(campaign, folderId, direction, new Date().toISOString()));
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
      await window.localVtt.sendSceneToPlayer(projectSceneForPlayer(campaign, activeScene, { showPlayerSeatIndicators: playersPanelOpen }));
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
      await window.localVtt.showPlayerIdle("Waiting for Next Scene", "The GM is preparing the next map.", "hold");
      setPlayerSceneId(null);
      setPlayerDisplayMode("hold");
      setPlayerMenuOpen(false);
    });

  const showPlayerBlackout = () =>
    run(async () => {
      await window.localVtt.showPlayerIdle("", "", "blackout");
      setPlayerSceneId(null);
      setPlayerDisplayMode("blackout");
      setPlayerMenuOpen(false);
    });

  const showPlayerIdle = async () => {
    await window.localVtt.showPlayerIdle("Waiting for Next Scene", "The GM is preparing the next map.", "hold");
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
        />

        <div className={error ? "error-banner" : "error-banner error-banner-empty"}>{error}</div>

        <div className="canvas-stage">
          {activeScene && (
            <ToolsMenu
              activeCanvasTool={activeCanvasTool}
              activeFogTool={activeFogTool}
              activeWeatherMaskTool={activeWeatherMaskTool}
              activeDrawingTool={activeDrawingTool}
              fogOperation={fogOperation}
              brushSize={activeScene.fog.brushSize}
              drawingColor={drawingColor}
              drawingOpacity={drawingOpacity}
              drawingStrokeWidth={drawingStrokeWidth}
              drawingTemplateSize={drawingTemplateSize}
              pingSize={activeScene.tableTools.pingSize}
              pingColor={activeScene.tableTools.pingColor}
              fogShapeCount={activeScene.fog.shapes.length}
              drawingCount={activeScene.drawings.length}
              weatherMaskCount={activeScene.weather.masks.length}
              weatherToolsEnabled={
                activeScene.weather.enabled &&
                (activeScene.weather.effects.rain.enabled || activeScene.weather.effects.fog.enabled || activeScene.weather.effects.snow.enabled || activeScene.weather.effects.sand.enabled)
              }
              onCanvasToolChange={setActiveCanvasTool}
              onFogToolChange={setActiveFogTool}
              onWeatherMaskToolChange={setActiveWeatherMaskTool}
              onDrawingToolChange={setActiveDrawingTool}
              onFogOperationChange={setFogOperation}
              onBrushSizeChange={(brushSize) => updateFog({ brushSize })}
              onDrawingColorChange={setDrawingColor}
              onDrawingOpacityChange={setDrawingOpacity}
              onDrawingStrokeWidthChange={setDrawingStrokeWidth}
              onDrawingTemplateSizeChange={setDrawingTemplateSize}
              onPingSizeChange={(pingSize) =>
                updateScene({
                  ...activeScene,
                  tableTools: { ...activeScene.tableTools, pingSize },
                  updatedAt: new Date().toISOString()
                })
              }
              onPingColorChange={(pingColor) =>
                updateScene({
                  ...activeScene,
                  tableTools: { ...activeScene.tableTools, pingColor },
                  updatedAt: new Date().toISOString()
                })
              }
              onUndoFogShape={undoFogShape}
              onUndoDrawing={undoDrawing}
              onUndoWeatherMask={undoWeatherMask}
              onRequestClearFog={() => setConfirmClearFogOpen(true)}
            />
          )}
          <SceneCanvas
            campaign={campaign}
            scene={activeScene}
            mode="gm"
            canvasTool={activeCanvasTool}
            drawingTool={activeDrawingTool}
            drawingColor={drawingColor}
            drawingOpacity={drawingOpacity}
            drawingStrokeWidth={drawingStrokeWidth}
            drawingTemplateSize={drawingTemplateSize}
            fogTool={activeFogTool}
            weatherMaskTool={activeWeatherMaskTool}
            liveTableEvents={liveTableEvents}
            selectedFogShapeId={selectedFogShapeId}
            selectedWeatherMaskId={selectedWeatherMaskId}
            selectedTokenId={selectedTokenId}
            onSceneChange={updateCanvasScene}
            onSelectToken={setSelectedTokenId}
            onSelectFogShape={setSelectedFogShapeId}
            onSelectWeatherMask={setSelectedWeatherMaskId}
            onAddTokenToTurnOrder={addSceneTokenToTurnOrder}
            onDropTokenAsset={dropLibraryTokenOnScene}
            onLiveTableEvent={emitLiveTableEvent}
            onDiceRollResolved={updateDiceRollHistory}
            onViewportCenterChange={setGmCanvasCenter}
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
          selectedTokenAssetId={activeScene?.tokens.find((token) => token.id === selectedTokenId)?.assetId}
          onSetTokenDefaults={openTokenDefaultsDialog}
          onRenameToken={openRenameTokenAssetDialog}
          onDeleteToken={(asset) => void openDeleteTokenAssetDialog(asset)}
          sidePanel={
            <TurnOrderPanel
              scene={activeScene}
              campaignPlayers={campaign?.players ?? []}
              tokenAssets={tokenAssets}
              canStartTurnOrder={Boolean(activeScene && activeScene.id === playerSceneId && playerDisplayMode === "scene")}
              onChangeScene={updateScene}
            />
          }
        />

        <footer className="statusbar">
          <span>Mouse wheel zooms. Drag pans. Scene data uses world/map coordinates.</span>
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
        selectedTokenId={selectedTokenId}
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
        onSelectFogShape={setSelectedFogShapeId}
        onSelectWeatherMask={setSelectedWeatherMaskId}
        onSelectToken={setSelectedTokenId}
        onRenameFogShape={openRenameFogShapeDialog}
        onRenameToken={openRenameTokenDialog}
        onOpenFogColor={() => openSceneColorDialog("fog")}
        onOpenGridColor={() => openSceneColorDialog("grid")}
        onOpenTokenColor={openTokenColorDialog}
      />

      <GmDialogs
        sceneDialog={sceneDialog}
        folderDialog={folderDialog}
        fogShapeDialog={fogShapeDialog}
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
        newTokenName={newTokenName}
        newFolderColor={newFolderColor}
        newTokenBorderColor={newTokenBorderColor}
        newCampaignName={newCampaignName}
        onNewSceneNameChange={setNewSceneName}
        onNewFolderNameChange={setNewFolderName}
        onNewFogShapeNameChange={setNewFogShapeName}
        onNewTokenNameChange={setNewTokenName}
        onNewFolderColorChange={setNewFolderColor}
        onNewTokenBorderColorChange={setNewTokenBorderColor}
        onNewCampaignNameChange={setNewCampaignName}
        onCancelSceneDialog={() => setSceneDialog(null)}
        onCancelFolderDialog={() => setFolderDialog(null)}
        onCancelFogShapeDialog={() => setFogShapeDialog(null)}
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

function CampaignBusyOverlay({ busyState }: { busyState: CampaignBusyState }) {
  const progress = busyState.total > 0 ? Math.min(100, Math.max(0, (busyState.current / busyState.total) * 100)) : 100;
  return (
    <div className="modal-backdrop busy-backdrop" role="status" aria-live="polite" aria-busy="true">
      <div className="modal busy-modal">
        <h2>{busyState.title}</h2>
        <p>{busyState.message}</p>
        <div className="busy-progress" aria-label={`${busyState.current} of ${busyState.total}`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        {busyState.total > 0 && (
          <span className="busy-progress-label">
            {busyState.current} of {busyState.total} scenes
          </span>
        )}
      </div>
    </div>
  );
}

const LIVE_TABLE_PING_DURATION_MS = 1600;
const LIVE_TABLE_LASER_POINT_LIFETIME_MS = 1100;
function mergeLiveTableEvent(events: LiveTableEvent[], event: LiveTableEvent): LiveTableEvent[] {
  const filteredEvents = filterActiveLiveTableEvents(events);
  if (event.type === "dice-clear") {
    return filteredEvents.filter((candidate) => candidate.type !== "dice");
  }
  return [event, ...filteredEvents.filter((candidate) => candidate.id !== event.id)];
}

function filterActiveLiveTableEvents(events: LiveTableEvent[]): LiveTableEvent[] {
  const now = Date.now();
  const activeEvents: LiveTableEvent[] = [];
  for (const event of events) {
    if (event.type === "ping") {
      if (now - event.createdAt <= LIVE_TABLE_PING_DURATION_MS) {
        activeEvents.push(event);
      }
    } else if (event.type === "dice") {
      if (now - event.createdAt <= DICE_HISTORY_DURATION_MS) {
        activeEvents.push(event);
      }
    } else if (event.type === "laser") {
      const points = event.points.filter((point) => now - point.createdAt <= LIVE_TABLE_LASER_POINT_LIFETIME_MS);
      if (points.length > 0) {
        activeEvents.push({ ...event, points });
      }
    }
  }
  return activeEvents;
}

function formatSaveStatus({
  dirtySceneCount,
  campaignDirty,
  saveState
}: {
  dirtySceneCount: number;
  campaignDirty: boolean;
  saveState: string;
}): string {
  const parts = [];
  if (dirtySceneCount > 0) {
    parts.push(`Unsaved scenes: ${dirtySceneCount}`);
  }
  if (campaignDirty) {
    parts.push("Unsaved campaign changes");
  }
  return parts.length > 0 ? parts.join(" | ") : formatCleanSaveState(saveState);
}

function formatCleanSaveState(saveState: string): string {
  if (saveState === "idle") {
    return "Saved";
  }
  return saveState[0].toUpperCase() + saveState.slice(1);
}

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Unable to read the selected map image dimensions."));
    image.src = src;
  });
}

function getBoxCalibrationGridPatch(draft: MapCalibrationDraft, box: MapCalibrationBox | null): { sizePx: number; offsetX: number; offsetY: number } | null {
  if (!box || draft.boxColumns <= 0 || draft.boxRows <= 0) {
    return null;
  }
  const cellWidth = box.width / draft.boxColumns;
  const cellHeight = box.height / draft.boxRows;
  if (!Number.isFinite(cellWidth) || !Number.isFinite(cellHeight) || cellWidth <= 0 || cellHeight <= 0) {
    return null;
  }
  const sizePx = Math.max(1, Math.round(((cellWidth + cellHeight) / 2) * 100) / 100);
  return {
    sizePx,
    offsetX: positiveModulo(box.x, sizePx),
    offsetY: positiveModulo(box.y, sizePx)
  };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function loadDiceSettingsPreference(): DiceSettings {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DICE_SETTINGS_PREFERENCES_STORAGE_KEY) ?? "null") as Partial<DiceSettings> | null;
    return normalizeDiceSettingsPreference(parsed);
  } catch {
    return { ...DEFAULT_DICE_SETTINGS };
  }
}

function saveDiceSettingsPreference(settings: DiceSettings): void {
  try {
    window.localStorage.setItem(DICE_SETTINGS_PREFERENCES_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Preference persistence is helpful, but dice controls should still work if storage is unavailable.
  }
}

function normalizeDiceSettingsPreference(settings?: Partial<DiceSettings> | null): DiceSettings {
  return {
    ...DEFAULT_DICE_SETTINGS,
    gmDisplayMode: isDiceDisplayModePreference(settings?.gmDisplayMode) ? settings.gmDisplayMode : DEFAULT_DICE_SETTINGS.gmDisplayMode,
    playerDisplayMode: isDiceDisplayModePreference(settings?.playerDisplayMode) ? settings.playerDisplayMode : DEFAULT_DICE_SETTINGS.playerDisplayMode,
    sceneRollEnabled: typeof settings?.sceneRollEnabled === "boolean" ? settings.sceneRollEnabled : DEFAULT_DICE_SETTINGS.sceneRollEnabled,
    sceneRollTarget: settings?.sceneRollTarget === "gm" || settings?.sceneRollTarget === "player" ? settings.sceneRollTarget : DEFAULT_DICE_SETTINGS.sceneRollTarget,
    gmSceneSize: isDiceSceneSizePreference(settings?.gmSceneSize) ? settings.gmSceneSize : DEFAULT_DICE_SETTINGS.gmSceneSize,
    playerSceneSize: isDiceSceneSizePreference(settings?.playerSceneSize) ? settings.playerSceneSize : DEFAULT_DICE_SETTINGS.playerSceneSize,
    gmPanelEdge: isDicePanelEdgePreference(settings?.gmPanelEdge) ? settings.gmPanelEdge : DEFAULT_DICE_SETTINGS.gmPanelEdge,
    playerPanelEdge: isDicePanelEdgePreference(settings?.playerPanelEdge) ? settings.playerPanelEdge : DEFAULT_DICE_SETTINGS.playerPanelEdge,
    gmPanelFacing: settings?.gmPanelFacing === "inward" || settings?.gmPanelFacing === "outward" ? settings.gmPanelFacing : DEFAULT_DICE_SETTINGS.gmPanelFacing,
    playerPanelFacing: settings?.playerPanelFacing === "inward" || settings?.playerPanelFacing === "outward" ? settings.playerPanelFacing : DEFAULT_DICE_SETTINGS.playerPanelFacing,
    gmPanelPosition: clampUnitPreference(settings?.gmPanelPosition, DEFAULT_DICE_SETTINGS.gmPanelPosition),
    playerPanelPosition: clampUnitPreference(settings?.playerPanelPosition, DEFAULT_DICE_SETTINGS.playerPanelPosition),
    gmPanelAdvanced: typeof settings?.gmPanelAdvanced === "boolean" ? settings.gmPanelAdvanced : DEFAULT_DICE_SETTINGS.gmPanelAdvanced,
    playerPanelAdvanced: typeof settings?.playerPanelAdvanced === "boolean" ? settings.playerPanelAdvanced : DEFAULT_DICE_SETTINGS.playerPanelAdvanced
  };
}

function isDiceDisplayModePreference(value: unknown): value is DiceSettings["gmDisplayMode"] {
  return value === "results" || value === "panel" || value === "scene" || value === "scene-result" || value === "hidden";
}

function isDiceSceneSizePreference(value: unknown): value is DiceSettings["gmSceneSize"] {
  return value === "xs" || value === "sm" || value === "md" || value === "lg" || value === "xl";
}

function isDicePanelEdgePreference(value: unknown): value is DiceSettings["gmPanelEdge"] {
  return value === "top" || value === "right" || value === "bottom" || value === "left";
}

function clampUnitPreference(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
}

function removeSceneTokensByAsset(scene: Scene, assetId: string): Scene {
  if (!scene.tokens.some((token) => token.assetId === assetId)) {
    return scene;
  }
  return {
    ...scene,
    tokens: scene.tokens.filter((token) => token.assetId !== assetId),
    updatedAt: new Date().toISOString()
  };
}

function mergeTokenAssetUsage(
  savedUsage: Array<{ sceneId: string; sceneName: string; count: number }>,
  campaign: Campaign,
  sceneDrafts: Record<string, Scene>,
  activeScene: Scene | null,
  assetId: string
): Array<{ sceneId: string; sceneName: string; count: number }> {
  const sceneOrder = new Map(campaign.scenes.map((scene, index) => [scene.id, index]));
  const sceneNames = new Map(campaign.scenes.map((scene) => [scene.id, scene.name]));
  const usageByScene = new Map(savedUsage.map((usage) => [usage.sceneId, usage]));
  const localScenes = new Map(Object.entries(sceneDrafts));
  if (activeScene) {
    localScenes.set(activeScene.id, activeScene);
  }

  for (const [sceneId, scene] of localScenes) {
    const count = scene.tokens.filter((token) => token.assetId === assetId).length;
    if (count > 0) {
      usageByScene.set(sceneId, {
        sceneId,
        sceneName: sceneNames.get(sceneId) ?? scene.name,
        count
      });
    } else {
      usageByScene.delete(sceneId);
    }
  }

  return [...usageByScene.values()].sort((a, b) => (sceneOrder.get(a.sceneId) ?? Number.MAX_SAFE_INTEGER) - (sceneOrder.get(b.sceneId) ?? Number.MAX_SAFE_INTEGER));
}
