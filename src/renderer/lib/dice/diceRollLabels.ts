import type { LiveTableEvent } from "../../../shared/localvtt";
import { formatDiceRollSummary, formatDieLabel, getDiceVisualTotal, getDieSides, getPercentileTotal, type DiceType, type DiceVisualRoll } from "./dice";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;

export type ResolvedDiceResult = {
  label: string;
  summary: string;
  result: number;
  dice: Array<{ kept?: boolean; label: string; value: number }>;
};

export function shouldUnderlineResultLabel(label: string): boolean {
  return label === "6" || label === "9";
}

export function getVisualDice(event: DiceRollEvent): DiceVisualRoll[] {
  return event.dice ?? [{ die: event.die, result: event.result, label: event.label, seed: event.seed }];
}

export function getRollSummary(event: DiceRollEvent): string {
  return formatDiceRollSummary(event);
}

export function getDisplayedRollSummary(event: DiceRollEvent): string {
  return event.sceneResolvedSummary ?? getRollSummary(event);
}

export function getDisplayedRollLabel(event: DiceRollEvent): string {
  return event.sceneResolvedLabel ?? event.label;
}

export function getResolvedDisplayedSummary(event: DiceRollEvent, resolvedPhysicsResult: ResolvedDiceResult): string {
  const modifier = getRollModifier(event);
  if (modifier === 0) {
    return resolvedPhysicsResult.summary;
  }
  const modifierLabel = modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
  return `${resolvedPhysicsResult.summary} ${resolvedPhysicsResult.label} ${modifierLabel}`;
}

export function getResolvedDisplayedLabel(event: DiceRollEvent, resolvedPhysicsResult: ResolvedDiceResult): string {
  const modifier = getRollModifier(event);
  if (modifier === 0) {
    return resolvedPhysicsResult.label;
  }
  return String(resolvedPhysicsResult.result + modifier);
}

export function getRollModifier(event: DiceRollEvent): number {
  const dice = getVisualDice(event);
  if (dice.length === 0) {
    return 0;
  }
  return event.result - getDiceVisualTotal(dice);
}

export function getRollingSummary(event: DiceRollEvent): string {
  const prefix = event.rollLabel ? `${event.rollLabel}: ` : "";
  if (event.formula) {
    return `${prefix}${event.formula}`;
  }
  const dice = getVisualDice(event);
  if (event.die === "d00" && hasPercentileDice(dice)) {
    return `${prefix}${formatDieLabel(event.die)}`;
  }
  if (dice.length <= 1) {
    return `${prefix}${formatDieLabel(event.die)}`;
  }
  return `${prefix}${dice.map((die) => formatDieLabel(die.die)).join(" + ")}`;
}

export function getShuffledRollLabel(event: DiceRollEvent, tick: number): string {
  const dice = getVisualDice(event);
  if (event.die === "coin" && dice.length === 1) {
    return seedRange(event.seed + tick, 30, 1) < 0.5 ? "Heads" : "Tails";
  }
  if (event.die === "d00" && hasPercentileDice(dice)) {
    const tens = Math.floor(seedRange(event.seed + tick, 31, 10)) * 10;
    const ones = Math.floor(seedRange(event.seed + tick, 32, 10));
    return String(getPercentileTotal(tens === 0 ? "00" : String(tens), String(ones)));
  }
  const total = dice.reduce((sum, die, index) => {
    if (die.kept === false) {
      return sum;
    }
    return sum + getShuffledDieValue(die.die, die.seed, tick, index);
  }, 0);
  return String(total);
}

export function getVisualResultFaceLabel(event: DiceVisualRoll): string {
  if (event.die === "d10" && event.result === 10) {
    return "0";
  }
  if (event.die === "d00" && event.result === 0) {
    return "00";
  }
  if (event.die === "d00" && event.result === 100) {
    return "00";
  }
  return event.label;
}

export function getPublishedSceneResolvedLabel(event: DiceRollEvent, resolvedResult: ResolvedDiceResult, sceneResolvedResult: number): string {
  if (event.die === "coin" && resolvedResult.dice.length === 1) {
    return `${resolvedResult.label} (${sceneResolvedResult})`;
  }
  return String(sceneResolvedResult);
}

export function getResolvedDieValue(die: DiceVisualRoll): number {
  if (die.die === "coin") {
    return die.label === "Tails" ? 2 : 1;
  }
  if (die.die === "d10") {
    return die.label === "0" ? 10 : die.result;
  }
  if (die.die === "d00") {
    return die.label === "00" ? 100 : die.result;
  }
  return die.result;
}

export function hasPercentileDice(dice: DiceVisualRoll[]): boolean {
  return dice.length === 2 && dice[0]?.die === "d00" && dice[1]?.die === "d10";
}

function getShuffledDieValue(die: DiceType, seed: number, tick: number, index: number): number {
  if (die === "coin") {
    return seedRange(seed + tick, index + 31, 1) < 0.5 ? 1 : 2;
  }
  if (die === "d00") {
    return Math.floor(seedRange(seed + tick, index + 31, 10)) * 10;
  }
  return Math.floor(seedRange(seed + tick, index + 31, getDieSides(die))) + 1;
}

function seedRange(seed: number, offset: number, max: number): number {
  const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * max;
}
