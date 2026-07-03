import { describe, expect, it } from "vitest";
import { pauseSceneTurnOrder } from "../../electron/turnOrderPause";
import { createDefaultScene } from "../../src/shared/localvtt";

describe("turn order pause helpers", () => {
  it("returns null when turn order is already inactive and hidden from player view", () => {
    const scene = createDefaultScene("Calm Scene");

    expect(pauseSceneTurnOrder(scene, "2026-07-02T12:00:00.000Z")).toBeNull();
  });

  it("pauses active turn order and hides player view turn order", () => {
    const scene = createDefaultScene("Combat Scene");
    scene.turnOrder.active = true;
    scene.turnOrder.playerViewVisible = true;
    scene.updatedAt = "2026-07-02T00:00:00.000Z";

    const paused = pauseSceneTurnOrder(scene, "2026-07-02T12:00:00.000Z");

    expect(paused).toMatchObject({
      id: scene.id,
      updatedAt: "2026-07-02T12:00:00.000Z",
      turnOrder: {
        active: false,
        playerViewVisible: false
      }
    });
  });

  it("hides player view turn order even when combat is not active", () => {
    const scene = createDefaultScene("Displayed Tracker");
    scene.turnOrder.active = false;
    scene.turnOrder.playerViewVisible = true;

    const paused = pauseSceneTurnOrder(scene, "2026-07-02T12:00:00.000Z");

    expect(paused?.turnOrder.active).toBe(false);
    expect(paused?.turnOrder.playerViewVisible).toBe(false);
  });
});
