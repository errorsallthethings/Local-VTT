import { type PointerEvent as ReactPointerEvent } from "react";
import { FilePlus, FolderPlus, GripVertical, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { Asset, Campaign, CampaignSceneEntry, CampaignSceneFolder, Scene } from "../../shared/localvtt";
import { CampaignPanel } from "../components/campaign/CampaignPanel";
import { SceneLibraryPanel } from "../components/scenes/SceneLibraryPanel";
import type { WorkspaceLayout } from "../lib/workspaceLayout";

export function GmSidebar({
  campaign,
  campaignPath,
  missingAssets,
  hasUnsavedChanges,
  activeScene,
  playerSceneId,
  dirtySceneIds,
  sceneThumbnailAssets,
  collapsedFolderIds,
  openSceneMenuId,
  openFolderMenuId,
  workspaceLayout,
  onClearActiveFogTool,
  onToggleWorkspacePanel,
  onResetPanelWidth,
  onStartPanelResize,
  onCreateCampaign,
  onOpenCampaign,
  onSaveCampaign,
  onRenameCampaign,
  onOpenSceneDialog,
  onOpenFolderDialog,
  onLoadScene,
  onSaveScene,
  onSaveFolderScenes,
  onMoveSceneToFolder,
  onToggleFolderCollapsed,
  onToggleSceneMenu,
  onToggleFolderMenu,
  onRenameScene,
  onDuplicateScene,
  onDeleteScene,
  onRenameFolder,
  onChangeFolderColor,
  onMoveFolder,
  onDeleteFolder
}: {
  campaign: Campaign | null;
  campaignPath: string | null;
  missingAssets: string[];
  hasUnsavedChanges: boolean;
  activeScene: Scene | null;
  playerSceneId: string | null;
  dirtySceneIds: Set<string>;
  sceneThumbnailAssets: Map<string, Asset | null>;
  collapsedFolderIds: Set<string>;
  openSceneMenuId: string | null;
  openFolderMenuId: string | null;
  workspaceLayout: WorkspaceLayout;
  onClearActiveFogTool: () => void;
  onToggleWorkspacePanel: (side: "left") => void;
  onResetPanelWidth: (side: "left") => void;
  onStartPanelResize: (side: "left", event: ReactPointerEvent<HTMLButtonElement>) => void;
  onCreateCampaign: () => void;
  onOpenCampaign: () => void;
  onSaveCampaign: () => void;
  onRenameCampaign: () => void;
  onOpenSceneDialog: () => void;
  onOpenFolderDialog: () => void;
  onLoadScene: (sceneId: string) => void;
  onSaveScene: (sceneId: string) => void;
  onSaveFolderScenes: (folderId: string) => void;
  onMoveSceneToFolder: (sceneId: string, folderId?: string) => void;
  onToggleFolderCollapsed: (folderId: string) => void;
  onToggleSceneMenu: (sceneId: string) => void;
  onToggleFolderMenu: (folderId: string) => void;
  onRenameScene: (scene: CampaignSceneEntry) => void;
  onDuplicateScene: (scene: CampaignSceneEntry) => void;
  onDeleteScene: (scene: CampaignSceneEntry) => void;
  onRenameFolder: (folder: CampaignSceneFolder) => void;
  onChangeFolderColor: (folder: CampaignSceneFolder) => void;
  onMoveFolder: (folderId: string, direction: "up" | "down") => void;
  onDeleteFolder: (folder: CampaignSceneFolder) => void;
}) {
  return (
    <aside className="sidebar" onPointerDown={onClearActiveFogTool}>
      <button
        className="icon-button panel-collapse-button sidebar-collapse-button"
        aria-label={workspaceLayout.leftCollapsed ? "Expand left sidebar" : "Collapse left sidebar"}
        title={workspaceLayout.leftCollapsed ? "Expand left sidebar" : "Collapse left sidebar"}
        onClick={() => onToggleWorkspacePanel("left")}
      >
        {workspaceLayout.leftCollapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
      </button>
      {workspaceLayout.leftCollapsed && <div className="panel-spine-label">Campaign / Scenes</div>}
      {!workspaceLayout.leftCollapsed && (
        <div className="panel-region-content">
          <div className="section-heading">
            <h2>Campaign</h2>
          </div>
          <CampaignPanel
            campaign={campaign}
            campaignPath={campaignPath}
            missingAssets={missingAssets}
            hasUnsavedChanges={hasUnsavedChanges}
            onCreateCampaign={onCreateCampaign}
            onOpenCampaign={onOpenCampaign}
            onSaveCampaign={onSaveCampaign}
            onRenameCampaign={onRenameCampaign}
          />

          <div className="section-heading">
            <h2>Scenes</h2>
            <div className="section-actions">
              <button className="icon-button" disabled={!campaignPath} aria-label="Add Scene" title="Add Scene" onClick={onOpenSceneDialog}>
                <FilePlus size={16} aria-hidden="true" />
              </button>
              <button className="icon-button" disabled={!campaign} aria-label="Add Scene Folder" title="Add Scene Folder" onClick={onOpenFolderDialog}>
                <FolderPlus size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <SceneLibraryPanel
            campaign={campaign}
            activeScene={activeScene}
            playerSceneId={playerSceneId}
            dirtySceneIds={dirtySceneIds}
            sceneThumbnailAssets={sceneThumbnailAssets}
            collapsedFolderIds={collapsedFolderIds}
            openSceneMenuId={openSceneMenuId}
            openFolderMenuId={openFolderMenuId}
            onLoadScene={onLoadScene}
            onSaveScene={onSaveScene}
            onSaveFolderScenes={onSaveFolderScenes}
            onMoveSceneToFolder={onMoveSceneToFolder}
            onToggleFolderCollapsed={onToggleFolderCollapsed}
            onToggleSceneMenu={onToggleSceneMenu}
            onToggleFolderMenu={onToggleFolderMenu}
            onRenameScene={onRenameScene}
            onDuplicateScene={onDuplicateScene}
            onDeleteScene={onDeleteScene}
            onRenameFolder={onRenameFolder}
            onChangeFolderColor={onChangeFolderColor}
            onMoveFolder={onMoveFolder}
            onDeleteFolder={onDeleteFolder}
          />
        </div>
      )}
      {!workspaceLayout.leftCollapsed && (
        <button
          className="panel-resize-handle panel-resize-handle-left"
          aria-label="Resize left sidebar"
          title="Drag to resize. Double-click to reset."
          onDoubleClick={() => onResetPanelWidth("left")}
          onPointerDown={(event) => onStartPanelResize("left", event)}
        >
          <GripVertical size={14} aria-hidden="true" />
        </button>
      )}
    </aside>
  );
}
