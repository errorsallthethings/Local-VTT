import { describe, expect, it } from "vitest";
import { getSceneViewportCenterReport, getSceneWheelZoomCamera } from "../../src/renderer/components/scene/sceneViewportActions";

describe("scene viewport actions", () => {
  it("reports viewport center with player display scale applied to zoom", () => {
    const element = rectElement({ left: 0, top: 0, width: 400, height: 200 });

    expect(getSceneViewportCenterReport(element, { x: 100, y: 40, zoom: 2 }, 2)).toEqual({
      x: 25,
      y: 15
    });
  });

  it("builds wheel zoom camera actions only when interactive and mounted", () => {
    const element = rectElement({ left: 20, top: 10, width: 400, height: 200 });
    const camera = { x: 10, y: 20, zoom: 1 };

    expect(getSceneWheelZoomCamera({ camera, clientX: 220, clientY: 110, deltaY: -1, element, interactive: true })).toMatchObject({
      zoom: 1.08
    });
    expect(getSceneWheelZoomCamera({ camera, clientX: 220, clientY: 110, deltaY: -1, element: null, interactive: true })).toBeNull();
    expect(getSceneWheelZoomCamera({ camera, clientX: 220, clientY: 110, deltaY: -1, element, interactive: false })).toBeNull();
  });
});

function rectElement(rect: { left: number; top: number; width: number; height: number }) {
  return {
    getBoundingClientRect: () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect
    })
  } as HTMLElement;
}
