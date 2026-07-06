import { describe, expect, it, vi } from "vitest";
import { installWindowDiagnostics, type DiagnosticWindow } from "../../electron/windowDiagnostics";

function createDiagnosticWindow() {
  const windowListeners = new Map<string, (...args: unknown[]) => void>();
  const webContentsListeners = new Map<string, (...args: unknown[]) => void>();
  const win = {
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      windowListeners.set(event, listener);
    }),
    webContents: {
      on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
        webContentsListeners.set(event, listener);
      })
    }
  } as unknown as DiagnosticWindow;

  return {
    emitWindow: (event: string) => windowListeners.get(event)?.(),
    emitWebContents: (event: string, ...args: unknown[]) => webContentsListeners.get(event)?.(...args),
    webContentsListeners,
    win,
    windowListeners
  };
}

function logger() {
  return {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  };
}

describe("window diagnostics", () => {
  it("installs expected window and webContents listeners", () => {
    const diagnostics = createDiagnosticWindow();

    installWindowDiagnostics(diagnostics.win, "gm", { isDev: false, logger: logger() });

    expect(diagnostics.win.webContents.on).toHaveBeenCalledWith("render-process-gone", expect.any(Function));
    expect(diagnostics.win.webContents.on).toHaveBeenCalledWith("did-fail-load", expect.any(Function));
    expect(diagnostics.win.webContents.on).toHaveBeenCalledWith("console-message", expect.any(Function));
    expect(diagnostics.win.on).toHaveBeenCalledWith("unresponsive", expect.any(Function));
    expect(diagnostics.win.on).toHaveBeenCalledWith("responsive", expect.any(Function));
  });

  it("logs render process failures", () => {
    const diagnostics = createDiagnosticWindow();
    const log = logger();
    installWindowDiagnostics(diagnostics.win, "player", { isDev: false, logger: log });

    diagnostics.emitWebContents("render-process-gone", {}, { reason: "crashed", exitCode: 1 });

    expect(log.error).toHaveBeenCalledWith("LOCALVTT_Player_RENDER_PROCESS_GONE", "crashed", 1);
  });

  it("logs only main-frame load failures", () => {
    const diagnostics = createDiagnosticWindow();
    const log = logger();
    installWindowDiagnostics(diagnostics.win, "gm", { isDev: false, logger: log });

    diagnostics.emitWebContents("did-fail-load", {}, -105, "ERR_NAME_NOT_RESOLVED", "http://127.0.0.1", false);
    diagnostics.emitWebContents("did-fail-load", {}, -105, "ERR_NAME_NOT_RESOLVED", "http://127.0.0.1", true);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith("LOCALVTT_GM_DID_FAIL_LOAD", -105, "ERR_NAME_NOT_RESOLVED", "http://127.0.0.1");
  });

  it("logs renderer console warnings and errors", () => {
    const diagnostics = createDiagnosticWindow();
    const log = logger();
    installWindowDiagnostics(diagnostics.win, "gm", { isDev: false, logger: log });

    diagnostics.emitWebContents("console-message", { level: "warning", message: "careful", sourceId: "app.js", lineNumber: 10 });
    diagnostics.emitWebContents("console-message", { level: "error", message: "broken", sourceId: "app.js", lineNumber: 11 });

    expect(log.warn).toHaveBeenCalledWith("LOCALVTT_GM_CONSOLE", "careful", "app.js:10");
    expect(log.error).toHaveBeenCalledWith("LOCALVTT_GM_CONSOLE", "broken", "app.js:11");
  });

  it("ignores Electron security warnings during development", () => {
    const diagnostics = createDiagnosticWindow();
    const log = logger();
    installWindowDiagnostics(diagnostics.win, "gm", { isDev: true, logger: log });

    diagnostics.emitWebContents("console-message", {
      level: "warning",
      message: "Electron Security Warning: test warning",
      sourceId: "electron",
      lineNumber: 1
    });

    expect(log.warn).not.toHaveBeenCalled();
  });

  it("logs window responsiveness changes", () => {
    const diagnostics = createDiagnosticWindow();
    const log = logger();
    installWindowDiagnostics(diagnostics.win, "player", { isDev: false, logger: log });

    diagnostics.emitWindow("unresponsive");
    diagnostics.emitWindow("responsive");

    expect(log.warn).toHaveBeenCalledWith("LOCALVTT_Player_WINDOW_UNRESPONSIVE");
    expect(log.info).toHaveBeenCalledWith("LOCALVTT_Player_WINDOW_RESPONSIVE");
  });
});
