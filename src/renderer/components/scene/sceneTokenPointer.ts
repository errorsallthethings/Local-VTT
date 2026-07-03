import type { Point, Scene, Token } from "../../../shared/localvtt";
import type { TokenDragState } from "../../canvas/scene";
import { getSceneItemDragGroup, type SceneItemDragGroup } from "../../canvas/scene";
import { getTokenAtPoint, getTokenDragPreviewFromPoint, getTokenDragStart, type TokenDragPreview } from "../../canvas/tokens";

export type TokenPointerMouseBehavior = "selector" | "grabber";

export interface TokenPointerStartOptions {
  canShowTokens: boolean;
  mouseBehavior: TokenPointerMouseBehavior;
  point: Point;
  pointerId: number;
  scene: Scene;
  selectedTokenIds: readonly string[];
}

export interface TokenPointerStart {
  dragGroup: SceneItemDragGroup;
  dragStart: { drag: TokenDragState; preview: TokenDragPreview } | null;
  token: Token;
}

export function getTokenPointerStart(options: TokenPointerStartOptions): TokenPointerStart | null {
  if (!options.canShowTokens) {
    return null;
  }

  const token = getTokenAtPoint(options.scene.tokens, options.point);
  if (!token) {
    return null;
  }

  const dragGroup = getSceneItemDragGroup(token.id, options.selectedTokenIds, options.mouseBehavior);
  return {
    dragGroup,
    dragStart: options.mouseBehavior === "grabber" ? getTokenDragStart(options.scene, token, options.point, options.pointerId, dragGroup.itemIds) : null,
    token
  };
}

export type TokenPointerMove =
  | { kind: "preview"; preview: TokenDragPreview }
  | { kind: "missing-token"; tokenId: string };

export function getTokenPointerMove(scene: Scene | null, activeDrag: TokenDragState | null, pointerId: number, point: Point): TokenPointerMove | null {
  if (!scene || !activeDrag || activeDrag.pointerId !== pointerId) {
    return null;
  }

  const token = scene.tokens.find((candidate) => candidate.id === activeDrag.tokenId);
  if (!token) {
    return { kind: "missing-token", tokenId: activeDrag.tokenId };
  }

  return {
    kind: "preview",
    preview: getTokenDragPreviewFromPoint(scene, activeDrag, token, point)
  };
}
