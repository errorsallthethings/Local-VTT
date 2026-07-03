import { describe, expect, it } from "vitest";
import { createPlayerOpenPlan, liveTableEventRoute, summarizeDisplay, type PlayerDisplayLike } from "../../electron/playerViewIpc";

const displays: PlayerDisplayLike[] = [
  {
    id: 1,
    label: "GM Laptop",
    bounds: { x: 0, y: 0, width: 1440, height: 900 },
    workArea: { x: 0, y: 0, width: 1440, height: 860 },
    scaleFactor: 2,
    rotation: 0
  },
  {
    id: 2,
    label: "Table TV",
    bounds: { x: 1440, y: 0, width: 1920, height: 1080 },
    workArea: { x: 1440, y: 0, width: 1920, height: 1040 },
    scaleFactor: 1,
    rotation: 0
  }
];

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

  it("plans player window placement for requested displays", () => {
    expect(createPlayerOpenPlan({ displayId: 2, fullscreen: true }, { created: true, fullscreen: false }, displays)).toEqual({
      targetDisplay: displays[1],
      displayFound: true,
      shouldSetBounds: true,
      shouldSetFullscreen: true
    });
  });

  it("does not move an existing fullscreen player window before changing display", () => {
    expect(createPlayerOpenPlan({ displayId: 2 }, { created: false, fullscreen: true }, displays)).toEqual({
      targetDisplay: displays[1],
      displayFound: true,
      shouldSetBounds: false,
      shouldSetFullscreen: false
    });
  });

  it("reports missing requested displays without changing placement", () => {
    expect(createPlayerOpenPlan({ displayId: 999, fullscreen: true }, { created: true, fullscreen: false }, displays)).toEqual({
      targetDisplay: null,
      displayFound: false,
      shouldSetBounds: false,
      shouldSetFullscreen: false
    });
  });

  it("treats omitted display options as a valid default display choice", () => {
    expect(createPlayerOpenPlan(undefined, { created: true, fullscreen: false }, displays)).toEqual({
      targetDisplay: null,
      displayFound: true,
      shouldSetBounds: false,
      shouldSetFullscreen: false
    });
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
