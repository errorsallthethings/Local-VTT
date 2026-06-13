import type { LiveTableEvent } from "../../shared/localvtt";

export type DiceType = Extract<LiveTableEvent, { type: "dice" }>["die"];
export type DiceVisualRoll = NonNullable<Extract<LiveTableEvent, { type: "dice" }>["dice"]>[number];
export type DiceRollTone = "critical" | "fumble" | "max" | "normal";

export const DICE_TYPES: DiceType[] = ["coin", "d4", "d6", "d8", "d10", "d00", "d12", "d20"];
export const DICE_EVENT_DURATION_MS = 5200;
export const DICE_HISTORY_DURATION_MS = 10000;
export const MAX_COMPOSER_DICE = 12;
const MAX_INLINE_BREAKDOWN_DICE = 6;
const MAX_COMPACT_BREAKDOWN_DICE = 6;
const DICE_EXPRESSION_ERROR = "Use dice like d20, d20a, d20d, 4d6kh3, 4d6dl1, 2d6+3, d20+d4+5, or d%.";

export function rollDie(die: DiceType, random = Math.random): { result: number; label: string } {
  if (die === "coin") {
    const result = Math.floor(random() * 2) + 1;
    return { result, label: result === 1 ? "Heads" : "Tails" };
  }
  if (die === "d00") {
    const face = Math.floor(random() * 10) * 10;
    return { result: face === 0 ? 100 : face, label: face === 0 ? "00" : String(face) };
  }
  const sides = getDieSides(die);
  const result = Math.floor(random() * sides) + 1;
  return { result, label: String(result) };
}

export function rollDiceEvent(die: DiceType, random = Math.random): Omit<Extract<LiveTableEvent, { type: "dice" }>, "id" | "type" | "createdAt"> {
  if (die !== "d00") {
    const roll = rollDie(die, random);
    return {
      die,
      result: roll.result,
      label: roll.label,
      seed: random()
    };
  }

  const tens = rollDie("d00", random);
  const ones = rollDie("d10", random);
  const onesLabel = ones.result === 10 ? "0" : ones.label;
  const result = getPercentileTotal(tens.label, onesLabel);
  return {
    die: "d00",
    result,
    label: String(result),
    seed: random(),
    dice: [
      { die: "d00", result: tens.result, label: tens.label, seed: random() },
      { die: "d10", result: ones.result, label: onesLabel, seed: random() }
    ]
  };
}

export function rollDiceExpression(expression: string, random = Math.random): Omit<Extract<LiveTableEvent, { type: "dice" }>, "id" | "type" | "createdAt"> {
  const normalizedExpression = expression.trim().toLowerCase().replace(/\s+/g, "");
  const terms = parseExpressionTerms(normalizedExpression);
  if (terms.length === 0 || !terms.some((term) => term.kind === "dice")) {
    throw new Error(DICE_EXPRESSION_ERROR);
  }

  let total = 0;
  let totalDice = 0;
  const dice: DiceVisualRoll[] = [];
  let primaryDie: DiceType | null = null;

  for (const term of terms) {
    if (term.kind === "modifier") {
      total += term.sign * term.value;
      continue;
    }
    if (term.sign < 0) {
      throw new Error("Subtract numeric modifiers only.");
    }
    const termRoll = rollDiceTerm(term, random);
    totalDice += termRoll.dice.length;
    if (totalDice > MAX_COMPOSER_DICE) {
      throw new Error(`Roll between 1 and ${MAX_COMPOSER_DICE} dice at a time.`);
    }
    primaryDie ??= termRoll.die;
    total += termRoll.total;
    dice.push(...termRoll.dice);
  }

  return {
    die: primaryDie ?? "d20",
    result: total,
    label: String(total),
    formula: formatFormula(normalizedExpression),
    seed: random(),
    dice
  };
}

