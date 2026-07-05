import { describe, expect, it } from "vitest";
import { createDefaultScene, type EnvironmentEffectMask, type FogShape, type WeatherMask } from "../../src/shared/localvtt";
import {
  getEnvironmentEffectHitPointerStart,
  getMaskEffectPointerComplete,
  getMaskEffectPointerCompleteAction,
  getMaskEffectPointerMove,
  getMaskEffectPointerMoveAction,
  getMaskPointerStart,
  type EnvironmentEffectMoveState,
  type WeatherMaskMoveState
} from "../../src/renderer/components/scene/sceneMaskEffectPointer";

function weatherMask(overrides: Partial<WeatherMask> = {}): WeatherMask {
  return {
    id: "weather-1",
    kind: "rectangle",
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    ...overrides
  };
}

function environmentEffect(overrides: Partial<EnvironmentEffectMask> = {}): EnvironmentEffectMask {
  return {
    id: "effect-1",
    kind: "rectangle",
    effect: "water",
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    visibleInGm: true,
    visibleInPlayer: true,
    ...overrides
  };
}

function fogShape(overrides: Partial<FogShape> = {}): FogShape {
  return {
    id: "fog-1",
    operation: "hide",
    kind: "rectangle",
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    visibleInGm: true,
    visibleInPlayer: true,
    ...overrides
  };
}

