import { EllipsisVertical, Maximize2, Minimize2, MonitorUp, X } from "lucide-react";
import type { Asset, Scene } from "../../../shared/localvtt";

interface WorkspaceTopbarProps {
  activeScene: Scene | null;
  mapAsset: Asset | null;
  playerMenuOpen: boolean;
  onSendToPlayer: () => void;
  onTogglePlayerMenu: () => void;
  onSetPlayerFullscreen: (fullscreen: boolean) => void;
  onClosePlayerView: () => void;
}

export function WorkspaceTopbar({
  activeScene,
  mapAsset,
  playerMenuOpen,
  onSendToPlayer,
  onTogglePlayerMenu,
  onSetPlayerFullscreen,
  onClosePlayerView
}: WorkspaceTopbarProps) {
  return (
    <div className="topbar">
      <div>
        <h2>{activeScene?.name ?? "Create or open a campaign"}</h2>
        <span>{mapAsset ? `${mapAsset.name} (${mapAsset.mediaType})` : "No map imported"}</span>
      </div>
      <div className="toolbar-groups">
        <div className="toolbar-block">
          <div className="toolbar-label">Player View</div>
          <div className="toolbar-group" aria-label="Player View actions">
            <button disabled={!activeScene} onClick={onSendToPlayer}>
              <MonitorUp size={16} aria-hidden="true" />
              Send
            </button>
            <div className="scene-menu-wrap">
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
