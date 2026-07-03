import { describe, expect, it } from "vitest";
import {
  directoryDialogOptions,
  mapFileDialogOptions,
  selectedDialogPath,
  tokenFileDialogOptions
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
});