describe("scene mask and effect pointer helpers", () => {
  it("returns environment effect selector hits without starting moves", () => {
    const scene = createDefaultScene("Effect Selector");
    scene.environment.effects = [environmentEffect()];

    expect(
      getEnvironmentEffectHitPointerStart({
        mouseBehavior: "selector",
        point: { x: 50, y: 50 },
        pointerId: 2,
        scene
      })
    ).toEqual({
      effectId: "effect-1",
      moveStart: null,
      preview: null
    });
  });

  it("starts environment effect grabber moves", () => {
    const scene = createDefaultScene("Effect Grabber");
    scene.environment.effects = [environmentEffect()];

    const start = getEnvironmentEffectHitPointerStart({
      mouseBehavior: "grabber",
      point: { x: 50, y: 50 },
      pointerId: 3,
      scene
    });

    expect(start?.effectId).toBe("effect-1");
    expect(start?.moveStart).toMatchObject({
      pointerId: 3,
      effectId: "effect-1",
      start: { x: 50, y: 50 },
      snapAnchor: { x: 50, y: 50 }
    });
    expect(start?.preview).toBe(start?.moveStart?.groupStartPoints);
    expect(start?.preview?.get("effect-1")).toEqual([{ x: 0, y: 0 }, { x: 100, y: 100 }]);
  });

  it("starts grouped weather mask grabber moves", () => {
    const scene = createDefaultScene("Weather Grabber");
    scene.weather.masks = [
      weatherMask({ id: "weather-1", points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] }),
      weatherMask({ id: "weather-2", points: [{ x: 200, y: 0 }, { x: 300, y: 100 }] })
    ];

    const start = getMaskPointerStart({
      mouseBehavior: "grabber",
      point: { x: 50, y: 50 },
      pointerId: 4,
      scene,
      selectedWeatherMaskIds: ["weather-1", "weather-2"]
    });

    expect(start?.kind).toBe("weather");
    if (start?.kind !== "weather") {
      return;
    }
    expect(start.dragGroup).toEqual({ itemIds: ["weather-1", "weather-2"], draggingSelectedGroup: true, shouldSelectHitItem: false });
    expect(start.moveStart).toMatchObject({
      pointerId: 4,
      maskId: "weather-1",
      start: { x: 50, y: 50 }
    });
    expect([...start.moveStart?.groupStartPoints.keys() ?? []]).toEqual(["weather-1", "weather-2"]);
    expect(start.preview).toBe(start.moveStart?.groupStartPoints);
  });

  it("returns fog hits after weather masks", () => {
    const scene = createDefaultScene("Fog Hit");
    scene.weather.masks = [];
    scene.fog.shapes = [fogShape()];

    expect(
      getMaskPointerStart({
        mouseBehavior: "selector",
        point: { x: 50, y: 50 },
        pointerId: 5,
        scene,
        selectedWeatherMaskIds: []
      })
    ).toEqual({
      kind: "fog",
      shapeId: "fog-1"
    });
  });

  it("updates weather and environment effect move previews", () => {
    const scene = createDefaultScene("Move Masks");
    scene.environment.effects = [environmentEffect()];
    scene.weather.masks = [weatherMask()];
    const weatherMoveState: WeatherMaskMoveState = {
      pointerId: 6,
      maskId: "weather-1",
      start: { x: 50, y: 50 },
      groupStartPoints: new Map([["weather-1", [{ x: 0, y: 0 }, { x: 100, y: 100 }]]])
    };
    const effectMoveState: EnvironmentEffectMoveState = {
      pointerId: 7,
      effectId: "effect-1",
      start: { x: 50, y: 50 },
      snapAnchor: { x: 50, y: 50 },
      groupStartPoints: new Map([["effect-1", [{ x: 0, y: 0 }, { x: 100, y: 100 }]]])
    };

    expect(
      getMaskEffectPointerMove({
        environmentEffectMoveState: effectMoveState,
        point: { x: 70, y: 80 },
        pointerId: 99,
        scene,
        snapEnabled: false,
        weatherMaskMoveState: weatherMoveState
      })
    ).toBeNull();
    expect(
      getMaskEffectPointerMove({
        environmentEffectMoveState: effectMoveState,
        point: { x: 70, y: 80 },
        pointerId: 6,
        scene,
        snapEnabled: false,
        weatherMaskMoveState: weatherMoveState
      })
    ).toEqual({
      kind: "weather",
      preview: new Map([["weather-1", [{ x: 20, y: 30 }, { x: 120, y: 130 }]]])
    });
    expect(
      getMaskEffectPointerMove({
        environmentEffectMoveState: effectMoveState,
        point: { x: 70, y: 80 },
        pointerId: 7,
        scene,
        snapEnabled: false,
        weatherMaskMoveState: null
      })
    ).toEqual({
      kind: "environment-effect",
      preview: new Map([["effect-1", [{ x: 20, y: 30 }, { x: 120, y: 130 }]]]),
      snapPoint: null
    });
  });

  it("maps mask and effect pointer moves to SceneCanvas actions", () => {
    const scene = createDefaultScene("Move Mask Actions");
    scene.environment.effects = [environmentEffect()];
    scene.weather.masks = [weatherMask()];
    const weatherMaskMoveState: WeatherMaskMoveState = {
      pointerId: 6,
      maskId: "weather-1",
      start: { x: 50, y: 50 },
      groupStartPoints: new Map([["weather-1", [{ x: 0, y: 0 }, { x: 100, y: 100 }]]])
    };
    const environmentEffectMoveState: EnvironmentEffectMoveState = {
      pointerId: 7,
      effectId: "effect-1",
      start: { x: 50, y: 50 },
      snapAnchor: { x: 50, y: 50 },
      groupStartPoints: new Map([["effect-1", [{ x: 0, y: 0 }, { x: 100, y: 100 }]]])
    };
    const weatherMove = getMaskEffectPointerMove({
      environmentEffectMoveState,
      point: { x: 70, y: 80 },
      pointerId: 6,
      scene,
      snapEnabled: false,
      weatherMaskMoveState
    });
    const effectMove = getMaskEffectPointerMove({
      environmentEffectMoveState,
      point: { x: 70, y: 80 },
      pointerId: 7,
      scene,
      snapEnabled: false,
      weatherMaskMoveState
    });

    expect(getMaskEffectPointerMoveAction(null)).toEqual({ kind: "none" });
    expect(getMaskEffectPointerMoveAction(weatherMove)).toEqual({
      kind: "set-weather-preview",
      preview: new Map([["weather-1", [{ x: 20, y: 30 }, { x: 120, y: 130 }]]])
    });
    expect(getMaskEffectPointerMoveAction(effectMove)).toEqual({
      kind: "set-environment-preview",
      preview: new Map([["effect-1", [{ x: 20, y: 30 }, { x: 120, y: 130 }]]]),
      snapPoint: null
    });
  });

  it("completes matching weather and environment effect move pointers", () => {
    const weatherPreview = new Map([["weather-1", [{ x: 10, y: 20 }, { x: 30, y: 40 }]]]);
    const environmentEffectPreview = new Map([["effect-1", [{ x: 50, y: 60 }, { x: 70, y: 80 }]]]);
    const weatherMaskMoveState: WeatherMaskMoveState = {
      pointerId: 8,
      maskId: "weather-1",
      start: { x: 0, y: 0 },
      groupStartPoints: new Map()
    };
    const environmentEffectMoveState: EnvironmentEffectMoveState = {
      pointerId: 9,
      effectId: "effect-1",
      start: { x: 0, y: 0 },
      snapAnchor: { x: 0, y: 0 },
      groupStartPoints: new Map()
    };

    expect(
      getMaskEffectPointerComplete({
        environmentEffectMoveState,
        environmentEffectPreview,
        pointerId: 8,
        weatherMaskMoveState,
        weatherMaskPreview: weatherPreview
      })
    ).toEqual({ kind: "weather", preview: weatherPreview });
    expect(
      getMaskEffectPointerComplete({
        environmentEffectMoveState,
        environmentEffectPreview,
        pointerId: 9,
        weatherMaskMoveState,
        weatherMaskPreview: weatherPreview
      })
    ).toEqual({ kind: "environment-effect", preview: environmentEffectPreview });
    expect(
      getMaskEffectPointerComplete({
        environmentEffectMoveState,
        environmentEffectPreview,
        pointerId: 99,
        weatherMaskMoveState,
        weatherMaskPreview: weatherPreview
      })
    ).toBeNull();
  });

  it("maps mask and effect pointer completions to SceneCanvas actions", () => {
    const weatherPreview = new Map([["weather-1", [{ x: 10, y: 20 }, { x: 30, y: 40 }]]]);
    const environmentEffectPreview = new Map([["effect-1", [{ x: 50, y: 60 }, { x: 70, y: 80 }]]]);
    const weatherMaskMoveState: WeatherMaskMoveState = {
      pointerId: 8,
      maskId: "weather-1",
      start: { x: 0, y: 0 },
      groupStartPoints: new Map()
    };
    const environmentEffectMoveState: EnvironmentEffectMoveState = {
      pointerId: 9,
      effectId: "effect-1",
      start: { x: 0, y: 0 },
      snapAnchor: { x: 0, y: 0 },
      groupStartPoints: new Map()
    };

    expect(getMaskEffectPointerCompleteAction(null)).toEqual({ kind: "none" });
    expect(
      getMaskEffectPointerCompleteAction(
        getMaskEffectPointerComplete({
          environmentEffectMoveState,
          environmentEffectPreview,
          pointerId: 8,
          weatherMaskMoveState,
          weatherMaskPreview: weatherPreview
        })
      )
    ).toEqual({ kind: "commit-weather", preview: weatherPreview });
    expect(
      getMaskEffectPointerCompleteAction(
        getMaskEffectPointerComplete({
          environmentEffectMoveState,
          environmentEffectPreview,
          pointerId: 9,
          weatherMaskMoveState,
          weatherMaskPreview: weatherPreview
        })
      )
    ).toEqual({ kind: "commit-environment-effect", preview: environmentEffectPreview });
  });
});
