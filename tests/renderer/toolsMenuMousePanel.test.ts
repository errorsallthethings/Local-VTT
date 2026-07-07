import { describe, expect, it } from "vitest";
import {
  getSelectorSelectionFilterControls,
  SELECTOR_SELECTION_FILTER_CONTROLS,
  updateSelectorSelectionFilter
} from "../../src/renderer/components/tools/menu/ToolsMenuMousePanel";
import type { SelectorSelectionFilters } from "../../src/renderer/components/tools/settings/SelectorToolControls";

const selectorFilters: SelectorSelectionFilters = {
  tokens: true,
  templates: false,
  fogMasks: true,
  weatherMasks: false,
  drawings: true
};

describe("tools menu mouse panel", () => {
  it("keeps selector filter controls in a stable user-facing order", () => {
    expect(SELECTOR_SELECTION_FILTER_CONTROLS).toEqual([
      { key: "tokens", label: "Token" },
      { key: "templates", label: "Template" },
      { key: "fogMasks", label: "Fog Mask" },
      { key: "weatherMasks", label: "Weather Mask" },
      { key: "drawings", label: "Drawings" }
    ]);
  });

  it("maps selector filter controls to their checked state", () => {
    expect(getSelectorSelectionFilterControls(selectorFilters)).toEqual([
      { key: "tokens", label: "Token", checked: true },
      { key: "templates", label: "Template", checked: false },
      { key: "fogMasks", label: "Fog Mask", checked: true },
      { key: "weatherMasks", label: "Weather Mask", checked: false },
      { key: "drawings", label: "Drawings", checked: true }
    ]);
  });

  it("updates one selector filter without mutating the current filter object", () => {
    const nextFilters = updateSelectorSelectionFilter(selectorFilters, "templates", true);

    expect(nextFilters).toEqual({
      ...selectorFilters,
      templates: true
    });
    expect(nextFilters).not.toBe(selectorFilters);
    expect(selectorFilters.templates).toBe(false);
  });
});
