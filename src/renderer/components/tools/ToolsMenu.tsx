import { useEffect, useState, type ReactNode } from "react";
import {
  Circle,
  CloudFog,
  Dices,
  Hand,
  HelpCircle,
  Lightbulb,
  LineSquiggle,
  ListOrdered,
  Minus,
  MousePointer2,
  Paintbrush,
  Pentagon,
  Pin,
  Ruler,
  Square,
  SquareDashedMousePointer,
  Table2,
  Target,
  Triangle,
  Type,
  Undo2
} from "lucide-react";
import type { DrawingTool } from "../../canvas/drawingRenderer";
import type { FogTool } from "../../canvas/fogRenderer";
import { getDrawingHelpLines, getFogHelpLines, getRulerHelpLines, getWeatherHelpLines } from "../../lib/toolCopy";
import { ColorInput } from "../controls/ColorPickerField";

export type FogOperation = "reveal" | "hide";
export type CanvasTool = "ruler" | "ping" | "laser";
export type WeatherMaskTool = "rectangle" | "circle" | "polygon";
export type DrawingTemplateSize = "custom" | 5 | 10 | 15 | 20 | 30 | 60 | 100;
type FogToolShape = "brush" | "rectangle" | "circle" | "polygon";
type ToolCategory = "mouse" | "drawing" | "templates" | "text" | "table" | "dice" | "turn-order" | "pin" | "mask" | "lighting";
type MouseMode = "selector" | "grabber";

const BRUSH_SIZE_PRESETS = [
  { label: "Extra Thin", value: 20 },
  { label: "Thin", value: 40 },
  { label: "Medium", value: 80 },
  { label: "Thick", value: 160 },
  { label: "Extra Thick", value: 240 }
];

const PING_SIZE_PRESETS = [
  { label: "Extra Small", value: 0.65 },
  { label: "Small", value: 0.85 },
  { label: "Medium", value: 1 },
  { label: "Large", value: 1.5 },
  { label: "Extra Large", value: 2.25 }
];

const DRAWING_OPACITY_PRESETS = [
  { label: "Faint", value: 0.25 },
  { label: "Soft", value: 0.5 },
  { label: "Bold", value: 0.75 },
  { label: "Solid", value: 1 }
];

const TEMPLATE_SIZE_PRESETS: DrawingTemplateSize[] = ["custom", 5, 10, 15, 20, 30, 60, 100];

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
  drawingTemplateSize: DrawingTemplateSize;
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
  onDrawingTemplateSizeChange: (size: DrawingTemplateSize) => void;
  onPingSizeChange: (pingSize: number) => void;
  onPingColorChange: (pingColor: string) => void;
  onUndoFogShape: () => void;
  onUndoDrawing: () => void;
  onUndoWeatherMask: () => void;
  onRequestClearFog: () => void;
  onOpenDicePanel: () => void;
  onOpenTurnOrder: () => void;
}