function rollDiceTerm(term: DiceExpressionDiceTerm, random: () => number): { die: DiceType; total: number; dice: DiceVisualRoll[] } {
  const [, countText, sidesText, modeText, keepHighText, keepLowText, dropHighText, dropLowText] = term.match;
  const count = countText ? Number(countText) : 1;
  if (!Number.isInteger(count) || count < 1 || count > MAX_COMPOSER_DICE) {
    throw new Error(`Roll between 1 and ${MAX_COMPOSER_DICE} dice at a time.`);
  }

  const die = normalizeExpressionDie(sidesText);
  const mode = normalizeRollMode(modeText);
  if (die === "d00") {
    if (mode) {
      throw new Error("Percentile rolls do not support advantage or keep modifiers.");
    }
    if (count !== 1) {
      throw new Error("Percentile rolls use one D00 tens die and one D10 ones die.");
    }
    const roll = rollDiceEvent("d00", random);
    return {
      die,
      total: roll.result,
      dice: roll.dice ?? [{ die: roll.die, result: roll.result, label: roll.label, seed: roll.seed, kept: true }]
    };
  }

  const effectiveCount = mode === "advantage" || mode === "disadvantage" ? 2 : count;
  if ((mode === "advantage" || mode === "disadvantage") && (die !== "d20" || count !== 1)) {
    throw new Error("Advantage and disadvantage use one d20.");
  }
  const keepCount = getKeepCount(mode, keepHighText, keepLowText, dropHighText, dropLowText, effectiveCount);
  const dice: DiceVisualRoll[] = [];
  for (let index = 0; index < effectiveCount; index += 1) {
    const roll = rollDie(die, random);
    dice.push({ die, result: roll.result, label: roll.label, seed: random() });
  }
  const keptIndexes = getKeptIndexes(dice, mode, keepCount);
  let total = 0;
  const annotatedDice = dice.map((visual, index) => {
    const kept = keptIndexes.has(index);
    if (kept) {
      total += visual.result;
    }
    return { ...visual, kept };
  });
  return {
    die,
    total,
    dice: annotatedDice
  };
}

export function formatDiceRollSummary(event: Extract<LiveTableEvent, { type: "dice" }>): string {
  const prefix = event.rollLabel ? `${event.rollLabel}: ` : "";
  if (event.formula) {
    return `${prefix}${event.formula}`;
  }
  if (!event.dice || event.dice.length === 0) {
    return `${prefix}${formatDieLabel(event.die)}`;
  }
  if (event.die === "d00" && isPercentileDicePair(event.dice)) {
    return `${prefix}${formatDieLabel(event.die)}`;
  }
  return `${prefix}${event.dice.map((die) => `${formatPhysicalDieLabel(die.die)} ${die.label}`).join(" + ")}`;
}

export function formatDiceRollBreakdown(event: Extract<LiveTableEvent, { type: "dice" }>): string {
  if (!event.dice || event.dice.length === 0) {
    return formatDieLabel(event.die);
  }
  const diceTotal = getDiceVisualTotal(event.dice);
  const modifier = event.result - diceTotal;
  if (event.dice.length <= 1) {
    return modifier === 0 ? formatBreakdownDieLabel(event.dice[0]) : formatRollTotalExpression([formatBreakdownDieLabel(event.dice[0])], modifier);
  }
  const diceLabels = event.dice.map(formatBreakdownDieLabel);
  if (modifier !== 0 && diceLabels.length <= MAX_INLINE_BREAKDOWN_DICE) {
    return formatRollTotalExpression(diceLabels, modifier);
  }
  if (diceLabels.length <= MAX_INLINE_BREAKDOWN_DICE) {
    return diceLabels.join(" + ");
  }
  const keptCount = event.dice.filter((die) => die.kept !== false).length;
  const droppedCount = event.dice.length - keptCount;
  const preview = diceLabels.slice(0, MAX_COMPACT_BREAKDOWN_DICE).join(", ");
  const suffix = diceLabels.length > MAX_COMPACT_BREAKDOWN_DICE ? ", ..." : "";
  return `${event.dice.length} dice (${keptCount} kept${droppedCount > 0 ? `, ${droppedCount} dropped` : ""}): ${preview}${suffix}`;
}

export function formatDiceRollBreakdownTooltip(event: Extract<LiveTableEvent, { type: "dice" }>): string | undefined {
  if (!event.dice || event.dice.length <= MAX_COMPACT_BREAKDOWN_DICE) {
    return undefined;
  }
  return event.dice.map(formatBreakdownDieLabel).join(", ");
}

