import { describe, expect, it, vi } from "vitest";
import {
  chooseDirectory,
  chooseMapFile,
  chooseTokenFile,
  directoryDialogOptions,
  mapFileDialogOptions,
  selectedDialogPath,
  tokenFileDialogOptions,
  type FileDialogAdapter,
  type FileDialogWindow
} from "../../electron/fileDialogOptions";

describe("file dialog options", () => {
  it("builds directory picker options", () => {
    expect(directoryDialogOptions("Open campaign")).toEqual({
      title: "Open campaign",
      properties: ["openDirectory"]
    });
    expect(directoryDialogOptions("Create campaign", true)).toEqual({
      title: "Create campaign",
      properties: ["openDirectory", "createDirectory"]
    });
  });

  it("builds map picker options for image and video battle maps", () => {
    expect(mapFileDialogOptions()).toEqual({
      title: "Import a battle map",
      properties: ["openFile"],
      filters: [
        { name: "Battle maps", extensions: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm"] },
        { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
        { name: "Videos", extensions: ["mp4", "webm"] }
      ]
    });
  });

  it("builds token picker options for image assets only", () => {
    expect(tokenFileDialogOptions()).toEqual({
      title: "Import a token image",
      properties: ["openFile"],
      filters: [
        { name: "Token images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
        { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] }
      ]
    });
  });

  it("returns the selected path when the dialog succeeds", () => {
    expect(selectedDialogPath({ canceled: false, filePaths: ["first.png", "second.png"] })).toBe("first.png");
  });

  it("returns null when the dialog is canceled or empty", () => {
    expect(selectedDialogPath({ canceled: true, filePaths: ["ignored.png"] })).toBeNull();
    expect(selectedDialogPath({ canceled: false, filePaths: [] })).toBeNull();
  });

  it("chooses a directory with the owner window when one is available", async () => {
    const ownerWindow: FileDialogWindow = {};
    const dialog = dialogAdapter(["campaign"]);

    await expect(chooseDirectory(dialog, ownerWindow, "Create campaign", true)).resolves.toBe("campaign");

    expect(dialog.showOpenDialog).toHaveBeenCalledWith(ownerWindow, directoryDialogOptions("Create campaign", true));
  });

  it("chooses files without an owner window when needed", async () => {
    const dialog = dialogAdapter(["map.png"]);

    await expect(chooseMapFile(dialog, null)).resolves.toBe("map.png");

    expect(dialog.showOpenDialog).toHaveBeenCalledWith(mapFileDialogOptions());
  });

  it("returns null from token selection when the user cancels", async () => {
    const dialog = dialogAdapter([], true);

    await expect(chooseTokenFile(dialog, null)).resolves.toBeNull();

    expect(dialog.showOpenDialog).toHaveBeenCalledWith(tokenFileDialogOptions());
  });
});

function dialogAdapter(filePaths: string[], canceled = false): FileDialogAdapter & { showOpenDialog: ReturnType<typeof vi.fn> } {
  return {
    showOpenDialog: vi.fn().mockResolvedValue({ canceled, filePaths })
  };
}
