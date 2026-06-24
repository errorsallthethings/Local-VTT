import { describe, expect, it } from "vitest";
import {
  hydrateCampaignSceneEntry,
  parseCampaignMetadata,
  parseSceneMetadata,
  toPortableCampaignMetadata,
  toPortableSceneMetadata
} from "../../electron/persistenceCodecs";
import { createDefaultCampaign, createDefaultScene, type Asset, type Scene } from "../../src/shared/localvtt";

describe("persistence codecs", () => {
  it("strips runtime-only asset paths before campaign metadata is saved", () => {
    const campaign = createDefaultCampaign("Portable Campaign");
    const asset: Asset = {
      id: "map-1",
      name: "Map",
      kind: "map",
      mediaType: "image",
      relativePath: "assets/maps/map.png",
      thumbnailRelativePath: "assets/thumbnails/map-1.jpg",
      originalFileName: "map.png",
      createdAt: "2026-06-01T00:00:00.000Z",
      absolutePath: "C:\\Campaign\\assets\\maps\\map.png",
      thumbnailAbsolutePath: "C:\\Campaign\\assets\\thumbnails\\map-1.jpg"
    };
    campaign.assets = [asset];

    const portable = toPortableCampaignMetadata(campaign);
    const persistedJson = JSON.stringify(portable);

    expect(portable.assets[0]).toMatchObject({
      id: "map-1",
      relativePath: "assets/maps/map.png",
      thumbnailRelativePath: "assets/thumbnails/map-1.jpg"
    });
    expect(portable.assets[0]).not.toHaveProperty("absolutePath");
    expect(portable.assets[0]).not.toHaveProperty("thumbnailAbsolutePath");
    expect(persistedJson).not.toContain("C:\\Campaign");
  });

  it("normalizes scene metadata before saving", () => {
    const legacyScene = {
      ...createDefaultScene("Legacy Scene"),
      tokens: undefined,
      layers: []
    } as Partial<Scene> as Scene;

    const portable = toPortableSceneMetadata(legacyScene);

    expect(portable.tokens).toEqual([]);
    expect(portable.layers.length).toBeGreaterThan(0);
    expect(portable.schemaVersion).toBeDefined();
  });

  it("parses valid campaign and scene metadata", () => {
    const campaign = createDefaultCampaign("Parsed Campaign");
    const scene = createDefaultScene("Parsed Scene");

    expect(parseCampaignMetadata(JSON.stringify(campaign)).id).toBe(campaign.id);
    expect(parseSceneMetadata(JSON.stringify(scene)).id).toBe(scene.id);
  });

  it("rejects invalid campaign and scene metadata", () => {
    expect(() => parseCampaignMetadata(JSON.stringify({ id: "", name: "Broken", scenes: [] }))).toThrow(/Invalid campaign/);
    expect(() => parseSceneMetadata(JSON.stringify({ id: "scene", name: "Broken", layers: "nope" }))).toThrow(/Invalid scene/);
  });

  it("round trips portable campaign metadata with folders, scenes, players, and assets", () => {
    const campaign = createDefaultCampaign("Round Trip Campaign");
    campaign.sceneFolders = [{ id: "folder-1", name: "Dungeon", createdAt: "2026-06-01T00:00:00.000Z", color: "#4cbf78" }];
    campaign.sceneLibrary = { collapsedFolderIds: ["folder-1"] };
    campaign.scenes = [
      {
        id: "scene-1",
        name: "Goblin Cave",
        file: "scenes/scene-1.scene.json",
        folderId: "folder-1",
        mapAssetId: "map-1",
        weather: createDefaultScene("Weather Snapshot").weather
      }
    ];
    campaign.players = [
      {
        id: "player-1",
        name: "Rhea",
        color: "#ff0000",
        assetId: "token-1",
        defaultSeatEdge: "bottom",
        defaultSeatPosition: 50,
        visibleInPlayer: true
      }
    ];
    campaign.assets = [
      {
        id: "map-1",
        name: "Cave Map",
        kind: "map",
        mediaType: "image",
        relativePath: "assets/maps/cave.png",
        thumbnailRelativePath: "assets/thumbnails/map-1.jpg",
        originalFileName: "cave.png",
        createdAt: "2026-06-01T00:00:00.000Z",
        absolutePath: "C:\\Campaign\\assets\\maps\\cave.png",
        thumbnailAbsolutePath: "C:\\Campaign\\assets\\thumbnails\\map-1.jpg"
      },
      {
        id: "token-1",
        name: "Hero Token",
        kind: "token",
        mediaType: "image",
        relativePath: "assets/tokens/hero.png",
        originalFileName: "hero.png",
        createdAt: "2026-06-01T00:00:00.000Z",
        absolutePath: "C:\\Campaign\\assets\\tokens\\hero.png"
      }
    ];

    const savedJson = JSON.stringify(toPortableCampaignMetadata(campaign), null, 2);
    const parsed = parseCampaignMetadata(savedJson);

    expect(parsed.name).toBe("Round Trip Campaign");
    expect(parsed.sceneFolders[0]).toMatchObject({ id: "folder-1", name: "Dungeon" });
    expect(parsed.sceneLibrary.collapsedFolderIds).toEqual(["folder-1"]);
    expect(parsed.scenes[0]).toMatchObject({ id: "scene-1", folderId: "folder-1", mapAssetId: "map-1" });
    expect(parsed.players[0]).toMatchObject({ id: "player-1", assetId: "token-1" });
    expect(parsed.assets.map((asset) => asset.id)).toEqual(["map-1", "token-1"]);
    expect(savedJson).not.toContain("C:\\Campaign");
  });

  it("round trips scene metadata with placed objects and active layer data", () => {
    const scene = createDefaultScene("Round Trip Scene");
    scene.mapAssetId = "map-1";
    scene.tokens = [
      {
        id: "token-1",
        name: "Goblin",
        assetId: "token-asset-1",
        position: { x: 120, y: 160 },
        size: { width: 1, height: 1 },
        hidden: false,
        visibleInPlayer: true
      }
    ];
    scene.drawings = [
      {
        id: "drawing-1",
        name: "Fire Line",
        kind: "line",
        points: [{ x: 10, y: 20 }, { x: 110, y: 20 }],
        color: "#ff0000",
        opacity: 0.75,
        strokeWidth: 8,
        strokeStyle: "dashed",
        visibleInPlayer: true
      }
    ];
    scene.fog.shapes = [
      {
        id: "fog-1",
        operation: "hide",
        kind: "rectangle",
        points: [{ x: 0, y: 0 }, { x: 80, y: 80 }],
        visibleInPlayer: true
      }
    ];
    scene.weather.masks = [
      {
        id: "weather-mask-1",
        kind: "circle",
        points: [{ x: 200, y: 200 }],
        radius: 50,
        visible: true
      }
    ];
    scene.environment.effects = [
      {
        id: "effect-1",
        name: "Stream",
        kind: "rectangle",
        effect: "water",
        points: [{ x: 50, y: 50 }, { x: 250, y: 130 }],
        feather: 0.5,
        visibleInGm: true,
        visibleInPlayer: true
      }
    ];

    const savedJson = JSON.stringify(toPortableSceneMetadata(scene), null, 2);
    const parsed = parseSceneMetadata(savedJson);

    expect(parsed.mapAssetId).toBe("map-1");
    expect(parsed.tokens[0]).toMatchObject({ id: "token-1", assetId: "token-asset-1" });
    expect(parsed.drawings[0]).toMatchObject({ id: "drawing-1", kind: "line", strokeStyle: "dashed" });
    expect(parsed.fog.shapes[0]).toMatchObject({ id: "fog-1", operation: "hide" });
    expect(parsed.weather.masks[0]).toMatchObject({ id: "weather-mask-1", radius: 50 });
    expect(parsed.environment.effects[0]).toMatchObject({ id: "effect-1", effect: "water", feather: 0.5 });
  });

  it("hydrates missing campaign scene summary fields from full scene metadata", () => {
    const scene = createDefaultScene("Hydrated Scene");
    scene.id = "scene-1";
    scene.mapAssetId = "map-1";
    scene.weather.enabled = true;
    scene.weather.effects.fog.enabled = true;

    const entry = hydrateCampaignSceneEntry(
      {
        id: "scene-1",
        name: "Hydrated Scene",
        file: "scenes/scene-1.scene.json",
        folderId: "folder-1"
      },
      scene
    );

    expect(entry).toMatchObject({
      id: "scene-1",
      folderId: "folder-1",
      mapAssetId: "map-1"
    });
    expect(entry.weather?.effects.fog.enabled).toBe(true);
  });

  it("preserves existing campaign scene summary fields when hydrating", () => {
    const scene = createDefaultScene("Saved Scene");
    scene.id = "scene-1";
    scene.mapAssetId = "map-from-scene";
    scene.weather.enabled = true;

    const existingWeather = createDefaultScene("Existing Summary").weather;
    existingWeather.enabled = false;
    const entry = hydrateCampaignSceneEntry(
      {
        id: "scene-1",
        name: "Saved Scene",
        file: "scenes/scene-1.scene.json",
        mapAssetId: "map-from-summary",
        weather: existingWeather
      },
      scene
    );

    expect(entry.mapAssetId).toBe("map-from-summary");
    expect(entry.weather).toBe(existingWeather);
  });
});
