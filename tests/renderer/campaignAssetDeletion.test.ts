import { describe, expect, it } from "vitest";
import { createDefaultScene, type Scene, type Token } from "../../src/shared/localvtt";
import {
  getActiveSceneAfterTokenAssetDelete,
  getMapAssetDeleteSceneUpdate,
  getSceneDraftsAfterTokenAssetDelete,
  getSelectedTokenIdsAfterTokenAssetDelete
} from "../../src/renderer/lib/campaign";

const now = "2026-07-03T12:00:00.000Z";

function token(id: string, assetId: string): Token {
  return {
    id,
    name: id,
    assetId,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
    hidden: false,
    visibleInGm: true,
    visibleInPlayer: true
  };
}

function scene(id: string, tokens: Token[] = []): Scene {
  const nextScene = createDefaultScene(id);
  nextScene.id = id;
  nextScene.tokens = tokens;
  return nextScene;
}

describe("campaign asset deletion helpers", () => {
  it("uses saved scenes for clean map asset deletes", () => {
    const activeScene = { ...scene("scene-1"), mapAssetId: "map-1" };
    const savedScene = { ...scene("scene-1"), mapAssetId: undefined, name: "Saved" };

    expect(getMapAssetDeleteSceneUpdate(activeScene, savedScene, false, now)).toEqual({
      activeScene: savedScene,
      draftScene: null,
      cleanScene: savedScene
    });
  });

  it("preserves dirty scenes as drafts when deleting map assets", () => {
    const activeScene = { ...scene("scene-1"), mapAssetId: "map-1", name: "Dirty" };
    const savedScene = { ...scene("scene-1"), mapAssetId: undefined, name: "Saved" };
    const update = getMapAssetDeleteSceneUpdate(activeScene, savedScene, true, now);

    expect(update.activeScene).toMatchObject({ id: "scene-1", name: "Dirty", mapAssetId: undefined, updatedAt: now });
    expect(update.draftScene).toBe(update.activeScene);
    expect(update.cleanScene).toBeNull();
  });

  it("removes deleted token asset references from scene drafts", () => {
    const drafts = {
      "scene-1": scene("scene-1", [token("token-1", "asset-1"), token("token-2", "asset-2")]),
      "scene-2": scene("scene-2", [token("token-3", "asset-1")])
    };

    const nextDrafts = getSceneDraftsAfterTokenAssetDelete(drafts, "asset-1");

    expect(nextDrafts["scene-1"].tokens.map((candidate) => candidate.id)).toEqual(["token-2"]);
    expect(nextDrafts["scene-2"].tokens).toEqual([]);
  });

  it("chooses active scenes after token asset deletes from changed scenes or local tokens", () => {
    const activeScene = scene("scene-1", [token("token-1", "asset-1"), token("token-2", "asset-2")]);
    const changedScene = scene("scene-1", [token("token-2", "asset-2")]);

    expect(getActiveSceneAfterTokenAssetDelete(activeScene, new Map([["scene-1", changedScene]]), "asset-1")).toBe(changedScene);
    expect(getActiveSceneAfterTokenAssetDelete(activeScene, new Map(), "asset-1")?.tokens.map((candidate) => candidate.id)).toEqual(["token-2"]);

    const unaffectedScene = scene("scene-2", [token("token-3", "asset-3")]);
    expect(getActiveSceneAfterTokenAssetDelete(unaffectedScene, new Map(), "asset-1")).toBe(unaffectedScene);
    expect(getActiveSceneAfterTokenAssetDelete(null, new Map(), "asset-1")).toBeNull();
  });

  it("filters selected token ids after token asset deletes", () => {
    const activeScene = scene("scene-1", [token("token-2", "asset-2")]);

    expect(getSelectedTokenIdsAfterTokenAssetDelete(["token-1", "token-2"], activeScene)).toEqual(["token-2"]);
    expect(getSelectedTokenIdsAfterTokenAssetDelete(["token-1"], null)).toEqual([]);
  });
});
