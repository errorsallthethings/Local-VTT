import type { BrowserWindow } from "electron";
import type { Campaign } from "../src/shared/localvtt.js";
import { createSmokeTestScript, getSmokeTestTimeoutMs } from "./smokeTestPlan.js";
import type { VisualSmokeTestOptions } from "./visualSmokeTest.js";

export interface SmokeTestApp {
  exit(code: number): void;
}

export interface SmokeTestLogger {
  error: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
}

export interface RunSmokeTestOptions {
  app: SmokeTestApp;
  getPlayerWindow: VisualSmokeTestOptions["getPlayerWindow"];
  isVisualSmokeTest: boolean;
  registerAssetPaths: (campaign: Campaign) => void;
  win: BrowserWindow;
  clearTimeoutFn?: (timeoutId: ReturnType<typeof setTimeout>) => void;
  logger?: SmokeTestLogger;
  queueMicrotaskFn?: (callback: () => void) => void;
  runVisualSmokeTest?: (win: BrowserWindow, options: VisualSmokeTestOptions) => Promise<unknown>;
  setTimeoutFn?: (callback: () => void, timeoutMs: number) => ReturnType<typeof setTimeout>;
}

export function runSmokeTest({
  app,
  getPlayerWindow,
  isVisualSmokeTest,
  registerAssetPaths,
  win,
  clearTimeoutFn = clearTimeout,
  logger = console,
  queueMicrotaskFn = queueMicrotask,
  runVisualSmokeTest,
  setTimeoutFn = setTimeout
}: RunSmokeTestOptions): void {
  let completed = false;
  const timeout = setTimeoutFn(() => {
    if (completed) {
      return;
    }
    completed = true;
    logger.error("LOCALVTT_SMOKE_ERROR GM window did not finish loading in time.");
    app.exit(1);
  }, getSmokeTestTimeoutMs(isVisualSmokeTest));

  const finish = () => {
    if (completed) {
      return;
    }
    completed = true;
    void win.webContents
      .executeJavaScript(createSmokeTestScript())
      .then(async (result: unknown) => {
        if (isVisualSmokeTest) {
          const visualSmokeRunner = runVisualSmokeTest ?? (await import("./visualSmokeTest.js")).runVisualSmokeTest;
          return {
            ...(result as Record<string, unknown>),
            visualSmoke: await visualSmokeRunner(win, {
              getPlayerWindow,
              registerAssetPaths
            })
          };
        }
        return result;
      })
      .then((result: unknown) => {
        clearTimeoutFn(timeout);
        logger.log(`LOCALVTT_SMOKE_RESULT ${JSON.stringify(result)}`);
        app.exit(0);
      })
      .catch((caught: unknown) => {
        clearTimeoutFn(timeout);
        logger.error("LOCALVTT_SMOKE_ERROR", caught);
        app.exit(1);
      });
  };

  win.webContents.once("did-fail-load", (_event, errorCode, errorDescription) => {
    if (completed) {
      return;
    }
    completed = true;
    clearTimeoutFn(timeout);
    logger.error(`LOCALVTT_SMOKE_ERROR GM window failed to load: ${errorCode} ${errorDescription}`);
    app.exit(1);
  });

  if (win.webContents.isLoading()) {
    win.webContents.once("did-finish-load", finish);
  } else {
    queueMicrotaskFn(finish);
  }
}
