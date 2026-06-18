import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  CloudFog,
  Copy,
  Dices,
  Eye,
  EyeOff,
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
  Sparkles,
  Square,
  SquareDashedMousePointer,
  Table2,
  Target,
  Trash2,
  Triangle,
  Type,
  Undo2,
  X
} from "lucide-react";
import type { DrawingTool } from "../../canvas/drawingRenderer";
import type { DrawingStrokeStyle, DrawingTemplateEffect, EnvironmentEffectType } from "../../../shared/localvtt";
import type { FogTool } from "../../canvas/fogRenderer";
import { getDrawingHelpLines, getFogHelpLines, getTableHelpLines, getTemplateHelpLines, getWeatherHelpLines } from "../../lib/toolCopy";
import { ColorInput } from "../controls/ColorPickerField";
import { WATER_EFFECT_PRESETS, type WaterEffectTuning } from "../../canvas/environmentEffectsRenderer";

export type FogOperation = "reveal" | "hide";
export type CanvasTool = "ruler" | "ping" | "laser";
export type WeatherMaskTool = "rectangle" | "circle" | "polygon";
export type EnvironmentEffectTool = "rectangle" | "circle" | "polygon";
export type DrawingTemplateSize = "custom" | 5 | 10 | 15 | 20 | 30 | 60 | 100;
export type DrawingTemplateWidth = 0 | 5 | 10 | 15 | 20;
type FogToolShape = "brush" | "rectangle" | "circle" | "polygon";
type ToolCategory = "mouse" | "drawing" | "templates" | "text" | "table" | "dice" | "turn-order" | "pin" | "fog" | "effects" | "lighting";
export type MouseBehavior = "selector" | "grabber";
export type SelectorSelectionFilters = {
  tokens: boolean;
  templates: boolean;
  fogMasks: boolean;
  weatherMasks: boolean;
  drawings: boolean;
};

export type SelectorSelectionCounts = {
  tokens: number;
  templates: number;
  fogMasks: number;
  weatherMasks: number;
  drawings: number;
};

const BRUSH_SIZE_PRESETS = [
  { label: "Extra Thin", value: 20 },
  { label: "Thin", value: 40 },
  { label: "Medium", value: 80 },
  { label: "Thick", value: 160 },
  { label: "Extra Thick", value: 240 }
];

const DRAWING_THICKNESS_PRESETS = [
  { label: "Extra Thin", value: 8 },
  { label: "Thin", value: 20 },
  { label: "Medium", value: 40 },
  { label: "Thick", value: 80 },
  { label: "Extra Thick", value: 160 }
];

const TEMPLATE_THICKNESS_PRESETS = [
  { label: "Extra Thin", value: 4 },
  { label: "Thin", value: 8 },
  { label: "Medium", value: 16 },
  { label: "Thick", value: 32 },
  { label: "Extra Thick", value: 64 }
];

const PING_SIZE_PRESETS = [
  { label: "Extra Small", value: 0.65 },
  { label: "Small", value: 0.85 },
  { label: "Medium", value: 1 },
  { label: "Large", value: 1.5 },
  { label: "Extra Large", value: 2.25 }
];

const LASER_THICKNESS_PRESETS = [
  { label: "Extra Thin", value: 8 },
  { label: "Thin", value: 14 },
  { label: "Medium", value: 20 },
  { label: "Thick", value: 32 },
  { label: "Extra Thick", value: 48 }
];

const DRAWING_OPACITY_PRESETS = [
  { label: "Faint", value: 0.25 },
  { label: "Soft", value: 0.5 },
  { label: "Bold", value: 0.75 },
  { label: "Solid", value: 1 }
];

const DRAWING_STROKE_STYLE_OPTIONS: Array<{ label: string; value: DrawingStrokeStyle }> = [
  { label: "Solid - continuous", value: "solid" },
  { label: "Dashed - long breaks", value: "dashed" },
  { label: "Dotted - round dots", value: "dotted" },
  { label: "Dash Dot - mixed", value: "dash-dot" },
  { label: "Sketch - uneven", value: "sketch" }
];

const TEMPLATE_SIZE_PRESETS: DrawingTemplateSize[] = ["custom", 5, 10, 15, 20, 30, 60, 100];
const TEMPLATE_WIDTH_PRESETS: Array<{ label: string; value: DrawingTemplateWidth }> = [
  { label: "Line Only", value: 0 },
  { label: "5 ft", value: 5 },
  { label: "10 ft", value: 10 },
  { label: "15 ft", value: 15 },
  { label: "20 ft", value: 20 }
];
const TEMPLATE_EFFECT_OPTIONS: Array<{ label: string; value: DrawingTemplateEffect }> = [
  { label: "Plain", value: "plain" },
  { label: "Acid", value: "acid" },
  { label: "Arcane", value: "arcane" },
  { label: "Cold", value: "cold" },
  { label: "Darkness", value: "darkness" },
  { label: "Fire", value: "fire" },
  { label: "Fog / Smoke", value: "fog" },
  { label: "Lightning", value: "lightning" },
  { label: "Nature / Thorns", value: "nature" },
  { label: "Poison Cloud", value: "poison" },
  { label: "Psychic", value: "psychic" },
  { label: "Radiant", value: "radiant" },
  { label: "Storm", value: "storm" },
  { label: "Thunder", value: "thunder" },
  { label: "Water", value: "water" },
  { label: "Web", value: "web" }
];
const DEFAULT_DRAWING_COLOR = "#ff0000";
const DEFAULT_TEMPLATE_COLOR = "#7dd3fc";
const DEFAULT_SONAR_COLOR = "#ffd84d";

