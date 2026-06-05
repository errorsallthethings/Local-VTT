import type { DragEvent } from "react";
import { Edit3, EllipsisVertical, Folder, FolderOpen, Save, Trash2, Video } from "lucide-react";
import type { Asset, Campaign, CampaignSceneEntry, CampaignSceneFolder, Scene } from "../../../shared/localvtt";

interface SceneLibraryPanelProps {
  campaign: Campaign | null;
  activeScene: Scene | null;
  dirtySceneIds: Set<string>;
  sceneThumbnailAssets: Map<string, Asset | null>;
  collapsedFolderIds: Set<string>;
  openSceneMenuId: string | null;
  openFolderMenuId: string | null;
  onLoadScene: (sceneId: string) => void;
  onSaveScene: (sceneId: string) => void;
  onSaveFolderScenes: (folderId: string) => void;
  onMoveSceneToFolder: (sceneId: string, folderId?: string) => void;
  onToggleFolderCollapsed: (folderId: string) => void;
  onToggleSceneMenu: (sceneId: string) => void;
  onToggleFolderMenu: (folderId: string) => void;
  onRenameScene: (scene: CampaignSceneEntry) => void;
  onDeleteScene: (scene: CampaignSceneEntry) => void;
  onRenameFolder: (folder: CampaignSceneFolder) => void;
  onDeleteFolder: (folder: CampaignSceneFolder) => void;
}

