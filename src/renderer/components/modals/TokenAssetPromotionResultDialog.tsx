import type { TokenAssetPromotionResult } from "../../../shared/localvtt";

interface TokenAssetPromotionResultDialogProps {
  result: TokenAssetPromotionResult;
  onClose: () => void;
}

export function TokenAssetPromotionResultDialog({ result, onClose }: TokenAssetPromotionResultDialogProps) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal thumbnail-result-modal" role="dialog" aria-modal="true" aria-labelledby="token-promotion-result-title" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="token-promotion-result-title">Token Optimization Complete</h2>
        <p>
          Promoted {result.promoted} token asset{result.promoted === 1 ? "" : "s"} and skipped {result.skipped}.
        </p>
        {result.failed.length > 0 && (
          <>
            <p>These token assets were left unchanged:</p>
            <ul className="thumbnail-result-list">
              {result.failed.map((failure) => (
                <li key={failure.assetId}>
                  <span>{failure.assetName}</span>
                  <small>{failure.reason}</small>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="button-row modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
