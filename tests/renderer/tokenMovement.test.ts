import { describe, expect, it } from "vitest";
import { createDefaultScene, type Token } from "../../src/shared/localvtt";
import {
  getSceneAfterTokenDrag,
  getTokenDragStart,
  getTokenDragPreviewFromPoint,
  getTokenDragWithAppendedWaypoint,
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

  it("builds scene updates and sync movement paths after token drags", () => {
    const scene = createDefaultScene("Drag");
    const sceneToken = token({ position: { x: 0, y: 0 } });
    scene.tokens = [sceneToken];

    const result = getSceneAfterTokenDrag(
      scene,
      {
        pointerId: 1,
        tokenId: sceneToken.id,
        offset: { x: 0, y: 0 },
        startPosition: { x: 0, y: 0 },
        waypoints: [{ x: 50, y: 0 }],
        groupStartPositions: new Map([[sceneToken.id, { x: 0, y: 0 }]])
      },
      sceneToken,
      {
        tokenId: sceneToken.id,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 100, y: 100 },
        snappedPosition: { x: 100, y: 100 },
        waypoints: [{ x: 50, y: 0 }],
        tokenPositions: new Map([[sceneToken.id, { x: 100, y: 100 }]])
      }
    );

    expect(result.scene.tokens[0].position).toEqual({ x: 100, y: 100 });
    expect(result.syncScene?.tokenMovementPath).toEqual({
      tokenId: sceneToken.id,
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 100 }
      ]
    });
  });

  it("falls back to current token position when there is no matching drag preview", () => {
    const scene = createDefaultScene("Drag");
    const sceneToken = token({ position: { x: 25, y: 40 } });
    scene.tokens = [sceneToken];

    const result = getSceneAfterTokenDrag(
      scene,
      {
        pointerId: 1,
        tokenId: sceneToken.id,
        offset: { x: 0, y: 0 },
        startPosition: { x: 0, y: 0 },
        waypoints: [],
        groupStartPositions: new Map([[sceneToken.id, { x: 0, y: 0 }]])
      },
      sceneToken,
      null
    );

    expect(result.scene.tokens[0].position).toEqual({ x: 25, y: 40 });
    expect(result.syncScene?.tokenMovementPath?.points).toEqual([{ x: 0, y: 0 }, { x: 25, y: 40 }]);
  });

  it("builds token drag previews from pointer position and group starts", () => {
    const scene = createDefaultScene("Drag Preview");
    scene.grid.type = "gridless";
    const sceneToken = token({ position: { x: 10, y: 20 } });

    const preview = getTokenDragPreviewFromPoint(
      scene,
      {
        pointerId: 1,
        tokenId: sceneToken.id,
        offset: { x: 3, y: 4 },
        startPosition: { x: 10, y: 20 },
        waypoints: [{ x: 30, y: 40 }],
        groupStartPositions: new Map([
          [sceneToken.id, { x: 10, y: 20 }],
          ["token-2", { x: 50, y: 60 }]
        ])
      },
      sceneToken,
      { x: 23, y: 34 }
    );

    expect(preview).toMatchObject({
      tokenId: sceneToken.id,
      startPosition: { x: 10, y: 20 },
      currentPosition: { x: 20, y: 30 },
      snappedPosition: { x: 20, y: 30 },
      waypoints: [{ x: 30, y: 40 }]
    });
    expect(preview.tokenPositions).toEqual(
      new Map([
        [sceneToken.id, { x: 20, y: 30 }],
        ["token-2", { x: 60, y: 70 }]
      ])
    );
  });

  it("builds initial token drag state and preview from pointer position", () => {
    const scene = createDefaultScene("Drag Start");
    scene.grid.type = "gridless";
    const sceneToken = token({ position: { x: 10, y: 20 } });
    scene.tokens = [sceneToken, token({ id: "token-2", position: { x: 50, y: 60 } })];

    const result = getTokenDragStart(scene, sceneToken, { x: 13, y: 24 }, 7, [sceneToken.id, "token-2"]);

    expect(result.drag).toMatchObject({
      pointerId: 7,
      tokenId: sceneToken.id,
      startPosition: { x: 10, y: 20 },
      waypoints: [],
      offset: { x: 3, y: 4 }
    });
    expect(result.drag.groupStartPositions).toEqual(
      new Map([
        [sceneToken.id, { x: 10, y: 20 }],
        ["token-2", { x: 50, y: 60 }]
      ])
    );
    expect(result.preview).toMatchObject({
      tokenId: sceneToken.id,
      startPosition: { x: 10, y: 20 },
      currentPosition: { x: 10, y: 20 },
      snappedPosition: { x: 10, y: 20 },
      waypoints: []
    });
    expect(result.preview.tokenPositions).toBe(result.drag.groupStartPositions);
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

  it("appends snapped token drag waypoints", () => {
    const scene = createDefaultScene("Waypoint");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;
    const sceneToken = token({ size: { width: 50, height: 50 } });
    const drag = {
      pointerId: 1,
      tokenId: sceneToken.id,
      offset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      waypoints: [],
      groupStartPositions: new Map([[sceneToken.id, { x: 0, y: 0 }]])
    };

    const nextDrag = getTokenDragWithAppendedWaypoint(scene, drag, sceneToken, { x: 130, y: 135 });

    expect(nextDrag).not.toBe(drag);
    expect(nextDrag.waypoints).toEqual([{ x: 125, y: 125 }]);
  });
});
