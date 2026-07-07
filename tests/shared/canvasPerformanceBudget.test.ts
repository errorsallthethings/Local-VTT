import { describe, expect, it } from "vitest";
import {
  CANVAS_PERFORMANCE_BUDGET,
  evaluateCanvasFrameBudget,
  evaluateCanvasReadyBudget,
  summarizeCanvasFrameTimes
} from "../../src/shared/canvasPerformanceBudget";
import { ENVIRONMENT_EFFECT_TYPES } from "../../src/shared/environmentEffectCatalog";
import { assertValidScene, createDefaultScene, normalizeScene, type EnvironmentEffectMask, type FogShape, type Scene, type Token, type WeatherMask } from "../../src/shared/localvtt";

function createRepresentativeStressScenes(): Record<string, Scene> {
  return {
    largeStaticMap: normalizeScene({
      ...createDefaultScene("Performance Budget - Large Static Map"),
      mapAssetId: "large-static-map",
      grid: {
        ...createDefaultScene("grid").grid,
        type: "square",
        sizePx: 64,
        mapGridColumns: 128,
        mapGridRows: 128
      },
      notes: "Representative performance scene: 8192 x 8192 static map."
    }),
    largeVideoMap: normalizeScene({
      ...createDefaultScene("Performance Budget - Large Video Map"),
      mapAssetId: "large-video-map",
      videoPlayback: { diagnosticsVisible: false, muted: true, paused: false },
      notes: "Representative performance scene: 3840 x 2160 looping video map."
    }),
    manyTokens: sceneWithLoad("Performance Budget - Many Tokens", {
      tokens: createTokens(CANVAS_PERFORMANCE_BUDGET.representativeLoad.tokenCount)
    }),
    manyFogShapes: sceneWithLoad("Performance Budget - Many Fog Shapes", {
      fogShapes: createFogShapes(CANVAS_PERFORMANCE_BUDGET.representativeLoad.fogShapeCount)
    }),
    activeEffects: sceneWithLoad("Performance Budget - Active Effects", {
      environmentEffects: createEnvironmentEffects(CANVAS_PERFORMANCE_BUDGET.representativeLoad.environmentEffectCount),
      weatherMasks: createWeatherMasks(CANVAS_PERFORMANCE_BUDGET.representativeLoad.weatherMaskCount)
    }),
    combinedStress: sceneWithLoad("Performance Budget - Combined Stress", {
      tokens: createTokens(CANVAS_PERFORMANCE_BUDGET.representativeLoad.tokenCount),
      fogShapes: createFogShapes(CANVAS_PERFORMANCE_BUDGET.representativeLoad.fogShapeCount),
      environmentEffects: createEnvironmentEffects(CANVAS_PERFORMANCE_BUDGET.representativeLoad.combinedEffectCount),
      weatherMasks: createWeatherMasks(CANVAS_PERFORMANCE_BUDGET.representativeLoad.weatherMaskCount),
      notes: "Combined stress scene: large map budget plus tokens, fog, weather masks, and animated effects."
    })
  };
}

function sceneWithLoad(
  name: string,
  load: {
    tokens?: Token[];
    fogShapes?: FogShape[];
    environmentEffects?: EnvironmentEffectMask[];
    weatherMasks?: WeatherMask[];
    notes?: string;
  }
): Scene {
  const scene = createDefaultScene(name);
  scene.mapAssetId = "large-static-map";
  scene.grid = { ...scene.grid, type: "square", sizePx: 64, mapGridColumns: 128, mapGridRows: 128 };
  scene.tokens = load.tokens ?? [];
  scene.fog = { ...scene.fog, mode: "partial", shapes: load.fogShapes ?? [] };
  scene.environment = { effects: load.environmentEffects ?? [] };
  scene.weather = {
    ...scene.weather,
    enabled: Boolean(load.weatherMasks?.length),
    effect: load.weatherMasks?.length ? "rain" : "none",
    masks: load.weatherMasks ?? [],
    effects: {
      ...scene.weather.effects,
      rain: { ...scene.weather.effects.rain, enabled: Boolean(load.weatherMasks?.length), pattern: "rain" }
    }
  };
  scene.notes = load.notes ?? `Representative performance scene: ${name}.`;
  return normalizeScene(scene);
}

