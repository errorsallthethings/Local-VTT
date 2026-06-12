import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAYER_VIEW,
  DEFAULT_TOKEN_BORDER_WIDTH,
  DEFAULT_VIDEO_PLAYBACK,
  createDefaultCampaign,
  normalizeCampaign,
  normalizeScene,
  type Scene
} from "../../src/shared/localvtt";

describe("persistence normalization", () => {
  it("backfills scene collections and view settings missing from older scene files", () => {
    const partialScene = {
      id: "scene-old",
      name: "Old Scene",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
      layers: [],
      fog: { shapes: [] },
      tokens: undefined,
      videoPlayback: { paused: true },
      playerView: { fitMode: "cover" }
    } as Partial<Scene> as Scene;

    const normalized = normalizeScene(partialScene);

    expect(normalized.grid.measurement.unitsPerGridCell).toBe(5);
    expect(normalized.layers.map((layer) => layer.id)).toContain("weather");
    expect(normalized.tokens).toEqual([]);
    expect(normalized.walls).toEqual([]);
    expect(normalized.lights).toEqual([]);
    expect(normalized.drawings).toEqual([]);
    expect(normalized.overlays).toEqual([]);
    expect(normalized.notes).toBe("");
    expect(normalized.videoPlayback).toEqual({ ...DEFAULT_VIDEO_PLAYBACK, paused: true });
    expect(normalized.playerView).toEqual({ ...DEFAULT_PLAYER_VIEW, fitMode: "cover" });
  });

  it("normalizes legacy single-effect weather into the matching weather slot", () => {
    const scene = normalizeScene({
      ...createMinimalScene(),
      weather: {
        enabled: true,
        effect: "heavy-rain",
        intensity: 9,
        opacity: 9,
        speed: 9,
        color: "not-a-color"
      }
    } as Partial<Scene> as Scene);

    expect(scene.weather.enabled).toBe(true);
    expect(scene.weather.effects.rain.enabled).toBe(true);
    expect(scene.weather.effects.rain.pattern).toBe("heavy-rain");
    expect(scene.weather.effects.rain.settings.intensity).toBe(1.5);
    expect(scene.weather.effects.rain.settings.opacity).toBe(1.25);
    expect(scene.weather.effects.rain.settings.speed).toBe(3);
    expect(scene.weather.effects.rain.settings.color).toBe("#d8dee9");
  });

  it("cleans malformed token movement paths from older or hand-edited scene files", () => {
    const normalized = normalizeScene({
      ...createMinimalScene(),
      tokenMovementPath: {
        tokenId: "token-1",
        points: [{ x: 1, y: 2 }, { x: Number.NaN, y: 4 }, { x: 5, y: 6 }]
      }
    } as Partial<Scene> as Scene);

    expect(normalized.tokenMovementPath).toEqual({
      tokenId: "token-1",
      points: [
        { x: 1, y: 2 },
        { x: 5, y: 6 }
      ]
    });
  });

  it("drops campaign references to scene folders that no longer exist", () => {
    const campaign = createDefaultCampaign("Folder Cleanup");
    campaign.sceneFolders = [{ id: "folder-a", name: "Dungeon", createdAt: "2026-06-01T00:00:00.000Z", color: "#4cbf78" }];
    campaign.sceneLibrary = { collapsedFolderIds: ["folder-a", "missing-folder"] };
    campaign.scenes = [
      { id: "scene-a", name: "A", file: "scenes/a.scene.json", folderId: "folder-a" },
      { id: "scene-b", name: "B", file: "scenes/b.scene.json", folderId: "missing-folder" }
    ];

    const normalized = normalizeCampaign(campaign);

    expect(normalized.sceneLibrary.collapsedFolderIds).toEqual(["folder-a"]);
    expect(normalized.scenes[0].folderId).toBe("folder-a");
    expect(normalized.scenes[1]).not.toHaveProperty("folderId");
  });

  it("normalizes token library defaults without changing asset membership", () => {
    const campaign = createDefaultCampaign("Token Defaults");
    campaign.assets = [
      {
        id: "token-asset",
        name: "Token",
        kind: "token",
        mediaType: "image",
        relativePath: "assets/tokens/token.png",
        originalFileName: "token.png",
        createdAt: "2026-06-01T00:00:00.000Z",
        tokenDefaults: {
          borderStyle: "ring" as never,
          borderWidth: 200,
          borderColor: "blue",
          customSizeCells: { width: 20, height: 0.1 }
        }
      }
    ];

    const normalized = normalizeCampaign(campaign);

    expect(normalized.assets).toHaveLength(1);
    expect(normalized.assets[0].tokenDefaults).toMatchObject({
      borderStyle: "none",
      borderWidth: 64,
      borderColor: "#7aa2f7",
      customSizeCells: { width: 10, height: 0.25 }
    });
    expect(DEFAULT_TOKEN_BORDER_WIDTH).toBe(24);
  });
});

function createMinimalScene(): Partial<Scene> {
  return {
    id: "scene-minimal",
    name: "Minimal",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    layers: []
  };
}