const TOOL_CATEGORIES: Array<{ id: ToolCategory; label: string; icon: typeof SquareDashedMousePointer; hasPanelTools: boolean }> = [
  { id: "drawing", label: "Drawing Tools", icon: LineSquiggle, hasPanelTools: true },
  { id: "templates", label: "Templates", icon: Triangle, hasPanelTools: true },
  { id: "text", label: "Text Tool", icon: Type, hasPanelTools: false },
  { id: "table", label: "Table Tools", icon: Table2, hasPanelTools: true },
  { id: "dice", label: "Dice Bag", icon: Dices, hasPanelTools: false },
  { id: "turn-order", label: "Turn Order", icon: ListOrdered, hasPanelTools: false },
  { id: "pin", label: "Pin Tools", icon: Pin, hasPanelTools: false },
  { id: "mask", label: "Mask Tools", icon: CloudFog, hasPanelTools: true },
  { id: "lighting", label: "Dynamic Lighting", icon: Lightbulb, hasPanelTools: false }
];

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
  drawingTemplateSize,
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
  onDrawingTemplateSizeChange,
  onPingSizeChange,
  onPingColorChange,
  onUndoFogShape,
  onUndoDrawing,
  onUndoWeatherMask,
  onOpenDicePanel,
  onOpenTurnOrder
}: ToolsMenuProps) {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [mouseMode, setMouseMode] = useState<MouseMode>("selector");
  const [fogBrushCustomOpen, setFogBrushCustomOpen] = useState(false);
  const [pingSizeCustomOpen, setPingSizeCustomOpen] = useState(false);
  const [drawingThicknessCustomOpen, setDrawingThicknessCustomOpen] = useState(false);
  const [drawingOpacityCustomOpen, setDrawingOpacityCustomOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<"drawing" | "mask" | "ruler" | null>(null);
  const activeFogShape = getActiveFogShape(activeFogTool);

  useEffect(() => {
    if (activeFogTool || activeWeatherMaskTool) {
      setActiveCategory("mask");
      setMouseMode("selector");
    }
  }, [activeFogTool, activeWeatherMaskTool]);

  useEffect(() => {
    if (activeCanvasTool) {
      setActiveCategory("table");
      setMouseMode("selector");
    }
  }, [activeCanvasTool]);

  useEffect(() => {
    if (activeDrawingTool) {
      setActiveCategory(isTemplateDrawingTool(activeDrawingTool) ? "templates" : "drawing");
      setMouseMode("selector");
    }
  }, [activeDrawingTool]);

  useEffect(() => {
    if (!weatherToolsEnabled) {
      onWeatherMaskToolChange(null);
    }
  }, [onWeatherMaskToolChange, weatherToolsEnabled]);

  const clearActiveTools = () => {
    onCanvasToolChange(null);
    onFogToolChange(null);
    onWeatherMaskToolChange(null);
    onDrawingToolChange(null);
    setHelpTopic(null);
  };

  const openCategory = (category: ToolCategory) => {
    setActiveCategory((current) => (current === category ? null : category));
    setHelpTopic(null);
    if (category === "dice") {
      onOpenDicePanel();
      return;
    }
    if (category === "turn-order") {
      onOpenTurnOrder();
      return;
    }
    if (category === "drawing" || category === "templates") {
      onCanvasToolChange(null);
      onFogToolChange(null);
      onWeatherMaskToolChange(null);
    } else if (category === "table") {
      onFogToolChange(null);
      onWeatherMaskToolChange(null);
      onDrawingToolChange(null);
    } else if (category === "mask") {
      onCanvasToolChange(null);
      onDrawingToolChange(null);
    } else {
      clearActiveTools();
    }
    setMouseMode("selector");
  };

  const setFogToolShape = (shape: FogToolShape) => {
    const nextTool = createFogTool(fogOperation, shape);
    onCanvasToolChange(null);
    onDrawingToolChange(null);
    onWeatherMaskToolChange(null);
    onFogToolChange(activeFogTool === nextTool ? null : nextTool);
    setMouseMode("selector");
  };

  const setDrawingTool = (tool: DrawingTool) => {
    onCanvasToolChange(null);
    onFogToolChange(null);
    onWeatherMaskToolChange(null);
    onDrawingToolChange(activeDrawingTool === tool ? null : tool);
    setMouseMode("selector");
  };

  const setWeatherMaskTool = (tool: WeatherMaskTool) => {
    onCanvasToolChange(null);
    onFogToolChange(null);
    onDrawingToolChange(null);
    onWeatherMaskToolChange(activeWeatherMaskTool === tool ? null : tool);
    setMouseMode("selector");
  };

  const setTableTool = (tool: CanvasTool) => {
    onFogToolChange(null);
    onDrawingToolChange(null);
    onWeatherMaskToolChange(null);
    setHelpTopic(null);
    onCanvasToolChange(activeCanvasTool === tool ? null : tool);
    setMouseMode("selector");
  };

  const setFogToolOperation = (operation: FogOperation) => {
    onFogOperationChange(operation);
    if (activeFogShape) {
      onFogToolChange(createFogTool(operation, activeFogShape));
    }
  };

  return (
    <div className="tools-menu" aria-label="Tools menu">
      <div className="tools-menu-stack" aria-label="Tool Categories">
        <button
          className={activeCategory === "mouse" || mouseMode === "selector" ? "tools-category-button tool-active" : "tools-category-button"}
          aria-label="Mouse Behavior"
          title="Mouse Behavior"
          type="button"
          onClick={() => setActiveCategory((current) => (current === "mouse" ? null : "mouse"))}
        >
          <MousePointer2 size={18} aria-hidden="true" />
          <span className="tools-category-more" aria-hidden="true" />
        </button>
        <button className="tools-menu-title-button" type="button" aria-expanded={toolsExpanded} title={toolsExpanded ? "Collapse tools" : "Expand tools"} onClick={() => setToolsExpanded((expanded) => !expanded)}>
          Tools
        </button>
        {toolsExpanded &&
          TOOL_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                className={activeCategory === category.id ? "tools-category-button tool-active" : "tools-category-button"}
                aria-label={category.label}
                title={category.label}
                type="button"
                onClick={() => openCategory(category.id)}
              >
                <Icon size={18} aria-hidden="true" />
                {category.hasPanelTools && <span className="tools-category-more" aria-hidden="true" />}
              </button>
            );
          })}
      </div>
      {activeCategory && (
        <div className="tools-subpanel" aria-label={`${getCategoryLabel(activeCategory)} panel`}>
          <PanelHeader title={getCategoryLabel(activeCategory)} />
          {activeCategory === "mouse" && (
            <div className="tools-panel-section">
              <div className="tools-button-row">
                <ToolButton active={mouseMode === "selector"} label="Selector" onClick={() => { clearActiveTools(); setMouseMode("selector"); }}>
                  <SquareDashedMousePointer size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={mouseMode === "grabber"} label="Grabber" onClick={() => { clearActiveTools(); setMouseMode("grabber"); }}>
                  <Hand size={17} aria-hidden="true" />
                </ToolButton>
              </div>
            </div>
          )}
          {activeCategory === "drawing" && (
            <div className="tools-panel-section">
              <HelpButton active={helpTopic === "drawing"} label="Drawing tools help" onClick={() => setHelpTopic((topic) => (topic === "drawing" ? null : "drawing"))} />
              <div className="tools-button-row">
                <ToolButton active={activeDrawingTool === "freehand"} label="Brush" onClick={() => setDrawingTool("freehand")}>
                  <Paintbrush size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "line"} label="Line" onClick={() => setDrawingTool("line")}>
                  <Minus size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "rectangle"} label="Square" onClick={() => setDrawingTool("rectangle")}>
                  <Square size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "circle"} label="Circle" onClick={() => setDrawingTool("circle")}>
                  <Circle size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "triangle"} label="Triangle" onClick={() => setDrawingTool("triangle")}>
                  <Triangle size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "polygon"} label="Polygon" onClick={() => setDrawingTool("polygon")}>
                  <Pentagon size={17} aria-hidden="true" />
                </ToolButton>
                <span className="tools-vertical-divider" aria-hidden="true" />
                <ToolButton label="Undo Last Drawing" disabled={drawingCount === 0} onClick={onUndoDrawing}>
                  <Undo2 size={17} aria-hidden="true" />
                </ToolButton>
              </div>
              <div className="tools-section-divider" />
              <div className="tools-section-label">Settings</div>
              <DrawingSettings
                drawingColor={drawingColor}
                drawingOpacity={drawingOpacity}
                drawingStrokeWidth={drawingStrokeWidth}
                drawingTemplateSize={drawingTemplateSize}
                drawingThicknessCustomOpen={drawingThicknessCustomOpen}
                drawingOpacityCustomOpen={drawingOpacityCustomOpen}
                templateToolActive={false}
                onDrawingColorChange={onDrawingColorChange}
                onDrawingOpacityChange={onDrawingOpacityChange}
                onDrawingStrokeWidthChange={onDrawingStrokeWidthChange}
                onDrawingTemplateSizeChange={onDrawingTemplateSizeChange}
                onDrawingThicknessCustomOpenChange={setDrawingThicknessCustomOpen}
                onDrawingOpacityCustomOpenChange={setDrawingOpacityCustomOpen}
              />
              {helpTopic === "drawing" && <ToolHelpCard topic="drawing" />}
            </div>
          )}
          {activeCategory === "templates" && (
            <div className="tools-panel-section">
              <div className="tools-button-row">
                <ToolButton active={activeDrawingTool === "template-line"} label="Line Template" onClick={() => setDrawingTool("template-line")}>
                  <Minus size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "template-circle"} label="Radius Template" onClick={() => setDrawingTool("template-circle")}>
                  <Circle size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "template-rectangle"} label="Square Template" onClick={() => setDrawingTool("template-rectangle")}>
                  <Square size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "template-cone"} label="Cone Template" onClick={() => setDrawingTool("template-cone")}>
                  <Triangle size={17} aria-hidden="true" />
                </ToolButton>
                <span className="tools-vertical-divider" aria-hidden="true" />
                <ToolButton label="Undo Last Drawing" disabled={drawingCount === 0} onClick={onUndoDrawing}>
                  <Undo2 size={17} aria-hidden="true" />
                </ToolButton>
              </div>
              <div className="tools-section-divider" />
              <div className="tools-section-label">Settings</div>
              <DrawingSettings
                drawingColor={drawingColor}
                drawingOpacity={drawingOpacity}
                drawingStrokeWidth={drawingStrokeWidth}
                drawingTemplateSize={drawingTemplateSize}
                drawingThicknessCustomOpen={drawingThicknessCustomOpen}
                drawingOpacityCustomOpen={drawingOpacityCustomOpen}
                templateToolActive
                onDrawingColorChange={onDrawingColorChange}
                onDrawingOpacityChange={onDrawingOpacityChange}
                onDrawingStrokeWidthChange={onDrawingStrokeWidthChange}
                onDrawingTemplateSizeChange={onDrawingTemplateSizeChange}
                onDrawingThicknessCustomOpenChange={setDrawingThicknessCustomOpen}
                onDrawingOpacityCustomOpenChange={setDrawingOpacityCustomOpen}
              />
            </div>
          )}
          {activeCategory === "text" && <Placeholder message="Text tools will be added here." />}
          {activeCategory === "table" && (
            <div className="tools-panel-section">
              <HelpButton active={helpTopic === "ruler"} label="Table tools help" disabled={activeCanvasTool !== "ruler"} onClick={() => setHelpTopic((topic) => (topic === "ruler" ? null : "ruler"))} />
              <div className="tools-button-row">
                <ToolButton active={activeCanvasTool === "ruler"} label="Ruler" onClick={() => setTableTool("ruler")}>
                  <Ruler size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeCanvasTool === "ping"} label="Sonar" onClick={() => setTableTool("ping")}>
                  <Target size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeCanvasTool === "laser"} label="Laser Pointer" onClick={() => setTableTool("laser")}>
                  <LineSquiggle size={17} aria-hidden="true" />
                </ToolButton>
              </div>
              <div className="tools-section-divider" />
              <div className="tools-section-label">Visibility</div>
              <label className="fog-operation-switch tools-operation-switch" title="Show or hide table tool output">
                <span>Show</span>
                <input
                  type="checkbox"
                  checked={Boolean(activeCanvasTool)}
                  onChange={(event) => {
                    if (!event.target.checked) {
                      onCanvasToolChange(null);
                    }
                  }}
                />
                <span>Hide</span>
              </label>
              {activeCanvasTool === "ping" && (
                <div className="tools-section-tools">
                  <div className="tools-section-label">Settings</div>
                  <div className="tools-ping-settings-panel">
                  <div className="tools-strip-select-field">
                    <strong>Sonar Size</strong>
                    <div>
                      <select
                        aria-label="Sonar size"
                        title="Sonar size"
                        value={getPresetSelectValue(PING_SIZE_PRESETS, pingSize, pingSizeCustomOpen)}
                        onChange={(event) => {
                          if (event.target.value === "custom") {
                            setPingSizeCustomOpen(true);
                            return;
                          }
                          setPingSizeCustomOpen(false);
                          onPingSizeChange(Number(event.target.value));
                        }}
                      >
                        {PING_SIZE_PRESETS.map((preset) => (
                          <option key={preset.label} value={preset.value}>{preset.label}</option>
                        ))}
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                  <label className="tools-strip-field tools-strip-color-field">
                    <span>Color</span>
                    <ColorInput className="tools-ping-color" value={pingColor} aria-label="Ping color" title="Ping color" onChange={onPingColorChange} />
                  </label>
                  {(pingSizeCustomOpen || !hasPresetValue(PING_SIZE_PRESETS, pingSize)) && (
                    <div className="tools-strip-advanced-slider tools-table-slider">
                      <input aria-label="Fine tune sonar size" title="Fine tune sonar size" type="range" min={0.5} max={3} step={0.1} value={pingSize} onChange={(event) => onPingSizeChange(Number(event.target.value))} />
                      <span>{Math.round(pingSize * 100)}%</span>
                    </div>
                  )}
                  </div>
                </div>
              )}
              {activeCanvasTool === "laser" && <Placeholder message="Laser thickness presets will be wired into the live pointer renderer next." />}
              {helpTopic === "ruler" && <ToolHelpCard topic="ruler" />}
            </div>
          )}
          {activeCategory === "dice" && <Placeholder message="Dice Bag opens the current Dice panel." />}
          {activeCategory === "turn-order" && <Placeholder message="Turn Order opens in the lower drawer for now." />}
          {activeCategory === "pin" && <Placeholder message="Pin tools will be added here." />}
          {activeCategory === "mask" && (
            <div className="tools-panel-section">
              <HelpButton active={helpTopic === "mask"} label="Mask Tools Help" onClick={() => setHelpTopic((topic) => (topic === "mask" ? null : "mask"))} />
              <div className="tools-section-label">Fog Of War Masks</div>
              <div className="tools-button-row">
                <ToolButton active={activeFogShape === "brush"} label="Brush Mask" onClick={() => setFogToolShape("brush")}>
                  <Paintbrush size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeFogShape === "rectangle"} label="Rectangle Mask" onClick={() => setFogToolShape("rectangle")}>
                  <Square size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeFogShape === "circle"} label="Circle Mask" onClick={() => setFogToolShape("circle")}>
                  <Circle size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeFogShape === "polygon"} label="Polygon Mask" onClick={() => setFogToolShape("polygon")}>
                  <Pentagon size={17} aria-hidden="true" />
                </ToolButton>
                <span className="tools-vertical-divider" aria-hidden="true" />
                <ToolButton label="Undo Last Fog Mask" disabled={fogShapeCount === 0} onClick={onUndoFogShape}>
                  <Undo2 size={17} aria-hidden="true" />
                </ToolButton>
              </div>
              <label className="fog-operation-switch tools-operation-switch" title="Reveal or hide fog">
                <strong className="tools-toggle-label">Visibility</strong>
                <span>Reveal</span>
                <input type="checkbox" checked={fogOperation === "hide"} onChange={(event) => setFogToolOperation(event.target.checked ? "hide" : "reveal")} />
                <span>Hide</span>
              </label>
              {activeFogShape === "brush" && (
                <div className="tools-brush-size">
                  <div className="tools-strip-select-field">
                    <strong>Brush Size</strong>
                    <div>
                      <select
                        aria-label="Fog brush size"
                        title="Fog brush size"
                        value={getPresetSelectValue(BRUSH_SIZE_PRESETS, brushSize, fogBrushCustomOpen)}
                        onChange={(event) => {
                          if (event.target.value === "custom") {
                            setFogBrushCustomOpen(true);
                            return;
                          }
                          setFogBrushCustomOpen(false);
                          onBrushSizeChange(Number(event.target.value));
                        }}
                      >
                        {BRUSH_SIZE_PRESETS.map((preset) => (
                          <option key={preset.label} value={preset.value}>{preset.label}</option>
                        ))}
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                  {(fogBrushCustomOpen || !hasPresetValue(BRUSH_SIZE_PRESETS, brushSize)) && (
                    <div className="tools-strip-advanced-slider tools-fog-brush-slider">
                      <input aria-label="Fine tune fog brush size" title="Fine tune fog brush size" type="range" min={8} max={400} step={4} value={brushSize} onChange={(event) => onBrushSizeChange(Number(event.target.value))} />
                      <span aria-label={`Fog brush size ${brushSize} pixels`}>{brushSize}px</span>
                    </div>
                  )}
                </div>
              )}
              <div className="tools-section-divider" />
              <div className="tools-section-label">Weather Masks</div>
              {!weatherToolsEnabled && <span className="tools-section-note">Enable a weather effect to use weather masks.</span>}
              <div className="tools-button-row">
                <ToolButton active={activeWeatherMaskTool === "rectangle"} label="Rectangle Mask" disabled={!weatherToolsEnabled} onClick={() => setWeatherMaskTool("rectangle")}>
                  <Square size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeWeatherMaskTool === "circle"} label="Circle Mask" disabled={!weatherToolsEnabled} onClick={() => setWeatherMaskTool("circle")}>
                  <Circle size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeWeatherMaskTool === "polygon"} label="Polygon Mask" disabled={!weatherToolsEnabled} onClick={() => setWeatherMaskTool("polygon")}>
                  <Pentagon size={17} aria-hidden="true" />
                </ToolButton>
                <span className="tools-vertical-divider" aria-hidden="true" />
                <ToolButton label="Undo Last Weather Mask" disabled={!weatherToolsEnabled || weatherMaskCount === 0} onClick={onUndoWeatherMask}>
                  <Undo2 size={17} aria-hidden="true" />
                </ToolButton>
              </div>
              {helpTopic === "mask" && <ToolHelpCard topic="mask" />}
            </div>
          )}
          {activeCategory === "lighting" && <Placeholder message="Dynamic lighting tools will be added here." />}
        </div>
      )}
    </div>
  );
}

