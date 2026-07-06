export type AppWindowHash = "gm" | "player";

export interface WindowDiagnosticsLogger {
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

export interface DiagnosticWebContents {
  on(event: "console-message", listener: (details: { level: string; lineNumber: number; message: string; sourceId: string }) => void): void;
  on(event: "did-fail-load", listener: (_event: unknown, errorCode: number, errorDescription: string, validatedURL: string, isMainFrame: boolean) => void): void;
  on(event: "render-process-gone", listener: (_event: unknown, details: { exitCode: number; reason: string }) => void): void;
}

export interface DiagnosticWindow {
  on(event: "responsive" | "unresponsive", listener: () => void): void;
  webContents: DiagnosticWebContents;
}

export interface InstallWindowDiagnosticsOptions {
  isDev: boolean;
  logger?: WindowDiagnosticsLogger;
}

export function installWindowDiagnostics(
  win: DiagnosticWindow,
  hash: AppWindowHash,
  { isDev, logger = console }: InstallWindowDiagnosticsOptions
): void {
  const label = hash === "gm" ? "GM" : "Player";

  win.webContents.on("render-process-gone", (_event, details) => {
    logger.error(`LOCALVTT_${label}_RENDER_PROCESS_GONE`, details.reason, details.exitCode);
  });

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame) {
      logger.error(`LOCALVTT_${label}_DID_FAIL_LOAD`, errorCode, errorDescription, validatedURL);
    }
  });

  win.webContents.on("console-message", (details) => {
    if (details.level === "warning" || details.level === "error") {
      if (isDev && details.message.includes("Electron Security Warning")) {
        return;
      }
      const log = details.level === "error" ? logger.error : logger.warn;
      log(`LOCALVTT_${label}_CONSOLE`, details.message, `${details.sourceId}:${details.lineNumber}`);
    }
  });

  win.on("unresponsive", () => {
    logger.warn(`LOCALVTT_${label}_WINDOW_UNRESPONSIVE`);
  });

  win.on("responsive", () => {
    logger.info(`LOCALVTT_${label}_WINDOW_RESPONSIVE`);
  });
}
