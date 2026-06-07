import { describe, expect, it } from "vitest";
import {
  assertValidCampaign,
  assertValidScene,
  createDefaultCampaign,
  createDefaultScene,
  DEFAULT_CALIBRATION,
  DEFAULT_FOG,
  DEFAULT_GRID,
  DEFAULT_LAYERS,
  DEFAULT_MAP_TRANSFORM,
  DEFAULT_MEASUREMENT,
  DEFAULT_SCENE_FOLDER_COLOR,
  DEFAULT_VIDEO_PLAYBACK,
  isPlayerSceneProjection,
  normalizeCampaign,
  normalizeScene,
  projectSceneForPlayer,
  type Asset,
  type Campaign,
  type Scene
} from "../../src/shared/localvtt";

const now = "2026-06-05T00:00:00.000Z";

function asset(id: string): Asset {
  return {
    id,
    name: id,
    kind: "map",
    mediaType: "image",
    relativePath: `assets/maps/${id}.png`,
    originalFileName: `${id}.png`,
    createdAt: now
  };
}

describe("LocalVTT shared model helpers", () => {
it("normalizeScene fills default settings for older scene files", () => {
  const partialScene = {
    id: "scene-1",
    name: "Old Scene",
    createdAt: now,
    updatedAt: now,
    layers: [{ ...DEFAULT_LAYERS[0], visibleInPlayer: true }],
    grid: { type: "square", sizePx: 80 },
    fog: { opacity: 0.8 },
    notes: "GM notes"
  } as unknown as Scene;

  const normalized = normalizeScene(partialScene);

  expect(normalized.grid.type).toBe("square");
  expect(normalized.grid.sizePx).toBe(80);
  expect(normalized.grid.measurement).toEqual(DEFAULT_MEASUREMENT);
  expect(normalized.calibration).toEqual(DEFAULT_CALIBRATION);
  expect(normalized.mapTransform).toEqual(DEFAULT_MAP_TRANSFORM);
  expect(normalized.videoPlayback).toEqual(DEFAULT_VIDEO_PLAYBACK);
  expect(normalized.layerOrderLocked).toBe(true);
  expect(normalized.layers.length).toBe(DEFAULT_LAYERS.length);
  expect(normalized.fog.opacity).toBe(0.8);
  expect(normalized.fog.gmOpacity).toBe(0.5);
  expect(normalized.fog.playerOpacity).toBe(0.8);
  expect(normalized.fog.newShapesVisibleInPlayer).toBe(true);
});

it("normalizeScene applies canonical core layer names and order", () => {
  const scene = createDefaultScene("Layers");
  scene.layers = scene.layers.map((layer) => ({
    ...layer,
    name: `${layer.name} Legacy`,
    order: layer.id === "grid" ? 70 : layer.order
  }));

  const normalized = normalizeScene(scene);

  expect(normalized.layers.map((layer) => layer.name)).toEqual([
    "GM",
    "Fog of War",
    "Weather",
    "Foreground",
    "Tokens",
    "Objects",
    "Dynamic Lighting",
    "Grid",
    "Map"
  ]);
  expect([...normalized.layers].sort((a, b) => b.order - a.order).map((layer) => layer.id)).toEqual([
    "gm",
    "fog",
    "weather",
    "foreground",
    "token",
    "object",
    "lighting",
    "grid",
    "map"
  ]);
});

it("normalizeScene fills token presentation defaults for older scene files", () => {
  const scene = createDefaultScene("Token Scene");
  scene.tokens = [
    {
      id: "token-1",
      name: "Hero",
      assetId: "hero",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      hidden: false,
      visibleInPlayer: true
    }
  ];

  const normalized = normalizeScene(scene);

  expect(normalized.tokens[0]).toMatchObject({
    sizePreset: "medium",
    mask: "circle",
    borderColor: "#7aa2f7",
    borderStyle: "none",
    order: 1,
    visibleInGm: true,
    visibleInPlayer: true
  });
});

it("normalizeScene preserves expanded token border styles", () => {
  const scene = createDefaultScene("Token Borders");
  scene.tokens = [
    {
      id: "token-1",
      name: "Dashed",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      borderStyle: "dashed",
      hidden: false,
      visibleInPlayer: true
    },
    {
      id: "token-2",
      name: "Dotted",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      borderStyle: "dotted",
      hidden: false,
      visibleInPlayer: true
    },
    {
      id: "token-3",
      name: "Double",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      borderStyle: "double-line",
      hidden: false,
      visibleInPlayer: true
    }
  ];

  expect(normalizeScene(scene).tokens.map((token) => token.borderStyle)).toEqual(["dashed", "dotted", "double-line"]);
});

it("projectSceneForPlayer preserves expanded token border presentation", () => {
  const campaign = createDefaultCampaign("Player Borders");
  campaign.assets = [
    {
      ...asset("token-asset"),
      kind: "token",
      relativePath: "assets/tokens/token-asset.png",
      originalFileName: "token-asset.png"
    }
  ];
  const scene = createDefaultScene("Token Borders");
  scene.tokens = [
    {
      id: "token-1",
      name: "Dashed",
      assetId: "token-asset",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      borderColor: "#ff3366",
      borderStyle: "dashed",
      borderWidth: 24,
      hidden: false,
      visibleInPlayer: true
    },
    {
      id: "token-2",
      name: "Dotted",
      assetId: "token-asset",
      position: { x: 100, y: 0 },
      size: { width: 100, height: 100 },
      borderStyle: "dotted",
      hidden: false,
      visibleInPlayer: true
    },
    {
      id: "token-3",
      name: "Double",
      assetId: "token-asset",
      position: { x: 200, y: 0 },
      size: { width: 100, height: 100 },
      borderStyle: "double-line",
      hidden: false,
      visibleInPlayer: true
    }
  ];

  const projection = projectSceneForPlayer(campaign, scene);

  expect(projection.scene.tokens.map((token) => token.borderStyle)).toEqual(["dashed", "dotted", "double-line"]);
  expect(projection.scene.tokens[0]).toMatchObject({
    borderColor: "#ff3366",
    borderWidth: 24
  });
});

it("normalizeScene makes legacy fog shapes visible in GM and Player views", () => {
  const scene = createDefaultScene("Legacy Fog");
  scene.fog.shapes = [
    { id: "shape-1", operation: "reveal", kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
    { id: "shape-2", operation: "hide", kind: "brush", points: [{ x: 5, y: 5 }], radius: 12, visible: false }
  ];

  const normalized = normalizeScene(scene);

  expect(normalized.fog.shapes[0].visible).toBe(true);
  expect(normalized.fog.shapes[0].visibleInGm).toBe(true);
  expect(normalized.fog.shapes[0].visibleInPlayer).toBe(true);
  expect(normalized.fog.shapes[1].visible).toBe(false);
  expect(normalized.fog.shapes[1].visibleInGm).toBe(false);
  expect(normalized.fog.shapes[1].visibleInPlayer).toBe(false);
});

it("normalizeScene assigns stable ids to legacy fog shapes without ids", () => {
  const scene = createDefaultScene("Legacy Fog Ids");
  scene.fog.shapes = [
    { operation: "reveal", kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
    { id: "", operation: "hide", kind: "brush", points: [{ x: 5, y: 5 }], radius: 12 },
    { id: "fog-shape-1", operation: "reveal", kind: "polygon", points: [{ x: 0, y: 0 }, { x: 5, y: 10 }, { x: 10, y: 0 }] }
  ] as Scene["fog"]["shapes"];

  const normalized = normalizeScene(scene);

  expect(normalized.fog.shapes.map((shape) => shape.id)).toEqual(["fog-shape-1", "fog-shape-2", "fog-shape-1-2"]);
  expect(normalized.fog.shapes.map((shape) => shape.name)).toEqual(["Reveal Rectangle 1", "Hide Brush 2", "Reveal Polygon 3"]);
});

it("normalizeCampaign fills portable campaign defaults and empty collections", () => {
  const campaign = {
    id: "campaign-1",
    name: "Campaign",
    description: "",
    createdAt: now,
    updatedAt: now,
    scenes: []
  } as unknown as Campaign;

  const normalized = normalizeCampaign(campaign);

  expect(normalized.defaultGrid).toEqual(DEFAULT_GRID);
  expect(normalized.defaultMeasurement).toEqual(DEFAULT_MEASUREMENT);
  expect(normalized.defaultCalibration).toEqual(DEFAULT_CALIBRATION);
  expect(normalized.playerDisplay).toEqual(DEFAULT_CALIBRATION);
  expect(normalized.sceneLibrary).toEqual({ collapsedFolderIds: [] });
  expect(normalized.sceneFolders).toEqual([]);
  expect(normalized.assets).toEqual([]);
});

it("normalizeCampaign preserves valid collapsed scene folders only", () => {
  const campaign = {
    ...createDefaultCampaign("Campaign"),
    sceneLibrary: { collapsedFolderIds: ["folder-1", "missing-folder"] },
    sceneFolders: [{ id: "folder-1", name: "Chapter 1", createdAt: now }]
  };

  const normalized = normalizeCampaign(campaign);

  expect(normalized.sceneLibrary.collapsedFolderIds).toEqual(["folder-1"]);
  expect(normalized.sceneFolders[0].color).toBe(DEFAULT_SCENE_FOLDER_COLOR);
});

it("projectSceneForPlayer removes GM-only scene data and unused assets", () => {
  const campaign = createDefaultCampaign("Player Safe Campaign");
  campaign.assets = [asset("map"), asset("visible-token"), asset("hidden-token"), asset("overlay"), asset("unused")];
  campaign.playerDisplay = { ...campaign.playerDisplay, physicalScaleEnabled: true, pixelsPerInch: 120 };

  const scene = createDefaultScene("Scene");
  scene.mapAssetId = "map";
  scene.tokens = [
    {
      id: "token-1",
      name: "Visible",
      assetId: "visible-token",
      position: { x: 10, y: 10 },
      size: { width: 50, height: 50 },
      hidden: false,
      visibleInPlayer: true
    },
    {
      id: "token-2",
      name: "Hidden",
      assetId: "hidden-token",
      position: { x: 20, y: 20 },
      size: { width: 50, height: 50 },
      hidden: true,
      visibleInPlayer: true
    }
  ];
  scene.walls = [{ id: "wall", type: "wall", points: [{ x: 0, y: 0 }], color: "#fff", thickness: 2 }];
  scene.drawings = [
    { id: "drawing-visible", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 2, visibleInPlayer: true },
    { id: "drawing-hidden", kind: "line", points: [], color: "#fff", opacity: 1, strokeWidth: 2, visibleInPlayer: false }
  ];
  scene.overlays = [
    { id: "overlay-visible", assetId: "overlay", layerId: "weather", position: { x: 0, y: 0 }, scale: 1, rotation: 0, opacity: 1, visibleInPlayer: true },
    { id: "overlay-hidden", assetId: "unused", layerId: "gm", position: { x: 0, y: 0 }, scale: 1, rotation: 0, opacity: 1, visibleInPlayer: true }
  ];
  scene.notes = "Secret notes";
  scene.fog.shapes = [
    { id: "player-fog", operation: "reveal", kind: "rectangle", points: [], visibleInGm: true, visibleInPlayer: true },
    { id: "gm-fog", operation: "hide", kind: "rectangle", points: [], visibleInGm: true, visibleInPlayer: false }
  ];

  const projection = projectSceneForPlayer(campaign, scene);

  expect(projection.campaignName).toBe(campaign.name);
  expect(projection.playerDisplay.pixelsPerInch).toBe(120);
  expect(
    projection.scene.layers.map((layer) => layer.id),
  ).toEqual(["fog", "weather", "foreground", "object", "lighting", "grid", "map"]);
  expect(
    projection.scene.tokens.map((token) => token.id),
  ).toEqual(["token-1"]);
  expect(projection.scene.walls).toEqual([]);
  expect(
    projection.scene.drawings.map((drawing) => drawing.id),
  ).toEqual(["drawing-visible"]);
  expect(
    projection.scene.overlays.map((overlay) => overlay.id),
  ).toEqual(["overlay-visible"]);
  expect(projection.scene.notes).toBe("");
  expect(projection.scene.fog.shapes.map((shape) => shape.id)).toEqual(["player-fog"]);
  expect(
    projection.assets.map((projectionAsset) => projectionAsset.id).sort(),
  ).toEqual(["map", "overlay", "visible-token"]);
});

it("runtime validators reject invalid files and accept valid projected state", () => {
  expect(() => assertValidCampaign(createDefaultCampaign("Valid"))).not.toThrow();
  expect(() => assertValidCampaign({ id: "", name: "Broken", scenes: [] })).toThrow(/Invalid campaign/);
  expect(() => assertValidScene(createDefaultScene("Valid"))).not.toThrow();
  expect(() => assertValidScene({ id: "scene", name: "Broken", layers: "nope" })).toThrow(/Invalid scene/);

  const campaign = createDefaultCampaign("Campaign");
  const scene = createDefaultScene("Scene");
  expect(isPlayerSceneProjection(projectSceneForPlayer(campaign, scene))).toBe(true);
  expect(isPlayerSceneProjection({ campaignName: "Bad", playerDisplay: {}, assets: [], scene: {} })).toBe(false);
});

it("default creators return isolated nested collections", () => {
  const first = createDefaultScene("First");
  const second = createDefaultScene("Second");

  first.layers[0].name = "Changed";
  first.fog.shapes.push({ id: "shape", operation: "reveal", kind: "rectangle", points: [] });

  expect(second.layers[0].name).toBe(DEFAULT_LAYERS[0].name);
  expect(second.fog).toEqual(DEFAULT_FOG);
});
});
