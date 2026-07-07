import type { BrowserWindow, IpcMain, IpcMainInvokeEvent } from "electron";
import {
  isLiveTableEvent,
  isPlayerIdleState,
  type PlayerSceneProjection
} from "../src/shared/localvtt.js";
import {
  assertIpcBoolean,
  assertPlayerOpenOptions,
  assertPlayerSceneProjection
} from "./ipcPayloadValidation.js";

export interface PlayerViewWindowState {
  exists: boolean;
  destroyed: boolean;
  webContentsId?: number;
}

export interface PlayerDisplayLike {
  id: number;
  label: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  rotation: number;
}

export interface PlayerDisplaySummary extends PlayerDisplayLike {
  nativeResolution: {
    width: number;
    height: number;
  };
}

export interface PlayerOpenOptions {
  displayId?: number;
  fullscreen?: boolean;
}

export interface PlayerOpenWindowState {
  created: boolean;
  fullscreen: boolean;
}

export interface PlayerOpenPlan {
  targetDisplay: PlayerDisplayLike | null;
  displayFound: boolean;
  shouldSetBounds: boolean;
  shouldSetFullscreen: boolean;
}

export function liveTableEventRoute(
  senderId: number,
  playerWindow: PlayerViewWindowState,
  gmAvailable: boolean
): "gm" | "player" | null {
  const playerAvailable = playerWindow.exists && !playerWindow.destroyed;
  const sentFromPlayer = Boolean(playerAvailable && senderId === playerWindow.webContentsId);

  if (sentFromPlayer) {
    return gmAvailable ? "gm" : null;
  }

  return playerAvailable ? "player" : null;
}

export function createPlayerOpenPlan(
  options: PlayerOpenOptions | undefined,
  windowState: PlayerOpenWindowState,
  displays: PlayerDisplayLike[]
): PlayerOpenPlan {
  const requestedDisplay = typeof options?.displayId === "number";
  const targetDisplay = requestedDisplay ? displays.find((display) => display.id === options.displayId) ?? null : null;
  const shouldSetBounds = Boolean(targetDisplay && (windowState.created || !windowState.fullscreen));

  return {
    targetDisplay,
    displayFound: requestedDisplay ? Boolean(targetDisplay) : true,
    shouldSetBounds,
    shouldSetFullscreen: Boolean(options?.fullscreen && targetDisplay)
  };
}

export function summarizeDisplay(display: PlayerDisplayLike): PlayerDisplaySummary {
  return {
    id: display.id,
    label: display.label,
    bounds: display.bounds,
    workArea: display.workArea,
    nativeResolution: {
      width: Math.round(display.bounds.width * display.scaleFactor),
      height: Math.round(display.bounds.height * display.scaleFactor)
    },
    scaleFactor: display.scaleFactor,
    rotation: display.rotation
  };
}

export interface PlayerWindowStateAccess {
  createPlayerWindow: () => BrowserWindow;
  getGmWindow: () => BrowserWindow | null;
  getLastPlayerProjection: () => unknown;
  getPlayerWindow: () => BrowserWindow | null;
  setLastPlayerProjection: (projection: unknown) => void;
  setPlayerWindow: (win: BrowserWindow | null) => void;
}

export interface RegisterPlayerViewIpcOptions extends PlayerWindowStateAccess {
  getDisplays: () => PlayerDisplayLike[];
}

