import path from "node:path";
import type { BrowserWindowConstructorOptions } from "electron";

export type AppWindowKind = "gm" | "player";

export interface WindowLoadTarget {
  kind: "url" | "file";
  value: string;
  hash?: string;
}

export function createAppWindowOptions(kind: AppWindowKind, appPath: string, iconPath: string): BrowserWindowConstructorOptions {
  return {
    width: kind === "gm" ? 1440 : 1280,
    height: kind === "gm" ? 960 : 720,
    title: kind === "gm" ? "Local VTT - GM View" : "Local VTT - Player View",
    icon: iconPath,
    backgroundColor: kind === "gm" ? "#101318" : "#000000",
    webPreferences: {
      preload: path.join(appPath, "dist-electron", "electron", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Keep disabled until the Electron preload is emitted in a sandbox-compatible CommonJS bundle.
      // The current NodeNext/ESM preload fails under sandbox with "Cannot use import statement outside a module".
      sandbox: false
    }
  };
}

export function createWindowLoadTarget(kind: AppWindowKind, isDev: boolean, devServerUrl: string, appPath: string): WindowLoadTarget {
  if (isDev) {
    return {
      kind: "url",
      value: `${devServerUrl}/#/${kind}`
    };
  }

  return {
    kind: "file",
    value: path.join(appPath, "dist", "index.html"),
    hash: `/${kind}`
  };
}
