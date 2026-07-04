import { describe, expect, it } from "vitest";
import { createDefaultScene, type DrawingElement, type FogShape, type Layer, type Scene } from "../../src/shared/localvtt";
import {
  applyLayerPatch,
  getLayerDisplayName,
  getLayerExpandedToggleState,
  getLayerPanelVisibleLayers,
  getLayerRowClassName,
  getLayerSettingsButtonClassName,
  getLayerSettingsLabel,
  getLayerSettingsTitle,
  getLayerSettingsToggleIds,
  getLayerVisibilityButtonClassName,
  getLayerVisibilityLabel,
  getLayerVisibilityTitle,
  getReorderedDrawings,
  getReorderedFogShapes,
  hasLayerSettings
} from "../../src/renderer/components/layers/panel/layerPanelState";

describe("layer panel state helpers", () => {
  it("sorts visible layers and labels the map layer for the combined map/grid panel", () => {
    const layers = [layer("grid", 99), layer("token", 2), layer("map", 1), layer("fog", 3)];

    expect(getLayerPanelVisibleLayers(layers).map((entry) => entry.id)).toEqual(["fog", "token", "map"]);
    expect(getLayerDisplayName(layer("map", 1, "Map"))).toBe("Grid & Maps");
    expect(getLayerDisplayName(layer("token", 1, "Tokens"))).toBe("Tokens");
  });

  it("formats layer row and button presentation state", () => {
    expect(getLayerRowClassName(true)).toBe("layer-row expandable-layer-row");
    expect(getLayerRowClassName(false)).toBe("layer-row");
    expect(getLayerVisibilityButtonClassName(true)).toBe("icon-button layer-visibility-button layer-visibility-active");
    expect(getLayerVisibilityButtonClassName(false)).toBe("icon-button layer-visibility-button");
    expect(getLayerSettingsButtonClassName(true)).toBe("icon-button layer-settings-button layer-settings-active");
    expect(getLayerSettingsButtonClassName(false)).toBe("icon-button layer-settings-button");
    expect(getLayerVisibilityLabel("Tokens", "GM", true)).toBe("Hide Tokens in GM View");
    expect(getLayerVisibilityLabel("Tokens", "Player", false)).toBe("Show Tokens in Player View");
    expect(getLayerVisibilityTitle(true, "GM")).toBe("Hide in GM View");
    expect(getLayerVisibilityTitle(false, "Player")).toBe("Show in Player View");
    expect(getLayerSettingsLabel("Fog", true, true)).toBe("Hide Fog settings");
    expect(getLayerSettingsLabel("Lighting", false, false)).toBe("Lighting settings unavailable");
    expect(getLayerSettingsTitle(true, false)).toBe("Show layer settings");
    expect(getLayerSettingsTitle(false, false)).toBe("No layer settings yet");
  });

  it("identifies layers with settings panels", () => {
    expect(hasLayerSettings("map")).toBe(true);
    expect(hasLayerSettings("fog")).toBe(true);
    expect(hasLayerSettings("effects")).toBe(true);
    expect(hasLayerSettings("weather")).toBe(true);
    expect(hasLayerSettings("token")).toBe(false);
  });

  it("toggles expanded layers and closes matching settings panels", () => {
    const fromCollapsed = getLayerExpandedToggleState("fog", new Set(), new Set());
    expect([...fromCollapsed.expandedLayerIds]).toEqual(["fog"]);
    expect([...fromCollapsed.settingsLayerIds]).toEqual([]);

    const fromExpanded = getLayerExpandedToggleState("fog", new Set(["fog"]), new Set());
    expect([...fromExpanded.expandedLayerIds]).toEqual([]);

    const fromSettings = getLayerExpandedToggleState("fog", new Set(), new Set(["fog"]));
    expect([...fromSettings.expandedLayerIds]).toEqual(["fog"]);
    expect([...fromSettings.settingsLayerIds]).toEqual([]);
  });

  it("keeps only one settings panel open at a time", () => {
    expect([...getLayerSettingsToggleIds("fog", new Set())]).toEqual(["fog"]);
    expect([...getLayerSettingsToggleIds("map", new Set(["fog"]))]).toEqual(["map"]);
    expect([...getLayerSettingsToggleIds("map", new Set(["map"]))]).toEqual([]);
  });

  it("applies layer visibility changes to layers, grid mirrors, and token defaults", () => {
    const scene = sceneWithLayers();
    const gridUpdated = applyLayerPatch(scene, "grid", { visibleInGm: false, visibleInPlayer: false }, "2026-07-04T10:00:00.000Z");

    expect(gridUpdated.grid.showOnGm).toBe(false);
    expect(gridUpdated.grid.showOnPlayer).toBe(false);
    expect(gridUpdated.updatedAt).toBe("2026-07-04T10:00:00.000Z");

    const tokenUpdated = applyLayerPatch(scene, "token", { visibleInGm: false, visibleInPlayer: false }, "2026-07-04T10:00:00.000Z");
    expect(tokenUpdated.layers.find((entry) => entry.id === "token")).toMatchObject({ visibleInGm: false, visibleInPlayer: false });
    expect(tokenUpdated.tokens).toEqual([
      expect.objectContaining({ id: "token-1", visibleInGm: false, visibleInPlayer: false }),
      expect.objectContaining({ id: "token-2", visibleInGm: false, visibleInPlayer: false })
    ]);
  });

  it("reorders fog shapes with fallback names and reorders drawings", () => {
    const shapes: FogShape[] = [
      { id: "shape-1", operation: "hide", kind: "rectangle", points: [] },
      { id: "shape-2", name: "  Custom  ", operation: "reveal", kind: "circle", points: [] },
      { id: "shape-3", operation: "hide", kind: "polygon", points: [] }
    ];
    const drawings: DrawingElement[] = [
      drawing("drawing-1"),
      drawing("drawing-2"),
      drawing("drawing-3")
    ];

    const reorderedShapes = getReorderedFogShapes(shapes, "shape-1", "shape-3", "after");
    expect(reorderedShapes.map((shape) => shape.id)).toEqual(["shape-2", "shape-3", "shape-1"]);
    expect(reorderedShapes.find((shape) => shape.id === "shape-1")?.name).toBe("Hide Rectangle 1");
    expect(reorderedShapes.find((shape) => shape.id === "shape-2")?.name).toBe("Custom");

    expect(getReorderedFogShapes(shapes, "shape-1", "shape-1", "after")).toEqual(shapes);
    expect(getReorderedDrawings(drawings, "drawing-1", "drawing-3", "before").map((entry) => entry.id)).toEqual([
      "drawing-2",
      "drawing-1",
      "drawing-3"
    ]);
    expect(getReorderedDrawings(drawings, "drawing-2", "drawing-2", "before")).toEqual(drawings);
  });
});

function layer(id: Layer["id"], order: number, name = id): Layer {
  return { id, name, kind: id, order, visibleInGm: true, visibleInPlayer: true };
}

function sceneWithLayers(): Scene {
  const scene = createDefaultScene("Layers");
  scene.layers = [layer("grid", 99), layer("token", 4), layer("map", 3), layer("fog", 2)];
  scene.tokens = [
    { id: "token-1", name: "One", assetId: null, position: { x: 0, y: 0 }, size: { width: 50, height: 50 }, hidden: false, visibleInPlayer: true },
    { id: "token-2", name: "Two", assetId: null, position: { x: 50, y: 0 }, size: { width: 50, height: 50 }, hidden: false, visibleInPlayer: true }
  ];
  return scene;
}

function drawing(id: string): DrawingElement {
  return { id, kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 4, visibleInPlayer: true };
}
