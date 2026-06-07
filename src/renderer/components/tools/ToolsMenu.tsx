import { useEffect, useState } from "react";
import { Circle, CloudFog, HelpCircle, Paintbrush, Pentagon, Ruler, Square, Trash2, Undo2 } from "lucide-react";
import type { FogTool } from "../../canvas/fogRenderer";
import { getFogHelpLines, getRulerHelpLines } from "../../lib/toolCopy";

export type FogOperation = "reveal" | "hide";
export type CanvasTool = "ruler";
type FogToolShape = "brush" | "rectangle" | "circle" | "polygon";

interface ToolsMenuProps {
  activeCanvasTool: CanvasTool | null;
  activeFogTool: FogTool | null;
  fogOperation: FogOperation;
  brushSize: number;
  fogShapeCount: number;
  onCanvasToolChange: (tool: CanvasTool | null) => void;
  onFogToolChange: (tool: FogTool | null) => void;
  onFogOperationChange: (operation: FogOperation) => void;
  onBrushSizeChange: (brushSize: number) => void;
  onUndoFogShape: () => void;
  onRequestClearFog: () => void;
}

export function ToolsMenu({
  activeCanvasTool,
  activeFogTool,
  fogOperation,
  brushSize,
  fogShapeCount,
  onCanvasToolChange,
  onFogToolChange,
  onFogOperationChange,
  onBrushSizeChange,
  onUndoFogShape,
  onRequestClearFog
}: ToolsMenuProps) {
  const [fogMenuOpen, setFogMenuOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<"fog" | "ruler" | null>(null);
  const activeFogShape = getActiveFogShape(activeFogTool);

  useEffect(() => {
    if (activeFogTool) {
      setFogMenuOpen(true);
    }
  }, [activeFogTool]);

  useEffect(() => {
    if (activeCanvasTool) {
      setFogMenuOpen(false);
    }
  }, [activeCanvasTool]);

  useEffect(() => {
    if ((helpTopic === "fog" && !fogMenuOpen) || (helpTopic === "ruler" && activeCanvasTool !== "ruler")) {
      setHelpTopic(null);
    }
  }, [activeCanvasTool, fogMenuOpen, helpTopic]);

  const setFogToolShape = (shape: FogToolShape) => {
    const nextTool = createFogTool(fogOperation, shape);
    onCanvasToolChange(null);
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
            const nextOpen = !fogMenuOpen;
            setFogMenuOpen(nextOpen);
            if (nextOpen) {
              onCanvasToolChange(null);
            }
            if (fogMenuOpen) {
              onFogToolChange(null);
              setHelpTopic(null);
            }
          }}
        >
          <CloudFog size={18} aria-hidden="true" />
        </button>
        <button
          className={activeCanvasTool === "ruler" ? "tool-circle-button tool-active" : "tool-circle-button"}
          aria-label="Ruler"
          title="Ruler"
          onClick={() => {
            setFogMenuOpen(false);
            onFogToolChange(null);
            setHelpTopic(null);
            onCanvasToolChange(activeCanvasTool === "ruler" ? null : "ruler");
          }}
        >
          <Ruler size={18} aria-hidden="true" />
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
            className={activeFogShape === "circle" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Fog Circle"
            title="Fog Circle"
            onClick={() => setFogToolShape("circle")}
          >
            <Circle size={17} aria-hidden="true" />
          </button>
          <button
            className={activeFogShape === "polygon" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Fog Polygon"
            title="Fog Polygon"
            onClick={() => setFogToolShape("polygon")}
          >
            <Pentagon size={17} aria-hidden="true" />
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
          <button
            className={helpTopic === "fog" ? "tool-circle-button tool-help-trigger tool-active" : "tool-circle-button tool-help-trigger"}
            aria-label="Fog tools help"
            title="Fog tools help"
            aria-expanded={helpTopic === "fog"}
            onClick={() => setHelpTopic((topic) => (topic === "fog" ? null : "fog"))}
          >
            <HelpCircle size={17} aria-hidden="true" />
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
      {activeCanvasTool === "ruler" && (
        <div className="tools-flyout tools-ruler-flyout" aria-label="Ruler Tool">
          <button
            className={helpTopic === "ruler" ? "tool-circle-button tool-help-trigger tool-active" : "tool-circle-button tool-help-trigger"}
            aria-label="Ruler help"
            title="Ruler help"
            aria-expanded={helpTopic === "ruler"}
            onClick={() => setHelpTopic((topic) => (topic === "ruler" ? null : "ruler"))}
          >
            <HelpCircle size={17} aria-hidden="true" />
          </button>
        </div>
      )}
      {helpTopic && <ToolHelpCard topic={helpTopic} />}
    </div>
  );
}

function ToolHelpCard({ topic }: { topic: "fog" | "ruler" }) {
  if (topic === "fog") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Fog tools help">
        <strong>Fog Tools</strong>
        {getFogHelpLines().map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    );
  }

  return (
    <div className="tools-help-card" role="dialog" aria-label="Ruler help">
      <strong>Ruler</strong>
      {getRulerHelpLines().map((line) => (
        <span key={line}>{line}</span>
      ))}
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
  if (tool.includes("circle")) {
    return "circle";
  }
  return "rectangle";
}
