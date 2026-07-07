import { describe, expect, it } from "vitest";
import { getAssetPruneConfirmCopy } from "../../src/renderer/views/GmMaintenanceDialogs";

describe("GM maintenance dialogs", () => {
  it("formats singular and plural prune confirmation copy", () => {
    expect(getAssetPruneConfirmCopy(1).summary).toContain("1 unreferenced asset");
    expect(getAssetPruneConfirmCopy(2).summary).toContain("2 unreferenced assets");
    expect(getAssetPruneConfirmCopy(0).retention).toContain("Referenced maps, tokens, player portraits");
  });
});
