import { loadLocalStorageJson, readLocalStorageItem, writeLocalStorageItem, saveLocalStorageJson } from "../storage/localStorageJson";

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
export const MAX_TOKEN_LIBRARY_HEIGHT = 760;

export function loadWorkspaceLayout(storage: Pick<Storage, "getItem"> = window.localStorage): WorkspaceLayout {
  const parsed = loadLocalStorageJson(storage, WORKSPACE_LAYOUT_STORAGE_KEY, DEFAULT_WORKSPACE_LAYOUT);
  if (!isRecord(parsed)) {
    return DEFAULT_WORKSPACE_LAYOUT;
  }
  return normalizeWorkspaceLayout(parsed);
}

export function saveWorkspaceLayout(layout: WorkspaceLayout, storage: Pick<Storage, "setItem"> = window.localStorage): void {
  saveLocalStorageJson(storage, WORKSPACE_LAYOUT_STORAGE_KEY, layout);
}

export function loadTokenLibraryHeight(storage: Pick<Storage, "getItem"> = window.localStorage): number {
  const storedValue = readLocalStorageItem(storage, TOKEN_LIBRARY_HEIGHT_STORAGE_KEY);
  if (!storedValue) {
    return DEFAULT_TOKEN_LIBRARY_HEIGHT;
  }
  const storedHeight = Number(storedValue);
  if (!Number.isFinite(storedHeight)) {
    return DEFAULT_TOKEN_LIBRARY_HEIGHT;
  }
  return normalizeTokenLibraryHeight(storedHeight);
}

export function saveTokenLibraryHeight(height: number, storage: Pick<Storage, "setItem"> = window.localStorage): void {
  writeLocalStorageItem(storage, TOKEN_LIBRARY_HEIGHT_STORAGE_KEY, String(height));
}

export function normalizeWorkspaceLayout(layout: Partial<WorkspaceLayout>): WorkspaceLayout {
  return {
    leftWidth: clamp(layout.leftWidth ?? DEFAULT_WORKSPACE_LAYOUT.leftWidth, MIN_LEFT_PANEL_WIDTH, MAX_PANEL_WIDTH),
    rightWidth: clamp(layout.rightWidth ?? DEFAULT_WORKSPACE_LAYOUT.rightWidth, MIN_RIGHT_PANEL_WIDTH, MAX_PANEL_WIDTH),
    leftCollapsed: typeof layout.leftCollapsed === "boolean" ? layout.leftCollapsed : DEFAULT_WORKSPACE_LAYOUT.leftCollapsed,
    rightCollapsed: typeof layout.rightCollapsed === "boolean" ? layout.rightCollapsed : DEFAULT_WORKSPACE_LAYOUT.rightCollapsed
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

export interface WorkspacePanelResizePlan {
  side: WorkspacePanelSide;
  startClientX: number;
  startWidth: number;
}

export function getWorkspacePanelResizePlan(layout: WorkspaceLayout, side: WorkspacePanelSide, startClientX: number): WorkspacePanelResizePlan {
  return {
    side,
    startClientX,
    startWidth: getWorkspacePanelWidth(layout, side)
  };
}

export function getResizedWorkspacePanelLayout(layout: WorkspaceLayout, plan: WorkspacePanelResizePlan, currentClientX: number): WorkspaceLayout {
  const delta = getWorkspacePanelResizeDelta(plan.side, plan.startClientX, currentClientX);
  return resizePanelWidth(layout, plan.side, plan.startWidth, delta);
}

export function getWorkspacePanelResizeDelta(side: WorkspacePanelSide, startClientX: number, currentClientX: number): number {
  return side === "left" ? currentClientX - startClientX : startClientX - currentClientX;
}

export function getWorkspacePanelWidth(layout: WorkspaceLayout, side: WorkspacePanelSide): number {
  if (side === "left") {
    return layout.leftWidth;
  }
  return layout.rightWidth;
}

export function getTokenLibraryResizeHeight(startHeight: number, startClientY: number, currentClientY: number): number {
  return normalizeTokenLibraryHeight(startHeight + startClientY - currentClientY);
}

export interface TokenLibraryResizePlan {
  startClientY: number;
  startHeight: number;
}

export function getTokenLibraryResizePlan(startHeight: number, startClientY: number): TokenLibraryResizePlan {
  return {
    startClientY,
    startHeight
  };
}

export function getResizedTokenLibraryHeight(plan: TokenLibraryResizePlan, currentClientY: number): number {
  return getTokenLibraryResizeHeight(plan.startHeight, plan.startClientY, currentClientY);
}

export interface WorkspaceShellPresentation {
  className: string;
  style: {
    "--left-sidebar-width": string;
    "--right-inspector-width": string;
    "--token-library-expanded-height": string;
  };
}

export function getWorkspaceShellPresentation(layout: WorkspaceLayout, tokenLibraryHeight: number): WorkspaceShellPresentation {
  return {
    className: [
      "app-shell",
      layout.leftCollapsed ? "sidebar-collapsed" : "",
      layout.rightCollapsed ? "inspector-collapsed" : "",
      !layout.rightCollapsed && layout.rightWidth <= COMPACT_RIGHT_PANEL_WIDTH ? "inspector-compact" : ""
    ]
      .filter(Boolean)
      .join(" "),
    style: {
      "--left-sidebar-width": `${layout.leftCollapsed ? COLLAPSED_RAIL_WIDTH : layout.leftWidth}px`,
      "--right-inspector-width": `${layout.rightCollapsed ? COLLAPSED_RAIL_WIDTH : layout.rightWidth}px`,
      "--token-library-expanded-height": `${tokenLibraryHeight}px`
    }
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Partial<WorkspaceLayout> {
  return typeof value === "object" && value !== null;
}
