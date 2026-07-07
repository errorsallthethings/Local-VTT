import { describe, expect, it } from "vitest";
import {
  getBorderWidthForPreset,
  getBorderWidthPreset,
  getTokenBorderWidthPresetPatch,
  getTokenCustomBorderWidthPatch,
  getTokenCustomSizePatch,
  getTokenFootprintVisibilityPatch,
  getTokenSettingsPresentation,
  getTokenSizePresetPatch,
  getTokenSizeForPreset
} from "../../src/renderer/lib/tokens";
import type { Token } from "../../src/shared/localvtt";

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
    expect(getBorderWidthPreset(16)).toBe("thin");
    expect(getBorderWidthPreset(24)).toBe("medium");
    expect(getBorderWidthPreset(32)).toBe("thick");
    expect(getBorderWidthPreset(11)).toBe("custom");

    expect(getBorderWidthForPreset("thin", 11)).toBe(16);
    expect(getBorderWidthForPreset("medium", 11)).toBe(24);
    expect(getBorderWidthForPreset("thick", 11)).toBe(32);
    expect(getBorderWidthForPreset("custom", 11)).toBe(11);
  });

  it("derives token settings presentation with defaults and grid-relative custom size", () => {
    const token = tokenForSettings({
      size: { width: 150, height: 75 },
      sizePreset: "custom",
      borderWidth: 11,
      borderStyle: "glow",
      footprintVisible: false
    });

    expect(getTokenSettingsPresentation(token, 50, "square")).toMatchObject({
      sizePreset: "custom",
      borderColor: "#7aa2f7",
      borderWidth: 11,
      borderWidthPreset: "custom",
      borderStyle: "glow",
      glowColor: "#7aa2f7",
      customWidthCells: 3,
      customHeightCells: 1.5,
      customSizeDisabled: false,
      mask: "circle",
      footprintHidden: true
    });
    expect(getTokenSettingsPresentation(token, 50, "hex").customSizeDisabled).toBe(true);
  });

  it("builds token size preset and custom size patches", () => {
    const token = tokenForSettings({ size: { width: 80, height: 120 } });

    expect(getTokenSizePresetPatch("custom", 80, "square")).toEqual({ sizePreset: "custom" });
    expect(getTokenSizePresetPatch("large", 80, "square")).toEqual({
      sizePreset: "large",
      size: { width: 160, height: 160 }
    });
    expect(getTokenCustomSizePatch(token, 50, "width", 12)).toEqual({
      sizePreset: "custom",
      size: { width: 500, height: 120 }
    });
    expect(getTokenCustomSizePatch(token, 50, "height", 0)).toEqual({
      sizePreset: "custom",
      size: { width: 80, height: 12.5 }
    });
  });

  it("builds token border and footprint patches", () => {
    expect(getTokenBorderWidthPresetPatch("thin", 11)).toEqual({ borderWidthPreset: "thin", borderWidth: 16 });
    expect(getTokenBorderWidthPresetPatch("custom", 11)).toEqual({ borderWidthPreset: "custom", borderWidth: 11 });
    expect(getTokenCustomBorderWidthPatch(0)).toEqual({ borderWidth: 1 });
    expect(getTokenCustomBorderWidthPatch(99)).toEqual({ borderWidth: 64 });
    expect(getTokenFootprintVisibilityPatch(true)).toEqual({ footprintVisible: false });
    expect(getTokenFootprintVisibilityPatch(false)).toEqual({ footprintVisible: true });
  });
});

function tokenForSettings(patch: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Token",
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
    hidden: false,
    visibleInPlayer: true,
    ...patch
  };
}
