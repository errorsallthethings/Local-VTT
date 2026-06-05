import { Edit3, FolderOpen, Plus, Save } from "lucide-react";
import type { Campaign } from "../../../shared/localvtt";

interface CampaignPanelProps {
  campaign: Campaign | null;
  campaignPath: string | null;
  missingAssets: string[];
  hasUnsavedChanges: boolean;
  onCreateCampaign: () => void;
  onOpenCampaign: () => void;
  onSaveCampaign: () => void;
  onRenameCampaign: () => void;
}

export function CampaignPanel({
  campaign,
  campaignPath,
  missingAssets,
  hasUnsavedChanges,
  onCreateCampaign,
  onOpenCampaign,
  onSaveCampaign,
  onRenameCampaign
}: CampaignPanelProps) {
  return (
    <section className="panel">
      <div className="campaign-title-row panel-title-row">
        <p>{campaign ? campaign.name : "No campaign open"}</p>
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
