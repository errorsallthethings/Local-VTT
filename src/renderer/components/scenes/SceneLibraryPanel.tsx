import { memo, useMemo, useRef, useState, type CSSProperties, type DragEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  Copy,
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
import { useFloatingMenuPosition } from "../../hooks/useFloatingMenuPosition";
import { buildSceneLibraryGroups } from "../../lib/sceneLibrary";
import { getActiveWeatherEffects } from "../../lib/weatherCatalog";

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
  onMoveScene: (sceneId: string, target: { folderId?: string; beforeSceneId?: string; afterSceneId?: string }) => void;
  onToggleFolderCollapsed: (folderId: string) => void;
  onToggleSceneMenu: (sceneId: string) => void;
  onToggleFolderMenu: (folderId: string) => void;
  onRenameScene: (scene: CampaignSceneEntry) => void;
  onDuplicateScene: (scene: CampaignSceneEntry) => void;
  onDeleteScene: (scene: CampaignSceneEntry) => void;
  onRenameFolder: (folder: CampaignSceneFolder) => void;
  onChangeFolderColor: (folder: CampaignSceneFolder) => void;
  onDuplicateFolder: (folder: CampaignSceneFolder) => void;
  onMoveFolder: (folderId: string, direction: "up" | "down") => void;
  onDeleteFolder: (folder: CampaignSceneFolder) => void;
}

type SceneDropTarget =
  | { kind: "folder"; folderId?: string }
  | { kind: "scene"; sceneId: string; folderId?: string; position: "before" | "after" };

