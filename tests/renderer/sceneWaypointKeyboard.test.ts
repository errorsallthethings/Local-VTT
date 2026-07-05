import { describe, expect, it } from "vitest";
import { createDefaultScene, type Token } from "../../src/shared/localvtt";
import type { TokenDragPreview } from "../../src/renderer/canvas/tokens";
import type { TokenDragState } from "../../src/renderer/canvas/scene";
import {
  getRulerWaypointAppendKeyboardAction,
  getRulerWaypointAppendKeyboardUpdate,
  getTokenWaypointAppendKeyboardAction,
  getTokenWaypointAppendKeyboardUpdate
} from "../../src/renderer/components/scene/sceneWaypointKeyboard";

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

describe("scene waypoint keyboard helpers", () => {
  it("appends token waypoints only for fresh Shift key presses", () => {
    const scene = createDefaultScene("Token Keyboard Waypoints");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;
    const sceneToken = token();
    scene.tokens = [sceneToken];
    const drag: TokenDragState = {
      pointerId: 1,
      tokenId: sceneToken.id,
      offset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      waypoints: [],
      groupStartPositions: new Map([[sceneToken.id, { x: 0, y: 0 }]])
    };
    const preview: TokenDragPreview = {
      tokenId: sceneToken.id,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 130, y: 135 },
      snappedPosition: { x: 125, y: 125 },
      waypoints: [],
      tokenPositions: new Map([[sceneToken.id, { x: 125, y: 125 }]])
    };

    expect(getTokenWaypointAppendKeyboardUpdate(scene, drag, preview, { key: "Alt", repeat: false })).toBeNull();
    expect(getTokenWaypointAppendKeyboardUpdate(scene, drag, preview, { key: "Shift", repeat: true })).toBeNull();

    const update = getTokenWaypointAppendKeyboardUpdate(scene, drag, preview, { key: "Shift", repeat: false });

    expect(update?.drag.waypoints).toEqual([{ x: 125, y: 125 }]);
    expect(update?.preview?.waypoints).toEqual([{ x: 125, y: 125 }]);
  });

  it("ignores token waypoint keyboard updates without an active drag or matching preview", () => {
    const scene = createDefaultScene("Inactive Token Keyboard Waypoints");

    expect(getTokenWaypointAppendKeyboardUpdate(scene, null, null, { key: "Shift", repeat: false })).toBeNull();
  });

  it("maps token waypoint keyboard updates to SceneCanvas actions", () => {
    const scene = createDefaultScene("Token Keyboard Actions");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;
    const sceneToken = token();
    scene.tokens = [sceneToken];
    const drag: TokenDragState = {
      pointerId: 1,
      tokenId: sceneToken.id,
      offset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      waypoints: [],
      groupStartPositions: new Map([[sceneToken.id, { x: 0, y: 0 }]])
    };
    const preview: TokenDragPreview = {
      tokenId: sceneToken.id,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 130, y: 135 },
      snappedPosition: { x: 125, y: 125 },
      waypoints: [],
      tokenPositions: new Map([[sceneToken.id, { x: 125, y: 125 }]])
    };

    expect(getTokenWaypointAppendKeyboardAction(scene, drag, preview, { key: "Alt", repeat: false })).toEqual({ kind: "none" });
    expect(getTokenWaypointAppendKeyboardAction(scene, drag, preview, { key: "Shift", repeat: false })).toMatchObject({
      kind: "set-token-waypoint",
      update: {
        drag: { waypoints: [{ x: 125, y: 125 }] },
        preview: { waypoints: [{ x: 125, y: 125 }] }
      }
    });
  });

  it("appends ruler waypoints only for fresh Shift key presses", () => {
    const scene = createDefaultScene("Ruler Keyboard Waypoints");
    scene.grid.type = "gridless";
    const rulerDrag = {
      start: { x: 0, y: 0 },
      current: { x: 30, y: 40 },
      waypoints: []
    };

    expect(getRulerWaypointAppendKeyboardUpdate(scene, rulerDrag, { key: "Alt", repeat: false })).toBeNull();
    expect(getRulerWaypointAppendKeyboardUpdate(scene, rulerDrag, { key: "Shift", repeat: true })).toBeNull();

    const nextRulerDrag = getRulerWaypointAppendKeyboardUpdate(scene, rulerDrag, { key: "Shift", repeat: false });

    expect(nextRulerDrag?.current).toEqual({ x: 30, y: 40 });
    expect(nextRulerDrag?.waypoints).toEqual([{ x: 30, y: 40 }]);
  });

  it("uses Ctrl or Cmd to snap ruler waypoint keyboard updates", () => {
    const scene = createDefaultScene("Snapped Ruler Keyboard Waypoints");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;
    const rulerDrag = {
      start: { x: 0, y: 0 },
      current: { x: 130, y: 130 },
      waypoints: []
    };

    expect(getRulerWaypointAppendKeyboardUpdate(scene, rulerDrag, { key: "Shift", repeat: false, ctrlKey: true })?.waypoints).toEqual([{ x: 150, y: 150 }]);
    expect(getRulerWaypointAppendKeyboardUpdate(scene, rulerDrag, { key: "Shift", repeat: false, metaKey: true })?.waypoints).toEqual([{ x: 150, y: 150 }]);
  });

  it("maps ruler waypoint keyboard updates to SceneCanvas actions", () => {
    const scene = createDefaultScene("Ruler Keyboard Actions");
    scene.grid.type = "gridless";
    const rulerDrag = {
      start: { x: 0, y: 0 },
      current: { x: 30, y: 40 },
      waypoints: []
    };

    expect(getRulerWaypointAppendKeyboardAction(scene, rulerDrag, { key: "Alt", repeat: false })).toEqual({ kind: "none" });
    expect(getRulerWaypointAppendKeyboardAction(scene, rulerDrag, { key: "Shift", repeat: false })).toEqual({
      kind: "set-ruler-waypoint",
      drag: {
        start: { x: 0, y: 0 },
        current: { x: 30, y: 40 },
        waypoints: [{ x: 30, y: 40 }]
      }
    });
  });
});
