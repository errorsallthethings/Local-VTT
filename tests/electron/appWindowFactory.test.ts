import type { BrowserWindowConstructorOptions } from "electron";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createLocalVttWindow } from "../../electron/appWindowFactory";

function createFakeBrowserWindowClass() {
  const instances: Array<{
    loadFile: ReturnType<typeof vi.fn>;
    loadURL: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    options: BrowserWindowConstructorOptions;
    webContents: { on: ReturnType<typeof vi.fn> };
  }> = [];

  class FakeBrowserWindow {
    loadFile = vi.fn();
    loadURL = vi.fn();
    on = vi.fn();
    webContents = { on: vi.fn() };
    options: BrowserWindowConstructorOptions;

    constructor(options: BrowserWindowConstructorOptions) {
      this.options = options;
      instances.push(this);
    }
  }

  return {
    BrowserWindowClass: FakeBrowserWindow as never,
    instances
  };
}

describe("app window factory", () => {
  it("creates and loads a development GM window", () => {
    const fake = createFakeBrowserWindowClass();

    const win = createLocalVttWindow({
      BrowserWindowClass: fake.BrowserWindowClass,
      appPath: path.resolve("app"),
      appWindowIconPath: path.resolve("build", "icon.ico"),
      devServerUrl: "http://127.0.0.1:5173",
      hash: "gm",
      isDev: true
    });

    expect(win).toBe(fake.instances[0]);
    expect(fake.instances[0].options).toMatchObject({ title: "Local VTT - GM View", width: 1440, height: 960 });
    expect(fake.instances[0].loadURL).toHaveBeenCalledWith("http://127.0.0.1:5173/#/gm");
    expect(fake.instances[0].loadFile).not.toHaveBeenCalled();
    expect(fake.instances[0].webContents.on).toHaveBeenCalledWith("console-message", expect.any(Function));
  });

  it("creates and loads a packaged Player window", () => {
    const fake = createFakeBrowserWindowClass();
    const appPath = path.resolve("packaged-app");

    createLocalVttWindow({
      BrowserWindowClass: fake.BrowserWindowClass,
      appPath,
      appWindowIconPath: path.resolve("build", "icon.ico"),
      devServerUrl: "http://127.0.0.1:5173",
      hash: "player",
      isDev: false
    });

    expect(fake.instances[0].options).toMatchObject({ title: "Local VTT - Player View", width: 1280, height: 720 });
    expect(fake.instances[0].loadFile).toHaveBeenCalledWith(path.join(appPath, "dist", "index.html"), { hash: "/player" });
    expect(fake.instances[0].loadURL).not.toHaveBeenCalled();
  });
});
