import type { CampaignSceneEntry, CampaignSceneFolder } from "../../../shared/localvtt";

export type SceneDropTarget =
  | { kind: "folder"; folderId?: string }
  | { kind: "scene"; sceneId: string; folderId?: string; position: "before" | "after" };

export interface SceneMoveTarget {
  folderId?: string;
  beforeSceneId?: string;
  afterSceneId?: string;
}

export interface SceneLibraryFolderGroup {
  folder: CampaignSceneFolder;
  scenes: CampaignSceneEntry[];
  dirtySceneCount: number;
}

export interface SceneLibraryGroups {
  folderGroups: SceneLibraryFolderGroup[];
  unfiledScenes: CampaignSceneEntry[];
}

export interface FolderSceneDeleteDetail {
  containsPlayerScene: boolean;
  dirtySceneCount: number;
  sceneCount: number;
}

export function getSceneDropTargetId(folderId?: string): string {
  return folderId ?? "root";
}

export function getSceneDropTargetKey(target: SceneDropTarget | null | undefined): string | null {
  if (!target) {
    return null;
  }
  return target.kind === "folder"
    ? `folder:${getSceneDropTargetId(target.folderId)}`
    : `scene:${target.sceneId}:${target.position}`;
}

export function getSceneMoveTargetFromDropTarget(target: SceneDropTarget | null | undefined, fallbackFolderId?: string): SceneMoveTarget {
  if (target?.kind === "scene") {
    return {
      folderId: target.folderId,
      beforeSceneId: target.position === "before" ? target.sceneId : undefined,
      afterSceneId: target.position === "after" ? target.sceneId : undefined
    };
  }
  return { folderId: target?.kind === "folder" ? target.folderId : fallbackFolderId };
}

export function getSceneDropPosition(clientY: number, top: number, height: number): "before" | "after" {
  return clientY < top + height / 2 ? "before" : "after";
}

export function getSceneRowClassName(active: boolean, dropPosition: "before" | "after" | null | undefined): string {
  return [
    active ? "selected" : "",
    "scene-row",
    dropPosition === "before" ? "scene-row-drop-before" : "",
    dropPosition === "after" ? "scene-row-drop-after" : ""
  ]
    .filter(Boolean)
    .join(" ");
}

export function getSceneFolderClassName(collapsed: boolean, dropTarget: boolean, unfiled = false): string {
  return [
    "scene-folder",
    unfiled ? "scene-folder-unfiled" : "",
    collapsed ? "scene-folder-collapsed" : "",
    dropTarget ? "scene-folder-drop-target" : ""
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildSceneLibraryGroups(scenes: CampaignSceneEntry[], folders: CampaignSceneFolder[], dirtySceneIds: ReadonlySet<string> = new Set()): SceneLibraryGroups {
  const scenesByFolderId = new Map(folders.map((folder) => [folder.id, [] as CampaignSceneEntry[]]));
  const dirtyCountsByFolderId = new Map(folders.map((folder) => [folder.id, 0]));
  const unfiledScenes: CampaignSceneEntry[] = [];

  for (const scene of scenes) {
    if (!scene.folderId) {
      unfiledScenes.push(scene);
      continue;
    }
    const folderScenes = scenesByFolderId.get(scene.folderId);
    if (!folderScenes) {
      continue;
    }
    folderScenes.push(scene);
    if (dirtySceneIds.has(scene.id)) {
      dirtyCountsByFolderId.set(scene.folderId, (dirtyCountsByFolderId.get(scene.folderId) ?? 0) + 1);
    }
  }

  return {
    folderGroups: folders.map((folder) => ({
      folder,
      scenes: scenesByFolderId.get(folder.id) ?? [],
      dirtySceneCount: dirtyCountsByFolderId.get(folder.id) ?? 0
    })),
    unfiledScenes
  };
}

export function getFolderSceneDeleteDetail(
  scenes: readonly CampaignSceneEntry[],
  folderId: string,
  dirtySceneIds: ReadonlySet<string>,
  playerSceneId: string | null
): FolderSceneDeleteDetail {
  let sceneCount = 0;
  let dirtySceneCount = 0;
  let containsPlayerScene = false;

  for (const scene of scenes) {
    if (scene.folderId !== folderId) {
      continue;
    }
    sceneCount += 1;
    if (dirtySceneIds.has(scene.id)) {
      dirtySceneCount += 1;
    }
    if (playerSceneId === scene.id) {
      containsPlayerScene = true;
    }
  }

  return { containsPlayerScene, dirtySceneCount, sceneCount };
}

export function getCollapsedFolderIds(folders: readonly CampaignSceneFolder[] | undefined, expandedFolderIds: ReadonlySet<string>): Set<string> {
  return new Set((folders ?? []).filter((folder) => !expandedFolderIds.has(folder.id)).map((folder) => folder.id));
}

export function toggleExpandedFolderId(expandedFolderIds: ReadonlySet<string>, folderId: string): Set<string> {
  const nextIds = new Set(expandedFolderIds);
  if (nextIds.has(folderId)) {
    nextIds.delete(folderId);
  } else {
    nextIds.add(folderId);
  }
  return nextIds;
}

export function pruneExpandedFolderIds(expandedFolderIds: Set<string>, folders: readonly CampaignSceneFolder[] | undefined): Set<string> {
  if (!folders) {
    return expandedFolderIds.size === 0 ? expandedFolderIds : new Set();
  }
  const folderIds = new Set(folders.map((folder) => folder.id));
  const nextIds = new Set([...expandedFolderIds].filter((folderId) => folderIds.has(folderId)));
  return nextIds.size === expandedFolderIds.size ? expandedFolderIds : nextIds;
}