export function registerPlayerViewIpc(ipcMain: Pick<IpcMain, "handle">, options: RegisterPlayerViewIpcOptions): void {
  ipcMain.handle("player:open", async (_event, openOptions?: PlayerOpenOptions) => {
    assertPlayerOpenOptions(openOptions);
    let playerWindow = options.getPlayerWindow();
    if (playerWindow?.isDestroyed()) {
      options.setPlayerWindow(null);
      playerWindow = null;
    }

    const createdPlayerWindow = !playerWindow;
    if (!playerWindow) {
      playerWindow = options.createPlayerWindow();
      options.setPlayerWindow(playerWindow);
      playerWindow.on("closed", () => {
        options.setPlayerWindow(null);
      });
    }

    const openPlan = createPlayerOpenPlan(openOptions, { created: createdPlayerWindow, fullscreen: playerWindow.isFullScreen() }, options.getDisplays());
    if (openPlan.targetDisplay && openPlan.shouldSetBounds) {
      playerWindow.setFullScreen(false);
      playerWindow.setBounds(openPlan.targetDisplay.bounds);
    }
    playerWindow.show();
    playerWindow.focus();
    if (openPlan.shouldSetFullscreen) {
      playerWindow.setFullScreen(true);
    }

    const lastPlayerProjection = options.getLastPlayerProjection();
    if (lastPlayerProjection) {
      sendToPlayerWhenReady(playerWindow, lastPlayerProjection);
    }
    return { ok: true, displayFound: openPlan.displayFound };
  });

  ipcMain.handle("player:sendScene", async (_event, projection: PlayerSceneProjection) => {
    assertPlayerSceneProjection(projection);
    options.setLastPlayerProjection(projection);
    let playerWindow = options.getPlayerWindow();
    if (!playerWindow || playerWindow.isDestroyed()) {
      playerWindow = options.createPlayerWindow();
      options.setPlayerWindow(playerWindow);
    }
    sendToPlayerWhenReady(playerWindow, projection);
    return true;
  });

  ipcMain.handle("player:updateSceneIfOpen", async (_event, projection: PlayerSceneProjection) => {
    assertPlayerSceneProjection(projection);
    const playerWindow = options.getPlayerWindow();
    if (!playerWindow || playerWindow.isDestroyed()) {
      return false;
    }
    options.setLastPlayerProjection(projection);
    sendToPlayerWhenReady(playerWindow, projection);
    return true;
  });

  ipcMain.handle("player:showIdle", async (_event, state: unknown) => {
    if (!isPlayerIdleState(state)) {
      throw new Error("Invalid Player View idle state.");
    }
    options.setLastPlayerProjection(state);
    const playerWindow = options.getPlayerWindow();
    if (!playerWindow || playerWindow.isDestroyed()) {
      options.setPlayerWindow(null);
      return false;
    }
    sendToPlayerWhenReady(playerWindow, state);
    return true;
  });

  ipcMain.handle("player:liveTableEvent", async (ipcEvent: IpcMainInvokeEvent, event: unknown) => {
    if (!isLiveTableEvent(event)) {
      throw new Error("Invalid live table event.");
    }

    const playerWindow = options.getPlayerWindow();
    const gmWindow = options.getGmWindow();
    const route = liveTableEventRoute(
      ipcEvent.sender.id,
      {
        exists: Boolean(playerWindow),
        destroyed: playerWindow?.isDestroyed() ?? true,
        webContentsId: playerWindow?.webContents.id
      },
      Boolean(gmWindow && !gmWindow.isDestroyed())
    );

    if (route === "gm") {
      gmWindow?.webContents.send("player:liveTableEvent", event);
      return true;
    }

    if (route === "player") {
      playerWindow?.webContents.send("player:liveTableEvent", event);
      return true;
    }

    return false;
  });

  ipcMain.handle("player:setFullscreen", async (_event, fullscreen: boolean) => {
    assertIpcBoolean(fullscreen, "Player View fullscreen setting");
    let playerWindow = options.getPlayerWindow();
    if (!playerWindow || playerWindow.isDestroyed()) {
      playerWindow = options.createPlayerWindow();
      options.setPlayerWindow(playerWindow);
    }
    playerWindow.setFullScreen(fullscreen);
    return playerWindow.isFullScreen();
  });

  ipcMain.handle("player:close", async () => {
    options.setLastPlayerProjection(null);
    const playerWindow = options.getPlayerWindow();
    if (!playerWindow || playerWindow.isDestroyed()) {
      options.setPlayerWindow(null);
      return false;
    }

    playerWindow.close();
    options.setPlayerWindow(null);
    return true;
  });

  ipcMain.handle("player:getLastState", async () => options.getLastPlayerProjection());
  ipcMain.handle("app:getDisplays", async () => options.getDisplays().map(summarizeDisplay));
}

function sendToPlayerWhenReady(playerWindow: BrowserWindow, payload: unknown): void {
  if (playerWindow.isDestroyed()) {
    return;
  }

  if (playerWindow.webContents.isLoading()) {
    playerWindow.webContents.once("did-finish-load", () => {
      if (!playerWindow.isDestroyed()) {
        playerWindow.webContents.send("player:state", payload);
      }
    });
    return;
  }

  playerWindow.webContents.send("player:state", payload);
}
