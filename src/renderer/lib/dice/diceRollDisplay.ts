import type { DiceDisplayMode, DicePanelEdge, DicePanelFacing, DiceSceneSize, DiceSceneThrowDirection, LiveTableEvent } from "../../../shared/localvtt";
import { DICE_EVENT_DURATION_MS, getDiceRollTone, getDieSides, type DiceRollTone } from "./dice";
import { getVisualDice, type ResolvedDiceResult } from "./diceRollLabels";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;
export type DiceViewMode = "gm" | "player";

export const DICE_SETTLE_DURATION_MS = 2800;
export const COIN_SCENE_SETTLE_DURATION_MS = 3400;
export const DICE_RESULTS_SHUFFLE_DURATION_MS = 900;
export const DICE_SCENE_EVENT_DURATION_MS = 12000;
export const DICE_SCENE_RESULT_TIMEOUT_MS = 11000;
export const DICE_SCENE_MIN_ROLL_MS = 900;
export const DICE_SCENE_STABLE_MS = 420;
export const DICE_SCENE_MAX_ROLL_MS = 10000;
export const DICE_FACE_HIGHLIGHT_DURATION_MS = 1800;

export type DicePanelPlacement = {
  advanced: boolean;
  edge: DicePanelEdge;
  facing: DicePanelFacing;
  position: number;
};

export function getDiceDisplayMode(event: DiceRollEvent, mode: DiceViewMode): DiceDisplayMode {
  const displayMode = mode === "gm" ? event.gmDiceDisplay : event.playerDiceDisplay;
  if (displayMode) {
    return displayMode;
  }
  const presentation = mode === "gm" ? event.gmPresentation : event.playerPresentation;
  return (presentation ?? event.presentation) === "3d" ? "panel" : "results";
}

export function getDiceRevealDelay(event: DiceRollEvent, mode: DiceViewMode): number {
  const displayMode = getDiceDisplayMode(event, mode);
  if (displayMode === "scene-result") {
    return event.sceneResolvedLabel ? 0 : getDiceSettleDuration(event);
  }
  if (displayMode !== "results") {
    return getDiceSettleDuration(event);
  }
  const pairedDisplayMode = getDiceDisplayMode(event, mode === "gm" ? "player" : "gm");
  return pairedDisplayMode === "panel" || pairedDisplayMode === "scene" ? getDiceSettleDuration(event) : DICE_RESULTS_SHUFFLE_DURATION_MS;
}

export function getDiceSettleDuration(event: DiceRollEvent): number {
  return getVisualDice(event).some((die) => die.die === "coin") ? COIN_SCENE_SETTLE_DURATION_MS : DICE_SETTLE_DURATION_MS;
}

export function getDiceEventDuration(event: DiceRollEvent, mode: DiceViewMode): number {
  const displayMode = getDiceDisplayMode(event, mode);
  return displayMode === "scene" || displayMode === "scene-result" ? DICE_SCENE_EVENT_DURATION_MS : DICE_EVENT_DURATION_MS;
}

export function getDiceSceneSize(event: DiceRollEvent, mode: DiceViewMode): DiceSceneSize {
  return (mode === "gm" ? event.gmDiceSceneSize : event.playerDiceSceneSize) ?? "md";
}

export function getDiceSceneThrowDirection(event: DiceRollEvent): DiceSceneThrowDirection {
  return event.diceSceneThrowDirection ?? "random";
}

export function getDicePanelPlacement(event: DiceRollEvent, mode: DiceViewMode): DicePanelPlacement {
  return {
    advanced: (mode === "gm" ? event.gmDicePanelAdvanced : event.playerDicePanelAdvanced) ?? false,
    edge: (mode === "gm" ? event.gmDicePanelEdge : event.playerDicePanelEdge) ?? "top",
    facing: (mode === "gm" ? event.gmDicePanelFacing : event.playerDicePanelFacing) ?? "inward",
    position: clampUnitNumber((mode === "gm" ? event.gmDicePanelPosition : event.playerDicePanelPosition) ?? 0.5)
  };
}

export function getDisplayedRollTone(event: DiceRollEvent, displayMode: DiceDisplayMode, resultVisible: boolean, resolvedPhysicsResult: ResolvedDiceResult | null): DiceRollTone {
  if (!resultVisible) {
    return "normal";
  }
  if (displayMode !== "scene" && displayMode !== "scene-result") {
    return getDiceRollTone(event);
  }
  if (displayMode === "scene-result" && !resolvedPhysicsResult) {
    return getDiceRollTone(event);
  }
  const label = resolvedPhysicsResult?.label ?? event.sceneResolvedLabel;
  const dice = getVisualDice(event);
  if (dice.some((die) => die.die === "coin")) {
    return "normal";
  }
  const resolvedD20Tone = getResolvedD20Tone(event, resolvedPhysicsResult);
  if (resolvedD20Tone !== "normal") {
    return resolvedD20Tone;
  }
  if (event.die === "d00" && label) {
    return Number(label) === 100 ? "max" : "normal";
  }
  if (!label || dice.length !== 1) {
    return "normal";
  }
  const die = dice[0]?.die;
  if (die === "d20") {
    if (label === "20") {
      return "critical";
    }
    if (label === "1") {
      return "fumble";
    }
  }
  if (die && die !== "coin" && die !== "d00" && Number(label) === getDieSides(die)) {
    return "max";
  }
  return "normal";
}

export function getResolvedD20Tone(event: DiceRollEvent, resolvedPhysicsResult: ResolvedDiceResult | null): DiceRollTone {
  const dice = getVisualDice(event);
  const resolvedDice = resolvedPhysicsResult?.dice;
  const keptD20Results = dice
    .map((die, index) => ({ die, resolvedDie: resolvedDice?.[index] }))
    .filter(({ die, resolvedDie }) => die.die === "d20" && (resolvedDie?.kept ?? die.kept ?? true) !== false);
  if (keptD20Results.length !== 1) {
    return "normal";
  }
  const value = keptD20Results[0]?.resolvedDie?.value ?? keptD20Results[0]?.die.result;
  if (value === 20) {
    return "critical";
  }
  if (value === 1) {
    return "fumble";
  }
  return "normal";
}

function clampUnitNumber(value: number): number {
  return Math.min(1, Math.max(0, value));
}
