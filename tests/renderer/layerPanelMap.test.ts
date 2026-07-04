import { describe, expect, it } from "vitest";
import {
  getManualMapRotationPatch,
  getManualMapScalePatch,
  getMapCellSizeAction,
  getMapFitHelpText,
  getMapFitModeAction,
  getMapGridDimensionAction,
  getResetMapTransformPatch
} from "../../src/renderer/components/layers/panel/layerPanelMap";
import { DEFAULT_MAP_TRANSFORM } from "../../src/shared/localvtt";

describe("layer panel map helpers", () => {
  it("updates map scale axes and marks the fit mode manual", () => {
    expect(getManualMapScalePatch(1.25)).toEqual({
      scale: 1.25,
      scaleX: 1.25,
      scaleY: 1.25,
      fitMode: "manual"
    });
  });

  it("routes cell size changes through actual-size fit when editing an image map", () => {
    expect(getMapCellSizeAction(72, "actual-size", { mediaType: "image" })).toEqual({
      type: "apply-fit-preset",
      fitMode: "actual-size",
      gridPatch: { sizePx: 72 }
    });
    expect(getMapCellSizeAction(72, "actual-size", { mediaType: "video" })).toEqual({
      type: "update-grid",
      gridPatch: { sizePx: 72 }
    });
    expect(getMapCellSizeAction(72, "manual", { mediaType: "image" })).toEqual({
      type: "update-grid",
      gridPatch: { sizePx: 72 }
    });
  });

  it("routes map grid dimensions through cover fit mode and clamps dimensions", () => {
    expect(getMapGridDimensionAction("mapGridColumns", 0, "manual")).toEqual({
      type: "update-grid",
      gridPatch: { mapGridColumns: 1 }
    });
    expect(getMapGridDimensionAction("mapGridRows", 12, "cover")).toEqual({
      type: "apply-fit-preset",
      fitMode: "cover",
      gridPatch: { mapGridRows: 12 }
    });
  });

  it("routes fit mode selection to map transform or fit preset actions", () => {
    expect(getMapFitModeAction("manual")).toEqual({
      type: "update-map-transform",
      mapTransformPatch: { fitMode: "manual" }
    });
    expect(getMapFitModeAction("contain")).toEqual({
      type: "apply-fit-preset",
      fitMode: "contain"
    });
  });

  it("builds manual rotation and reset transform patches", () => {
    expect(getManualMapRotationPatch(45)).toEqual({ rotation: 45, fitMode: "manual" });
    expect(getResetMapTransformPatch()).toEqual(DEFAULT_MAP_TRANSFORM);
    expect(getResetMapTransformPatch()).not.toBe(DEFAULT_MAP_TRANSFORM);
  });

  it("provides map fit help text as reusable copy", () => {
    expect(getMapFitHelpText()).toHaveLength(3);
    expect(getMapFitHelpText()[0]).toContain("Fit Whole Map");
  });
});
