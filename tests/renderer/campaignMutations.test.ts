import { describe, expect, it } from "vitest";
import { createDefaultCampaign, createDefaultScene, DEFAULT_SCENE_FOLDER_COLOR, type Asset } from "../../src/shared/localvtt";
import {
  getActiveSceneAfterSceneRename,
  getCreateSceneFolderNameDialogState,
  getCreateSceneNameDialogState,
  getRenameSceneFolderNameDialogState,
  getRenameSceneNameDialogState,
  getSceneDraftsAfterSceneRename,
  getSceneNameDialogCompletion,
  renameCampaign,
  renameCampaignTokenAsset,
  setCampaignTokenAssetDefaults,
  setSceneFolderColor,
  submitSceneFolderName
} from "../../src/renderer/lib/campaign";

const now = "2026-07-03T12:00:00.000Z";

function tokenAsset(id = "token-1"): Asset {
  return {
    id,
    name: "Old Token",
    kind: "token",
    mediaType: "image",
    relativePath: `assets/tokens/${id}.png`,
    originalFileName: `${id}.png`,
    createdAt: "2026-01-01T00:00:00.000Z"
  };
}

describe("campaign mutation helpers", () => {
  it("builds scene and folder name dialog state", () => {
    const scene = { ...createDefaultScene("Dungeon"), id: "scene-1" };
    const folder = { id: "folder-1", name: "Act One", color: "#111111", createdAt: now };

    expect(getCreateSceneNameDialogState()).toEqual({ name: "New Battle Map", dialog: { mode: "create" } });
    expect(getRenameSceneNameDialogState(scene)).toEqual({ name: "Dungeon", dialog: { mode: "rename", sceneId: "scene-1" } });
    expect(getCreateSceneFolderNameDialogState()).toEqual({ name: "New Folder", dialog: { mode: "create" } });
    expect(getRenameSceneFolderNameDialogState(folder)).toEqual({ name: "Act One", dialog: { mode: "rename", folderId: "folder-1" } });
  });

  it("creates and renames scene folders from trimmed names", () => {
    const campaign = createDefaultCampaign("Folders");
    const created = submitSceneFolderName(campaign, { mode: "create", folderId: "folder-1", name: "  Act One  " }, now);

    expect(created?.sceneFolders).toEqual([{ id: "folder-1", name: "Act One", color: DEFAULT_SCENE_FOLDER_COLOR, createdAt: now }]);
    expect(created?.updatedAt).toBe(now);

    const renamed = submitSceneFolderName(created!, { mode: "rename", folderId: "folder-1", name: "  Finale  " }, "later");
    expect(renamed?.sceneFolders[0]).toMatchObject({ id: "folder-1", name: "Finale", color: DEFAULT_SCENE_FOLDER_COLOR });
    expect(renamed?.updatedAt).toBe("later");
    expect(submitSceneFolderName(campaign, { mode: "create", folderId: "folder-2", name: "   " }, now)).toBeNull();
  });

  it("sets scene folder colors", () => {
    const campaign = {
      ...createDefaultCampaign("Folders"),
      sceneFolders: [{ id: "folder-1", name: "Folder", color: "#111111", createdAt: now }]
    };

    expect(setSceneFolderColor(campaign, "folder-1", "#abcdef", "later")).toMatchObject({
      sceneFolders: [{ id: "folder-1", name: "Folder", color: "#abcdef", createdAt: now }],
      updatedAt: "later"
    });
  });

  it("renames token assets and rejects blank names", () => {
    const campaign = { ...createDefaultCampaign("Assets"), assets: [tokenAsset()] };
    const renamed = renameCampaignTokenAsset(campaign, "token-1", "  Hero  ", now);

    expect(renamed?.assets[0].name).toBe("Hero");
    expect(renamed?.updatedAt).toBe(now);
    expect(renameCampaignTokenAsset(campaign, "token-1", "   ", now)).toBeNull();
  });

  it("sets token asset defaults", () => {
    const campaign = { ...createDefaultCampaign("Assets"), assets: [tokenAsset()] };
    const tokenDefaults = { borderColor: "#ff0000", footprintVisible: true };

    const updated = setCampaignTokenAssetDefaults(campaign, "token-1", tokenDefaults, now);

    expect(updated.assets[0].tokenDefaults).toEqual(tokenDefaults);
    expect(updated.updatedAt).toBe(now);
  });

  it("renames campaigns with trimmed names and rejects blanks", () => {
    const campaign = createDefaultCampaign("Old Campaign");

    expect(renameCampaign(campaign, "  New Campaign  ", now)).toMatchObject({ name: "New Campaign", updatedAt: now });
    expect(renameCampaign(campaign, "   ", now)).toBeNull();
  });

  it("patches scene drafts after scene renames without touching unrelated drafts", () => {
    const sceneOne = { ...createDefaultScene("One"), id: "scene-1" };
    const sceneTwo = { ...createDefaultScene("Two"), id: "scene-2" };
    const drafts = { "scene-1": sceneOne, "scene-2": sceneTwo };

    const renamed = getSceneDraftsAfterSceneRename(drafts, "scene-1", "Renamed");

    expect(renamed).not.toBe(drafts);
    expect(renamed["scene-1"]).toMatchObject({ id: "scene-1", name: "Renamed" });
    expect(renamed["scene-2"]).toBe(sceneTwo);
    expect(getSceneDraftsAfterSceneRename(drafts, "missing", "Ignored")).toBe(drafts);
  });

  it("derives the active scene after scene renames", () => {
    const activeScene = { ...createDefaultScene("Active"), id: "scene-1" };
    const savedScene = { ...createDefaultScene("Saved"), id: "scene-1" };
    const otherScene = { ...createDefaultScene("Other"), id: "scene-2" };

    expect(getActiveSceneAfterSceneRename(activeScene, "scene-1", "Renamed", savedScene)).toMatchObject({ id: "scene-1", name: "Renamed" });
    expect(getActiveSceneAfterSceneRename(otherScene, "scene-1", "Renamed", savedScene)).toBe(otherScene);
    expect(getActiveSceneAfterSceneRename(null, "scene-1", "Renamed", savedScene)).toBeNull();
  });

  it("builds scene dialog completion state after creating scenes", () => {
    const savedScene = { ...createDefaultScene("Created"), id: "scene-new" };
    const draft = { ...createDefaultScene("Draft"), id: "scene-draft" };
    const sceneDrafts = { "scene-draft": draft };

    expect(
      getSceneNameDialogCompletion({
        mode: "create",
        name: "Created",
        savedScene,
        sceneDrafts,
        activeScene: null
      })
    ).toEqual({
      activeScene: savedScene,
      cleanScene: savedScene,
      sceneDrafts
    });
  });

  it("builds scene dialog completion state after renaming scenes", () => {
    const activeScene = { ...createDefaultScene("Old Active"), id: "scene-1" };
    const draft = { ...createDefaultScene("Old Draft"), id: "scene-1" };
    const savedScene = { ...createDefaultScene("Saved"), id: "scene-1" };

    const completion = getSceneNameDialogCompletion({
      mode: "rename",
      sceneId: "scene-1",
      name: "Renamed",
      savedScene,
      sceneDrafts: { "scene-1": draft },
      activeScene
    });

    expect(completion.activeScene).toMatchObject({ id: "scene-1", name: "Renamed" });
    expect(completion.cleanScene).toBeNull();
    expect(completion.sceneDrafts["scene-1"]).toMatchObject({ id: "scene-1", name: "Renamed" });
  });
});
