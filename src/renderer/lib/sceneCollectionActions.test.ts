import { describe, expect, it } from "vitest";
import { createDefaultScene } from "../../shared/localvtt";
import { removeLastDrawing, removeLastEnvironmentEffect, removeLastWeatherMask } from "./sceneCollectionActions";

describe("scene collection actions", () => {
  it("removes the last weather mask", () => {
    const scene = {
      ...createDefaultScene("Scene"),
      weather: {
        ...createDefaultScene("Scene").weather,
        masks: [
          { id: "mask-1", name: "Mask 1", kind: "rectangle" as const, visible: true, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
          { id: "mask-2", name: "Mask 2", kind: "rectangle" as const, visible: true, points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] }
        ]
      }
    };

    expect(removeLastWeatherMask(scene, "now").weather.masks.map((mask) => mask.id)).toEqual(["mask-1"]);
  });

  it("removes the last environment effect", () => {
    const scene = {
      ...createDefaultScene("Scene"),
      environment: {
        effects: [
          {
            id: "effect-1",
            name: "Effect 1",
            kind: "rectangle" as const,
            effect: "water" as const,
            visibleInGm: true,
            visibleInPlayer: true,
            points: [{ x: 0, y: 0 }, { x: 1, y: 1 }]
          },
          {
            id: "effect-2",
            name: "Effect 2",
            kind: "rectangle" as const,
            effect: "fire" as const,
            visibleInGm: true,
            visibleInPlayer: true,
            points: [{ x: 1, y: 1 }, { x: 2, y: 2 }]
          }
        ]
      }
    };

    expect(removeLastEnvironmentEffect(scene, "now").environment.effects.map((effect) => effect.id)).toEqual(["effect-1"]);
  });

  it("removes the last drawing", () => {
    const scene = {
      ...createDefaultScene("Scene"),
      drawings: [
        {
          id: "drawing-1",
          kind: "line" as const,
          points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
          color: "#ffffff",
          strokeWidth: 1,
          opacity: 1,
          visibleInGm: true,
          visibleInPlayer: true
        },
        {
          id: "drawing-2",
          kind: "line" as const,
          points: [{ x: 2, y: 2 }, { x: 3, y: 3 }],
          color: "#ffffff",
          strokeWidth: 1,
          opacity: 1,
          visibleInGm: true,
          visibleInPlayer: true
        }
      ]
    };

    expect(removeLastDrawing(scene, "now").drawings.map((drawing) => drawing.id)).toEqual(["drawing-1"]);
  });
});
