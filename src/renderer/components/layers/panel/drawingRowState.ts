import type { DrawingElement } from "../../../../shared/localvtt";
import { formatDefaultDrawingName } from "../../../../shared/localvtt";
import type { DropPlacement } from "../../../lib/ui";
import type { LayerItemDropTarget } from "./layerItemRows";

export interface DrawingRowState {
  dropPlacement: DropPlacement | null;
  isDragging: boolean;
  isSelected: boolean;
  isVisibleInGm: boolean;
  isVisibleInPlayer: boolean;
  label: string;
}

export function getDrawingRowState({
  draggedDrawingId,
  drawing,
  drawingDropTarget,
  drawingIndex,
  selectedIds
}: {
  draggedDrawingId: string | null;
  drawing: DrawingElement;
  drawingDropTarget: LayerItemDropTarget | null;
  drawingIndex: number;
  selectedIds: ReadonlySet<string>;
}): DrawingRowState {
  const isDragging = draggedDrawingId === drawing.id;
  return {
    dropPlacement: drawingDropTarget?.itemId === drawing.id && !isDragging ? drawingDropTarget.placement : null,
    isDragging,
    isSelected: selectedIds.has(drawing.id),
    isVisibleInGm: drawing.visibleInGm ?? true,
    isVisibleInPlayer: drawing.visibleInPlayer,
    label: drawing.name?.trim() || formatDefaultDrawingName(drawing.kind, drawingIndex)
  };
}
