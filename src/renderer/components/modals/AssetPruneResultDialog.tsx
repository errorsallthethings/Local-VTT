import type { AssetCleanupResult, AssetPruneResult } from "../../../shared/localvtt";

interface AssetPruneResultDialogProps {
  result: AssetCleanupResult | AssetPruneResult;
  onClose: () => void;
}

export function AssetPruneResultDialog({ result, onClose }: AssetPruneResultDialogProps) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal thumbnail-result-modal" role="dialog" aria-modal="true" aria-labelledby="asset-prune-result-title" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="asset-prune-result-title">Asset Prune Complete</h2>
        <p>
          Pruned {result.pruned} asset{result.pruned === 1 ? "" : "s"}, removed {result.removedFiles} file{result.removedFiles === 1 ? "" : "s"}, and skipped {result.skipped}.
        </p>
        {isAssetCleanupResult(result) && result.removedOrphanedFiles > 0 && (
          <p>Removed {result.removedOrphanedFiles} orphaned file{result.removedOrphanedFiles === 1 ? "" : "s"} from campaign asset folders.</p>
        )}
        {isAssetCleanupResult(result) && result.failedOrphanedFiles.length > 0 && (
          <>
            <p>These orphaned files could not be removed:</p>
            <ul className="thumbnail-result-list">
              {result.failedOrphanedFiles.map((failure) => (
                <li key={failure.relativePath}>
                  <strong>{failure.relativePath}</strong>
                  <small>{failure.reason}</small>
                </li>
              ))}
            </ul>
          </>
        )}
        {result.failed.length > 0 && (
          <>
            <p>These assets were left unchanged:</p>
            <ul className="thumbnail-result-list">
              {result.failed.map((failure) => (
                <li key={failure.assetId}>
                  <strong>{failure.assetName}</strong>
                  <span>{failure.relativePath}</span>
                  <small>{failure.reason}</small>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="button-row modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function isAssetCleanupResult(result: AssetCleanupResult | AssetPruneResult): result is AssetCleanupResult {
  return "removedOrphanedFiles" in result;
}
