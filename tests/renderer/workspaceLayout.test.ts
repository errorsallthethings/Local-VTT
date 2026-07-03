import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  DEFAULT_TOKEN_LIBRARY_HEIGHT,
  loadWorkspaceLayout,
  loadTokenLibraryHeight,
  getTokenLibraryResizeHeight,
  getWorkspacePanelResizeDelta,
  getWorkspaceShellPresentation,
  normalizeTokenLibraryHeight,
  normalizeWorkspaceLayout,
  MAX_TOKEN_LIBRARY_HEIGHT,
  resetPanelWidth,
  resizePanelWidth,
  toggleWorkspacePanel,
  type WorkspaceLayout
} from "../../src/renderer/lib/workspace";

const layout: WorkspaceLayout = {
  leftWidth: 300,
  rightWidth: 360,
  leftCollapsed: false,
  rightCollapsed: false
};

describe("workspace layout helpers", () => {
  it("normalizes saved panel widths into supported bounds", () => {
    expect(normalizeWorkspaceLayout({ leftWidth: 100, rightWidth: 900, leftCollapsed: true })).toEqual({
      leftWidth: 260,
      rightWidth: 520,
      leftCollapsed: true,
      rightCollapsed: false
    });
  });

  it("loads default layout when storage is empty or invalid", () => {
    expect(loadWorkspaceLayout({ getItem: () => null })).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    expect(loadWorkspaceLayout({ getItem: () => "{bad json" })).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("loads and normalizes stored workspace layout", () => {
    const stored = JSON.stringify({ leftWidth: 420, rightWidth: 200, rightCollapsed: true });

    expect(loadWorkspaceLayout({ getItem: () => stored })).toEqual({
      leftWidth: 420,
      rightWidth: 250,
      leftCollapsed: false,
      rightCollapsed: true
    });
  });

  it("falls back to default collapse state for invalid stored values", () => {
    expect(normalizeWorkspaceLayout({ leftCollapsed: "yes" as unknown as boolean, rightCollapsed: 1 as unknown as boolean })).toMatchObject({
      leftCollapsed: false,
      rightCollapsed: false
    });
  });

  it("loads and normalizes stored token library drawer height", () => {
    expect(loadTokenLibraryHeight({ getItem: () => null })).toBe(DEFAULT_TOKEN_LIBRARY_HEIGHT);
    expect(loadTokenLibraryHeight({ getItem: () => "bad" })).toBe(DEFAULT_TOKEN_LIBRARY_HEIGHT);
    expect(loadTokenLibraryHeight({ getItem: () => "80" })).toBe(170);
    expect(loadTokenLibraryHeight({ getItem: () => "900" })).toBe(MAX_TOKEN_LIBRARY_HEIGHT);
    expect(loadTokenLibraryHeight({ getItem: () => "320" })).toBe(320);
  });

  it("toggles collapse state without changing widths", () => {
    expect(toggleWorkspacePanel(layout, "left")).toEqual({ ...layout, leftCollapsed: true });
    expect(toggleWorkspacePanel(layout, "right")).toEqual({ ...layout, rightCollapsed: true });
  });

  it("resizes and resets panel widths", () => {
    expect(resizePanelWidth(layout, "left", 300, 40).leftWidth).toBe(340);
    expect(resizePanelWidth(layout, "right", 360, -200).rightWidth).toBe(250);
    expect(resetPanelWidth(layout, "right").rightWidth).toBe(DEFAULT_WORKSPACE_LAYOUT.rightWidth);
  });

  it("derives panel resize deltas from pointer movement per side", () => {
    expect(getWorkspacePanelResizeDelta("left", 100, 140)).toBe(40);
    expect(getWorkspacePanelResizeDelta("left", 100, 80)).toBe(-20);
    expect(getWorkspacePanelResizeDelta("right", 100, 140)).toBe(-40);
    expect(getWorkspacePanelResizeDelta("right", 100, 80)).toBe(20);
  });

  it("normalizes token library drawer height into supported bounds", () => {
    expect(normalizeTokenLibraryHeight(100)).toBe(170);
    expect(normalizeTokenLibraryHeight(320)).toBe(320);
    expect(normalizeTokenLibraryHeight(900)).toBe(MAX_TOKEN_LIBRARY_HEIGHT);
  });

  it("derives token library resize height from vertical pointer movement", () => {
    expect(getTokenLibraryResizeHeight(300, 200, 150)).toBe(350);
    expect(getTokenLibraryResizeHeight(300, 200, 500)).toBe(170);
    expect(getTokenLibraryResizeHeight(700, 200, 0)).toBe(MAX_TOKEN_LIBRARY_HEIGHT);
  });

  it("builds app shell presentation from workspace layout", () => {
    expect(getWorkspaceShellPresentation(layout, 320)).toEqual({
      className: "app-shell",
      style: {
        "--left-sidebar-width": "300px",
        "--right-inspector-width": "360px",
        "--token-library-expanded-height": "320px"
      }
    });
    expect(
      getWorkspaceShellPresentation(
        {
          ...layout,
          leftCollapsed: true,
          rightCollapsed: false,
          rightWidth: 270
        },
        240
      )
    ).toEqual({
      className: "app-shell sidebar-collapsed inspector-compact",
      style: {
        "--left-sidebar-width": "44px",
        "--right-inspector-width": "270px",
        "--token-library-expanded-height": "240px"
      }
    });
    expect(getWorkspaceShellPresentation({ ...layout, rightCollapsed: true }, 240).className).toBe("app-shell inspector-collapsed");
  });
});
