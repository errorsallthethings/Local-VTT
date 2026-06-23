import type { CSSProperties } from "react";
import type { TurnOrderEntry, TurnOrderSettings } from "../../../shared/localvtt";

export type PlayerViewEdge = "top" | "right" | "bottom" | "left";
export type PlayerViewFacing = "inward" | "outward";
export type PlayerTurnStatus = "current" | "next" | "waiting";

export interface VisibleTurnOrderState {
  entries: TurnOrderEntry[];
  displayedEntries: TurnOrderEntry[];
  hiddenEntryCount: number;
  currentIndex: number;
  currentEntry: TurnOrderEntry | null;
  nextEntry: TurnOrderEntry | null;
}

export function getVisibleTurnOrderState(turnOrder: Pick<TurnOrderSettings, "currentEntryId" | "entries"> & Partial<Pick<TurnOrderSettings, "playerViewMaxEntries">>): VisibleTurnOrderState {
  const entries = turnOrder.entries.filter((entry) => entry.visibleInPlayer);
  const currentIndex = Math.max(0, entries.findIndex((entry) => entry.id === turnOrder.currentEntryId));
  const currentEntry = entries.find((entry) => entry.id === turnOrder.currentEntryId) ?? null;
  const nextEntry = entries.length > 1 ? entries[(currentIndex + 1) % entries.length] : null;
  const maxEntries = getTurnOrderDisplayLimit(turnOrder.playerViewMaxEntries);
  const displayedEntries = getCarouselEntries(entries, currentIndex, maxEntries);
  const hiddenEntryCount = getHiddenEntriesUntilWrap(entries.length, currentIndex, displayedEntries.length);
  return { entries, displayedEntries, hiddenEntryCount, currentIndex, currentEntry, nextEntry };
}

function getTurnOrderDisplayLimit(value: number | undefined): number {
  return Math.max(1, Math.min(30, Math.floor(value ?? 9)));
}

function getCarouselEntries(entries: TurnOrderEntry[], startIndex: number, maxEntries: number): TurnOrderEntry[] {
  if (entries.length <= maxEntries) {
    return entries;
  }
  return Array.from({ length: maxEntries }, (_, offset) => entries[(startIndex + offset) % entries.length]);
}

function getHiddenEntriesUntilWrap(entryCount: number, currentIndex: number, displayedCount: number): number {
  if (entryCount <= displayedCount) {
    return 0;
  }
  return Math.max(0, entryCount - currentIndex - displayedCount);
}

export function getPlayerSeatStyle(edge: PlayerViewEdge, position: number, color: string): CSSProperties {
  const clampedPosition = Math.min(1, Math.max(0, position)) * 100;
  const baseStyle = {
    "--player-seat-color": color
  } as CSSProperties;
  if (edge === "top" || edge === "bottom") {
    return {
      ...baseStyle,
      left: `${clampedPosition}%`,
      [edge]: "12px"
    };
  }
  return {
    ...baseStyle,
    top: `${clampedPosition}%`,
    [edge]: "12px"
  };
}

export function getPlayerTurnStatusLabel(status: PlayerTurnStatus): string {
  if (status === "current") {
    return "Turn Now";
  }
  if (status === "next") {
    return "Up Next";
  }
  return "Waiting";
}

export function getPlayerTurnStatusStyle(edge: PlayerViewEdge, position: number, color: string, progress: number): CSSProperties {
  const style = getPlayerSeatStyle(edge, position, color);
  if (edge === "left" || edge === "right") {
    delete style[edge];
    return {
      ...style,
      [edge]: "calc(12px - var(--player-turn-edge-offset, 57px))",
      transform: getEdgeSlideTransform(edge, progress, getPlayerTurnStatusRotation(edge))
    };
  }
  return {
    ...style,
    transform: getEdgeSlideTransform(edge, progress, getPlayerTurnStatusRotation(edge))
  };
}

export function getPlayerTurnStatusRotation(edge: PlayerViewEdge): number {
  if (edge === "top") {
    return 180;
  }
  if (edge === "left") {
    return 90;
  }
  if (edge === "right") {
    return -90;
  }
  return 0;
}

export function getEdgeSlideTransform(edge: PlayerViewEdge, progress: number, rotation = 0): string {
  const clamped = Math.min(1, Math.max(0, progress));
  const hiddenPercent = (1 - clamped) * 100;
  const hiddenPixels = (1 - clamped) * 36;
  const rotationTransform = rotation ? ` rotate(${rotation}deg)` : "";
  if (edge === "top") {
    return `translate(-50%, calc(-${hiddenPercent}% - ${hiddenPixels}px))${rotationTransform}`;
  }
  if (edge === "bottom") {
    return `translate(-50%, calc(${hiddenPercent}% + ${hiddenPixels}px))${rotationTransform}`;
  }
  if (edge === "left") {
    return `translate(calc(-${hiddenPercent}% - ${hiddenPixels}px), -50%)${rotationTransform}`;
  }
  return `translate(calc(${hiddenPercent}% + ${hiddenPixels}px), -50%)${rotationTransform}`;
}

export function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

export function easeInCubic(value: number): number {
  return value * value * value;
}

export function getTurnOrderPlayerBarLayout(edge: PlayerViewEdge, facing: PlayerViewFacing) {
  const reverseEntries =
    (edge === "top" && facing === "outward") ||
    (edge === "right" && facing === "outward") ||
    (edge === "bottom" && facing === "inward") ||
    (edge === "left" && facing === "inward");
  const vertical = edge === "left" || edge === "right";
  return {
    entryRotation: getTurnOrderFacingRotation(edge, facing),
    reverseEntries,
    arrowAtEnd: reverseEntries,
    arrowRotation: vertical ? (reverseEntries ? -90 : 90) : reverseEntries ? 180 : 0
  };
}

export function getTurnOrderFacingRotation(edge: PlayerViewEdge, facing: PlayerViewFacing): number {
  const inwardRotation = {
    top: 180,
    right: -90,
    bottom: 0,
    left: 90
  } satisfies Record<PlayerViewEdge, number>;
  const rotation = inwardRotation[edge];
  return facing === "inward" ? (rotation + 180) % 360 : rotation;
}
