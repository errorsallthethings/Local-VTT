import { useEffect, useState } from "react";
import { Circle, CloudFog, CloudSun, HelpCircle, LineSquiggle, Paintbrush, Pentagon, Ruler, Square, Table2, Target, Trash2, Undo2 } from "lucide-react";
import type { FogTool } from "../../canvas/fogRenderer";
import { getFogHelpLines, getRulerHelpLines, getWeatherHelpLines } from "../../lib/toolCopy";

export type FogOperation = "reveal" | "hide";
export type CanvasTool = "ruler" | "ping" | "laser";
export type WeatherMaskTool = "rectangle" | "circle" | "polygon";
type FogToolShape = "brush" | "rectangle" | "circle" | "polygon";

interface ToolsMenuProps {
  activeCanvasTool: CanvasTool | null;
  activeFogTool: FogTool | null;
  activeWeatherMaskTool: WeatherMaskTool | null;
  fogOperation: FogOperation;
  brushSize: number;
  fogShapeCount: number;
  weatherMaskCount: number;
  weatherToolsEnabled: boolean;
  onCanvasToolChange: (tool: CanvasTool | null) => void;
  onFogToolChange: (tool: FogTool | null) => void;
  onWeatherMaskToolChange: (tool: WeatherMaskTool | null) => void;
  onFogOperationChange: (operation: FogOperation) => void;
  onBrushSizeChange: (brushSize: number) => void;
  onUndoFogShape: () => void;
  onUndoWeatherMask: () => void;
  onRequestClearFog: () => void;
}

