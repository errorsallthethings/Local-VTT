import { Circle, Eye, EyeOff, GripVertical, Paintbrush, Pentagon, Square, SquareDashed, Trash2 } from "lucide-react";
import type { DrawingElement, DrawingKind } from "../../../../shared/localvtt";
import type { DropPlacement } from "../../../lib/ui";
import {
  acceptsLayerItemDrag,
  getLayerItemActionButtonClassName,
  getLayerItemDragEndMoveAction,
  getLayerItemDropMoveAction,
  getLayerItemDropSourceId,
  getLayerItemDropTarget,
  getLayerItemRowClassName,
  getLayerItemVisibilityLabel,
  getLayerItemVisibilityTitle,
  patchLayerItemById,
  removeLayerItemById,
  type LayerItemDropTarget
} from "./layerItemRows";
import { getDrawingRowState } from "./drawingRowState";

export function DrawingListRow({
  draggedDrawingId,
  drawing,
  drawingDropTarget,
  drawingIndex,
  drawings,
  selectedIds,
  onDraggedDrawingIdChange,
  onDrawingDropTargetChange,
  onMoveDrawing,
  onSelectDrawing,
  onUpdateDrawings
}: {
  draggedDrawingId: string | null;
  drawing: DrawingElement;
  drawingDropTarget: LayerItemDropTarget | null;
  drawingIndex: number;
  drawings: DrawingElement[];
  selectedIds: ReadonlySet<string>;
  onDraggedDrawingIdChange: (drawingId: string | null) => void;
  onDrawingDropTargetChange: (target: LayerItemDropTarget | null) => void;
  onMoveDrawing: (sourceDrawingId: string, targetDrawingId: string, placement: DropPlacement) => void;
  onSelectDrawing: (drawingId: string | null) => void;
  onUpdateDrawings: (drawings: DrawingElement[]) => void;
}) {
  const {
    dropPlacement,
    isDragging,
    isSelected,
    isVisibleInGm,
    isVisibleInPlayer,
    label
  } = getDrawingRowState({
    draggedDrawingId,
    drawing,
    drawingDropTarget,
    drawingIndex,
    selectedIds
  });

  return (
    <div
      className={getLayerItemRowClassName({
        visible: isVisibleInGm || isVisibleInPlayer,
        selected: isSelected,
        dragging: isDragging,
        dropPlacement
      })}
      draggable
      onClick={() => onSelectDrawing(drawing.id)}
      onDragStart={(event) => {
        onDraggedDrawingIdChange(drawing.id);
        event.dataTransfer.setData("application/x-localvtt-drawing-id", drawing.id);
        event.dataTransfer.setData("text/plain", drawing.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        if (!acceptsLayerItemDrag(draggedDrawingId, event.dataTransfer.types, "application/x-localvtt-drawing-id")) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        const rect = event.currentTarget.getBoundingClientRect();
        onDrawingDropTargetChange(getLayerItemDropTarget(drawing.id, draggedDrawingId, event.clientY, rect.top, rect.height));
      }}
      onDrop={(event) => {
        event.preventDefault();
        const sourceDrawingId = getLayerItemDropSourceId(
          event.dataTransfer.getData("application/x-localvtt-drawing-id"),
          event.dataTransfer.getData("text/plain"),
          draggedDrawingId
        );
        const moveAction = getLayerItemDropMoveAction(sourceDrawingId, drawing.id, drawingDropTarget);
        if (moveAction) {
          onMoveDrawing(moveAction.sourceItemId, moveAction.targetItemId, moveAction.placement);
        }
        onDraggedDrawingIdChange(null);
        onDrawingDropTargetChange(null);
      }}
      onDragEnd={() => {
        const moveAction = getLayerItemDragEndMoveAction(draggedDrawingId, drawingDropTarget);
        if (moveAction) {
          onMoveDrawing(moveAction.sourceItemId, moveAction.targetItemId, moveAction.placement);
        }
        onDraggedDrawingIdChange(null);
        onDrawingDropTargetChange(null);
      }}
    >
      <GripVertical className="fog-shape-drag-handle" size={14} aria-hidden="true" />
      <span className="fog-shape-kind-icon" title={`${drawing.kind} drawing`} aria-hidden="true">
        {getDrawingIcon(drawing.kind)}
      </span>
      <span className="fog-shape-name" title={label}>
        {label}
      </span>
      <button
        className={getLayerItemActionButtonClassName(isVisibleInGm)}
        aria-label={getLayerItemVisibilityLabel(label, "GM", isVisibleInGm)}
        title={getLayerItemVisibilityTitle("GM", isVisibleInGm)}
        onClick={(event) => {
          event.stopPropagation();
          onUpdateDrawings(patchLayerItemById(drawings, drawing.id, { visibleInGm: !isVisibleInGm }));
        }}
      >
        {isVisibleInGm ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
      </button>
      <button
        className={getLayerItemActionButtonClassName(isVisibleInPlayer)}
        aria-label={getLayerItemVisibilityLabel(label, "Player", isVisibleInPlayer)}
        title={getLayerItemVisibilityTitle("Player", isVisibleInPlayer)}
        onClick={(event) => {
          event.stopPropagation();
          onUpdateDrawings(patchLayerItemById(drawings, drawing.id, { visibleInPlayer: !isVisibleInPlayer }));
        }}
      >
        {isVisibleInPlayer ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
      </button>
      <button
        className={getLayerItemActionButtonClassName(false, true)}
        aria-label={`Delete ${label}`}
        title="Delete drawing"
        onClick={(event) => {
          event.stopPropagation();
          onUpdateDrawings(removeLayerItemById(drawings, drawing.id));
        }}
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

function getDrawingIcon(kind: DrawingKind) {
  if (kind === "rectangle") {
    return <Square size={13} />;
  }
  if (kind === "circle") {
    return <Circle size={13} />;
  }
  if (kind === "cone") {
    return <Pentagon size={13} />;
  }
  if (kind === "text") {
    return <TypeIcon />;
  }
  if (kind === "line" || kind === "laser") {
    return <SquareDashed size={13} />;
  }
  return <Paintbrush size={13} />;
}

function TypeIcon() {
  return (
    <span className="drawing-text-icon" aria-hidden="true">
      T
    </span>
  );
}
