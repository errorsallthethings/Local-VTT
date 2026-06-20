import type { LiveTableEvent } from "../../shared/localvtt";
import { LASER_POINT_LIFETIME_MS, PING_DURATION_MS, RULER_EVENT_LIFETIME_MS } from "../canvas/liveTableRenderer";
import { DICE_HISTORY_DURATION_MS } from "./dice";

export interface MergeLiveTableEventOptions {
  now?: number;
  respectPlayerVisibility?: boolean;
}

export function mergeLiveTableEvent(events: LiveTableEvent[], event: LiveTableEvent, options: MergeLiveTableEventOptions = {}): LiveTableEvent[] {
  const filteredEvents = filterActiveLiveTableEvents(events, options.now);
  if (options.respectPlayerVisibility && event.type !== "dice" && event.type !== "dice-clear" && "visibleInPlayer" in event && event.visibleInPlayer === false) {
    if (event.type === "ruler") {
      return filteredEvents.filter((candidate) => candidate.type !== "ruler");
    }
    return filteredEvents.filter((candidate) => candidate.id !== event.id);
  }
  if (event.type === "dice-clear") {
    return filteredEvents.filter((candidate) => candidate.type !== "dice");
  }
  if (event.type === "ruler-clear") {
    return filteredEvents.filter((candidate) => candidate.type !== "ruler");
  }
  return [event, ...filteredEvents.filter((candidate) => candidate.id !== event.id)];
}

export function filterActiveLiveTableEvents(events: LiveTableEvent[], now = Date.now()): LiveTableEvent[] {
  const activeEvents: LiveTableEvent[] = [];
  for (const event of events) {
    if (event.type === "ping") {
      if (now - event.createdAt <= PING_DURATION_MS) {
        activeEvents.push(event);
      }
    } else if (event.type === "dice") {
      if (now - event.createdAt <= DICE_HISTORY_DURATION_MS) {
        activeEvents.push(event);
      }
    } else if (event.type === "laser") {
      const points = event.points.filter((point) => now - point.createdAt <= LASER_POINT_LIFETIME_MS);
      if (points.length > 0) {
        activeEvents.push({ ...event, points });
      }
    } else if (event.type === "ruler") {
      if (now <= (event.expiresAt ?? event.createdAt + RULER_EVENT_LIFETIME_MS)) {
        activeEvents.push(event);
      }
    }
  }
  return activeEvents;
}
