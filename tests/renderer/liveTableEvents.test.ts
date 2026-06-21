import { describe, expect, it } from "vitest";
import type { LiveTableEvent } from "../../src/shared/localvtt";
import { DICE_HISTORY_DURATION_MS } from "../../src/renderer/lib/dice";
import { filterActiveLiveTableEvents, mergeLiveTableEvent } from "../../src/renderer/lib/liveTableEvents";
import { LASER_POINT_LIFETIME_MS, PING_DURATION_MS, RULER_EVENT_LIFETIME_MS } from "../../src/renderer/canvas/live-table";

describe("live table event lifecycle", () => {
  it("filters expired ping, dice, laser, and ruler events", () => {
    const now = 10_000;
    const events: LiveTableEvent[] = [
      { id: "ping-active", type: "ping", point: { x: 0, y: 0 }, createdAt: now - PING_DURATION_MS },
      { id: "ping-expired", type: "ping", point: { x: 0, y: 0 }, createdAt: now - PING_DURATION_MS - 1 },
      { id: "dice-active", type: "dice", die: "d20", result: 12, label: "12", seed: 1, createdAt: now - DICE_HISTORY_DURATION_MS },
      { id: "dice-expired", type: "dice", die: "d20", result: 12, label: "12", seed: 1, createdAt: now - DICE_HISTORY_DURATION_MS - 1 },
      {
        id: "laser",
        type: "laser",
        createdAt: now - 2_000,
        points: [
          { point: { x: 0, y: 0 }, createdAt: now - LASER_POINT_LIFETIME_MS - 1 },
          { point: { x: 1, y: 0 }, createdAt: now - LASER_POINT_LIFETIME_MS }
        ]
      },
      { id: "ruler-active", type: "ruler", points: [], primary: "5 ft", createdAt: now - RULER_EVENT_LIFETIME_MS },
      { id: "ruler-expired", type: "ruler", points: [], primary: "5 ft", createdAt: now - RULER_EVENT_LIFETIME_MS - 1 }
    ];

    expect(filterActiveLiveTableEvents(events, now)).toEqual([
      events[0],
      events[2],
      { ...events[4], points: [{ point: { x: 1, y: 0 }, createdAt: now - LASER_POINT_LIFETIME_MS }] },
      events[5]
    ]);
  });

  it("replaces existing events by id and clears dice or ruler event groups", () => {
    const now = 10_000;
    const dice: LiveTableEvent = { id: "dice", type: "dice", die: "d20", result: 12, label: "12", seed: 1, createdAt: now };
    const ruler: LiveTableEvent = { id: "ruler", type: "ruler", points: [], primary: "5 ft", createdAt: now };
    const replacement: LiveTableEvent = { id: "dice", type: "dice", die: "d20", result: 18, label: "18", seed: 2, createdAt: now + 1 };

    expect(mergeLiveTableEvent([dice], replacement, { now })).toEqual([replacement]);
    expect(mergeLiveTableEvent([dice, ruler], { id: "clear", type: "dice-clear", createdAt: now }, { now })).toEqual([ruler]);
    expect(mergeLiveTableEvent([dice, ruler], { id: "clear", type: "ruler-clear", createdAt: now }, { now })).toEqual([dice]);
  });

  it("removes hidden player events when player visibility is respected", () => {
    const now = 10_000;
    const ping: LiveTableEvent = { id: "ping", type: "ping", point: { x: 0, y: 0 }, createdAt: now, visibleInPlayer: false };
    const ruler: LiveTableEvent = { id: "ruler", type: "ruler", points: [], primary: "5 ft", createdAt: now };
    const hiddenRuler: LiveTableEvent = { ...ruler, visibleInPlayer: false };

    expect(mergeLiveTableEvent([ping], ping, { now, respectPlayerVisibility: true })).toEqual([]);
    expect(mergeLiveTableEvent([ruler], hiddenRuler, { now, respectPlayerVisibility: true })).toEqual([]);
    expect(mergeLiveTableEvent([], ping, { now })).toEqual([ping]);
  });

  it("removes existing hidden table events from Player View without filtering dice", () => {
    const now = 10_000;
    const visibleLaser: LiveTableEvent = {
      id: "laser",
      type: "laser",
      createdAt: now,
      visibleInPlayer: true,
      points: [{ point: { x: 0, y: 0 }, createdAt: now }]
    };
    const hiddenLaser: LiveTableEvent = {
      ...visibleLaser,
      visibleInPlayer: false,
      points: [{ point: { x: 1, y: 0 }, createdAt: now }]
    };
    const dice: LiveTableEvent = { id: "dice", type: "dice", die: "d20", result: 20, label: "20", seed: 1, createdAt: now };
    const hiddenPing: LiveTableEvent = { id: "ping", type: "ping", point: { x: 0, y: 0 }, createdAt: now, visibleInPlayer: false };

    expect(mergeLiveTableEvent([visibleLaser, dice], hiddenLaser, { now, respectPlayerVisibility: true })).toEqual([dice]);
    expect(mergeLiveTableEvent([dice], hiddenPing, { now, respectPlayerVisibility: true })).toEqual([dice]);
    expect(mergeLiveTableEvent([visibleLaser], dice, { now, respectPlayerVisibility: true })).toEqual([dice, visibleLaser]);
  });
});
