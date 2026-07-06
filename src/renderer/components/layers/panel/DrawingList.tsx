import { useMemo } from "react";
import { Crown, User } from "lucide-react";
import type { DrawingElement } from "../../../../shared/localvtt";
import { getSelectedItemIds } from "../../../lib/scene";
import type { DropPlacement } from "../../../lib/ui";
import type { LayerItemDropTarget } from "./layerItemRows";
import { DrawingListRow } from "./DrawingListRow";

export type DrawingDropTarget = LayerItemDropTarget | null;

const EMPTY_SELECTED_IDS: string[] = [];

export function DrawingList({
  drawings,
  selectedDrawingId,
  selectedDrawingIds = EMPTY_SELECTED_IDS,
  draggedDrawingId,
  drawingDropTarget,
  onDraggedDrawingIdChange,
  onDrawingDropTargetChange,
  onMoveDrawing,
  onSelectDrawing,
  onUpdateDrawings
}: {
  drawings: DrawingElement[];
  selectedDrawingId: string | null;
  selectedDrawingIds?: string[];
  draggedDrawingId: string | null;
  drawingDropTarget: DrawingDropTarget;
  onDraggedDrawingIdChange: (drawingId: string | null) => void;
  onDrawingDropTargetChange: (target: DrawingDropTarget) => void;
  onMoveDrawing: (sourceDrawingId: string, targetDrawingId: string, placement: DropPlacement) => void;
  onSelectDrawing: (drawingId: string | null) => void;
  onUpdateDrawings: (drawings: DrawingElement[]) => void;
}) {
  const selectedIds = useMemo(() => getSelectedItemIds(selectedDrawingId, selectedDrawingIds), [selectedDrawingId, selectedDrawingIds]);
  return (
    <div className="layer-detail-controls fog-shape-list" onClick={(event) => event.stopPropagation()}>
      <div className="fog-shape-list-header">
        <span>Drawing Items</span>
      </div>
      {drawings.length > 0 ? (
        <>
          <div className="fog-shape-column-header" aria-hidden="true">
            <span />
            <span />
            <span />
            <span title="GM View">
              <Crown size={13} />
            </span>
            <span title="Player View">
              <User size={13} />
            </span>
            <span />
          </div>
          {drawings.map((drawing, drawingIndex) => (
            <DrawingListRow
              key={drawing.id}
              draggedDrawingId={draggedDrawingId}
              drawing={drawing}
              drawingDropTarget={drawingDropTarget}
              drawingIndex={drawingIndex}
              drawings={drawings}
              selectedIds={selectedIds}
              onDraggedDrawingIdChange={onDraggedDrawingIdChange}
              onDrawingDropTargetChange={onDrawingDropTargetChange}
              onMoveDrawing={onMoveDrawing}
              onSelectDrawing={onSelectDrawing}
              onUpdateDrawings={onUpdateDrawings}
            />
          ))}
        </>
      ) : (
        <div className="layer-empty-state">
          <strong>No Drawing Items</strong>
          <span>Drawing tools will add freehand strokes, lines, shapes, and templates here.</span>
        </div>
      )}
    </div>
  );
}
