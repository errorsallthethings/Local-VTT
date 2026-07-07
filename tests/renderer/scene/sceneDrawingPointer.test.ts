import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../../src/shared/localvtt";
import type { DrawingPreview } from "../../../src/renderer/canvas/drawings";
import { getDrawingPointerMove, getDrawingPointerMoveAction, getDrawingPointerStart } from "../../../src/renderer/components/scene/input/sceneDrawingPointer";

const style = {
  color: "#ff0000",
  opacity: 0.75,
  fillColor: "#00ff00",
  fillOpacity: 0.4,
  strokeStyle: "dashed" as const,
  strokeWidth: 3,
  templateEffect: "plain" as const,
  templateWidth: 10
};

describe("scene drawing pointer helpers", () => {
  it("starts drawing previews for active GM left-clicks with non-polygon drawing tools", () => {
    expect(
      getDrawingPointerStart({
        button: 0,
        hasScene: true,
        mode: "gm",
        onSceneChangeAvailable: true,
        point: { x: 10, y: 20 },
        pointerId: 6,
        style,
        tool: "rectangle"
      })
    ).toMatchObject({
      pointerId: 6,
      kind: "rectangle",
      points: [{ x: 10, y: 20 }],
      current: { x: 10, y: 20 },
      color: "#ff0000",
      fillColor: "#00ff00",
      strokeStyle: "dashed",
      strokeWidth: 3
    });
  });

  it("does not start drawing previews for inactive contexts or polygon drafts", () => {
    const activeOptions = {
      button: 0,
      hasScene: true,
      mode: "gm" as const,
      onSceneChangeAvailable: true,
      point: { x: 10, y: 20 },
      pointerId: 6,
      style,
      tool: "line" as const
    };

    expect(getDrawingPointerStart({ ...activeOptions, button: 1 })).toBeNull();
    expect(getDrawingPointerStart({ ...activeOptions, hasScene: false })).toBeNull();
    expect(getDrawingPointerStart({ ...activeOptions, mode: "player" })).toBeNull();
    expect(getDrawingPointerStart({ ...activeOptions, onSceneChangeAvailable: false })).toBeNull();
    expect(getDrawingPointerStart({ ...activeOptions, tool: "polygon" })).toBeNull();
    expect(getDrawingPointerStart({ ...activeOptions, tool: null })).toBeNull();
  });

  it("updates only matching active drawing previews", () => {
    const scene = createDefaultScene("Drawing Move");
    const preview: DrawingPreview = {
      pointerId: 6,
      kind: "rectangle",
      points: [{ x: 0, y: 0 }],
      current: { x: 0, y: 0 },
      color: "#ff0000",
      opacity: 1,
      strokeWidth: 2,
      templateEffect: "plain",
      templateWidth: 5
    };

    expect(getDrawingPointerMove(null, 6, { x: 20, y: 10 }, scene, "custom", false)).toBeNull();
    expect(getDrawingPointerMove(preview, 7, { x: 20, y: 10 }, scene, "custom", false)).toBeNull();
    expect(getDrawingPointerMove(preview, 6, { x: 20, y: 10 }, scene, "custom", true)?.current).toEqual({ x: 20, y: 20 });
  });

  it("maps drawing pointer move results to SceneCanvas actions", () => {
    const scene = createDefaultScene("Drawing Move Action");
    const preview: DrawingPreview = {
      pointerId: 6,
      kind: "rectangle",
      points: [{ x: 0, y: 0 }],
      current: { x: 0, y: 0 },
      color: "#ff0000",
      opacity: 1,
      strokeWidth: 2,
      templateEffect: "plain",
      templateWidth: 5
    };
    const nextPreview = getDrawingPointerMove(preview, 6, { x: 20, y: 10 }, scene, "custom", true);

    expect(getDrawingPointerMoveAction(null)).toEqual({ kind: "none" });
    expect(getDrawingPointerMoveAction(nextPreview)).toMatchObject({
      kind: "set-preview",
      preview: {
        current: { x: 20, y: 20 }
      }
    });
  });

  it("starts template previews with template-specific presentation fields", () => {
    expect(
      getDrawingPointerStart({
        button: 0,
        hasScene: true,
        mode: "gm",
        onSceneChangeAvailable: true,
        point: { x: 10, y: 20 },
        pointerId: 6,
        style: { ...style, templateWidth: 15 },
        tool: "template-circle"
      })
    ).toMatchObject({
      kind: "template-circle",
      fillOpacity: 0,
      strokeStyle: "dashed",
      templateWidth: 15,
      measurementLabelVisible: true
    });
  });
});
