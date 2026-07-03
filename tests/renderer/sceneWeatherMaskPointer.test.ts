import { describe, expect, it } from "vitest";
import { getWeatherMaskPointerMove, getWeatherMaskPointerStart } from "../../src/renderer/components/scene/sceneWeatherMaskPointer";
import type { WeatherMaskDrag } from "../../src/renderer/canvas/weather";

describe("scene weather mask pointer helpers", () => {
  it("starts weather mask drags for active GM left-clicks with shape tools", () => {
    expect(
      getWeatherMaskPointerStart({
        button: 0,
        hasScene: true,
        mode: "gm",
        onSceneChangeAvailable: true,
        point: { x: 10, y: 20 },
        pointerId: 6,
        tool: "rectangle"
      })
    ).toEqual({
      kind: "drag",
      drag: {
        pointerId: 6,
        kind: "rectangle",
        start: { x: 10, y: 20 },
        current: { x: 10, y: 20 }
      }
    });
  });

  it("starts polygon drafts for active GM polygon tools", () => {
    expect(
      getWeatherMaskPointerStart({
        button: 0,
        hasScene: true,
        mode: "gm",
        onSceneChangeAvailable: true,
        point: { x: 10, y: 20 },
        pointerId: 6,
        tool: "polygon"
      })
    ).toEqual({
      kind: "polygon",
      point: { x: 10, y: 20 }
    });
  });

  it("does not start weather mask interactions for inactive contexts", () => {
    const activeOptions = {
      button: 0,
      hasScene: true,
      mode: "gm" as const,
      onSceneChangeAvailable: true,
      point: { x: 10, y: 20 },
      pointerId: 6,
      tool: "circle" as const
    };

    expect(getWeatherMaskPointerStart({ ...activeOptions, button: 1 })).toBeNull();
    expect(getWeatherMaskPointerStart({ ...activeOptions, hasScene: false })).toBeNull();
    expect(getWeatherMaskPointerStart({ ...activeOptions, mode: "player" })).toBeNull();
    expect(getWeatherMaskPointerStart({ ...activeOptions, onSceneChangeAvailable: false })).toBeNull();
    expect(getWeatherMaskPointerStart({ ...activeOptions, tool: null })).toBeNull();
  });

  it("updates only matching active weather mask drags", () => {
    const drag: WeatherMaskDrag = {
      pointerId: 6,
      kind: "rectangle",
      start: { x: 0, y: 0 },
      current: { x: 0, y: 0 }
    };

    expect(getWeatherMaskPointerMove(null, 6, { x: 20, y: 10 }, false)).toBeNull();
    expect(getWeatherMaskPointerMove(drag, 7, { x: 20, y: 10 }, false)).toBeNull();
    expect(getWeatherMaskPointerMove(drag, 6, { x: 20, y: 10 }, true)?.current).toEqual({ x: 20, y: 20 });
  });
});
