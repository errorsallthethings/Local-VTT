import type { Campaign, LiveTableEvent, Point, Scene, Token } from "../../../shared/localvtt";
import type { RulerDrag, RulerLabel } from "../measurement/measurement";
import {
  formatMeasurementDistance,
  getMeasurementDistance,
  getMeasurementPathDistance,
  getRulerPathPoints,
  getStraightLineMeasurementDistance
} from "../measurement/measurement";
import { appendWaypoint } from "../tokens/movementPath";
import { getRulerSnapPoint } from "../scene/sceneSnapping";
import { distanceBetween } from "../tokens/tokenGeometry";
import type { TokenDragPreview } from "../tokens/tokenRenderer";

export function getRulerLabel(rulerDrag: RulerDrag, scene: Scene): RulerLabel {
  const pathPoints = getRulerPathPoints(rulerDrag);
  const primaryDistance = getMeasurementPathDistance(pathPoints, scene.grid, getMeasurementDistance);
  const primary = formatMeasurementDistance(primaryDistance, scene.grid.measurement, scene.grid.type);
  if (scene.grid.type === "gridless" || scene.grid.measurement.distanceMode === "euclidean") {
    return { primary };
  }

  const straightLine = formatMeasurementDistance(getMeasurementPathDistance(pathPoints, scene.grid, getStraightLineMeasurementDistance), scene.grid.measurement, scene.grid.type);
  return { primary, secondary: `Straight: ${straightLine}` };
}

export function getTokenMoveLabel(scene: Scene, preview: TokenDragPreview): string | null {
  const token = scene.tokens.find((candidate) => candidate.id === preview.tokenId);
  if (!token) {
    return null;
  }

  const pathPoints = [
    getTokenCenterPoint(token, preview.startPosition),
    ...preview.waypoints.map((waypoint) => getTokenCenterPoint(token, waypoint)),
    getTokenCenterPoint(token, preview.snappedPosition)
  ];
  const distance = getMeasurementPathDistance(pathPoints, scene.grid, getMeasurementDistance);
  return formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type);
}

export function getTokenCenterPoint(token: Token, position: Point): Point {
  return {
    x: position.x + token.size.width / 2,
    y: position.y + token.size.height / 2
  };
}

export function getPlayerDisplayScale(campaign: Campaign | null, scene: Scene | null, mode: "gm" | "player"): number {
  if (mode !== "player" || !campaign?.playerDisplay?.physicalScaleEnabled || !scene || scene.grid.sizePx <= 0) {
    return 1;
  }
  const targetCellSize = campaign.playerDisplay.pixelsPerInch * campaign.playerDisplay.inchesPerGridCell;
  if (!Number.isFinite(targetCellSize) || targetCellSize <= 0) {
    return 1;
  }
  return targetCellSize / scene.grid.sizePx;
}

export function isVisibleDiceOverlayEvent(event: LiveTableEvent, mode: "gm" | "player"): event is Extract<LiveTableEvent, { type: "dice" }> {
  return event.type === "dice" && shouldShowDiceOverlay(event, mode);
}

export function shouldShowDiceOverlay(event: Extract<LiveTableEvent, { type: "dice" }>, mode: "gm" | "player"): boolean {
  const displayMode = mode === "gm" ? event.gmDiceDisplay : event.playerDiceDisplay;
  if (displayMode) {
    return displayMode !== "hidden";
  }
  const presentation = mode === "gm" ? event.gmPresentation : event.playerPresentation;
  return presentation ? presentation === "3d" : event.presentation === "3d";
}

export function isDuplicateRulerWaypoint(existingPosition: Point, waypoint: Point, scene: Scene): boolean {
  const duplicateDistance = scene.grid.type === "gridless" ? 12 : 2;
  return distanceBetween(existingPosition, waypoint) <= duplicateDistance;
}

export function getRulerDragWithAppendedWaypoint<TRulerDrag extends RulerDrag>(scene: Scene, rulerDrag: TRulerDrag, snap: boolean): TRulerDrag {
  const waypoint = snap ? (getRulerSnapPoint(rulerDrag.current, scene) ?? rulerDrag.current) : rulerDrag.current;
  const previousRoutePosition = rulerDrag.waypoints[rulerDrag.waypoints.length - 1] ?? rulerDrag.start;
  const nextRulerPath = appendWaypoint(rulerDrag, waypoint, previousRoutePosition, (previousPosition, nextWaypoint) => isDuplicateRulerWaypoint(previousPosition, nextWaypoint, scene));
  return nextRulerPath === rulerDrag ? rulerDrag : { ...nextRulerPath, current: waypoint };
}
