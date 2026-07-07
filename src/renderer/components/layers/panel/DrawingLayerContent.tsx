import { useState } from "react";
import type { DrawingElement } from "../../../../shared/localvtt";
import type { DropPlacement } from "../../../lib/ui";
import { DrawingList, type DrawingDropTarget } from "./DrawingList";
import { getReorderedDrawings } from "./layerPanelState";

export function DrawingLayerContent({
  drawings,
  selectedDrawingId,
  selectedDrawingIds,
  onSelectDrawing,
  onUpdateDrawings
}: {
  drawings: DrawingElement[];
  selectedDrawingId: string | null;
  selectedDrawingIds: string[];
  onSelectDrawing: (drawingId: string | null) => void;
  onUpdateDrawings: (drawings: DrawingElement[]) => void;
}) {
  const [draggedDrawingId, setDraggedDrawingId] = useState<string | null>(null);
  const [drawingDropTarget, setDrawingDropTarget] = useState<DrawingDropTarget>(null);

  const moveDrawing = (sourceDrawingId: string, targetDrawingId: string, placement: DropPlacement) => {
    if (sourceDrawingId === targetDrawingId) {
      return;
    }
    onUpdateDrawings(getReorderedDrawings(drawings, sourceDrawingId, targetDrawingId, placement));
  };

  return (
    <DrawingList
      drawings={drawings}
      selectedDrawingId={selectedDrawingId}
      selectedDrawingIds={selectedDrawingIds}
      draggedDrawingId={draggedDrawingId}
      drawingDropTarget={drawingDropTarget}
      onDraggedDrawingIdChange={setDraggedDrawingId}
      onDrawingDropTargetChange={setDrawingDropTarget}
      onMoveDrawing={moveDrawing}
      onSelectDrawing={onSelectDrawing}
      onUpdateDrawings={onUpdateDrawings}
    />
  );
}
