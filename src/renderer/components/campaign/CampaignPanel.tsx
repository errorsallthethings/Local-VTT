import { Clock3, Edit3, FolderOpen, Plus, Save, X } from "lucide-react";
import type { Campaign } from "../../../shared/localvtt";
import type { RecentCampaign } from "../../lib/recentCampaigns";

interface CampaignPanelProps {
  campaign: Campaign | null;
  campaignPath: string | null;
  missingAssets: string[];
  hasUnsavedChanges: boolean;
  recentCampaigns: RecentCampaign[];
  onCreateCampaign: () => void;
  onOpenCampaign: () => void;
  onOpenRecentCampaign: (campaignPath: string) => void;
  onRemoveRecentCampaign: (campaignPath: string) => void;
  onSaveCampaign: () => void;
  onRenameCampaign: () => void;
}

export function CampaignPanel({
  campaign,
  campaignPath,
  missingAssets,
  hasUnsavedChanges,
  recentCampaigns,
  onCreateCampaign,
  onOpenCampaign,
  onOpenRecentCampaign,
  onRemoveRecentCampaign,
  onSaveCampaign,
  onRenameCampaign
}: CampaignPanelProps) {
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
      </div>
      {campaignPath && (
        <div className="file-path-block">
          <span>File Path</span>
          <p className="path-text" title={campaignPath}>
            {campaignPath}
          </p>
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
          Missing assets:
          {missingAssets.map((asset) => (
            <div key={asset}>{asset}</div>
          ))}
        </div>
      )}
    </section>
  );
}
