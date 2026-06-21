import { describe, expect, it } from "vitest";
import { buildSceneLibraryGroups, getFolderSceneDeleteDetail } from "../../src/renderer/lib/sceneLibrary";
import type { CampaignSceneEntry, CampaignSceneFolder } from "../../src/shared/localvtt";

describe("scene library helpers", () => {
  it("groups scenes by folder while preserving folder and scene order", () => {
    const folders: CampaignSceneFolder[] = [
      { id: "folder-b", name: "B", color: "#222222", createdAt: "now" },
      { id: "folder-a", name: "A", color: "#111111", createdAt: "now" }
    ];
    const scenes: CampaignSceneEntry[] = [
      { id: "scene-1", name: "One", file: "one.json", folderId: "folder-a" },
      { id: "scene-2", name: "Two", file: "two.json", folderId: "folder-b" },
      { id: "scene-3", name: "Three", file: "three.json", folderId: "folder-a" }
    ];

    const groups = buildSceneLibraryGroups(scenes, folders);

    expect(groups.folderGroups.map((group) => group.folder.id)).toEqual(["folder-b", "folder-a"]);
    expect(groups.folderGroups[0].scenes.map((scene) => scene.id)).toEqual(["scene-2"]);
    expect(groups.folderGroups[1].scenes.map((scene) => scene.id)).toEqual(["scene-1", "scene-3"]);
  });

  it("counts dirty scenes while grouping folders", () => {
    const folders: CampaignSceneFolder[] = [
      { id: "folder-a", name: "A", color: "#111111", createdAt: "now" },
      { id: "folder-b", name: "B", color: "#222222", createdAt: "now" }
    ];
    const scenes: CampaignSceneEntry[] = [
      { id: "scene-1", name: "One", file: "one.json", folderId: "folder-a" },
      { id: "scene-2", name: "Two", file: "two.json", folderId: "folder-a" },
      { id: "scene-3", name: "Three", file: "three.json", folderId: "folder-b" }
    ];

    const groups = buildSceneLibraryGroups(scenes, folders, new Set(["scene-1", "scene-3", "unfiled"]));

    expect(groups.folderGroups.map((group) => [group.folder.id, group.dirtySceneCount])).toEqual([
      ["folder-a", 1],
      ["folder-b", 1]
    ]);
  });

  it("returns unfiled scenes separately", () => {
    const folders: CampaignSceneFolder[] = [{ id: "folder-a", name: "A", color: "#111111", createdAt: "now" }];
    const scenes: CampaignSceneEntry[] = [
      { id: "scene-1", name: "One", file: "one.json" },
      { id: "scene-2", name: "Two", file: "two.json", folderId: "folder-a" }
    ];

    const groups = buildSceneLibraryGroups(scenes, folders);

    expect(groups.unfiledScenes.map((scene) => scene.id)).toEqual(["scene-1"]);
    expect(groups.folderGroups[0].scenes.map((scene) => scene.id)).toEqual(["scene-2"]);
  });

  it("does not surface scenes that point at a missing folder", () => {
    const folders: CampaignSceneFolder[] = [{ id: "folder-a", name: "A", color: "#111111", createdAt: "now" }];
    const scenes: CampaignSceneEntry[] = [
      { id: "scene-1", name: "One", file: "one.json", folderId: "missing-folder" },
      { id: "scene-2", name: "Two", file: "two.json", folderId: "folder-a" }
    ];

    const groups = buildSceneLibraryGroups(scenes, folders);

    expect(groups.unfiledScenes).toEqual([]);
    expect(groups.folderGroups[0].scenes.map((scene) => scene.id)).toEqual(["scene-2"]);
  });

  it("summarizes folder scene delete details in one pass", () => {
    const scenes: CampaignSceneEntry[] = [
      { id: "scene-1", name: "One", file: "one.json", folderId: "folder-a" },
      { id: "scene-2", name: "Two", file: "two.json", folderId: "folder-a" },
      { id: "scene-3", name: "Three", file: "three.json", folderId: "folder-b" }
    ];

    expect(getFolderSceneDeleteDetail(scenes, "folder-a", new Set(["scene-2", "scene-3"]), "scene-1")).toEqual({
      containsPlayerScene: true,
      dirtySceneCount: 1,
      sceneCount: 2
    });
  });
});
