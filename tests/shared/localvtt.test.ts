import { describe, expect, it } from "vitest";
import {
  assertValidCampaign,
  assertValidScene,
  createDefaultCampaign,
  createDefaultScene,
  duplicateScene,
  DEFAULT_CALIBRATION,
  DEFAULT_FOG,
  DEFAULT_GRID,
  DEFAULT_LAYERS,
  DEFAULT_MAP_TRANSFORM,
  DEFAULT_MEASUREMENT,
  DEFAULT_SCENE_FOLDER_COLOR,
  DEFAULT_VIDEO_PLAYBACK,
  DEFAULT_WEATHER,
  isLiveTableEvent,
  isPlayerIdleState,
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
  expect(normalized.weather).toEqual(DEFAULT_WEATHER);
  expect(normalized.fog.opacity).toBe(0.8);
  expect(normalized.fog.gmOpacity).toBe(0.5);
  expect(normalized.fog.playerOpacity).toBe(0.8);
  expect(normalized.fog.newShapesVisibleInPlayer).toBe(true);
});

it("normalizeScene clamps weather settings", () => {
  const scene = createDefaultScene("Weather");
  scene.weather = {
    enabled: true,
    effect: "rain-storm",
    intensity: 9,
    opacity: -2,
    speed: 99,
    directionDegrees: 720,
    driftStrength: 5,
    edgeBias: 4,
    quietAreaSize: 0.1,
    centerStrayDrops: -1,
    streakLength: 9,
    lightningFrequency: 3,
    flashStrength: -2,
    quality: "ultra"
  };

  const normalized = normalizeScene(scene);

  expect(normalized.weather).toEqual({
    enabled: true,
    effect: "rain-storm",
    intensity: 1,
    opacity: 0,
    color: "#d8dee9",
    speed: 3,
    directionDegrees: 360,
    driftStrength: 1,
    edgeBias: 1,
    quietAreaSize: 0.35,
    centerStrayDrops: 0,
    streakLength: 2,
    lightningFrequency: 1,
    flashStrength: 0,
    quality: "balanced",
    effectSettings: {},
    effects: {
      rain: {
        enabled: true,
        pattern: "rain-storm",
        settings: {
          intensity: 1.5,
          opacity: 0,
          color: "#d8dee9",
          speed: 3,
          directionDegrees: 360,
          driftStrength: 1,
          edgeBias: 1,
          quietAreaSize: 0.35,
          centerStrayDrops: 0,
          streakLength: 2,
          lightningFrequency: 1,
          flashStrength: 0,
          quality: "balanced"
        }
      },
      fog: DEFAULT_WEATHER.effects.fog,
      snow: DEFAULT_WEATHER.effects.snow,
      sand: DEFAULT_WEATHER.effects.sand
    },
    masks: []
  });
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

it("duplicateScene copies scene settings while assigning new runtime ids", () => {
  const scene = createDefaultScene("Original");
  scene.id = "scene-original";
  scene.mapAssetId = "map-asset";
  scene.fog.shapes = [
    {
      id: "fog-original",
      name: "Reveal",
      operation: "reveal",
      kind: "rectangle",
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ],
      visibleInGm: true,
      visibleInPlayer: true
    }
  ];
  scene.tokens = [
    {
      id: "token-original",
      name: "Goblin",
      assetId: "token-asset",
      position: { x: 50, y: 50 },
      size: { width: 100, height: 100 },
      hidden: false,
      visibleInPlayer: true
    }
  ];
  scene.lights = [
    {
      id: "light-original",
      position: { x: 50, y: 50 },
      color: "#ffffff",
      intensity: 1,
      brightRadius: 20,
      dimRadius: 40,
      opacity: 1,
      enabled: true,
      flicker: false,
      attachedTokenId: "token-original"
    }
  ];
  scene.tokenMovementPath = { tokenId: "token-original", points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] };
  let nextId = 0;

  const duplicate = duplicateScene(scene, "Original Copy", {
    sceneId: "scene-copy",
    now: "2026-06-08T00:00:00.000Z",
    createId: () => `new-id-${(nextId += 1)}`
  });

  expect(duplicate.id).toBe("scene-copy");
  expect(duplicate.name).toBe("Original Copy");
  expect(duplicate.createdAt).toBe("2026-06-08T00:00:00.000Z");
  expect(duplicate.updatedAt).toBe("2026-06-08T00:00:00.000Z");
  expect(duplicate.mapAssetId).toBe("map-asset");
  expect(duplicate.fog.shapes[0]).toMatchObject({ id: "new-id-2", name: "Reveal" });
  expect(duplicate.tokens[0]).toMatchObject({ id: "new-id-1", name: "Goblin", assetId: "token-asset" });
  expect(duplicate.lights[0].id).toBe("new-id-3");
  expect(duplicate.lights[0].attachedTokenId).toBe("new-id-1");
  expect(duplicate.tokenMovementPath).toBeUndefined();
  expect(scene.id).toBe("scene-original");
  expect(scene.tokens[0].id).toBe("token-original");
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
  expect(normalized.players).toEqual([]);
  expect(normalized.assets).toEqual([]);
});

