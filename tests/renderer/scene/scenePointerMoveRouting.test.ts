import { describe, expect, it } from "vitest";
import { getScenePointerMoveRoute, type ScenePointerMoveRoute } from "../../../src/renderer/components/scene/input/scenePointerMoveRouting";

const tracked = (pointerId: number) => ({ pointerId });

describe("getScenePointerMoveRoute", () => {
  it.each<[ScenePointerMoveRoute, Parameters<typeof getScenePointerMoveRoute>[0]]>([
    ["map-calibration", { pointerId: 1, mapCalibrationDrag: tracked(1) }],
    ["laser", { pointerId: 1, laserDrag: tracked(1) }],
    ["ruler", { pointerId: 1, rulerDrag: tracked(1) }],
    ["selection", { pointerId: 1, selectionDrag: tracked(1) }],
    ["drawing", { pointerId: 1, drawingDrag: tracked(1) }],
    ["drawing-transform", { pointerId: 1, drawingMoveDrag: tracked(1) }],
    ["drawing-transform", { pointerId: 1, drawingResizeDrag: tracked(1) }],
    ["drawing-transform", { pointerId: 1, drawingRotateDrag: tracked(1) }],
    ["mask-effect", { pointerId: 1, weatherMaskMove: tracked(1) }],
    ["mask-effect", { pointerId: 1, environmentEffectMove: tracked(1) }],
    ["token", { pointerId: 1, tokenDrag: tracked(1) }],
    ["fog", { pointerId: 1, fogDrag: tracked(1) }],
    ["weather-mask", { pointerId: 1, weatherMaskDrag: tracked(1) }],
    ["environment-effect", { pointerId: 1, environmentEffectDrag: tracked(1) }],
    ["pan", { pointerId: 1, panDrag: tracked(1) }]
  ])("routes %s when the pointer matches", (route, options) => {
    expect(getScenePointerMoveRoute(options)).toBe(route);
  });

  it("returns none when no interaction matches the pointer", () => {
    expect(
      getScenePointerMoveRoute({
        pointerId: 1,
        mapCalibrationDrag: tracked(2),
        laserDrag: tracked(2),
        rulerDrag: tracked(2),
        selectionDrag: tracked(2),
        drawingDrag: tracked(2),
        drawingMoveDrag: tracked(2),
        drawingResizeDrag: tracked(2),
        drawingRotateDrag: tracked(2),
        weatherMaskMove: tracked(2),
        environmentEffectMove: tracked(2),
        tokenDrag: tracked(2),
        fogDrag: tracked(2),
        weatherMaskDrag: tracked(2),
        environmentEffectDrag: tracked(2),
        panDrag: tracked(2)
      })
    ).toBe("none");
  });

  it("preserves SceneCanvas pointer move branch priority", () => {
    expect(
      getScenePointerMoveRoute({
        pointerId: 1,
        mapCalibrationDrag: tracked(1),
        laserDrag: tracked(1),
        rulerDrag: tracked(1),
        selectionDrag: tracked(1),
        drawingDrag: tracked(1),
        drawingMoveDrag: tracked(1),
        weatherMaskMove: tracked(1),
        tokenDrag: tracked(1),
        fogDrag: tracked(1),
        weatherMaskDrag: tracked(1),
        environmentEffectDrag: tracked(1),
        panDrag: tracked(1)
      })
    ).toBe("map-calibration");
  });

  it("prioritizes drawing transforms before mask-effect moves and tokens", () => {
    expect(
      getScenePointerMoveRoute({
        pointerId: 1,
        drawingResizeDrag: tracked(1),
        weatherMaskMove: tracked(1),
        tokenDrag: tracked(1)
      })
    ).toBe("drawing-transform");
  });
});
