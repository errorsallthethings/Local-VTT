import type { CampaignSceneEntry, CampaignSceneFolder } from "../../../shared/localvtt";

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
