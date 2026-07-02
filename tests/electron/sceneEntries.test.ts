import { describe, expect, it } from "vitest";
import { createCampaignSceneEntry, insertSceneEntryAfter, updateSceneEntryFromScene } from "../../electron/sceneEntries";
import { createDefaultScene, type CampaignSceneEntry } from "../../src/shared/localvtt";

describe("scene entry helpers", () => {
  it("creates campaign scene entries from scenes", () => {
    const scene = createDefaultScene("Cave");
    scene.id = "scene-1";
    scene.mapAssetId = "map-1";

    expect(createCampaignSceneEntry(scene, "folder-1")).toMatchObject({
      id: "scene-1",
      name: "Cave",
      file: "scenes/scene-1.scene.json",
      mapAssetId: "map-1",
      weather: scene.weather,
      folderId: "folder-1"
    });
  });

  it("inserts scene entries after the requested source scene", () => {
    const entries = [entry("scene-1"), entry("scene-2")];

    expect(insertSceneEntryAfter(entries, entry("scene-copy"), "scene-1").map((candidate) => candidate.id)).toEqual(["scene-1", "scene-copy", "scene-2"]);
  });

  it("appends inserted scene entries when the source scene is missing", () => {
    const entries = [entry("scene-1"), entry("scene-2")];

    expect(insertSceneEntryAfter(entries, entry("scene-copy"), "missing").map((candidate) => candidate.id)).toEqual(["scene-1", "scene-2", "scene-copy"]);
  });

  it("updates scene entry metadata from a saved scene", () => {
    const scene = createDefaultScene("Cave Updated");
    scene.mapAssetId = "map-2";
    const original = { ...entry("scene-1"), name: "Cave", mapAssetId: "map-1" };

    expect(updateSceneEntryFromScene(original, scene)).toMatchObject({
      id: "scene-1",
      name: "Cave Updated",
      mapAssetId: "map-2",
      weather: scene.weather
    });
  });
});

function entry(id: string): CampaignSceneEntry {
  return {
    id,
    name: id,
    file: `scenes/${id}.scene.json`
  };
}
