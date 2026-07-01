import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import { applyMapCalibrationDraft, applyMapGridFit, buildWholeMapFitScene, getMapCalibrationDraftFromScene, getMapGridFitPreview, type MapCalibrationDraft } from "../../src/renderer/lib/map";

function draft(patch: Partial<MapCalibrationDraft> = {}): MapCalibrationDraft {
  return {
    fitMode: "contain",
    mapGridColumns: 10,
    mapGridRows: 8,
    alignGridToMap: false,
    boxColumns: 1,
    boxRows: 1,
    ...patch
  };
}

describe("map calibration helpers", () => {
  it("creates a draft from the current scene", () => {
    const scene = {
      ...createDefaultScene("Scene"),
      grid: { ...createDefaultScene("Scene").grid, mapGridColumns: 22, mapGridRows: 17 },
      mapTransform: { ...createDefaultScene("Scene").mapTransform, fitMode: "cover" as const }
    };

    expect(getMapCalibrationDraftFromScene(scene, true)).toMatchObject({
      fitMode: "cover",
      mapGridColumns: 22,
      mapGridRows: 17,
      alignGridToMap: true
    });
  });

  it("applies box calibration as manual map fit", () => {
    const scene = applyMapCalibrationDraft(
      createDefaultScene("Scene"),
      draft({ boxColumns: 2, boxRows: 2 }),
      { calibrationBox: { x: 5, y: 7, width: 100, height: 100 } },
      "now"
    );

    expect(scene.grid).toMatchObject({ mapGridColumns: 10, mapGridRows: 8, sizePx: 50, offsetX: 5, offsetY: 7 });
    expect(scene.mapTransform.fitMode).toBe("manual");
    expect(scene.updatedAt).toBe("now");
  });

  it("aligns grid to map dimensions when image dimensions are provided", () => {
    const scene = applyMapCalibrationDraft(
      createDefaultScene("Scene"),
      draft({ alignGridToMap: true, mapGridColumns: 20, mapGridRows: 10 }),
      { imageDimensions: { width: 1000, height: 400 } },
      "now"
    );

    expect(scene.grid).toMatchObject({ mapGridColumns: 20, mapGridRows: 10, sizePx: 45, offsetX: 0, offsetY: 0 });
    expect(scene.mapTransform.fitMode).toBe("manual");
  });

  it("applies grid count and fit mode when no box or image alignment is used", () => {
    const scene = applyMapCalibrationDraft(createDefaultScene("Scene"), draft({ fitMode: "cover", mapGridColumns: 12, mapGridRows: 6 }), {}, "now");

    expect(scene.grid).toMatchObject({ mapGridColumns: 12, mapGridRows: 6 });
    expect(scene.mapTransform.fitMode).toBe("cover");
  });

  it("fits a whole map inside the grid footprint", () => {
    const scene = createDefaultScene("Scene");
    scene.grid = { ...scene.grid, sizePx: 100 };
    const preview = getMapGridFitPreview(scene, { mapGridColumns: 50, mapGridRows: 16, fitMode: "contain" }, { width: 5000, height: 3000 });
    const fitted = applyMapGridFit(scene, { mapGridColumns: 50, mapGridRows: 16, fitMode: "contain" }, { width: 5000, height: 3000 }, "now");

    expect(preview).toMatchObject({ targetWidth: 5000, targetHeight: 1600, scale: 0.5333333333333333, emptyWidth: 2333.3333333333335, emptyHeight: 0 });
    expect(fitted.grid).toMatchObject({ mapGridColumns: 50, mapGridRows: 16 });
    expect(fitted.mapTransform).toMatchObject({ fitMode: "contain", x: 1166.67, y: 0, scale: 0.5333, scaleX: 0.5333, scaleY: 0.5333 });
    expect(fitted.updatedAt).toBe("now");
  });

  it("fills the grid footprint and allows cropping", () => {
    const scene = createDefaultScene("Scene");
    scene.grid = { ...scene.grid, sizePx: 100 };
    const preview = getMapGridFitPreview(scene, { mapGridColumns: 50, mapGridRows: 16, fitMode: "cover" }, { width: 5000, height: 3000 });
    const fitted = applyMapGridFit(scene, { mapGridColumns: 50, mapGridRows: 16, fitMode: "cover" }, { width: 5000, height: 3000 }, "now");

    expect(preview).toMatchObject({ targetWidth: 5000, targetHeight: 1600, scaleX: 1, scaleY: 0.5333333333333333 });
    expect(fitted.mapTransform).toMatchObject({ fitMode: "cover", x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 0.5333 });
  });

  it("fits maps relative to the current grid origin", () => {
    const scene = createDefaultScene("Scene");
    scene.grid = { ...scene.grid, sizePx: 100, offsetX: 12, offsetY: 34 };
    const fitted = applyMapGridFit(scene, { mapGridColumns: 50, mapGridRows: 16, fitMode: "cover" }, { width: 5000, height: 3000 }, "now");

    expect(fitted.mapTransform).toMatchObject({ fitMode: "cover", x: 12, y: 34, scale: 1, scaleX: 1, scaleY: 0.5333 });
  });

  it("fits a whole map to the player target while preserving image aspect ratio", () => {
    const scene = createDefaultScene("Scene");
    scene.grid = { ...scene.grid, sizePx: 100, mapGridColumns: 44, mapGridRows: 25 };

    const fitted = buildWholeMapFitScene(scene, { mapGridColumns: 44, mapGridRows: 25 }, { width: 5000, height: 1600 }, { width: 2560, height: 1440 }, "now");

    expect(fitted.grid).toMatchObject({
      mapGridColumns: 50,
      mapGridRows: 16,
      sizePx: 51.2,
      offsetX: 0,
      offsetY: 310.4,
      showOnGm: true,
      showOnPlayer: true
    });
    expect(fitted.mapTransform).toMatchObject({ fitMode: "contain", x: 0, y: 310.4, scale: 0.512, scaleX: 0.512, scaleY: 0.512 });
    expect(fitted.updatedAt).toBe("now");
  });

  it("adjusts supplied grid dimensions by the smallest aspect correction when cells are not cleanly inferred", () => {
    const scene = createDefaultScene("Scene");
    scene.grid = { ...scene.grid, sizePx: 96, mapGridColumns: 44, mapGridRows: 25 };

    const fitted = buildWholeMapFitScene(scene, { mapGridColumns: 44, mapGridRows: 25 }, { width: 5000, height: 1600 }, { width: 2560, height: 1440 }, "now");

    expect(fitted.grid.mapGridColumns).toBe(44);
    expect(fitted.grid.mapGridRows).toBe(14);
  });
});
