import { describe, expect, it } from "vitest";
import {
  buildSceneLibraryGroups,
  getCollapsedFolderIds,
  getFolderSceneDeleteDetail,
  getSceneDropPosition,
  getSceneDropTargetId,
  getSceneDropTargetKey,
  getSceneFolderClassName,
  getSceneMoveTargetFromDropTarget,
  getSceneRowClassName,
  pruneExpandedFolderIds,
  toggleExpandedFolderId
} from "../../src/renderer/lib/scene";
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

  it("builds stable scene drop target ids and keys", () => {
    expect(getSceneDropTargetId()).toBe("root");
    expect(getSceneDropTargetId("folder-a")).toBe("folder-a");
    expect(getSceneDropTargetKey(null)).toBeNull();
    expect(getSceneDropTargetKey({ kind: "folder" })).toBe("folder:root");
    expect(getSceneDropTargetKey({ kind: "folder", folderId: "folder-a" })).toBe("folder:folder-a");
    expect(getSceneDropTargetKey({ kind: "scene", sceneId: "scene-1", folderId: "folder-a", position: "before" })).toBe("scene:scene-1:before");
  });

  it("translates scene drop targets into move targets", () => {
    expect(getSceneMoveTargetFromDropTarget({ kind: "scene", sceneId: "scene-1", folderId: "folder-a", position: "before" }, "fallback")).toEqual({
      folderId: "folder-a",
      beforeSceneId: "scene-1",
      afterSceneId: undefined
    });
    expect(getSceneMoveTargetFromDropTarget({ kind: "scene", sceneId: "scene-2", position: "after" })).toEqual({
      folderId: undefined,
      beforeSceneId: undefined,
      afterSceneId: "scene-2"
    });
    expect(getSceneMoveTargetFromDropTarget({ kind: "folder", folderId: "folder-b" }, "fallback")).toEqual({ folderId: "folder-b" });
    expect(getSceneMoveTargetFromDropTarget(null, "fallback")).toEqual({ folderId: "fallback" });
  });

  it("derives scene drop position from pointer midpoint", () => {
    expect(getSceneDropPosition(119, 100, 40)).toBe("before");
    expect(getSceneDropPosition(120, 100, 40)).toBe("after");
  });

  it("builds scene row and folder class names", () => {
    expect(getSceneRowClassName(true, "before")).toBe("selected scene-row scene-row-drop-before");
    expect(getSceneRowClassName(false, "after")).toBe("scene-row scene-row-drop-after");
    expect(getSceneRowClassName(false, null)).toBe("scene-row");
    expect(getSceneFolderClassName(true, true)).toBe("scene-folder scene-folder-collapsed scene-folder-drop-target");
    expect(getSceneFolderClassName(false, true, true)).toBe("scene-folder scene-folder-unfiled scene-folder-drop-target");
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

  it("derives collapsed folder ids from expanded folder state", () => {
    const folders: CampaignSceneFolder[] = [
      { id: "folder-a", name: "A", color: "#111111", createdAt: "now" },
      { id: "folder-b", name: "B", color: "#222222", createdAt: "now" }
    ];

    expect([...getCollapsedFolderIds(folders, new Set(["folder-a"]))]).toEqual(["folder-b"]);
    expect([...getCollapsedFolderIds(undefined, new Set(["folder-a"]))]).toEqual([]);
  });

  it("toggles expanded folder ids", () => {
    expect([...toggleExpandedFolderId(new Set(["folder-a"]), "folder-b")]).toEqual(["folder-a", "folder-b"]);
    expect([...toggleExpandedFolderId(new Set(["folder-a", "folder-b"]), "folder-a")]).toEqual(["folder-b"]);
  });

  it("prunes expanded folder ids when campaign folders change", () => {
    const folders: CampaignSceneFolder[] = [{ id: "folder-a", name: "A", color: "#111111", createdAt: "now" }];
    const expanded = new Set(["folder-a", "missing-folder"]);
    const pruned = pruneExpandedFolderIds(expanded, folders);

    expect([...pruned]).toEqual(["folder-a"]);
    expect(pruned).not.toBe(expanded);

    const unchanged = new Set(["folder-a"]);
    expect(pruneExpandedFolderIds(unchanged, folders)).toBe(unchanged);
    expect([...pruneExpandedFolderIds(unchanged, undefined)]).toEqual([]);

    const empty = new Set<string>();
    expect(pruneExpandedFolderIds(empty, undefined)).toBe(empty);
  });
});
