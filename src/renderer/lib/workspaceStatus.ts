export interface SaveStatusInput {
  dirtySceneCount: number;
  campaignDirty: boolean;
  saveState: string;
}

export function formatSaveStatus({ dirtySceneCount, campaignDirty, saveState }: SaveStatusInput): string {
  const parts = [];
  if (dirtySceneCount > 0) {
    parts.push(`Unsaved scenes: ${dirtySceneCount}`);
  }
  if (campaignDirty) {
    parts.push("Unsaved campaign changes");
  }
  return parts.length > 0 ? parts.join(" | ") : formatCleanSaveState(saveState);
}

function formatCleanSaveState(saveState: string): string {
  if (saveState === "idle") {
    return "Saved";
  }
  return saveState[0].toUpperCase() + saveState.slice(1);
}
