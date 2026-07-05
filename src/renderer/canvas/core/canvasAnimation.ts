export const WEATHER_ONLY_FRAME_INTERVAL_MS = 50;

export interface CanvasAnimationSources {
  mapAnimating: boolean;
  tokenAnimating: boolean;
  tokenConditionAnimating: boolean;
  tableEventsAnimating: boolean;
  weatherAnimating: boolean;
  environmentAnimating: boolean;
  selectionAnimating: boolean;
}

export interface CanvasAnimationSourceOptions {
  environmentAnimating: boolean;
  mapAnimating: boolean;
  selectionAnimating: boolean;
  tableEventsAnimating: boolean;
  tokenAnimating: boolean;
  tokenConditionAnimating: boolean;
  weatherAnimating: boolean;
}

export function createCanvasAnimationSources(options: CanvasAnimationSourceOptions): CanvasAnimationSources {
  return {
    mapAnimating: options.mapAnimating,
    tokenAnimating: options.tokenAnimating,
    tokenConditionAnimating: options.tokenConditionAnimating,
    tableEventsAnimating: options.tableEventsAnimating,
    weatherAnimating: options.weatherAnimating,
    environmentAnimating: options.environmentAnimating,
    selectionAnimating: options.selectionAnimating
  };
}

export interface CanvasAnimationFramePlan {
  shouldDrawFrame: boolean;
  shouldRequestNextFrame: boolean;
  shouldUpdateEffectOnlyFrameAt: boolean;
  hasFullRateAnimation: boolean;
  effectAnimating: boolean;
}

export function hasCanvasAnimationSources(sources: CanvasAnimationSources): boolean {
  return (
    sources.mapAnimating ||
    sources.tokenAnimating ||
    sources.tokenConditionAnimating ||
    sources.tableEventsAnimating ||
    sources.weatherAnimating ||
    sources.environmentAnimating ||
    sources.selectionAnimating
  );
}

export function getCanvasAnimationFramePlan(
  sources: CanvasAnimationSources,
  timestamp: number,
  lastEffectOnlyFrameAt: number,
  effectOnlyFrameIntervalMs = WEATHER_ONLY_FRAME_INTERVAL_MS
): CanvasAnimationFramePlan {
  const hasFullRateAnimation =
    sources.mapAnimating ||
    sources.tokenAnimating ||
    sources.tokenConditionAnimating ||
    sources.tableEventsAnimating ||
    sources.selectionAnimating;
  const effectAnimating = sources.weatherAnimating || sources.environmentAnimating;
  const shouldDrawFrame = !effectAnimating || hasFullRateAnimation || timestamp - lastEffectOnlyFrameAt >= effectOnlyFrameIntervalMs;

  return {
    shouldDrawFrame,
    shouldRequestNextFrame: hasCanvasAnimationSources(sources),
    shouldUpdateEffectOnlyFrameAt: shouldDrawFrame && effectAnimating && !hasFullRateAnimation,
    hasFullRateAnimation,
    effectAnimating
  };
}
