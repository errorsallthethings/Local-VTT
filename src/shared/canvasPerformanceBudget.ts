export type CanvasFrameScenario = "idle" | "interaction";
export type CanvasReadyScenario = "staticMap" | "videoMap" | "combinedStress";
export type CanvasBudgetStatus = "target" | "warning" | "over-budget";

export interface CanvasFrameSummary {
  sampleCount: number;
  p95: number;
  max: number;
  longFrameCount: number;
}

export const CANVAS_PERFORMANCE_BUDGET = {
  frameTimeMs: {
    idleP95Target: 16.7,
    idleP95Warning: 33.3,
    interactionP95Target: 33.3,
    interactionP95Warning: 50,
    longFrameWarning: 100
  },
  firstReadyMs: {
    staticMapTarget: 1500,
    staticMapWarning: 2500,
    videoMapTarget: 2500,
    videoMapWarning: 4000,
    combinedStressTarget: 3000,
    combinedStressWarning: 5000
  },
  representativeLoad: {
    largeStaticMapPixels: { width: 8192, height: 8192 },
    largeVideoMapPixels: { width: 3840, height: 2160 },
    tokenCount: 250,
    fogShapeCount: 500,
    environmentEffectCount: 24,
    weatherMaskCount: 24,
    combinedEffectCount: 16
  }
} as const;

export function summarizeCanvasFrameTimes(frameTimesMs: readonly number[]): CanvasFrameSummary {
  const sortedFrameTimes = getSortedValidFrameTimes(frameTimesMs);

  if (sortedFrameTimes.length === 0) {
    return {
      sampleCount: 0,
      p95: 0,
      max: 0,
      longFrameCount: 0
    };
  }

  return {
    sampleCount: sortedFrameTimes.length,
    p95: getPercentileFromSortedValues(sortedFrameTimes, 95),
    max: sortedFrameTimes[sortedFrameTimes.length - 1],
    longFrameCount: sortedFrameTimes.filter((frameTimeMs) => frameTimeMs >= CANVAS_PERFORMANCE_BUDGET.frameTimeMs.longFrameWarning).length
  };
}

export function evaluateCanvasFrameBudget(summary: CanvasFrameSummary, scenario: CanvasFrameScenario): CanvasBudgetStatus {
  const { target, warning } = getFrameBudgetThresholds(scenario);

  if (summary.p95 > warning || summary.longFrameCount > 1) {
    return "over-budget";
  }

  if (summary.p95 > target || summary.longFrameCount > 0) {
    return "warning";
  }

  return "target";
}

export function evaluateCanvasReadyBudget(readyMs: number, scenario: CanvasReadyScenario): CanvasBudgetStatus {
  const { target, warning } = getReadyBudgetThresholds(scenario);
  const normalizedReadyMs = Number.isFinite(readyMs) ? Math.max(0, readyMs) : Number.POSITIVE_INFINITY;

  if (normalizedReadyMs > warning) {
    return "over-budget";
  }

  if (normalizedReadyMs > target) {
    return "warning";
  }

  return "target";
}

function getSortedValidFrameTimes(frameTimesMs: readonly number[]): number[] {
  return frameTimesMs.filter((frameTimeMs) => Number.isFinite(frameTimeMs) && frameTimeMs >= 0).sort((a, b) => a - b);
}

function getPercentileFromSortedValues(sortedValues: readonly number[], percentile: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  const boundedPercentile = Math.min(100, Math.max(0, percentile));
  const index = Math.ceil((boundedPercentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

function getFrameBudgetThresholds(scenario: CanvasFrameScenario): { target: number; warning: number } {
  if (scenario === "idle") {
    return {
      target: CANVAS_PERFORMANCE_BUDGET.frameTimeMs.idleP95Target,
      warning: CANVAS_PERFORMANCE_BUDGET.frameTimeMs.idleP95Warning
    };
  }

  return {
    target: CANVAS_PERFORMANCE_BUDGET.frameTimeMs.interactionP95Target,
    warning: CANVAS_PERFORMANCE_BUDGET.frameTimeMs.interactionP95Warning
  };
}

function getReadyBudgetThresholds(scenario: CanvasReadyScenario): { target: number; warning: number } {
  if (scenario === "staticMap") {
    return {
      target: CANVAS_PERFORMANCE_BUDGET.firstReadyMs.staticMapTarget,
      warning: CANVAS_PERFORMANCE_BUDGET.firstReadyMs.staticMapWarning
    };
  }

  if (scenario === "videoMap") {
    return {
      target: CANVAS_PERFORMANCE_BUDGET.firstReadyMs.videoMapTarget,
      warning: CANVAS_PERFORMANCE_BUDGET.firstReadyMs.videoMapWarning
    };
  }

  return {
    target: CANVAS_PERFORMANCE_BUDGET.firstReadyMs.combinedStressTarget,
    warning: CANVAS_PERFORMANCE_BUDGET.firstReadyMs.combinedStressWarning
  };
}
