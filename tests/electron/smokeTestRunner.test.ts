import type { BrowserWindow } from "electron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runSmokeTest, type SmokeTestApp, type SmokeTestLogger } from "../../electron/smokeTestRunner";

type SmokeTestListener = (...args: unknown[]) => void;

function createSmokeWindow(options: { isLoading?: boolean; scriptResult?: unknown; scriptError?: unknown } = {}) {
  const listeners = new Map<string, SmokeTestListener>();
  const executeJavaScript = options.scriptError
    ? vi.fn().mockRejectedValue(options.scriptError)
    : vi.fn().mockResolvedValue(options.scriptResult ?? { ok: true });
  const win = {
    webContents: {
      executeJavaScript,
      isLoading: vi.fn(() => options.isLoading ?? false),
      once: vi.fn((event: string, listener: SmokeTestListener) => {
        listeners.set(event, listener);
      })
    }
  } as unknown as BrowserWindow;

  return { executeJavaScript, listeners, win };
}

async function flushAsyncSmokeWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe("smoke test runner", () => {
  let app: SmokeTestApp;
  let clearTimeoutFn: ReturnType<typeof vi.fn>;
  let logger: SmokeTestLogger;
  let setTimeoutCallback: (() => void) | undefined;
  let setTimeoutFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    app = { exit: vi.fn() };
    clearTimeoutFn = vi.fn();
    logger = { error: vi.fn(), log: vi.fn() };
    setTimeoutCallback = undefined;
    setTimeoutFn = vi.fn((callback: () => void) => {
      setTimeoutCallback = callback;
      return 123 as unknown as ReturnType<typeof setTimeout>;
    });
  });

  it("executes the preload smoke script once the GM window is ready", async () => {
    const { executeJavaScript, win } = createSmokeWindow({ scriptResult: { hasPreloadBridge: true } });

    runSmokeTest({
      app,
      clearTimeoutFn,
      getPlayerWindow: () => null,
      isVisualSmokeTest: false,
      logger,
      queueMicrotaskFn: (callback) => callback(),
      registerAssetPaths: vi.fn(),
      setTimeoutFn,
      win
    });
    await flushAsyncSmokeWork();

    expect(executeJavaScript).toHaveBeenCalledWith(expect.stringContaining("window.localVtt"));
    expect(clearTimeoutFn).toHaveBeenCalledWith(123);
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("LOCALVTT_SMOKE_RESULT"));
    expect(app.exit).toHaveBeenCalledWith(0);
  });

  it("waits for did-finish-load when the GM window is still loading", async () => {
    const { executeJavaScript, listeners, win } = createSmokeWindow({ isLoading: true });

    runSmokeTest({
      app,
      clearTimeoutFn,
      getPlayerWindow: () => null,
      isVisualSmokeTest: false,
      logger,
      registerAssetPaths: vi.fn(),
      setTimeoutFn,
      win
    });

    expect(executeJavaScript).not.toHaveBeenCalled();
    listeners.get("did-finish-load")?.();
    await flushAsyncSmokeWork();

    expect(executeJavaScript).toHaveBeenCalledTimes(1);
    expect(app.exit).toHaveBeenCalledWith(0);
  });

  it("fails fast when the GM window cannot load", () => {
    const { executeJavaScript, listeners, win } = createSmokeWindow({ isLoading: true });

    runSmokeTest({
      app,
      clearTimeoutFn,
      getPlayerWindow: () => null,
      isVisualSmokeTest: false,
      logger,
      registerAssetPaths: vi.fn(),
      setTimeoutFn,
      win
    });
    listeners.get("did-fail-load")?.({}, -105, "ERR_NAME_NOT_RESOLVED");

    expect(executeJavaScript).not.toHaveBeenCalled();
    expect(clearTimeoutFn).toHaveBeenCalledWith(123);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("ERR_NAME_NOT_RESOLVED"));
    expect(app.exit).toHaveBeenCalledWith(1);
  });

  it("exits with an error when the GM window load times out", () => {
    const { win } = createSmokeWindow({ isLoading: true });

    runSmokeTest({
      app,
      clearTimeoutFn,
      getPlayerWindow: () => null,
      isVisualSmokeTest: false,
      logger,
      registerAssetPaths: vi.fn(),
      setTimeoutFn,
      win
    });
    setTimeoutCallback?.();

    expect(logger.error).toHaveBeenCalledWith("LOCALVTT_SMOKE_ERROR GM window did not finish loading in time.");
    expect(app.exit).toHaveBeenCalledWith(1);
  });

  it("delegates to the visual smoke runner when visual smoke is enabled", async () => {
    const { win } = createSmokeWindow({ scriptResult: { hasPreloadBridge: true } });
    const getPlayerWindow = vi.fn(() => null);
    const registerAssetPaths = vi.fn();
    const runVisualSmokeTest = vi.fn().mockResolvedValue({ sceneCanvas: { ok: true } });

    runSmokeTest({
      app,
      clearTimeoutFn,
      getPlayerWindow,
      isVisualSmokeTest: true,
      logger,
      queueMicrotaskFn: (callback) => callback(),
      registerAssetPaths,
      runVisualSmokeTest,
      setTimeoutFn,
      win
    });
    await flushAsyncSmokeWork();

    expect(runVisualSmokeTest).toHaveBeenCalledWith(win, { getPlayerWindow, registerAssetPaths });
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("\"visualSmoke\""));
    expect(app.exit).toHaveBeenCalledWith(0);
  });
});
