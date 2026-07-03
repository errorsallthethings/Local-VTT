import { describe, expect, it } from "vitest";
import {
  getMapCalibrationPointerComplete,
  getMapCalibrationPointerMove,
  getMapCalibrationPointerStart
} from "../../src/renderer/components/scene/sceneMapCalibrationPointer";

describe("scene map calibration pointer helpers", () => {
  it("starts map calibration only for active GM left-clicks", () => {
    const activeOptions = {
      button: 0,
      camera: { x: 0, y: 0, zoom: 1 },
      draftBox: null,
      existingBox: null,
      hasScene: true,
      mode: "gm" as const,
      point: { x: 10, y: 20 },
      pointerId: 4,
      toolActive: true
    };

    expect(getMapCalibrationPointerStart(activeOptions)).toEqual({
      pointerId: 4,
      mode: "draw",
      start: { x: 10, y: 20 },
      current: { x: 10, y: 20 }
    });
    expect(getMapCalibrationPointerStart({ ...activeOptions, button: 1 })).toBeNull();
    expect(getMapCalibrationPointerStart({ ...activeOptions, hasScene: false })).toBeNull();
    expect(getMapCalibrationPointerStart({ ...activeOptions, mode: "player" })).toBeNull();
    expect(getMapCalibrationPointerStart({ ...activeOptions, toolActive: false })).toBeNull();
  });

  it("prefers draft boxes over existing boxes when starting editable drags", () => {
    const drag = getMapCalibrationPointerStart({
      button: 0,
      camera: { x: 0, y: 0, zoom: 1 },
      draftBox: { x: 100, y: 100, width: 40, height: 40 },
      existingBox: { x: 0, y: 0, width: 40, height: 40 },
      hasScene: true,
      mode: "gm",
      point: { x: 110, y: 110 },
      pointerId: 5,
      toolActive: true
    });

    expect(drag).toMatchObject({
      pointerId: 5,
      mode: "move",
      box: { x: 100, y: 100, width: 40, height: 40 },
      offset: { x: 10, y: 10 }
    });
  });

  it("updates only the matching active calibration drag", () => {
    const activeDrag = {
      pointerId: 4,
      mode: "draw" as const,
      start: { x: 10, y: 20 },
      current: { x: 10, y: 20 }
    };

    expect(getMapCalibrationPointerMove(null, 4, { x: 50, y: 55 })).toBeNull();
    expect(getMapCalibrationPointerMove(activeDrag, 99, { x: 50, y: 55 })).toBeNull();
    expect(getMapCalibrationPointerMove(activeDrag, 4, { x: 50, y: 55 })).toEqual({
      drag: { ...activeDrag, current: { x: 50, y: 55 } },
      draftBox: { x: 10, y: 20, width: 40, height: 40 }
    });
  });

  it("completes only matching calibration drags that produce usable boxes", () => {
    const activeDrag = {
      pointerId: 4,
      mode: "draw" as const,
      start: { x: 10, y: 20 },
      current: { x: 50, y: 55 }
    };
    const tinyDrag = {
      ...activeDrag,
      current: { x: 11, y: 21 }
    };

    expect(getMapCalibrationPointerComplete(null, 4, null)).toBeNull();
    expect(getMapCalibrationPointerComplete(activeDrag, 99, null)).toBeNull();
    expect(getMapCalibrationPointerComplete(tinyDrag, 4, null)).toBeNull();
    expect(getMapCalibrationPointerComplete(activeDrag, 4, null)).toEqual({ x: 10, y: 20, width: 40, height: 40 });
  });
});
