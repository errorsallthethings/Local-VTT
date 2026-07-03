import { describe, expect, it } from "vitest";
import { liveTableEventRoute, summarizeDisplay } from "../../electron/playerViewIpc";

describe("player view IPC helpers", () => {
  it("routes player-originated live table events to GM when available", () => {
    expect(liveTableEventRoute(42, { exists: true, destroyed: false, webContentsId: 42 }, true)).toBe("gm");
    expect(liveTableEventRoute(42, { exists: true, destroyed: false, webContentsId: 42 }, false)).toBeNull();
  });

  it("routes GM-originated live table events to an open player window", () => {
    expect(liveTableEventRoute(7, { exists: true, destroyed: false, webContentsId: 42 }, true)).toBe("player");
    expect(liveTableEventRoute(7, { exists: false, destroyed: true }, true)).toBeNull();
    expect(liveTableEventRoute(7, { exists: true, destroyed: true, webContentsId: 42 }, true)).toBeNull();
  });

  it("summarizes displays with native resolution", () => {
    expect(
      summarizeDisplay({
        id: 1,
        label: "Table TV",
        bounds: { x: 100, y: 200, width: 1920, height: 1080 },
        workArea: { x: 100, y: 200, width: 1920, height: 1040 },
        scaleFactor: 1.25,
        rotation: 0
      })
    ).toEqual({
      id: 1,
      label: "Table TV",
      bounds: { x: 100, y: 200, width: 1920, height: 1080 },
      workArea: { x: 100, y: 200, width: 1920, height: 1040 },
      nativeResolution: { width: 2400, height: 1350 },
      scaleFactor: 1.25,
      rotation: 0
    });
  });
});
