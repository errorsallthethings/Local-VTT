import { describe, expect, it, vi } from "vitest";
import {
  closeGmWindowAfterPausing,
  getGmCloseRequestAction,
  getUnsavedChangesDialogAction
} from "../../electron/gmWindowClose";

describe("GM window close decisions", () => {
  it("allows the close event when the GM window is already force-closing", () => {
    expect(getGmCloseRequestAction(true, true)).toBe("allow-close");
    expect(getGmCloseRequestAction(true, false)).toBe("allow-close");
  });

  it("closes after pausing when there are no unsaved changes", () => {
    expect(getGmCloseRequestAction(false, false)).toBe("close-after-pausing");
  });

  it("prompts when the GM window has unsaved changes", () => {
    expect(getGmCloseRequestAction(false, true)).toBe("prompt-unsaved");
  });

  it("maps unsaved changes dialog buttons to close actions", () => {
    expect(getUnsavedChangesDialogAction(0)).toBe("cancel");
    expect(getUnsavedChangesDialogAction(1)).toBe("save-before-close");
    expect(getUnsavedChangesDialogAction(2)).toBe("close-after-pausing");
  });

  it("treats unexpected dialog choices as cancel", () => {
    expect(getUnsavedChangesDialogAction(-1)).toBe("cancel");
    expect(getUnsavedChangesDialogAction(99)).toBe("cancel");
  });

  it("pauses active turn orders before closing the GM window", async () => {
    const win = { close: vi.fn() };
    const setForceCloseGmWindow = vi.fn();
    const setGmHasUnsavedChanges = vi.fn();
    const pauseActiveTurnOrders = vi.fn().mockResolvedValue(undefined);

    await closeGmWindowAfterPausing({
      currentCampaignPath: "campaign-root",
      pauseActiveTurnOrders,
      setForceCloseGmWindow,
      setGmHasUnsavedChanges,
      win
    });

    expect(pauseActiveTurnOrders).toHaveBeenCalledWith("campaign-root");
    expect(setForceCloseGmWindow).toHaveBeenCalledWith(true);
    expect(setGmHasUnsavedChanges).toHaveBeenCalledWith(false);
    expect(win.close).toHaveBeenCalledOnce();
  });

  it("still closes the GM window when turn-order pause fails", async () => {
    const caught = new Error("pause failed");
    const logger = { error: vi.fn() };
    const win = { close: vi.fn() };

    await closeGmWindowAfterPausing({
      currentCampaignPath: "campaign-root",
      logger,
      pauseActiveTurnOrders: vi.fn().mockRejectedValue(caught),
      setForceCloseGmWindow: vi.fn(),
      setGmHasUnsavedChanges: vi.fn(),
      win
    });

    expect(logger.error).toHaveBeenCalledWith("Could not pause turn orders before closing.", caught);
    expect(win.close).toHaveBeenCalledOnce();
  });

  it("closes without pausing when no campaign is active", async () => {
    const pauseActiveTurnOrders = vi.fn();
    const win = { close: vi.fn() };

    await closeGmWindowAfterPausing({
      currentCampaignPath: null,
      pauseActiveTurnOrders,
      setForceCloseGmWindow: vi.fn(),
      setGmHasUnsavedChanges: vi.fn(),
      win
    });

    expect(pauseActiveTurnOrders).not.toHaveBeenCalled();
    expect(win.close).toHaveBeenCalledOnce();
  });
});
