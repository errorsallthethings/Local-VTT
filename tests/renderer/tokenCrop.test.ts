import { describe, expect, it } from "vitest";
import { clampTokenCropOffset, getTokenCropLayout, getTokenCropSourceRect } from "../../src/renderer/lib/tokens";

describe("token crop helpers", () => {
  it("fits the shorter image edge to the square preview by default", () => {
    expect(getTokenCropLayout({ naturalWidth: 800, naturalHeight: 400, previewSize: 280, zoom: 1, offset: { x: 0, y: 0 } })).toMatchObject({
      scale: 0.7,
      displayWidth: 560,
      displayHeight: 280,
      left: -140,
      top: 0
    });
  });

  it("clamps pan offsets so the crop square stays covered", () => {
    expect(clampTokenCropOffset({ naturalWidth: 800, naturalHeight: 400, previewSize: 280, zoom: 1, offset: { x: 500, y: 50 } })).toEqual({
      x: 140,
      y: 0
    });
  });

  it("calculates the source crop rectangle from pan and zoom", () => {
    expect(getTokenCropSourceRect({ naturalWidth: 800, naturalHeight: 400, previewSize: 280, zoom: 1, offset: { x: 140, y: 0 } })).toEqual({
      x: 0,
      y: 0,
      size: 400
    });
  });
});