function createTokens(count: number): Token[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `token-${index + 1}`,
    name: `Token ${index + 1}`,
    position: gridPosition(index, 64),
    size: { width: 64, height: 64 },
    order: index,
    hidden: false,
    visibleInGm: true,
    visibleInPlayer: index % 5 !== 0
  }));
}

function createFogShapes(count: number): FogShape[] {
  return Array.from({ length: count }, (_, index) => {
    const position = gridPosition(index, 96);
    const common = {
      id: `fog-shape-${index + 1}`,
      name: `Fog Shape ${index + 1}`,
      operation: index % 2 === 0 ? "reveal" : "hide",
      visibleInGm: true,
      visibleInPlayer: true
    } as const;

    if (index % 3 === 0) {
      return { ...common, kind: "rectangle", points: [position, { x: position.x + 64, y: position.y + 64 }] };
    }

    if (index % 3 === 1) {
      return { ...common, kind: "circle", points: [position], radius: 48 };
    }

    return {
      ...common,
      kind: "polygon",
      points: [position, { x: position.x + 64, y: position.y + 16 }, { x: position.x + 32, y: position.y + 72 }]
    };
  });
}

function createEnvironmentEffects(count: number): EnvironmentEffectMask[] {
  return Array.from({ length: count }, (_, index) => {
    const position = gridPosition(index, 160);
    return {
      id: `environment-effect-${index + 1}`,
      name: `Environment Effect ${index + 1}`,
      kind: index % 2 === 0 ? "rectangle" : "circle",
      effect: ENVIRONMENT_EFFECT_TYPES[index % ENVIRONMENT_EFFECT_TYPES.length],
      points: index % 2 === 0 ? [position, { x: position.x + 192, y: position.y + 128 }] : [position],
      radius: index % 2 === 0 ? undefined : 96,
      feather: 0.2,
      visibleInGm: true,
      visibleInPlayer: true
    };
  });
}

function createWeatherMasks(count: number): WeatherMask[] {
  return Array.from({ length: count }, (_, index) => {
    const position = gridPosition(index, 192);
    return {
      id: `weather-mask-${index + 1}`,
      name: `Weather Mask ${index + 1}`,
      kind: "rectangle",
      points: [position, { x: position.x + 160, y: position.y + 96 }],
      visible: true,
      visibleInPlayer: true
    };
  });
}

function gridPosition(index: number, spacing: number): { x: number; y: number } {
  return {
    x: (index % 25) * spacing,
    y: Math.floor(index / 25) * spacing
  };
}

