import { useEffect, useState } from "react";
import { Circle, CloudFog, CloudSun, HelpCircle, LineSquiggle, Paintbrush, Pentagon, Ruler, Square, Table2, Target, Trash2, Undo2 } from "lucide-react";
import type { DrawingTool } from "../../canvas/drawingRenderer";
import type { FogTool } from "../../canvas/fogRenderer";
import { getDrawingHelpLines, getFogHelpLines, getRulerHelpLines, getWeatherHelpLines } from "../../lib/toolCopy";
import { ColorInput } from "../controls/ColorPickerField";

export type FogOperation = "reveal" | "hide";
export type CanvasTool = "ruler" | "ping" | "laser";
export type WeatherMaskTool = "rectangle" | "circle" | "polygon";
type FogToolShape = "brush" | "rectangle" | "circle" | "polygon";

const DRAWING_THICKNESS_PRESETS = [
  { label: "Extra Thin", value: 2 },
  { label: "Thin", value: 4 },
  { label: "Medium", value: 6 },
  { label: "Thick", value: 10 },
  { label: "Extra Thick", value: 16 }
];

const DRAWING_OPACITY_PRESETS = [
  { label: "Faint", value: 0.25 },
  { label: "Soft", value: 0.5 },
  { label: "Bold", value: 0.75 },
  { label: "Solid", value: 1 }
];

interface ToolsMenuProps {
  activeCanvasTool: CanvasTool | null;
  activeFogTool: FogTool | null;
  activeWeatherMaskTool: WeatherMaskTool | null;
  activeDrawingTool: DrawingTool | null;
  fogOperation: FogOperation;
  brushSize: number;
  drawingColor: string;
  drawingOpacity: number;
  drawingStrokeWidth: number;
  pingSize: number;
  pingColor: string;
  fogShapeCount: number;
  drawingCount: number;
  weatherMaskCount: number;
  weatherToolsEnabled: boolean;
  onCanvasToolChange: (tool: CanvasTool | null) => void;
  onFogToolChange: (tool: FogTool | null) => void;
  onWeatherMaskToolChange: (tool: WeatherMaskTool | null) => void;
  onDrawingToolChange: (tool: DrawingTool | null) => void;
  onFogOperationChange: (operation: FogOperation) => void;
  onBrushSizeChange: (brushSize: number) => void;
  onDrawingColorChange: (color: string) => void;
  onDrawingOpacityChange: (opacity: number) => void;
  onDrawingStrokeWidthChange: (strokeWidth: number) => void;
  onPingSizeChange: (pingSize: number) => void;
  onPingColorChange: (pingColor: string) => void;
  onUndoFogShape: () => void;
  onUndoDrawing: () => void;
  onUndoWeatherMask: () => void;
  onRequestClearFog: () => void;
}

