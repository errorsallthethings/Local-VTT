import type { CampaignSceneEntry, CampaignSceneFolder } from "../../shared/localvtt";

export interface SceneLibraryFolderGroup {
  folder: CampaignSceneFolder;
  scenes: CampaignSceneEntry[];
}

export interface SceneLibraryGroups {
  folderGroups: SceneLibraryFolderGroup[];
  unfiledScenes: CampaignSceneEntry[];
}

export function buildSceneLibraryGroups(scenes: CampaignSceneEntry[], folders: CampaignSceneFolder[]): SceneLibraryGroups {
  const scenesByFolderId = new Map(folders.map((folder) => [folder.id, [] as CampaignSceneEntry[]]));
  const unfiledScenes: CampaignSceneEntry[] = [];

  for (const scene of scenes) {
    if (!scene.folderId) {
      unfiledScenes.push(scene);
      continue;
    }
    scenesByFolderId.get(scene.folderId)?.push(scene);
  }

  return {
    folderGroups: folders.map((folder) => ({
      folder,
      scenes: scenesByFolderId.get(folder.id) ?? []
    })),
    unfiledScenes
  };
}
