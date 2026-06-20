import { describe, expect, it } from "vitest";
import { clientToWorldPoint, eventToWorldPoint, getCanvasViewportCenter, isSnapModifier, worldRectToScreen, worldToScreenPoint } from "../../src/renderer/canvas/viewportGeometry";

function elementRect(rect: { left: number; top: number; width: number; height: number }) {
  return {
    getBoundingClientRect: () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect
    })
  };
}

describe("viewport geometry", () => {
  it("converts client coordinates into world coordinates", () => {
    const element = elementRect({ left: 100, top: 50, width: 800, height: 600 });

    expect(clientToWorldPoint(element, 260, 190, { x: 40, y: -20, zoom: 2 })).toEqual({
      x: 60,
      y: 80
    });
  });

  it("computes the visible world point at the viewport center", () => {
    const element = elementRect({ left: 0, top: 0, width: 1000, height: 800 });

    expect(getCanvasViewportCenter(element, { x: 100, y: 40, zoom: 4 })).toEqual({
      x: 100,
      y: 90
    });
  });

  it("converts pointer events into world coordinates", () => {
    const currentTarget = elementRect({ left: 20, top: 30, width: 400, height: 300 });

    expect(eventToWorldPoint({ currentTarget, clientX: 170, clientY: 120, ctrlKey: false, metaKey: false }, { x: 50, y: 10, zoom: 5 })).toEqual({
      x: 20,
      y: 16
    });
  });

  it("detects control or command snap modifiers", () => {
    expect(isSnapModifier({ ctrlKey: true, metaKey: false })).toBe(true);
    expect(isSnapModifier({ ctrlKey: false, metaKey: true })).toBe(true);
    expect(isSnapModifier({ ctrlKey: false, metaKey: false })).toBe(false);
  });

  it("converts world points and rectangles to screen coordinates", () => {
    const camera = { x: 20, y: -10, zoom: 3 };

    expect(worldToScreenPoint({ x: 10, y: 20 }, camera)).toEqual({ x: 50, y: 50 });
    expect(worldRectToScreen({ x: 10, y: 20, width: 30, height: 40 }, camera)).toEqual({
      x: 50,
      y: 50,
      width: 90,
      height: 120
    });
  });
});
