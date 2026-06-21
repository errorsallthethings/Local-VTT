import { describe, expect, it } from "vitest";
import { formatSaveStatus } from "../../src/renderer/lib/workspace";

describe("workspace status", () => {
  it("formats a clean idle workspace as saved", () => {
    expect(formatSaveStatus({ dirtySceneCount: 0, campaignDirty: false, saveState: "idle" })).toBe("Saved");
  });

  it("formats clean non-idle save states", () => {
    expect(formatSaveStatus({ dirtySceneCount: 0, campaignDirty: false, saveState: "saving" })).toBe("Saving");
    expect(formatSaveStatus({ dirtySceneCount: 0, campaignDirty: false, saveState: "error" })).toBe("Error");
  });

  it("prioritizes unsaved scene and campaign details over clean save state", () => {
    expect(formatSaveStatus({ dirtySceneCount: 2, campaignDirty: true, saveState: "saved" })).toBe("Unsaved scenes: 2 | Unsaved campaign changes");
    expect(formatSaveStatus({ dirtySceneCount: 1, campaignDirty: false, saveState: "saved" })).toBe("Unsaved scenes: 1");
    expect(formatSaveStatus({ dirtySceneCount: 0, campaignDirty: true, saveState: "saved" })).toBe("Unsaved campaign changes");
  });
});