export function SceneLibraryPanel({
  campaign,
  activeScene,
  dirtySceneIds,
  sceneThumbnailAssets,
  collapsedFolderIds,
  openSceneMenuId,
  openFolderMenuId,
  onLoadScene,
  onSaveScene,
  onSaveFolderScenes,
  onMoveSceneToFolder,
  onToggleFolderCollapsed,
  onToggleSceneMenu,
  onToggleFolderMenu,
  onRenameScene,
  onDeleteScene,
  onRenameFolder,
  onDeleteFolder
}: SceneLibraryPanelProps) {
  const renderSceneCard = (scene: CampaignSceneEntry) => {
    const isDirty = dirtySceneIds.has(scene.id);
    const thumbnailAsset = sceneThumbnailAssets.get(scene.id);
    return (
      <div
        key={scene.id}
        className={activeScene?.id === scene.id ? "selected scene-row" : "scene-row"}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("application/x-localvtt-scene-id", scene.id);
          event.dataTransfer.effectAllowed = "move";
        }}
      >
        <button className="scene-select" title={scene.name} onClick={() => onLoadScene(scene.id)}>
          {scene.name}
        </button>
        <div className="scene-row-body">
          <SceneThumbnail asset={thumbnailAsset ?? null} />
          <button
            className={isDirty ? "icon-button scene-save-dirty" : "icon-button"}
            disabled={!isDirty}
            aria-label={`Save ${scene.name}`}
            title={isDirty ? "Save scene" : "No unsaved changes"}
            onClick={() => onSaveScene(scene.id)}
          >
            <Save size={15} aria-hidden="true" />
          </button>
          <div className="scene-menu-wrap">
            <button
              className="icon-button"
              aria-label={`Scene actions for ${scene.name}`}
              title="Scene actions"
              onClick={() => onToggleSceneMenu(scene.id)}
            >
              <EllipsisVertical size={15} aria-hidden="true" />
            </button>
            {openSceneMenuId === scene.id && (
              <div className="scene-menu">
                <button onClick={() => onRenameScene(scene)}>
                  <Edit3 size={14} aria-hidden="true" />
                  Rename
                </button>
                <button className="danger-menu-item" onClick={() => onDeleteScene(scene)}>
                  <Trash2 size={14} aria-hidden="true" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const onSceneDrop = (event: DragEvent<HTMLElement>, folderId?: string) => {
    event.preventDefault();
    event.stopPropagation();
    const sceneId = event.dataTransfer.getData("application/x-localvtt-scene-id");
    if (sceneId) {
      onMoveSceneToFolder(sceneId, folderId);
    }
  };

  return (
    <section className="panel grow scene-panel">
      <div className="scene-list" onDragOver={(event) => event.preventDefault()} onDrop={(event) => onSceneDrop(event)}>
        {campaign?.sceneFolders.map((folder) => {
          const folderScenes = campaign.scenes.filter((scene) => scene.folderId === folder.id);
          const folderHasDirtyScenes = folderScenes.some((scene) => dirtySceneIds.has(scene.id));
          const isCollapsed = collapsedFolderIds.has(folder.id);
          return (
            <div
              className="scene-folder"
              key={folder.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onSceneDrop(event, folder.id)}
            >
              <div className="scene-folder-header">
                <span>
                  <button
                    className="icon-button folder-toggle-button"
                    aria-label={isCollapsed ? `Expand ${folder.name}` : `Collapse ${folder.name}`}
                    title={isCollapsed ? "Expand folder" : "Collapse folder"}
                    onClick={() => onToggleFolderCollapsed(folder.id)}
                  >
                    {isCollapsed ? <Folder size={14} aria-hidden="true" /> : <FolderOpen size={14} aria-hidden="true" />}
                  </button>
                  {folder.name}
                </span>
                <button
                  className={folderHasDirtyScenes ? "icon-button scene-save-dirty" : "icon-button"}
                  disabled={!folderHasDirtyScenes}
                  aria-label={`Save scenes in ${folder.name}`}
                  title={folderHasDirtyScenes ? "Save scenes in folder" : "No unsaved scenes in folder"}
                  onClick={() => onSaveFolderScenes(folder.id)}
                >
                  <Save size={15} aria-hidden="true" />
                </button>
                <div className="scene-menu-wrap">
                  <button
                    className="icon-button"
                    aria-label={`Folder actions for ${folder.name}`}
                    title="Folder actions"
                    onClick={() => onToggleFolderMenu(folder.id)}
                  >
                    <EllipsisVertical size={15} aria-hidden="true" />
                  </button>
                  {openFolderMenuId === folder.id && (
                    <div className="scene-menu">
                      <button onClick={() => onRenameFolder(folder)}>
                        <Edit3 size={14} aria-hidden="true" />
                        Rename
                      </button>
                      <button className="danger-menu-item" onClick={() => onDeleteFolder(folder)}>
                        <Trash2 size={14} aria-hidden="true" />
                        Delete folder
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {!isCollapsed && (
                <div className="scene-folder-scenes">
                  {folderScenes.length > 0 ? folderScenes.map(renderSceneCard) : <div className="scene-folder-empty">Drop scenes here</div>}
                </div>
              )}
            </div>
          );
        })}
        <div className="scene-folder scene-folder-unfiled" onDragOver={(event) => event.preventDefault()} onDrop={(event) => onSceneDrop(event)}>
          {campaign && campaign.sceneFolders.length > 0 && <div className="scene-folder-header unfiled-header">Unfiled Scenes</div>}
          <div className="scene-folder-scenes">{campaign?.scenes.filter((scene) => !scene.folderId).map(renderSceneCard)}</div>
        </div>
      </div>
    </section>
  );
}

function SceneThumbnail({ asset }: { asset: Asset | null }) {
  if (asset?.mediaType === "video") {
    return (
      <div className="scene-thumbnail scene-thumbnail-video" aria-label="Video map">
        <Video size={18} aria-hidden="true" />
        <span>Video</span>
      </div>
    );
  }

  if (!asset?.thumbnailAbsolutePath) {
    return (
      <div className="scene-thumbnail scene-thumbnail-empty" aria-hidden="true">
        <span />
      </div>
    );
  }

  return (
    <div className="scene-thumbnail">
      <img src={window.localVtt.toAssetUrl(asset.thumbnailAbsolutePath)} alt="" draggable={false} />
    </div>
  );
}
