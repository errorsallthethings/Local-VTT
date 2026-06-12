import { describe, expect, it } from "vitest";
import { createDefaultScene, type Token } from "../../src/shared/localvtt";
import {
  getTokenMovementPath,
  getTokenMovementTweens,
  getTokenWaypointPosition,
  isDuplicateTokenWaypoint
} from "../../src/renderer/canvas/tokenMovement";

function token(patch: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Token",
    assetId: "asset-1",
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
    hidden: false,
    visibleInGm: true,
    visibleInPlayer: true,
    ...patch
  };
}

describe("token movement helpers", () => {
  it("builds a meaningful path from start, waypoints, and final position", () => {
    expect(
      getTokenMovementPath(
        { x: 0, y: 0 },
        [
          { x: 1, y: 1 },
          { x: 50, y: 0 }
        ],
        { x: 50, y: 50 }
      )
    ).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 }
    ]);
  });

  it("returns null for tiny token movement paths", () => {
    expect(getTokenMovementPath({ x: 0, y: 0 }, [], { x: 1, y: 1 })).toBeNull();
  });

  it("preserves GM-authored waypoint routes when creating Player View tweens", () => {
    const scene = createDefaultScene("Tween");
    scene.grid.sizePx = 50;
    scene.tokens = [token({ position: { x: 100, y: 100 } })];
    scene.tokenMovementPath = {
      tokenId: "token-1",
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 100 }
      ]
    };

    const tweens = getTokenMovementTweens([token()], scene.tokens, scene);

    expect(tweens).toEqual([
      {
        id: "token-1",
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 100 }
        ],
        distance: expect.closeTo(161.8, 1),
        durationMs: 1294
      }
    ]);
  });

  it("skips tweens when asset or token size changes", () => {
    const scene = createDefaultScene("No Tween");
    scene.tokens = [token({ position: { x: 100, y: 100 }, size: { width: 100, height: 100 } })];

    expect(getTokenMovementTweens([token()], scene.tokens, scene)).toEqual([]);
  });

  it("uses gridless token width as the movement timing unit", () => {
    const scene = createDefaultScene("Gridless");
    scene.grid.type = "gridless";
    scene.tokens = [token({ position: { x: 150, y: 0 }, size: { width: 75, height: 75 } })];

    expect(getTokenMovementTweens([token({ size: { width: 75, height: 75 } })], scene.tokens, scene)[0].durationMs).toBe(800);
  });

  it("detects duplicate waypoints using grid and gridless thresholds", () => {
    const scene = createDefaultScene("Duplicate");
    scene.grid.type = "square";
    const sceneToken = token({ size: { width: 50, height: 50 } });

    expect(isDuplicateTokenWaypoint({ x: 0, y: 0 }, { x: 1, y: 1 }, sceneToken, scene)).toBe(true);
    expect(isDuplicateTokenWaypoint({ x: 0, y: 0 }, { x: 5, y: 0 }, sceneToken, scene)).toBe(false);

    scene.grid.type = "gridless";
    expect(isDuplicateTokenWaypoint({ x: 0, y: 0 }, { x: 40, y: 0 }, sceneToken, scene)).toBe(true);
    expect(isDuplicateTokenWaypoint({ x: 0, y: 0 }, { x: 60, y: 0 }, sceneToken, scene)).toBe(false);
  });

  it("snaps square-grid token waypoints to the nearest cell center", () => {
    const scene = createDefaultScene("Square");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;
    const sceneToken = token({ size: { width: 50, height: 50 } });

    expect(getTokenWaypointPosition({ x: 30, y: 35 }, sceneToken, scene)).toEqual({ x: 25, y: 25 });
  });
});
