import { describe, expect, it } from "vitest";
import { getGmCloseRequestAction, getUnsavedChangesDialogAction } from "../../electron/gmWindowClose";

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
});
