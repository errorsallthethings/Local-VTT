export type GmCloseRequestAction = "allow-close" | "close-after-pausing" | "prompt-unsaved";
export type UnsavedChangesDialogAction = "cancel" | "save-before-close" | "close-after-pausing";

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
