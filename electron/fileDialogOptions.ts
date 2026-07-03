export interface FileDialogFilter {
  name: string;
  extensions: string[];
}

export interface FileDialogOptions {
  title: string;
  properties: Array<"openFile" | "openDirectory" | "createDirectory">;
  filters?: FileDialogFilter[];
}

export interface FileDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export function directoryDialogOptions(title: string, createDirectory = false): FileDialogOptions {
  return {
    title,
    properties: createDirectory ? ["openDirectory", "createDirectory"] : ["openDirectory"]
  };
}

export function mapFileDialogOptions(): FileDialogOptions {
  return {
    title: "Import a battle map",
    properties: ["openFile"],
    filters: [
      { name: "Battle maps", extensions: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm"] },
      { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
      { name: "Videos", extensions: ["mp4", "webm"] }
    ]
  };
}

export function tokenFileDialogOptions(): FileDialogOptions {
  return {
    title: "Import a token image",
    properties: ["openFile"],
    filters: [
      { name: "Token images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
      { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] }
    ]
  };
}

export function selectedDialogPath(result: FileDialogResult): string | null {
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
}
