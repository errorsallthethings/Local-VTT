import type { IpcMain } from "electron";
import { assertIpcBoolean } from "./ipcPayloadValidation.js";

export interface RegisterAppLifecycleIpcOptions {
  closeAfterSave: () => void;
  setUnsavedChanges: (hasUnsavedChanges: boolean) => void;
}

export function registerAppLifecycleIpc(ipcMain: Pick<IpcMain, "on">, options: RegisterAppLifecycleIpcOptions): void {
  ipcMain.on("app:setUnsavedChanges", (_event, hasUnsavedChanges: boolean) => {
    assertIpcBoolean(hasUnsavedChanges, "Unsaved changes state");
    options.setUnsavedChanges(hasUnsavedChanges);
  });

  ipcMain.on("app:closeAfterSave", () => {
    options.closeAfterSave();
  });
}
