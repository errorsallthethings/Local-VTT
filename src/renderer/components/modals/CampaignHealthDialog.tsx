import { AlertTriangle, CheckCircle2, FileQuestion, ImageOff, Link2Off, PackageSearch, X } from "lucide-react";
import type { ReactNode } from "react";
import type {
  CampaignHealthMissingAssetFile,
  CampaignHealthReport,
  CampaignHealthSceneFileIssue,
  CampaignHealthUnknownAssetReference,
  CampaignHealthUnreferencedAsset
} from "../../../shared/campaignHealth";

interface CampaignHealthDialogProps {
  health: CampaignHealthReport;
  onClose: () => void;
}

export function CampaignHealthDialog({ health, onClose }: CampaignHealthDialogProps) {
  const issueCount = getCampaignHealthIssueCount(health);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal campaign-health-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-health-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="campaign-health-header">
          <div>
            <h2 id="campaign-health-title">Campaign Health</h2>
            <p>{issueCount === 0 ? "No campaign file issues were found." : formatIssueCount(issueCount)}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close campaign health" title="Close" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={issueCount === 0 ? "campaign-health-status campaign-health-status-ok" : "campaign-health-status"}>
          {issueCount === 0 ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
          <span>
            {issueCount === 0
              ? "Campaign metadata, scene files, and referenced assets look consistent."
              : "Review these diagnostics before packaging, sharing, or heavily editing this campaign."}
          </span>
        </div>

        <div className="campaign-health-sections">
          <HealthSection
            title="Missing Files"
            icon={<ImageOff size={15} aria-hidden="true" />}
            count={health.missingAssetFiles.length}
            emptyText="No referenced asset files are missing."
          >
            {health.missingAssetFiles.map((item) => (
              <HealthAssetFileRow key={`${item.assetId}:${item.relativePath}`} item={item} />
            ))}
          </HealthSection>

          <HealthSection
            title="Stale Thumbnails"
            icon={<ImageOff size={15} aria-hidden="true" />}
            count={health.staleThumbnailReferences.length}
            emptyText="No thumbnail references are stale."
          >
            {health.staleThumbnailReferences.map((item) => (
              <HealthAssetFileRow key={`${item.assetId}:${item.relativePath}`} item={item} />
            ))}
          </HealthSection>

          <HealthSection
            title="Scene Files"
            icon={<FileQuestion size={15} aria-hidden="true" />}
            count={health.sceneFileIssues.length}
            emptyText="All campaign scene files can be read."
          >
            {health.sceneFileIssues.map((item) => (
              <HealthSceneIssueRow key={`${item.sceneId}:${item.file}`} item={item} />
            ))}
          </HealthSection>

          <HealthSection
            title="Unknown Asset References"
            icon={<Link2Off size={15} aria-hidden="true" />}
            count={health.unknownAssetReferences.length}
            emptyText="All scene and player asset references resolve."
          >
            {health.unknownAssetReferences.map((item, index) => (
              <HealthUnknownReferenceRow key={`${item.owner}:${item.sceneId ?? "campaign"}:${item.assetId}:${index}`} item={item} />
            ))}
          </HealthSection>

          <HealthSection
            title="Unreferenced Assets"
            icon={<PackageSearch size={15} aria-hidden="true" />}
            count={health.unreferencedAssets.length}
            emptyText="Every campaign asset is referenced by campaign or scene metadata."
          >
            {health.unreferencedAssets.map((item) => (
              <HealthUnreferencedAssetRow key={item.assetId} item={item} />
            ))}
          </HealthSection>
        </div>

        <div className="button-row modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function getCampaignHealthIssueCount(health: CampaignHealthReport): number {
  return (
    health.missingAssetFiles.length +
    health.sceneFileIssues.length +
    health.unknownAssetReferences.length +
    health.unreferencedAssets.length
  );
}

function HealthSection({
  title,
  icon,
  count,
  emptyText,
  children
}: {
  title: string;
  icon: ReactNode;
  count: number;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <section className="campaign-health-section">
      <div className="campaign-health-section-heading">
        {icon}
        <strong>{title}</strong>
        <span>{count}</span>
      </div>
      {count === 0 ? <div className="campaign-health-empty">{emptyText}</div> : <div className="campaign-health-list">{children}</div>}
    </section>
  );
}

function HealthAssetFileRow({ item }: { item: CampaignHealthMissingAssetFile }) {
  return (
    <div className="campaign-health-row">
      <strong>{item.assetName}</strong>
      <span>{formatAssetKind(item.kind)}</span>
      <code>{item.relativePath}</code>
    </div>
  );
}

function HealthSceneIssueRow({ item }: { item: CampaignHealthSceneFileIssue }) {
  return (
    <div className="campaign-health-row">
      <strong>{item.sceneName}</strong>
      <span>{item.reason}</span>
      <code>{item.file}</code>
    </div>
  );
}

function HealthUnknownReferenceRow({ item }: { item: CampaignHealthUnknownAssetReference }) {
  return (
    <div className="campaign-health-row">
      <strong>{item.sceneName ?? "Campaign"}</strong>
      <span>{formatReferenceOwner(item.owner)}</span>
      <code>{item.assetId}</code>
    </div>
  );
}

function HealthUnreferencedAssetRow({ item }: { item: CampaignHealthUnreferencedAsset }) {
  return (
    <div className="campaign-health-row">
      <strong>{item.assetName}</strong>
      <span>{formatAssetKind(item.kind)}</span>
      <code>{item.relativePath}</code>
    </div>
  );
}

function formatIssueCount(count: number): string {
  return `${count} diagnostic item${count === 1 ? "" : "s"} found`;
}

function formatAssetKind(kind: string): string {
  return kind === "thumbnail" ? "Thumbnail" : kind.charAt(0).toUpperCase() + kind.slice(1);
}

function formatReferenceOwner(owner: string): string {
  return owner
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