const EMPTY_SCENES: CampaignSceneEntry[] = [];
const EMPTY_SCENE_FOLDERS: CampaignSceneFolder[] = [];

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
  onMoveScene,
  onToggleFolderCollapsed,
  onToggleSceneMenu,
  onToggleFolderMenu,
  onRenameScene,
  onDuplicateScene,
  onDeleteScene,
  onRenameFolder,
  onChangeFolderColor,
  onDuplicateFolder,
  onMoveFolder,
  onDeleteFolder
}: SceneLibraryPanelProps) {
  const [dropTarget, setDropTarget] = useState<SceneDropTarget | null>(null);

  const getDropTargetId = (folderId?: string) => folderId ?? "root";
  const getDropTargetKey = (target: SceneDropTarget | null) => {
    if (!target) {
      return null;
    }
    return target.kind === "folder"
      ? `folder:${getDropTargetId(target.folderId)}`
      : `scene:${target.sceneId}:${target.position}`;
  };
  const campaignScenes = campaign?.scenes ?? EMPTY_SCENES;
  const campaignSceneFolders = campaign?.sceneFolders ?? EMPTY_SCENE_FOLDERS;
  const { folderGroups, unfiledScenes } = useMemo(() => buildSceneLibraryGroups(campaignScenes, campaignSceneFolders, dirtySceneIds), [campaignScenes, campaignSceneFolders, dirtySceneIds]);
  const weatherBadgesBySceneId = useMemo(
    () => new globalThis.Map(campaignScenes.map((scene) => [scene.id, scene.weather ? getActiveWeatherEffects(scene.weather) : []])),
    [campaignScenes]
  );
  const emptySceneMessage = getSceneLibraryEmptyMessage(campaign);
  const activeSceneId = activeScene?.id;
  const sceneDropTargetKey = getDropTargetKey(dropTarget);

  const renderSceneCard = (scene: CampaignSceneEntry) => {
    const isDirty = dirtySceneIds.has(scene.id);
    const isPlayerScene = playerSceneId === scene.id;
    const thumbnailAsset = sceneThumbnailAssets.get(scene.id);
    const isDropBefore = sceneDropTargetKey === `scene:${scene.id}:before`;
    const isDropAfter = sceneDropTargetKey === `scene:${scene.id}:after`;
    const sceneRowClassName = [
      activeSceneId === scene.id ? "selected" : "",
      "scene-row",
      isDropBefore ? "scene-row-drop-before" : "",
      isDropAfter ? "scene-row-drop-after" : ""
    ]
      .filter(Boolean)
      .join(" ");
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
        className={sceneRowClassName}
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
        onDragOver={(event) => onSceneCardDragOver(event, scene)}
        onDrop={(event) => onSceneDrop(event, scene.folderId)}
        onDragEnd={() => setDropTarget(null)}
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
          <SceneThumbnail asset={thumbnailAsset ?? null} activeWeather={weatherBadgesBySceneId.get(scene.id) ?? []} />
          <button
            className={isDirty ? "icon-button dirty-save" : "icon-button"}
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
          <SceneMenuButton
            label={`Scene actions for ${scene.name}`}
            title="Scene actions"
            open={openSceneMenuId === scene.id}
            onToggle={() => onToggleSceneMenu(scene.id)}
            onClick={stopSceneRowClick}
          >
            <button onClick={() => onRenameScene(scene)}>
              <Edit3 size={14} aria-hidden="true" />
              Rename
            </button>
            <button onClick={() => onDuplicateScene(scene)}>
              <Copy size={14} aria-hidden="true" />
              Duplicate
            </button>
            <button className="danger-menu-item" onClick={() => onDeleteScene(scene)}>
              <Trash2 size={14} aria-hidden="true" />
              Delete
            </button>
          </SceneMenuButton>
        </div>
      </div>
    );
  };

  const onSceneDrop = (event: DragEvent<HTMLElement>, folderId?: string) => {
    event.preventDefault();
    event.stopPropagation();
    const sceneId = event.dataTransfer.getData("application/x-localvtt-scene-id");
    const target = dropTarget;
    setDropTarget(null);
    if (!sceneId) {
      return;
    }
    if (target?.kind === "scene") {
      onMoveScene(sceneId, {
        folderId: target.folderId,
        beforeSceneId: target.position === "before" ? target.sceneId : undefined,
        afterSceneId: target.position === "after" ? target.sceneId : undefined
      });
      return;
    }
    onMoveScene(sceneId, { folderId: target?.kind === "folder" ? target.folderId : folderId });
  };

  const onSceneDragOver = (event: DragEvent<HTMLElement>, folderId?: string) => {
    if (!event.dataTransfer.types.includes("application/x-localvtt-scene-id")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropTarget({ kind: "folder", folderId });
  };

  const onSceneCardDragOver = (event: DragEvent<HTMLElement>, scene: CampaignSceneEntry) => {
    if (!event.dataTransfer.types.includes("application/x-localvtt-scene-id")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setDropTarget({ kind: "scene", sceneId: scene.id, folderId: scene.folderId, position });
  };

  const onSceneDragLeave = (event: DragEvent<HTMLElement>, folderId?: string) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    if (getDropTargetKey(dropTarget) === `folder:${getDropTargetId(folderId)}`) {
      setDropTarget(null);
    }
  };

  const folderDropTargetKey = sceneDropTargetKey;

  return (
    <section className="panel grow scene-panel">
      <div
        className={dropTarget ? "scene-list scene-list-drag-active" : "scene-list"}
        onDragOver={(event) => onSceneDragOver(event)}
        onDragLeave={(event) => onSceneDragLeave(event)}
        onDrop={(event) => onSceneDrop(event)}
      >
        {emptySceneMessage && <div className="scene-library-empty">{emptySceneMessage}</div>}
        {folderGroups.map(({ folder, scenes: folderScenes, dirtySceneCount: folderDirtyCount }, folderIndex) => {
          const folderHasDirtyScenes = folderDirtyCount > 0;
          const isCollapsed = collapsedFolderIds.has(folder.id);
          const canMoveUp = folderIndex > 0;
          const canMoveDown = folderIndex < folderGroups.length - 1;
          const folderStyle = {
            "--scene-folder-color": folder.color,
            "--scene-folder-color-bg": hexToRgba(folder.color, 0.13)
          } as CSSProperties;
          const folderClassName = [
            "scene-folder",
            isCollapsed ? "scene-folder-collapsed" : "",
            folderDropTargetKey === `folder:${folder.id}` ? "scene-folder-drop-target" : ""
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
                  className={folderHasDirtyScenes ? "icon-button dirty-save" : "icon-button"}
                  disabled={!folderHasDirtyScenes}
                  aria-label={
                    folderHasDirtyScenes
                      ? `Save ${folderDirtyCount} unsaved scene${folderDirtyCount === 1 ? "" : "s"} in ${folder.name}`
                      : `Save scenes in ${folder.name}`
                  }
                  title={folderHasDirtyScenes ? `Save ${folderDirtyCount} unsaved scene${folderDirtyCount === 1 ? "" : "s"} in folder` : "No unsaved scenes in folder"}
                  onClick={() => onSaveFolderScenes(folder.id)}
                >
                  <Save size={15} aria-hidden="true" />
                </button>
                <SceneMenuButton
                  label={`Folder actions for ${folder.name}`}
                  title="Folder actions"
                  open={openFolderMenuId === folder.id}
                  onToggle={() => onToggleFolderMenu(folder.id)}
                >
                  <button onClick={() => onRenameFolder(folder)}>
                    <Edit3 size={14} aria-hidden="true" />
                    Rename
                  </button>
                  <button onClick={() => onChangeFolderColor(folder)}>
                    <Palette size={14} aria-hidden="true" />
                    Color
                  </button>
                  <button onClick={() => onDuplicateFolder(folder)}>
                    <Copy size={14} aria-hidden="true" />
                    Duplicate
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
                </SceneMenuButton>
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
          className={folderDropTargetKey === "folder:root" ? "scene-folder scene-folder-unfiled scene-folder-drop-target" : "scene-folder scene-folder-unfiled"}
          onDragOver={(event) => onSceneDragOver(event)}
          onDragLeave={(event) => onSceneDragLeave(event)}
          onDrop={(event) => onSceneDrop(event)}
        >
          {campaign && campaign.sceneFolders.length > 0 && (
            <div className="scene-folder-header unfiled-header">
              <span>Unfiled Scenes</span>
            </div>
          )}
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

function SceneMenuButton({
  label,
  title,
  open,
  children,
  onToggle,
  onClick
}: {
  label: string;
  title: string;
  open: boolean;
  children: ReactNode;
  onToggle: () => void;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="scene-menu-wrap" onClick={onClick}>
      <button
        ref={buttonRef}
        className="icon-button"
        aria-label={label}
        title={title}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <EllipsisVertical size={15} aria-hidden="true" />
      </button>
      {open && createPortal(<FloatingSceneMenu anchor={buttonRef.current}>{children}</FloatingSceneMenu>, document.body)}
    </div>
  );
}

function FloatingSceneMenu({ anchor, children }: { anchor: HTMLElement | null; children: ReactNode }) {
  const { menuRef, position } = useFloatingMenuPosition({
    open: Boolean(anchor),
    anchor,
    fallbackWidth: 150,
    fallbackHeight: 192
  });

  return (
    <div ref={menuRef} className="scene-menu scene-menu-portal scene-menu-wrap" style={{ top: position.top, left: position.left }} onClick={(event) => event.stopPropagation()}>
      {children}
    </div>
  );
}

const SceneThumbnail = memo(function SceneThumbnail({ asset, activeWeather }: { asset: Asset | null; activeWeather: ReturnType<typeof getActiveWeatherEffects> }) {
  if (!asset) {
    return (
      <div className="scene-thumbnail scene-thumbnail-empty" aria-label="No map">
        <SceneWeatherBadges activeWeather={activeWeather} />
        <Map size={16} aria-hidden="true" />
        <span>No map</span>
      </div>
    );
  }

  if (asset.thumbnailAbsolutePath) {
    return (
      <div className="scene-thumbnail">
        <img src={window.localVtt.toAssetUrl(asset.thumbnailAbsolutePath)} alt="" loading="lazy" decoding="async" draggable={false} />
        <ThumbnailBadge mediaType={asset.mediaType} />
        <SceneWeatherBadges activeWeather={activeWeather} />
      </div>
    );
  }

  if (asset.mediaType === "video") {
    return (
      <div className="scene-thumbnail scene-thumbnail-video" aria-label="Video map">
        <ThumbnailBadge mediaType="video" />
        <SceneWeatherBadges activeWeather={activeWeather} />
      </div>
    );
  }

  if (!asset.thumbnailAbsolutePath) {
    return (
      <div className="scene-thumbnail scene-thumbnail-empty" aria-label="No preview available">
        <SceneWeatherBadges activeWeather={activeWeather} />
        <ImageOff size={16} aria-hidden="true" />
        <span>No preview</span>
      </div>
    );
  }

  return null;
});

function SceneWeatherBadges({ activeWeather }: { activeWeather: ReturnType<typeof getActiveWeatherEffects> }) {
  if (activeWeather.length === 0) {
    return null;
  }

  return (
    <div className="scene-weather-badges" aria-label="Active weather effects">
      {activeWeather.map((weather) => (
        <span key={weather.key} title={weather.label} aria-label={weather.label}>
          <weather.icon size={12} aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

function ThumbnailBadge({ mediaType }: { mediaType: Asset["mediaType"] }) {
  return (
    <div className="scene-thumbnail-badge" title={mediaType === "video" ? "Video map" : "Image map"} aria-label={mediaType === "video" ? "Video map" : "Image map"}>
      {mediaType === "video" ? <Video size={14} aria-hidden="true" /> : <ImageIcon size={14} aria-hidden="true" />}
    </div>
  );
}