export function ToolsMenu({
  activeCanvasTool,
  activeFogTool,
  activeWeatherMaskTool,
  fogOperation,
  brushSize,
  fogShapeCount,
  weatherMaskCount,
  weatherToolsEnabled,
  onCanvasToolChange,
  onFogToolChange,
  onWeatherMaskToolChange,
  onFogOperationChange,
  onBrushSizeChange,
  onUndoFogShape,
  onUndoWeatherMask,
  onRequestClearFog
}: ToolsMenuProps) {
  const [fogMenuOpen, setFogMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [weatherMenuOpen, setWeatherMenuOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<"fog" | "ruler" | "weather" | null>(null);
  const activeFogShape = getActiveFogShape(activeFogTool);

  useEffect(() => {
    if (activeFogTool) {
      setFogMenuOpen(true);
    }
  }, [activeFogTool]);

  useEffect(() => {
    if (activeCanvasTool) {
      setFogMenuOpen(false);
      setWeatherMenuOpen(false);
      setTableMenuOpen(true);
    }
  }, [activeCanvasTool]);

  useEffect(() => {
    if (activeWeatherMaskTool) {
      setFogMenuOpen(false);
      setTableMenuOpen(false);
      setWeatherMenuOpen(true);
    }
  }, [activeWeatherMaskTool]);

  useEffect(() => {
    if (!weatherToolsEnabled) {
      setWeatherMenuOpen(false);
      onWeatherMaskToolChange(null);
    }
  }, [onWeatherMaskToolChange, weatherToolsEnabled]);

  useEffect(() => {
    if (
      (helpTopic === "fog" && !fogMenuOpen) ||
      (helpTopic === "weather" && !weatherMenuOpen) ||
      (helpTopic === "ruler" && (!tableMenuOpen || activeCanvasTool !== "ruler"))
    ) {
      setHelpTopic(null);
    }
  }, [activeCanvasTool, fogMenuOpen, helpTopic, tableMenuOpen, weatherMenuOpen]);

  const setFogToolShape = (shape: FogToolShape) => {
    const nextTool = createFogTool(fogOperation, shape);
    onCanvasToolChange(null);
    onWeatherMaskToolChange(null);
    onFogToolChange(activeFogTool === nextTool ? null : nextTool);
  };

  const setWeatherMaskTool = (tool: WeatherMaskTool) => {
    onCanvasToolChange(null);
    onFogToolChange(null);
    onWeatherMaskToolChange(activeWeatherMaskTool === tool ? null : tool);
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
              onWeatherMaskToolChange(null);
              setTableMenuOpen(false);
              setWeatherMenuOpen(false);
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
          className={weatherMenuOpen ? "tool-circle-button tool-active" : "tool-circle-button"}
          aria-label={weatherMenuOpen ? "Close weather tools" : "Open weather tools"}
          title={weatherToolsEnabled ? (weatherMenuOpen ? "Close Weather Tools" : "Weather Tools") : "Enable a weather effect to use Weather Tools"}
          disabled={!weatherToolsEnabled}
          onClick={() => {
            if (!weatherToolsEnabled) {
              return;
            }
            const nextOpen = !weatherMenuOpen;
            setWeatherMenuOpen(nextOpen);
            if (nextOpen) {
              setFogMenuOpen(false);
              setTableMenuOpen(false);
              onCanvasToolChange(null);
              onFogToolChange(null);
            } else {
              onWeatherMaskToolChange(null);
            }
          }}
        >
          <CloudSun size={18} aria-hidden="true" />
        </button>
        <button
          className={tableMenuOpen ? "tool-circle-button tool-active" : "tool-circle-button"}
          aria-label={tableMenuOpen ? "Close table tools" : "Open table tools"}
          title={tableMenuOpen ? "Close Table Tools" : "Table Tools"}
          onClick={() => {
            const nextOpen = !tableMenuOpen;
            setTableMenuOpen(nextOpen);
            if (nextOpen) {
              setFogMenuOpen(false);
              setWeatherMenuOpen(false);
              onFogToolChange(null);
              onWeatherMaskToolChange(null);
            } else {
              onCanvasToolChange(null);
              setHelpTopic(null);
            }
          }}
        >
          <Table2 size={18} aria-hidden="true" />
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
      {weatherMenuOpen && (
        <div className="tools-flyout tools-weather-flyout" aria-label="Weather Tools">
          <button
            className={activeWeatherMaskTool === "rectangle" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Weather Mask Rectangle"
            title="Weather Mask Rectangle"
            onClick={() => setWeatherMaskTool("rectangle")}
          >
            <Square size={17} aria-hidden="true" />
          </button>
          <button
            className={activeWeatherMaskTool === "circle" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Weather Mask Circle"
            title="Weather Mask Circle"
            onClick={() => setWeatherMaskTool("circle")}
          >
            <Circle size={17} aria-hidden="true" />
          </button>
          <button
            className={activeWeatherMaskTool === "polygon" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Weather Mask Polygon"
            title="Weather Mask Polygon"
            onClick={() => setWeatherMaskTool("polygon")}
          >
            <Pentagon size={17} aria-hidden="true" />
          </button>
          <button
            className="tool-circle-button"
            aria-label="Undo Last Weather Mask"
            title="Undo Last Weather Mask"
            disabled={weatherMaskCount === 0}
            onClick={onUndoWeatherMask}
          >
            <Undo2 size={17} aria-hidden="true" />
          </button>
          <button
            className={helpTopic === "weather" ? "tool-circle-button tool-help-trigger tool-active" : "tool-circle-button tool-help-trigger"}
            aria-label="Weather tools help"
            title="Weather tools help"
            aria-expanded={helpTopic === "weather"}
            onClick={() => setHelpTopic((topic) => (topic === "weather" ? null : "weather"))}
          >
            <HelpCircle size={17} aria-hidden="true" />
          </button>
        </div>
      )}
      {tableMenuOpen && (
        <div className="tools-flyout tools-ruler-flyout" aria-label="Table Tools">
          <button
            className={activeCanvasTool === "ruler" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Ruler"
            title="Ruler"
            onClick={() => {
              onFogToolChange(null);
              setHelpTopic(null);
              onCanvasToolChange(activeCanvasTool === "ruler" ? null : "ruler");
            }}
          >
            <Ruler size={17} aria-hidden="true" />
          </button>
          <button
            className={activeCanvasTool === "ping" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Ping"
            title="Ping"
            onClick={() => {
              onFogToolChange(null);
              setHelpTopic(null);
              onCanvasToolChange(activeCanvasTool === "ping" ? null : "ping");
            }}
          >
            <Target size={17} aria-hidden="true" />
          </button>
          <button
            className={activeCanvasTool === "laser" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Laser Pointer"
            title="Laser Pointer"
            onClick={() => {
              onFogToolChange(null);
              setHelpTopic(null);
              onCanvasToolChange(activeCanvasTool === "laser" ? null : "laser");
            }}
          >
            <LineSquiggle size={17} aria-hidden="true" />
          </button>
          <button
            className={helpTopic === "ruler" ? "tool-circle-button tool-help-trigger tool-active" : "tool-circle-button tool-help-trigger"}
            aria-label="Ruler help"
            title="Ruler help"
            aria-expanded={helpTopic === "ruler"}
            disabled={activeCanvasTool !== "ruler"}
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

function ToolHelpCard({ topic }: { topic: "fog" | "ruler" | "weather" }) {
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

  if (topic === "weather") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Weather tools help">
        <strong>Weather Tools</strong>
        {getWeatherHelpLines().map((line) => (
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
