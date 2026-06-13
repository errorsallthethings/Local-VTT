import { describe, expect, it } from "vitest";
import {
  DICE_TYPES,
  formatDiceRollBreakdown,
  formatDiceRollBreakdownTooltip,
  formatDiceRollSummary,
  getDiceRollTone,
  rollDiceEvent,
  rollDiceExpression,
  rollDie
} from "../../src/renderer/lib/dice";

describe("dice helpers", () => {
  it("rolls each supported die in range", () => {
    const lowest = DICE_TYPES.map((die) => [die, rollDie(die, () => 0)]);
    const highest = DICE_TYPES.map((die) => [die, rollDie(die, () => 0.999)]);

    expect(lowest).toEqual([
      ["coin", { result: 1, label: "Heads" }],
      ["d4", { result: 1, label: "1" }],
      ["d6", { result: 1, label: "1" }],
      ["d8", { result: 1, label: "1" }],
      ["d10", { result: 1, label: "1" }],
      ["d00", { result: 100, label: "00" }],
      ["d12", { result: 1, label: "1" }],
      ["d20", { result: 1, label: "1" }]
    ]);
    expect(highest).toEqual([
      ["coin", { result: 2, label: "Tails" }],
      ["d4", { result: 4, label: "4" }],
      ["d6", { result: 6, label: "6" }],
      ["d8", { result: 8, label: "8" }],
      ["d10", { result: 10, label: "10" }],
      ["d00", { result: 90, label: "90" }],
      ["d12", { result: 12, label: "12" }],
      ["d20", { result: 20, label: "20" }]
    ]);
  });

  it("keeps d2 expressions numeric while quick coin rolls return faces", () => {
    expect(rollDie("d2", () => 0)).toEqual({ result: 1, label: "1" });
    expect(rollDie("d2", () => 0.999)).toEqual({ result: 2, label: "2" });
    expect(rollDiceExpression("d2", () => 0.999)).toMatchObject({
      die: "d2",
      result: 2,
      label: "2",
      formula: "1D2",
      dice: [{ die: "d2", result: 2, label: "2" }]
    });
    expect(rollDiceEvent("coin", () => 0)).toMatchObject({
      die: "coin",
      result: 1,
      label: "Heads"
    });
    expect(rollDiceEvent("coin", () => 0.999)).toMatchObject({
      die: "coin",
      result: 2,
      label: "Tails"
    });
  });

  it("rolls d00 as percentile tens plus ones dice", () => {
    const values = [0.4, 0.2, 0.5, 0.6, 0.7];
    const percentile = rollDiceEvent("d00", () => values.shift() ?? 0);

    expect(percentile).toMatchObject({
      die: "d00",
      result: 43,
      label: "43",
      dice: [
        { die: "d00", result: 40, label: "40" },
        { die: "d10", result: 3, label: "3" }
      ]
    });
  });

  it("reads percentile dice using d00 tens and d10 ones slots", () => {
    const rollPercentile = (values: number[]) => rollDiceEvent("d00", () => values.shift() ?? 0);

    expect(rollPercentile([0, 0.999])).toMatchObject({
      result: 100,
      label: "100",
      dice: [
        { die: "d00", result: 100, label: "00" },
        { die: "d10", result: 10, label: "0" }
      ]
    });
    expect(rollPercentile([0.9, 0.8])).toMatchObject({ result: 99, label: "99" });
    expect(rollPercentile([0, 0.4])).toMatchObject({ result: 5, label: "5" });
    expect(rollPercentile([0.5, 0.6])).toMatchObject({ result: 57, label: "57" });
    expect(rollPercentile([0.1, 0.8])).toMatchObject({ result: 19, label: "19" });
  });

  it("rolls simple dice expressions with modifiers", () => {
    const values = [0, 0.5, 0.999, 0.25, 0.75];
    const roll = rollDiceExpression("2d6+3", () => values.shift() ?? 0);

    expect(roll).toMatchObject({
      die: "d6",
      result: 10,
      label: "10",
      formula: "2D6+3",
      dice: [
        { die: "d6", result: 1, label: "1" },
        { die: "d6", result: 6, label: "6" }
      ]
    });
  });

  it("rolls mixed dice expressions", () => {
    const values = [0.5, 0.1, 0.25, 0.2, 0.9, 0.3, 0.4];
    const roll = rollDiceExpression("d20+d4+5-2", () => values.shift() ?? 0);

    expect(roll).toMatchObject({
      die: "d20",
      result: 16,
      label: "16",
      formula: "1D20+1D4+5-2",
      dice: [
        { die: "d20", result: 11, label: "11", kept: true },
        { die: "d4", result: 2, label: "2", kept: true }
      ]
    });
  });

  it("rolls percentile expressions with modifiers", () => {
    const values = [0.9, 0.1, 0, 0.2, 0.3];

    expect(rollDiceExpression("d100+5", () => values.shift() ?? 0)).toMatchObject({
      die: "d00",
      result: 97,
      label: "97",
      formula: "1D100+5",
      dice: [
        { die: "d00", result: 90, label: "90" },
        { die: "d10", result: 2, label: "2" }
      ]
    });

    const percentValues = [0, 0.4, 0, 0, 0];
    expect(rollDiceExpression("d%+3", () => percentValues.shift() ?? 0)).toMatchObject({
      die: "d00",
      result: 8,
      label: "8",
      formula: "1D%+3",
      dice: [
        { die: "d00", result: 100, label: "00" },
        { die: "d10", result: 5, label: "5" }
      ]
    });

    const legacyValues = [0.1, 0.8, 0, 0, 0];
    expect(rollDiceExpression("d00", () => legacyValues.shift() ?? 0)).toMatchObject({
      die: "d00",
      result: 19,
      label: "19",
      formula: "1D%"
    });
  });

  it("rolls advantage and disadvantage", () => {
    const advantageValues = [0.25, 0.1, 0.8, 0.2, 0.3];
    const disadvantageValues = [0.25, 0.1, 0.8, 0.2, 0.3];

    expect(rollDiceExpression("d20a", () => advantageValues.shift() ?? 0)).toMatchObject({
      die: "d20",
      result: 17,
      label: "17",
      formula: "1D20A",
      dice: [
        { result: 6, kept: false },
        { result: 17, kept: true }
      ]
    });
    expect(rollDiceExpression("d20dis", () => disadvantageValues.shift() ?? 0)).toMatchObject({
      die: "d20",
      result: 6,
      label: "6",
      formula: "1D20DIS",
      dice: [
        { result: 6, kept: true },
        { result: 17, kept: false }
      ]
    });
  });

  it("rolls keep-highest and keep-lowest expressions", () => {
    const highValues = [0, 0.1, 0.5, 0.2, 0.999, 0.3, 0.333, 0.4, 0.8];
    const lowValues = [0, 0.1, 0.5, 0.2, 0.999, 0.3, 0.333, 0.4, 0.8];

    expect(rollDiceExpression("4d6kh3", () => highValues.shift() ?? 0)).toMatchObject({
      result: 12,
      label: "12",
      formula: "4D6KH3",
      dice: [
        { result: 1, kept: false },
        { result: 4, kept: true },
        { result: 6, kept: true },
        { result: 2, kept: true }
      ]
    });
    expect(rollDiceExpression("4d6kl2", () => lowValues.shift() ?? 0)).toMatchObject({
      result: 3,
      label: "3",
      formula: "4D6KL2",
      dice: [
        { result: 1, kept: true },
        { result: 4, kept: false },
        { result: 6, kept: false },
        { result: 2, kept: true }
      ]
    });
  });

  it("rolls drop-highest and drop-lowest expressions", () => {
    const dropLowValues = [0, 0.1, 0.5, 0.2, 0.999, 0.3, 0.333, 0.4, 0.8];
    const dropHighValues = [0, 0.1, 0.5, 0.2, 0.999, 0.3, 0.333, 0.4, 0.8];

    expect(rollDiceExpression("4d6dl1", () => dropLowValues.shift() ?? 0)).toMatchObject({
      result: 12,
      label: "12",
      formula: "4D6DL1",
      dice: [
        { result: 1, kept: false },
        { result: 4, kept: true },
        { result: 6, kept: true },
        { result: 2, kept: true }
      ]
    });
    expect(rollDiceExpression("4d6dh2", () => dropHighValues.shift() ?? 0)).toMatchObject({
      result: 3,
      label: "3",
      formula: "4D6DH2",
      dice: [
        { result: 1, kept: true },
        { result: 4, kept: false },
        { result: 6, kept: false },
        { result: 2, kept: true }
      ]
    });
  });

  it("rolls explicit d20 keep aliases", () => {
    const highValues = [0.25, 0.1, 0.8, 0.2, 0.3];
    const lowValues = [0.25, 0.1, 0.8, 0.2, 0.3];

    expect(rollDiceExpression("2d20kh1", () => highValues.shift() ?? 0)).toMatchObject({
      result: 17,
      label: "17",
      formula: "2D20KH1",
      dice: [
        { result: 6, kept: false },
        { result: 17, kept: true }
      ]
    });
    expect(rollDiceExpression("2d20kl1", () => lowValues.shift() ?? 0)).toMatchObject({
      result: 6,
      label: "6",
      formula: "2D20KL1",
      dice: [
        { result: 6, kept: true },
        { result: 17, kept: false }
      ]
    });
  });

  it("formats roll summaries and breakdowns", () => {
    expect(
      formatDiceRollSummary({
        ...rollDiceEvent("d00", () => 0.9),
        id: "percentile",
        type: "dice",
        createdAt: 1
      })
    ).toBe("D%");

    expect(
      formatDiceRollBreakdown({
        ...rollDiceExpression("d20a", () => 0.5),
        id: "advantage",
        type: "dice",
        createdAt: 1
      })
    ).toBe("11 + (11)");
    expect(
      formatDiceRollBreakdownTooltip({
        ...rollDiceExpression("d20a", () => 0.5),
        id: "small-tooltip",
        type: "dice",
        createdAt: 1
      })
    ).toBeUndefined();
    expect(
      formatDiceRollBreakdown({
        ...rollDiceExpression("8d6", () => 0.5),
        id: "pool",
        type: "dice",
        createdAt: 1
      })
    ).toBe("8 dice (8 kept): 4, 4, 4, 4, 4, 4, ...");
    expect(
      formatDiceRollBreakdownTooltip({
        ...rollDiceExpression("8d6", () => 0.5),
        id: "pool-tooltip",
        type: "dice",
        createdAt: 1
      })
    ).toBe("4, 4, 4, 4, 4, 4, 4, 4");
    expect(
      formatDiceRollBreakdown({
        ...rollDiceExpression("8d6dl2", (() => {
          const values = [0, 0, 0.1, 0, 0.5, 0, 0.6, 0, 0.7, 0, 0.8, 0, 0.9, 0, 0.99, 0, 0];
          return () => values.shift() ?? 0;
        })()),
        id: "drop-pool",
        type: "dice",
        createdAt: 1
      })
    ).toBe("8 dice (6 kept, 2 dropped): (1), (1), 4, 4, 5, 5, ...");
    expect(
      formatDiceRollSummary({
        ...rollDiceEvent("coin", () => 0),
        id: "coin",
        type: "dice",
        createdAt: 1
      })
    ).toBe("Coin");
    expect(
      formatDiceRollBreakdown({
        ...rollDiceEvent("coin", () => 0),
        id: "coin-breakdown",
        type: "dice",
        createdAt: 1
      })
    ).toBe("Coin");
    expect(
      formatDiceRollSummary({
        ...rollDiceExpression("1d20+2", () => 0.5),
        id: "initiative",
        type: "dice",
        rollLabel: "Init",
        createdAt: 1
      })
    ).toBe("Init: 1D20+2");
    expect(
      formatDiceRollBreakdown({
        ...rollDiceExpression("1d20+1", () => 0.35),
        id: "single-modifier",
        type: "dice",
        createdAt: 1
      })
    ).toBe("8 + 1");
    expect(
      formatDiceRollBreakdown({
        ...rollDiceExpression("2d6-1", (() => {
          const values = [0, 0.5, 0.6, 0, 0];
          return () => values.shift() ?? 0;
        })()),
        id: "pool-modifier",
        type: "dice",
        createdAt: 1
      })
    ).toBe("1 + 4 - 1");
    expect(
      formatDiceRollBreakdown({
        ...rollDiceExpression("1d20+1", () => 0.7),
        id: "resolved-scene-modifier",
        type: "dice",
        result: 19,
        label: "19",
        dice: [{ die: "d20", result: 18, label: "18", seed: 0.7 }],
        createdAt: 1
      })
    ).toBe("18 + 1");
  });

  it("detects dice roll tones from kept natural results", () => {
    expect(
      getDiceRollTone({
        ...rollDiceExpression("d20", () => 0.999),
        id: "critical",
        type: "dice",
        createdAt: 1
      })
    ).toBe("critical");
    expect(
      getDiceRollTone({
        ...rollDiceExpression("d20", () => 0),
        id: "fumble",
        type: "dice",
        createdAt: 1
      })
    ).toBe("fumble");
    expect(
      getDiceRollTone({
        ...rollDiceExpression("d20a", () => 0),
        id: "dropped-critical",
        type: "dice",
        createdAt: 1
      })
    ).toBe("fumble");
    expect(
      getDiceRollTone({
        ...rollDiceExpression("d8", () => 0.999),
        id: "max",
        type: "dice",
        createdAt: 1
      })
    ).toBe("max");
    expect(
      getDiceRollTone({
        ...rollDiceEvent("d00", (() => {
          const values = [0.9, 0.999, 0, 0, 0];
          return () => values.shift() ?? 0;
        })()),
        id: "percentile-not-max",
        type: "dice",
        createdAt: 1
      })
    ).toBe("normal");
    expect(
      getDiceRollTone({
        ...rollDiceEvent("d00", (() => {
          const values = [0, 0.999, 0, 0, 0];
          return () => values.shift() ?? 0;
        })()),
        id: "percentile-max",
        type: "dice",
        createdAt: 1
      })
    ).toBe("max");
  });

  it("rejects unsupported dice expressions", () => {
    expect(() => rollDiceExpression("20")).toThrow(/Use dice/);
    expect(() => rollDiceExpression("99d6")).toThrow(/Roll between/);
    expect(() => rollDiceExpression("2d100")).toThrow(/Percentile/);
    expect(() => rollDiceExpression("2d20a")).toThrow(/Advantage/);
    expect(() => rollDiceExpression("4d6kh5")).toThrow(/Keep/);
    expect(() => rollDiceExpression("4d6dl4")).toThrow(/Drop/);
    expect(() => rollDiceExpression("d20-d4")).toThrow(/Subtract numeric/);
  });
});
