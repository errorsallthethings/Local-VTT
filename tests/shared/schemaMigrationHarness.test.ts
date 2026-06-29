import { describe, expect, it } from "vitest";
import legacyCampaignFixture from "../fixtures/migrations/legacy-campaign-v0.json";
import legacySceneFixture from "../fixtures/migrations/legacy-scene-v0.json";
import {
  assertValidCampaign,
  assertValidScene,
  CURRENT_CAMPAIGN_SCHEMA_VERSION,
  CURRENT_SCENE_SCHEMA_VERSION,
  DEFAULT_CALIBRATION,
  DEFAULT_DICE_SETTINGS,
  DEFAULT_LAYERS,
  DEFAULT_MEASUREMENT,
  DEFAULT_PLAYER_VIEW,
  DEFAULT_SCENE_FOLDER_COLOR,
  DEFAULT_TABLE_TOOLS,
  DEFAULT_TOKEN_BORDER_COLOR,
  DEFAULT_VIDEO_PLAYBACK,
  normalizeCampaign,
  normalizeScene,
  type Campaign,
  type Scene
} from "../../src/shared/localvtt";

describe("schema migration harness", () => {
  it("migrates legacy campaign fixtures to the current schema", () => {
    const legacyCampaign = structuredClone(legacyCampaignFixture) as unknown;

    expect(() => assertValidCampaign(legacyCampaign)).not.toThrow();
    assertValidCampaign(legacyCampaign);

    const normalized = normalizeCampaign(legacyCampaign as Campaign);

    expect(normalized.schemaVersion).toBe(CURRENT_CAMPAIGN_SCHEMA_VERSION);
    expect(normalized.defaultMeasurement).toEqual(DEFAULT_MEASUREMENT);
    expect(normalized.defaultCalibration).toEqual(DEFAULT_CALIBRATION);
    expect(normalized.playerDisplay).toEqual(DEFAULT_CALIBRATION);
    expect(normalized.diceSettings).toEqual(DEFAULT_DICE_SETTINGS);
    expect(normalized.sceneFolders[0].color).toBe(DEFAULT_SCENE_FOLDER_COLOR);
    expect(normalized.sceneLibrary.collapsedFolderIds).toEqual(["folder-a"]);
    expect(normalized.scenes[0].folderId).toBe("folder-a");
    expect(normalized.scenes[1]).not.toHaveProperty("folderId");
    expect(normalized.players[0]).toMatchObject({
      id: "player-1",
      name: "Player 1",
      color: DEFAULT_TOKEN_BORDER_COLOR,
      defaultSeatEdge: "bottom",
      defaultSeatPosition: 1,
      visibleInPlayer: true
    });
    expect(normalized.assets[0].tokenDefaults).toMatchObject({
      borderStyle: "none",
      borderWidth: 64,
      borderColor: DEFAULT_TOKEN_BORDER_COLOR,
      customSizeCells: { width: 10, height: 0.25 }
    });
  });

  it("migrates legacy scene fixtures to the current schema", () => {
    const legacyScene = structuredClone(legacySceneFixture) as unknown;

    expect(() => assertValidScene(legacyScene)).not.toThrow();
    assertValidScene(legacyScene);

    const normalized = normalizeScene(legacyScene as Scene);

    expect(normalized.schemaVersion).toBe(CURRENT_SCENE_SCHEMA_VERSION);
    expect(normalized.grid.sizePx).toBe(80);
    expect(normalized.grid.measurement).toEqual(DEFAULT_MEASUREMENT);
    expect(normalized.calibration).toEqual(DEFAULT_CALIBRATION);
    expect(normalized.layers.map((layer) => layer.id)).toEqual(DEFAULT_LAYERS.map((layer) => layer.id));
    expect(normalized.walls).toEqual([]);
    expect(normalized.lights).toEqual([]);
    expect(normalized.overlays).toEqual([]);
    expect(normalized.videoPlayback).toEqual({ ...DEFAULT_VIDEO_PLAYBACK, paused: true });
    expect(normalized.playerView).toEqual({ ...DEFAULT_PLAYER_VIEW, fitMode: "cover" });
    expect(normalized.fog).toMatchObject({
      opacity: 0.75,
      gmOpacity: 0.5,
      playerOpacity: 0.75
    });
    expect(normalized.fog.shapes[0]).toMatchObject({
      id: "fog-shape-1",
      visible: false,
      visibleInGm: false,
      visibleInPlayer: false
    });
    expect(normalized.weather.enabled).toBe(true);
    expect(normalized.weather.effects.rain.enabled).toBe(true);
    expect(normalized.weather.effects.rain.pattern).toBe("heavy-rain");
    expect(normalized.weather.effects.rain.settings).toMatchObject({
      intensity: 1.5,
      opacity: 1.25,
      speed: 3,
      color: "#d8dee9"
    });
    expect(normalized.tokenMovementPath).toEqual({
      tokenId: "token-1",
      points: [
        { x: 1, y: 2 },
        { x: 5, y: 6 }
      ]
    });
    expect(normalized.drawings[0]).toMatchObject({
      id: "drawing-1",
      kind: "freehand",
      color: "#f6d365",
      opacity: 1,
      strokeWidth: 1,
      visibleInPlayer: true
    });
    expect(normalized.tableTools).toEqual({
      ...DEFAULT_TABLE_TOOLS,
      pingSize: 3,
      laserThickness: 80
    });
  });

  it("rejects unsupported future schema fixtures with clear messages", () => {
    expect(() =>
      assertValidCampaign({ ...structuredClone(legacyCampaignFixture), schemaVersion: CURRENT_CAMPAIGN_SCHEMA_VERSION + 1 })
    ).toThrow(`Unsupported campaign schema version. This app supports campaign schema version ${CURRENT_CAMPAIGN_SCHEMA_VERSION}.`);
    expect(() => assertValidScene({ ...structuredClone(legacySceneFixture), schemaVersion: CURRENT_SCENE_SCHEMA_VERSION + 1 })).toThrow(
      `Unsupported scene schema version. This app supports scene schema version ${CURRENT_SCENE_SCHEMA_VERSION}.`
    );
  });
});
