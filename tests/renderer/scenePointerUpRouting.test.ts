import { describe, expect, it } from "vitest";
import { getScenePointerUpRoute, type ScenePointerUpRoutingOptions } from "../../src/renderer/components/scene/scenePointerUpRouting";

function route(options: Partial<ScenePointerUpRoutingOptions>) {
  return getScenePointerUpRoute({ pointerId: 7, ...options });
}

describe("scene pointer-up routing", () => {
  it("routes early exclusive pointer completions in handler order", () => {
    expect(route({ mapCalibrationDrag: { pointerId: 7 }, drawingDrag: { pointerId: 7 } })).toBe("map-calibration");
    expect(route({ drawingDrag: { pointerId: 7 }, weatherMaskDrag: { pointerId: 7 } })).toBe("drawing");
    expect(route({ weatherMaskDrag: { pointerId: 7 }, environmentEffectDrag: { pointerId: 7 } })).toBe("weather-mask");
    expect(route({ environmentEffectDrag: { pointerId: 7 }, fogDrag: { pointerId: 7 } })).toBe("environment-effect");
    expect(route({ fogDrag: { pointerId: 7 }, rulerDrag: { pointerId: 7 } })).toBe("fog");
    expect(route({ rulerDrag: { pointerId: 7 }, selectionDrag: { pointerId: 7 } })).toBe("ruler");
  });

  it("routes selection before transform completions", () => {
    expect(route({ selectionDrag: { pointerId: 7 }, drawingMoveDrag: { pointerId: 7 } })).toBe("selection");
    expect(route({ drawingMoveDrag: { pointerId: 7 } })).toBe("drawing-transform");
    expect(route({ drawingResizeDrag: { pointerId: 7 } })).toBe("drawing-transform");
    expect(route({ drawingRotateDrag: { pointerId: 7 } })).toBe("drawing-transform");
  });

  it("routes weather and environment mask-effect moves before laser cleanup", () => {
    expect(route({ weatherMaskMove: { pointerId: 7 }, laserDrag: { pointerId: 7 } })).toBe("mask-effect");
    expect(route({ environmentEffectMove: { pointerId: 7 }, laserDrag: { pointerId: 7 } })).toBe("mask-effect");
    expect(route({ laserDrag: { pointerId: 7 } })).toBe("laser");
  });

  it("ignores interactions owned by a different pointer", () => {
    expect(
      route({
        mapCalibrationDrag: { pointerId: 3 },
        drawingDrag: { pointerId: 3 },
        weatherMaskDrag: { pointerId: 3 },
        environmentEffectDrag: { pointerId: 3 },
        fogDrag: { pointerId: 3 },
        rulerDrag: { pointerId: 3 },
        selectionDrag: { pointerId: 3 },
        drawingMoveDrag: { pointerId: 3 },
        weatherMaskMove: { pointerId: 3 },
        laserDrag: { pointerId: 3 }
      })
    ).toBe("none");
  });
});
