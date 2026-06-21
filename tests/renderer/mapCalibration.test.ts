import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import { applyMapCalibrationDraft, getMapCalibrationDraftFromScene, type MapCalibrationDraft } from "../../src/renderer/lib/map";

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
});
