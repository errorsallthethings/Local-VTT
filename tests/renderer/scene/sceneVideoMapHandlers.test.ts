import { describe, expect, it } from "vitest";
import { getVideoMapViewportSize } from "../../../src/renderer/components/scene/map/useSceneVideoMapHandlers";

describe("scene video map handlers", () => {
  it("reports a zero viewport when the canvas is unavailable", () => {
    expect(getVideoMapViewportSize(null)).toEqual({ height: 0, width: 0 });
  });

  it("reads the current canvas viewport dimensions for video map fitting", () => {
    expect(
      getVideoMapViewportSize({
        getBoundingClientRect: () => ({ height: 720, width: 1280 }) as DOMRect
      })
    ).toEqual({ height: 720, width: 1280 });
  });
});
