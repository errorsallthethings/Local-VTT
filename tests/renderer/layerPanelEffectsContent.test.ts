import { describe, expect, it } from "vitest";
import { getExpandedWeatherCategoryAfterToggle } from "../../src/renderer/components/layers/panel/EffectsLayerContent";

describe("effects layer content", () => {
  it("collapses the expanded weather category when that category is disabled", () => {
    expect(getExpandedWeatherCategoryAfterToggle("rain", "rain", false)).toBeNull();
    expect(getExpandedWeatherCategoryAfterToggle("rain", "rain", true)).toBe("rain");
    expect(getExpandedWeatherCategoryAfterToggle("rain", "fog", false)).toBe("rain");
    expect(getExpandedWeatherCategoryAfterToggle(null, "fog", false)).toBeNull();
  });
});
