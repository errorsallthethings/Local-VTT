import { useCallback, useMemo } from "react";
import type { GmDialogState } from "./useGmDialogState";

interface UseGmDialogCancelActionsOptions {
  dialogs: GmDialogState;
  onCancelTokenCrop: () => unknown;
  onCancelMapReplacement: () => void;
  onCancelTableDisplayWizard: () => void;
  onCancelPlayerDisplayDialog: () => void;
  onCancelMapCalibrationAssistant: () => void;
}

export function useGmDialogCancelActions({
  dialogs,
  onCancelTokenCrop,
  onCancelMapReplacement,
  onCancelTableDisplayWizard,
  onCancelPlayerDisplayDialog,
  onCancelMapCalibrationAssistant
}: UseGmDialogCancelActionsOptions) {
  const {
    setCampaignNameDialogOpen,
    setConfirmClearFogOpen,
    setEnvironmentEffectDialog,
    setFogShapeDialog,
    setFolderColorDialog,
    setFolderDialog,
    setFolderToDelete,
    setMapAssetToDelete,
    setMapVariantDialog,
    setSceneColorDialog,
    setSceneDialog,
    setSceneToDelete,
    setTokenAssetDialog,
    setTokenAssetToDelete,
    setTokenColorDialog,
    setTokenDefaultsDialog,
    setTokenDialog
  } = dialogs;

  const cancelTokenCropDialog = useCallback(() => void onCancelTokenCrop(), [onCancelTokenCrop]);
  const cancelSceneDialog = useCallback(() => setSceneDialog(null), [setSceneDialog]);
  const cancelFolderDialog = useCallback(() => setFolderDialog(null), [setFolderDialog]);
  const cancelFogShapeDialog = useCallback(() => setFogShapeDialog(null), [setFogShapeDialog]);
  const cancelEnvironmentEffectDialog = useCallback(() => setEnvironmentEffectDialog(null), [setEnvironmentEffectDialog]);
  const cancelMapVariantDialog = useCallback(() => setMapVariantDialog(null), [setMapVariantDialog]);
  const cancelTokenDialog = useCallback(() => setTokenDialog(null), [setTokenDialog]);
  const cancelTokenAssetDialog = useCallback(() => setTokenAssetDialog(null), [setTokenAssetDialog]);
  const cancelTokenDefaultsDialog = useCallback(() => setTokenDefaultsDialog(null), [setTokenDefaultsDialog]);
  const cancelFolderColorDialog = useCallback(() => setFolderColorDialog(null), [setFolderColorDialog]);
  const cancelSceneColorDialog = useCallback(() => setSceneColorDialog(null), [setSceneColorDialog]);
  const cancelTokenColorDialog = useCallback(() => setTokenColorDialog(null), [setTokenColorDialog]);
  const cancelCampaignNameDialog = useCallback(() => setCampaignNameDialogOpen(false), [setCampaignNameDialogOpen]);
  const cancelSceneDelete = useCallback(() => setSceneToDelete(null), [setSceneToDelete]);
  const cancelFolderDelete = useCallback(() => setFolderToDelete(null), [setFolderToDelete]);
  const cancelMapAssetDelete = useCallback(() => setMapAssetToDelete(null), [setMapAssetToDelete]);
  const cancelTokenAssetDelete = useCallback(() => setTokenAssetToDelete(null), [setTokenAssetToDelete]);
  const cancelClearFog = useCallback(() => setConfirmClearFogOpen(false), [setConfirmClearFogOpen]);

  return useMemo(() => ({
    onCancelSceneDialog: cancelSceneDialog,
    onCancelFolderDialog: cancelFolderDialog,
    onCancelFogShapeDialog: cancelFogShapeDialog,
    onCancelEnvironmentEffectDialog: cancelEnvironmentEffectDialog,
    onCancelMapVariantDialog: cancelMapVariantDialog,
    onCancelTokenDialog: cancelTokenDialog,
    onCancelTokenCropDialog: cancelTokenCropDialog,
    onCancelTokenAssetDialog: cancelTokenAssetDialog,
    onCancelTokenDefaultsDialog: cancelTokenDefaultsDialog,
    onCancelFolderColorDialog: cancelFolderColorDialog,
    onCancelSceneColorDialog: cancelSceneColorDialog,
    onCancelTokenColorDialog: cancelTokenColorDialog,
    onCancelCampaignNameDialog: cancelCampaignNameDialog,
    onCancelTableDisplayWizard,
    onCancelPlayerDisplayDialog,
    onCancelMapCalibrationAssistant,
    onCancelSceneDelete: cancelSceneDelete,
    onCancelFolderDelete: cancelFolderDelete,
    onCancelMapAssetDelete: cancelMapAssetDelete,
    onCancelMapReplacement,
    onCancelTokenAssetDelete: cancelTokenAssetDelete,
    onCancelClearFog: cancelClearFog
  }), [
    cancelCampaignNameDialog,
    cancelClearFog,
    cancelEnvironmentEffectDialog,
    cancelFogShapeDialog,
    cancelFolderColorDialog,
    cancelFolderDelete,
    cancelFolderDialog,
    cancelMapAssetDelete,
    cancelMapVariantDialog,
    cancelSceneColorDialog,
    cancelSceneDelete,
    cancelSceneDialog,
    cancelTokenAssetDelete,
    cancelTokenAssetDialog,
    cancelTokenColorDialog,
    cancelTokenCropDialog,
    cancelTokenDefaultsDialog,
    cancelTokenDialog,
    onCancelMapCalibrationAssistant,
    onCancelMapReplacement,
    onCancelPlayerDisplayDialog,
    onCancelTableDisplayWizard
  ]);
}
