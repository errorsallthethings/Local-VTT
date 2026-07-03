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
