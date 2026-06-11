export type WorkspacePanelSide = "left" | "right";

export type WorkspaceLayout = {
  leftWidth: number;
  rightWidth: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
};

export const WORKSPACE_LAYOUT_STORAGE_KEY = "localvtt.gmWorkspaceLayout";
export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayout = {
  leftWidth: 280,
  rightWidth: 330,
  leftCollapsed: false,
  rightCollapsed: false
};
export const MIN_LEFT_PANEL_WIDTH = 260;
export const MIN_RIGHT_PANEL_WIDTH = 250;
export const COMPACT_RIGHT_PANEL_WIDTH = 280;
export const MAX_PANEL_WIDTH = 520;
export const COLLAPSED_RAIL_WIDTH = 44;
export const TOKEN_LIBRARY_HEIGHT_STORAGE_KEY = "localvtt.tokenLibraryHeight";
export const DEFAULT_TOKEN_LIBRARY_HEIGHT = 238;
export const MIN_TOKEN_LIBRARY_HEIGHT = 170;
export const MAX_TOKEN_LIBRARY_HEIGHT = 460;

export function loadWorkspaceLayout(storage: Pick<Storage, "getItem"> = window.localStorage): WorkspaceLayout {
  try {
    const value = storage.getItem(WORKSPACE_LAYOUT_STORAGE_KEY);
    if (!value) {
      return DEFAULT_WORKSPACE_LAYOUT;
    }
    const parsed = JSON.parse(value) as Partial<WorkspaceLayout>;
    return normalizeWorkspaceLayout(parsed);
  } catch {
    return DEFAULT_WORKSPACE_LAYOUT;
  }
}

export function loadTokenLibraryHeight(storage: Pick<Storage, "getItem"> = window.localStorage): number {
  const storedValue = storage.getItem(TOKEN_LIBRARY_HEIGHT_STORAGE_KEY);
  if (!storedValue) {
    return DEFAULT_TOKEN_LIBRARY_HEIGHT;
  }
  const storedHeight = Number(storedValue);
  if (!Number.isFinite(storedHeight)) {
    return DEFAULT_TOKEN_LIBRARY_HEIGHT;
  }
  return normalizeTokenLibraryHeight(storedHeight);
}

export function normalizeWorkspaceLayout(layout: Partial<WorkspaceLayout>): WorkspaceLayout {
  return {
    leftWidth: clamp(layout.leftWidth ?? DEFAULT_WORKSPACE_LAYOUT.leftWidth, MIN_LEFT_PANEL_WIDTH, MAX_PANEL_WIDTH),
    rightWidth: clamp(layout.rightWidth ?? DEFAULT_WORKSPACE_LAYOUT.rightWidth, MIN_RIGHT_PANEL_WIDTH, MAX_PANEL_WIDTH),
    leftCollapsed: layout.leftCollapsed ?? DEFAULT_WORKSPACE_LAYOUT.leftCollapsed,
    rightCollapsed: layout.rightCollapsed ?? DEFAULT_WORKSPACE_LAYOUT.rightCollapsed
  };
}

export function normalizeTokenLibraryHeight(height: number): number {
  return clamp(height, MIN_TOKEN_LIBRARY_HEIGHT, MAX_TOKEN_LIBRARY_HEIGHT);
}

export function toggleWorkspacePanel(layout: WorkspaceLayout, side: WorkspacePanelSide): WorkspaceLayout {
  return side === "left" ? { ...layout, leftCollapsed: !layout.leftCollapsed } : { ...layout, rightCollapsed: !layout.rightCollapsed };
}

export function resetPanelWidth(layout: WorkspaceLayout, side: WorkspacePanelSide): WorkspaceLayout {
  return side === "left"
    ? { ...layout, leftWidth: DEFAULT_WORKSPACE_LAYOUT.leftWidth }
    : { ...layout, rightWidth: DEFAULT_WORKSPACE_LAYOUT.rightWidth };
}

export function resizePanelWidth(layout: WorkspaceLayout, side: WorkspacePanelSide, startWidth: number, delta: number): WorkspaceLayout {
  const minWidth = side === "left" ? MIN_LEFT_PANEL_WIDTH : MIN_RIGHT_PANEL_WIDTH;
  const width = clamp(startWidth + delta, minWidth, MAX_PANEL_WIDTH);
  return side === "left" ? { ...layout, leftWidth: width } : { ...layout, rightWidth: width };
}

export function getWorkspacePanelWidth(layout: WorkspaceLayout, side: WorkspacePanelSide): number {
  if (side === "left") {
    return layout.leftWidth;
  }
  return layout.rightWidth;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
