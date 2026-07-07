import { useState } from "react";
import { loadRecentCampaigns, type RecentCampaign } from "../lib/campaign";
import {
  loadTokenLibraryHeight,
  loadWorkspaceLayout,
  type WorkspaceLayout
} from "../lib/workspace";

export function useGmWorkspaceShellState() {
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set());
  const [tokenLibraryHeight, setTokenLibraryHeight] = useState(() => loadTokenLibraryHeight());
  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayout>(() => loadWorkspaceLayout());
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>(() => loadRecentCampaigns());

  return {
    expandedFolderIds,
    recentCampaigns,
    tokenLibraryHeight,
    workspaceLayout,
    setExpandedFolderIds,
    setRecentCampaigns,
    setTokenLibraryHeight,
    setWorkspaceLayout
  };
}
