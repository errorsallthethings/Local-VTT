import { Circle, Crown, Eye, EyeOff, GripVertical, Paintbrush, Pentagon, Square, Trash2, User } from "lucide-react";
import { formatDefaultFogShapeName, type FogSettings, type Scene } from "../../../shared/localvtt";
import type { DropPlacement } from "../../lib/reorder";

export type FogShapeDropTarget = { shapeId: string; placement: DropPlacement } | null;

export function FogShapeList({
  scene,
  selectedFogShapeId,
  selectedFogShapeIds = [],
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
  const selectedIds = new Set(selectedFogShapeIds.length > 0 ? selectedFogShapeIds : selectedFogShapeId ? [selectedFogShapeId] : []);
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
            const dropPlacement = fogShapeDropTarget?.shapeId === shape.id && draggedFogShapeId !== shape.id ? fogShapeDropTarget.placement : null;
            const gmVisibilityButtonClass = [
              "icon-button",
              "fog-shape-action-button",
              isVisibleInGm ? "fog-shape-action-active" : ""
            ]
              .filter(Boolean)
              .join(" ");
            const playerVisibilityButtonClass = [
              "icon-button",
              "fog-shape-action-button",
              isVisibleInPlayer ? "fog-shape-action-active" : ""
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                className={[
                  "fog-shape-row",
                  "fog-layer-shape-row",
                  isVisibleInGm || isVisibleInPlayer ? "" : "fog-shape-row-muted",
                  isSelected ? "fog-shape-row-selected" : "",
                  draggedFogShapeId === shape.id ? "fog-shape-row-dragging" : "",
                  dropPlacement ? `fog-shape-row-drop-${dropPlacement}` : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
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
                  if (!draggedFogShapeId && !event.dataTransfer.types.includes("application/x-localvtt-fog-shape-id")) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (draggedFogShapeId !== shape.id) {
                    const rect = event.currentTarget.getBoundingClientRect();
                    onFogShapeDropTargetChange({
                      shapeId: shape.id,
                      placement: event.clientY > rect.top + rect.height / 2 ? "after" : "before"
                    });
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceShapeId = event.dataTransfer.getData("application/x-localvtt-fog-shape-id") || event.dataTransfer.getData("text/plain") || draggedFogShapeId;
                  const placement = fogShapeDropTarget?.shapeId === shape.id ? fogShapeDropTarget.placement : "before";
                  if (sourceShapeId) {
                    onMoveFogShape(sourceShapeId, shape.id, placement);
                  }
                  onDraggedFogShapeIdChange(null);
                  onFogShapeDropTargetChange(null);
                }}
                onDragEnd={() => {
                  if (draggedFogShapeId && fogShapeDropTarget) {
                    onMoveFogShape(draggedFogShapeId, fogShapeDropTarget.shapeId, fogShapeDropTarget.placement);
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
                  className={gmVisibilityButtonClass}
                  aria-label={isVisibleInGm ? `Hide ${label} in GM View` : `Show ${label} in GM View`}
                  title={isVisibleInGm ? "Hide in GM View" : "Show in GM View"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateFog({
                      shapes: scene.fog.shapes.map((candidate) =>
                        candidate.id === shape.id
                          ? { ...candidate, visibleInGm: !isVisibleInGm, visible: (!isVisibleInGm || isVisibleInPlayer) }
                          : candidate
                      )
                    });
                  }}
                >
                  {isVisibleInGm ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <button
                  className={playerVisibilityButtonClass}
                  aria-label={isVisibleInPlayer ? `Hide ${label} in Player View` : `Show ${label} in Player View`}
                  title={isVisibleInPlayer ? "Hide in Player View" : "Show in Player View"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateFog({
                      shapes: scene.fog.shapes.map((candidate) =>
                        candidate.id === shape.id
                          ? { ...candidate, visibleInPlayer: !isVisibleInPlayer, visible: (isVisibleInGm || !isVisibleInPlayer) }
                          : candidate
                      )
                    });
                  }}
                >
                  {isVisibleInPlayer ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <button
                  className="icon-button fog-shape-action-button danger"
                  aria-label={`Delete ${label}`}
                  title="Delete fog shape"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateFog({ shapes: scene.fog.shapes.filter((candidate) => candidate.id !== shape.id) });
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
