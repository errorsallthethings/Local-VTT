import { type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useState } from "react";
import {
  FilePlus,
  FolderPlus,
  GripVertical,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Unlock
} from "lucide-react";
import { DEFAULT_SCENE_FOLDER_COLOR, DEFAULT_VIDEO_PLAYBACK } from "../../shared/localvtt";
import type {
  Asset,
  Campaign,
  CampaignSceneEntry,
  CampaignSceneFolder,
  DisplayCalibration,
  FogSettings,
  GridSettings,
  MapTransform,
  Scene,
  VideoPlaybackSettings
} from "../../shared/localvtt";
import { CampaignPanel } from "../components/campaign/CampaignPanel";
import { ColorPickerField } from "../components/controls/ColorPickerField";
import { LayerPanel } from "../components/layers/LayerPanel";
import { ConfirmDialog } from "../components/modals/ConfirmDialog";
import { NameDialog } from "../components/modals/NameDialog";
import { SettingsModal } from "../components/modals/SettingsModal";
import { SceneCanvas } from "../components/SceneCanvas";
import { SceneLibraryPanel } from "../components/scenes/SceneLibraryPanel";
import { MeasurementPanel } from "../components/settings/MeasurementPanel";
import { PlayerDisplayScalePanel, type DisplayInfo } from "../components/settings/PlayerDisplayScalePanel";
import { PlayerViewDisplayPanel } from "../components/settings/PlayerViewDisplayPanel";
import { ToolsMenu, type FogOperation } from "../components/tools/ToolsMenu";
import { GmSettingsMenu } from "../components/workspace/GmSettingsMenu";
import { WorkspaceTopbar } from "../components/workspace/WorkspaceTopbar";
import type { FogTool } from "../canvas/fogRenderer";
import { useCampaignActions } from "../hooks/useCampaignActions";
import { useCampaignWorkspace } from "../hooks/useCampaignWorkspace";
import { moveSceneFolder } from "../lib/campaignActions";

type SceneNameDialog = { mode: "create" } | { mode: "rename"; sceneId: string };
type FolderNameDialog = { mode: "create" } | { mode: "rename"; folderId: string };
type FolderColorDialog = { folderId: string; folderName: string };
type SceneColorDialog = { kind: "fog" | "grid"; title: string; value: string };
type WorkspaceLayout = {
  leftWidth: number;
  rightWidth: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
};

