import { ArchiveRestore, FolderOpen, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MetadataBackupEntry, MetadataBackupPreview, MetadataBackupRef, MetadataBackupRestoreResult } from "../../../shared/localvtt";

interface MetadataBackupRestoreDialogProps {
  campaignPath: string;
  onCancel: () => void;
  onOpenBackupsFolder: () => void;
  onRestore: (result: MetadataBackupRestoreResult) => void;
  onError: (error: unknown) => void;
}

export function MetadataBackupRestoreDialog({ campaignPath, onCancel, onOpenBackupsFolder, onRestore, onError }: MetadataBackupRestoreDialogProps) {
  const [backups, setBackups] = useState<MetadataBackupEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<MetadataBackupPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [restorePending, setRestorePending] = useState(false);

  const selectedBackup = useMemo(() => backups.find((backup) => backup.id === selectedId) ?? null, [backups, selectedId]);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const nextBackups = await window.localVtt.listMetadataBackups(campaignPath);
      setBackups(nextBackups);
      setSelectedId((current) => (current && nextBackups.some((backup) => backup.id === current) ? current : (nextBackups[0]?.id ?? null)));
    } catch (caught) {
      onError(caught);
    } finally {
      setLoading(false);
    }
  }, [campaignPath, onError]);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  useEffect(() => {
    if (!selectedBackup) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    window.localVtt
      .previewMetadataBackup(campaignPath, toBackupRef(selectedBackup))
      .then((nextPreview) => {
        if (!cancelled) {
          setPreview(nextPreview);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setPreview(null);
          onError(caught);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [campaignPath, onError, selectedBackup]);

  const restoreSelected = async () => {
    if (!selectedBackup) {
      return;
    }
    setRestorePending(true);
    try {
      onRestore(await window.localVtt.restoreMetadataBackup(campaignPath, toBackupRef(selectedBackup)));
    } catch (caught) {
      onError(caught);
    } finally {
      setRestorePending(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div className="modal metadata-restore-modal" role="dialog" aria-modal="true" aria-labelledby="metadata-restore-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="metadata-restore-header">
          <div>
            <h2 id="metadata-restore-title">Restore Metadata Revision</h2>
            <p>{campaignPath}</p>
          </div>
          <button className="icon-button" type="button" aria-label="Refresh backups" title="Refresh backups" disabled={loading} onClick={() => void loadBackups()}>
            <RefreshCw size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="metadata-restore-warning">
          Restores replace campaign or scene metadata only. Asset files, thumbnails, maps, and token images are not restored.
        </div>

        <div className="metadata-restore-body">
          <div className="metadata-restore-list" role="listbox" aria-label="Metadata backups">
            {loading ? (
              <div className="metadata-restore-empty">Loading backups...</div>
            ) : backups.length === 0 ? (
              <div className="metadata-restore-empty">No metadata backups were found for this campaign.</div>
            ) : (
              backups.map((backup) => (
                <button
                  key={backup.id}
                  type="button"
                  className={backup.id === selectedId ? "metadata-restore-item metadata-restore-item-selected" : "metadata-restore-item"}
                  role="option"
                  aria-selected={backup.id === selectedId}
                  onClick={() => setSelectedId(backup.id)}
                >
                  <strong>{backup.label}</strong>
                  <span>{formatBackupTimestamp(backup.timestamp)}</span>
                  <small>{backup.kind === "campaign" ? "Campaign" : "Scene"} backup</small>
                </button>
              ))
            )}
          </div>

          <div className="metadata-restore-preview">
            {previewLoading ? (
              <div className="metadata-restore-empty">Loading preview...</div>
            ) : preview ? (
              <>
                <div className="metadata-restore-preview-heading">
                  <strong>{preview.summary}</strong>
                  <span>{formatFileSize(preview.sizeBytes)}</span>
                </div>
                <pre>{preview.json.slice(0, 2800)}</pre>
              </>
            ) : (
              <div className="metadata-restore-empty">Select a backup to preview its metadata.</div>
            )}
          </div>
        </div>

        <div className="button-row modal-actions">
          <button type="button" onClick={onOpenBackupsFolder}>
            <FolderOpen size={14} aria-hidden="true" />
            <span>Open Backups Folder</span>
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" disabled={!selectedBackup || restorePending || previewLoading} onClick={() => void restoreSelected()}>
            <ArchiveRestore size={14} aria-hidden="true" />
            <span>{restorePending ? "Restoring..." : "Restore Revision"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function toBackupRef(backup: MetadataBackupEntry): MetadataBackupRef {
  return {
    kind: backup.kind,
    sceneId: backup.sceneId,
    fileName: backup.fileName
  };
}

function formatBackupTimestamp(timestamp: string | null): string {
  if (!timestamp) {
    return "Unknown timestamp";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  return `${Math.round(sizeBytes / 1024)} KB`;
}
