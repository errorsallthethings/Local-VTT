export type ScenePointerUpRoute =
  | "map-calibration"
  | "drawing"
  | "weather-mask"
  | "environment-effect"
  | "fog"
  | "ruler"
  | "selection"
  | "drawing-transform"
  | "mask-effect"
  | "laser"
  | "none";

export interface PointerTrackedInteraction {
  pointerId: number;
}

export interface ScenePointerUpRoutingOptions {
  pointerId: number;
  mapCalibrationDrag?: PointerTrackedInteraction | null;
  drawingDrag?: PointerTrackedInteraction | null;
  weatherMaskDrag?: PointerTrackedInteraction | null;
  environmentEffectDrag?: PointerTrackedInteraction | null;
  fogDrag?: PointerTrackedInteraction | null;
  rulerDrag?: PointerTrackedInteraction | null;
  selectionDrag?: PointerTrackedInteraction | null;
  drawingMoveDrag?: PointerTrackedInteraction | null;
  drawingResizeDrag?: PointerTrackedInteraction | null;
  drawingRotateDrag?: PointerTrackedInteraction | null;
  weatherMaskMove?: PointerTrackedInteraction | null;
  environmentEffectMove?: PointerTrackedInteraction | null;
  laserDrag?: PointerTrackedInteraction | null;
}

export function getScenePointerUpRoute(options: ScenePointerUpRoutingOptions): ScenePointerUpRoute {
  const pointerId = options.pointerId;
  if (matchesPointer(options.mapCalibrationDrag, pointerId)) {
    return "map-calibration";
  }
  if (matchesPointer(options.drawingDrag, pointerId)) {
    return "drawing";
  }
  if (matchesPointer(options.weatherMaskDrag, pointerId)) {
    return "weather-mask";
  }
  if (matchesPointer(options.environmentEffectDrag, pointerId)) {
    return "environment-effect";
  }
  if (matchesPointer(options.fogDrag, pointerId)) {
    return "fog";
  }
  if (matchesPointer(options.rulerDrag, pointerId)) {
    return "ruler";
  }
  if (matchesPointer(options.selectionDrag, pointerId)) {
    return "selection";
  }
  if (
    matchesPointer(options.drawingMoveDrag, pointerId) ||
    matchesPointer(options.drawingResizeDrag, pointerId) ||
    matchesPointer(options.drawingRotateDrag, pointerId)
  ) {
    return "drawing-transform";
  }
  if (matchesPointer(options.weatherMaskMove, pointerId) || matchesPointer(options.environmentEffectMove, pointerId)) {
    return "mask-effect";
  }
  if (matchesPointer(options.laserDrag, pointerId)) {
    return "laser";
  }
  return "none";
}

function matchesPointer(interaction: PointerTrackedInteraction | null | undefined, pointerId: number): boolean {
  return interaction?.pointerId === pointerId;
}
