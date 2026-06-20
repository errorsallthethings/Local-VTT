import { useCallback, useEffect, useState } from "react";
import { projectSceneForPlayer } from "../../shared/localvtt";
import type { Campaign, CampaignSummary, Scene } from "../../shared/localvtt";
import { mergeCampaignDraft } from "../lib/campaignDraft";
import { formatUserFacingError } from "../lib/errorMessages";

export type SaveState = "idle" | "saving" | "saved" | "error";

export function useCampaignWorkspace() {
  const [campaignPath, setCampaignPath] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [missingAssets, setMissingAssets] = useState<string[]>([]);
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [sceneDrafts, setSceneDrafts] = useState<Record<string, Scene>>({});
  const [dirtySceneIds, setDirtySceneIds] = useState<Set<string>>(() => new Set());
  const [campaignDirty, setCampaignDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const dirtyCount = dirtySceneIds.size;
  const hasUnsavedChanges = dirtyCount > 0 || campaignDirty;

  useEffect(() => {
    window.localVtt.setUnsavedChanges(hasUnsavedChanges);
    return () => window.localVtt.setUnsavedChanges(false);
  }, [hasUnsavedChanges]);

  const run = useCallback(async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
      return true;
    } catch (caught) {
      console.error(caught);
      setError(formatUserFacingError(caught));
      return false;
    }
  }, []);

  const applySummary = (summary: CampaignSummary, preserveCampaignDraft = false) => {
    setCampaignPath(summary.campaignPath);
    setCampaign((currentCampaign) =>
      preserveCampaignDraft && currentCampaign ? mergeCampaignDraft(summary.campaign, currentCampaign) : summary.campaign
    );
    setMissingAssets(summary.missingAssets);
  };

  const clearWorkspaceState = () => {
    void window.localVtt.showPlayerIdle("Waiting for Next Scene", "The GM is preparing the next map.");
    setActiveScene(null);
    setSceneDrafts({});
    setDirtySceneIds(new Set());
    setCampaignDirty(false);
    setSaveState("idle");
  };

  const setSceneClean = (scene: Scene) => {
    setSceneDrafts((drafts) => {
      const next = { ...drafts };
      delete next[scene.id];
      return next;
    });
    setDirtySceneIds((ids) => {
      const next = new Set(ids);
      next.delete(scene.id);
      return next;
    });
  };

  const updateScene = (nextScene: Scene, syncCampaign: Campaign | null = campaign, syncScene: Scene = nextScene) => {
    setActiveScene(nextScene);
    setCampaign((currentCampaign) =>
      currentCampaign
        ? {
            ...currentCampaign,
            scenes: currentCampaign.scenes.map((entry) =>
              entry.id === nextScene.id
                ? {
                    ...entry,
                    name: nextScene.name,
                    mapAssetId: nextScene.mapAssetId,
                    weather: nextScene.weather
                  }
                : entry
            )
          }
        : currentCampaign
    );
    setSceneDrafts((drafts) => ({ ...drafts, [nextScene.id]: nextScene }));
    setDirtySceneIds((ids) => new Set(ids).add(nextScene.id));
    setSaveState("idle");
    if (syncCampaign) {
      // Build the Player View projection in the renderer so dev hot reload and shared model changes stay in sync.
      void window.localVtt.updatePlayerSceneIfOpen(projectSceneForPlayer(syncCampaign, syncScene));
    }
  };

  const updateCampaignDraft = (nextCampaign: Campaign, syncScene: Scene | null = activeScene) => {
    setCampaign(nextCampaign);
    setCampaignDirty(true);
    if (syncScene) {
      // Campaign-level settings, such as Player Display Scale, still need a scene projection to update Player View.
      void window.localVtt.updatePlayerSceneIfOpen(projectSceneForPlayer(nextCampaign, syncScene));
    }
  };

  return {
    campaignPath,
    setCampaignPath,
    campaign,
    setCampaign,
    missingAssets,
    setMissingAssets,
    activeScene,
    setActiveScene,
    sceneDrafts,
    setSceneDrafts,
    dirtySceneIds,
    setDirtySceneIds,
    campaignDirty,
    setCampaignDirty,
    saveState,
    setSaveState,
    error,
    setError,
    dirtyCount,
    hasUnsavedChanges,
    run,
    applySummary,
    clearWorkspaceState,
    setSceneClean,
    updateScene,
    updateCampaignDraft
  };
}
