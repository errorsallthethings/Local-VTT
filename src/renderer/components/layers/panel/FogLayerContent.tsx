import { useState } from "react";
import type { FogSettings, Scene } from "../../../../shared/localvtt";
import type { DropPlacement } from "../../../lib/ui";
import { FogShapeList, type FogShapeDropTarget } from "../lists/FogShapeList";
import { FogSettingsPanel } from "./FogSettingsPanel";
import { getReorderedFogShapes } from "./layerPanelState";

export function FogLayerContent({
  scene,
  settingsExpanded,
  contentsExpanded,
  selectedFogShapeId,
  selectedFogShapeIds,
  onOpenFogColor,
  onRenameFogShape,
  onSelectFogShape,
  onUpdateFog
}: {
  scene: Scene;
  settingsExpanded: boolean;
  contentsExpanded: boolean;
  selectedFogShapeId: string | null;
  selectedFogShapeIds: string[];
  onOpenFogColor: () => void;
  onRenameFogShape: (shapeId: string, fallbackName: string) => void;
  onSelectFogShape: (shapeId: string | null) => void;
  onUpdateFog: (patch: Partial<FogSettings>) => void;
}) {
  const [draggedFogShapeId, setDraggedFogShapeId] = useState<string | null>(null);
  const [fogShapeDropTarget, setFogShapeDropTarget] = useState<FogShapeDropTarget>(null);
  const [fogPlayerDefaultHelpOpen, setFogPlayerDefaultHelpOpen] = useState(false);

  const moveFogShape = (sourceShapeId: string, targetShapeId: string, placement: DropPlacement) => {
    if (sourceShapeId === targetShapeId) {
      return;
    }
    onUpdateFog({ shapes: getReorderedFogShapes(scene.fog.shapes, sourceShapeId, targetShapeId, placement) });
  };

  return (
    <>
      {settingsExpanded && (
        <FogSettingsPanel
          fog={scene.fog}
          isNewShapeHelpOpen={fogPlayerDefaultHelpOpen}
          onToggleNewShapeHelp={() => setFogPlayerDefaultHelpOpen((open) => !open)}
          onUpdateFog={onUpdateFog}
          onOpenFogColor={onOpenFogColor}
        />
      )}
      {contentsExpanded && (
        <FogShapeList
          scene={scene}
          selectedFogShapeId={selectedFogShapeId}
          selectedFogShapeIds={selectedFogShapeIds}
          draggedFogShapeId={draggedFogShapeId}
          fogShapeDropTarget={fogShapeDropTarget}
          onDraggedFogShapeIdChange={setDraggedFogShapeId}
          onFogShapeDropTargetChange={setFogShapeDropTarget}
          onMoveFogShape={moveFogShape}
          onSelectFogShape={onSelectFogShape}
          onRenameFogShape={onRenameFogShape}
          onUpdateFog={onUpdateFog}
        />
      )}
    </>
  );
}
