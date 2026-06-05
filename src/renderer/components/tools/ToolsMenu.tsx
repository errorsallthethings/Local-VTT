import { useEffect, useState } from "react";
import { Eye, Paintbrush, Square, Trash2, Triangle, Undo2 } from "lucide-react";
import type { FogTool } from "../../canvas/fogRenderer";

export type FogOperation = "reveal" | "hide";
type FogToolShape = "brush" | "rectangle" | "polygon";

interface ToolsMenuProps {
  activeFogTool: FogTool | null;
  fogOperation: FogOperation;
  brushSize: number;
  fogShapeCount: number;
  onFogToolChange: (tool: FogTool | null) => void;
  onFogOperationChange: (operation: FogOperation) => void;
  onBrushSizeChange: (brushSize: number) => void;
  onUndoFogShape: () => void;
  onRequestClearFog: () => void;
}

export function ToolsMenu({
  activeFogTool,
  fogOperation,
  brushSize,
  fogShapeCount,
  onFogToolChange,
  onFogOperationChange,
  onBrushSizeChange,
  onUndoFogShape,
  onRequestClearFog
}: ToolsMenuProps) {
  const [fogMenuOpen, setFogMenuOpen] = useState(false);
  const activeFogShape = getActiveFogShape(activeFogTool);

  useEffect(() => {
    if (activeFogTool) {
      setFogMenuOpen(true);
    }
  }, [activeFogTool]);

  const setFogToolShape = (shape: FogToolShape) => {
    const nextTool = createFogTool(fogOperation, shape);
    onFogToolChange(activeFogTool === nextTool ? null : nextTool);
  };

  const setFogToolOperation = (operation: FogOperation) => {
    onFogOperationChange(operation);
    if (activeFogShape) {
      onFogToolChange(createFogTool(operation, activeFogShape));
    }
  };

  return (
    <div className="tools-menu" aria-label="Tools menu">
      <div className="tools-menu-stack">
        <button
          className={fogMenuOpen ? "tool-circle-button tool-active" : "tool-circle-button"}
          aria-label={fogMenuOpen ? "Close fog tools" : "Open fog tools"}
          title={fogMenuOpen ? "Close Fog of War Tools" : "Fog of War Tools"}
          onClick={() => {
            setFogMenuOpen((open) => !open);
            if (fogMenuOpen) {
              onFogToolChange(null);
            }
          }}
        >
          <Eye size={18} aria-hidden="true" />
        </button>
      </div>

      {fogMenuOpen && (
        <div className="tools-flyout" aria-label="Fog of War Tools">
          <button
            className={activeFogShape === "brush" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Fog Brush"
            title="Fog Brush"
            onClick={() => setFogToolShape("brush")}
          >
            <Paintbrush size={17} aria-hidden="true" />
          </button>
          <button
            className={activeFogShape === "rectangle" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Fog Rectangle"
            title="Fog Rectangle"
            onClick={() => setFogToolShape("rectangle")}
          >
            <Square size={17} aria-hidden="true" />
          </button>
          <button
            className={activeFogShape === "polygon" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Fog Polygon"
            title="Fog Polygon"
            onClick={() => setFogToolShape("polygon")}
          >
            <Triangle size={17} aria-hidden="true" />
          </button>
          <button
            className="tool-circle-button"
            aria-label="Undo Last Fog Shape"
            title="Undo Last Fog Shape"
            disabled={fogShapeCount === 0}
            onClick={onUndoFogShape}
          >
            <Undo2 size={17} aria-hidden="true" />
          </button>
          <button
            className="tool-circle-button danger"
            aria-label="Delete All Fog Shapes"
            title="Delete All Fog Shapes"
            disabled={fogShapeCount === 0}
            onClick={onRequestClearFog}
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
          <label className="fog-operation-switch tools-operation-switch" title="Reveal or hide fog">
            <span>Reveal</span>
            <input
              type="checkbox"
              checked={fogOperation === "hide"}
              onChange={(event) => setFogToolOperation(event.target.checked ? "hide" : "reveal")}
            />
            <span>Hide</span>
          </label>
          {activeFogShape === "brush" && (
            <div className="tools-brush-size">
              <input
                aria-label="Brush diameter"
                title="Brush diameter"
                type="range"
                min={8}
                max={400}
                step={4}
                value={brushSize}
                onChange={(event) => onBrushSizeChange(Number(event.target.value))}
              />
              <span>{brushSize}px</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function createFogTool(operation: FogOperation, shape: FogToolShape): FogTool {
  return `${operation}-${shape}` as FogTool;
}

function getActiveFogShape(tool: FogTool | null): FogToolShape | null {
  if (!tool) {
    return null;
  }
  if (tool.includes("brush")) {
    return "brush";
  }
  if (tool.includes("polygon")) {
    return "polygon";
  }
  return "rectangle";
}
