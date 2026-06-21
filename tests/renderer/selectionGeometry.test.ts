import { describe, expect, it } from "vitest";
import { createDefaultScene, type Scene, type Token, type WeatherMask } from "../../src/shared/localvtt";
import {
  getCompletedSceneMarqueeSelection,
  getSceneMarqueeSelection,
  getSelectionDragFromPoint,
  getUpdatedSelectionDrag,
  hasSelectedSceneItems,
  isDrawingInSelectionRect,
  isFogShapeInSelectionRect,
  isPointInSelectionRect,
  isTokenInSelectionRect,
  isWeatherMaskInSelectionRect,
  pointsToSelectionRect
} from "../../src/renderer/canvas/selection/selectionGeometry";

describe("selection geometry", () => {
  it("builds a positive selection rect from any drag direction", () => {
    expect(pointsToSelectionRect({ x: 20, y: 30 }, { x: 5, y: 10 })).toEqual({
      x: 5,
      y: 10,
      width: 15,
      height: 20
    });
  });

  it("updates selection drags without changing other drag fields", () => {
    expect(getUpdatedSelectionDrag({ pointerId: 4, mode: "add", current: { x: 0, y: 0 } }, { x: 12, y: 18 })).toEqual({
      pointerId: 4,
      mode: "add",
      current: { x: 12, y: 18 }
    });
  });

  it("creates selection drags from an initial point and mode", () => {
    expect(getSelectionDragFromPoint(4, { x: 12, y: 18 }, "add")).toEqual({
      pointerId: 4,
      start: { x: 12, y: 18 },
      current: { x: 12, y: 18 },
      mode: "add"
    });
  });

  it("detects populated scene item selections", () => {
    expect(hasSelectedSceneItems({ tokenIds: [], drawingIds: [], fogShapeIds: [], weatherMaskIds: [] })).toBe(false);
    expect(hasSelectedSceneItems({ tokenIds: ["token-1"], drawingIds: [], fogShapeIds: [], weatherMaskIds: [] })).toBe(true);
    expect(hasSelectedSceneItems({ tokenIds: [], drawingIds: ["drawing-1"], fogShapeIds: [], weatherMaskIds: [] })).toBe(true);
    expect(hasSelectedSceneItems({ tokenIds: [], drawingIds: [], fogShapeIds: ["fog-1"], weatherMaskIds: [] })).toBe(true);
    expect(hasSelectedSceneItems({ tokenIds: [], drawingIds: [], fogShapeIds: [], weatherMaskIds: ["weather-1"] })).toBe(true);
  });

  it("treats selection rect edges as inclusive", () => {
    const rect = { x: 10, y: 20, width: 30, height: 40 };

    expect(isPointInSelectionRect({ x: 10, y: 20 }, rect)).toBe(true);
    expect(isPointInSelectionRect({ x: 40, y: 60 }, rect)).toBe(true);
    expect(isPointInSelectionRect({ x: 40.1, y: 60 }, rect)).toBe(false);
  });

  it("selects tokens by their center point", () => {
    const token: Token = {
      id: "token-1",
      name: "Token",
      position: { x: 10, y: 10 },
      size: { width: 20, height: 20 },
      hidden: false,
      visibleInPlayer: true
    };

    expect(isTokenInSelectionRect(token, { x: 19, y: 19, width: 2, height: 2 })).toBe(true);
    expect(isTokenInSelectionRect(token, { x: 10, y: 10, width: 5, height: 5 })).toBe(false);
  });

  it("selects drawings when any drawing point is inside", () => {
    const drawing = { points: [{ x: 0, y: 0 }, { x: 25, y: 25 }] };

    expect(isDrawingInSelectionRect(drawing, { x: 20, y: 20, width: 10, height: 10 })).toBe(true);
    expect(isDrawingInSelectionRect(drawing, { x: 5, y: 5, width: 10, height: 10 })).toBe(false);
  });

  it("selects circular weather masks by center point", () => {
    const mask: WeatherMask = {
      id: "mask-1",
      kind: "circle",
      points: [{ x: 40, y: 40 }],
      radius: 20
    };

    expect(isWeatherMaskInSelectionRect(mask, { x: 35, y: 35, width: 10, height: 10 })).toBe(true);
    expect(isWeatherMaskInSelectionRect(mask, { x: 55, y: 40, width: 10, height: 10 })).toBe(false);
  });

  it("selects fog shapes when any shape point is inside", () => {
    const shape: Scene["fog"]["shapes"][number] = {
      id: "fog-1",
      operation: "reveal",
      kind: "polygon",
      points: [{ x: 5, y: 5 }, { x: 50, y: 50 }],
      visible: true
    };

    expect(isFogShapeInSelectionRect(shape, { x: 45, y: 45, width: 10, height: 10 })).toBe(true);
    expect(isFogShapeInSelectionRect(shape, { x: 20, y: 20, width: 10, height: 10 })).toBe(false);
  });

  it("builds marquee selections from enabled filters and visible scene items", () => {
    const scene = createDefaultScene("Selection");
    scene.tokens = [
      { id: "token-1", name: "Token", position: { x: 10, y: 10 }, size: { width: 20, height: 20 }, hidden: false, visibleInPlayer: true }
    ];
    scene.drawings = [
      { id: "drawing-1", kind: "line", points: [{ x: 20, y: 20 }], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true },
      { id: "template-1", kind: "circle", points: [{ x: 25, y: 25 }], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true, measurementLabelVisible: true }
    ];
    scene.weather.masks = [
      { id: "weather-1", kind: "circle", points: [{ x: 25, y: 25 }], radius: 10, visible: true },
      { id: "weather-hidden", kind: "circle", points: [{ x: 25, y: 25 }], radius: 10, visible: false }
    ];
    scene.fog.shapes = [
      { id: "fog-1", operation: "reveal", kind: "polygon", points: [{ x: 25, y: 25 }], visibleInGm: true },
      { id: "fog-hidden", operation: "reveal", kind: "polygon", points: [{ x: 25, y: 25 }], visibleInGm: false, visible: false }
    ];

    expect(
      getSceneMarqueeSelection(
        scene,
        { x: 0, y: 0, width: 40, height: 40 },
        { tokens: true, templates: true, fogMasks: true, weatherMasks: true, drawings: true },
        { tokens: true, drawings: true }
      )
    ).toEqual({
      tokenIds: ["token-1"],
      drawingIds: ["drawing-1", "template-1"],
      fogShapeIds: ["fog-1"],
      weatherMaskIds: ["weather-1"]
    });
  });

  it("returns null for tiny completed marquee selections", () => {
    const scene = createDefaultScene("Selection");

    expect(
      getCompletedSceneMarqueeSelection(
        scene,
        { start: { x: 0, y: 0 }, current: { x: 3, y: 3 } },
        { tokens: true, templates: true, fogMasks: true, weatherMasks: true, drawings: true },
        { tokens: true, drawings: true }
      )
    ).toBeNull();
  });

  it("builds completed marquee selections for meaningful drags", () => {
    const scene = createDefaultScene("Selection");
    scene.tokens = [
      { id: "token-1", name: "Token", position: { x: 10, y: 10 }, size: { width: 20, height: 20 }, hidden: false, visibleInPlayer: true }
    ];

    expect(
      getCompletedSceneMarqueeSelection(
        scene,
        { start: { x: 0, y: 0 }, current: { x: 40, y: 40 } },
        { tokens: true, templates: false, fogMasks: false, weatherMasks: false, drawings: false },
        { tokens: true, drawings: true }
      )?.tokenIds
    ).toEqual(["token-1"]);
  });

  it("honors marquee drawing/template filters and layer visibility gates", () => {
    const scene = createDefaultScene("Selection");
    scene.tokens = [
      { id: "token-1", name: "Token", position: { x: 10, y: 10 }, size: { width: 20, height: 20 }, hidden: false, visibleInPlayer: true }
    ];
    scene.drawings = [
      { id: "drawing-1", kind: "line", points: [{ x: 20, y: 20 }], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true },
      { id: "template-1", kind: "circle", points: [{ x: 25, y: 25 }], color: "#fff", opacity: 1, strokeWidth: 8, visibleInPlayer: true, measurementLabelVisible: true }
    ];

    expect(
      getSceneMarqueeSelection(
        scene,
        { x: 0, y: 0, width: 40, height: 40 },
        { tokens: true, templates: true, fogMasks: false, weatherMasks: false, drawings: false },
        { tokens: false, drawings: true }
      )
    ).toEqual({
      tokenIds: [],
      drawingIds: ["template-1"],
      fogShapeIds: [],
      weatherMaskIds: []
    });

    expect(
      getSceneMarqueeSelection(
        scene,
        { x: 0, y: 0, width: 40, height: 40 },
        { tokens: false, templates: true, fogMasks: false, weatherMasks: false, drawings: true },
        { tokens: true, drawings: false }
      ).drawingIds
    ).toEqual([]);
  });
});