const WORKSPACE_LAYOUT_STORAGE_KEY = "localvtt.gmWorkspaceLayout";
const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayout = {
  leftWidth: 280,
  rightWidth: 330,
  leftCollapsed: false,
  rightCollapsed: false
};
const MIN_LEFT_PANEL_WIDTH = 260;
const MIN_RIGHT_PANEL_WIDTH = 250;
const COMPACT_RIGHT_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 520;
const COLLAPSED_RAIL_WIDTH = 44;

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
    campaignDirty,
    saveState,
    error,
    setError,
    dirtyCount,
    hasUnsavedChanges,
    run,
    applySummary,
    setSceneClean,
    updateScene,
    updateCampaignDraft
  } = workspace;
  const [sceneDialog, setSceneDialog] = useState<SceneNameDialog | null>(null);
  const [folderDialog, setFolderDialog] = useState<FolderNameDialog | null>(null);
  const [folderColorDialog, setFolderColorDialog] = useState<FolderColorDialog | null>(null);
  const [sceneColorDialog, setSceneColorDialog] = useState<SceneColorDialog | null>(null);
  const [campaignNameDialogOpen, setCampaignNameDialogOpen] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState<CampaignSceneEntry | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<CampaignSceneFolder | null>(null);
  const [mapAssetToDelete, setMapAssetToDelete] = useState<Asset | null>(null);
  const [openSceneMenuId, setOpenSceneMenuId] = useState<string | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [playerMenuOpen, setPlayerMenuOpen] = useState(false);
  const [gmSettingsOpen, setGmSettingsOpen] = useState(false);
  const [playerDisplayDialogOpen, setPlayerDisplayDialogOpen] = useState(false);
  const [playerViewDisplayDialogOpen, setPlayerViewDisplayDialogOpen] = useState(false);
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
  const [activeFogTool, setActiveFogTool] = useState<FogTool | null>(null);
  const [fogOperation, setFogOperation] = useState<FogOperation>("reveal");
  const [confirmClearFogOpen, setConfirmClearFogOpen] = useState(false);
  const [newSceneName, setNewSceneName] = useState("New Battle Map");
  const [newFolderName, setNewFolderName] = useState("New Folder");
  const [newFolderColor, setNewFolderColor] = useState(DEFAULT_SCENE_FOLDER_COLOR);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayout>(() => loadWorkspaceLayout());

  const mapAsset = useMemo(() => {
    if (!campaign || !activeScene?.mapAssetId) {
      return null;
    }
    return campaign.assets.find((asset) => asset.id === activeScene.mapAssetId) ?? null;
  }, [activeScene?.mapAssetId, campaign]);
  const activeMapIsVideo = mapAsset?.mediaType === "video";
  const videoPlayback = activeScene?.videoPlayback ?? DEFAULT_VIDEO_PLAYBACK;
  const collapsedFolderIds = useMemo(() => new Set(campaign?.sceneLibrary.collapsedFolderIds ?? []), [campaign?.sceneLibrary.collapsedFolderIds]);
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

  const refreshDisplays = () =>
    run(async () => {
      setDisplays(await window.localVtt.getDisplays());
    });

  useEffect(() => {
    if (
      !sceneDialog &&
      !folderDialog &&
      !folderColorDialog &&
      !sceneColorDialog &&
      !campaignNameDialogOpen &&
      !playerDisplayDialogOpen &&
      !playerViewDisplayDialogOpen &&
      !measurementDialogOpen &&
      !sceneToDelete &&
      !folderToDelete &&
      !mapAssetToDelete &&
      !confirmClearFogOpen &&
      !openSceneMenuId &&
      !openFolderMenuId &&
      !playerMenuOpen &&
      !gmSettingsOpen
    ) {
      return;
    }

    const closeModal = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSceneDialog(null);
        setFolderDialog(null);
        setFolderColorDialog(null);
        setSceneColorDialog(null);
        setCampaignNameDialogOpen(false);
        setPlayerDisplayDialogOpen(false);
        setPlayerViewDisplayDialogOpen(false);
        setMeasurementDialogOpen(false);
        setSceneToDelete(null);
        setFolderToDelete(null);
        setMapAssetToDelete(null);
        setConfirmClearFogOpen(false);
        setOpenSceneMenuId(null);
        setOpenFolderMenuId(null);
        setPlayerMenuOpen(false);
        setGmSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", closeModal);
    return () => window.removeEventListener("keydown", closeModal);
  }, [
    campaignNameDialogOpen,
    confirmClearFogOpen,
    folderColorDialog,
    folderDialog,
    folderToDelete,
    gmSettingsOpen,
    mapAssetToDelete,
    measurementDialogOpen,
    openFolderMenuId,
    openSceneMenuId,
    playerDisplayDialogOpen,
    playerViewDisplayDialogOpen,
    playerMenuOpen,
    sceneColorDialog,
    sceneDialog,
    sceneToDelete
  ]);

  useEffect(() => {
    void refreshDisplays();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(WORKSPACE_LAYOUT_STORAGE_KEY, JSON.stringify(workspaceLayout));
  }, [workspaceLayout]);

  const resetSceneLibraryUi = () => {
    setOpenSceneMenuId(null);
    setOpenFolderMenuId(null);
  };

  const {
    createCampaign,
    openCampaign,
    loadScene,
    moveSceneToFolder,
    saveSceneById,
    saveCampaign,
    importMap,
    confirmDeleteMapAsset,
    saveFolderScenes,
    deleteScene,
    deleteFolder
  } = useCampaignActions({
    workspace,
    mapAssetToDelete,
    onResetSceneLibraryUi: resetSceneLibraryUi,
    onCloseSceneMenu: () => setOpenSceneMenuId(null),
    onCloseFolderMenu: () => setOpenFolderMenuId(null),
    onMapAssetDeleteHandled: () => setMapAssetToDelete(null),
    onSceneDeleteHandled: () => setSceneToDelete(null),
    onFolderDeleteHandled: () => setFolderToDelete(null)
  });

  const updateVideoPlayback = (patch: Partial<VideoPlaybackSettings>) => {
    if (!activeScene) {
      return;
    }
    updateScene({
      ...activeScene,
      videoPlayback: { ...DEFAULT_VIDEO_PLAYBACK, ...(activeScene.videoPlayback ?? {}), ...patch },
      updatedAt: new Date().toISOString()
    });
  };

  const updateGrid = (patch: Partial<GridSettings>) => {
    if (!activeScene) {
      return;
    }
    updateScene({
      ...activeScene,
      grid: { ...activeScene.grid, ...patch },
      updatedAt: new Date().toISOString()
    });
  };

  const updateFog = (patch: Partial<FogSettings>) => {
    if (!activeScene) {
      return;
    }
    updateScene({
      ...activeScene,
      fog: { ...activeScene.fog, ...patch },
      updatedAt: new Date().toISOString()
    });
  };

  const undoFogShape = () => {
    if (!activeScene || activeScene.fog.shapes.length === 0) {
      return;
    }
    updateFog({ shapes: activeScene.fog.shapes.slice(0, -1) });
  };

  const clearFogShapes = () => {
    updateFog({ shapes: [] });
    setConfirmClearFogOpen(false);
  };

  const updateMeasurement = (patch: Partial<GridSettings["measurement"]>) => {
    if (!activeScene) {
      return;
    }
    updateGrid({
      measurement: { ...activeScene.grid.measurement, ...patch }
    });
  };

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
      void window.localVtt.updatePlayerSceneIfOpen(nextCampaign, activeScene);
    }
  };

  const updateMapTransform = (patch: Partial<MapTransform>) => {
    if (!activeScene) {
      return;
    }
    updateScene({
      ...activeScene,
      mapTransform: { ...activeScene.mapTransform, ...patch },
      updatedAt: new Date().toISOString()
    });
  };

  const setLayerOrderLocked = (locked: boolean) => {
    if (!activeScene) {
      return;
    }
    updateScene({
      ...activeScene,
      layerOrderLocked: locked,
      updatedAt: new Date().toISOString()
    });
  };

  const moveLayer = (layerId: string, direction: "up" | "down") => {
    if (!activeScene) {
      return;
    }
    const sortedLayers = [...activeScene.layers].sort((a, b) => b.order - a.order);
    const currentIndex = sortedLayers.findIndex((layer) => layer.id === layerId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedLayers.length) {
      return;
    }

    const nextSortedLayers = [...sortedLayers];
    [nextSortedLayers[currentIndex], nextSortedLayers[targetIndex]] = [nextSortedLayers[targetIndex], nextSortedLayers[currentIndex]];
    const reorderedLayers = nextSortedLayers.map((layer, index) => ({
      ...layer,
      order: (nextSortedLayers.length - index) * 10
    }));
    updateScene({
      ...activeScene,
      layers: reorderedLayers,
      updatedAt: new Date().toISOString()
    });
  };

  const fitGridToMapDimensions = () =>
    run(async () => {
      if (!activeScene || !mapAsset?.absolutePath || mapAsset.mediaType !== "image") {
        return;
      }
      const columns = Math.max(1, activeScene.grid.mapGridColumns);
      const rows = Math.max(1, activeScene.grid.mapGridRows);
      const dimensions = await loadImageDimensions(window.localVtt.toAssetUrl(mapAsset.absolutePath));
      const cellWidth = dimensions.width / columns;
      const cellHeight = dimensions.height / rows;
      const nextSize = Math.max(1, Math.round(((cellWidth + cellHeight) / 2) * 100) / 100);
      const nextOffsetX = activeScene.mapTransform.fitMode === "manual" ? activeScene.mapTransform.x : 0;
      const nextOffsetY = activeScene.mapTransform.fitMode === "manual" ? activeScene.mapTransform.y : 0;

      updateScene({
        ...activeScene,
        grid: {
          ...activeScene.grid,
          sizePx: nextSize,
          offsetX: nextOffsetX,
          offsetY: nextOffsetY
        },
        updatedAt: new Date().toISOString()
      });
    });

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
      const openResult = await window.localVtt.openPlayerView({
        displayId: campaign.playerDisplay.selectedDisplayId,
        fullscreen: campaign.playerDisplay.openPlayerViewFullscreen
      });
      await window.localVtt.sendSceneToPlayer(campaign, activeScene);
      if (!openResult.displayFound && campaign.playerDisplay.selectedDisplayLabel) {
        setError(`Saved Player View display not found: ${campaign.playerDisplay.selectedDisplayLabel}. Opened Player View normally.`);
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
      setPlayerMenuOpen(false);
    });

  const toggleFolderCollapsed = (folderId: string) => {
    if (!campaign) {
      return;
    }
    const nextIds = new Set(campaign.sceneLibrary.collapsedFolderIds);
    if (nextIds.has(folderId)) {
      nextIds.delete(folderId);
    } else {
      nextIds.add(folderId);
    }
    updateCampaignDraft({
      ...campaign,
      sceneLibrary: { ...campaign.sceneLibrary, collapsedFolderIds: [...nextIds] },
      updatedAt: new Date().toISOString()
    });
  };

  const toggleWorkspacePanel = (side: "left" | "right") => {
    setWorkspaceLayout((layout) =>
      side === "left" ? { ...layout, leftCollapsed: !layout.leftCollapsed } : { ...layout, rightCollapsed: !layout.rightCollapsed }
    );
  };

  const startPanelResize = (side: "left" | "right", event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = side === "left" ? workspaceLayout.leftWidth : workspaceLayout.rightWidth;

    const resizePanel = (moveEvent: PointerEvent) => {
      const delta = side === "left" ? moveEvent.clientX - startX : startX - moveEvent.clientX;
      const minWidth = side === "left" ? MIN_LEFT_PANEL_WIDTH : MIN_RIGHT_PANEL_WIDTH;
      const width = clamp(startWidth + delta, minWidth, MAX_PANEL_WIDTH);
      setWorkspaceLayout((layout) => (side === "left" ? { ...layout, leftWidth: width } : { ...layout, rightWidth: width }));
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

  const resetPanelWidth = (side: "left" | "right") => {
    setWorkspaceLayout((layout) =>
      side === "left"
        ? { ...layout, leftWidth: DEFAULT_WORKSPACE_LAYOUT.leftWidth }
        : { ...layout, rightWidth: DEFAULT_WORKSPACE_LAYOUT.rightWidth }
    );
  };

  const appShellStyle = {
    "--left-sidebar-width": `${workspaceLayout.leftCollapsed ? COLLAPSED_RAIL_WIDTH : workspaceLayout.leftWidth}px`,
    "--right-inspector-width": `${workspaceLayout.rightCollapsed ? COLLAPSED_RAIL_WIDTH : workspaceLayout.rightWidth}px`
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
      void saveCampaign().then((ok) => {
        if (ok) {
          window.localVtt.closeAfterSave();
        }
      });
    });
    return removeListener;
  });

  return (
    <div className={appShellClassName} style={appShellStyle}>
      <aside className="sidebar">
        <button
          className="icon-button panel-collapse-button sidebar-collapse-button"
          aria-label={workspaceLayout.leftCollapsed ? "Expand left sidebar" : "Collapse left sidebar"}
          title={workspaceLayout.leftCollapsed ? "Expand left sidebar" : "Collapse left sidebar"}
          onClick={() => toggleWorkspacePanel("left")}
        >
          {workspaceLayout.leftCollapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
        </button>
        {workspaceLayout.leftCollapsed && <div className="panel-spine-label">Campaign / Scenes</div>}
        {!workspaceLayout.leftCollapsed && (
          <div className="panel-region-content">
            <div className="section-heading">
              <h2>Campaign</h2>
            </div>
            <CampaignPanel
              campaign={campaign}
              campaignPath={campaignPath}
              missingAssets={missingAssets}
              hasUnsavedChanges={hasUnsavedChanges}
              onCreateCampaign={createCampaign}
              onOpenCampaign={openCampaign}
              onSaveCampaign={() => void saveCampaign()}
              onRenameCampaign={openCampaignRenameDialog}
            />

            <div className="section-heading">
              <h2>Scenes</h2>
              <div className="section-actions">
                <button className="icon-button" disabled={!campaignPath} aria-label="Add Scene" title="Add Scene" onClick={openSceneDialog}>
                  <FilePlus size={16} aria-hidden="true" />
                </button>
                <button className="icon-button" disabled={!campaign} aria-label="Add Scene Folder" title="Add Scene Folder" onClick={openFolderDialog}>
                  <FolderPlus size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
            <SceneLibraryPanel
              campaign={campaign}
              activeScene={activeScene}
              dirtySceneIds={dirtySceneIds}
              sceneThumbnailAssets={sceneThumbnailAssets}
              collapsedFolderIds={collapsedFolderIds}
              openSceneMenuId={openSceneMenuId}
              openFolderMenuId={openFolderMenuId}
              onLoadScene={(sceneId) => void loadScene(sceneId)}
              onSaveScene={(sceneId) => void saveSceneById(sceneId)}
              onSaveFolderScenes={(folderId) => void saveFolderScenes(folderId)}
              onMoveSceneToFolder={moveSceneToFolder}
              onToggleFolderCollapsed={toggleFolderCollapsed}
              onToggleSceneMenu={(sceneId) => setOpenSceneMenuId(openSceneMenuId === sceneId ? null : sceneId)}
              onToggleFolderMenu={(folderId) => setOpenFolderMenuId(openFolderMenuId === folderId ? null : folderId)}
          onRenameScene={openRenameDialog}
          onDeleteScene={setSceneToDelete}
          onRenameFolder={openRenameFolderDialog}
          onChangeFolderColor={openFolderColorDialog}
          onMoveFolder={moveFolder}
          onDeleteFolder={setFolderToDelete}
        />
          </div>
        )}
        {!workspaceLayout.leftCollapsed && (
          <button
            className="panel-resize-handle panel-resize-handle-left"
            aria-label="Resize left sidebar"
            title="Drag to resize. Double-click to reset."
            onDoubleClick={() => resetPanelWidth("left")}
            onPointerDown={(event) => startPanelResize("left", event)}
          >
            <GripVertical size={14} aria-hidden="true" />
          </button>
        )}
      </aside>

      <main className="workspace">
        <WorkspaceTopbar
          activeScene={activeScene}
          mapAsset={mapAsset}
          playerMenuOpen={playerMenuOpen}
          onSendToPlayer={sendToPlayer}
          onTogglePlayerMenu={() => setPlayerMenuOpen((open) => !open)}
          onSetPlayerFullscreen={(fullscreen) => void setPlayerFullscreen(fullscreen)}
          onClosePlayerView={closePlayerView}
        />

        <div className={error ? "error-banner" : "error-banner error-banner-empty"}>{error}</div>

        <div className="canvas-stage">
          {activeScene && (
            <ToolsMenu
              activeFogTool={activeFogTool}
              fogOperation={fogOperation}
              brushSize={activeScene.fog.brushSize}
              fogShapeCount={activeScene.fog.shapes.length}
              onFogToolChange={setActiveFogTool}
              onFogOperationChange={setFogOperation}
              onBrushSizeChange={(brushSize) => updateFog({ brushSize })}
              onUndoFogShape={undoFogShape}
              onRequestClearFog={() => setConfirmClearFogOpen(true)}
            />
          )}
          <SceneCanvas
            campaign={campaign}
            scene={activeScene}
            mode="gm"
            fogTool={activeFogTool}
            onSceneChange={updateScene}
          />
          <GmSettingsMenu
            open={gmSettingsOpen}
            campaign={campaign}
            activeScene={activeScene}
            activeMapIsVideo={activeMapIsVideo}
            videoPlayback={videoPlayback}
            onToggleOpen={() => setGmSettingsOpen((open) => !open)}
            onOpenPlayerDisplayScale={() => {
              setPlayerDisplayDialogOpen(true);
              setGmSettingsOpen(false);
            }}
            onOpenPlayerViewDisplay={() => {
              setPlayerViewDisplayDialogOpen(true);
              setGmSettingsOpen(false);
            }}
            onOpenMeasurement={() => {
              setMeasurementDialogOpen(true);
              setGmSettingsOpen(false);
            }}
            onUpdateVideoPlayback={updateVideoPlayback}
          />
        </div>

        <footer className="statusbar">
          <span>Mouse wheel zooms. Drag pans. Scene data uses world/map coordinates.</span>
          <span>
            Save status:{" "}
            {hasUnsavedChanges
              ? `${dirtyCount} unsaved scene${dirtyCount === 1 ? "" : "s"}${campaignDirty ? `${dirtyCount > 0 ? ", " : ""}campaign changes` : ""}`
              : saveState}
          </span>
        </footer>
      </main>

      <aside className="inspector">
        <button
          className="icon-button panel-collapse-button inspector-collapse-button"
          aria-label={workspaceLayout.rightCollapsed ? "Expand right inspector" : "Collapse right inspector"}
          title={workspaceLayout.rightCollapsed ? "Expand right inspector" : "Collapse right inspector"}
          onClick={() => toggleWorkspacePanel("right")}
        >
          {workspaceLayout.rightCollapsed ? <PanelRightOpen size={16} aria-hidden="true" /> : <PanelRightClose size={16} aria-hidden="true" />}
        </button>
        {workspaceLayout.rightCollapsed && <div className="panel-spine-label">Layers</div>}
        {!workspaceLayout.rightCollapsed && (
          <div className="panel-region-content">
            {activeScene ? (
              <>
                <div className="section-heading">
                  <h2>Layers</h2>
                  <div className="section-actions">
                    <button
                      className="icon-button"
                      aria-label={activeScene.layerOrderLocked ? "Unlock layer order" : "Lock layer order"}
                      title={activeScene.layerOrderLocked ? "Unlock layer order" : "Lock layer order"}
                      onClick={() => setLayerOrderLocked(!activeScene.layerOrderLocked)}
                    >
                      {activeScene.layerOrderLocked ? <Lock size={15} aria-hidden="true" /> : <Unlock size={15} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                <LayerPanel
                  scene={activeScene}
                  mapAsset={mapAsset}
                  onChange={updateScene}
                  onUpdateGrid={updateGrid}
                  onUpdateFog={updateFog}
                  onUpdateMapTransform={updateMapTransform}
                  onFitGridToMapDimensions={fitGridToMapDimensions}
                  onMoveLayer={moveLayer}
                  onImportMap={importMap}
                  onDeleteMap={setMapAssetToDelete}
                  onOpenFogColor={() => openSceneColorDialog("fog")}
                  onOpenGridColor={() => openSceneColorDialog("grid")}
                />

                <div className="section-heading">
                  <h2>Phase Placeholders</h2>
                </div>
                <section className="panel">
                  <p>Fog, tokens, walls, lights, drawings, measurements, and animated overlays are typed in the scene model and ready for later renderer tools.</p>
                </section>
              </>
            ) : (
              <section className="panel">
                <h2>Ready</h2>
                <p>Create a campaign, add a scene, import a map, then send it to Player View.</p>
              </section>
            )}
          </div>
        )}
        {!workspaceLayout.rightCollapsed && (
          <button
            className="panel-resize-handle panel-resize-handle-right"
            aria-label="Resize right inspector"
            title="Drag to resize. Double-click to reset."
            onDoubleClick={() => resetPanelWidth("right")}
            onPointerDown={(event) => startPanelResize("right", event)}
          >
            <GripVertical size={14} aria-hidden="true" />
          </button>
        )}
      </aside>

      {sceneDialog && (
        <NameDialog
          title={sceneDialog.mode === "create" ? "New Scene" : "Rename Scene"}
          label="Scene name"
          value={newSceneName}
          submitLabel={sceneDialog.mode === "create" ? "Create" : "Save"}
          onChange={setNewSceneName}
          onCancel={() => setSceneDialog(null)}
          onSubmit={() => void submitSceneName()}
        />
      )}

      {folderDialog && (
        <NameDialog
          title={folderDialog.mode === "create" ? "New Scene Folder" : "Rename Scene Folder"}
          label="Folder name"
          value={newFolderName}
          submitLabel={folderDialog.mode === "create" ? "Create" : "Save"}
          onChange={setNewFolderName}
          onCancel={() => setFolderDialog(null)}
          onSubmit={submitFolderName}
        />
      )}

      {folderColorDialog && (
        <div className="modal-backdrop" onMouseDown={() => setFolderColorDialog(null)}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <h2>Change Folder Color</h2>
            <ColorPickerField label={folderColorDialog.folderName} value={newFolderColor} onChange={setNewFolderColor} />
            <div className="button-row modal-actions">
              <button onClick={() => setFolderColorDialog(null)}>Cancel</button>
              <button onClick={submitFolderColor}>Save</button>
            </div>
          </div>
        </div>
      )}

      {sceneColorDialog && (
        <div className="modal-backdrop" onMouseDown={() => setSceneColorDialog(null)}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <h2>{sceneColorDialog.title}</h2>
            <ColorPickerField label="Color" value={sceneColorDialog.value} onChange={updateSceneColorDraft} />
            <div className="button-row modal-actions">
              <button onClick={() => setSceneColorDialog(null)}>Cancel</button>
              <button onClick={submitSceneColor}>Save</button>
            </div>
          </div>
        </div>
      )}

      {campaignNameDialogOpen && (
        <NameDialog
          title="Rename Campaign"
          label="Campaign name"
          value={newCampaignName}
          submitLabel="Save"
          onChange={setNewCampaignName}
          onCancel={() => setCampaignNameDialogOpen(false)}
          onSubmit={submitCampaignName}
        />
      )}

      {playerDisplayDialogOpen && campaign && activeScene && (
        <SettingsModal onClose={() => setPlayerDisplayDialogOpen(false)}>
          <PlayerDisplayScalePanel
            scene={activeScene}
            calibration={campaign.playerDisplay}
            displays={displays}
            onApply={updatePlayerDisplay}
            onRefreshDisplays={refreshDisplays}
          />
        </SettingsModal>
      )}

      {playerViewDisplayDialogOpen && campaign && (
        <SettingsModal onClose={() => setPlayerViewDisplayDialogOpen(false)}>
          <PlayerViewDisplayPanel
            calibration={campaign.playerDisplay}
            displays={displays}
            onApply={updatePlayerDisplay}
            onRefreshDisplays={refreshDisplays}
          />
        </SettingsModal>
      )}

      {measurementDialogOpen && activeScene && (
        <SettingsModal onClose={() => setMeasurementDialogOpen(false)}>
          <MeasurementPanel measurement={activeScene.grid.measurement} onChange={updateMeasurement} />
        </SettingsModal>
      )}

      {sceneToDelete && (
        <ConfirmDialog
          title="Delete Scene"
          confirmLabel="Delete"
          onCancel={() => setSceneToDelete(null)}
          onConfirm={() => void deleteScene(sceneToDelete)}
        >
          Delete <strong>{sceneToDelete.name}</strong>? This removes the scene JSON file from the campaign folder.
        </ConfirmDialog>
      )}

      {folderToDelete && (
        <ConfirmDialog
          title="Delete Scene Folder"
          confirmLabel="Delete Folder"
          onCancel={() => setFolderToDelete(null)}
          onConfirm={() => deleteFolder(folderToDelete)}
        >
          Delete <strong>{folderToDelete.name}</strong>? Scenes in this folder will move to Unfiled Scenes.
        </ConfirmDialog>
      )}

      {mapAssetToDelete && (
        <ConfirmDialog
          title="Delete Map Asset"
          confirmLabel="Delete Asset"
          onCancel={() => setMapAssetToDelete(null)}
          onConfirm={() => void confirmDeleteMapAsset()}
        >
          Delete <strong>{mapAssetToDelete.name}</strong> from the campaign folder? This cannot be undone.
        </ConfirmDialog>
      )}

      {confirmClearFogOpen && (
        <ConfirmDialog
          title="Clear Fog Shapes"
          confirmLabel="Clear Fog"
          onCancel={() => setConfirmClearFogOpen(false)}
          onConfirm={clearFogShapes}
        >
          Delete all fog reveal and hide shapes from this scene? This cannot be undone.
        </ConfirmDialog>
      )}
    </div>
  );
}

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Unable to read the selected map image dimensions."));
    image.src = src;
  });
}

function loadWorkspaceLayout(): WorkspaceLayout {
  try {
    const value = window.localStorage.getItem(WORKSPACE_LAYOUT_STORAGE_KEY);
    if (!value) {
      return DEFAULT_WORKSPACE_LAYOUT;
    }
    const parsed = JSON.parse(value) as Partial<WorkspaceLayout>;
    return {
      leftWidth: clamp(parsed.leftWidth ?? DEFAULT_WORKSPACE_LAYOUT.leftWidth, MIN_LEFT_PANEL_WIDTH, MAX_PANEL_WIDTH),
      rightWidth: clamp(parsed.rightWidth ?? DEFAULT_WORKSPACE_LAYOUT.rightWidth, MIN_RIGHT_PANEL_WIDTH, MAX_PANEL_WIDTH),
      leftCollapsed: parsed.leftCollapsed ?? DEFAULT_WORKSPACE_LAYOUT.leftCollapsed,
      rightCollapsed: parsed.rightCollapsed ?? DEFAULT_WORKSPACE_LAYOUT.rightCollapsed
    };
  } catch {
    return DEFAULT_WORKSPACE_LAYOUT;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
