import { describe, expect, it } from "vitest";
import { isMeaningfulWeatherMaskDrag, type WeatherMaskDrag } from "../../src/renderer/canvas/weatherMaskGeometry";

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
});
