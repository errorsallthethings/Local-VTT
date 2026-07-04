import { describe, expect, it } from "vitest";
import {
  getLayerItemActionButtonClassName,
  getLayerItemHighlightLabel,
  getLayerItemHighlightTitle,
  getLayerItemRowClassName,
  getLayerItemToggleLabel,
  getLayerItemToggleTitle,
  getLayerItemVisibilityLabel,
  getLayerItemVisibilityTitle,
  getReorderedLayerItems,
  getReorderedTokenLayerItems,
  patchLayerItemById,
  removeLayerItemById
} from "../../src/renderer/components/layers/panel/layerItemRows";

describe("layer item row helpers", () => {
  it("builds row class names for selected, muted, dragging, dropped, and menu-open states", () => {
    expect(getLayerItemRowClassName({ visible: true, selected: false })).toBe("fog-shape-row");
    expect(getLayerItemRowClassName({ visible: false, selected: true, dragging: true, dropPlacement: "after" })).toBe(
      "fog-shape-row fog-shape-row-muted fog-shape-row-selected fog-shape-row-dragging fog-shape-row-drop-after"
    );
    expect(getLayerItemRowClassName({ visible: true, selected: true, variant: "weather-mask" })).toBe(
      "fog-shape-row weather-mask-row fog-shape-row-selected"
    );
    expect(getLayerItemRowClassName({ visible: true, selected: false, variant: "token", menuOpen: true })).toBe(
      "fog-shape-row token-shape-row token-shape-row-menu-open"
    );
  });

  it("builds action button classes and labels", () => {
    expect(getLayerItemActionButtonClassName(false)).toBe("icon-button fog-shape-action-button");
    expect(getLayerItemActionButtonClassName(true)).toBe("icon-button fog-shape-action-button fog-shape-action-active");
    expect(getLayerItemActionButtonClassName(false, true)).toBe("icon-button fog-shape-action-button danger");
    expect(getLayerItemVisibilityLabel("Goblin", "GM", true)).toBe("Hide Goblin in GM View");
    expect(getLayerItemVisibilityLabel("Goblin", "Player", false)).toBe("Show Goblin in Player View");
    expect(getLayerItemVisibilityTitle("GM", true)).toBe("Hide in GM View");
    expect(getLayerItemVisibilityTitle("Player", false)).toBe("Show in Player View");
    expect(getLayerItemToggleLabel("Rain Mask", true)).toBe("Disable Rain Mask");
    expect(getLayerItemToggleTitle("mask", false)).toBe("Enable mask");
    expect(getLayerItemHighlightLabel("Rain Mask", true)).toBe("Hide Rain Mask highlight");
    expect(getLayerItemHighlightTitle("mask", false)).toBe("Highlight mask");
  });

  it("patches and removes items by id without changing other entries", () => {
    const items = [
      { id: "one", visible: true },
      { id: "two", visible: true }
    ];

    expect(patchLayerItemById(items, "two", { visible: false })).toEqual([
      { id: "one", visible: true },
      { id: "two", visible: false }
    ]);
    expect(patchLayerItemById(items, "missing", { visible: false })).toEqual(items);
    expect(removeLayerItemById(items, "one")).toEqual([{ id: "two", visible: true }]);
  });

  it("reorders generic layer items and token rows", () => {
    const items = [{ id: "one" }, { id: "two" }, { id: "three" }];
    const tokens = [
      { id: "one", order: 0 },
      { id: "two", order: 1 },
      { id: "three", order: 2 }
    ];

    expect(getReorderedLayerItems(items, "one", "three", "before").map((item) => item.id)).toEqual(["two", "one", "three"]);
    expect(getReorderedLayerItems(items, "two", "two", "after")).toEqual(items);
    expect(getReorderedTokenLayerItems(tokens, "three", "one", "before")).toEqual([
      { id: "three", order: 0 },
      { id: "one", order: 1 },
      { id: "two", order: 2 }
    ]);
  });
});
