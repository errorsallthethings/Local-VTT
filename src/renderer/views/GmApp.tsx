import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  EllipsisVertical,
  FilePlus,
  FolderOpen,
  FolderPlus,
  Maximize2,
  Minimize2,
  MonitorUp,
  Pause,
  Play,
  Plus,
  Ruler,
  Save,
  Settings,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import { DEFAULT_VIDEO_PLAYBACK } from "../../shared/localvtt";
import type {
  Asset,
  Campaign,
  CampaignSceneEntry,
  CampaignSceneFolder,
  CampaignSummary,
  DisplayCalibration,
  FogSettings,
  GridSettings,
  MapTransform,
  MeasurementUnit,
  Scene,
  VideoPlaybackSettings
} from "../../shared/localvtt";
import { LayerPanel } from "../components/layers/LayerPanel";
import { SceneCanvas } from "../components/SceneCanvas";
import { SceneLibraryPanel } from "../components/scenes/SceneLibraryPanel";
import { PlayerDisplayScalePanel, type DisplayInfo } from "../components/settings/PlayerDisplayScalePanel";
import { ToolsMenu, type FogOperation } from "../components/tools/ToolsMenu";
import type { FogTool } from "../canvas/fogRenderer";
import { mergeCampaignDraft } from "../lib/campaignDraft";

type SaveState = "idle" | "saving" | "saved" | "error";
type SceneNameDialog = { mode: "create" } | { mode: "rename"; sceneId: string };
type FolderNameDialog = { mode: "create" } | { mode: "rename"; folderId: string };

