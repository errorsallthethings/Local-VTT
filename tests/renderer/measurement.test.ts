import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import {
  formatMeasurementDistance,
  getMeasurementDistance,
  getRulerGridHighlightCells,
  getStraightLineMeasurementDistance
} from "../../src/renderer/canvas/measurement";

describe("measurement helpers", () => {
  it("measures euclidean distance using scene grid units", () => {
    const scene = createDefaultScene("Measure");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "euclidean" };

    expect(getMeasurementDistance({ x: 0, y: 0 }, { x: 300, y: 400 }, scene.grid)).toBe(25);
  });

  it("supports grid, manhattan, and 5-10 diagonal distance modes", () => {
    const scene = createDefaultScene("Measure");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "grid" };
    expect(getMeasurementDistance({ x: 0, y: 0 }, { x: 300, y: 400 }, scene.grid)).toBe(20);

    scene.grid.measurement.distanceMode = "manhattan";
    expect(getMeasurementDistance({ x: 0, y: 0 }, { x: 300, y: 400 }, scene.grid)).toBe(35);

    scene.grid.measurement.distanceMode = "diagonal-5-10";
    expect(getMeasurementDistance({ x: 0, y: 0 }, { x: 300, y: 400 }, scene.grid)).toBe(25);
  });

  it("uses pixels for gridless scenes", () => {
    const scene = createDefaultScene("Gridless");
    scene.grid.type = "gridless";

    expect(getMeasurementDistance({ x: 0, y: 0 }, { x: 30, y: 40 }, scene.grid)).toBe(50);
  });

  it("reports straight-line distance separately from selected grid distance mode", () => {
    const scene = createDefaultScene("Measure");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "manhattan" };

    expect(getMeasurementDistance({ x: 0, y: 0 }, { x: 300, y: 400 }, scene.grid)).toBe(35);
    expect(getStraightLineMeasurementDistance({ x: 0, y: 0 }, { x: 300, y: 400 }, scene.grid)).toBe(25);
  });

  it("finds square cells crossed by a ruler line", () => {
    const scene = createDefaultScene("Measure");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;

    expect(getRulerGridHighlightCells({ start: { x: 10, y: 10 }, current: { x: 240, y: 10 } }, scene.grid)).toEqual([
      { x: 50, y: 50 },
      { x: 150, y: 50 },
      { x: 250, y: 50 }
    ]);
  });

  it("finds diagonal square cells without sampling into neighboring cells", () => {
    const scene = createDefaultScene("Measure");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;

    expect(getRulerGridHighlightCells({ start: { x: 10, y: 10 }, current: { x: 290, y: 290 } }, scene.grid)).toEqual([
      { x: 50, y: 50 },
      { x: 150, y: 150 },
      { x: 250, y: 250 }
    ]);
  });

  it("finds hex cells crossed by a ruler line", () => {
    const scene = createDefaultScene("Measure");
    scene.grid.type = "hex";
    scene.grid.sizePx = 100;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;
    const hexWidth = Math.sqrt(3) * 50;

    expect(getRulerGridHighlightCells({ start: { x: 0, y: 0 }, current: { x: hexWidth * 2, y: 0 } }, scene.grid)).toEqual([
      { x: 0, y: 0 },
      { x: hexWidth, y: 0 },
      { x: hexWidth * 2, y: 0 }
    ]);
  });

  it("formats grid and gridless distances", () => {
    const scene = createDefaultScene("Measure");

    expect(formatMeasurementDistance(5, scene.grid.measurement, "square")).toBe("5 feet");
    expect(formatMeasurementDistance(1, { ...scene.grid.measurement, unit: "meters" }, "square")).toBe("1 meter");
    expect(formatMeasurementDistance(42.4, scene.grid.measurement, "gridless")).toBe("42 px");
  });
});
