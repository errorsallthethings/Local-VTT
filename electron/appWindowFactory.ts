import type { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { createAppWindowOptions, createWindowLoadTarget } from "./windowConfig.js";
import { installWindowDiagnostics, type AppWindowHash } from "./windowDiagnostics.js";

export type BrowserWindowFactory = new (options: BrowserWindowConstructorOptions) => BrowserWindow;

export interface CreateLocalVttWindowOptions {
  BrowserWindowClass: BrowserWindowFactory;
  appPath: string;
  appWindowIconPath: string;
  devServerUrl: string;
  hash: AppWindowHash;
  isDev: boolean;
}

export function createLocalVttWindow({
  BrowserWindowClass,
  appPath,
  appWindowIconPath,
  devServerUrl,
  hash,
  isDev
}: CreateLocalVttWindowOptions): BrowserWindow {
  const win = new BrowserWindowClass(createAppWindowOptions(hash, appPath, appWindowIconPath));

  installWindowDiagnostics(win, hash, { isDev });

  const loadTarget = createWindowLoadTarget(hash, isDev, devServerUrl, appPath);
  if (loadTarget.kind === "url") {
    void win.loadURL(loadTarget.value);
  } else {
    void win.loadFile(loadTarget.value, { hash: loadTarget.hash });
  }

  return win;
}
