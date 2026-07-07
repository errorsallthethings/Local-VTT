import { useCallback, useMemo } from "react";

interface UseGmPlayerViewMenuActionsOptions {
  activeScenePresent: boolean;
  setMapCalibrationAssistantOpen: (open: boolean) => void;
  setPlayerDisplayDialogOpen: (open: boolean) => void;
  setPlayerMenuOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  setTableDisplayWizardOpen: (open: boolean) => void;
}

export function useGmPlayerViewMenuActions({
  activeScenePresent,
  setMapCalibrationAssistantOpen,
  setPlayerDisplayDialogOpen,
  setPlayerMenuOpen,
  setTableDisplayWizardOpen
}: UseGmPlayerViewMenuActionsOptions) {
  const closePlayerMenu = useCallback(() => setPlayerMenuOpen(false), [setPlayerMenuOpen]);
  const togglePlayerMenu = useCallback(() => {
    if (activeScenePresent) {
      setPlayerMenuOpen((open) => !open);
    }
  }, [activeScenePresent, setPlayerMenuOpen]);
  const openTableDisplaySetup = useCallback(() => {
    setTableDisplayWizardOpen(true);
    closePlayerMenu();
  }, [closePlayerMenu, setTableDisplayWizardOpen]);
  const openPlayerDisplayScale = useCallback(() => {
    setPlayerDisplayDialogOpen(true);
    closePlayerMenu();
  }, [closePlayerMenu, setPlayerDisplayDialogOpen]);
  const openMapCalibrationAssistant = useCallback(() => {
    setMapCalibrationAssistantOpen(true);
    closePlayerMenu();
  }, [closePlayerMenu, setMapCalibrationAssistantOpen]);
  const closeTableDisplaySetup = useCallback(() => setTableDisplayWizardOpen(false), [setTableDisplayWizardOpen]);
  const closePlayerDisplayScale = useCallback(() => setPlayerDisplayDialogOpen(false), [setPlayerDisplayDialogOpen]);
  const closeMapCalibrationAssistant = useCallback(() => setMapCalibrationAssistantOpen(false), [setMapCalibrationAssistantOpen]);
  const openPlayerViewSetupFromWizard = useCallback(() => {
    setTableDisplayWizardOpen(false);
    setPlayerDisplayDialogOpen(true);
  }, [setPlayerDisplayDialogOpen, setTableDisplayWizardOpen]);
  const openMapCalibrationAssistantFromWizard = useCallback(() => {
    setTableDisplayWizardOpen(false);
    setMapCalibrationAssistantOpen(true);
  }, [setMapCalibrationAssistantOpen, setTableDisplayWizardOpen]);
  const openPlayerViewSetupFromAssistant = useCallback(() => {
    setMapCalibrationAssistantOpen(false);
    setPlayerDisplayDialogOpen(true);
  }, [setMapCalibrationAssistantOpen, setPlayerDisplayDialogOpen]);

  return useMemo(() => ({
    closePlayerMenu,
    togglePlayerMenu,
    openTableDisplaySetup,
    openPlayerDisplayScale,
    openMapCalibrationAssistant,
    closeTableDisplaySetup,
    closePlayerDisplayScale,
    closeMapCalibrationAssistant,
    openPlayerViewSetupFromWizard,
    openMapCalibrationAssistantFromWizard,
    openPlayerViewSetupFromAssistant
  }), [
    closeMapCalibrationAssistant,
    closePlayerDisplayScale,
    closePlayerMenu,
    closeTableDisplaySetup,
    openMapCalibrationAssistant,
    openMapCalibrationAssistantFromWizard,
    openPlayerDisplayScale,
    openPlayerViewSetupFromAssistant,
    openPlayerViewSetupFromWizard,
    openTableDisplaySetup,
    togglePlayerMenu
  ]);
}
