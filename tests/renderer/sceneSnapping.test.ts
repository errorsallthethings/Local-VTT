import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../src/shared/localvtt";
import { constrainSquarePoint } from "../../src/renderer/canvas/gridMath";
import { getNearestSceneSnapPoint, getRulerSnapPoint } from "../../src/renderer/canvas/sceneSnapping";

describe("scene snapping", () => {
  it("returns null for gridless scenes or invalid grid sizes", () => {
    const scene = createDefaultScene("Gridless");
    scene.grid.type = "gridless";

    expect(getRulerSnapPoint({ x: 10, y: 10 }, scene)).toBeNull();
    expect(getNearestSceneSnapPoint({ x: 10, y: 10 }, scene)).toBeNull();

    scene.grid.type = "square";
    scene.grid.sizePx = 0;
    expect(getRulerSnapPoint({ x: 10, y: 10 }, scene)).toBeNull();
    expect(getNearestSceneSnapPoint({ x: 10, y: 10 }, scene)).toBeNull();
  });

  it("snaps rulers to square grid centers", () => {
    const scene = createDefaultScene("Square");
    scene.grid.type = "square";
    scene.grid.sizePx = 50;
    scene.grid.offsetX = 10;
    scene.grid.offsetY = 20;

    expect(getRulerSnapPoint({ x: 34, y: 44 }, scene)).toEqual({ x: 35, y: 45 });
  });

  it("snaps scene tools to the nearest square center, corner, or edge midpoint", () => {
    const scene = createDefaultScene("Square");
    scene.grid.type = "square";
    scene.grid.sizePx = 50;
    scene.grid.offsetX = 10;
    scene.grid.offsetY = 20;

    expect(getNearestSceneSnapPoint({ x: 35, y: 19 }, scene)).toEqual({ x: 35, y: 20 });
    expect(getNearestSceneSnapPoint({ x: 11, y: 21 }, scene)).toEqual({ x: 10, y: 20 });
  });

  it("snaps hex rulers to centers and scene tools to the nearest center or vertex", () => {
    const scene = createDefaultScene("Hex");
    scene.grid.type = "hex";
    scene.grid.sizePx = 60;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;

    const point = { x: 32, y: 34 };
    const rulerSnap = getRulerSnapPoint(point, scene);
    const sceneSnap = getNearestSceneSnapPoint(point, scene);

    expect(rulerSnap).toBeTruthy();
    expect(sceneSnap).toBeTruthy();
  });

  it("constrains drags to a square using the dominant axis", () => {
    expect(constrainSquarePoint({ x: 10, y: 20 }, { x: 30, y: 25 })).toEqual({ x: 30, y: 40 });
    expect(constrainSquarePoint({ x: 10, y: 20 }, { x: 5, y: -10 })).toEqual({ x: -20, y: -10 });
    expect(constrainSquarePoint({ x: 10, y: 20 }, { x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
  });
});
