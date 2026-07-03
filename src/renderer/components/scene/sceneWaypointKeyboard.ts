import type { Scene } from "../../../shared/localvtt";
import { getRulerDragWithAppendedWaypoint } from "../../canvas/live-table";
import type { RulerDrag } from "../../canvas/measurement";
import type { TokenDragPreview } from "../../canvas/tokens";
import { getTokenDragWaypointAppendUpdate, type TokenDragWaypointUpdate } from "../../canvas/tokens";
import type { TokenDragState } from "../../canvas/scene";

export interface WaypointKeyboardEventState {
  key: string;
  repeat: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

export function getTokenWaypointAppendKeyboardUpdate(
  scene: Scene,
  tokenDrag: TokenDragState | null,
  preview: TokenDragPreview | null,
  event: WaypointKeyboardEventState
): TokenDragWaypointUpdate | null {
  if (!isWaypointAppendKey(event) || !tokenDrag || !preview) {
    return null;
  }

  return getTokenDragWaypointAppendUpdate(scene, tokenDrag, preview);
}

export function getRulerWaypointAppendKeyboardUpdate<TRulerDrag extends RulerDrag>(
  scene: Scene,
  rulerDrag: TRulerDrag | null,
  event: WaypointKeyboardEventState
): TRulerDrag | null {
  if (!isWaypointAppendKey(event) || !rulerDrag) {
    return null;
  }

  const nextRulerDrag = getRulerDragWithAppendedWaypoint(scene, rulerDrag, Boolean(event.ctrlKey || event.metaKey));
  return nextRulerDrag === rulerDrag ? null : nextRulerDrag;
}

function isWaypointAppendKey(event: WaypointKeyboardEventState): boolean {
  return event.key === "Shift" && !event.repeat;
}
