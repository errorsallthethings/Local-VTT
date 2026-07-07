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

export type FileDialogWindow = object;

export interface FileDialogAdapter {
  showOpenDialog(window: FileDialogWindow, options: FileDialogOptions): Promise<FileDialogResult>;
  showOpenDialog(options: FileDialogOptions): Promise<FileDialogResult>;
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

export async function chooseDirectory(
  dialog: FileDialogAdapter,
  ownerWindow: FileDialogWindow | null,
  title: string,
  createDirectory = false
): Promise<string | null> {
  return showOpenDialogAndSelectPath(dialog, ownerWindow, directoryDialogOptions(title, createDirectory));
}

export async function chooseMapFile(dialog: FileDialogAdapter, ownerWindow: FileDialogWindow | null): Promise<string | null> {
  return showOpenDialogAndSelectPath(dialog, ownerWindow, mapFileDialogOptions());
}

export async function chooseTokenFile(dialog: FileDialogAdapter, ownerWindow: FileDialogWindow | null): Promise<string | null> {
  return showOpenDialogAndSelectPath(dialog, ownerWindow, tokenFileDialogOptions());
}

async function showOpenDialogAndSelectPath(
  dialog: FileDialogAdapter,
  ownerWindow: FileDialogWindow | null,
  options: FileDialogOptions
): Promise<string | null> {
  const result = ownerWindow ? await dialog.showOpenDialog(ownerWindow, options) : await dialog.showOpenDialog(options);
  return selectedDialogPath(result);
}
