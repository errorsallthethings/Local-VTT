import { describe, expect, it } from "vitest";
import type { WeatherMask } from "../../src/shared/localvtt";
import {
  getVisibleWeatherMasks,
  getWeatherMaskFromDrag,
  getWeatherMaskFromPolygonDraft,
  getWeatherMaskDragRect,
  getWeatherMaskRect,
  getUpdatedWeatherMaskDrag,
  isMeaningfulWeatherMaskDrag,
  type WeatherMaskDrag
} from "../../src/renderer/canvas/weatherMaskGeometry";

function drag(overrides: Partial<WeatherMaskDrag> = {}): WeatherMaskDrag {
  return {
    pointerId: 1,
    kind: "rectangle",
    start: { x: 0, y: 0 },
    current: { x: 10, y: 10 },
    ...overrides
  };
}

describe("weather mask geometry", () => {
  it("requires meaningful radius for circle masks", () => {
    expect(isMeaningfulWeatherMaskDrag(drag({ kind: "circle", current: { x: 3, y: 0 } }))).toBe(false);
    expect(isMeaningfulWeatherMaskDrag(drag({ kind: "circle", current: { x: 4, y: 0 } }))).toBe(true);
  });

  it("requires meaningful movement on both axes for rectangle and polygon masks", () => {
    expect(isMeaningfulWeatherMaskDrag(drag({ kind: "rectangle", current: { x: 4, y: 3 } }))).toBe(false);
    expect(isMeaningfulWeatherMaskDrag(drag({ kind: "rectangle", current: { x: 4, y: 4 } }))).toBe(true);
    expect(isMeaningfulWeatherMaskDrag(drag({ kind: "polygon", current: { x: 5, y: 4 } }))).toBe(true);
  });

  it("builds positive weather mask drag rectangles from any drag direction", () => {
    expect(getWeatherMaskDragRect(drag({ start: { x: 50, y: 60 }, current: { x: 10, y: 20 } }))).toEqual({
      x: 10,
      y: 20,
      width: 40,
      height: 40
    });
  });

  it("builds rectangle mask bounds only for rectangle masks with two points", () => {
    const rectangle: WeatherMask = {
      id: "weather-1",
      kind: "rectangle",
      points: [{ x: 30, y: 80 }, { x: 10, y: 20 }]
    };
    const circle: WeatherMask = {
      id: "weather-2",
      kind: "circle",
      points: [{ x: 30, y: 80 }],
      radius: 10
    };

    expect(getWeatherMaskRect(rectangle)).toEqual({ x: 10, y: 20, width: 20, height: 60 });
    expect(getWeatherMaskRect({ ...rectangle, points: [{ x: 30, y: 80 }] })).toBeNull();
    expect(getWeatherMaskRect(circle)).toBeNull();
  });

  it("creates rectangle weather masks from drag state", () => {
    expect(getWeatherMaskFromDrag(drag(), "weather-1", "Weather Mask 1")).toEqual({
      id: "weather-1",
      name: "Weather Mask 1",
      kind: "rectangle",
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      radius: undefined,
      visible: true
    });
  });

  it("creates circle weather masks from drag state", () => {
    expect(
      getWeatherMaskFromDrag(drag({ kind: "circle", start: { x: 5, y: 5 }, current: { x: 8, y: 9 } }), "weather-2", "Weather Mask 2")
    ).toEqual({
      id: "weather-2",
      name: "Weather Mask 2",
      kind: "circle",
      points: [{ x: 5, y: 5 }],
      radius: 5,
      visible: true
    });
  });

  it("creates polygon weather masks from draft points", () => {
    const points = [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }];

    expect(getWeatherMaskFromPolygonDraft({ points }, "weather-3", "Weather Mask 3")).toEqual({
      id: "weather-3",
      name: "Weather Mask 3",
      kind: "polygon",
      points,
      visible: true
    });
  });

  it("updates weather mask drags and constrains rectangles when requested", () => {
    expect(getUpdatedWeatherMaskDrag(drag(), { x: 20, y: 5 }, true).current).toEqual({ x: 20, y: 20 });
    expect(getUpdatedWeatherMaskDrag(drag({ kind: "circle" }), { x: 20, y: 5 }, true).current).toEqual({ x: 20, y: 5 });
  });

  it("filters hidden weather masks", () => {
    const masks: WeatherMask[] = [
      { id: "visible-default", kind: "rectangle", points: [] },
      { id: "visible-explicit", kind: "rectangle", points: [], visible: true },
      { id: "hidden", kind: "rectangle", points: [], visible: false }
    ];

    expect(getVisibleWeatherMasks(masks).map((mask) => mask.id)).toEqual(["visible-default", "visible-explicit"]);
  });
});
