import { useMemo } from "react";
import { Circle, Crown, Eye, EyeOff, GripVertical, Paintbrush, Pentagon, Square, SquareDashed, Trash2, User } from "lucide-react";
import type { DrawingElement, DrawingKind } from "../../../../shared/localvtt";
import { formatDefaultDrawingName } from "../../../../shared/localvtt";
import { getSelectedItemIds } from "../../../lib/scene";
import type { DropPlacement } from "../../../lib/ui";
import {
  getLayerItemActionButtonClassName,
  acceptsLayerItemDrag,
  getLayerItemDragEndMoveAction,
  getLayerItemDropMoveAction,
  getLayerItemDropSourceId,
  getLayerItemDropTarget,
  getLayerItemRowClassName,
  getLayerItemVisibilityLabel,
  getLayerItemVisibilityTitle,
  type LayerItemDropTarget,
  patchLayerItemById,
  removeLayerItemById
} from "./layerItemRows";

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
          {drawings.map((drawing, drawingIndex) => {
            const isVisibleInGm = drawing.visibleInGm ?? true;
            const isVisibleInPlayer = drawing.visibleInPlayer;
            const label = drawing.name?.trim() || formatDefaultDrawingName(drawing.kind, drawingIndex);
            const isSelected = selectedIds.has(drawing.id);
            const dropPlacement = drawingDropTarget?.itemId === drawing.id && draggedDrawingId !== drawing.id ? drawingDropTarget.placement : null;
            return (
              <div
                className={getLayerItemRowClassName({
                  visible: isVisibleInGm || isVisibleInPlayer,
                  selected: isSelected,
                  dragging: draggedDrawingId === drawing.id,
                  dropPlacement
                })}
                key={drawing.id}
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
          })}
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
