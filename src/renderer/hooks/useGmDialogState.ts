import { useEffect, useState } from "react";
import type { Asset, CampaignSceneEntry, CampaignSceneFolder } from "../../shared/localvtt";
import type {
  EnvironmentEffectNameDialog,
  FogShapeNameDialog,
  FolderColorDialog,
  FolderNameDialog,
  SceneColorDialog,
  SceneNameDialog,
  TokenAssetDeleteDialog,
  TokenAssetNameDialog,
  TokenColorDialog,
  TokenCropDialogState,
  TokenDefaultsDialog,
  TokenNameDialog
} from "../views/GmDialogs";

interface UseGmDialogEscapeOptions {
  openSceneMenuId: string | null;
  openFolderMenuId: string | null;
  playerMenuOpen: boolean;
  onCancelTokenCrop: () => void;
  onCloseSceneMenu: () => void;
  onCloseFolderMenu: () => void;
  onClosePlayerMenu: () => void;
}

export function useGmDialogState() {
  const [sceneDialog, setSceneDialog] = useState<SceneNameDialog | null>(null);
  const [folderDialog, setFolderDialog] = useState<FolderNameDialog | null>(null);
  const [fogShapeDialog, setFogShapeDialog] = useState<FogShapeNameDialog | null>(null);
  const [environmentEffectDialog, setEnvironmentEffectDialog] = useState<EnvironmentEffectNameDialog | null>(null);
  const [tokenDialog, setTokenDialog] = useState<TokenNameDialog | null>(null);
  const [tokenCropDialog, setTokenCropDialog] = useState<TokenCropDialogState | null>(null);
  const [tokenAssetDialog, setTokenAssetDialog] = useState<TokenAssetNameDialog | null>(null);
  const [tokenDefaultsDialog, setTokenDefaultsDialog] = useState<TokenDefaultsDialog | null>(null);
  const [tokenColorDialog, setTokenColorDialog] = useState<TokenColorDialog | null>(null);
  const [folderColorDialog, setFolderColorDialog] = useState<FolderColorDialog | null>(null);
  const [sceneColorDialog, setSceneColorDialog] = useState<SceneColorDialog | null>(null);
  const [campaignNameDialogOpen, setCampaignNameDialogOpen] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState<CampaignSceneEntry | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<CampaignSceneFolder | null>(null);
  const [mapAssetToDelete, setMapAssetToDelete] = useState<Asset | null>(null);
  const [tokenAssetToDelete, setTokenAssetToDelete] = useState<TokenAssetDeleteDialog | null>(null);
  const [tableDisplayWizardOpen, setTableDisplayWizardOpen] = useState(false);
  const [playerDisplayDialogOpen, setPlayerDisplayDialogOpen] = useState(false);
  const [mapCalibrationAssistantOpen, setMapCalibrationAssistantOpen] = useState(false);
  const [confirmClearFogOpen, setConfirmClearFogOpen] = useState(false);
  const [mapCalibrationBoxPicking, setMapCalibrationBoxPicking] = useState(false);

  return {
    sceneDialog,
    setSceneDialog,
    folderDialog,
    setFolderDialog,
    fogShapeDialog,
    setFogShapeDialog,
    environmentEffectDialog,
    setEnvironmentEffectDialog,
    tokenDialog,
    setTokenDialog,
    tokenCropDialog,
    setTokenCropDialog,
    tokenAssetDialog,
    setTokenAssetDialog,
    tokenDefaultsDialog,
    setTokenDefaultsDialog,
    tokenColorDialog,
    setTokenColorDialog,
    folderColorDialog,
    setFolderColorDialog,
    sceneColorDialog,
    setSceneColorDialog,
    campaignNameDialogOpen,
    setCampaignNameDialogOpen,
    sceneToDelete,
    setSceneToDelete,
    folderToDelete,
    setFolderToDelete,
    mapAssetToDelete,
    setMapAssetToDelete,
    tokenAssetToDelete,
    setTokenAssetToDelete,
    tableDisplayWizardOpen,
    setTableDisplayWizardOpen,
    playerDisplayDialogOpen,
    setPlayerDisplayDialogOpen,
    mapCalibrationAssistantOpen,
    setMapCalibrationAssistantOpen,
    confirmClearFogOpen,
    setConfirmClearFogOpen,
    mapCalibrationBoxPicking,
    setMapCalibrationBoxPicking
  };
}

export type GmDialogState = ReturnType<typeof useGmDialogState>;