export function GmApp() {
  const [campaignPath, setCampaignPath] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [missingAssets, setMissingAssets] = useState<string[]>([]);
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [sceneDrafts, setSceneDrafts] = useState<Record<string, Scene>>({});
  const [dirtySceneIds, setDirtySceneIds] = useState<Set<string>>(() => new Set());
  const [campaignDirty, setCampaignDirty] = useState(false);
  const [sceneDialog, setSceneDialog] = useState<SceneNameDialog | null>(null);
  const [folderDialog, setFolderDialog] = useState<FolderNameDialog | null>(null);
  const [campaignNameDialogOpen, setCampaignNameDialogOpen] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState<CampaignSceneEntry | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<CampaignSceneFolder | null>(null);
  const [mapAssetToDelete, setMapAssetToDelete] = useState<Asset | null>(null);
  const [openSceneMenuId, setOpenSceneMenuId] = useState<string | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(() => new Set());
  const [playerMenuOpen, setPlayerMenuOpen] = useState(false);
  const [gmSettingsOpen, setGmSettingsOpen] = useState(false);
  const [playerDisplayDialogOpen, setPlayerDisplayDialogOpen] = useState(false);
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
  const [activeFogTool, setActiveFogTool] = useState<FogTool | null>(null);
  const [fogOperation, setFogOperation] = useState<FogOperation>("reveal");
  const [confirmClearFogOpen, setConfirmClearFogOpen] = useState(false);
  const [newSceneName, setNewSceneName] = useState("New Battle Map");
  const [newFolderName, setNewFolderName] = useState("New Folder");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);

  const dirtyCount = dirtySceneIds.size;
  const hasUnsavedChanges = dirtyCount > 0 || campaignDirty;

  const mapAsset = useMemo(() => {
    if (!campaign || !activeScene?.mapAssetId) {
      return null;
    }
    return campaign.assets.find((asset) => asset.id === activeScene.mapAssetId) ?? null;
  }, [activeScene?.mapAssetId, campaign]);
  const activeMapIsVideo = mapAsset?.mediaType === "video";
  const videoPlayback = activeScene?.videoPlayback ?? DEFAULT_VIDEO_PLAYBACK;
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
      !campaignNameDialogOpen &&
      !playerDisplayDialogOpen &&
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
        setCampaignNameDialogOpen(false);
        setPlayerDisplayDialogOpen(false);
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
    folderDialog,
    folderToDelete,
    gmSettingsOpen,
    mapAssetToDelete,
    measurementDialogOpen,
    openFolderMenuId,
    openSceneMenuId,
    playerDisplayDialogOpen,
    playerMenuOpen,
    sceneDialog,
    sceneToDelete
  ]);

  useEffect(() => {
    void refreshDisplays();
  }, []);

  useEffect(() => {
    window.localVtt.setUnsavedChanges(hasUnsavedChanges);
    return () => window.localVtt.setUnsavedChanges(false);
  }, [hasUnsavedChanges]);

  const applySummary = (summary: CampaignSummary, preserveCampaignDraft = false) => {
    setCampaignPath(summary.campaignPath);
    setCampaign((currentCampaign) =>
      preserveCampaignDraft && currentCampaign ? mergeCampaignDraft(summary.campaign, currentCampaign) : summary.campaign
    );
    setMissingAssets(summary.missingAssets);
  };

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      return false;
    }
  };

  const clearWorkspaceState = () => {
    setActiveScene(null);
    setSceneDrafts({});
    setDirtySceneIds(new Set());
    setCampaignDirty(false);
    setOpenSceneMenuId(null);
    setOpenFolderMenuId(null);
    setCollapsedFolderIds(new Set());
    setSaveState("idle");
  };

  const setSceneClean = (scene: Scene) => {
    setSceneDrafts((drafts) => {
      const next = { ...drafts };
      delete next[scene.id];
      return next;
    });
    setDirtySceneIds((ids) => {
      const next = new Set(ids);
      next.delete(scene.id);
      return next;
    });
  };

  const updateScene = (nextScene: Scene, syncCampaign: Campaign | null = campaign) => {
    setActiveScene(nextScene);
    setSceneDrafts((drafts) => ({ ...drafts, [nextScene.id]: nextScene }));
    setDirtySceneIds((ids) => new Set(ids).add(nextScene.id));
    setSaveState("idle");
    if (syncCampaign) {
      void window.localVtt.updatePlayerSceneIfOpen(syncCampaign, nextScene);
    }
  };

  const updateCampaignDraft = (nextCampaign: Campaign) => {
    setCampaign(nextCampaign);
    setCampaignDirty(true);
    if (activeScene) {
      void window.localVtt.updatePlayerSceneIfOpen(nextCampaign, activeScene);
    }
  };

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

  const createCampaign = () =>
    run(async () => {
      const summary = await window.localVtt.createCampaign();
      if (summary) {
        applySummary(summary);
        clearWorkspaceState();
      }
    });

  const openCampaign = () =>
    run(async () => {
      const summary = await window.localVtt.openCampaign();
      if (summary) {
        applySummary(summary);
        clearWorkspaceState();
      }
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
            sceneFolders: [...campaign.sceneFolders, { id: crypto.randomUUID(), name, createdAt: now }],
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

  const loadScene = (sceneId: string) =>
    run(async () => {
      if (!campaignPath) {
        return;
      }
      setOpenSceneMenuId(null);
      const draft = sceneDrafts[sceneId];
      setActiveScene(draft ?? (await window.localVtt.loadScene(campaignPath, sceneId)));
    });

  const moveSceneToFolder = (sceneId: string, folderId?: string) => {
    if (!campaign) {
      return;
    }
    const nextCampaign = {
      ...campaign,
      scenes: campaign.scenes.map((scene) => (scene.id === sceneId ? { ...scene, folderId } : scene)),
      updatedAt: new Date().toISOString()
    };
    updateCampaignDraft(nextCampaign);
  };

  const saveSceneById = async (sceneId: string) => {
    const ok = await run(async () => {
      if (!campaignPath) {
        return;
      }
      const sceneToSave = sceneDrafts[sceneId] ?? (activeScene?.id === sceneId ? activeScene : null);
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
        const scene = sceneDrafts[sceneId] ?? (activeScene?.id === sceneId ? activeScene : null);
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
      setCampaignPath(result.campaignSummary.campaignPath);
      setMissingAssets(result.campaignSummary.missingAssets);
      const baseCampaign = campaignDirty ? mergeCampaignDraft(result.campaignSummary.campaign, campaign) : result.campaignSummary.campaign;
      const nextCampaign = {
        ...baseCampaign,
        scenes: baseCampaign.scenes.map((entry) =>
          entry.id === activeScene.id ? { ...entry, mapAssetId: result.asset.id } : entry
        )
      };
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
      setMapAssetToDelete(null);
    });

  const sendToPlayer = () =>
    run(async () => {
      if (!campaign || !activeScene) {
        return;
      }
      await window.localVtt.openPlayerView();
      await window.localVtt.sendSceneToPlayer(campaign, activeScene);
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

  const saveFolderScenes = async (folderId: string) => {
    if (!campaign) {
      return;
    }
    const dirtySceneIdsInFolder = campaign.scenes
      .filter((scene) => scene.folderId === folderId && dirtySceneIds.has(scene.id))
      .map((scene) => scene.id);
    for (const sceneId of dirtySceneIdsInFolder) {
      await saveSceneById(sceneId);
    }
  };

  const deleteScene = () =>
    run(async () => {
      if (!campaignPath || !sceneToDelete) {
        return;
      }
      const deletedSceneId = sceneToDelete.id;
      const summary = await window.localVtt.deleteScene(campaignPath, deletedSceneId);
      applySummary(summary, campaignDirty);
      setSceneDrafts((drafts) => {
        const next = { ...drafts };
        delete next[deletedSceneId];
        return next;
      });
      setDirtySceneIds((ids) => {
        const next = new Set(ids);
        next.delete(deletedSceneId);
        return next;
      });
      if (activeScene?.id === deletedSceneId) {
        setActiveScene(null);
      }
      setSceneToDelete(null);
      setOpenSceneMenuId(null);
    });

  const deleteFolder = () => {
    if (!campaign || !folderToDelete) {
      return;
    }
    updateCampaignDraft({
      ...campaign,
      sceneFolders: campaign.sceneFolders.filter((folder) => folder.id !== folderToDelete.id),
      scenes: campaign.scenes.map((scene) => (scene.folderId === folderToDelete.id ? { ...scene, folderId: undefined } : scene)),
      updatedAt: new Date().toISOString()
    });
    setFolderToDelete(null);
    setOpenFolderMenuId(null);
  };

  const toggleFolderCollapsed = (folderId: string) => {
    setCollapsedFolderIds((ids) => {
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
    <div className="app-shell">
      <aside className="sidebar">
        <header className="brand">
          <h1>Local VTT</h1>
        </header>

        <div className="section-heading">
          <h2>Campaign</h2>
        </div>
        <section className="panel">
          <div className="campaign-title-row panel-title-row">
            <p>{campaign ? campaign.name : "No campaign open"}</p>
            {campaign && (
              <button className="icon-button" aria-label="Edit campaign name" title="Edit campaign name" onClick={openCampaignRenameDialog}>
                <Edit3 size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="button-row campaign-action-row">
            <button className="icon-button" aria-label="New Campaign" title="New Campaign" onClick={createCampaign}>
              <Plus size={16} aria-hidden="true" />
            </button>
            <button className="icon-button" aria-label="Open Campaign" title="Open Campaign" onClick={openCampaign}>
              <FolderOpen size={16} aria-hidden="true" />
            </button>
            <button
              className={hasUnsavedChanges ? "icon-button dirty-save" : "icon-button"}
              disabled={!hasUnsavedChanges}
              aria-label="Save Campaign"
              title="Save Campaign"
              onClick={saveCampaign}
            >
              <Save size={16} aria-hidden="true" />
            </button>
          </div>
          {campaignPath && (
            <div className="file-path-block">
              <span>File Path</span>
              <p className="path-text" title={campaignPath}>
                {campaignPath}
              </p>
            </div>
          )}
          {missingAssets.length > 0 && (
            <div className="warning">
              Missing assets:
              {missingAssets.map((asset) => (
                <div key={asset}>{asset}</div>
              ))}
            </div>
          )}
        </section>

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
          onDeleteFolder={setFolderToDelete}
        />
      </aside>

      <main className="workspace">
        <div className="topbar">
          <div>
            <h2>{activeScene?.name ?? "Create or open a scene"}</h2>
            <span>{mapAsset ? `${mapAsset.name} (${mapAsset.mediaType})` : "No map imported"}</span>
          </div>
          <div className="toolbar-groups">
            <div className="toolbar-block">
              <div className="toolbar-label">Player View</div>
              <div className="toolbar-group" aria-label="Player View actions">
                <button disabled={!activeScene} onClick={sendToPlayer}>
                  <MonitorUp size={16} aria-hidden="true" />
                  Send
                </button>
                <div className="scene-menu-wrap">
                  <button
                    className="icon-button"
                    aria-label="Player View actions"
                    title="Player View actions"
                    onClick={() => setPlayerMenuOpen((open) => !open)}
                  >
                    <EllipsisVertical size={16} aria-hidden="true" />
                  </button>
                  {playerMenuOpen && (
                    <div className="scene-menu toolbar-menu">
                      <button onClick={() => void setPlayerFullscreen(true)}>
                        <Maximize2 size={14} aria-hidden="true" />
                        Fullscreen
                      </button>
                      <button onClick={() => void setPlayerFullscreen(false)}>
                        <Minimize2 size={14} aria-hidden="true" />
                        Exit fullscreen
                      </button>
                      <button className="danger-menu-item" onClick={closePlayerView}>
                        <X size={14} aria-hidden="true" />
                        Close window
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

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
          <div className="gm-view-settings">
            <button
              className="icon-button"
              aria-label="GM view settings"
              title="GM view settings"
              onClick={() => setGmSettingsOpen((open) => !open)}
            >
              <Settings size={16} aria-hidden="true" />
            </button>
            {gmSettingsOpen && (
              <div className="gm-settings-menu">
                <button
                  disabled={!campaign || !activeScene}
                  onClick={() => {
                    setPlayerDisplayDialogOpen(true);
                    setGmSettingsOpen(false);
                  }}
                >
                  <MonitorUp size={14} aria-hidden="true" />
                  Player Display Scale
                </button>
                <button
                  disabled={!activeScene}
                  onClick={() => {
                    setMeasurementDialogOpen(true);
                    setGmSettingsOpen(false);
                  }}
                >
                  <Ruler size={14} aria-hidden="true" />
                  Measurement
                </button>
                <button
                  disabled={!activeMapIsVideo}
                  onClick={() => updateVideoPlayback({ diagnosticsVisible: !videoPlayback.diagnosticsVisible })}
                >
                  <Settings size={14} aria-hidden="true" />
                  {videoPlayback.diagnosticsVisible ? "Hide video diagnostics" : "Show video diagnostics"}
                </button>
                <button disabled={!activeMapIsVideo} onClick={() => updateVideoPlayback({ paused: !videoPlayback.paused })}>
                  {videoPlayback.paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
                  {videoPlayback.paused ? "Play video" : "Pause video"}
                </button>
                <button disabled={!activeMapIsVideo} onClick={() => updateVideoPlayback({ muted: !videoPlayback.muted })}>
                  {videoPlayback.muted ? <Volume2 size={14} aria-hidden="true" /> : <VolumeX size={14} aria-hidden="true" />}
                  {videoPlayback.muted ? "Unmute video" : "Mute video"}
                </button>
              </div>
            )}
          </div>
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
        {activeScene ? (
          <>
            <LayerPanel
              scene={activeScene}
              mapAsset={mapAsset}
              onChange={updateScene}
              onUpdateGrid={updateGrid}
              onUpdateFog={updateFog}
              onUpdateMapTransform={updateMapTransform}
              onFitGridToMapDimensions={fitGridToMapDimensions}
              onMoveLayer={moveLayer}
              onSetLayerOrderLocked={setLayerOrderLocked}
              onImportMap={importMap}
              onDeleteMap={setMapAssetToDelete}
            />

            <section className="panel">
              <h2>Phase Placeholders</h2>
              <p>Fog, tokens, walls, lights, drawings, measurements, and animated overlays are typed in the scene model and ready for later renderer tools.</p>
            </section>
          </>
        ) : (
          <section className="panel">
            <h2>Ready</h2>
            <p>Create a campaign, add a scene, import a map, then send it to Player View.</p>
          </section>
        )}
      </aside>

      {sceneDialog && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSceneDialog(null)}>
          <form
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void submitSceneName();
            }}
          >
            <h2>{sceneDialog.mode === "create" ? "New Scene" : "Rename Scene"}</h2>
            <label>
              Scene name
              <input
                autoFocus
                value={newSceneName}
                onChange={(event) => setNewSceneName(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
            <div className="button-row modal-actions">
              <button type="button" onClick={() => setSceneDialog(null)}>
                Cancel
              </button>
              <button type="submit" disabled={!newSceneName.trim()}>
                {sceneDialog.mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {folderDialog && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setFolderDialog(null)}>
          <form
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              submitFolderName();
            }}
          >
            <h2>{folderDialog.mode === "create" ? "New Scene Folder" : "Rename Scene Folder"}</h2>
            <label>
              Folder name
              <input
                autoFocus
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
            <div className="button-row modal-actions">
              <button type="button" onClick={() => setFolderDialog(null)}>
                Cancel
              </button>
              <button type="submit" disabled={!newFolderName.trim()}>
                {folderDialog.mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {campaignNameDialogOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setCampaignNameDialogOpen(false)}>
          <form
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              submitCampaignName();
            }}
          >
            <h2>Rename Campaign</h2>
            <label>
              Campaign name
              <input
                autoFocus
                value={newCampaignName}
                onChange={(event) => setNewCampaignName(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
            <div className="button-row modal-actions">
              <button type="button" onClick={() => setCampaignNameDialogOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={!newCampaignName.trim()}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {playerDisplayDialogOpen && campaign && activeScene && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setPlayerDisplayDialogOpen(false)}>
          <div className="modal settings-modal" onMouseDown={(event) => event.stopPropagation()}>
            <PlayerDisplayScalePanel
              scene={activeScene}
              calibration={campaign.playerDisplay}
              displays={displays}
              onApply={updatePlayerDisplay}
              onRefreshDisplays={refreshDisplays}
            />
            <div className="button-row modal-actions">
              <button type="button" onClick={() => setPlayerDisplayDialogOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {measurementDialogOpen && activeScene && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setMeasurementDialogOpen(false)}>
          <div className="modal settings-modal" onMouseDown={(event) => event.stopPropagation()}>
            <section className="panel">
              <h2>Measurement</h2>
              <div className="panel-subgrid">
                <label>
                  Units per cell
                  <input
                    type="number"
                    min={0.1}
                    step={0.5}
                    value={activeScene.grid.measurement.unitsPerGridCell}
                    onChange={(event) => updateMeasurement({ unitsPerGridCell: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Unit
                  <select
                    value={activeScene.grid.measurement.unit}
                    onChange={(event) => updateMeasurement({ unit: event.target.value as MeasurementUnit })}
                  >
                    <option value="feet">Feet</option>
                    <option value="meters">Meters</option>
                    <option value="miles">Miles</option>
                  </select>
                </label>
              </div>
              <label>
                Distance mode
                <select
                  value={activeScene.grid.measurement.distanceMode}
                  onChange={(event) =>
                    updateMeasurement({ distanceMode: event.target.value as GridSettings["measurement"]["distanceMode"] })
                  }
                >
                  <option value="euclidean">Euclidean</option>
                  <option value="manhattan">Manhattan</option>
                  <option value="grid">Grid snapped</option>
                  <option value="diagonal-5-10">5/10/5/10 diagonals</option>
                </select>
              </label>
            </section>
            <div className="button-row modal-actions">
              <button type="button" onClick={() => setMeasurementDialogOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {sceneToDelete && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSceneToDelete(null)}>
          <form
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void deleteScene();
            }}
          >
            <h2>Delete Scene</h2>
            <p>
              Delete <strong>{sceneToDelete.name}</strong>? This removes the scene JSON file from the campaign folder.
            </p>
            <div className="button-row modal-actions">
              <button type="button" onClick={() => setSceneToDelete(null)}>
                Cancel
              </button>
              <button type="submit" className="danger-button">
                Delete
              </button>
            </div>
          </form>
        </div>
      )}

      {folderToDelete && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setFolderToDelete(null)}>
          <form
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              deleteFolder();
            }}
          >
            <h2>Delete Scene Folder</h2>
            <p>
              Delete <strong>{folderToDelete.name}</strong>? Scenes in this folder will move to Unfiled Scenes.
            </p>
            <div className="button-row modal-actions">
              <button type="button" onClick={() => setFolderToDelete(null)}>
                Cancel
              </button>
              <button type="submit" className="danger-button">
                Delete Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {mapAssetToDelete && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setMapAssetToDelete(null)}>
          <form
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void confirmDeleteMapAsset();
            }}
          >
            <h2>Delete Map Asset</h2>
            <p>
              Delete <strong>{mapAssetToDelete.name}</strong> from the campaign folder? This cannot be undone.
            </p>
            <div className="button-row modal-actions">
              <button type="button" onClick={() => setMapAssetToDelete(null)}>
                Cancel
              </button>
              <button type="submit" className="danger-button">
                Delete Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmClearFogOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setConfirmClearFogOpen(false)}>
          <form
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              clearFogShapes();
            }}
          >
            <h2>Clear Fog Shapes</h2>
            <p>Delete all fog reveal and hide shapes from this scene? This cannot be undone.</p>
            <div className="button-row modal-actions">
              <button type="button" onClick={() => setConfirmClearFogOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="danger-button">
                Clear Fog
              </button>
            </div>
          </form>
        </div>
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
