import type { CampaignBusyState } from "../../hooks/useCampaignActions";

interface CampaignBusyOverlayProps {
  busyState: CampaignBusyState;
}

export function CampaignBusyOverlay({ busyState }: CampaignBusyOverlayProps) {
  const progress = busyState.total > 0 ? Math.min(100, Math.max(0, (busyState.current / busyState.total) * 100)) : 100;

  return (
    <div className="modal-backdrop busy-backdrop" role="status" aria-live="polite" aria-busy="true">
      <div className="modal busy-modal">
        <h2>{busyState.title}</h2>
        <p>{busyState.message}</p>
        <div className="busy-progress" aria-label={`${busyState.current} of ${busyState.total}`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        {busyState.total > 0 && (
          <span className="busy-progress-label">
            {busyState.current} of {busyState.total} scenes
          </span>
        )}
      </div>
    </div>
  );
}
