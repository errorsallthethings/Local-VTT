import { useCallback, useEffect, useMemo, type Dispatch, type PointerEvent as ReactPointerEvent, type SetStateAction } from "react";
import type { Campaign, CampaignSummary } from "../../shared/localvtt";
import { addRecentCampaign, removeRecentCampaign, saveRecentCampaigns, type RecentCampaign } from "../lib/campaign";
import { getCollapsedFolderIds, pruneExpandedFolderIds, toggleExpandedFolderId } from "../lib/scene";
import {
  DEFAULT_TOKEN_LIBRARY_HEIGHT,
  getResizedTokenLibraryHeight,
  getResizedWorkspacePanelLayout,
  getTokenLibraryResizePlan,
  getWorkspacePanelResizePlan,
  getWorkspaceShellPresentation,
  resetPanelWidth as resetWorkspacePanelWidth,
  saveTokenLibraryHeight,
  saveWorkspaceLayout,
  startWindowPointerDrag,
  toggleWorkspacePanel as toggleWorkspacePanelLayout,
  type WorkspaceLayout,
  type WorkspacePanelSide
} from "../lib/workspace";

interface UseGmWorkspaceShellActionsOptions {
  campaign: Campaign | null;
  expandedFolderIds: Set<string>;
  recentCampaigns: RecentCampaign[];
  tokenLibraryHeight: number;
  workspaceLayout: WorkspaceLayout;
  setExpandedFolderIds: Dispatch<SetStateAction<Set<string>>>;
  setOpenFolderMenuId: (folderId: string | null) => void;
  setOpenSceneMenuId: (sceneId: string | null) => void;
  setPlayersPanelOpen: (open: boolean) => void;
  setRecentCampaigns: Dispatch<SetStateAction<RecentCampaign[]>>;
  setTokenLibraryExpanded: (expanded: boolean) => void;
  setTokenLibraryHeight: Dispatch<SetStateAction<number>>;
  setWorkspaceLayout: Dispatch<SetStateAction<WorkspaceLayout>>;
}

export function useGmWorkspaceShellActions({
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
}: UseGmWorkspaceShellActionsOptions) {
  useEffect(() => {
    saveWorkspaceLayout(workspaceLayout);
  }, [workspaceLayout]);

  useEffect(() => {
    saveTokenLibraryHeight(tokenLibraryHeight);
  }, [tokenLibraryHeight]);

  useEffect(() => {
    saveRecentCampaigns(recentCampaigns);
  }, [recentCampaigns]);

  useEffect(() => {
    setExpandedFolderIds((ids) => pruneExpandedFolderIds(ids, campaign?.sceneFolders));
  }, [campaign?.sceneFolders, campaign, setExpandedFolderIds]);

  const collapsedFolderIds = useMemo(
    () => getCollapsedFolderIds(campaign?.sceneFolders, expandedFolderIds),
    [campaign?.sceneFolders, expandedFolderIds]
  );

  const rememberCampaign = useCallback((summary: CampaignSummary) => {
    setRecentCampaigns((recents) => addRecentCampaign(recents, summary.campaign, summary.campaignPath));
  }, [setRecentCampaigns]);

  const removeRecentCampaignPath = useCallback((campaignPathToRemove: string) => {
    setRecentCampaigns((recents) => removeRecentCampaign(recents, campaignPathToRemove));
  }, [setRecentCampaigns]);

  const resetSceneLibraryUi = useCallback(() => {
    setOpenSceneMenuId(null);
    setOpenFolderMenuId(null);
    setExpandedFolderIds(new Set());
    setPlayersPanelOpen(false);
    setTokenLibraryExpanded(false);
    setWorkspaceLayout((layout) => ({ ...layout, leftCollapsed: false, rightCollapsed: false }));
  }, [setExpandedFolderIds, setOpenFolderMenuId, setOpenSceneMenuId, setPlayersPanelOpen, setTokenLibraryExpanded, setWorkspaceLayout]);

  const handleCampaignOpened = useCallback(
    (summary: CampaignSummary) => {
      resetSceneLibraryUi();
      rememberCampaign(summary);
    },
    [rememberCampaign, resetSceneLibraryUi]
  );

  const toggleFolderCollapsed = (folderId: string) => {
    setExpandedFolderIds((ids) => toggleExpandedFolderId(ids, folderId));
  };

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

  return {
    appShellPresentation: getWorkspaceShellPresentation(workspaceLayout, tokenLibraryHeight),
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
  };
}