export function useGmDialogEscape({
  dialogs,
  openSceneMenuId,
  openFolderMenuId,
  playerMenuOpen,
  onCancelTokenCrop,
  onCloseSceneMenu,
  onCloseFolderMenu,
  onClosePlayerMenu
}: UseGmDialogEscapeOptions & { dialogs: GmDialogState }) {
  const {
    sceneDialog,
    setSceneDialog,
    folderDialog,
    setFolderDialog,
    fogShapeDialog,
    setFogShapeDialog,
    tokenDialog,
    setTokenDialog,
    tokenCropDialog,
    tokenAssetDialog,
    setTokenAssetDialog,
    tokenDefaultsDialog,
    setTokenDefaultsDialog,
    tokenColorDialog,
    setTokenColorDialog,
    folderColorDialog,
    setFolderColorDialog,
    sceneColorDialog,
    setSceneColorDialog,
    campaignNameDialogOpen,
    setCampaignNameDialogOpen,
    sceneToDelete,
    setSceneToDelete,
    folderToDelete,
    setFolderToDelete,
    mapAssetToDelete,
    setMapAssetToDelete,
    tokenAssetToDelete,
    setTokenAssetToDelete,
    tableDisplayWizardOpen,
    setTableDisplayWizardOpen,
    playerDisplayDialogOpen,
    setPlayerDisplayDialogOpen,
    mapCalibrationAssistantOpen,
    setMapCalibrationAssistantOpen,
    confirmClearFogOpen,
    setConfirmClearFogOpen,
    mapCalibrationBoxPicking,
    setMapCalibrationBoxPicking
  } = dialogs;

  useEffect(() => {
    if (
      !sceneDialog &&
      !folderDialog &&
      !fogShapeDialog &&
      !tokenDialog &&
      !tokenCropDialog &&
      !tokenAssetDialog &&
      !tokenDefaultsDialog &&
      !folderColorDialog &&
      !tokenColorDialog &&
      !sceneColorDialog &&
      !campaignNameDialogOpen &&
      !playerDisplayDialogOpen &&
      !mapCalibrationAssistantOpen &&
      !mapCalibrationBoxPicking &&
      !sceneToDelete &&
      !folderToDelete &&
      !mapAssetToDelete &&
      !tokenAssetToDelete &&
      !tableDisplayWizardOpen &&
      !confirmClearFogOpen &&
      !openSceneMenuId &&
      !openFolderMenuId &&
      !playerMenuOpen
    ) {
      return;
    }

    const closeModal = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      setSceneDialog(null);
      setFolderDialog(null);
      setFogShapeDialog(null);
      setTokenDialog(null);
      onCancelTokenCrop();
      setTokenAssetDialog(null);
      setTokenDefaultsDialog(null);
      setFolderColorDialog(null);
      setTokenColorDialog(null);
      setSceneColorDialog(null);
      setCampaignNameDialogOpen(false);
      setPlayerDisplayDialogOpen(false);
      setMapCalibrationAssistantOpen(false);
      setMapCalibrationBoxPicking(false);
      setSceneToDelete(null);
      setFolderToDelete(null);
      setMapAssetToDelete(null);
      setTokenAssetToDelete(null);
      setTableDisplayWizardOpen(false);
      setConfirmClearFogOpen(false);
      onCloseSceneMenu();
      onCloseFolderMenu();
      onClosePlayerMenu();
    };

    window.addEventListener("keydown", closeModal);
    return () => window.removeEventListener("keydown", closeModal);
  }, [
    campaignNameDialogOpen,
    confirmClearFogOpen,
    folderColorDialog,
    folderDialog,
    fogShapeDialog,
    tokenDialog,
    tokenCropDialog,
    tokenAssetDialog,
    tokenDefaultsDialog,
    tokenColorDialog,
    folderToDelete,
    mapAssetToDelete,
    tokenAssetToDelete,
    tableDisplayWizardOpen,
    openFolderMenuId,
    openSceneMenuId,
    mapCalibrationAssistantOpen,
    mapCalibrationBoxPicking,
    onCancelTokenCrop,
    onCloseFolderMenu,
    onClosePlayerMenu,
    onCloseSceneMenu,
    playerDisplayDialogOpen,
    playerMenuOpen,
    sceneColorDialog,
    sceneDialog,
    sceneToDelete,
    setCampaignNameDialogOpen,
    setConfirmClearFogOpen,
    setFogShapeDialog,
    setFolderColorDialog,
    setFolderDialog,
    setFolderToDelete,
    setMapAssetToDelete,
    setMapCalibrationAssistantOpen,
    setMapCalibrationBoxPicking,
    setPlayerDisplayDialogOpen,
    setSceneColorDialog,
    setSceneDialog,
    setSceneToDelete,
    setTokenAssetDialog,
    setTokenAssetToDelete,
    setTableDisplayWizardOpen,
    setTokenColorDialog,
    setTokenDefaultsDialog,
    setTokenDialog
  ]);
}
