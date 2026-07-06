export type GmCloseRequestAction = "allow-close" | "close-after-pausing" | "prompt-unsaved";
export type UnsavedChangesDialogAction = "cancel" | "save-before-close" | "close-after-pausing";

export interface ClosableGmWindow {
  close(): void;
}

export interface CloseGmWindowAfterPausingOptions {
  currentCampaignPath: string | null;
  logger?: Pick<Console, "error">;
  pauseActiveTurnOrders: (campaignPath: string) => Promise<void>;
  setForceCloseGmWindow: (forceClose: boolean) => void;
  setGmHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
  win: ClosableGmWindow;
}

export function getGmCloseRequestAction(forceClose: boolean, hasUnsavedChanges: boolean): GmCloseRequestAction {
  if (forceClose) {
    return "allow-close";
  }

  return hasUnsavedChanges ? "prompt-unsaved" : "close-after-pausing";
}

export function getUnsavedChangesDialogAction(choice: number): UnsavedChangesDialogAction {
  if (choice === 1) {
    return "save-before-close";
  }

  if (choice === 2) {
    return "close-after-pausing";
  }

  return "cancel";
}

export async function closeGmWindowAfterPausing({
  currentCampaignPath,
  logger = console,
  pauseActiveTurnOrders,
  setForceCloseGmWindow,
  setGmHasUnsavedChanges,
  win
}: CloseGmWindowAfterPausingOptions): Promise<void> {
  try {
    if (currentCampaignPath) {
      await pauseActiveTurnOrders(currentCampaignPath);
    }
  } catch (caught) {
    logger.error("Could not pause turn orders before closing.", caught);
  }
  setForceCloseGmWindow(true);
  setGmHasUnsavedChanges(false);
  win.close();
}
