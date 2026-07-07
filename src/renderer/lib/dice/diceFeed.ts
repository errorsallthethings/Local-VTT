import type { LiveTableEvent } from "../../../shared/localvtt";
import {
  formatDiceRollBreakdown,
  formatDiceRollBreakdownTooltip,
  getDiceRollTone,
  type DiceRollTone
} from "./dice";

export type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;

export const DICE_PANEL_REVEAL_DELAY_MS = 2800;

export function formatDiceFeedBreakdown(roll: DiceRollEvent, tick = 0, now = Date.now()): string {
  if (isPendingRecentDiceRoll(roll, tick, now)) {
    return "Waiting for dice to settle";
  }
  if (!roll.dice) {
    return roll.label;
  }
  return formatDiceRollBreakdown(roll);
}

export function formatDiceFeedBreakdownTooltip(roll: DiceRollEvent, tick = 0, now = Date.now()): string | undefined {
  return isPendingRecentDiceRoll(roll, tick, now) ? undefined : formatDiceRollBreakdownTooltip(roll);
}

export function formatDiceFeedLabel(roll: DiceRollEvent, tick = 0, now = Date.now()): string {
  return isPendingRecentDiceRoll(roll, tick, now) ? "Rolling" : roll.label;
}

export function getDiceFeedTone(roll: DiceRollEvent, tick = 0, now = Date.now()): DiceRollTone {
  return isPendingRecentDiceRoll(roll, tick, now) ? "normal" : getDiceRollTone(roll);
}

export function isPendingRecentDiceRoll(roll: DiceRollEvent, _tick = 0, now = Date.now()): boolean {
  return isUnresolvedSceneDiceRoll(roll) || isUnrevealedPanelDiceRoll(roll, now);
}

function isUnresolvedSceneDiceRoll(roll: DiceRollEvent): boolean {
  return (roll.gmDiceDisplay === "scene" || roll.gmDiceDisplay === "scene-result" || roll.playerDiceDisplay === "scene") && !roll.sceneResolvedLabel;
}

function isUnrevealedPanelDiceRoll(roll: DiceRollEvent, now: number): boolean {
  if (roll.sceneResolvedLabel || (roll.gmDiceDisplay !== "panel" && roll.playerDiceDisplay !== "panel")) {
    return false;
  }
  return now - roll.createdAt < DICE_PANEL_REVEAL_DELAY_MS;
}
