import { describe, expect, it } from "vitest";
import type { LiveTableEvent, LiveTablePoint } from "../../src/shared/localvtt";
import { getActiveLaserPoints, hasActiveLiveTableEvents, LASER_POINT_LIFETIME_MS, PING_DURATION_MS } from "../../src/renderer/canvas/liveTableRenderer";

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
});
