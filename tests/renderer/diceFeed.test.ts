import { describe, expect, it } from "vitest";
import type { DiceRollEvent } from "../../src/renderer/lib/dice";
import {
  DICE_PANEL_REVEAL_DELAY_MS,
  formatDiceFeedBreakdown,
  formatDiceFeedBreakdownTooltip,
  formatDiceFeedLabel,
  getDiceFeedTone,
  isPendingRecentDiceRoll
} from "../../src/renderer/lib/dice";

function diceRoll(overrides: Partial<DiceRollEvent> = {}): DiceRollEvent {
  return {
    id: "roll-1",
    type: "dice",
    die: "d20",
    result: 20,
    label: "20",
    seed: 0.5,
    createdAt: 1_000,
    ...overrides
  };
}

describe("dice feed helpers", () => {
  it("keeps unrevealed panel rolls pending during the reveal delay", () => {
    const roll = diceRoll({ gmDiceDisplay: "panel" });
    const now = roll.createdAt + DICE_PANEL_REVEAL_DELAY_MS - 1;

    expect(isPendingRecentDiceRoll(roll, 0, now)).toBe(true);
    expect(formatDiceFeedLabel(roll, 0, now)).toBe("Rolling");
    expect(formatDiceFeedBreakdown(roll, 0, now)).toBe("Waiting for dice to settle");
    expect(formatDiceFeedBreakdownTooltip(roll, 0, now)).toBeUndefined();
    expect(getDiceFeedTone(roll, 0, now)).toBe("normal");
  });

  it("reveals panel rolls after the delay", () => {
    const roll = diceRoll({ gmDiceDisplay: "panel" });
    const now = roll.createdAt + DICE_PANEL_REVEAL_DELAY_MS;

    expect(isPendingRecentDiceRoll(roll, 0, now)).toBe(false);
    expect(formatDiceFeedLabel(roll, 0, now)).toBe("20");
    expect(formatDiceFeedBreakdown(roll, 0, now)).toBe("20");
    expect(getDiceFeedTone(roll, 0, now)).toBe("critical");
  });

  it("keeps scene rolls pending until the scene resolved label is available", () => {
    const pending = diceRoll({ gmDiceDisplay: "scene" });
    const resolved = diceRoll({ gmDiceDisplay: "scene", sceneResolvedLabel: "20" });

    expect(isPendingRecentDiceRoll(pending, 0, Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(isPendingRecentDiceRoll(resolved, 0, resolved.createdAt)).toBe(false);
  });

  it("uses dice breakdown helpers for revealed visual dice", () => {
    const roll = diceRoll({
      result: 23,
      label: "23",
      dice: [
        { die: "d20", result: 20, label: "20", seed: 0.2 },
        { die: "d4", result: 3, label: "3", seed: 0.3 }
      ]
    });

    expect(formatDiceFeedBreakdown(roll, 0, roll.createdAt)).toBe("20 + 3");
    expect(formatDiceFeedBreakdownTooltip(roll, 0, roll.createdAt)).toBeUndefined();
  });
});
