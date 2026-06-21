import { describe, expect, it } from "vitest";
import {
  getBoxCalibrationGridPatch,
  getCompletedMapCalibrationBox,
  getMapCalibrationBoxHit,
  getMapCalibrationDragFromPoint,
  getSquareCalibrationBox,
  getUpdatedMapCalibrationDrag,
  getVisibleMapCalibrationBox,
  type MapCalibrationBox,
  type MapCalibrationDrag
} from "../../src/renderer/canvas/map/mapCalibrationGeometry";

describe("map calibration geometry", () => {
  it("builds a square box from any drag direction", () => {
    expect(getSquareCalibrationBox({ x: 10, y: 20 }, { x: 35, y: 30 })).toEqual({
      x: 10,
      y: 20,
      width: 25,
      height: 25
    });
    expect(getSquareCalibrationBox({ x: 10, y: 20 }, { x: -10, y: -40 })).toEqual({
      x: -50,
      y: -40,
      width: 60,
      height: 60
    });
  });

  it("uses fallback when there is no active drag", () => {
    const fallback: MapCalibrationBox = { x: 1, y: 2, width: 3, height: 4 };

    expect(getVisibleMapCalibrationBox(null, fallback)).toBe(fallback);
  });

  it("moves an existing calibration box using the pointer offset", () => {
    const drag: MapCalibrationDrag = {
      pointerId: 1,
      mode: "move",
      start: { x: 20, y: 20 },
      current: { x: 80, y: 90 },
      box: { x: 10, y: 15, width: 50, height: 50 },
      offset: { x: 10, y: 5 }
    };

    expect(getVisibleMapCalibrationBox(drag, null)).toEqual({
      x: 70,
      y: 85,
      width: 50,
      height: 50
    });
  });

  it("falls back to drawing a square for draw and resize drags", () => {
    const drag: MapCalibrationDrag = {
      pointerId: 1,
      mode: "resize",
      start: { x: 10, y: 10 },
      current: { x: 30, y: 15 }
    };

    expect(getVisibleMapCalibrationBox(drag, null)).toEqual({
      x: 10,
      y: 10,
      width: 20,
      height: 20
    });
  });

  it("returns completed calibration boxes only when they meet minimum size", () => {
    expect(
      getCompletedMapCalibrationBox(
        {
          pointerId: 1,
          mode: "draw",
          start: { x: 0, y: 0 },
          current: { x: 3, y: 3 }
        },
        null
      )
    ).toBeNull();
    expect(
      getCompletedMapCalibrationBox(
        {
          pointerId: 1,
          mode: "draw",
          start: { x: 0, y: 0 },
          current: { x: 4, y: 4 }
        },
        null
      )
    ).toEqual({ x: 0, y: 0, width: 4, height: 4 });
  });

  it("detects resize handles before box moves", () => {
    const box: MapCalibrationBox = { x: 10, y: 20, width: 100, height: 100 };
    const camera = { x: 0, y: 0, zoom: 1 };

    expect(getMapCalibrationBoxHit({ x: 110, y: 120 }, box, camera)).toBe("resize");
    expect(getMapCalibrationBoxHit({ x: 50, y: 60 }, box, camera)).toBe("move");
    expect(getMapCalibrationBoxHit({ x: 200, y: 60 }, box, camera)).toBeNull();
  });

  it("scales resize hit area by camera zoom", () => {
    const box: MapCalibrationBox = { x: 10, y: 20, width: 100, height: 100 };

    expect(getMapCalibrationBoxHit({ x: 113, y: 123 }, box, { x: 0, y: 0, zoom: 0.5 })).toBe("resize");
    expect(getMapCalibrationBoxHit({ x: 113, y: 123 }, box, { x: 0, y: 0, zoom: 4 })).toBeNull();
  });

  it("starts drawing calibration when there is no editable box hit", () => {
    expect(getMapCalibrationDragFromPoint(7, { x: 5, y: 6 }, null, { x: 0, y: 0, zoom: 1 })).toEqual({
      pointerId: 7,
      mode: "draw",
      start: { x: 5, y: 6 },
      current: { x: 5, y: 6 }
    });
  });

  it("creates move calibration drags with pointer offset", () => {
    expect(getMapCalibrationDragFromPoint(7, { x: 30, y: 35 }, { x: 10, y: 20, width: 100, height: 100 }, { x: 0, y: 0, zoom: 1 })).toEqual({
      pointerId: 7,
      mode: "move",
      start: { x: 30, y: 35 },
      current: { x: 30, y: 35 },
      box: { x: 10, y: 20, width: 100, height: 100 },
      offset: { x: 20, y: 15 }
    });
  });

  it("creates resize calibration drags from the box origin", () => {
    expect(getMapCalibrationDragFromPoint(7, { x: 110, y: 120 }, { x: 10, y: 20, width: 100, height: 100 }, { x: 0, y: 0, zoom: 1 })).toEqual({
      pointerId: 7,
      mode: "resize",
      start: { x: 10, y: 20 },
      current: { x: 110, y: 120 },
      box: { x: 10, y: 20, width: 100, height: 100 }
    });
  });

  it("updates move calibration drags and draft boxes", () => {
    const result = getUpdatedMapCalibrationDrag(
      {
        pointerId: 1,
        mode: "move",
        start: { x: 30, y: 35 },
        current: { x: 30, y: 35 },
        box: { x: 10, y: 20, width: 100, height: 100 },
        offset: { x: 20, y: 15 }
      },
      { x: 50, y: 70 }
    );

    expect(result.drag.current).toEqual({ x: 50, y: 70 });
    expect(result.draftBox).toEqual({ x: 30, y: 55, width: 100, height: 100 });
  });

  it("updates draw and resize calibration drags with square draft boxes", () => {
    const draw = getUpdatedMapCalibrationDrag(
      {
        pointerId: 1,
        mode: "draw",
        start: { x: 10, y: 20 },
        current: { x: 10, y: 20 }
      },
      { x: 35, y: 30 }
    );
    const resize = getUpdatedMapCalibrationDrag(
      {
        pointerId: 1,
        mode: "resize",
        start: { x: 10, y: 20 },
        current: { x: 10, y: 20 },
        box: { x: 10, y: 20, width: 100, height: 100 }
      },
      { x: -10, y: -40 }
    );

    expect(draw.draftBox).toEqual({ x: 10, y: 20, width: 25, height: 25 });
    expect(resize.draftBox).toEqual({ x: -50, y: -40, width: 60, height: 60 });
  });

  it("calculates grid size and offsets from a calibration box", () => {
    expect(getBoxCalibrationGridPatch({ boxColumns: 3, boxRows: 2 }, { x: 11, y: 7, width: 91, height: 59 })).toEqual({
      sizePx: 29.92,
      offsetX: 11,
      offsetY: 7
    });
  });

  it("wraps negative calibration offsets into the grid cell", () => {
    expect(getBoxCalibrationGridPatch({ boxColumns: 4, boxRows: 4 }, { x: -5, y: -31, width: 80, height: 80 })).toEqual({
      sizePx: 20,
      offsetX: 15,
      offsetY: 9
    });
  });

  it("ignores invalid calibration box inputs", () => {
    expect(getBoxCalibrationGridPatch({ boxColumns: 0, boxRows: 1 }, { x: 0, y: 0, width: 100, height: 100 })).toBeNull();
    expect(getBoxCalibrationGridPatch({ boxColumns: 1, boxRows: 1 }, null)).toBeNull();
    expect(getBoxCalibrationGridPatch({ boxColumns: 1, boxRows: 1 }, { x: 0, y: 0, width: 0, height: 100 })).toBeNull();
  });
});