interface ToolsMenuProps {
  activeCanvasTool: CanvasTool | null;
  activeFogTool: FogTool | null;
  activeWeatherMaskTool: WeatherMaskTool | null;
  activeEnvironmentEffectTool: EnvironmentEffectTool | null;
  activeDrawingTool: DrawingTool | null;
  environmentEffectType: EnvironmentEffectType;
  waterEffectTuning: WaterEffectTuning;
  mouseBehavior: MouseBehavior;
  fogOperation: FogOperation;
  brushSize: number;
  drawingColor: string;
  drawingOpacity: number;
  drawingFillColor: string;
  drawingFillOpacity: number;
  drawingStrokeStyle: DrawingStrokeStyle;
  drawingStrokeWidth: number;
  drawingTemplateSize: DrawingTemplateSize;
  drawingTemplateEffect: DrawingTemplateEffect;
  drawingTemplateWidth: DrawingTemplateWidth;
  templatePreviewVisibleInPlayer: boolean;
  pingSize: number;
  pingColor: string;
  laserThickness: number;
  laserColor: string;
  rulerLinger: boolean;
  tableToolsVisibleInPlayer: boolean;
  fogShapeCount: number;
  drawingCount: number;
  weatherMaskCount: number;
  environmentEffectCount: number;
  weatherToolsEnabled: boolean;
  dicePanelOpen: boolean;
  turnOrderModalOpen: boolean;
  selectorSelectionFilters: SelectorSelectionFilters;
  selectorSelectionCounts: SelectorSelectionCounts;
  onCanvasToolChange: (tool: CanvasTool | null) => void;
  onFogToolChange: (tool: FogTool | null) => void;
  onWeatherMaskToolChange: (tool: WeatherMaskTool | null) => void;
  onEnvironmentEffectToolChange: (tool: EnvironmentEffectTool | null) => void;
  onDrawingToolChange: (tool: DrawingTool | null) => void;
  onEnvironmentEffectTypeChange: (effect: EnvironmentEffectType) => void;
  onWaterEffectTuningChange: (tuning: WaterEffectTuning) => void;
  onWaterEffectTuningReset: () => void;
  onMouseBehaviorChange: (behavior: MouseBehavior) => void;
  onFogOperationChange: (operation: FogOperation) => void;
  onBrushSizeChange: (brushSize: number) => void;
  onDrawingColorChange: (color: string) => void;
  onDrawingOpacityChange: (opacity: number) => void;
  onDrawingFillColorChange: (color: string) => void;
  onDrawingFillOpacityChange: (opacity: number) => void;
  onDrawingStrokeStyleChange: (strokeStyle: DrawingStrokeStyle) => void;
  onDrawingStrokeWidthChange: (strokeWidth: number) => void;
  onDrawingTemplateSizeChange: (size: DrawingTemplateSize) => void;
  onDrawingTemplateEffectChange: (effect: DrawingTemplateEffect) => void;
  onDrawingTemplateWidthChange: (width: DrawingTemplateWidth) => void;
  onTemplatePreviewVisibleInPlayerChange: (visible: boolean) => void;
  onPingSizeChange: (pingSize: number) => void;
  onPingColorChange: (pingColor: string) => void;
  onLaserThicknessChange: (laserThickness: number) => void;
  onLaserColorChange: (laserColor: string) => void;
  onRulerLingerChange: (linger: boolean) => void;
  onTableToolsVisibleInPlayerChange: (visible: boolean) => void;
  onUndoFogShape: () => void;
  onUndoDrawing: () => void;
  onUndoWeatherMask: () => void;
  onUndoEnvironmentEffect: () => void;
  onRequestClearFog: () => void;
  onToggleDicePanel: () => void;
  onToggleTurnOrder: () => void;
  onSelectorSelectionFiltersChange: (filters: SelectorSelectionFilters) => void;
  onShowSelectedOnPlayerView: () => void;
  onHideSelectedOnPlayerView: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

const TOOL_CATEGORIES: Array<{ id: ToolCategory; label: string; icon: typeof SquareDashedMousePointer; hasPanelTools: boolean }> = [
  { id: "drawing", label: "Drawing Tools", icon: LineSquiggle, hasPanelTools: true },
  { id: "templates", label: "Template Tools", icon: Triangle, hasPanelTools: true },
  { id: "text", label: "Text Tool", icon: Type, hasPanelTools: false },
  { id: "table", label: "Table Tools", icon: Table2, hasPanelTools: true },
  { id: "dice", label: "Dice Bag", icon: Dices, hasPanelTools: false },
  { id: "turn-order", label: "Turn Order", icon: ListOrdered, hasPanelTools: false },
  { id: "pin", label: "Pin Tools", icon: Pin, hasPanelTools: false },
  { id: "fog", label: "Fog Of War Tools", icon: CloudFog, hasPanelTools: true },
  { id: "effects", label: "Effects Tools", icon: Sparkles, hasPanelTools: true },
  { id: "lighting", label: "Dynamic Lighting", icon: Lightbulb, hasPanelTools: false }
];

export function ToolsMenu({
  activeCanvasTool,
  activeFogTool,
  activeWeatherMaskTool,
  activeEnvironmentEffectTool,
  activeDrawingTool,
  environmentEffectType,
  waterEffectTuning,
  mouseBehavior,
  fogOperation,
  brushSize,
  drawingColor,
  drawingOpacity,
  drawingFillColor,
  drawingFillOpacity,
  drawingStrokeStyle,
  drawingStrokeWidth,
  drawingTemplateSize,
  drawingTemplateEffect,
  drawingTemplateWidth,
  templatePreviewVisibleInPlayer,
  pingSize,
  pingColor,
  laserThickness,
  laserColor,
  rulerLinger,
  tableToolsVisibleInPlayer,
  fogShapeCount,
  drawingCount,
  weatherMaskCount,
  environmentEffectCount,
  weatherToolsEnabled,
  dicePanelOpen,
  turnOrderModalOpen,
  selectorSelectionFilters,
  selectorSelectionCounts,
  onCanvasToolChange,
  onFogToolChange,
  onWeatherMaskToolChange,
  onEnvironmentEffectToolChange,
  onDrawingToolChange,
  onEnvironmentEffectTypeChange,
  onWaterEffectTuningChange,
  onWaterEffectTuningReset,
  onMouseBehaviorChange,
  onFogOperationChange,
  onBrushSizeChange,
  onDrawingColorChange,
  onDrawingOpacityChange,
  onDrawingFillColorChange,
  onDrawingFillOpacityChange,
  onDrawingStrokeStyleChange,
  onDrawingStrokeWidthChange,
  onDrawingTemplateSizeChange,
  onDrawingTemplateEffectChange,
  onDrawingTemplateWidthChange,
  onTemplatePreviewVisibleInPlayerChange,
  onPingSizeChange,
  onPingColorChange,
  onLaserThicknessChange,
  onLaserColorChange,
  onRulerLingerChange,
  onTableToolsVisibleInPlayerChange,
  onUndoFogShape,
  onUndoDrawing,
  onUndoWeatherMask,
  onUndoEnvironmentEffect,
  onToggleDicePanel,
  onToggleTurnOrder,
  onSelectorSelectionFiltersChange,
  onShowSelectedOnPlayerView,
  onHideSelectedOnPlayerView,
  onDeleteSelected,
  onClearSelection
}: ToolsMenuProps) {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [fogBrushCustomOpen, setFogBrushCustomOpen] = useState(false);
  const [pingSizeCustomOpen, setPingSizeCustomOpen] = useState(false);
  const [laserThicknessCustomOpen, setLaserThicknessCustomOpen] = useState(false);
  const [drawingThicknessCustomOpen, setDrawingThicknessCustomOpen] = useState(false);
  const [drawingOpacityCustomOpen, setDrawingOpacityCustomOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<"drawing" | "templates" | "fog" | "effects" | "table" | null>(null);
  const [drawingSettingsOpen, setDrawingSettingsOpen] = useState(false);
  const [templateSettingsOpen, setTemplateSettingsOpen] = useState(false);
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false);
  const [maskSettingsOpen, setMaskSettingsOpen] = useState(false);
  const [selectorSettingsOpen, setSelectorSettingsOpen] = useState(false);
  const activeFogShape = getActiveFogShape(activeFogTool);

  useEffect(() => {
    if (activeFogTool) {
      setActiveCategory("fog");
    }
    if (activeWeatherMaskTool) {
      setActiveCategory("effects");
    }
    if (activeEnvironmentEffectTool) {
      setActiveCategory("effects");
    }
  }, [activeFogTool, activeWeatherMaskTool, activeEnvironmentEffectTool]);

  useEffect(() => {
    if (activeCanvasTool) {
      setActiveCategory("table");
    }
  }, [activeCanvasTool]);

  useEffect(() => {
    if (activeDrawingTool) {
      setActiveCategory(isTemplateDrawingTool(activeDrawingTool) ? "templates" : "drawing");
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
    onEnvironmentEffectToolChange(null);
    onDrawingToolChange(null);
    setHelpTopic(null);
  };

  const openCategory = (category: ToolCategory) => {
    if (activeCategory === category) {
      setActiveCategory(null);
      clearActiveTools();
      return;
    }

    setActiveCategory(category);
    setHelpTopic(null);
    if (category === "dice") {
      clearActiveTools();
      setActiveCategory(null);
      onToggleDicePanel();
      return;
    }
    if (category === "turn-order") {
      clearActiveTools();
      setActiveCategory(null);
      onToggleTurnOrder();
      return;
    }
    if (category === "drawing" || category === "templates") {
      onCanvasToolChange(null);
      onFogToolChange(null);
      onWeatherMaskToolChange(null);
      onEnvironmentEffectToolChange(null);
      onDrawingColorChange(category === "templates" ? DEFAULT_TEMPLATE_COLOR : DEFAULT_DRAWING_COLOR);
      if (category === "templates" && drawingStrokeWidth === 40) {
        onDrawingStrokeWidthChange(8);
      }
    } else if (category === "table") {
      onFogToolChange(null);
      onWeatherMaskToolChange(null);
      onEnvironmentEffectToolChange(null);
      onDrawingToolChange(null);
    } else if (category === "fog") {
      onCanvasToolChange(null);
      onDrawingToolChange(null);
      onWeatherMaskToolChange(null);
      onEnvironmentEffectToolChange(null);
    } else if (category === "effects") {
      onCanvasToolChange(null);
      onFogToolChange(null);
      onDrawingToolChange(null);
    } else {
      clearActiveTools();
    }
  };

  const setFogToolShape = (shape: FogToolShape) => {
    const nextTool = createFogTool(fogOperation, shape);
    onCanvasToolChange(null);
    onDrawingToolChange(null);
    onWeatherMaskToolChange(null);
    onEnvironmentEffectToolChange(null);
    onFogToolChange(activeFogTool === nextTool ? null : nextTool);
  };

  const setDrawingTool = (tool: DrawingTool) => {
    const activatingTemplateTool = isTemplateDrawingTool(tool) && activeDrawingTool !== tool;
    const enteringTemplateTools = activatingTemplateTool && !isTemplateDrawingTool(activeDrawingTool);
    onCanvasToolChange(null);
    onFogToolChange(null);
    onWeatherMaskToolChange(null);
    onEnvironmentEffectToolChange(null);
    onDrawingColorChange(isTemplateDrawingTool(tool) ? DEFAULT_TEMPLATE_COLOR : DEFAULT_DRAWING_COLOR);
    if (enteringTemplateTools && drawingStrokeWidth === 40) {
      onDrawingStrokeWidthChange(8);
    }
    onDrawingToolChange(activeDrawingTool === tool ? null : tool);
  };

  const setWeatherMaskTool = (tool: WeatherMaskTool) => {
    onCanvasToolChange(null);
    onFogToolChange(null);
    onDrawingToolChange(null);
    onEnvironmentEffectToolChange(null);
    onWeatherMaskToolChange(activeWeatherMaskTool === tool ? null : tool);
  };

  const setEnvironmentEffectTool = (tool: EnvironmentEffectTool) => {
    onCanvasToolChange(null);
    onFogToolChange(null);
    onDrawingToolChange(null);
    onWeatherMaskToolChange(null);
    onEnvironmentEffectToolChange(activeEnvironmentEffectTool === tool ? null : tool);
  };

  const setTableTool = (tool: CanvasTool) => {
    onFogToolChange(null);
    onDrawingToolChange(null);
    onWeatherMaskToolChange(null);
    onEnvironmentEffectToolChange(null);
    setHelpTopic(null);
    if (tool === "ping") {
      onPingColorChange(DEFAULT_SONAR_COLOR);
    }
    onCanvasToolChange(activeCanvasTool === tool ? null : tool);
  };

  const setFogToolOperation = (operation: FogOperation) => {
    onFogOperationChange(operation);
    if (activeFogShape) {
      onFogToolChange(createFogTool(operation, activeFogShape));
    }
  };

  const toggleMouseCategory = () => {
    if (activeCategory === "mouse") {
      setActiveCategory(null);
      setHelpTopic(null);
      return;
    }
    if (activeCategory) {
      clearActiveTools();
    }
    setActiveCategory("mouse");
    setHelpTopic(null);
  };

  const isCategoryActive = (category: ToolCategory): boolean => {
    if (activeCategory === category) {
      return true;
    }
    if (category === "drawing") {
      return Boolean(activeDrawingTool && !isTemplateDrawingTool(activeDrawingTool));
    }
    if (category === "templates") {
      return isTemplateDrawingTool(activeDrawingTool);
    }
    if (category === "table") {
      return Boolean(activeCanvasTool);
    }
    if (category === "fog") {
      return Boolean(activeFogTool);
    }
    if (category === "effects") {
      return Boolean(activeWeatherMaskTool || activeEnvironmentEffectTool);
    }
    if (category === "dice") {
      return dicePanelOpen;
    }
    if (category === "turn-order") {
      return turnOrderModalOpen;
    }
    return false;
  };

  return (
    <div className="tools-menu" aria-label="Tools menu">
      <div className="tools-menu-stack" aria-label="Tool Categories">
        <button
          className={activeCategory === "mouse" ? "tools-category-button tool-active" : "tools-category-button"}
          aria-label="Mouse Behavior"
          title="Mouse Behavior"
          type="button"
          onClick={toggleMouseCategory}
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
                className={isCategoryActive(category.id) ? "tools-category-button tool-active" : "tools-category-button"}
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
                <ToolButton active={mouseBehavior === "selector"} label="Selector" onClick={() => { clearActiveTools(); onMouseBehaviorChange("selector"); }}>
                  <SquareDashedMousePointer size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={mouseBehavior === "grabber"} label="Grabber" onClick={() => { clearActiveTools(); onMouseBehaviorChange("grabber"); }}>
                  <Hand size={17} aria-hidden="true" />
                </ToolButton>
              </div>
              {mouseBehavior === "selector" && (
                <>
                  <SelectorSelectionSummary counts={selectorSelectionCounts} />
                  <SelectorSelectionActions
                    counts={selectorSelectionCounts}
                    onShowSelectedOnPlayerView={onShowSelectedOnPlayerView}
                    onHideSelectedOnPlayerView={onHideSelectedOnPlayerView}
                    onDeleteSelected={onDeleteSelected}
                    onClearSelection={onClearSelection}
                  />
                  <div className="tools-section-divider" />
                  <SettingsToggle open={selectorSettingsOpen} label="Selector Settings" onToggle={() => setSelectorSettingsOpen((open) => !open)} />
                  {selectorSettingsOpen && (
                    <div className="tools-selector-settings" aria-label="Selector included layers">
                      <SelectorFilterCheckbox label="Token" checked={selectorSelectionFilters.tokens} onChange={(checked) => onSelectorSelectionFiltersChange({ ...selectorSelectionFilters, tokens: checked })} />
                      <SelectorFilterCheckbox label="Template" checked={selectorSelectionFilters.templates} onChange={(checked) => onSelectorSelectionFiltersChange({ ...selectorSelectionFilters, templates: checked })} />
                      <SelectorFilterCheckbox label="Fog Mask" checked={selectorSelectionFilters.fogMasks} onChange={(checked) => onSelectorSelectionFiltersChange({ ...selectorSelectionFilters, fogMasks: checked })} />
                      <SelectorFilterCheckbox label="Weather Effect Mask" checked={selectorSelectionFilters.weatherMasks} onChange={(checked) => onSelectorSelectionFiltersChange({ ...selectorSelectionFilters, weatherMasks: checked })} />
                      <SelectorFilterCheckbox label="Drawings" checked={selectorSelectionFilters.drawings} onChange={(checked) => onSelectorSelectionFiltersChange({ ...selectorSelectionFilters, drawings: checked })} />
                    </div>
                  )}
                </>
              )}
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
                <ToolButton active={activeDrawingTool === "rectangle"} label="Rectangle" onClick={() => setDrawingTool("rectangle")}>
                  <Square size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "circle"} label="Ellipse" onClick={() => setDrawingTool("circle")}>
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
              <SettingsToggle open={drawingSettingsOpen} label="Settings" onToggle={() => setDrawingSettingsOpen((open) => !open)} />
              {drawingSettingsOpen && (
                <DrawingSettings
                  drawingColor={drawingColor}
                  drawingOpacity={drawingOpacity}
                  drawingFillColor={drawingFillColor}
                  drawingFillOpacity={drawingFillOpacity}
                  drawingStrokeStyle={drawingStrokeStyle}
                  drawingStrokeWidth={drawingStrokeWidth}
                  drawingTemplateSize={drawingTemplateSize}
                  drawingTemplateEffect={drawingTemplateEffect}
                  drawingTemplateWidth={drawingTemplateWidth}
                  activeDrawingTool={activeDrawingTool}
                  drawingThicknessCustomOpen={drawingThicknessCustomOpen}
                  drawingOpacityCustomOpen={drawingOpacityCustomOpen}
                  showFillSettings={activeDrawingTool !== "freehand" && activeDrawingTool !== "line"}
                  templateToolActive={false}
                  onDrawingColorChange={onDrawingColorChange}
                  onDrawingOpacityChange={onDrawingOpacityChange}
                  onDrawingFillColorChange={onDrawingFillColorChange}
                  onDrawingFillOpacityChange={onDrawingFillOpacityChange}
                  onDrawingStrokeStyleChange={onDrawingStrokeStyleChange}
                  onDrawingStrokeWidthChange={onDrawingStrokeWidthChange}
                  onDrawingTemplateSizeChange={onDrawingTemplateSizeChange}
                  onDrawingTemplateEffectChange={onDrawingTemplateEffectChange}
                  onDrawingTemplateWidthChange={onDrawingTemplateWidthChange}
                  onDrawingThicknessCustomOpenChange={setDrawingThicknessCustomOpen}
                  onDrawingOpacityCustomOpenChange={setDrawingOpacityCustomOpen}
                />
              )}
              {helpTopic === "drawing" && <ToolHelpCard topic="drawing" />}
            </div>
          )}
          {activeCategory === "templates" && (
            <div className="tools-panel-section">
              <HelpButton active={helpTopic === "templates"} label="Template tools help" onClick={() => setHelpTopic((topic) => (topic === "templates" ? null : "templates"))} />
              <div className="tools-button-row">
                <ToolButton active={activeDrawingTool === "template-line"} label="Line Template" onClick={() => setDrawingTool("template-line")}>
                  <Minus size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "template-circle"} label="Radius Template" onClick={() => setDrawingTool("template-circle")}>
                  <Circle size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeDrawingTool === "template-rectangle"} label="Cube Template" onClick={() => setDrawingTool("template-rectangle")}>
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
              <SettingsToggle open={templateSettingsOpen} label="Settings" onToggle={() => setTemplateSettingsOpen((open) => !open)} />
              {templateSettingsOpen && (
                <DrawingSettings
                  drawingColor={drawingColor}
                  drawingOpacity={drawingOpacity}
                  drawingFillColor={drawingFillColor}
                  drawingFillOpacity={drawingFillOpacity}
                  drawingStrokeStyle={drawingStrokeStyle}
                  drawingStrokeWidth={drawingStrokeWidth}
                  drawingTemplateSize={drawingTemplateSize}
                  drawingTemplateEffect={drawingTemplateEffect}
                  drawingTemplateWidth={drawingTemplateWidth}
                  templatePreviewVisibleInPlayer={templatePreviewVisibleInPlayer}
                  activeDrawingTool={activeDrawingTool}
                  drawingThicknessCustomOpen={drawingThicknessCustomOpen}
                  drawingOpacityCustomOpen={drawingOpacityCustomOpen}
                  showFillSettings={false}
                  templateToolActive
                  onDrawingColorChange={onDrawingColorChange}
                  onDrawingOpacityChange={onDrawingOpacityChange}
                  onDrawingFillColorChange={onDrawingFillColorChange}
                  onDrawingFillOpacityChange={onDrawingFillOpacityChange}
                  onDrawingStrokeStyleChange={onDrawingStrokeStyleChange}
                  onDrawingStrokeWidthChange={onDrawingStrokeWidthChange}
                  onDrawingTemplateSizeChange={onDrawingTemplateSizeChange}
                  onDrawingTemplateEffectChange={onDrawingTemplateEffectChange}
                  onDrawingTemplateWidthChange={onDrawingTemplateWidthChange}
                  onTemplatePreviewVisibleInPlayerChange={onTemplatePreviewVisibleInPlayerChange}
                  onDrawingThicknessCustomOpenChange={setDrawingThicknessCustomOpen}
                  onDrawingOpacityCustomOpenChange={setDrawingOpacityCustomOpen}
                />
              )}
              {helpTopic === "templates" && <ToolHelpCard topic="templates" />}
            </div>
          )}
          {activeCategory === "text" && <Placeholder message="Text tools will be added here." />}
          {activeCategory === "table" && (
            <div className="tools-panel-section">
              <HelpButton active={helpTopic === "table"} label="Table tools help" onClick={() => setHelpTopic((topic) => (topic === "table" ? null : "table"))} />
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
              <SettingsToggle open={tableSettingsOpen} label="Settings" onToggle={() => setTableSettingsOpen((open) => !open)} />
              {tableSettingsOpen && (
                <>
                  <div className="tools-section-label">Visibility</div>
                  <div className="tools-operation-stack">
                    <label className="fog-operation-switch tools-operation-switch" title="Show or hide table tool output">
                      <span>Show</span>
                      <input
                        type="checkbox"
                        checked={!tableToolsVisibleInPlayer}
                        onChange={(event) => onTableToolsVisibleInPlayerChange(!event.target.checked)}
                      />
                      <span>Hide</span>
                    </label>
                  </div>
                  {activeCanvasTool === "ruler" && (
                    <>
                      <div className="tools-section-label">Ruler Release</div>
                      <div className="tools-operation-stack">
                        <label className="fog-operation-switch tools-operation-switch" title="Keep or clear the ruler after releasing the mouse">
                          <span>Linger</span>
                          <input
                            type="checkbox"
                            checked={!rulerLinger}
                            onChange={(event) => onRulerLingerChange(!event.target.checked)}
                          />
                          <span>No Linger</span>
                        </label>
                      </div>
                    </>
                  )}
                </>
              )}
              {tableSettingsOpen && activeCanvasTool === "ping" && (
                <div className="tools-section-tools">
                  <div className="tools-ping-settings-panel">
                    <label className="tools-strip-field tools-strip-color-field">
                      <span>Color</span>
                      <ColorInput className="tools-ping-color" value={pingColor} aria-label="Ping color" title="Ping color" onChange={onPingColorChange} />
                    </label>
                    <div className="tools-strip-select-field">
                      <strong>Size</strong>
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
                    {(pingSizeCustomOpen || !hasPresetValue(PING_SIZE_PRESETS, pingSize)) && (
                      <div className="tools-strip-advanced-slider tools-table-slider">
                        <input aria-label="Fine tune sonar size" title="Fine tune sonar size" type="range" min={0.5} max={3} step={0.1} value={pingSize} onChange={(event) => onPingSizeChange(Number(event.target.value))} />
                        <span>{Math.round(pingSize * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {tableSettingsOpen && activeCanvasTool === "laser" && (
                <div className="tools-section-tools">
                  <div className="tools-ping-settings-panel">
                    <label className="tools-strip-field tools-strip-color-field">
                      <span>Color</span>
                      <ColorInput className="tools-ping-color" value={laserColor} aria-label="Laser color" title="Laser color" onChange={onLaserColorChange} />
                    </label>
                    <div className="tools-strip-select-field">
                      <strong>Thickness</strong>
                      <div>
                        <select
                          aria-label="Laser thickness"
                          title="Laser thickness"
                          value={getPresetSelectValue(LASER_THICKNESS_PRESETS, laserThickness, laserThicknessCustomOpen)}
                          onChange={(event) => {
                            if (event.target.value === "custom") {
                              setLaserThicknessCustomOpen(true);
                              return;
                            }
                            setLaserThicknessCustomOpen(false);
                            onLaserThicknessChange(Number(event.target.value));
                          }}
                        >
                          {LASER_THICKNESS_PRESETS.map((preset) => (
                            <option key={preset.label} value={preset.value}>{preset.label}</option>
                          ))}
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>
                    {(laserThicknessCustomOpen || !hasPresetValue(LASER_THICKNESS_PRESETS, laserThickness)) && (
                      <div className="tools-strip-advanced-slider tools-table-slider">
                        <input aria-label="Fine tune laser thickness" title="Fine tune laser thickness" type="range" min={4} max={80} step={2} value={laserThickness} onChange={(event) => onLaserThicknessChange(Number(event.target.value))} />
                        <span>{laserThickness}px</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {helpTopic === "table" && <ToolHelpCard topic="table" />}
            </div>
          )}
          {activeCategory === "pin" && <Placeholder message="Pin tools will be added here." />}
          {activeCategory === "fog" && (
            <div className="tools-panel-section">
              <HelpButton active={helpTopic === "fog"} label="Fog Of War Tools Help" onClick={() => setHelpTopic((topic) => (topic === "fog" ? null : "fog"))} />
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
              <div className="tools-operation-stack">
                <SettingsToggle open={maskSettingsOpen} label="Settings" onToggle={() => setMaskSettingsOpen((open) => !open)} />
                {maskSettingsOpen && (
                  <>
                    <div className="tools-section-label">Visibility</div>
                    <label className="fog-operation-switch tools-operation-switch" title="Reveal or hide fog">
                      <span>Reveal</span>
                      <input type="checkbox" checked={fogOperation === "hide"} onChange={(event) => setFogToolOperation(event.target.checked ? "hide" : "reveal")} />
                      <span>Hide</span>
                    </label>
                  </>
                )}
              </div>
              {maskSettingsOpen && activeFogShape === "brush" && (
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
              {helpTopic === "fog" && <ToolHelpCard topic="fog" />}
            </div>
          )}
          {activeCategory === "effects" && (
            <div className="tools-panel-section">
              <HelpButton active={helpTopic === "effects"} label="Effects Tools Help" onClick={() => setHelpTopic((topic) => (topic === "effects" ? null : "effects"))} />
              <div className="tools-section-label">Weather Effect Masks</div>
              {!weatherToolsEnabled && <span className="tools-section-note">Enable a weather effect to use weather effect masks.</span>}
              <div className="tools-button-row">
                <ToolButton active={activeWeatherMaskTool === "rectangle"} label="Rectangle Weather Effect Mask" disabled={!weatherToolsEnabled} onClick={() => setWeatherMaskTool("rectangle")}>
                  <Square size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeWeatherMaskTool === "circle"} label="Circle Weather Effect Mask" disabled={!weatherToolsEnabled} onClick={() => setWeatherMaskTool("circle")}>
                  <Circle size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeWeatherMaskTool === "polygon"} label="Polygon Weather Effect Mask" disabled={!weatherToolsEnabled} onClick={() => setWeatherMaskTool("polygon")}>
                  <Pentagon size={17} aria-hidden="true" />
                </ToolButton>
                <span className="tools-vertical-divider" aria-hidden="true" />
                <ToolButton label="Undo Last Weather Effect Mask" disabled={!weatherToolsEnabled || weatherMaskCount === 0} onClick={onUndoWeatherMask}>
                  <Undo2 size={17} aria-hidden="true" />
                </ToolButton>
              </div>
              <div className="tools-section-divider" />
              <div className="tools-section-label">Environmental Effects</div>
              <div className="tools-strip-select-field">
                <strong>Effect</strong>
                <div>
                  <select
                    aria-label="Environmental effect type"
                    title="Environmental effect type"
                    value={environmentEffectType}
                    onChange={(event) => onEnvironmentEffectTypeChange(event.target.value as EnvironmentEffectType)}
                  >
                    <option value="water">Water</option>
                    <option value="lava">Lava</option>
                    <option value="smoke">Smoke</option>
                  </select>
                </div>
              </div>
              {environmentEffectType === "water" && (
                <div className="tools-strip-select-field">
                  <strong>Preset</strong>
                  <div>
                    <select
                      aria-label="Water effect preset"
                      title="Water effect preset"
                      value={getWaterPresetSelectValue(waterEffectTuning)}
                      onChange={(event) => {
                        const preset = WATER_EFFECT_PRESETS[event.target.value as keyof typeof WATER_EFFECT_PRESETS];
                        if (preset) {
                          onWaterEffectTuningChange({ ...preset });
                        }
                      }}
                    >
                      <option value="custom">Custom</option>
                      <option value="stream">Stream</option>
                      <option value="river">River</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="tools-button-row">
                <ToolButton active={activeEnvironmentEffectTool === "circle"} label="Radius Environmental Effect" onClick={() => setEnvironmentEffectTool("circle")}>
                  <Circle size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeEnvironmentEffectTool === "rectangle"} label="Rectangle Environmental Effect" onClick={() => setEnvironmentEffectTool("rectangle")}>
                  <Square size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeEnvironmentEffectTool === "polygon"} label="Polygon Environmental Effect" onClick={() => setEnvironmentEffectTool("polygon")}>
                  <Pentagon size={17} aria-hidden="true" />
                </ToolButton>
                <span className="tools-vertical-divider" aria-hidden="true" />
                <ToolButton label="Undo Last Environmental Effect" disabled={environmentEffectCount === 0} onClick={onUndoEnvironmentEffect}>
                  <Undo2 size={17} aria-hidden="true" />
                </ToolButton>
              </div>
              {environmentEffectType === "water" && (
                <>
                  <div className="tools-section-divider" />
                  <WaterEffectTuningPanel
                    tuning={waterEffectTuning}
                    onChange={onWaterEffectTuningChange}
                    onReset={onWaterEffectTuningReset}
                  />
                </>
              )}
              {helpTopic === "effects" && <ToolHelpCard topic="effects" />}
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

export function WaterEffectTuningPanel({
  tuning,
  title = "Advanced Effects Settings",
  defaultOpen = false,
  onChange,
  onReset
}: {
  tuning: WaterEffectTuning;
  title?: string;
  defaultOpen?: boolean;
  onChange: (tuning: WaterEffectTuning) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const update = (patch: Partial<WaterEffectTuning>) => onChange({ ...tuning, ...patch });
  const readout = JSON.stringify(tuning);

  return (
    <div className="water-tuning-panel" aria-label="Water effect tuning">
      <div className="tools-section-label-row">
        <SettingsToggle open={open} label={title} onToggle={() => setOpen((current) => !current)} />
        {open && (
          <button className="icon-button no-chrome" type="button" title="Reset water tuning" aria-label="Reset water tuning" onClick={onReset}>
            <Undo2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="water-tuning-sliders">
            <WaterTuningSlider label="Opacity" value={tuning.opacity} min={0} max={1} step={0.01} onChange={(opacity) => update({ opacity })} />
            <WaterTuningSlider label="Band Scale" value={tuning.bandScale} min={0.5} max={20} step={0.1} onChange={(bandScale) => update({ bandScale })} />
            <WaterTuningSlider label="Band Width" value={tuning.bandWidth} min={0.01} max={0.49} step={0.01} onChange={(bandWidth) => update({ bandWidth })} />
            <WaterTuningSlider label="Speed" value={tuning.speed} min={0} max={2} step={0.01} onChange={(speed) => update({ speed })} />
            <WaterTuningSlider label="Direction" value={tuning.directionDegrees} min={0} max={360} step={1} suffix="deg" onChange={(directionDegrees) => update({ directionDegrees })} />
            <WaterTuningSlider label="Distortion" value={tuning.distortion} min={0} max={2} step={0.01} onChange={(distortion) => update({ distortion })} />
            <WaterTuningSlider label="Vertical Distortion" value={tuning.verticalDistortion} min={0} max={2} step={0.01} onChange={(verticalDistortion) => update({ verticalDistortion })} />
            <WaterTuningSlider label="Distortion Variation" value={tuning.distortionVariation} min={0} max={2} step={0.01} onChange={(distortionVariation) => update({ distortionVariation })} />
            <WaterTuningSlider label="Band Breakup" value={tuning.bandBreakup} min={0} max={1} step={0.01} onChange={(bandBreakup) => update({ bandBreakup })} />
            <WaterTuningSlider label="Band Variation" value={tuning.bandVariation} min={0} max={4} step={0.01} onChange={(bandVariation) => update({ bandVariation })} />
            <WaterTuningSlider label="Band Overlap" value={tuning.bandOverlap} min={0} max={1} step={0.01} onChange={(bandOverlap) => update({ bandOverlap })} />
            <WaterTuningSlider label="Pan Follow" value={tuning.panFollow} min={0} max={1} step={0.05} onChange={(panFollow) => update({ panFollow })} />
            <WaterTuningSlider label="Zoom Scale" value={tuning.zoomScale} min={-3} max={3} step={0.05} onChange={(zoomScale) => update({ zoomScale })} />
            <WaterTuningSlider label="Base Alpha" value={tuning.baseAlpha} min={0} max={1} step={0.01} onChange={(baseAlpha) => update({ baseAlpha })} />
            <WaterTuningSlider label="Highlight Alpha" value={tuning.highlightAlpha} min={0} max={1} step={0.01} onChange={(highlightAlpha) => update({ highlightAlpha })} />
          </div>
          <div className="water-tuning-colors">
            <WaterTuningColor label="Deep" value={tuning.deepColor} onChange={(deepColor) => update({ deepColor })} />
            <WaterTuningColor label="Water" value={tuning.waterColor} onChange={(waterColor) => update({ waterColor })} />
            <WaterTuningColor label="Highlight" value={tuning.highlightColor} onChange={(highlightColor) => update({ highlightColor })} />
          </div>
          <div className="water-tuning-readout-row">
            <div className="water-tuning-readout" title={readout}>{readout}</div>
            <button className="icon-button no-chrome" type="button" title="Copy water tuning JSON" aria-label="Copy water tuning JSON" onClick={() => void navigator.clipboard?.writeText(readout)}>
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function WaterTuningSlider({ label, value, min, max, step, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="water-tuning-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <strong>{formatTuningNumber(value)}{suffix}</strong>
    </label>
  );
}

function WaterTuningColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="water-tuning-color">
      <span>{label}</span>
      <ColorInput value={value} onChange={onChange} aria-label={`${label} water color`} />
    </label>
  );
}

function formatTuningNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function getWaterPresetSelectValue(tuning: WaterEffectTuning): keyof typeof WATER_EFFECT_PRESETS | "custom" {
  for (const [presetName, preset] of Object.entries(WATER_EFFECT_PRESETS)) {
    if (isWaterTuningMatch(tuning, preset)) {
      return presetName as keyof typeof WATER_EFFECT_PRESETS;
    }
  }
  return "custom";
}

function isWaterTuningMatch(tuning: WaterEffectTuning, preset: WaterEffectTuning): boolean {
  return (
    tuning.opacity === preset.opacity &&
    tuning.bandScale === preset.bandScale &&
    tuning.bandWidth === preset.bandWidth &&
    tuning.speed === preset.speed &&
    tuning.directionDegrees === preset.directionDegrees &&
    tuning.distortion === preset.distortion &&
    tuning.verticalDistortion === preset.verticalDistortion &&
    tuning.distortionVariation === preset.distortionVariation &&
    tuning.bandBreakup === preset.bandBreakup &&
    tuning.bandVariation === preset.bandVariation &&
    tuning.bandOverlap === preset.bandOverlap &&
    tuning.panFollow === preset.panFollow &&
    tuning.zoomScale === preset.zoomScale &&
    tuning.baseAlpha === preset.baseAlpha &&
    tuning.highlightAlpha === preset.highlightAlpha &&
    tuning.deepColor === preset.deepColor &&
    tuning.waterColor === preset.waterColor &&
    tuning.highlightColor === preset.highlightColor
  );
}

function SettingsToggle({ open, label, onToggle }: { open: boolean; label: string; onToggle: () => void }) {
  return (
    <button className="tools-settings-toggle" type="button" aria-expanded={open} onClick={onToggle}>
      {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
      <strong>{label}</strong>
    </button>
  );
}

function SelectorFilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="tools-selector-filter">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function SelectorSelectionSummary({ counts }: { counts: SelectorSelectionCounts }) {
  const total = counts.tokens + counts.templates + counts.fogMasks + counts.weatherMasks + counts.drawings;
  return (
    <div className="tools-selector-summary" aria-live="polite">
      <strong>Selected</strong>
      <span>{total > 0 ? formatSelectorSelectionSummary(counts) : "None"}</span>
    </div>
  );
}

function SelectorSelectionActions({
  counts,
  onShowSelectedOnPlayerView,
  onHideSelectedOnPlayerView,
  onDeleteSelected,
  onClearSelection
}: {
  counts: SelectorSelectionCounts;
  onShowSelectedOnPlayerView: () => void;
  onHideSelectedOnPlayerView: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}) {
  const total = counts.tokens + counts.templates + counts.fogMasks + counts.weatherMasks + counts.drawings;
  const disabled = total === 0;
  return (
    <div className="tools-selector-actions" aria-label="Selected item actions">
      <button type="button" className="tools-selector-action" title="Show selected on Player View" aria-label="Show selected on Player View" disabled={disabled} onClick={onShowSelectedOnPlayerView}>
        <Eye size={15} aria-hidden="true" />
      </button>
      <button type="button" className="tools-selector-action" title="Hide selected from Player View" aria-label="Hide selected from Player View" disabled={disabled} onClick={onHideSelectedOnPlayerView}>
        <EyeOff size={15} aria-hidden="true" />
      </button>
      <button type="button" className="tools-selector-action" title="Delete selected" aria-label="Delete selected" disabled={disabled} onClick={onDeleteSelected}>
        <Trash2 size={15} aria-hidden="true" />
      </button>
      <button type="button" className="tools-selector-action" title="Clear selection" aria-label="Clear selection" disabled={disabled} onClick={onClearSelection}>
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function formatSelectorSelectionSummary(counts: SelectorSelectionCounts): string {
  return [
    formatSelectorSelectionPart(counts.tokens, "Token"),
    formatSelectorSelectionPart(counts.templates, "Template"),
    formatSelectorSelectionPart(counts.drawings, "Drawing"),
    formatSelectorSelectionPart(counts.fogMasks, "Fog Mask"),
    formatSelectorSelectionPart(counts.weatherMasks, "Weather Effect Mask")
  ]
    .filter(Boolean)
    .join(", ");
}

function formatSelectorSelectionPart(count: number, label: string): string | null {
  if (count <= 0) {
    return null;
  }
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function DrawingSettings({
  drawingColor,
  drawingOpacity,
  drawingFillColor,
  drawingFillOpacity,
  drawingStrokeStyle,
  drawingStrokeWidth,
  drawingTemplateSize,
  drawingTemplateEffect,
  drawingTemplateWidth,
  templatePreviewVisibleInPlayer = false,
  activeDrawingTool,
  drawingThicknessCustomOpen,
  drawingOpacityCustomOpen,
  showFillSettings,
  templateToolActive,
  onDrawingColorChange,
  onDrawingOpacityChange,
  onDrawingFillColorChange,
  onDrawingFillOpacityChange,
  onDrawingStrokeStyleChange,
  onDrawingStrokeWidthChange,
  onDrawingTemplateSizeChange,
  onDrawingTemplateEffectChange,
  onDrawingTemplateWidthChange,
  onTemplatePreviewVisibleInPlayerChange,
  onDrawingThicknessCustomOpenChange,
  onDrawingOpacityCustomOpenChange
}: {
  drawingColor: string;
  drawingOpacity: number;
  drawingFillColor: string;
  drawingFillOpacity: number;
  drawingStrokeStyle: DrawingStrokeStyle;
  drawingStrokeWidth: number;
  drawingTemplateSize: DrawingTemplateSize;
  drawingTemplateEffect: DrawingTemplateEffect;
  drawingTemplateWidth: DrawingTemplateWidth;
  templatePreviewVisibleInPlayer?: boolean;
  activeDrawingTool: DrawingTool | null;
  drawingThicknessCustomOpen: boolean;
  drawingOpacityCustomOpen: boolean;
  showFillSettings: boolean;
  templateToolActive: boolean;
  onDrawingColorChange: (color: string) => void;
  onDrawingOpacityChange: (opacity: number) => void;
  onDrawingFillColorChange: (color: string) => void;
  onDrawingFillOpacityChange: (opacity: number) => void;
  onDrawingStrokeStyleChange: (strokeStyle: DrawingStrokeStyle) => void;
  onDrawingStrokeWidthChange: (strokeWidth: number) => void;
  onDrawingTemplateSizeChange: (size: DrawingTemplateSize) => void;
  onDrawingTemplateEffectChange: (effect: DrawingTemplateEffect) => void;
  onDrawingTemplateWidthChange: (width: DrawingTemplateWidth) => void;
  onTemplatePreviewVisibleInPlayerChange?: (visible: boolean) => void;
  onDrawingThicknessCustomOpenChange: (open: boolean) => void;
  onDrawingOpacityCustomOpenChange: (open: boolean) => void;
}) {
  const strokeColorDisabled = templateToolActive && drawingTemplateEffect !== "plain";
  const thicknessPresets = templateToolActive ? TEMPLATE_THICKNESS_PRESETS : DRAWING_THICKNESS_PRESETS;
  const thicknessInputLabel = templateToolActive ? "Template thickness" : "Drawing thickness";
  const thicknessMin = templateToolActive ? 4 : 8;
  return (
    <div className={templateToolActive ? "tools-drawing-settings tools-drawing-settings-template" : "tools-drawing-settings"}>
      {templateToolActive && (
        <div className="tools-drawing-settings-row tools-template-effect-row">
          <div className="tools-drawing-row-label">Effect</div>
          <div className="tools-strip-select-field tools-strip-template-effect-control">
            <strong>Visual</strong>
            <div>
              <select aria-label="Template visual effect" title="Template visual effect" value={drawingTemplateEffect} onChange={(event) => onDrawingTemplateEffectChange(event.target.value as DrawingTemplateEffect)}>
                {TEMPLATE_EFFECT_OPTIONS.map((effect) => (
                  <option key={effect.value} value={effect.value}>{effect.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      <div className="tools-drawing-settings-row tools-drawing-stroke-row">
        <div className="tools-drawing-row-label">Stroke</div>
        <label className={strokeColorDisabled ? "tools-strip-field tools-strip-color-field tools-field-disabled" : "tools-strip-field tools-strip-color-field"}>
          <span>Color</span>
          <ColorInput className="tools-drawing-color" value={drawingColor} aria-label="Stroke color" title={strokeColorDisabled ? "Stroke color is controlled by the selected effect" : "Stroke color"} disabled={strokeColorDisabled} onChange={onDrawingColorChange} />
        </label>
        <div className="tools-strip-select-field tools-strip-thickness-control">
          <strong>Thickness</strong>
          <div>
            <select
              aria-label={thicknessInputLabel}
              title={thicknessInputLabel}
              value={getPresetSelectValue(thicknessPresets, drawingStrokeWidth, drawingThicknessCustomOpen)}
              onChange={(event) => {
                if (event.target.value === "custom") {
                  onDrawingThicknessCustomOpenChange(true);
                  return;
                }
                onDrawingThicknessCustomOpenChange(false);
                onDrawingStrokeWidthChange(Number(event.target.value));
              }}
            >
              {thicknessPresets.map((preset) => (
                <option key={preset.label} value={preset.value}>{preset.label}</option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        {!templateToolActive && (
          <div className="tools-strip-select-field tools-strip-style-control">
            <strong>Type</strong>
            <div>
              <select aria-label="Drawing stroke type" title="Drawing stroke type" value={drawingStrokeStyle} onChange={(event) => onDrawingStrokeStyleChange(event.target.value as DrawingStrokeStyle)}>
                {DRAWING_STROKE_STYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
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
      </div>
      {showFillSettings && (
        <div className="tools-drawing-settings-row tools-drawing-fill-row">
          <div className="tools-drawing-row-label">Fill</div>
          <label className="tools-strip-field tools-strip-color-field">
            <span>Color</span>
            <ColorInput className="tools-drawing-color" value={drawingFillColor} aria-label="Fill color" title="Fill color" onChange={onDrawingFillColorChange} />
          </label>
          <div className="tools-strip-select-field tools-strip-fill-opacity-control">
            <strong>Opacity</strong>
            <div>
              <select
                aria-label="Drawing fill opacity"
                title="Drawing fill opacity"
                value={drawingFillOpacity === 0 ? "0" : getPresetSelectValue(DRAWING_OPACITY_PRESETS, drawingFillOpacity, false)}
                onChange={(event) => onDrawingFillOpacityChange(Number(event.target.value))}
              >
                <option value={0}>None</option>
                {DRAWING_OPACITY_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {templateToolActive && (
        <div className="tools-drawing-settings-row tools-template-size-row">
          <div className="tools-drawing-row-label">Size</div>
          <div className="tools-strip-select-field tools-strip-template-size-control">
            <strong>Length/Radius</strong>
            <div>
              <select
                aria-label="Template length or radius"
                title="Template length or radius"
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
          {activeDrawingTool === "template-line" && (
            <div className="tools-strip-select-field tools-strip-template-width-control">
              <strong>Width</strong>
              <div>
                <select aria-label="Template line width" title="Template line width" value={drawingTemplateWidth} onChange={(event) => onDrawingTemplateWidthChange(Number(event.target.value) as DrawingTemplateWidth)}>
                  {TEMPLATE_WIDTH_PRESETS.map((width) => (
                    <option key={width.value} value={width.value}>{width.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
      {templateToolActive && onTemplatePreviewVisibleInPlayerChange && (
        <div className="tools-drawing-settings-row tools-template-player-preview-row">
          <div className="tools-drawing-row-label">Player</div>
          <SelectorFilterCheckbox label="Live Preview" checked={templatePreviewVisibleInPlayer} onChange={onTemplatePreviewVisibleInPlayerChange} />
        </div>
      )}
      {(drawingThicknessCustomOpen || !hasPresetValue(thicknessPresets, drawingStrokeWidth)) && (
        <div className="tools-strip-advanced-slider tools-strip-thickness-slider">
          <input aria-label={`Fine tune ${templateToolActive ? "template" : "drawing"} thickness`} title={`Fine tune ${templateToolActive ? "template" : "drawing"} thickness`} type="range" min={thicknessMin} max={400} step={4} value={drawingStrokeWidth} onChange={(event) => onDrawingStrokeWidthChange(Number(event.target.value))} />
          <span aria-label={`${thicknessInputLabel} ${drawingStrokeWidth} pixels`}>{drawingStrokeWidth}px</span>
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

function ToolHelpCard({ topic }: { topic: "drawing" | "templates" | "fog" | "effects" | "table" }) {
  if (topic === "drawing") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Drawing tools help">
        <strong>Drawing Tools</strong>
        <ul>
          {getDrawingHelpLines().map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    );
  }

  if (topic === "templates") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Template tools help">
        <strong>Template Tools</strong>
        <ul>
          {getTemplateHelpLines().map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    );
  }

  if (topic === "fog") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Fog of War tools help">
        <strong>Fog Of War Tools</strong>
        <ul>
          {getFogHelpLines().map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    );
  }

  if (topic === "effects") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Effects tools help">
        <strong>Effects Tools</strong>
        <ul>
          {getWeatherHelpLines().map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    );
  }

  return (
    <div className="tools-help-card" role="dialog" aria-label="Table tools help">
      <strong>Table Tools</strong>
      <ul>
        {getTableHelpLines().map((line) => <li key={line}>{line}</li>)}
      </ul>
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
