import { describe, expect, it } from "vitest";
import { getFogStartModePatch } from "../../src/renderer/components/layers/panel/layerPanelFog";

describe("layer panel fog helpers", () => {
  it("converts revealed fog mode into transparent GM and player fog", () => {
    expect(getFogStartModePatch("revealed")).toEqual({
      mode: "revealed",
      gmOpacity: 0,
      playerOpacity: 0,
      opacity: 0
    });
  });

  it("converts hidden fog mode into half-visible GM fog and opaque player fog", () => {
    expect(getFogStartModePatch("hidden")).toEqual({
      mode: "hidden",
      gmOpacity: 0.5,
      playerOpacity: 1,
      opacity: 1
    });
  });

  it("converts partial fog mode into half-visible GM and player fog", () => {
    expect(getFogStartModePatch("partial")).toEqual({
      mode: "partial",
      gmOpacity: 0.5,
      playerOpacity: 0.5,
      opacity: 0.5
    });
  });
});
