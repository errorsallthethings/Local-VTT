import { describe, expect, it } from "vitest";
import { getSceneAuthoringPointerStart } from "../../src/renderer/components/scene/sceneAuthoringPointerStart";

describe("scene authoring pointer start", () => {
  it("starts drawing polygon drafts and drawing previews", () => {
    expect(start({ route: "drawing-polygon", drawingTool: "polygon" })).toEqual({
      kind: "drawing-polygon",
      point: { x: 10, y: 20 }
    });

    expect(start({ route: "drawing", drawingTool: "rectangle" })).toMatchObject({
      kind: "drawing",
      preview: {
        pointerId: 7,
        kind: "rectangle",
        points: [{ x: 10, y: 20 }],
        current: { x: 10, y: 20 },
        color: "#112233",
        strokeWidth: 4
      }
    });
  });

  it("starts fog polygon drafts and fog drags", () => {
    expect(start({ route: "fog", fogTool: "hide-polygon" })).toEqual({
      kind: "fog",
      start: {
        kind: "polygon",
        point: { x: 10, y: 20 },
        tool: "hide-polygon"
      }
    });

    expect(start({ route: "fog", fogTool: "hide-rectangle" })).toEqual({
      kind: "fog",
      start: {
        kind: "drag",
        drag: {
          pointerId: 7,
          kind: "rectangle",
          operation: "hide",
          start: { x: 10, y: 20 },
          current: { x: 10, y: 20 },
          points: [{ x: 10, y: 20 }]
        }
      }
    });
  });

  it("starts weather mask polygon drafts and drags", () => {
    expect(start({ route: "weather-mask", weatherMaskTool: "polygon" })).toEqual({
      kind: "weather-mask",
      start: {
        kind: "polygon",
        point: { x: 10, y: 20 }
      }
    });

    expect(start({ route: "weather-mask", weatherMaskTool: "circle" })).toEqual({
      kind: "weather-mask",
      start: {
        kind: "drag",
        drag: {
          pointerId: 7,
          kind: "circle",
          start: { x: 10, y: 20 },
          current: { x: 10, y: 20 }
        }
      }
    });
  });

  it("starts environment effect polygon drafts and drags with tuning", () => {
    expect(start({ route: "environment-effect", environmentEffectTool: "polygon" })).toEqual({
      kind: "environment-effect",
      start: {
        kind: "polygon",
        point: { x: 10, y: 20 }
      }
    });

    expect(start({ route: "environment-effect", environmentEffectTool: "rectangle" })).toMatchObject({
      kind: "environment-effect",
      start: {
        kind: "drag",
        drag: {
          pointerId: 7,
          kind: "rectangle",
          effect: "water",
          feather: 0.25,
          waterTuning: { opacity: 0.8 },
          start: { x: 10, y: 20 },
          current: { x: 10, y: 20 }
        }
      }
    });
  });

  it("returns null for non-authoring routes and inactive contexts", () => {
    expect(start({ route: "selector" })).toBeNull();
    expect(start({ route: "drawing", drawingTool: "line", hasScene: false })).toBeNull();
    expect(start({ route: "weather-mask", weatherMaskTool: "rectangle", onSceneChangeAvailable: false })).toBeNull();
    expect(start({ route: "environment-effect", environmentEffectTool: "circle", button: 1 })).toBeNull();
  });
});

function start(overrides: Partial<Parameters<typeof getSceneAuthoringPointerStart>[0]> = {}) {
  return getSceneAuthoringPointerStart({
    activeFogBrushSize: 80,
    button: 0,
    drawingStyle: {
      color: "#112233",
      opacity: 0.75,
      fillColor: "#445566",
      fillOpacity: 0.25,
      strokeStyle: "solid",
      strokeWidth: 4,
      templateEffect: "plain",
      templateWidth: 10
    },
    drawingTool: "rectangle",
    environmentEffectFeather: 0.25,
    environmentEffectTool: "rectangle",
    environmentEffectTuning: { waterTuning: { opacity: 0.8 } },
    environmentEffectType: "water",
    fogTool: "hide-rectangle",
    hasScene: true,
    mode: "gm",
    onSceneChangeAvailable: true,
    pointerId: 7,
    route: "drawing",
    toolPoint: { x: 10, y: 20 },
    weatherMaskTool: "rectangle",
    ...overrides
  });
}
