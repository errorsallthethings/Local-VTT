import { describe, expect, it } from "vitest";
import {
  getDisplayedRollLabel,
  getDisplayedRollSummary,
  getPublishedSceneResolvedLabel,
  getResolvedDieValue,
  getResolvedDisplayedLabel,
  getResolvedDisplayedSummary,
  getRollModifier,
  getRollingSummary,
  getShuffledRollLabel,
  getVisualDice,
  getVisualResultFaceLabel,
  hasPercentileDice,
  shouldUnderlineResultLabel,
  type DiceRollEvent,
  type ResolvedDiceResult
} from "../../src/renderer/lib/dice";

function diceEvent(overrides: Partial<DiceRollEvent> = {}): DiceRollEvent {
  return {
    id: "roll-1",
    type: "dice",
    die: "d6",
    result: 4,
    label: "4",
    seed: 0.42,
    createdAt: 1000,
    ...overrides
  };
}

describe("dice roll label helpers", () => {
  it("marks ambiguous numeric result labels for underlining", () => {
    expect(shouldUnderlineResultLabel("6")).toBe(true);
    expect(shouldUnderlineResultLabel("9")).toBe(true);
    expect(shouldUnderlineResultLabel("10")).toBe(false);
    expect(shouldUnderlineResultLabel("Heads")).toBe(false);
  });

  it("prefers scene resolved labels and summaries when present", () => {
    const event = diceEvent({
      label: "7",
      sceneResolvedLabel: "12",
      sceneResolvedSummary: "D20 12"
    });

    expect(getDisplayedRollLabel(event)).toBe("12");
    expect(getDisplayedRollSummary(event)).toBe("D20 12");
  });

  it("applies original roll modifiers to resolved physics totals", () => {
    const event = diceEvent({
      result: 10,
      label: "10",
      dice: [
        { die: "d6", result: 4, label: "4", seed: 0.1 },
        { die: "d6", result: 3, label: "3", seed: 0.2 }
      ]
    });
    const resolved: ResolvedDiceResult = {
      label: "8",
      summary: "D6 5 + D6 3",
      result: 8,
      dice: [
        { label: "5", value: 5 },
        { label: "3", value: 3 }
      ]
    };

    expect(getRollModifier(event)).toBe(3);
    expect(getResolvedDisplayedLabel(event, resolved)).toBe("11");
    expect(getResolvedDisplayedSummary(event, resolved)).toBe("D6 5 + D6 3 8 + 3");
  });

  it("keeps rolling summaries readable for formulas, roll labels, and percentile dice", () => {
    expect(getRollingSummary(diceEvent({ rollLabel: "Attack", formula: "1D20+5" }))).toBe("Attack: 1D20+5");
    expect(
      getRollingSummary(
        diceEvent({
          die: "d00",
          result: 57,
          label: "57",
          dice: [
            { die: "d00", result: 50, label: "50", seed: 0.1 },
            { die: "d10", result: 7, label: "7", seed: 0.2 }
          ]
        })
      )
    ).toBe("D%");
    expect(
      getRollingSummary(
        diceEvent({
          rollLabel: "Damage",
          dice: [
            { die: "d6", result: 2, label: "2", seed: 0.1 },
            { die: "d8", result: 5, label: "5", seed: 0.2 }
          ]
        })
      )
    ).toBe("Damage: D6 + D8");
  });

  it("shuffles placeholder labels while respecting dropped dice", () => {
    const keptOnly = diceEvent({
      die: "d6",
      result: 4,
      label: "4",
      dice: [
        { die: "d6", result: 4, label: "4", seed: 0.25, kept: true },
        { die: "d6", result: 1, label: "1", seed: 0.75, kept: false }
      ]
    });

    expect(Number(getShuffledRollLabel(keptOnly, 0))).toBeGreaterThanOrEqual(1);
    expect(Number(getShuffledRollLabel(keptOnly, 0))).toBeLessThanOrEqual(6);
    expect(["Heads", "Tails"]).toContain(getShuffledRollLabel(diceEvent({ die: "coin", result: 1, label: "Heads" }), 2));
  });

  it("normalizes visual face labels for physical dice faces", () => {
    expect(getVisualResultFaceLabel({ die: "d10", result: 10, label: "10", seed: 0 })).toBe("0");
    expect(getVisualResultFaceLabel({ die: "d00", result: 100, label: "100", seed: 0 })).toBe("00");
    expect(getVisualResultFaceLabel({ die: "d8", result: 8, label: "8", seed: 0 })).toBe("8");
  });

  it("formats published scene labels for coins and numeric dice", () => {
    const coin = diceEvent({ die: "coin", result: 1, label: "Heads" });
    const resolvedCoin: ResolvedDiceResult = {
      label: "Heads",
      summary: "Coin",
      result: 1,
      dice: [{ label: "Heads", value: 1 }]
    };

    expect(getPublishedSceneResolvedLabel(coin, resolvedCoin, 1)).toBe("Heads (1)");
    expect(getPublishedSceneResolvedLabel(diceEvent(), { ...resolvedCoin, label: "4", result: 4 }, 4)).toBe("4");
  });

  it("exposes dice fallbacks and resolved die values", () => {
    expect(getVisualDice(diceEvent())).toEqual([{ die: "d6", result: 4, label: "4", seed: 0.42 }]);
    expect(hasPercentileDice([{ die: "d00", result: 100, label: "00", seed: 0 }, { die: "d10", result: 10, label: "0", seed: 1 }])).toBe(true);
    expect(getResolvedDieValue({ die: "coin", result: 2, label: "Tails", seed: 0 })).toBe(2);
    expect(getResolvedDieValue({ die: "d10", result: 10, label: "0", seed: 0 })).toBe(10);
    expect(getResolvedDieValue({ die: "d00", result: 100, label: "00", seed: 0 })).toBe(100);
  });
});
