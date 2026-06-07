import { EllipsisVertical, Maximize2, Minimize2, MonitorUp, SlidersHorizontal, X } from "lucide-react";
import type { Asset, Campaign, Scene } from "../../../shared/localvtt";

interface WorkspaceTopbarProps {
  campaign: Campaign | null;
  activeScene: Scene | null;
  mapAsset: Asset | null;
  playerMenuOpen: boolean;
  onSendToPlayer: () => void;
  onTogglePlayerMenu: () => void;
  onOpenPlayerDisplayScale: () => void;
  onOpenPlayerViewDisplay: () => void;
  onSetPlayerFullscreen: (fullscreen: boolean) => void;
  onClosePlayerView: () => void;
}

export function WorkspaceTopbar({
  campaign,
  activeScene,
  mapAsset,
  playerMenuOpen,
  onSendToPlayer,
  onTogglePlayerMenu,
  onOpenPlayerDisplayScale,
  onOpenPlayerViewDisplay,
  onSetPlayerFullscreen,
  onClosePlayerView
}: WorkspaceTopbarProps) {
  const title = activeScene?.name ?? (campaign ? "Select or Create a Scene" : "Create or Open a Campaign");
  const subtitle = activeScene
    ? mapAsset
      ? `${mapAsset.name} (${mapAsset.mediaType})`
      : "No map imported"
    : campaign
      ? "Choose a scene from the Scenes panel or add a new scene to start building."
      : "Create a campaign, add a scene, import a map, then send it to Player View.";

  return (
    <div className="topbar">
      <div>
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </div>
      <div className="toolbar-groups">
        <div className="toolbar-block">
          <div className="toolbar-label">Player View</div>
          <div className="toolbar-group" aria-label="Player View actions">
            <button disabled={!activeScene} onClick={onSendToPlayer}>
              <MonitorUp size={16} aria-hidden="true" />
              Send
            </button>
            <div className="scene-menu-wrap player-view-menu-wrap">
              <button className="icon-button player-view-menu-button" aria-label="Player View actions" title="Player View actions" onClick={onTogglePlayerMenu}>
                <EllipsisVertical size={16} aria-hidden="true" />
              </button>
              {playerMenuOpen && (
                <div className="scene-menu toolbar-menu">
                  <button onClick={() => onSetPlayerFullscreen(true)}>
                    <Maximize2 size={14} aria-hidden="true" />
                    Fullscreen
                  </button>
                  <button onClick={() => onSetPlayerFullscreen(false)}>
                    <Minimize2 size={14} aria-hidden="true" />
                    Exit fullscreen
                  </button>
                  <button onClick={onOpenPlayerViewDisplay}>
                    <MonitorUp size={14} aria-hidden="true" />
                    Player View Display
                  </button>
                  <button disabled={!activeScene} onClick={onOpenPlayerDisplayScale}>
                    <SlidersHorizontal size={14} aria-hidden="true" />
                    Player Display Scale
                  </button>
                  <button className="danger-menu-item" onClick={onClosePlayerView}>
                    <X size={14} aria-hidden="true" />
                    Close window
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