export function ToolsMenu({
  activeCanvasTool,
  activeFogTool,
  activeWeatherMaskTool,
  activeDrawingTool,
  fogOperation,
  brushSize,
  drawingColor,
  drawingOpacity,
  drawingStrokeWidth,
  pingSize,
  pingColor,
  fogShapeCount,
  drawingCount,
  weatherMaskCount,
  weatherToolsEnabled,
  onCanvasToolChange,
  onFogToolChange,
  onWeatherMaskToolChange,
  onDrawingToolChange,
  onFogOperationChange,
  onBrushSizeChange,
  onDrawingColorChange,
  onDrawingOpacityChange,
  onDrawingStrokeWidthChange,
  onPingSizeChange,
  onPingColorChange,
  onUndoFogShape,
  onUndoDrawing,
  onUndoWeatherMask,
  onRequestClearFog
}: ToolsMenuProps) {
  const [fogMenuOpen, setFogMenuOpen] = useState(false);
  const [drawingMenuOpen, setDrawingMenuOpen] = useState(false);
  const [drawingThicknessCustomOpen, setDrawingThicknessCustomOpen] = useState(false);
  const [drawingOpacityCustomOpen, setDrawingOpacityCustomOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [weatherMenuOpen, setWeatherMenuOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<"drawing" | "fog" | "ruler" | "weather" | null>(null);
  const activeFogShape = getActiveFogShape(activeFogTool);

  useEffect(() => {
    if (activeFogTool) {
      setFogMenuOpen(true);
      setDrawingMenuOpen(false);
    }
  }, [activeFogTool]);

  useEffect(() => {
    if (activeCanvasTool) {
      setFogMenuOpen(false);
      setDrawingMenuOpen(false);
      setWeatherMenuOpen(false);
      setTableMenuOpen(true);
    }
  }, [activeCanvasTool]);

  useEffect(() => {
    if (activeDrawingTool) {
      setFogMenuOpen(false);
      setDrawingMenuOpen(true);
      setWeatherMenuOpen(false);
      setTableMenuOpen(false);
    }
  }, [activeDrawingTool]);

  useEffect(() => {
    if (activeWeatherMaskTool) {
      setFogMenuOpen(false);
      setDrawingMenuOpen(false);
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
      (helpTopic === "drawing" && !drawingMenuOpen) ||
      (helpTopic === "ruler" && (!tableMenuOpen || activeCanvasTool !== "ruler"))
    ) {
      setHelpTopic(null);
    }
  }, [activeCanvasTool, drawingMenuOpen, fogMenuOpen, helpTopic, tableMenuOpen, weatherMenuOpen]);

  const setFogToolShape = (shape: FogToolShape) => {
    const nextTool = createFogTool(fogOperation, shape);
    onCanvasToolChange(null);
    onDrawingToolChange(null);
    onWeatherMaskToolChange(null);
    onFogToolChange(activeFogTool === nextTool ? null : nextTool);
  };

  const setDrawingTool = (tool: DrawingTool) => {
    onCanvasToolChange(null);
    onFogToolChange(null);
    onWeatherMaskToolChange(null);
    onDrawingToolChange(activeDrawingTool === tool ? null : tool);
  };

  const setWeatherMaskTool = (tool: WeatherMaskTool) => {
    onCanvasToolChange(null);
    onFogToolChange(null);
    onDrawingToolChange(null);
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
              onDrawingToolChange(null);
              onWeatherMaskToolChange(null);
              setDrawingMenuOpen(false);
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
          className={drawingMenuOpen ? "tool-circle-button tool-active" : "tool-circle-button"}
          aria-label={drawingMenuOpen ? "Close drawing tools" : "Open drawing tools"}
          title={drawingMenuOpen ? "Close Drawing Tools" : "Drawing Tools"}
          onClick={() => {
            const nextOpen = !drawingMenuOpen;
            setDrawingMenuOpen(nextOpen);
            if (nextOpen) {
              setFogMenuOpen(false);
              setTableMenuOpen(false);
              setWeatherMenuOpen(false);
              onCanvasToolChange(null);
              onFogToolChange(null);
              onWeatherMaskToolChange(null);
            } else {
              onDrawingToolChange(null);
              setHelpTopic(null);
            }
          }}
        >
          <Paintbrush size={18} aria-hidden="true" />
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
              setDrawingMenuOpen(false);
              setTableMenuOpen(false);
              onCanvasToolChange(null);
              onFogToolChange(null);
              onDrawingToolChange(null);
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
              setDrawingMenuOpen(false);
              setWeatherMenuOpen(false);
              onFogToolChange(null);
              onDrawingToolChange(null);
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
              <label className="tools-strip-field">
                <span>Brush Size</span>
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
              </label>
              <span className="tools-strip-value">{brushSize}px</span>
            </div>
          )}
        </div>
      )}
      {drawingMenuOpen && (
        <div className="tools-flyout tools-drawing-flyout" aria-label="Drawing Tools">
          <button
            className={activeDrawingTool === "freehand" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Freehand Drawing"
            title="Freehand Drawing"
            onClick={() => setDrawingTool("freehand")}
          >
            <Paintbrush size={17} aria-hidden="true" />
          </button>
          <button
            className={activeDrawingTool === "line" ? "tool-circle-button tool-active" : "tool-circle-button"}
            aria-label="Drawing Line"
            title="Drawing Line"
            onClick={() => setDrawingTool("line")}
          >
            <LineSquiggle size={17} aria-hidden="true" />
          </button>
          <button
            className="tool-circle-button"
            aria-label="Undo Last Drawing"
            title="Undo Last Drawing"
            disabled={drawingCount === 0}
            onClick={onUndoDrawing}
          >
            <Undo2 size={17} aria-hidden="true" />
          </button>
          <button
            className={helpTopic === "drawing" ? "tool-circle-button tool-help-trigger tool-active" : "tool-circle-button tool-help-trigger"}
            aria-label="Drawing tools help"
            title="Drawing tools help"
            aria-expanded={helpTopic === "drawing"}
            onClick={() => setHelpTopic((topic) => (topic === "drawing" ? null : "drawing"))}
          >
            <HelpCircle size={17} aria-hidden="true" />
          </button>
          <div className="tools-drawing-settings">
            <label className="tools-strip-field tools-strip-color-field">
              <span>Color</span>
              <ColorInput className="tools-drawing-color" value={drawingColor} aria-label="Drawing color" title="Drawing color" onChange={onDrawingColorChange} />
            </label>
            <div className="tools-strip-select-field tools-strip-thickness-control">
              <strong>Thickness</strong>
              <div>
                <select
                  aria-label="Drawing thickness"
                  title="Drawing thickness"
                  value={getPresetSelectValue(DRAWING_THICKNESS_PRESETS, drawingStrokeWidth, drawingThicknessCustomOpen)}
                  onChange={(event) => {
                    if (event.target.value === "custom") {
                      setDrawingThicknessCustomOpen(true);
                      return;
                    }
                    setDrawingThicknessCustomOpen(false);
                    onDrawingStrokeWidthChange(Number(event.target.value));
                  }}
                >
                  {DRAWING_THICKNESS_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="tools-strip-select-field tools-strip-opacity-control">
              <strong>Opacity</strong>
              <div>
                <select
                  aria-label="Drawing opacity"
                  title="Drawing opacity"
                  value={getPresetSelectValue(DRAWING_OPACITY_PRESETS, drawingOpacity, drawingOpacityCustomOpen)}
                  onChange={(event) => {
                    if (event.target.value === "custom") {
                      setDrawingOpacityCustomOpen(true);
                      return;
                    }
                    setDrawingOpacityCustomOpen(false);
                    onDrawingOpacityChange(Number(event.target.value));
                  }}
                >
                  {DRAWING_OPACITY_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            {(drawingThicknessCustomOpen || !hasPresetValue(DRAWING_THICKNESS_PRESETS, drawingStrokeWidth)) && (
              <div className="tools-strip-advanced-slider tools-strip-thickness-slider">
                <input
                  aria-label="Fine tune drawing thickness"
                  title="Fine tune drawing thickness"
                  type="range"
                  min={1}
                  max={48}
                  step={1}
                  value={drawingStrokeWidth}
                  onChange={(event) => onDrawingStrokeWidthChange(Number(event.target.value))}
                />
                <span aria-label={`Drawing thickness ${drawingStrokeWidth} pixels`}>{drawingStrokeWidth}px</span>
              </div>
            )}
            {(drawingOpacityCustomOpen || !hasPresetValue(DRAWING_OPACITY_PRESETS, drawingOpacity)) && (
              <div className="tools-strip-advanced-slider tools-strip-opacity-slider">
                <input
                  aria-label="Fine tune drawing opacity"
                  title="Fine tune drawing opacity"
                  type="range"
                  min={0.15}
                  max={1}
                  step={0.05}
                  value={drawingOpacity}
                  onChange={(event) => onDrawingOpacityChange(Number(event.target.value))}
                />
                <span aria-label={`Drawing opacity ${Math.round(drawingOpacity * 100)} percent`}>{Math.round(drawingOpacity * 100)}%</span>
              </div>
            )}
          </div>
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
              onDrawingToolChange(null);
              onWeatherMaskToolChange(null);
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
              onDrawingToolChange(null);
              onWeatherMaskToolChange(null);
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
              onDrawingToolChange(null);
              onWeatherMaskToolChange(null);
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
          {activeCanvasTool === "ping" && (
            <div className="tools-ping-settings">
              <input
                aria-label="Ping size"
                title="Ping size"
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                value={pingSize}
                onChange={(event) => onPingSizeChange(Number(event.target.value))}
              />
              <span>{Math.round(pingSize * 100)}%</span>
              <ColorInput className="tools-ping-color" value={pingColor} aria-label="Ping color" title="Ping color" onChange={onPingColorChange} />
            </div>
          )}
        </div>
      )}
      {helpTopic && <ToolHelpCard topic={helpTopic} />}
    </div>
  );
}

function ToolHelpCard({ topic }: { topic: "drawing" | "fog" | "ruler" | "weather" }) {
  if (topic === "drawing") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Drawing tools help">
        <strong>Drawing Tools</strong>
        {getDrawingHelpLines().map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    );
  }

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

function hasPresetValue(presets: { value: number }[], value: number): boolean {
  return presets.some((preset) => Math.abs(preset.value - value) < 0.001);
}

function getPresetSelectValue(presets: { value: number }[], value: number, customOpen: boolean): string {
  if (customOpen) {
    return "custom";
  }
  const preset = presets.find((candidate) => Math.abs(candidate.value - value) < 0.001);
  return preset ? String(preset.value) : "custom";
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
