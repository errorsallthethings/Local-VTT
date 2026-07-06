import { describe, expect, it, vi } from "vitest";
import { registerAppLifecycleIpc } from "../../electron/appLifecycleIpc";

type IpcListener = (_event: unknown, ...args: unknown[]) => void;

function createIpcRegistry() {
  const listeners = new Map<string, IpcListener>();
  return {
    emit: (channel: string, ...args: unknown[]) => {
      const listener = listeners.get(channel);
      if (!listener) {
        throw new Error(`No listener registered for ${channel}.`);
      }
      listener({}, ...args);
    },
    ipcMain: {
      on: vi.fn((channel: string, listener: IpcListener) => {
        listeners.set(channel, listener);
      })
    }
  };
}

describe("app lifecycle IPC", () => {
  it("registers app lifecycle listeners", () => {
    const ipc = createIpcRegistry();

    registerAppLifecycleIpc(ipc.ipcMain, {
      closeAfterSave: vi.fn(),
      setUnsavedChanges: vi.fn()
    });

    expect(ipc.ipcMain.on).toHaveBeenCalledWith("app:setUnsavedChanges", expect.any(Function));
    expect(ipc.ipcMain.on).toHaveBeenCalledWith("app:closeAfterSave", expect.any(Function));
  });

  it("validates and stores the unsaved changes flag", () => {
    const ipc = createIpcRegistry();
    const setUnsavedChanges = vi.fn();

    registerAppLifecycleIpc(ipc.ipcMain, {
      closeAfterSave: vi.fn(),
      setUnsavedChanges
    });
    ipc.emit("app:setUnsavedChanges", true);

    expect(setUnsavedChanges).toHaveBeenCalledWith(true);
  });

  it("rejects invalid unsaved changes payloads", () => {
    const ipc = createIpcRegistry();

    registerAppLifecycleIpc(ipc.ipcMain, {
      closeAfterSave: vi.fn(),
      setUnsavedChanges: vi.fn()
    });

    expect(() => ipc.emit("app:setUnsavedChanges", "yes")).toThrow("Unsaved changes state is invalid.");
  });

  it("requests close after save", () => {
    const ipc = createIpcRegistry();
    const closeAfterSave = vi.fn();

    registerAppLifecycleIpc(ipc.ipcMain, {
      closeAfterSave,
      setUnsavedChanges: vi.fn()
    });
    ipc.emit("app:closeAfterSave");

    expect(closeAfterSave).toHaveBeenCalledOnce();
  });
});
