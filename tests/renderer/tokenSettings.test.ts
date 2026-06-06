import { describe, expect, it } from "vitest";
import {
  getBorderWidthForPreset,
  getBorderWidthPreset,
  getTokenSizeForPreset
} from "../../src/renderer/components/layers/TokenSettings";

describe("token settings helpers", () => {
  it("maps square-grid token size presets to cell multipliers", () => {
    expect(getTokenSizeForPreset("tiny", 100, "square")).toEqual({ width: 50, height: 50 });
    expect(getTokenSizeForPreset("medium", 100, "square")).toEqual({ width: 100, height: 100 });
    expect(getTokenSizeForPreset("large", 100, "square")).toEqual({ width: 200, height: 200 });
    expect(getTokenSizeForPreset("huge", 100, "square")).toEqual({ width: 300, height: 300 });
    expect(getTokenSizeForPreset("gargantuan", 100, "square")).toEqual({ width: 400, height: 400 });
  });

  it("keeps hex token art square while using compact visual sizing", () => {
    expect(getTokenSizeForPreset("tiny", 100, "hex")).toEqual({ width: 42, height: 42 });
    expect(getTokenSizeForPreset("medium", 100, "hex")).toEqual({ width: 72, height: 72 });
    expect(getTokenSizeForPreset("large", 100, "hex")).toEqual({ width: 144, height: 144 });
  });

  it("maps border width presets to stable pixel values", () => {
    expect(getBorderWidthPreset(3)).toBe("thin");
    expect(getBorderWidthPreset(5)).toBe("medium");
    expect(getBorderWidthPreset(8)).toBe("thick");
    expect(getBorderWidthPreset(11)).toBe("custom");

    expect(getBorderWidthForPreset("thin", 11)).toBe(3);
    expect(getBorderWidthForPreset("medium", 11)).toBe(5);
    expect(getBorderWidthForPreset("thick", 11)).toBe(8);
    expect(getBorderWidthForPreset("custom", 11)).toBe(11);
  });
});
