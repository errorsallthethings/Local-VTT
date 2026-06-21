import { describe, expect, it } from "vitest";
import type { Campaign, LiveTableEvent, Scene, Token } from "../../src/shared/localvtt";
import { createDefaultCampaign, createDefaultScene } from "../../src/shared/localvtt";
import {
  getPlayerDisplayScale,
  getRulerDragWithAppendedWaypoint,
  getRulerLabel,
  getTokenCenterPoint,
  getTokenMoveLabel,
  isDuplicateRulerWaypoint,
  isVisibleDiceOverlayEvent,
  shouldShowDiceOverlay
} from "../../src/renderer/canvas/live-table/liveTableState";

function token(overrides: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Token",
    position: { x: 0, y: 0 },
    size: { width: 20, height: 30 },
    hidden: false,
    visibleInPlayer: true,
    ...overrides
  };
}

function diceEvent(overrides: Partial<Extract<LiveTableEvent, { type: "dice" }>> = {}): Extract<LiveTableEvent, { type: "dice" }> {
  return {
    id: "dice-1",
    type: "dice",
    die: "d20",
    result: 12,
    label: "12",
    seed: 123,
    createdAt: 1000,
    ...overrides
  };
}

describe("live table state helpers", () => {
  it("labels ruler distance and straight-line distance when grid mode differs", () => {
    const scene = createDefaultScene("Ruler");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "manhattan" };

    expect(getRulerLabel({ start: { x: 0, y: 0 }, current: { x: 300, y: 400 }, waypoints: [] }, scene)).toEqual({
      primary: "35 feet",
      secondary: "Straight: 25 feet"
    });
  });

  it("labels token movement from token centers across waypoints", () => {
    const scene = createDefaultScene("Token Move");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.measurement = { unit: "feet", unitsPerGridCell: 5, distanceMode: "euclidean" };
    scene.tokens = [token({ position: { x: 10, y: 20 }, size: { width: 20, height: 20 } })];

    expect(
      getTokenMoveLabel(scene, {
        tokenId: "token-1",
        startPosition: { x: 10, y: 20 },
        snappedPosition: { x: 310, y: 420 },
        waypoints: []
      })
    ).toBe("25 feet");
    expect(getTokenMoveLabel(scene, { tokenId: "missing", startPosition: { x: 0, y: 0 }, snappedPosition: { x: 10, y: 10 }, waypoints: [] })).toBeNull();
  });

  it("computes token centers from arbitrary positions", () => {
    expect(getTokenCenterPoint(token(), { x: 100, y: 200 })).toEqual({ x: 110, y: 215 });
  });

  it("computes player display scale only for player view with valid calibration", () => {
    const campaign: Campaign = createDefaultCampaign("Campaign");
    const scene: Scene = createDefaultScene("Scene");
    campaign.playerDisplay.physicalScaleEnabled = true;
    campaign.playerDisplay.pixelsPerInch = 96;
    campaign.playerDisplay.inchesPerGridCell = 1;
    scene.grid.sizePx = 48;

    expect(getPlayerDisplayScale(campaign, scene, "player")).toBe(2);
    expect(getPlayerDisplayScale(campaign, scene, "gm")).toBe(1);
    expect(getPlayerDisplayScale({ ...campaign, playerDisplay: { ...campaign.playerDisplay, physicalScaleEnabled: false } }, scene, "player")).toBe(1);
    expect(getPlayerDisplayScale(campaign, { ...scene, grid: { ...scene.grid, sizePx: 0 } }, "player")).toBe(1);
  });

  it("uses current dice display modes before legacy presentation fields", () => {
    expect(shouldShowDiceOverlay(diceEvent({ gmDiceDisplay: "panel" }), "gm")).toBe(true);
    expect(shouldShowDiceOverlay(diceEvent({ playerDiceDisplay: "hidden", playerPresentation: "3d" }), "player")).toBe(false);
    expect(shouldShowDiceOverlay(diceEvent({ gmPresentation: "3d" }), "gm")).toBe(true);
    expect(shouldShowDiceOverlay(diceEvent({ gmPresentation: "result" }), "gm")).toBe(false);
    expect(shouldShowDiceOverlay(diceEvent({ presentation: "3d" }), "player")).toBe(true);
  });

  it("filters visible dice overlay events by view", () => {
    const ping: LiveTableEvent = { id: "ping", type: "ping", point: { x: 0, y: 0 }, createdAt: 1 };
    const hiddenDice = diceEvent({ playerDiceDisplay: "hidden" });
    const panelDice = diceEvent({ id: "panel", playerDiceDisplay: "panel" });

    expect(isVisibleDiceOverlayEvent(ping, "player")).toBe(false);
    expect(isVisibleDiceOverlayEvent(hiddenDice, "player")).toBe(false);
    expect(isVisibleDiceOverlayEvent(panelDice, "player")).toBe(true);
  });

  it("uses a forgiving duplicate ruler waypoint distance on gridless scenes", () => {
    const scene = createDefaultScene("Gridless Ruler");
    scene.grid.type = "gridless";

    expect(isDuplicateRulerWaypoint({ x: 0, y: 0 }, { x: 12, y: 0 }, scene)).toBe(true);
    expect(isDuplicateRulerWaypoint({ x: 0, y: 0 }, { x: 13, y: 0 }, scene)).toBe(false);
  });

  it("uses a strict duplicate ruler waypoint distance on gridded scenes", () => {
    const scene = createDefaultScene("Square Ruler");
    scene.grid.type = "square";

    expect(isDuplicateRulerWaypoint({ x: 0, y: 0 }, { x: 2, y: 0 }, scene)).toBe(true);
    expect(isDuplicateRulerWaypoint({ x: 0, y: 0 }, { x: 3, y: 0 }, scene)).toBe(false);
  });

  it("appends snapped ruler waypoints", () => {
    const scene = createDefaultScene("Square Ruler");
    scene.grid.type = "square";
    scene.grid.sizePx = 100;
    scene.grid.offsetX = 0;
    scene.grid.offsetY = 0;
    const rulerDrag = {
      start: { x: 0, y: 0 },
      current: { x: 130, y: 130 },
      waypoints: []
    };

    const nextRulerDrag = getRulerDragWithAppendedWaypoint(scene, rulerDrag, true);

    expect(nextRulerDrag).not.toBe(rulerDrag);
    expect(nextRulerDrag.current).toEqual({ x: 150, y: 150 });
    expect(nextRulerDrag.waypoints).toEqual([{ x: 150, y: 150 }]);
  });
});