describe("canvas performance budget", () => {
  it("keeps frame and ready-time budgets ordered from target to warning", () => {
    expect(CANVAS_PERFORMANCE_BUDGET.frameTimeMs.idleP95Target).toBeLessThanOrEqual(16.7);
    expect(CANVAS_PERFORMANCE_BUDGET.frameTimeMs.idleP95Target).toBeLessThan(CANVAS_PERFORMANCE_BUDGET.frameTimeMs.idleP95Warning);
    expect(CANVAS_PERFORMANCE_BUDGET.frameTimeMs.idleP95Warning).toBeLessThanOrEqual(CANVAS_PERFORMANCE_BUDGET.frameTimeMs.interactionP95Target);
    expect(CANVAS_PERFORMANCE_BUDGET.frameTimeMs.interactionP95Target).toBeLessThan(CANVAS_PERFORMANCE_BUDGET.frameTimeMs.interactionP95Warning);
    expect(CANVAS_PERFORMANCE_BUDGET.frameTimeMs.interactionP95Warning).toBeLessThan(CANVAS_PERFORMANCE_BUDGET.frameTimeMs.longFrameWarning);
    expect(CANVAS_PERFORMANCE_BUDGET.firstReadyMs.staticMapTarget).toBeLessThan(CANVAS_PERFORMANCE_BUDGET.firstReadyMs.combinedStressTarget);
    expect(CANVAS_PERFORMANCE_BUDGET.firstReadyMs.staticMapTarget).toBeLessThan(CANVAS_PERFORMANCE_BUDGET.firstReadyMs.staticMapWarning);
    expect(CANVAS_PERFORMANCE_BUDGET.firstReadyMs.videoMapTarget).toBeLessThan(CANVAS_PERFORMANCE_BUDGET.firstReadyMs.combinedStressTarget);
    expect(CANVAS_PERFORMANCE_BUDGET.firstReadyMs.videoMapTarget).toBeLessThan(CANVAS_PERFORMANCE_BUDGET.firstReadyMs.videoMapWarning);
    expect(CANVAS_PERFORMANCE_BUDGET.firstReadyMs.combinedStressTarget).toBeLessThan(CANVAS_PERFORMANCE_BUDGET.firstReadyMs.combinedStressWarning);
  });

  it("summarizes frame samples with a nearest-rank p95 and long-frame count", () => {
    const summary = summarizeCanvasFrameTimes([8, 12, Number.NaN, -1, 14, 16, 18, 20, 22, 24, 110, Number.POSITIVE_INFINITY]);

    expect(summary.sampleCount).toBe(9);
    expect(summary.p95).toBe(110);
    expect(summary.max).toBe(110);
    expect(summary.longFrameCount).toBe(1);
  });

  it("evaluates frame budgets from shared thresholds", () => {
    expect(evaluateCanvasFrameBudget(summarizeCanvasFrameTimes([10, 12, 14, 16]), "idle")).toBe("target");
    expect(evaluateCanvasFrameBudget(summarizeCanvasFrameTimes([20, 22, 24, 30]), "idle")).toBe("warning");
    expect(evaluateCanvasFrameBudget(summarizeCanvasFrameTimes([34, 40, 42, 55]), "idle")).toBe("over-budget");
    expect(evaluateCanvasFrameBudget(summarizeCanvasFrameTimes([24, 28, 30, 36]), "interaction")).toBe("warning");
  });

  it("evaluates first-ready budgets from shared thresholds", () => {
    expect(evaluateCanvasReadyBudget(1400, "staticMap")).toBe("target");
    expect(evaluateCanvasReadyBudget(2000, "staticMap")).toBe("warning");
    expect(evaluateCanvasReadyBudget(2600, "staticMap")).toBe("over-budget");
    expect(evaluateCanvasReadyBudget(Number.NaN, "videoMap")).toBe("over-budget");
  });

  it("defines representative scene loads for release performance checks", () => {
    const scenes = createRepresentativeStressScenes();

    expect(scenes.largeStaticMap.grid.mapGridColumns).toBe(128);
    expect(scenes.largeStaticMap.grid.mapGridRows).toBe(128);
    expect(scenes.largeStaticMap.notes).toContain("8192 x 8192");
    expect(scenes.largeVideoMap.notes).toContain("3840 x 2160");
    expect(scenes.manyTokens.tokens).toHaveLength(CANVAS_PERFORMANCE_BUDGET.representativeLoad.tokenCount);
    expect(scenes.manyFogShapes.fog.shapes).toHaveLength(CANVAS_PERFORMANCE_BUDGET.representativeLoad.fogShapeCount);
    expect(scenes.activeEffects.environment.effects).toHaveLength(CANVAS_PERFORMANCE_BUDGET.representativeLoad.environmentEffectCount);
    expect(scenes.activeEffects.weather.masks).toHaveLength(CANVAS_PERFORMANCE_BUDGET.representativeLoad.weatherMaskCount);
    expect(scenes.combinedStress.tokens).toHaveLength(CANVAS_PERFORMANCE_BUDGET.representativeLoad.tokenCount);
    expect(scenes.combinedStress.fog.shapes).toHaveLength(CANVAS_PERFORMANCE_BUDGET.representativeLoad.fogShapeCount);
    expect(scenes.combinedStress.environment.effects).toHaveLength(CANVAS_PERFORMANCE_BUDGET.representativeLoad.combinedEffectCount);
  });

  it("keeps all representative stress scenes valid against the scene model", () => {
    for (const scene of Object.values(createRepresentativeStressScenes())) {
      assertValidScene(scene);
    }
  });
});
