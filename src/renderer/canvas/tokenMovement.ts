import type { Point, Scene, Token } from "../../shared/localvtt";
import { getNearestGridCellCenter, getNearestHexCenter, distanceBetween } from "./tokenGeometry";
import { getPathDistance, normalizeMovementPath } from "./movementPath";

export type TokenTween = {
  id: string;
  points: Point[];
  distance: number;
  durationMs: number;
};

export function getTokenMovementPath(startPosition: Point, waypoints: Point[], finalPosition: Point): Point[] | null {
  const points = normalizeMovementPath([startPosition, ...waypoints, finalPosition]);
  return points.length > 1 ? points : null;
}

export function getTokenMovementTweens(previousTokens: Token[], nextTokens: Token[], scene: Scene): TokenTween[] {
  const previousById = new Map(previousTokens.map((token) => [token.id, token]));
  const tweens: TokenTween[] = [];
  for (const nextToken of nextTokens) {
    const previousToken = previousById.get(nextToken.id);
    if (!previousToken || previousToken.assetId !== nextToken.assetId || hasTokenSizeChanged(previousToken, nextToken)) {
      continue;
    }
    if (distanceBetween(previousToken.position, nextToken.position) <= 2) {
      continue;
    }
    // Preserve the GM-authored route when a token move included Shift waypoints; otherwise animate direct movement.
    const points =
      scene.tokenMovementPath?.tokenId === nextToken.id
        ? normalizeMovementPath([previousToken.position, ...scene.tokenMovementPath.points.slice(1, -1), nextToken.position])
        : [previousToken.position, nextToken.position];
    const distance = getPathDistance(points);
    if (points.length < 2 || distance <= 2) {
      continue;
    }
    tweens.push({
      id: nextToken.id,
      points,
      distance,
      durationMs: getTokenMovementDurationMs(distance, nextToken, scene)
    });
  }
  return tweens;
}

export function getTokenMovementDurationMs(distance: number, token: Token, scene: Scene) {
  const movementUnit = scene.grid.type === "gridless" || scene.grid.sizePx <= 0 ? Math.max(1, token.size.width) : scene.grid.sizePx;
  return Math.max(320, Math.round((distance / movementUnit) * 400));
}

export function isDuplicateTokenWaypoint(existingPosition: Point, waypoint: Point, token: Token, scene: Scene) {
  const duplicateDistance = scene.grid.type === "gridless" ? Math.max(2, token.size.width) : 2;
  return distanceBetween(existingPosition, waypoint) <= duplicateDistance;
}

export function getTokenWaypointPosition(position: Point, token: Token, scene: Scene): Point {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return position;
  }

  const tokenCenter = {
    x: position.x + token.size.width / 2,
    y: position.y + token.size.height / 2
  };
  const waypointCenter = scene.grid.type === "hex" ? getNearestHexCenter(tokenCenter, scene.grid) : getNearestGridCellCenter(tokenCenter, scene.grid);
  return {
    x: waypointCenter.x - token.size.width / 2,
    y: waypointCenter.y - token.size.height / 2
  };
}

function hasTokenSizeChanged(previousToken: Token, nextToken: Token) {
  return previousToken.size.width !== nextToken.size.width || previousToken.size.height !== nextToken.size.height;
}
