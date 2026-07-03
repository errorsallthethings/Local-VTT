import { describe, expect, it } from "vitest";
import { getMapCalibrationSizeControlStyle } from "../../src/renderer/components/scene/MapCalibrationControls";

describe("map calibration controls", () => {
  it("positions the size control beside the calibration box in screen space", () => {
    expect(
      getMapCalibrationSizeControlStyle(
        { x: 20, y: 30, width: 40, height: 40 },
        { x: 100, y: 50, zoom: 2 }
      )
    ).toEqual({
      left: 232,
      top: 110
    });
  });

  it("does not position the size control without an active box", () => {
    expect(getMapCalibrationSizeControlStyle(null, { x: 100, y: 50, zoom: 2 })).toBeUndefined();
  });
});
