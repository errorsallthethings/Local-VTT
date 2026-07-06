import { useCallback, useMemo } from "react";
import type { CampaignSceneEntry, CampaignSceneFolder } from "../../shared/localvtt";
import type { MapReplacementPreview } from "./useCampaignActions";

interface UseGmDialogConfirmActionsOptions {
  mapReplacementPreview: MapReplacementPreview | null;
  onConfirmDeleteScene: (scene: CampaignSceneEntry) => unknown;
  onConfirmDeleteFolder: (folder: CampaignSceneFolder) => void;
  onConfirmDeleteMapAsset: () => unknown;
  onConfirmMapReplacement: (preview: MapReplacementPreview) => unknown;
  onConfirmDeleteTokenAsset: () => unknown;
  onConfirmClearFog: () => void;
}

export function useGmDialogConfirmActions({
  mapReplacementPreview,
  onConfirmDeleteScene,
  onConfirmDeleteFolder,
  onConfirmDeleteMapAsset,
  onConfirmMapReplacement,
  onConfirmDeleteTokenAsset,
  onConfirmClearFog
}: UseGmDialogConfirmActionsOptions) {
  const confirmDeleteScene = useCallback((scene: CampaignSceneEntry) => {
    void onConfirmDeleteScene(scene);
  }, [onConfirmDeleteScene]);
  const confirmDeleteMapAsset = useCallback(() => {
    void onConfirmDeleteMapAsset();
  }, [onConfirmDeleteMapAsset]);
  const confirmMapReplacement = useCallback(() => {
    if (mapReplacementPreview) {
      void onConfirmMapReplacement(mapReplacementPreview);
    }
  }, [mapReplacementPreview, onConfirmMapReplacement]);
  const confirmDeleteTokenAsset = useCallback(() => {
    void onConfirmDeleteTokenAsset();
  }, [onConfirmDeleteTokenAsset]);

  return useMemo(() => ({
    onConfirmDeleteScene: confirmDeleteScene,
    onConfirmDeleteFolder,
    onConfirmDeleteMapAsset: confirmDeleteMapAsset,
    onConfirmMapReplacement: confirmMapReplacement,
    onConfirmDeleteTokenAsset: confirmDeleteTokenAsset,
    onConfirmClearFog
  }), [
    confirmDeleteMapAsset,
    confirmDeleteScene,
    confirmDeleteTokenAsset,
    confirmMapReplacement,
    onConfirmClearFog,
    onConfirmDeleteFolder
  ]);
}
