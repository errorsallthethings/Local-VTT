import { describe, expect, it } from "vitest";
import type { LiveTableEvent, LiveTablePoint } from "../../src/shared/localvtt";
import {
  getActiveLaserPoints,
  getUpdatedLaserDrag,
  hasActiveLiveTableEvents,
  LASER_POINT_LIFETIME_MS,
  PING_DURATION_MS,
  RULER_RELEASE_LINGER_MS
} from "../../src/renderer/canvas/liveTableRenderer";

describe("liveTableRenderer", () => {
  it("keeps ping events active until their duration expires", () => {
    const now = 10_000;
    const activePing: LiveTableEvent = {
      id: "ping-active",
      type: "ping",
      point: { x: 4, y: 8 },
      createdAt: now - PING_DURATION_MS
    };
    const expiredPing: LiveTableEvent = {
      id: "ping-expired",
      type: "ping",
      point: { x: 4, y: 8 },
      createdAt: now - PING_DURATION_MS - 1
    };

    expect(hasActiveLiveTableEvents([activePing], now)).toBe(true);
    expect(hasActiveLiveTableEvents([expiredPing], now)).toBe(false);
  });

  it("keeps laser events active while any trail point is still visible", () => {
    const now = 10_000;
    const laser: LiveTableEvent = {
      id: "laser",
      type: "laser",
      createdAt: now - 2_000,
      points: [
        { point: { x: 0, y: 0 }, createdAt: now - LASER_POINT_LIFETIME_MS - 1 },
        { point: { x: 8, y: 0 }, createdAt: now - LASER_POINT_LIFETIME_MS }
      ]
    };

    expect(hasActiveLiveTableEvents([laser], now)).toBe(true);
  });

  it("filters expired laser points while preserving active point order", () => {
    const now = 10_000;
    const points: LiveTablePoint[] = [
      { point: { x: 0, y: 0 }, createdAt: now - LASER_POINT_LIFETIME_MS - 1 },
      { point: { x: 1, y: 0 }, createdAt: now - 700 },
      { point: { x: 2, y: 0 }, createdAt: now - 100 }
    ];

    expect(getActiveLaserPoints(points, now).map((point) => point.point.x)).toEqual([1, 2]);
  });

  it("skips laser drag updates until the pointer moves far enough", () => {
    expect(
      getUpdatedLaserDrag(
        {
          pointerId: 1,
          eventId: "laser-1",
          points: [{ point: { x: 0, y: 0 }, createdAt: 100 }]
        },
        { x: 4, y: 0 },
        200
      )
    ).toBeNull();
  });

  it("adds laser drag points and drops expired trail points", () => {
    const now = 2_000;

    expect(
      getUpdatedLaserDrag(
        {
          pointerId: 1,
          eventId: "laser-1",
          points: [
            { point: { x: 0, y: 0 }, createdAt: now - LASER_POINT_LIFETIME_MS - 1 },
            { point: { x: 5, y: 0 }, createdAt: now - 100 }
          ]
        },
        { x: 20, y: 0 },
        now
      )?.points
    ).toEqual([
      { point: { x: 5, y: 0 }, createdAt: now - 100 },
      { point: { x: 20, y: 0 }, createdAt: now }
    ]);
  });

  it("treats fully expired laser events as inactive", () => {
    const now = 10_000;
    const expiredLaser: LiveTableEvent = {
      id: "laser-expired",
      type: "laser",
      createdAt: now - 3_000,
      points: [
        { point: { x: 0, y: 0 }, createdAt: now - LASER_POINT_LIFETIME_MS - 2 },
        { point: { x: 8, y: 0 }, createdAt: now - LASER_POINT_LIFETIME_MS - 1 }
      ]
    };

    expect(hasActiveLiveTableEvents([expiredLaser], now)).toBe(false);
  });

  it("uses explicit expiry for released ruler events", () => {
    const now = 10_000;
    const activeRuler: LiveTableEvent = {
      id: "ruler-active",
      type: "ruler",
      points: [{ x: 0, y: 0 }, { x: 5, y: 5 }],
      primary: "5 ft",
      createdAt: now - 5_000,
      expiresAt: now
    };
    const expiredRuler: LiveTableEvent = {
      ...activeRuler,
      id: "ruler-expired",
      expiresAt: now - RULER_RELEASE_LINGER_MS - 1
    };

    expect(hasActiveLiveTableEvents([activeRuler], now)).toBe(true);
    expect(hasActiveLiveTableEvents([expiredRuler], now)).toBe(false);
  });
});
