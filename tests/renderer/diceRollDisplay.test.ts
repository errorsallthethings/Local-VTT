import { describe, expect, it } from "vitest";
import {
  COIN_SCENE_SETTLE_DURATION_MS,
  DICE_EVENT_DURATION_MS,
  DICE_RESULTS_SHUFFLE_DURATION_MS,
  DICE_SCENE_EVENT_DURATION_MS,
  DICE_SETTLE_DURATION_MS,
  getDiceDisplayMode,
  getDiceEventDuration,
  getDicePanelPlacement,
  getDiceRevealDelay,
  getDiceSceneSize,
  getDiceSettleDuration,
  getDisplayedRollTone,
  getResolvedD20Tone,
  type DiceRollEvent,
  type ResolvedDiceResult
} from "../../src/renderer/lib/dice";

function diceEvent(overrides: Partial<DiceRollEvent> = {}): DiceRollEvent {
  return {
    id: "roll-1",
    type: "dice",
    die: "d20",
    result: 12,
    label: "12",
    seed: 0.42,
    createdAt: 1000,
    ...overrides
  };
}

describe("dice roll display helpers", () => {
  it("uses explicit display modes before legacy presentation fallbacks", () => {
    expect(getDiceDisplayMode(diceEvent({ gmDiceDisplay: "hidden", gmPresentation: "3d" }), "gm")).toBe("hidden");
    expect(getDiceDisplayMode(diceEvent({ playerPresentation: "3d" }), "player")).toBe("panel");
    expect(getDiceDisplayMode(diceEvent({ presentation: "3d" }), "gm")).toBe("panel");
    expect(getDiceDisplayMode(diceEvent(), "player")).toBe("results");
  });

  it("calculates reveal delays from display pairing and scene result state", () => {
    expect(getDiceRevealDelay(diceEvent({ gmDiceDisplay: "scene-result", sceneResolvedLabel: "18" }), "gm")).toBe(0);
    expect(getDiceRevealDelay(diceEvent({ gmDiceDisplay: "scene-result" }), "gm")).toBe(DICE_SETTLE_DURATION_MS);
    expect(getDiceRevealDelay(diceEvent({ gmDiceDisplay: "panel" }), "gm")).toBe(DICE_SETTLE_DURATION_MS);
    expect(getDiceRevealDelay(diceEvent({ gmDiceDisplay: "results", playerDiceDisplay: "panel" }), "gm")).toBe(DICE_SETTLE_DURATION_MS);
    expect(getDiceRevealDelay(diceEvent({ gmDiceDisplay: "results", playerDiceDisplay: "results" }), "gm")).toBe(DICE_RESULTS_SHUFFLE_DURATION_MS);
  });

  it("extends settle and event durations for coins and scene rolls", () => {
    expect(getDiceSettleDuration(diceEvent({ die: "coin", result: 1, label: "Heads" }))).toBe(COIN_SCENE_SETTLE_DURATION_MS);
    expect(getDiceSettleDuration(diceEvent({ die: "d6", result: 4, label: "4" }))).toBe(DICE_SETTLE_DURATION_MS);
    expect(getDiceEventDuration(diceEvent({ gmDiceDisplay: "scene" }), "gm")).toBe(DICE_SCENE_EVENT_DURATION_MS);
    expect(getDiceEventDuration(diceEvent({ gmDiceDisplay: "scene-result" }), "gm")).toBe(DICE_SCENE_EVENT_DURATION_MS);
    expect(getDiceEventDuration(diceEvent({ gmDiceDisplay: "results" }), "gm")).toBe(DICE_EVENT_DURATION_MS);
  });

  it("reads scene size and clamps advanced panel placement per view", () => {
    const event = diceEvent({
      gmDiceSceneSize: "xl",
      playerDiceSceneSize: "sm",
      gmDicePanelAdvanced: true,
      gmDicePanelEdge: "right",
      gmDicePanelFacing: "outward",
      gmDicePanelPosition: 1.7,
      playerDicePanelAdvanced: true,
      playerDicePanelEdge: "bottom",
      playerDicePanelFacing: "inward",
      playerDicePanelPosition: -0.4
    });

    expect(getDiceSceneSize(event, "gm")).toBe("xl");
    expect(getDiceSceneSize(event, "player")).toBe("sm");
    expect(getDicePanelPlacement(event, "gm")).toEqual({ advanced: true, edge: "right", facing: "outward", position: 1 });
    expect(getDicePanelPlacement(event, "player")).toEqual({ advanced: true, edge: "bottom", facing: "inward", position: 0 });
    expect(getDicePanelPlacement(diceEvent(), "gm")).toEqual({ advanced: false, edge: "top", facing: "inward", position: 0.5 });
  });

  it("keeps hidden or unresolved roll tones normal until results are visible", () => {
    expect(getDisplayedRollTone(diceEvent({ result: 20, label: "20" }), "results", false, null)).toBe("normal");
    expect(getDisplayedRollTone(diceEvent({ result: 20, label: "20" }), "results", true, null)).toBe("critical");
    expect(getDisplayedRollTone(diceEvent({ result: 1, label: "1" }), "scene-result", true, null)).toBe("fumble");
  });

  it("uses resolved scene physics results for d20 and max-face tones", () => {
    const resolvedCritical: ResolvedDiceResult = {
      label: "20",
      summary: "D20",
      result: 20,
      dice: [{ label: "20", value: 20 }]
    };
    const resolvedMax: ResolvedDiceResult = {
      label: "8",
      summary: "D8",
      result: 8,
      dice: [{ label: "8", value: 8 }]
    };

    expect(getDisplayedRollTone(diceEvent({ dice: [{ die: "d20", result: 4, label: "4", seed: 0.1 }] }), "scene", true, resolvedCritical)).toBe("critical");
    expect(getDisplayedRollTone(diceEvent({ die: "d8", dice: [{ die: "d8", result: 2, label: "2", seed: 0.1 }] }), "scene", true, resolvedMax)).toBe("max");
    expect(getDisplayedRollTone(diceEvent({ die: "coin", result: 2, label: "Tails" }), "scene", true, { ...resolvedMax, label: "Tails", result: 2 })).toBe("normal");
  });

  it("ignores dropped d20 results when resolving d20 tone", () => {
    const event = diceEvent({
      dice: [
        { die: "d20", result: 20, label: "20", seed: 0.1, kept: false },
        { die: "d20", result: 1, label: "1", seed: 0.2, kept: true }
      ]
    });

    expect(getResolvedD20Tone(event, null)).toBe("fumble");
    expect(getResolvedD20Tone(event, { label: "20", summary: "D20", result: 20, dice: [{ label: "20", value: 20, kept: false }, { label: "20", value: 20, kept: true }] })).toBe("critical");
  });
});
