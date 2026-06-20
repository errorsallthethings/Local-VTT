import { describe, expect, it } from "vitest";
import type { LiveTableEvent } from "../../shared/localvtt";
import { updateDiceRollHistory } from "./dice";

function diceEvent(id: string, result: number): Extract<LiveTableEvent, { type: "dice" }> {
  return {
    id,
    type: "dice",
    die: "d20",
    result,
    label: String(result),
    seed: 0.5,
    createdAt: result
  };
}

describe("dice history", () => {
  it("places the newest roll first", () => {
    expect(updateDiceRollHistory([diceEvent("old", 1)], diceEvent("new", 2))).toEqual([diceEvent("new", 2), diceEvent("old", 1)]);
  });

  it("deduplicates matching roll ids", () => {
    expect(updateDiceRollHistory([diceEvent("same", 1), diceEvent("old", 2)], diceEvent("same", 20))).toEqual([
      diceEvent("same", 20),
      diceEvent("old", 2)
    ]);
  });

  it("caps the history length", () => {
    expect(updateDiceRollHistory([diceEvent("a", 1), diceEvent("b", 2)], diceEvent("c", 3), 2)).toEqual([
      diceEvent("c", 3),
      diceEvent("a", 1)
    ]);
  });
});
