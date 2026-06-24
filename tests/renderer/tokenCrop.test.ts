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

  it("calculates centered and panned source crops for portrait images", () => {
    expect(getTokenCropLayout({ naturalWidth: 400, naturalHeight: 800, previewSize: 280, zoom: 1, offset: { x: 0, y: 0 } })).toMatchObject({
      scale: 0.7,
      displayWidth: 280,
      displayHeight: 560,
      left: 0,
      top: -140
    });
    expect(getTokenCropSourceRect({ naturalWidth: 400, naturalHeight: 800, previewSize: 280, zoom: 1, offset: { x: 0, y: 140 } })).toEqual({
      x: 0,
      y: 0,
      size: 400
    });
  });

  it("uses zoomed preview size when calculating non-square source crops", () => {
    expect(getTokenCropSourceRect({ naturalWidth: 800, naturalHeight: 400, previewSize: 280, zoom: 2, offset: { x: 0, y: 0 } })).toEqual({
      x: 300,
      y: 100,
      size: 200
    });
    expect(getTokenCropSourceRect({ naturalWidth: 400, naturalHeight: 800, previewSize: 280, zoom: 2, offset: { x: 0, y: 0 } })).toEqual({
      x: 100,
      y: 300,
      size: 200
    });
  });

  it("clamps submitted source crops to the image bounds", () => {
    expect(getTokenCropSourceRect({ naturalWidth: 800, naturalHeight: 400, previewSize: 280, zoom: 1, offset: { x: 999, y: 999 } })).toEqual({
      x: 0,
      y: 0,
      size: 400
    });
    expect(getTokenCropSourceRect({ naturalWidth: 400, naturalHeight: 800, previewSize: 280, zoom: 1, offset: { x: -999, y: -999 } })).toEqual({
      x: 0,
      y: 400,
      size: 400
    });
  });
});
