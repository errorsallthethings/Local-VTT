import path from "node:path";
import { describe, expect, it } from "vitest";
import { createAppWindowOptions, createWindowLoadTarget } from "../../electron/windowConfig";

describe("window config", () => {
  it("creates GM window options", () => {
    const options = createAppWindowOptions("gm", path.resolve("app"), path.resolve("build", "icon.ico"));

    expect(options).toMatchObject({
      width: 1440,
      height: 960,
      title: "Local VTT - GM View",
      backgroundColor: "#101318",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });
    expect(options.webPreferences?.preload).toContain(path.join("dist-electron", "electron", "preload.js"));
  });

  it("creates Player window options", () => {
    expect(createAppWindowOptions("player", path.resolve("app"), path.resolve("build", "icon.ico"))).toMatchObject({
      width: 1280,
      height: 720,
      title: "Local VTT - Player View",
      backgroundColor: "#000000"
    });
  });

  it("creates dev-server load targets", () => {
    expect(createWindowLoadTarget("player", true, "http://127.0.0.1:5173", path.resolve("app"))).toEqual({
      kind: "url",
      value: "http://127.0.0.1:5173/#/player"
    });
  });

  it("creates packaged file load targets", () => {
    expect(createWindowLoadTarget("gm", false, "http://127.0.0.1:5173", path.resolve("app"))).toEqual({
      kind: "file",
      value: path.join(path.resolve("app"), "dist", "index.html"),
      hash: "/gm"
    });
  });
});