function PanelHeader({ title }: { title: string }) {
  return <div className="tools-subpanel-header">{title}</div>;
}

function ToolButton({ active = false, disabled = false, label, children, onClick }: { active?: boolean; disabled?: boolean; label: string; children: ReactNode; onClick: () => void }) {
  return (
    <button className={active ? "tool-circle-button tool-active" : "tool-circle-button"} aria-label={label} title={label} type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function HelpButton({ active, disabled = false, label, onClick }: { active: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button className={active ? "tool-circle-button tool-help-trigger tools-panel-help-button tool-active" : "tool-circle-button tool-help-trigger tools-panel-help-button"} aria-label={label} title={label} type="button" aria-expanded={active} disabled={disabled} onClick={onClick}>
      <HelpCircle size={14} aria-hidden="true" />
    </button>
  );
}

function DrawingSettings({
  drawingColor,
  drawingOpacity,
  drawingStrokeWidth,
  drawingTemplateSize,
  drawingThicknessCustomOpen,
  drawingOpacityCustomOpen,
  templateToolActive,
  onDrawingColorChange,
  onDrawingOpacityChange,
  onDrawingStrokeWidthChange,
  onDrawingTemplateSizeChange,
  onDrawingThicknessCustomOpenChange,
  onDrawingOpacityCustomOpenChange
}: {
  drawingColor: string;
  drawingOpacity: number;
  drawingStrokeWidth: number;
  drawingTemplateSize: DrawingTemplateSize;
  drawingThicknessCustomOpen: boolean;
  drawingOpacityCustomOpen: boolean;
  templateToolActive: boolean;
  onDrawingColorChange: (color: string) => void;
  onDrawingOpacityChange: (opacity: number) => void;
  onDrawingStrokeWidthChange: (strokeWidth: number) => void;
  onDrawingTemplateSizeChange: (size: DrawingTemplateSize) => void;
  onDrawingThicknessCustomOpenChange: (open: boolean) => void;
  onDrawingOpacityCustomOpenChange: (open: boolean) => void;
}) {
  return (
    <div className={templateToolActive ? "tools-drawing-settings tools-drawing-settings-template" : "tools-drawing-settings"}>
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
            value={getPresetSelectValue(BRUSH_SIZE_PRESETS, drawingStrokeWidth, drawingThicknessCustomOpen)}
            onChange={(event) => {
              if (event.target.value === "custom") {
                onDrawingThicknessCustomOpenChange(true);
                return;
              }
              onDrawingThicknessCustomOpenChange(false);
              onDrawingStrokeWidthChange(Number(event.target.value));
            }}
          >
            {BRUSH_SIZE_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.value}>{preset.label}</option>
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
                onDrawingOpacityCustomOpenChange(true);
                return;
              }
              onDrawingOpacityCustomOpenChange(false);
              onDrawingOpacityChange(Number(event.target.value));
            }}
          >
            {DRAWING_OPACITY_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.value}>{preset.label}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      {templateToolActive && (
        <div className="tools-strip-select-field tools-strip-template-size-control">
          <strong>Size</strong>
          <div>
            <select
              aria-label="Template size"
              title="Template size"
              value={String(drawingTemplateSize)}
              onChange={(event) => {
                const value = event.target.value;
                onDrawingTemplateSizeChange(value === "custom" ? "custom" : (Number(value) as DrawingTemplateSize));
              }}
            >
              {TEMPLATE_SIZE_PRESETS.map((size) => (
                <option key={size} value={size}>{size === "custom" ? "Custom" : `${size} ft`}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      {(drawingThicknessCustomOpen || !hasPresetValue(BRUSH_SIZE_PRESETS, drawingStrokeWidth)) && (
        <div className="tools-strip-advanced-slider tools-strip-thickness-slider">
          <input aria-label="Fine tune drawing thickness" title="Fine tune drawing thickness" type="range" min={8} max={400} step={4} value={drawingStrokeWidth} onChange={(event) => onDrawingStrokeWidthChange(Number(event.target.value))} />
          <span aria-label={`Drawing thickness ${drawingStrokeWidth} pixels`}>{drawingStrokeWidth}px</span>
        </div>
      )}
      {(drawingOpacityCustomOpen || !hasPresetValue(DRAWING_OPACITY_PRESETS, drawingOpacity)) && (
        <div className="tools-strip-advanced-slider tools-strip-opacity-slider">
          <input aria-label="Fine tune drawing opacity" title="Fine tune drawing opacity" type="range" min={0.15} max={1} step={0.05} value={drawingOpacity} onChange={(event) => onDrawingOpacityChange(Number(event.target.value))} />
          <span aria-label={`Drawing opacity ${Math.round(drawingOpacity * 100)} percent`}>{Math.round(drawingOpacity * 100)}%</span>
        </div>
      )}
    </div>
  );
}

function Placeholder({ message }: { message: string }) {
  return <div className="tools-placeholder">{message}</div>;
}

function ToolHelpCard({ topic }: { topic: "drawing" | "mask" | "ruler" }) {
  if (topic === "drawing") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Drawing tools help">
        <strong>Drawing Tools</strong>
        {getDrawingHelpLines().map((line) => <span key={line}>{line}</span>)}
      </div>
    );
  }

  if (topic === "mask") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Mask tools help">
        <strong>Mask Tools</strong>
        {[...getFogHelpLines(), ...getWeatherHelpLines()].map((line) => <span key={line}>{line}</span>)}
      </div>
    );
  }

  return (
    <div className="tools-help-card" role="dialog" aria-label="Ruler help">
      <strong>Ruler</strong>
      {getRulerHelpLines().map((line) => <span key={line}>{line}</span>)}
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

function isTemplateDrawingTool(tool: DrawingTool | null): boolean {
  return tool === "template-line" || tool === "template-rectangle" || tool === "template-circle" || tool === "template-cone";
}

function getCategoryLabel(category: ToolCategory): string {
  if (category === "mouse") {
    return "Mouse Behavior";
  }
  const toolCategory = TOOL_CATEGORIES.find((candidate) => candidate.id === category);
  return toolCategory?.label ?? "Tools";
}
