import { useState, type CSSProperties, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  Edit3,
  EllipsisVertical,
  Folder,
  FolderOpen,
  GripVertical,
  Image as ImageIcon,
  ImageOff,
  Map,
  Palette,
  Save,
  Trash2,
  Video
} from "lucide-react";
import type { Asset, Campaign, CampaignSceneEntry, CampaignSceneFolder, Scene } from "../../../shared/localvtt";

interface SceneLibraryPanelProps {
  campaign: Campaign | null;
  activeScene: Scene | null;
  playerSceneId: string | null;
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
  onChangeFolderColor: (folder: CampaignSceneFolder) => void;
  onMoveFolder: (folderId: string, direction: "up" | "down") => void;
  onDeleteFolder: (folder: CampaignSceneFolder) => void;
}

export function SceneLibraryPanel({
  campaign,
  activeScene,
  playerSceneId,
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
  onChangeFolderColor,
  onMoveFolder,
  onDeleteFolder
}: SceneLibraryPanelProps) {
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const getDropTargetId = (folderId?: string) => folderId ?? "root";
  const unfiledScenes = campaign?.scenes.filter((scene) => !scene.folderId) ?? [];
  const emptySceneMessage = getSceneLibraryEmptyMessage(campaign);

  const renderSceneCard = (scene: CampaignSceneEntry) => {
    const isDirty = dirtySceneIds.has(scene.id);
    const isPlayerScene = playerSceneId === scene.id;
    const thumbnailAsset = sceneThumbnailAssets.get(scene.id);
    const loadScene = () => onLoadScene(scene.id);
    const onSceneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        loadScene();
      }
    };
    const stopSceneRowClick = (event: MouseEvent) => event.stopPropagation();

    return (
      <div
        key={scene.id}
        className={activeScene?.id === scene.id ? "selected scene-row" : "scene-row"}
        draggable
        role="button"
        tabIndex={0}
        title={scene.name}
        aria-label={`Load ${scene.name}`}
        onClick={loadScene}
        onKeyDown={onSceneKeyDown}
        onDragStart={(event) => {
          event.dataTransfer.setData("application/x-localvtt-scene-id", scene.id);
          event.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => setDropTargetId(null)}
      >
        <div className="scene-title-row">
          <GripVertical className="scene-drag-handle" size={15} aria-hidden="true" />
          <div
            className="scene-select"
            onDoubleClick={(event) => {
              event.stopPropagation();
              onRenameScene(scene);
            }}
          >
            {scene.name}
          </div>
          {isPlayerScene && (
            <CircleCheck className="scene-player-indicator" size={15} aria-label="Currently shown in Player View" />
          )}
        </div>
        <div className="scene-row-body">
          <SceneThumbnail asset={thumbnailAsset ?? null} />
          <button
            className={isDirty ? "icon-button scene-save-dirty" : "icon-button"}
            disabled={!isDirty}
            aria-label={`Save ${scene.name}`}
            title={isDirty ? "Save scene" : "No unsaved changes"}
            onClick={(event) => {
              stopSceneRowClick(event);
              onSaveScene(scene.id);
            }}
          >
            <Save size={15} aria-hidden="true" />
          </button>
          <div className="scene-menu-wrap" onClick={stopSceneRowClick}>
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
    setDropTargetId(null);
    const sceneId = event.dataTransfer.getData("application/x-localvtt-scene-id");
    if (sceneId) {
      onMoveSceneToFolder(sceneId, folderId);
    }
  };

  const onSceneDragOver = (event: DragEvent<HTMLElement>, folderId?: string) => {
    if (!event.dataTransfer.types.includes("application/x-localvtt-scene-id")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropTargetId(getDropTargetId(folderId));
  };

  const onSceneDragLeave = (event: DragEvent<HTMLElement>, folderId?: string) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    if (dropTargetId === getDropTargetId(folderId)) {
      setDropTargetId(null);
    }
  };

  return (
    <section className="panel grow scene-panel">
      <div
        className={dropTargetId ? "scene-list scene-list-drag-active" : "scene-list"}
        onDragOver={(event) => onSceneDragOver(event)}
        onDragLeave={(event) => onSceneDragLeave(event)}
        onDrop={(event) => onSceneDrop(event)}
      >
        {emptySceneMessage && <div className="scene-library-empty">{emptySceneMessage}</div>}
        {campaign?.sceneFolders.map((folder, folderIndex) => {
          const folderScenes = campaign.scenes.filter((scene) => scene.folderId === folder.id);
          const folderHasDirtyScenes = folderScenes.some((scene) => dirtySceneIds.has(scene.id));
          const isCollapsed = collapsedFolderIds.has(folder.id);
          const canMoveUp = folderIndex > 0;
          const canMoveDown = folderIndex < campaign.sceneFolders.length - 1;
          const folderStyle = {
            "--scene-folder-color": folder.color,
            "--scene-folder-color-bg": hexToRgba(folder.color, 0.13)
          } as CSSProperties;
          const folderClassName = [
            "scene-folder",
            isCollapsed ? "scene-folder-collapsed" : "",
            dropTargetId === folder.id ? "scene-folder-drop-target" : ""
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div
              className={folderClassName}
              key={folder.id}
              style={folderStyle}
              onDragOver={(event) => onSceneDragOver(event, folder.id)}
              onDragLeave={(event) => onSceneDragLeave(event, folder.id)}
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
                  <span
                    className="scene-folder-name"
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      onRenameFolder(folder);
                    }}
                  >
                    {folder.name}
                  </span>
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
                      <button onClick={() => onChangeFolderColor(folder)}>
                        <Palette size={14} aria-hidden="true" />
                        Color
                      </button>
                      <button disabled={!canMoveUp} onClick={() => onMoveFolder(folder.id, "up")}>
                        <ArrowUp size={14} aria-hidden="true" />
                        Move Up
                      </button>
                      <button disabled={!canMoveDown} onClick={() => onMoveFolder(folder.id, "down")}>
                        <ArrowDown size={14} aria-hidden="true" />
                        Move Down
                      </button>
                      <button className="danger-menu-item" onClick={() => onDeleteFolder(folder)}>
                        <Trash2 size={14} aria-hidden="true" />
                        Delete
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
        <div
          className={dropTargetId === "root" ? "scene-folder scene-folder-unfiled scene-folder-drop-target" : "scene-folder scene-folder-unfiled"}
          onDragOver={(event) => onSceneDragOver(event)}
          onDragLeave={(event) => onSceneDragLeave(event)}
          onDrop={(event) => onSceneDrop(event)}
        >
          {campaign && campaign.sceneFolders.length > 0 && <div className="scene-folder-header unfiled-header">Unfiled Scenes</div>}
          <div className="scene-folder-scenes">
            {unfiledScenes.length > 0 ? unfiledScenes.map(renderSceneCard) : campaign && campaign.scenes.length > 0 && <div className="scene-folder-empty">Drop scenes here</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function getSceneLibraryEmptyMessage(campaign: Campaign | null): string | null {
  if (!campaign) {
    return "Create or open a campaign before adding scenes.";
  }
  if (campaign.scenes.length === 0) {
    return "No scenes yet. Use Add Scene to create the first scene in this campaign.";
  }
  return null;
}

function hexToRgba(hex: string, alpha: number): string {
  const fallback = "rgb(122 162 247 / 0.13)";
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) {
    return fallback;
  }
  const red = Number.parseInt(match[1], 16);
  const green = Number.parseInt(match[2], 16);
  const blue = Number.parseInt(match[3], 16);
  return `rgb(${red} ${green} ${blue} / ${alpha})`;
}

function SceneThumbnail({ asset }: { asset: Asset | null }) {
  if (!asset) {
    return (
      <div className="scene-thumbnail scene-thumbnail-empty" aria-label="No map">
        <Map size={16} aria-hidden="true" />
        <span>No map</span>
      </div>
    );
  }

  if (asset.thumbnailAbsolutePath) {
    return (
      <div className="scene-thumbnail">
        <img src={window.localVtt.toAssetUrl(asset.thumbnailAbsolutePath)} alt="" draggable={false} />
        <ThumbnailBadge mediaType={asset.mediaType} />
      </div>
    );
  }

  if (asset.mediaType === "video") {
    return (
      <div className="scene-thumbnail scene-thumbnail-video" aria-label="Video map">
        <ThumbnailBadge mediaType="video" />
      </div>
    );
  }

  if (!asset.thumbnailAbsolutePath) {
    return (
      <div className="scene-thumbnail scene-thumbnail-empty" aria-label="No preview available">
        <ImageOff size={16} aria-hidden="true" />
        <span>No preview</span>
      </div>
    );
  }

}

function ThumbnailBadge({ mediaType }: { mediaType: Asset["mediaType"] }) {
  return (
    <div className="scene-thumbnail-badge" title={mediaType === "video" ? "Video map" : "Image map"} aria-label={mediaType === "video" ? "Video map" : "Image map"}>
      {mediaType === "video" ? <Video size={14} aria-hidden="true" /> : <ImageIcon size={14} aria-hidden="true" />}
    </div>
  );
}
