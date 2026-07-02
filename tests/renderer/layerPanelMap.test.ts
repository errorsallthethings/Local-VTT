import { describe, expect, it } from "vitest";
import { getManualMapScalePatch } from "../../src/renderer/components/layers/panel/layerPanelMap";

describe("layer panel map helpers", () => {
  it("updates map scale axes and marks the fit mode manual", () => {
    expect(getManualMapScalePatch(1.25)).toEqual({
      scale: 1.25,
      scaleX: 1.25,
      scaleY: 1.25,
      fitMode: "manual"
    });
  });
});
