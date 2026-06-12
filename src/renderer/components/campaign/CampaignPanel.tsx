import { ArchiveRestore, ChevronDown, ChevronRight, Clock3, Edit3, Eye, EyeOff, FolderOpen, Plus, Save, Settings2, Trash2, UserRoundPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Asset, Campaign, CampaignPlayer } from "../../../shared/localvtt";
import { TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../../lib/dragTypes";
import type { RecentCampaign } from "../../lib/recentCampaigns";

const MAX_CAMPAIGN_PLAYERS = 7;

interface CampaignPanelProps {
  campaign: Campaign | null;
  campaignPath: string | null;
  missingAssets: string[];
  hasUnsavedChanges: boolean;
  recentCampaigns: RecentCampaign[];
  tokenAssets: Asset[];
  onCreateCampaign: () => void;
  onOpenCampaign: () => void;
  onOpenRecentCampaign: (campaignPath: string) => void;
  onRemoveRecentCampaign: (campaignPath: string) => void;
  onSaveCampaign: () => void;
  onRenameCampaign: () => void;
  onOpenBackupsFolder: () => void;
  onAddPlayer: () => void;
  onUpdatePlayer: (playerId: string, patch: Partial<CampaignPlayer>) => void;
  onDeletePlayer: (playerId: string) => void;
  onPlayersPanelOpenChange: (open: boolean) => void;
}

export function CampaignPanel({
  campaign,
  campaignPath,
  missingAssets,
  hasUnsavedChanges,
  recentCampaigns,
  tokenAssets,
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
  onPlayersPanelOpenChange
}: CampaignPanelProps) {
  const [playersCollapsed, setPlayersCollapsed] = useState(true);
  useEffect(() => {
    setPlayersCollapsed(true);
  }, [campaign?.id]);

  useEffect(() => {
    onPlayersPanelOpenChange(Boolean(campaign && !playersCollapsed));
  }, [campaign, onPlayersPanelOpenChange, playersCollapsed]);

  return (
    <section className="panel">
      <div className="campaign-title-row panel-title-row">
        <p className={campaign ? "campaign-name-loaded" : undefined}>{campaign ? campaign.name : "No campaign open"}</p>
        {campaign && (
          <button className="icon-button" aria-label="Edit campaign name" title="Edit campaign name" onClick={onRenameCampaign}>
            <Edit3 size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="button-row campaign-action-row">
        <button className="icon-button" aria-label="New Campaign" title="New Campaign" onClick={onCreateCampaign}>
          <Plus size={16} aria-hidden="true" />
        </button>
        <button className="icon-button" aria-label="Open Campaign" title="Open Campaign" onClick={onOpenCampaign}>
          <FolderOpen size={16} aria-hidden="true" />
        </button>
        <button
          className={hasUnsavedChanges ? "icon-button dirty-save" : "icon-button"}
          disabled={!hasUnsavedChanges}
          aria-label="Save Campaign"
          title="Save Campaign"
          onClick={onSaveCampaign}
        >
          <Save size={16} aria-hidden="true" />
        </button>
        {campaignPath && (
          <button className="icon-button" aria-label="Open Backups Folder" title="Open Backups Folder" onClick={onOpenBackupsFolder}>
            <ArchiveRestore size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      {campaignPath && (
        <div className="file-path-block">
          <span>File Path</span>
          <p className="path-text" title={campaignPath}>
            {campaignPath}
          </p>
        </div>
      )}
      {campaign && (
        <div className="campaign-players">
          <div className="campaign-players-heading">
            <button
              type="button"
              className="campaign-players-title"
              aria-expanded={!playersCollapsed}
              title={playersCollapsed ? "Expand players" : "Collapse players"}
              onClick={() => setPlayersCollapsed((collapsed) => !collapsed)}
            >
              {playersCollapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
              <strong>Players</strong>
              <span>{campaign.players.length === 1 ? "1 player" : `${campaign.players.length} players`}</span>
            </button>
            <button
              className="icon-button"
              aria-label="Add Player"
              title={campaign.players.length >= MAX_CAMPAIGN_PLAYERS ? "Maximum players reached" : "Add Player"}
              disabled={campaign.players.length >= MAX_CAMPAIGN_PLAYERS}
              onClick={onAddPlayer}
            >
              <UserRoundPlus size={15} aria-hidden="true" />
            </button>
          </div>
          {!playersCollapsed && campaign.players.length > 0 ? (
            <div className="campaign-player-list">
              {campaign.players.map((player) => (
                <CampaignPlayerRow
                  key={player.id}
                  player={player}
                  tokenAssets={tokenAssets}
                  onUpdate={(patch) => onUpdatePlayer(player.id, patch)}
                  onDelete={() => onDeletePlayer(player.id)}
                />
              ))}
            </div>
          ) : !playersCollapsed ? (
            <div className="campaign-players-empty">Add campaign players, then add them to scene turn orders.</div>
          ) : null}
        </div>
      )}
      {!campaign && recentCampaigns.length > 0 && (
        <div className="recent-campaigns">
          <div className="recent-campaigns-heading">
            <Clock3 size={14} aria-hidden="true" />
            <span>Recent Campaigns</span>
          </div>
          <div className="recent-campaign-list">
            {recentCampaigns.map((recent) => (
              <div key={recent.path} className="recent-campaign-row">
                <button className="recent-campaign-open" title={recent.path} onClick={() => onOpenRecentCampaign(recent.path)}>
                  <span>{recent.name}</span>
                  <small>{recent.path}</small>
                </button>
                <button
                  className="icon-button recent-campaign-remove"
                  aria-label={`Remove ${recent.name} from recent campaigns`}
                  title="Remove from Recents"
                  onClick={() => onRemoveRecentCampaign(recent.path)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {missingAssets.length > 0 && (
        <div className="warning">
          Some campaign assets could not be found. They may have been moved, renamed, or deleted:
          {missingAssets.map((asset) => (
            <div key={asset}>{asset}</div>
          ))}
        </div>
      )}
    </section>
  );
}

function CampaignPlayerRow({
  player,
  tokenAssets,
  onUpdate,
  onDelete
}: {
  player: CampaignPlayer;
  tokenAssets: Asset[];
  onUpdate: (patch: Partial<CampaignPlayer>) => void;
  onDelete: () => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const selectedAsset = player.assetId ? tokenAssets.find((asset) => asset.id === player.assetId) : null;
  const previewPath = selectedAsset?.thumbnailAbsolutePath ?? selectedAsset?.absolutePath;
  return (
    <article className="campaign-player-row">
      <button
        type="button"
        className={previewPath ? "campaign-player-avatar" : "campaign-player-avatar campaign-player-avatar-drop"}
        title={previewPath ? "Remove thumbnail" : "Drag a token here to use its thumbnail"}
        onClick={() => {
          if (previewPath) {
            onUpdate({ assetId: undefined });
          }
        }}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes(TOKEN_LIBRARY_ASSET_DRAG_TYPE)) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          const assetId = event.dataTransfer.getData(TOKEN_LIBRARY_ASSET_DRAG_TYPE);
          if (!assetId) {
            return;
          }
          event.preventDefault();
          onUpdate({ assetId });
        }}
      >
        {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : player.name.slice(0, 1).toUpperCase()}
        {previewPath && <span className="campaign-player-avatar-reset">Reset</span>}
      </button>
      <input className="campaign-player-name" value={player.name} aria-label="Player name" onChange={(event) => onUpdate({ name: event.target.value })} />
      <input className="campaign-player-color" type="color" value={player.color} aria-label="Player color" onChange={(event) => onUpdate({ color: event.target.value })} />
      <button className="icon-button campaign-player-settings" aria-label={`${player.name} settings`} title="Player settings" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}>
        <Settings2 size={14} aria-hidden="true" />
      </button>
      {settingsOpen && (
        <div className="campaign-player-settings-panel">
          <div className="campaign-player-settings-label">Seat Placement</div>
          <label>
            <span>Placement</span>
            <select value={player.defaultSeatEdge} aria-label="Default seat edge" onChange={(event) => onUpdate({ defaultSeatEdge: event.target.value as CampaignPlayer["defaultSeatEdge"] })}>
              <option value="top">Top</option>
              <option value="right">Right</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
            </select>
          </label>
          <label>
            <span>Position</span>
            <input
              className="campaign-player-position"
              type="range"
              min="0"
              max="100"
              value={Math.round(player.defaultSeatPosition * 100)}
              aria-label="Default seat position"
              onChange={(event) => onUpdate({ defaultSeatPosition: Number(event.target.value) / 100 })}
            />
          </label>
          <div className="campaign-player-settings-actions">
            <button
              type="button"
              aria-label={player.visibleInPlayer ? `Hide ${player.name} seat on Player View` : `Show ${player.name} seat on Player View`}
              title={player.visibleInPlayer ? "Hide seat on Player View" : "Show seat on Player View"}
              onClick={() => onUpdate({ visibleInPlayer: !player.visibleInPlayer })}
            >
              {player.visibleInPlayer ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
              <span>{player.visibleInPlayer ? "Visible" : "Hidden"}</span>
            </button>
            <button type="button" className="danger-menu-item" aria-label={`Delete ${player.name}`} title="Delete Player" onClick={onDelete}>
              <Trash2 size={14} aria-hidden="true" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
