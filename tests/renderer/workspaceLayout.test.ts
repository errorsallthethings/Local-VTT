import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  loadWorkspaceLayout,
  normalizeWorkspaceLayout,
  resetPanelWidth,
  resizePanelWidth,
  toggleWorkspacePanel,
  type WorkspaceLayout
} from "../../src/renderer/lib/workspaceLayout";

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

  it("toggles collapse state without changing widths", () => {
    expect(toggleWorkspacePanel(layout, "left")).toEqual({ ...layout, leftCollapsed: true });
    expect(toggleWorkspacePanel(layout, "right")).toEqual({ ...layout, rightCollapsed: true });
  });

  it("resizes and resets panel widths", () => {
    expect(resizePanelWidth(layout, "left", 300, 40).leftWidth).toBe(340);
    expect(resizePanelWidth(layout, "right", 360, -200).rightWidth).toBe(250);
    expect(resetPanelWidth(layout, "right").rightWidth).toBe(DEFAULT_WORKSPACE_LAYOUT.rightWidth);
  });
});
