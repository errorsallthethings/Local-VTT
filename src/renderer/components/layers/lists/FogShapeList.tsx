import { useMemo } from "react";
import { Circle, Crown, Eye, EyeOff, GripVertical, Paintbrush, Pentagon, Square, Trash2, User } from "lucide-react";
import { formatDefaultFogShapeName, type FogSettings, type Scene } from "../../../../shared/localvtt";
import type { DropPlacement } from "../../../lib/ui";
import { getSelectedItemIds } from "../../../lib/scene";
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
} from "../panel/layerItemRows";

export type FogShapeDropTarget = LayerItemDropTarget | null;
const EMPTY_SELECTED_IDS: string[] = [];

export function FogShapeList({
  scene,
  selectedFogShapeId,
  selectedFogShapeIds = EMPTY_SELECTED_IDS,
  draggedFogShapeId,
  fogShapeDropTarget,
  onDraggedFogShapeIdChange,
  onFogShapeDropTargetChange,
  onMoveFogShape,
  onSelectFogShape,
  onRenameFogShape,
  onUpdateFog
}: {
  scene: Scene;
  selectedFogShapeId: string | null;
  selectedFogShapeIds?: string[];
  draggedFogShapeId: string | null;
  fogShapeDropTarget: FogShapeDropTarget;
  onDraggedFogShapeIdChange: (shapeId: string | null) => void;
  onFogShapeDropTargetChange: (target: FogShapeDropTarget) => void;
  onMoveFogShape: (sourceShapeId: string, targetShapeId: string, placement: DropPlacement) => void;
  onSelectFogShape: (shapeId: string | null) => void;
  onRenameFogShape: (shapeId: string, fallbackName: string) => void;
  onUpdateFog: (patch: Partial<FogSettings>) => void;
}) {
  const selectedIds = useMemo(() => getSelectedItemIds(selectedFogShapeId, selectedFogShapeIds), [selectedFogShapeId, selectedFogShapeIds]);
  return (
    <div className="layer-detail-controls fog-shape-list" onClick={(event) => event.stopPropagation()}>
      <div className="fog-shape-list-header">
        <span>Fog shapes</span>
      </div>
      {scene.fog.shapes.length > 0 ? (
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
          {scene.fog.shapes.map((shape, shapeIndex) => {
            const isVisibleInGm = shape.visibleInGm ?? shape.visible ?? true;
            const isVisibleInPlayer = shape.visibleInPlayer ?? shape.visible ?? true;
            const fallbackName = formatDefaultFogShapeName(shape.operation, shape.kind, shapeIndex);
            const label = shape.name?.trim() || fallbackName;
            const isSelected = selectedIds.has(shape.id);
            const dropPlacement = fogShapeDropTarget?.itemId === shape.id && draggedFogShapeId !== shape.id ? fogShapeDropTarget.placement : null;
            return (
              <div
                className={`${getLayerItemRowClassName({
                  visible: isVisibleInGm || isVisibleInPlayer,
                  selected: isSelected,
                  dragging: draggedFogShapeId === shape.id,
                  dropPlacement
                })} fog-layer-shape-row`}
                key={shape.id}
                draggable
                onClick={() => onSelectFogShape(shape.id)}
                onDragStart={(event) => {
                  onDraggedFogShapeIdChange(shape.id);
                  event.dataTransfer.setData("application/x-localvtt-fog-shape-id", shape.id);
                  event.dataTransfer.setData("text/plain", shape.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => {
                  if (!acceptsLayerItemDrag(draggedFogShapeId, event.dataTransfer.types, "application/x-localvtt-fog-shape-id")) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  const rect = event.currentTarget.getBoundingClientRect();
                  onFogShapeDropTargetChange(getLayerItemDropTarget(shape.id, draggedFogShapeId, event.clientY, rect.top, rect.height));
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceShapeId = getLayerItemDropSourceId(
                    event.dataTransfer.getData("application/x-localvtt-fog-shape-id"),
                    event.dataTransfer.getData("text/plain"),
                    draggedFogShapeId
                  );
                  const moveAction = getLayerItemDropMoveAction(sourceShapeId, shape.id, fogShapeDropTarget);
                  if (moveAction) {
                    onMoveFogShape(moveAction.sourceItemId, moveAction.targetItemId, moveAction.placement);
                  }
                  onDraggedFogShapeIdChange(null);
                  onFogShapeDropTargetChange(null);
                }}
                onDragEnd={() => {
                  const moveAction = getLayerItemDragEndMoveAction(draggedFogShapeId, fogShapeDropTarget);
                  if (moveAction) {
                    onMoveFogShape(moveAction.sourceItemId, moveAction.targetItemId, moveAction.placement);
                  }
                  onDraggedFogShapeIdChange(null);
                  onFogShapeDropTargetChange(null);
                }}
              >
                <GripVertical className="fog-shape-drag-handle" size={14} aria-hidden="true" />
                <span className="fog-shape-kind-icon" title={`${shape.kind} shape`} aria-hidden="true">
                  {getFogShapeIcon(shape.kind)}
                </span>
                <span className="fog-shape-name" title={label} onDoubleClick={() => onRenameFogShape(shape.id, label)}>
                  {label}
                </span>
                <button
                  className={getLayerItemActionButtonClassName(isVisibleInGm)}
                  aria-label={getLayerItemVisibilityLabel(label, "GM", isVisibleInGm)}
                  title={getLayerItemVisibilityTitle("GM", isVisibleInGm)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateFog({
                      shapes: patchLayerItemById(scene.fog.shapes, shape.id, {
                        visibleInGm: !isVisibleInGm,
                        visible: !isVisibleInGm || isVisibleInPlayer
                      })
                    });
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
                    onUpdateFog({
                      shapes: patchLayerItemById(scene.fog.shapes, shape.id, {
                        visibleInPlayer: !isVisibleInPlayer,
                        visible: isVisibleInGm || !isVisibleInPlayer
                      })
                    });
                  }}
                >
                  {isVisibleInPlayer ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <button
                  className={getLayerItemActionButtonClassName(false, true)}
                  aria-label={`Delete ${label}`}
                  title="Delete fog shape"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateFog({ shapes: removeLayerItemById(scene.fog.shapes, shape.id) });
                    if (selectedFogShapeId === shape.id) {
                      onSelectFogShape(null);
                    }
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
          <strong>No Fog Shapes</strong>
          <span>Draw fog reveal or hide shapes from the floating Tools Menu.</span>
        </div>
      )}
    </div>
  );
}

function getFogShapeIcon(kind: "brush" | "rectangle" | "polygon" | "circle") {
  if (kind === "brush") {
    return <Paintbrush size={13} />;
  }
  if (kind === "polygon") {
    return <Pentagon size={13} />;
  }
  if (kind === "circle") {
    return <Circle size={13} />;
  }
  return <Square size={13} />;
}
