import { describe, expect, it } from "vitest";
import { getMapLayerSectionMode } from "../../src/renderer/components/layers/panel/MapLayerSection";

describe("map layer section", () => {
  it("chooses closed, contents, and settings modes from expansion state", () => {
    expect(getMapLayerSectionMode(false, false)).toBe("closed");
    expect(getMapLayerSectionMode(true, false)).toBe("contents");
    expect(getMapLayerSectionMode(false, true)).toBe("settings");
    expect(getMapLayerSectionMode(true, true)).toBe("settings");
  });
});
