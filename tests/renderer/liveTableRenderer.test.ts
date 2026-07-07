import { describe, expect, it } from "vitest";
import { DEFAULT_GRID, DEFAULT_TABLE_TOOLS } from "../../src/shared/localvtt";
import type { GridSettings, LiveTableEvent, LiveTablePoint, Scene } from "../../src/shared/localvtt";
import {
  createLaserDragStart,
  createLaserLiveTableEvent,
  createPingLiveTableEvent,
  createRulerClearEvent,
  createRulerDrag,
  createRulerLiveTableEvent,
  getActiveLaserPoints,
  getUpdatedLaserDrag,
  hasActiveLiveTableEvents,
  LASER_POINT_LIFETIME_MS,
  PING_DURATION_MS,
  RULER_RELEASE_LINGER_MS
} from "../../src/renderer/canvas/live-table";

const squareGrid: GridSettings = {
  ...DEFAULT_GRID,
  type: "square",
  sizePx: 70,
  measurement: {
    unit: "feet",
    unitsPerGridCell: 5,
    distanceMode: "manhattan"
  }
};

const sceneForMeasurement = {
  id: "scene-1",
  name: "Scene",
  grid: squareGrid
} as Scene;

describe("liveTableRenderer", () => {
  it("creates ping events from table tool settings", () => {
    expect(createPingLiveTableEvent("ping-1", { x: 10, y: 20 }, { ...DEFAULT_TABLE_TOOLS, pingSize: 2, pingColor: "#abcdef" }, false, 123)).toEqual({
      id: "ping-1",
      type: "ping",
      point: { x: 10, y: 20 },
      size: 2,
      color: "#abcdef",
      visibleInPlayer: false,
      createdAt: 123
    });
  });

  it("creates laser drag state and events with a shared id and first point timestamp", () => {
    const { drag, event } = createLaserDragStart(7, "laser-1", { x: 1, y: 2 }, { ...DEFAULT_TABLE_TOOLS, laserThickness: 12, laserColor: "#123456" }, true, 500);

    expect(drag).toEqual({
      pointerId: 7,
      eventId: "laser-1",
      points: [{ point: { x: 1, y: 2 }, createdAt: 500 }]
    });
    expect(event).toEqual({
      id: "laser-1",
      type: "laser",
      createdAt: 500,
      points: drag.points,
      thickness: 12,
      color: "#123456",
      visibleInPlayer: true
    });
  });

  it("keeps laser event creation time anchored to the first drag point", () => {
    const event = createLaserLiveTableEvent(
      "laser-1",
      [
        { point: { x: 0, y: 0 }, createdAt: 100 },
        { point: { x: 50, y: 0 }, createdAt: 250 }
      ],
      DEFAULT_TABLE_TOOLS,
      false,
      999
    );

    expect(event.createdAt).toBe(100);
    expect(event.points).toHaveLength(2);
  });

  it("creates ruler drag and live events with optional expiry", () => {
    const drag = createRulerDrag(9, { x: 0, y: 0 });
    const movedDrag = { ...drag, current: { x: 70, y: 0 } };

    expect(drag).toEqual({ pointerId: 9, start: { x: 0, y: 0 }, current: { x: 0, y: 0 }, waypoints: [] });
    expect(createRulerLiveTableEvent(movedDrag, sceneForMeasurement, true, 1000, 1500)).toMatchObject({
      id: "ruler-live",
      type: "ruler",
      points: [
        { x: 0, y: 0 },
        { x: 70, y: 0 }
      ],
      primary: "5 feet",
      visibleInPlayer: true,
      createdAt: 1000,
      expiresAt: 1500
    });
  });

  it("creates ruler clear events", () => {
    expect(createRulerClearEvent(321)).toEqual({
      id: "ruler-clear",
      type: "ruler-clear",
      createdAt: 321
    });
  });

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
