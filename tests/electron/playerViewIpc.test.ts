import type { BrowserWindow, IpcMainInvokeEvent } from "electron";
import { describe, expect, it, vi } from "vitest";
import {
  createDefaultCampaign,
  createDefaultScene,
  projectSceneForPlayer
} from "../../src/shared/localvtt";
import {
  createPlayerOpenPlan,
  liveTableEventRoute,
  registerPlayerViewIpc,
  summarizeDisplay,
  type PlayerDisplayLike
} from "../../electron/playerViewIpc";

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

type IpcHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>;

function createIpcRegistry() {
  const handlers = new Map<string, IpcHandler>();
  return {
    ipcMain: {
      handle: vi.fn((channel: string, handler: IpcHandler) => {
        handlers.set(channel, handler);
      })
    },
    invoke: (channel: string, event: Partial<IpcMainInvokeEvent>, ...args: unknown[]) => {
      const handler = handlers.get(channel);
      if (!handler) {
        throw new Error(`No handler registered for ${channel}.`);
      }
      return handler(event as IpcMainInvokeEvent, ...args);
    }
  };
}

function createFakeWindow(options: { destroyed?: boolean; fullScreen?: boolean; id?: number; loading?: boolean } = {}) {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  let destroyed = options.destroyed ?? false;
  let fullScreen = options.fullScreen ?? false;
  const win = {
    close: vi.fn(() => {
      destroyed = true;
    }),
    focus: vi.fn(),
    isDestroyed: vi.fn(() => destroyed),
    isFullScreen: vi.fn(() => fullScreen),
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      listeners.set(event, listener);
    }),
    setBounds: vi.fn(),
    setFullScreen: vi.fn((value: boolean) => {
      fullScreen = value;
    }),
    show: vi.fn(),
    webContents: {
      id: options.id ?? 10,
      isLoading: vi.fn(() => options.loading ?? false),
      once: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
        listeners.set(event, listener);
      }),
      send: vi.fn()
    }
  } as unknown as BrowserWindow;

  return { listeners, win };
}

function createRegisteredPlayerViewHarness() {
  const ipc = createIpcRegistry();
  const windows = {
    gm: createFakeWindow({ id: 1 }).win,
    player: null as BrowserWindow | null
  };
  let lastPlayerProjection: unknown = null;
  const createPlayerWindow = vi.fn(() => createFakeWindow({ id: 42 }).win);

  registerPlayerViewIpc(ipc.ipcMain, {
    createPlayerWindow,
    getDisplays: () => displays,
    getGmWindow: () => windows.gm,
    getLastPlayerProjection: () => lastPlayerProjection,
    getPlayerWindow: () => windows.player,
    setLastPlayerProjection: (projection) => {
      lastPlayerProjection = projection;
    },
    setPlayerWindow: (win) => {
      windows.player = win;
    }
  });

  return { createPlayerWindow, getLastPlayerProjection: () => lastPlayerProjection, ipc, windows };
}

function playerProjection() {
  const campaign = createDefaultCampaign("Player IPC Campaign");
  const scene = createDefaultScene("Player IPC Scene");
  return projectSceneForPlayer(campaign, scene);
}

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

  it("registers the expected Player View IPC handlers", () => {
    const ipc = createIpcRegistry();

    registerPlayerViewIpc(ipc.ipcMain, {
      createPlayerWindow: vi.fn(),
      getDisplays: () => displays,
      getGmWindow: () => null,
      getLastPlayerProjection: () => null,
      getPlayerWindow: () => null,
      setLastPlayerProjection: vi.fn(),
      setPlayerWindow: vi.fn()
    });

    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("player:open", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("player:sendScene", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("player:updateSceneIfOpen", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("player:showIdle", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("player:liveTableEvent", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("player:setFullscreen", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("player:close", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("player:getLastState", expect.any(Function));
    expect(ipc.ipcMain.handle).toHaveBeenCalledWith("app:getDisplays", expect.any(Function));
  });

  it("opens Player View on a requested display and replays the last projection", async () => {
    const harness = createRegisteredPlayerViewHarness();
    const projection = playerProjection();
    harness.windows.player = createFakeWindow({ id: 42 }).win;
    await harness.ipc.invoke("player:sendScene", { sender: { id: 1 } }, projection);

    const result = await harness.ipc.invoke("player:open", { sender: { id: 1 } }, { displayId: 2, fullscreen: true });

    expect(result).toEqual({ ok: true, displayFound: true });
    expect(harness.windows.player.setBounds).toHaveBeenCalledWith(displays[1].bounds);
    expect(harness.windows.player.setFullScreen).toHaveBeenLastCalledWith(true);
    expect(harness.windows.player.webContents.send).toHaveBeenCalledWith("player:state", projection);
  });

  it("creates Player View and queues the scene send until the window finishes loading", async () => {
    const ipc = createIpcRegistry();
    const player = createFakeWindow({ id: 42, loading: true });
    let playerWindow: BrowserWindow | null = null;
    const projection = playerProjection();

    registerPlayerViewIpc(ipc.ipcMain, {
      createPlayerWindow: () => player.win,
      getDisplays: () => displays,
      getGmWindow: () => null,
      getLastPlayerProjection: () => null,
      getPlayerWindow: () => playerWindow,
      setLastPlayerProjection: vi.fn(),
      setPlayerWindow: (win) => {
        playerWindow = win;
      }
    });

    await ipc.invoke("player:sendScene", { sender: { id: 1 } }, projection);

    expect(player.win.webContents.send).not.toHaveBeenCalled();
    player.listeners.get("did-finish-load")?.();
    expect(player.win.webContents.send).toHaveBeenCalledWith("player:state", projection);
  });

  it("updates an already open Player View without opening a new one", async () => {
    const harness = createRegisteredPlayerViewHarness();
    const player = createFakeWindow({ id: 42 }).win;
    const projection = playerProjection();
    harness.windows.player = player;

    await expect(harness.ipc.invoke("player:updateSceneIfOpen", { sender: { id: 1 } }, projection)).resolves.toBe(true);

    expect(harness.createPlayerWindow).not.toHaveBeenCalled();
    expect(player.webContents.send).toHaveBeenCalledWith("player:state", projection);
    expect(harness.getLastPlayerProjection()).toBe(projection);
  });

  it("routes live table events from Player View back to GM", async () => {
    const harness = createRegisteredPlayerViewHarness();
    harness.windows.player = createFakeWindow({ id: 42 }).win;
    const liveEvent = { id: "ping-1", type: "ping", point: { x: 10, y: 20 }, createdAt: 100 };

    await expect(harness.ipc.invoke("player:liveTableEvent", { sender: { id: 42 } }, liveEvent)).resolves.toBe(true);

    expect(harness.windows.gm.webContents.send).toHaveBeenCalledWith("player:liveTableEvent", liveEvent);
  });

  it("closes Player View and clears the last player state", async () => {
    const harness = createRegisteredPlayerViewHarness();
    const player = createFakeWindow({ id: 42 }).win;
    harness.windows.player = player;
    await harness.ipc.invoke("player:showIdle", { sender: { id: 1 } }, { type: "idle", title: "Break", message: "Back soon." });

    await expect(harness.ipc.invoke("player:close", { sender: { id: 1 } })).resolves.toBe(true);

    expect(player.close).toHaveBeenCalledOnce();
    expect(harness.windows.player).toBeNull();
    expect(harness.getLastPlayerProjection()).toBeNull();
  });
});
