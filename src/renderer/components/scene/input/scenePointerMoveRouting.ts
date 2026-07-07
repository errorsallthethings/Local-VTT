export type ScenePointerMoveRoute =
  | "map-calibration"
  | "laser"
  | "ruler"
  | "selection"
  | "drawing"
  | "drawing-transform"
  | "mask-effect"
  | "token"
  | "fog"
  | "weather-mask"
  | "environment-effect"
  | "pan"
  | "none";

export interface PointerTrackedInteraction {
  pointerId: number;
}

export interface ScenePointerMoveRoutingOptions {
  pointerId: number;
  mapCalibrationDrag?: PointerTrackedInteraction | null;
  laserDrag?: PointerTrackedInteraction | null;
  rulerDrag?: PointerTrackedInteraction | null;
  selectionDrag?: PointerTrackedInteraction | null;
  drawingDrag?: PointerTrackedInteraction | null;
  drawingMoveDrag?: PointerTrackedInteraction | null;
  drawingResizeDrag?: PointerTrackedInteraction | null;
  drawingRotateDrag?: PointerTrackedInteraction | null;
  weatherMaskMove?: PointerTrackedInteraction | null;
  environmentEffectMove?: PointerTrackedInteraction | null;
  tokenDrag?: PointerTrackedInteraction | null;
  fogDrag?: PointerTrackedInteraction | null;
  weatherMaskDrag?: PointerTrackedInteraction | null;
  environmentEffectDrag?: PointerTrackedInteraction | null;
  panDrag?: PointerTrackedInteraction | null;
}

export function getScenePointerMoveRoute(options: ScenePointerMoveRoutingOptions): ScenePointerMoveRoute {
  const pointerId = options.pointerId;
  if (matchesPointer(options.mapCalibrationDrag, pointerId)) {
    return "map-calibration";
  }
  if (matchesPointer(options.laserDrag, pointerId)) {
    return "laser";
  }
  if (matchesPointer(options.rulerDrag, pointerId)) {
    return "ruler";
  }
  if (matchesPointer(options.selectionDrag, pointerId)) {
    return "selection";
  }
  if (matchesPointer(options.drawingDrag, pointerId)) {
    return "drawing";
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
  if (matchesPointer(options.tokenDrag, pointerId)) {
    return "token";
  }
  if (matchesPointer(options.fogDrag, pointerId)) {
    return "fog";
  }
  if (matchesPointer(options.weatherMaskDrag, pointerId)) {
    return "weather-mask";
  }
  if (matchesPointer(options.environmentEffectDrag, pointerId)) {
    return "environment-effect";
  }
  if (matchesPointer(options.panDrag, pointerId)) {
    return "pan";
  }
  return "none";
}

function matchesPointer(interaction: PointerTrackedInteraction | null | undefined, pointerId: number): boolean {
  return interaction?.pointerId === pointerId;
}