it("normalizeCampaign normalizes campaign players", () => {
  const campaign = {
    ...createDefaultCampaign("Players"),
    players: [
      {
        id: "",
        name: "",
        color: "red",
        defaultSeatEdge: "side" as never,
        defaultSeatPosition: 9,
        visibleInPlayer: undefined as never
      }
    ]
  };

  expect(normalizeCampaign(campaign).players[0]).toMatchObject({
    id: "player-1",
    name: "Player 1",
    color: "#7aa2f7",
    defaultSeatEdge: "bottom",
    defaultSeatPosition: 1,
    visibleInPlayer: true
  });
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

it("projectSceneForPlayer preserves per-category weather tuning", () => {
  const campaign = createDefaultCampaign("Weather Campaign");
  const scene = createDefaultScene("Storm");
  scene.weather.enabled = true;
  scene.weather.effect = "rain";
  scene.weather.intensity = 0.65;
  scene.weather.opacity = 0.65;
  scene.weather.effects.rain = {
    enabled: true,
    pattern: "rain",
    settings: {
      ...scene.weather.effects.rain.settings,
      intensity: 0.25,
      opacity: 0.35,
      speed: 1.4,
      edgeBias: 0.2,
      quietAreaSize: 0.85
    }
  };

  const projection = projectSceneForPlayer(campaign, scene);

  expect(projection.scene.weather.effects.rain.settings).toMatchObject({
    intensity: 0.25,
    opacity: 0.35,
    speed: 1.4,
    edgeBias: 0.2,
    quietAreaSize: 0.85
  });
});

it("projectSceneForPlayer preserves snow weather tuning", () => {
  const campaign = createDefaultCampaign("Weather Campaign");
  const scene = createDefaultScene("Snow Field");
  scene.weather.enabled = true;
  scene.weather.effect = "snow";
  scene.weather.effects.snow = {
    enabled: true,
    pattern: "blizzard",
    settings: {
      ...scene.weather.effects.snow.settings,
      intensity: 0.9,
      opacity: 0.7,
      speed: 1.25,
      driftStrength: 0.5
    }
  };

  const projection = projectSceneForPlayer(campaign, scene);

  expect(projection.scene.weather.effects.snow.settings).toMatchObject({
    intensity: 0.9,
    opacity: 0.7,
    speed: 1.25,
    driftStrength: 0.5
  });
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
  expect(isPlayerIdleState({ type: "idle", title: "Waiting", message: "Preparing scene." })).toBe(true);
  expect(isPlayerIdleState({ type: "idle", variant: "hold", title: "Waiting", message: "Preparing scene." })).toBe(true);
  expect(isPlayerIdleState({ type: "idle", variant: "blackout", title: "", message: "" })).toBe(true);
  expect(isPlayerIdleState({ type: "idle", variant: "dim", title: "Waiting", message: "Preparing scene." })).toBe(false);
  expect(isPlayerIdleState({ type: "idle", title: "Waiting" })).toBe(false);
  expect(isLiveTableEvent({ id: "ping", type: "ping", point: { x: 1, y: 2 }, createdAt: 1 })).toBe(true);
  expect(isLiveTableEvent({ id: "laser", type: "laser", points: [{ point: { x: 1, y: 2 }, createdAt: 1 }], createdAt: 1 })).toBe(true);
  expect(isLiveTableEvent({ id: "clear", type: "dice-clear", createdAt: 1 })).toBe(true);
  expect(
    isLiveTableEvent({
      id: "dice",
      type: "dice",
      die: "d20",
      result: 20,
      label: "20",
      formula: "1D20",
      rollLabel: "Attack",
      seed: 0.5,
      gmDiceDisplay: "results",
      playerDiceDisplay: "panel",
      createdAt: 1
    })
  ).toBe(true);
  expect(
    isLiveTableEvent({
      id: "coin",
      type: "dice",
      die: "coin",
      result: 1,
      label: "Heads",
      seed: 0.5,
      createdAt: 1
    })
  ).toBe(true);
  expect(
    isLiveTableEvent({
      id: "percentile",
      type: "dice",
      die: "d00",
      result: 91,
      label: "91",
      seed: 0.5,
      dice: [
        { die: "d00", result: 90, label: "90", seed: 0.1 },
        { die: "d10", result: 1, label: "1", seed: 0.2 }
      ],
      createdAt: 1
    })
  ).toBe(true);
  expect(isLiveTableEvent({ id: "dice", type: "dice", die: "d30", result: 30, label: "30", seed: 0.5, createdAt: 1 })).toBe(false);
  expect(isLiveTableEvent({ id: "broken", type: "laser", points: [{ point: { x: 1 }, createdAt: 1 }], createdAt: 1 })).toBe(false);
});

it("default creators return isolated nested collections", () => {
  const first = createDefaultScene("First");
  const second = createDefaultScene("Second");

  first.layers[0].name = "Changed";
  first.fog.shapes.push({ id: "shape", operation: "reveal", kind: "rectangle", points: [] });
  first.weather.effects.rain.enabled = true;
  first.weather.effects.rain.settings.opacity = 0.12;
  first.weather.masks.push({ id: "mask", kind: "circle", points: [{ x: 10, y: 10 }], radius: 20 });

  expect(second.layers[0].name).toBe(DEFAULT_LAYERS[0].name);
  expect(second.fog).toEqual(DEFAULT_FOG);
  expect(second.weather).toEqual(DEFAULT_WEATHER);
});
});
