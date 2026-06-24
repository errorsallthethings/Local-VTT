import type { Point, Scene, Token } from "../../../shared/localvtt";
import { getNearestGridCellCenter, getNearestHexCenter, getSnappedTokenPosition, distanceBetween } from "../tokens/tokenGeometry";
import { appendWaypoint, getPathDistance, normalizeMovementPath } from "../tokens/movementPath";
import { updateSceneTokenPositions } from "../../lib/scene";
import type { TokenDragState } from "../scene/sceneInteractionTypes";
import type { TokenDragPreview } from "../tokens/tokenRenderer";

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

export function getSceneAfterTokenDrag(scene: Scene, tokenDrag: TokenDragState, token: Token, tokenDragPreview: TokenDragPreview | null): { scene: Scene; syncScene?: Scene } {
  const finalPosition = tokenDragPreview?.tokenId === token.id ? tokenDragPreview.snappedPosition : token.position;
  const snappedDelta = {
    x: finalPosition.x - tokenDrag.startPosition.x,
    y: finalPosition.y - tokenDrag.startPosition.y
  };
  const nextScene = updateSceneTokenPositions(scene, tokenDrag.groupStartPositions, snappedDelta);
  const tokenMovementPath = getTokenMovementPath(tokenDrag.startPosition, tokenDrag.waypoints, finalPosition);
  return {
    scene: nextScene,
    syncScene: tokenMovementPath
      ? {
          ...nextScene,
          tokenMovementPath: {
            tokenId: token.id,
            points: tokenMovementPath
          }
        }
      : undefined
  };
}

export function getTokenDragStart(scene: Scene, token: Token, point: Point, pointerId: number, groupTokenIds: string[]): { drag: TokenDragState; preview: TokenDragPreview } {
  const groupStartPositions = new Map(
    scene.tokens
      .filter((candidate) => groupTokenIds.includes(candidate.id))
      .map((candidate) => [candidate.id, candidate.position])
  );
  const snappedPosition = getSnappedTokenPosition(token.position, token, scene);
  return {
    drag: {
      pointerId,
      tokenId: token.id,
      startPosition: token.position,
      waypoints: [],
      groupStartPositions,
      offset: {
        x: point.x - token.position.x,
        y: point.y - token.position.y
      }
    },
    preview: {
      tokenId: token.id,
      startPosition: token.position,
      currentPosition: token.position,
      snappedPosition,
      waypoints: [],
      tokenPositions: groupStartPositions
    }
  };
}

export function getTokenDragPreviewFromPoint(scene: Scene, tokenDrag: TokenDragState, token: Token, point: Point): TokenDragPreview {
  const currentPosition = {
    x: point.x - tokenDrag.offset.x,
    y: point.y - tokenDrag.offset.y
  };
  const snappedPosition = getSnappedTokenPosition(currentPosition, token, scene);
  const currentDelta = {
    x: currentPosition.x - tokenDrag.startPosition.x,
    y: currentPosition.y - tokenDrag.startPosition.y
  };
  const tokenPositions = new Map(
    [...tokenDrag.groupStartPositions.entries()].map(([tokenId, startPosition]) => [
      tokenId,
      {
        x: startPosition.x + currentDelta.x,
        y: startPosition.y + currentDelta.y
      }
    ])
  );
  return {
    tokenId: token.id,
    startPosition: tokenDrag.startPosition,
    currentPosition,
    snappedPosition,
    waypoints: tokenDrag.waypoints,
    tokenPositions
  };
}

export function getTokenDragWithAppendedWaypoint(scene: Scene, tokenDrag: TokenDragState, token: Token, currentPosition: Point): TokenDragState {
  const waypoint = getTokenWaypointPosition(currentPosition, token, scene);
  const previousRoutePosition = tokenDrag.waypoints[tokenDrag.waypoints.length - 1] ?? tokenDrag.startPosition;
  return appendWaypoint(tokenDrag, waypoint, previousRoutePosition, (previousPosition, nextWaypoint) => isDuplicateTokenWaypoint(previousPosition, nextWaypoint, token, scene));
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
