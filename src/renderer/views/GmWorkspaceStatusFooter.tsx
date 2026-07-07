import type { SaveState } from "../hooks/useCampaignWorkspace";
import { formatSaveStatus } from "../lib/workspace";

export function GmWorkspaceStatusFooter({
  campaignDirty,
  dirtySceneCount,
  saveState
}: {
  campaignDirty: boolean;
  dirtySceneCount: number;
  saveState: SaveState;
}) {
  return (
    <footer className="statusbar">
      <span>Mouse wheel zooms. Grabber left-drags the scene. Middle/right drag pans. Scene data uses world/map coordinates.</span>
      <span>
        Save status: {formatSaveStatus({ dirtySceneCount, campaignDirty, saveState })}
      </span>
    </footer>
  );
}
