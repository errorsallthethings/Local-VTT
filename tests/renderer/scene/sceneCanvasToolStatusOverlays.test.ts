import { describe, expect, it } from "vitest";
import { getSceneCanvasToolStatusKeys } from "../../../src/renderer/components/scene/overlays/SceneCanvasToolStatusOverlays";

describe("scene canvas tool status overlays", () => {
  it("does not show GM tool statuses in Player View", () => {
    expect(
      getSceneCanvasToolStatusKeys({
        canvasTool: "ruler",
        drawingTool: "rectangle",
        environmentEffectTool: "rectangle",
        fogTool: "hide-brush",
        mode: "player",
        tokenDragPreview: {
          tokenId: "token-1",
          startPosition: { x: 0, y: 0 },
          currentPosition: { x: 1, y: 1 },
          snappedPosition: { x: 1, y: 1 },
          waypoints: [],
          tokenPositions: new Map()
        },
        weatherMaskTool: "rectangle"
      })
    ).toEqual([]);
  });

  it("reports active GM authoring and token movement statuses in render order", () => {
    expect(
      getSceneCanvasToolStatusKeys({
        canvasTool: "ruler",
        drawingTool: "circle",
        environmentEffectTool: "polygon",
        fogTool: "reveal-polygon",
        mode: "gm",
        tokenDragPreview: {
          tokenId: "token-1",
          startPosition: { x: 0, y: 0 },
          currentPosition: { x: 1, y: 1 },
          snappedPosition: { x: 1, y: 1 },
          waypoints: [],
          tokenPositions: new Map()
        },
        weatherMaskTool: "freehand"
      })
    ).toEqual(["fog", "drawing", "ruler", "weather-mask", "environment-effect", "token-move"]);
  });

  it("uses the table status for ping and laser tools", () => {
    const base = {
      drawingTool: null,
      environmentEffectTool: null,
      fogTool: null,
      mode: "gm" as const,
      tokenDragPreview: null,
      weatherMaskTool: null
    };

    expect(getSceneCanvasToolStatusKeys({ ...base, canvasTool: "ping" })).toEqual(["table"]);
    expect(getSceneCanvasToolStatusKeys({ ...base, canvasTool: "laser" })).toEqual(["table"]);
  });
});
