import { type PointerEvent as ReactPointerEvent, useState } from "react";
import { CircleHelp, FilePlus, FolderPlus, GripVertical, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { Asset, Campaign, CampaignSceneEntry, CampaignSceneFolder, Scene } from "../../shared/localvtt";
import { CampaignPanel } from "../components/campaign/CampaignPanel";
import { SceneLibraryPanel } from "../components/scenes/SceneLibraryPanel";
import type { RecentCampaign } from "../lib/recentCampaigns";
import type { WorkspaceLayout } from "../lib/workspaceLayout";
import packageJson from "../../../package.json";

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
  recentCampaigns,
  tokenAssets,
  onClearActiveFogTool,
  onToggleWorkspacePanel,
  onResetPanelWidth,
  onStartPanelResize,
  onCreateCampaign,
  onOpenCampaign,
  onOpenRecentCampaign,
  onRemoveRecentCampaign,
  onSaveCampaign,
  onRenameCampaign,
  onOpenBackupsFolder,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onPlayersPanelOpenChange,
  onOpenSceneDialog,
  onOpenFolderDialog,
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
  recentCampaigns: RecentCampaign[];
  tokenAssets: Asset[];
  onClearActiveFogTool: () => void;
  onToggleWorkspacePanel: (side: "left") => void;
  onResetPanelWidth: (side: "left") => void;
  onStartPanelResize: (side: "left", event: ReactPointerEvent<HTMLButtonElement>) => void;
  onCreateCampaign: () => void;
  onOpenCampaign: () => void;
  onOpenRecentCampaign: (campaignPath: string) => void;
  onRemoveRecentCampaign: (campaignPath: string) => void;
  onSaveCampaign: () => void;
  onRenameCampaign: () => void;
  onOpenBackupsFolder: () => void;
  onAddPlayer: () => void;
  onUpdatePlayer: (playerId: string, patch: Partial<Campaign["players"][number]>) => void;
  onDeletePlayer: (playerId: string) => void;
  onPlayersPanelOpenChange: (open: boolean) => void;
  onOpenSceneDialog: () => void;
  onOpenFolderDialog: () => void;
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
}) {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <aside
      className={`sidebar ${workspaceLayout.leftCollapsed ? "panel-collapsed-click-target" : ""}`}
      onClick={() => {
        if (workspaceLayout.leftCollapsed) {
          onToggleWorkspacePanel("left");
        }
      }}
      onPointerDown={onClearActiveFogTool}
    >
      <button
        className="icon-button panel-collapse-button sidebar-collapse-button"
        aria-label={workspaceLayout.leftCollapsed ? "Expand left sidebar" : "Collapse left sidebar"}
        title={workspaceLayout.leftCollapsed ? "Expand left sidebar" : "Collapse left sidebar"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleWorkspacePanel("left");
        }}
      >
        {workspaceLayout.leftCollapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
      </button>
      {workspaceLayout.leftCollapsed && <div className="panel-spine-label">Campaign / Scenes</div>}
      {!workspaceLayout.leftCollapsed && (
        <div className="panel-region-content">
          <div className="brand app-brand">
            <h1>Local VTT</h1>
            <button
              type="button"
              className="settings-inline-icon-button app-about-button"
              aria-label="About Local VTT"
              title={`About Local VTT ${packageJson.version}`}
              onClick={() => setAboutOpen(true)}
            >
              <CircleHelp size={17} aria-hidden="true" />
            </button>
          </div>
          <div className="section-heading">
            <h2>Campaign</h2>
          </div>
          <CampaignPanel
            campaign={campaign}
            campaignPath={campaignPath}
            missingAssets={missingAssets}
            hasUnsavedChanges={hasUnsavedChanges}
            recentCampaigns={recentCampaigns}
            tokenAssets={tokenAssets}
            onCreateCampaign={onCreateCampaign}
            onOpenCampaign={onOpenCampaign}
            onOpenRecentCampaign={onOpenRecentCampaign}
            onRemoveRecentCampaign={onRemoveRecentCampaign}
            onSaveCampaign={onSaveCampaign}
            onRenameCampaign={onRenameCampaign}
            onOpenBackupsFolder={onOpenBackupsFolder}
            onAddPlayer={onAddPlayer}
            onUpdatePlayer={onUpdatePlayer}
            onDeletePlayer={onDeletePlayer}
            onPlayersPanelOpenChange={onPlayersPanelOpenChange}
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
            onMoveScene={onMoveScene}
            onToggleFolderCollapsed={onToggleFolderCollapsed}
            onToggleSceneMenu={onToggleSceneMenu}
            onToggleFolderMenu={onToggleFolderMenu}
            onRenameScene={onRenameScene}
            onDuplicateScene={onDuplicateScene}
            onDeleteScene={onDeleteScene}
            onRenameFolder={onRenameFolder}
            onChangeFolderColor={onChangeFolderColor}
            onDuplicateFolder={onDuplicateFolder}
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
      {aboutOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setAboutOpen(false)}>
          <div className="modal about-modal" role="dialog" aria-modal="true" aria-labelledby="about-local-vtt-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="about-modal-header">
              <div>
                <h2 id="about-local-vtt-title">About Local VTT</h2>
                <p>Version {packageJson.version}</p>
              </div>
              <button className="icon-button" aria-label="Close About Local VTT" title="Close" onClick={() => setAboutOpen(false)}>
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="modal-copy about-modal-copy">
              <p>Local VTT is a local-first tabletop battle map display tool for in-person RPG sessions.</p>
              <div className="about-info-grid">
                <span>Data</span>
                <p>Campaigns, scenes, and imported assets are stored in the campaign folder you choose.</p>
                <span>Player View</span>
                <p>Use Player View for the table display, hold screen, blackout, map calibration, and scene sharing.</p>
                <span>Dice</span>
                <p>The Dice panel supports quick dice, custom presets, formulas, text results, 3D panels, and 3D scene rolls.</p>
              </div>
            </div>
            <div className="button-row modal-actions">
              <button type="button" onClick={() => setAboutOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