export function getDiceVisualTotal(dice: DiceVisualRoll[]): number {
  const keptDice = dice.filter((die) => die.kept !== false);
  const percentileTens = keptDice.find((die) => die.die === "d00");
  const percentileOnes = keptDice.find((die) => die.die === "d10");
  if (percentileTens && percentileOnes && keptDice.length === 2) {
    return getPercentileTotal(percentileTens.label, percentileOnes.label);
  }
  return keptDice.reduce((total, die) => total + getDiceVisualValue(die), 0);
}

export function getDiceRollTone(event: Extract<LiveTableEvent, { type: "dice" }>): DiceRollTone {
  const dice = getEventDice(event).filter((die) => die.kept !== false);
  if (dice.some((die) => die.die === "d20" && die.result === 20)) {
    return "critical";
  }
  if (dice.some((die) => die.die === "d20" && die.result === 1)) {
    return "fumble";
  }
  if (event.die === "coin") {
    return "normal";
  }
  if (event.die === "d00") {
    return getEventPercentileTotal(event) === 100 ? "max" : "normal";
  }
  if (dice.some((die) => die.result === getDieMaxResult(die.die))) {
    return "max";
  }
  return "normal";
}

export function getPercentileTotal(tensLabel: string, onesLabel: string): number {
  const tens = tensLabel === "00" ? 0 : Number(tensLabel);
  const ones = onesLabel === "0" || onesLabel === "10" ? 0 : Number(onesLabel);
  const total = tens + ones;
  return total === 0 ? 100 : total;
}

function getEventDice(event: Extract<LiveTableEvent, { type: "dice" }>): DiceVisualRoll[] {
  return event.dice ?? [{ die: event.die, result: event.result, label: event.label, seed: event.seed, kept: true }];
}

function getEventPercentileTotal(event: Extract<LiveTableEvent, { type: "dice" }>): number {
  const dice = getEventDice(event).filter((die) => die.kept !== false);
  const tens = dice.find((die) => die.die === "d00");
  const ones = dice.find((die) => die.die === "d10");
  return tens && ones ? getPercentileTotal(tens.label, ones.label) : event.result;
}

function formatBreakdownDieLabel(die: DiceVisualRoll): string {
  return die.kept === false ? `(${die.label})` : die.label;
}

function formatRollTotalExpression(diceLabels: string[], modifier: number): string {
  const modifierLabel = modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
  return `${diceLabels.join(" + ")} ${modifierLabel}`;
}

