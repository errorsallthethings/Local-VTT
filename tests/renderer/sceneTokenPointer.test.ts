import { describe, expect, it } from "vitest";
import { createDefaultScene, type Token } from "../../src/shared/localvtt";
import type { TokenDragState } from "../../src/renderer/canvas/scene";
import { getTokenPointerMove, getTokenPointerMoveAction, getTokenPointerStart } from "../../src/renderer/components/scene/sceneTokenPointer";

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

describe("scene token pointer helpers", () => {
  it("returns a selector hit without starting a drag", () => {
    const scene = createDefaultScene("Selector Token");
    const sceneToken = token();
    scene.tokens = [sceneToken];

    const start = getTokenPointerStart({
      canShowTokens: true,
      mouseBehavior: "selector",
      point: { x: 10, y: 10 },
      pointerId: 3,
      scene,
      selectedTokenIds: []
    });

    expect(start?.token.id).toBe(sceneToken.id);
    expect(start?.dragGroup).toEqual({ itemIds: [sceneToken.id], draggingSelectedGroup: false, shouldSelectHitItem: true });
    expect(start?.dragStart).toBeNull();
  });

  it("starts grabber drags for token hits and preserves selected token groups", () => {
    const scene = createDefaultScene("Grabber Token");
    const first = token({ id: "token-1", position: { x: 0, y: 0 } });
    const second = token({ id: "token-2", position: { x: 100, y: 0 } });
    scene.tokens = [first, second];

    const start = getTokenPointerStart({
      canShowTokens: true,
      mouseBehavior: "grabber",
      point: { x: 10, y: 10 },
      pointerId: 3,
      scene,
      selectedTokenIds: ["token-1", "token-2"]
    });

    expect(start?.dragGroup).toEqual({ itemIds: ["token-1", "token-2"], draggingSelectedGroup: true, shouldSelectHitItem: false });
    expect(start?.dragStart?.drag.tokenId).toBe("token-1");
    expect([...start?.dragStart?.drag.groupStartPositions.keys() ?? []]).toEqual(["token-1", "token-2"]);
    expect(start?.dragStart?.preview.tokenPositions.size).toBe(2);
  });

  it("ignores starts when tokens are hidden or no token is hit", () => {
    const scene = createDefaultScene("Hidden Token");
    scene.tokens = [token()];

    expect(
      getTokenPointerStart({
        canShowTokens: false,
        mouseBehavior: "grabber",
        point: { x: 10, y: 10 },
        pointerId: 3,
        scene,
        selectedTokenIds: []
      })
    ).toBeNull();
    expect(
      getTokenPointerStart({
        canShowTokens: true,
        mouseBehavior: "grabber",
        point: { x: 500, y: 500 },
        pointerId: 3,
        scene,
        selectedTokenIds: []
      })
    ).toBeNull();
  });

  it("updates matching token drags and reports missing tokens", () => {
    const scene = createDefaultScene("Move Token");
    const sceneToken = token({ position: { x: 0, y: 0 } });
    scene.tokens = [sceneToken];
    const drag: TokenDragState = {
      pointerId: 3,
      tokenId: sceneToken.id,
      offset: { x: 5, y: 5 },
      startPosition: { x: 0, y: 0 },
      waypoints: [],
      groupStartPositions: new Map([[sceneToken.id, { x: 0, y: 0 }]])
    };

    expect(getTokenPointerMove(null, drag, 3, { x: 40, y: 45 })).toBeNull();
    expect(getTokenPointerMove(scene, drag, 4, { x: 40, y: 45 })).toBeNull();
    expect(getTokenPointerMove({ ...scene, tokens: [] }, drag, 3, { x: 40, y: 45 })).toEqual({ kind: "missing-token", tokenId: sceneToken.id });
    expect(getTokenPointerMove(scene, drag, 3, { x: 40, y: 45 })).toMatchObject({
      kind: "preview",
      preview: {
        tokenId: sceneToken.id,
        currentPosition: { x: 35, y: 40 }
      }
    });
  });

  it("maps token pointer move outcomes to SceneCanvas actions", () => {
    const scene = createDefaultScene("Move Action Token");
    const sceneToken = token({ position: { x: 0, y: 0 } });
    scene.tokens = [sceneToken];
    const drag: TokenDragState = {
      pointerId: 3,
      tokenId: sceneToken.id,
      offset: { x: 5, y: 5 },
      startPosition: { x: 0, y: 0 },
      waypoints: [],
      groupStartPositions: new Map([[sceneToken.id, { x: 0, y: 0 }]])
    };

    const previewMove = getTokenPointerMove(scene, drag, 3, { x: 40, y: 45 });

    expect(getTokenPointerMoveAction(null)).toEqual({ kind: "none" });
    expect(getTokenPointerMoveAction({ kind: "missing-token", tokenId: sceneToken.id })).toEqual({ kind: "cancel-drag" });
    expect(getTokenPointerMoveAction(previewMove)).toMatchObject({
      kind: "set-preview",
      preview: {
        tokenId: sceneToken.id,
        currentPosition: { x: 35, y: 40 }
      }
    });
  });
});
