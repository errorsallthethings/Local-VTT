import { type CSSProperties, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SCENE_FOLDER_COLOR,
  DEFAULT_TOKEN_BORDER_COLOR,
  DEFAULT_VIDEO_PLAYBACK,
  projectSceneForPlayer
} from "../../shared/localvtt";
import type {
  Asset,
  Campaign,
  CampaignSceneEntry,
  CampaignSceneFolder,
  DisplayCalibration,
  Point,
  Scene,
  SquareCropRect,
  TokenPresentationDefaults
} from "../../shared/localvtt";
import { SceneCanvas } from "../components/SceneCanvas";
import type { DisplayInfo } from "../components/settings/PlayerDisplayScalePanel";
import { ToolsMenu, type CanvasTool, type FogOperation } from "../components/tools/ToolsMenu";
import { TokenLibraryDrawer } from "../components/tokens/TokenLibraryDrawer";
import { VideoMapControls } from "../components/workspace/VideoMapControls";
import { WorkspaceTopbar } from "../components/workspace/WorkspaceTopbar";
import type { FogTool } from "../canvas/fogRenderer";
import { useCampaignActions, type CampaignBusyState } from "../hooks/useCampaignActions";
import { useCampaignWorkspace } from "../hooks/useCampaignWorkspace";
import { useDismissableMenu } from "../hooks/useDismissableMenu";
import { useSceneEditingActions } from "../hooks/useSceneEditingActions";
import { moveSceneFolder } from "../lib/campaignActions";
import { createImportedToken } from "../lib/tokenDefaults";
import {
  COLLAPSED_RAIL_WIDTH,
  COMPACT_RIGHT_PANEL_WIDTH,
  WORKSPACE_LAYOUT_STORAGE_KEY,
  clamp,
  getWorkspacePanelWidth,
  loadWorkspaceLayout,
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

const TOKEN_LIBRARY_HEIGHT_STORAGE_KEY = "localvtt.tokenLibraryHeight";
const DEFAULT_TOKEN_LIBRARY_HEIGHT = 238;
const MIN_TOKEN_LIBRARY_HEIGHT = 170;
const MAX_TOKEN_LIBRARY_HEIGHT = 460;

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
  const [playerViewDisplayDialogOpen, setPlayerViewDisplayDialogOpen] = useState(false);
  const [activeCanvasTool, setActiveCanvasTool] = useState<CanvasTool | null>(null);
  const [activeFogTool, setActiveFogTool] = useState<FogTool | null>(null);
  const [fogOperation, setFogOperation] = useState<FogOperation>("reveal");
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
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [playerSceneId, setPlayerSceneId] = useState<string | null>(null);
  const [tokenLibraryExpanded, setTokenLibraryExpanded] = useState(false);
  const [gmCanvasCenter, setGmCanvasCenter] = useState<Point | null>(null);
  const [tokenLibraryHeight, setTokenLibraryHeight] = useState(() => loadTokenLibraryHeight());
  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayout>(() => loadWorkspaceLayout());
  const [busyState, setBusyState] = useState<CampaignBusyState | null>(null);

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

  const updateScene = (nextScene: Scene, syncCampaign: Campaign | null = campaign, syncScene: Scene = nextScene) => {
    // Only sync the active edit to Player View when that same scene is already being shown to players.
    updateWorkspaceScene(nextScene, nextScene.id === playerSceneId ? syncCampaign : null, syncScene);
  };

  const updateCanvasScene = (nextScene: Scene, syncScene: Scene = nextScene) => {
    updateScene(nextScene, campaign, syncScene);
  };

  const clearActiveCanvasTools = () => {
    setActiveCanvasTool(null);
    setActiveFogTool(null);
  };

  const updateCampaignDraft = (nextCampaign: Campaign) => {
    updateWorkspaceCampaignDraft(nextCampaign, activeScene?.id === playerSceneId ? activeScene : null);
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
      !playerViewDisplayDialogOpen &&
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
        setPlayerViewDisplayDialogOpen(false);
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
    playerDisplayDialogOpen,
    playerViewDisplayDialogOpen,
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
    if (!selectedFogShapeId) {
      return;
    }
    const clearFogShapeSelection = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest(".fog-layer-shape-row")) {
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
    setPlayerSceneId(null);
  }, [campaign?.scenes, playerSceneId]);

  useEffect(() => {
    window.localStorage.setItem(WORKSPACE_LAYOUT_STORAGE_KEY, JSON.stringify(workspaceLayout));
  }, [workspaceLayout]);

  useEffect(() => {
    window.localStorage.setItem(TOKEN_LIBRARY_HEIGHT_STORAGE_KEY, String(tokenLibraryHeight));
  }, [tokenLibraryHeight]);

  const resetSceneLibraryUi = () => {
    setOpenSceneMenuId(null);
    setOpenFolderMenuId(null);
  };

  const {
    createCampaign,
    openCampaign,
    loadScene,
    moveScene,
    saveSceneById,
    saveCampaign,
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
    onMapAssetDeleteHandled: () => setMapAssetToDelete(null),
    onSceneDeleteHandled: () => setSceneToDelete(null),
    onFolderDeleteHandled: () => setFolderToDelete(null)
  });

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
      void window.localVtt.updatePlayerSceneIfOpen(projectSceneForPlayer(nextCampaign, activeScene));
    }
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
          void window.localVtt.updatePlayerSceneIfOpen(projectSceneForPlayer(result.campaignSummary.campaign, nextActiveScene));
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
      const openResult = await window.localVtt.openPlayerView({
        displayId: campaign.playerDisplay.selectedDisplayId,
        fullscreen: campaign.playerDisplay.openPlayerViewFullscreen
      });
      await window.localVtt.sendSceneToPlayer(projectSceneForPlayer(campaign, activeScene));
      setPlayerSceneId(activeScene.id);
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
      setPlayerSceneId(null);
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
      setTokenLibraryHeight(clamp(startHeight + startY - moveEvent.clientY, MIN_TOKEN_LIBRARY_HEIGHT, MAX_TOKEN_LIBRARY_HEIGHT));
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
        onClearActiveFogTool={clearActiveCanvasTools}
        onToggleWorkspacePanel={toggleWorkspacePanel}
        onResetPanelWidth={resetPanelWidth}
        onStartPanelResize={startPanelResize}
        onCreateCampaign={createCampaign}
        onOpenCampaign={openCampaign}
        onSaveCampaign={() => void saveCampaign()}
        onRenameCampaign={openCampaignRenameDialog}
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
          onSendToPlayer={sendToPlayer}
          onTogglePlayerMenu={() => setPlayerMenuOpen((open) => !open)}
          onOpenPlayerDisplayScale={() => {
            setPlayerDisplayDialogOpen(true);
            setPlayerMenuOpen(false);
          }}
          onOpenPlayerViewDisplay={() => {
            setPlayerViewDisplayDialogOpen(true);
            setPlayerMenuOpen(false);
          }}
          onSetPlayerFullscreen={(fullscreen) => void setPlayerFullscreen(fullscreen)}
          onClosePlayerView={closePlayerView}
        />

        <div className={error ? "error-banner" : "error-banner error-banner-empty"}>{error}</div>

        <div className="canvas-stage">
          {activeScene && (
            <ToolsMenu
              activeCanvasTool={activeCanvasTool}
              activeFogTool={activeFogTool}
              fogOperation={fogOperation}
              brushSize={activeScene.fog.brushSize}
              fogShapeCount={activeScene.fog.shapes.length}
              onCanvasToolChange={setActiveCanvasTool}
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
            canvasTool={activeCanvasTool}
            fogTool={activeFogTool}
            selectedFogShapeId={selectedFogShapeId}
            selectedTokenId={selectedTokenId}
            onSceneChange={updateCanvasScene}
            onSelectToken={setSelectedTokenId}
            onDropTokenAsset={dropLibraryTokenOnScene}
            onViewportCenterChange={setGmCanvasCenter}
          />
          {activeMapIsVideo && <VideoMapControls videoPlayback={videoPlayback} onUpdateVideoPlayback={updateVideoPlayback} />}
        </div>

        <TokenLibraryDrawer
          assets={tokenLibraryAssets}
          expanded={tokenLibraryExpanded}
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
        />

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

      <GmInspector
        activeScene={activeScene}
        mapAsset={mapAsset}
        tokenAssets={tokenAssets}
        selectedFogShapeId={selectedFogShapeId}
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
        playerViewDisplayDialogOpen={playerViewDisplayDialogOpen}
        sceneToDelete={sceneToDelete}
        folderToDelete={folderToDelete}
        mapAssetToDelete={mapAssetToDelete}
        tokenAssetToDelete={tokenAssetToDelete}
        confirmClearFogOpen={confirmClearFogOpen}
        campaign={campaign}
        activeScene={activeScene}
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
        onCancelPlayerViewDisplayDialog={() => setPlayerViewDisplayDialogOpen(false)}
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
        onRefreshDisplays={refreshDisplays}
        onConfirmDeleteScene={(scene) => void deleteScene(scene)}
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

function loadTokenLibraryHeight(): number {
  const storedHeight = Number(window.localStorage.getItem(TOKEN_LIBRARY_HEIGHT_STORAGE_KEY));
  if (!Number.isFinite(storedHeight)) {
    return DEFAULT_TOKEN_LIBRARY_HEIGHT;
  }
  return clamp(storedHeight, MIN_TOKEN_LIBRARY_HEIGHT, MAX_TOKEN_LIBRARY_HEIGHT);
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
