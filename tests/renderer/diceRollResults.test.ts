import { describe, expect, it } from "vitest";
import {
  annotateResolvedVisualDice,
  getResolvedDiceRollResult,
  getResolvedEventDice,
  getStaticRollResult,
  hasResolvedPercentileDice,
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

describe("dice roll result helpers", () => {
  it("builds coin resolved results with face labels", () => {
    expect(getResolvedDiceRollResult(diceEvent({ die: "coin", result: 1, label: "Heads" }), [{ die: "coin", result: 1, label: "Heads", seed: 0.1 }], [{ label: "Tails", value: 2 }])).toEqual({
      label: "Tails",
      summary: "Coin",
      result: 2,
      dice: [{ label: "Tails", value: 2 }]
    });
  });

  it("summarizes resolved percentile dice as D%", () => {
    const visualDice = [
      { die: "d00" as const, result: 40, label: "40", seed: 0.1 },
      { die: "d10" as const, result: 3, label: "3", seed: 0.2 }
    ];

    expect(hasResolvedPercentileDice(visualDice, [{ label: "90", value: 90 }, { label: "0", value: 10 }])).toBe(true);
    expect(getResolvedDiceRollResult(diceEvent({ die: "d00", result: 43, label: "43", dice: visualDice }), visualDice, [{ label: "90", value: 90 }, { label: "0", value: 10 }])).toMatchObject({
      label: "90",
      summary: "D%",
      result: 90,
      dice: [
        { label: "90", value: 90 },
        { label: "0", value: 10 }
      ]
    });
  });

  it("annotates resolved dice with formula keep/drop state", () => {
    const event = diceEvent({
      die: "d6",
      formula: "3D6KH2",
      result: 11,
      label: "11",
      dice: [
        { die: "d6", result: 6, label: "6", seed: 0.1 },
        { die: "d6", result: 4, label: "4", seed: 0.2 },
        { die: "d6", result: 1, label: "1", seed: 0.3 }
      ]
    });
    const resolved = annotateResolvedVisualDice(event, event.dice ?? [], [
      { label: "2", value: 2 },
      { label: "5", value: 5 },
      { label: "3", value: 3 }
    ]);

    expect(resolved.map((die) => ({ label: die.label, kept: die.kept }))).toEqual([
      { label: "2", kept: false },
      { label: "5", kept: true },
      { label: "3", kept: true }
    ]);
    expect(getResolvedDiceRollResult(event, event.dice ?? [], [{ label: "2", value: 2 }, { label: "5", value: 5 }, { label: "3", value: 3 }])).toMatchObject({
      label: "8",
      result: 8,
      dice: [
        { label: "2", value: 2, kept: false },
        { label: "5", value: 5, kept: true },
        { label: "3", value: 3, kept: true }
      ]
    });
  });

  it("builds static roll results from original event dice", () => {
    expect(
      getStaticRollResult(
        diceEvent({
          result: 7,
          label: "7",
          dice: [
            { die: "d6", result: 6, label: "6", seed: 0.1, kept: true },
            { die: "d6", result: 1, label: "1", seed: 0.2, kept: false }
          ]
        })
      )
    ).toEqual({
      label: "7",
      summary: "D6 6 + D6 1",
      result: 7,
      dice: [
        { kept: true, label: "6", value: 6 },
        { kept: false, label: "1", value: 1 }
      ]
    });
  });

  it("projects resolved dice back onto event dice", () => {
    const event = diceEvent({
      dice: [
        { die: "d8", result: 2, label: "2", seed: 0.1 },
        { die: "d8", result: 8, label: "8", seed: 0.2 }
      ]
    });
    const resolved: ResolvedDiceResult = {
      label: "7",
      summary: "D8 3 + D8 4",
      result: 7,
      dice: [
        { kept: true, label: "3", value: 3 },
        { kept: false, label: "4", value: 4 }
      ]
    };

    expect(getResolvedEventDice(event, resolved)).toEqual([
      { die: "d8", result: 3, label: "3", seed: 0.1, kept: true },
      { die: "d8", result: 4, label: "4", seed: 0.2, kept: false }
    ]);
  });
});
