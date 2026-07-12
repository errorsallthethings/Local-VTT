import type { ReactNode } from "react";
import type { AssetCleanupPreviewResult } from "../../../shared/localvtt";

interface AssetCleanupPreviewDialogProps {
  preview: AssetCleanupPreviewResult;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AssetCleanupPreviewDialog({ preview, onCancel, onConfirm }: AssetCleanupPreviewDialogProps) {
  const hasCleanupItems = preview.unreferencedAssets.length > 0 || preview.orphanedFiles.length > 0;
  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div className="modal thumbnail-result-modal" role="dialog" aria-modal="true" aria-labelledby="asset-cleanup-preview-title" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="asset-cleanup-preview-title">Asset Cleanup Preview</h2>
        <p>
          This dry run found {preview.unreferencedAssets.length} unreferenced asset{preview.unreferencedAssets.length === 1 ? "" : "s"} and {preview.orphanedFiles.length} orphaned file{preview.orphanedFiles.length === 1 ? "" : "s"}.
        </p>
        <p>
          Local VTT will only delete files inside this campaign's asset folders. Copy the full campaign folder before cleanup if you want a restorable backup that includes maps, tokens, and thumbnails.
        </p>
        <div className="cleanup-summary-grid">
          <div>
            <strong>{preview.retainedAssetCount}</strong>
            <span>Referenced assets kept</span>
          </div>
          <div>
            <strong>{preview.totalFilesToRemove}</strong>
            <span>Files eligible for removal</span>
          </div>
          <div>
            <strong>{formatBytes(preview.totalBytesToRemove)}</strong>
            <span>Known orphaned file size</span>
          </div>
        </div>
        <CleanupSection title="Unreferenced Assets" emptyText="No unreferenced campaign assets were found.">
          {preview.unreferencedAssets.map((asset) => (
            <li key={asset.assetId}>
              <strong>{asset.assetName}</strong>
              <span>{formatKind(asset.kind)} · {asset.usageCount} references</span>
              <small>{asset.fileRelativePaths.join(", ") || asset.relativePath}</small>
            </li>
          ))}
        </CleanupSection>
        <CleanupSection title="Orphaned Files" emptyText="No orphaned asset files were found.">
          {preview.orphanedFiles.map((file) => (
            <li key={file.relativePath}>
              <strong>{formatKind(file.kind)}</strong>
              <span>{formatBytes(file.sizeBytes)}</span>
              <small>{file.relativePath}</small>
            </li>
          ))}
        </CleanupSection>
        <CleanupSection title="Stale Thumbnail References" emptyText="No stale thumbnail references were found.">
          {preview.staleThumbnailReferences.map((thumbnail) => (
            <li key={`${thumbnail.assetId}:${thumbnail.relativePath}`}>
              <strong>{thumbnail.assetName}</strong>
              <span>Missing thumbnail file</span>
              <small>{thumbnail.relativePath}</small>
            </li>
          ))}
        </CleanupSection>
        <div className="button-row modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger-button" disabled={!hasCleanupItems} onClick={onConfirm}>
            Clean Up Assets
          </button>
        </div>
      </div>
    </div>
  );
}

function CleanupSection({ title, emptyText, children }: { title: string; emptyText: string; children: ReactNode }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="cleanup-preview-section">
      <h3>{title}</h3>
      {hasItems ? <ul className="thumbnail-result-list">{children}</ul> : <p className="cleanup-preview-empty">{emptyText}</p>}
    </section>
  );
}

function formatKind(kind: string): string {
  return kind === "thumbnail" ? "Thumbnail" : kind.charAt(0).toUpperCase() + kind.slice(1);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}
