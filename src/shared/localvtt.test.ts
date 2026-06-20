import { describe, expect, it } from "vitest";
import { createDefaultScene, normalizeScene } from "./localvtt";

describe("localvtt scene normalization", () => {
  it("preserves and defaults weather mask player visibility", () => {
    const scene = normalizeScene({
      ...createDefaultScene("Scene"),
      weather: {
        ...createDefaultScene("Scene").weather,
        masks: [
          { id: "mask-1", kind: "rectangle", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], visible: true, visibleInPlayer: false },
          { id: "mask-2", kind: "rectangle", points: [{ x: 2, y: 2 }, { x: 3, y: 3 }], visible: true }
        ]
      }
    });

    expect(scene.weather.masks.map((mask) => mask.visibleInPlayer)).toEqual([false, true]);
  });
});
