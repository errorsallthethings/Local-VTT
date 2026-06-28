import { describe, expect, it } from "vitest";
import { getMissingAssetsWarningItems, MISSING_ASSETS_WARNING_MESSAGE } from "../../src/renderer/lib/assets/assetRecovery";

describe("asset recovery copy", () => {
  it("keeps the missing asset warning actionable", () => {
    expect(MISSING_ASSETS_WARNING_MESSAGE).toContain("Re-import missing files or restore them from a backup");
  });

  it("dedupes and filters missing asset paths before display", () => {
    expect(getMissingAssetsWarningItems(["assets/maps/map.png", "", "assets/maps/map.png", "assets/tokens/hero.png"])).toEqual([
      "assets/maps/map.png",
      "assets/tokens/hero.png"
    ]);
  });
});
