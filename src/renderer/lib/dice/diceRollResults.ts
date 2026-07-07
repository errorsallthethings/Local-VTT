import type { LiveTableEvent } from "../../../shared/localvtt";
import { annotateKeptDiceForFormula, formatDieLabel, getDiceVisualTotal, type DiceVisualRoll } from "./dice";
import { getResolvedDieValue, getRollSummary, getVisualDice, type ResolvedDiceResult } from "./diceRollLabels";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;

export type ResolvedVisualDie = {
  label: string;
  value: number;
};

export function getResolvedDiceRollResult(event: DiceRollEvent, visualDice: DiceVisualRoll[], resolvedDice: ResolvedVisualDie[]): ResolvedDiceResult {
  if (resolvedDice.length === 1 && visualDice[0]?.die === "coin") {
    return {
      label: resolvedDice[0]?.label ?? "Heads",
      summary: formatDieLabel("coin"),
      result: resolvedDice[0]?.value ?? 1,
      dice: resolvedDice
    };
  }
  const resolvedVisualDice = annotateResolvedVisualDice(event, visualDice, resolvedDice);
  const percentileDice = hasResolvedPercentileDice(visualDice, resolvedDice);
  const total = getDiceVisualTotal(resolvedVisualDice);
  const summary = percentileDice
    ? formatDieLabel("d00")
    : resolvedDice.length <= 1
      ? formatDieLabel(visualDice[0]?.die ?? "d20")
      : resolvedDice.map((result, index) => `${formatDieLabel(visualDice[index]?.die ?? "d20")} ${result.label}`).join(" + ");
  return {
    label: String(total),
    summary,
    result: total,
    dice: resolvedVisualDice.map((die) => ({ kept: die.kept, label: die.label, value: getResolvedDieValue(die) }))
  };
}

export function getStaticRollResult(event: DiceRollEvent): ResolvedDiceResult {
  const dice = getVisualDice(event);
  return {
    label: event.label,
    summary: getRollSummary(event),
    result: event.result,
    dice: dice.map((die) => ({ kept: die.kept ?? true, label: die.label, value: getResolvedDieValue(die) }))
  };
}

export function annotateResolvedVisualDice(event: DiceRollEvent, visualDice: DiceVisualRoll[], resolvedDice: ResolvedVisualDie[]): DiceVisualRoll[] {
  const resolvedVisualDice = visualDice.map((visual, index) => ({
    ...visual,
    label: resolvedDice[index]?.label ?? visual.label,
    result: resolvedDice[index]?.value ?? visual.result
  }));
  return annotateKeptDiceForFormula(event.formula, resolvedVisualDice);
}

export function getResolvedEventDice(event: DiceRollEvent, resolvedResult: ResolvedDiceResult): DiceVisualRoll[] {
  const dice = getVisualDice(event);
  return dice.map((visual, index) => {
    const resolvedDie = resolvedResult.dice[index];
    if (!resolvedDie) {
      return visual;
    }
    return {
      ...visual,
      kept: resolvedDie.kept ?? true,
      label: resolvedDie.label,
      result: resolvedDie.value
    };
  });
}

export function hasResolvedPercentileDice(visualDice: DiceVisualRoll[], resolvedDice: ResolvedVisualDie[]): boolean {
  return visualDice.length === 2 && resolvedDice.length === 2 && visualDice[0]?.die === "d00" && visualDice[1]?.die === "d10";
}
