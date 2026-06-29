import type { ThumbnailRegenerationResult } from "../../../shared/localvtt";

interface ThumbnailRegenerationResultDialogProps {
  result: ThumbnailRegenerationResult;
  onClose: () => void;
}

export function ThumbnailRegenerationResultDialog({ result, onClose }: ThumbnailRegenerationResultDialogProps) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal thumbnail-result-modal" role="dialog" aria-modal="true" aria-labelledby="thumbnail-result-title" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="thumbnail-result-title">Thumbnail Regeneration Complete</h2>
        <div className="modal-copy">
          <p>
            {result.regenerated} regenerated, {result.skipped} skipped, {result.failed.length} failed.
          </p>
          {result.failed.length > 0 && <p>These assets were left unchanged:</p>}
        </div>
        {result.failed.length > 0 && (
          <ul className="thumbnail-result-list">
            {result.failed.map((failure) => (
              <li key={failure.assetId}>
                <strong>{failure.assetName}</strong>
                <span>{failure.relativePath}</span>
                <small>{failure.reason}</small>
              </li>
            ))}
          </ul>
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