function getDiceVisualValue(die: DiceVisualRoll): number {
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

type DiceExpressionTerm = DiceExpressionDiceTerm | DiceExpressionModifierTerm;
type DiceExpressionDiceTerm = {
  kind: "dice";
  sign: 1 | -1;
  match: RegExpExecArray;
};
type DiceExpressionModifierTerm = {
  kind: "modifier";
  sign: 1 | -1;
  value: number;
};

type RollMode = "advantage" | "disadvantage" | "keep-high" | "keep-low" | "drop-high" | "drop-low" | null;

function parseExpressionTerms(expression: string): DiceExpressionTerm[] {
  if (!expression) {
    return [];
  }
  const parts = expression.match(/[+-]?[^+-]+/g) ?? [];
  if (parts.length === 0 || parts.join("") !== expression) {
    throw new Error(DICE_EXPRESSION_ERROR);
  }

  return parts.map((part, index) => {
    const sign: 1 | -1 = part.startsWith("-") ? -1 : 1;
    const body = part.startsWith("+") || part.startsWith("-") ? part.slice(1) : part;
    if (body.length === 0 || (index === 0 && part.startsWith("+"))) {
      throw new Error(DICE_EXPRESSION_ERROR);
    }

    const diceMatch = /^(\d*)d(%|00|100|2|4|6|8|10|12|20)(adv|dis|a|d|kh(\d+)|kl(\d+)|dh(\d+)|dl(\d+))?$/.exec(body);
    if (diceMatch) {
      return {
        kind: "dice",
        sign,
        match: diceMatch
      };
    }
    if (/^\d+$/.test(body)) {
      return {
        kind: "modifier",
        sign,
        value: Number(body)
      };
    }
    throw new Error(DICE_EXPRESSION_ERROR);
  });
}

function normalizeRollMode(modeText?: string): RollMode {
  if (!modeText) {
    return null;
  }
  if (modeText === "a" || modeText === "adv") {
    return "advantage";
  }
  if (modeText === "d" || modeText === "dis") {
    return "disadvantage";
  }
  if (modeText.startsWith("kh")) {
    return "keep-high";
  }
  if (modeText.startsWith("kl")) {
    return "keep-low";
  }
  if (modeText.startsWith("dh")) {
    return "drop-high";
  }
  return "drop-low";
}

function getKeepCount(
  mode: RollMode,
  keepHighText: string | undefined,
  keepLowText: string | undefined,
  dropHighText: string | undefined,
  dropLowText: string | undefined,
  count: number
): number {
  if (mode === "advantage" || mode === "disadvantage") {
    return 1;
  }
  if (mode === "keep-high") {
    const keepCount = Number(keepHighText);
    assertValidKeepCount(keepCount, count);
    return keepCount;
  }
  if (mode === "keep-low") {
    const keepCount = Number(keepLowText);
    assertValidKeepCount(keepCount, count);
    return keepCount;
  }
  if (mode === "drop-high") {
    return getDropKeepCount(Number(dropHighText), count);
  }
  if (mode === "drop-low") {
    return getDropKeepCount(Number(dropLowText), count);
  }
  return count;
}

function assertValidKeepCount(keepCount: number, count: number): void {
  if (!Number.isInteger(keepCount) || keepCount < 1 || keepCount > count) {
    throw new Error("Keep modifiers must keep at least one die and no more than rolled.");
  }
}

function getDropKeepCount(dropCount: number, count: number): number {
  if (!Number.isInteger(dropCount) || dropCount < 1 || dropCount >= count) {
    throw new Error("Drop modifiers must drop at least one die and leave at least one die kept.");
  }
  return count - dropCount;
}

function getKeptIndexes(dice: DiceVisualRoll[], mode: RollMode, keepCount: number): Set<number> {
  const sorted = dice
    .map((die, index) => ({ index, result: die.result }))
    .sort((a, b) =>
      mode === "disadvantage" || mode === "keep-low" || mode === "drop-high" ? a.result - b.result || a.index - b.index : b.result - a.result || a.index - b.index
    );
  return new Set(sorted.slice(0, keepCount).map((die) => die.index));
}

function normalizeExpressionDie(sidesText: string): DiceType {
  if (sidesText === "%" || sidesText === "100" || sidesText === "00") {
    return "d00";
  }
  return `d${sidesText}` as DiceType;
}

function formatFormula(expression: string): string {
  return expression
    .replace(/(^|[+-])(\d*)d(%|00|100|2|4|6|8|10|12|20)/g, (_match, sign: string, count: string, sides: string) => `${sign}${count || "1"}d${sides === "00" ? "%" : sides}`)
    .toUpperCase();
}

export function getDieSides(die: DiceType): number {
  if (die === "coin") {
    return 2;
  }
  if (die === "d2") {
    return 2;
  }
  if (die === "d4") {
    return 4;
  }
  if (die === "d6") {
    return 6;
  }
  if (die === "d8") {
    return 8;
  }
  if (die === "d10") {
    return 10;
  }
  if (die === "d12") {
    return 12;
  }
  if (die === "d20") {
    return 20;
  }
  return 10;
}

function getDieMaxResult(die: DiceType): number {
  return die === "d00" ? 90 : getDieSides(die);
}

export function formatDieLabel(die: DiceType): string {
  if (die === "coin") {
    return "Coin";
  }
  if (die === "d00") {
    return "D%";
  }
  return die.toUpperCase();
}

export function formatPhysicalDieLabel(die: DiceType): string {
  return die === "coin" ? "Coin" : die.toUpperCase();
}

function isPercentileDicePair(dice: DiceVisualRoll[]): boolean {
  return dice.length === 2 && dice[0]?.die === "d00" && dice[1]?.die === "d10";
}
