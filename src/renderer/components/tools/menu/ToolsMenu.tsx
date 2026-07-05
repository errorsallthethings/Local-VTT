import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Hand,
  HelpCircle,
  LineSquiggle,
  Minus,
  Paintbrush,
  Pentagon,
  Ruler,
  Square,
  SquareDashedMousePointer,
  Target,
  Triangle,
  Trash2,
  Undo2,
} from "lucide-react";
import type { DrawingTool } from "../../../canvas/drawings";
import type { DrawingStrokeStyle, DrawingTemplateEffect, EnvironmentEffectType } from "../../../../shared/localvtt";
import type { FogTool } from "../../../canvas/fog";
import { DrawingSettings, type DrawingTemplateSize, type DrawingTemplateWidth } from "../settings/DrawingToolSettings";
import { AcidEffectTuningPanel, ArcaneEffectTuningPanel, ChaosEffectTuningPanel, ColdEffectTuningPanel, DarknessEffectTuningPanel, DistortionEffectTuningPanel, FireEffectTuningPanel, FogEffectTuningPanel, ForceFieldEffectTuningPanel, LavaEffectTuningPanel, LightningEffectTuningPanel, NatureEffectTuningPanel, PoisonEffectTuningPanel, RadiantEffectTuningPanel, ShockwaveEffectTuningPanel, SmokeEffectTuningPanel, VoidEffectTuningPanel, WaterEffectTuningPanel } from "../effects/EnvironmentEffectTuningPanels";
import { FogBrushSettings } from "../settings/FogBrushSettings";
import { SelectorFilterCheckbox, SelectorSelectionActions, SelectorSelectionSummary, type SelectorSelectionCounts, type SelectorSelectionFilters } from "../settings/SelectorToolControls";
import { TableToolSettings } from "../settings/TableToolSettings";
import { ToolHelpCard, type ToolHelpTopic } from "../settings/ToolHelpCard";
import type { AcidEffectTuning, ArcaneEffectTuning, ChaosEffectTuning, ColdEffectTuning, DarknessEffectTuning, DistortionEffectTuning, FireEffectTuning, FogEffectTuning, ForceFieldEffectTuning, LavaEffectTuning, LightningEffectTuning, NatureEffectTuning, PoisonEffectTuning, RadiantEffectTuning, ShockwaveEffectTuning, SmokeEffectTuning, VoidEffectTuning, WaterEffectTuning } from "../../../canvas/effects";
import {
  ENVIRONMENT_EFFECT_FEATHER_OPTIONS,
  ENVIRONMENT_EFFECT_OPTIONS,
  formatEnvironmentEffectOptionLabel,
  getEnvironmentEffectFeatherSelectValue,
  getEnvironmentEffectPresetOptions
} from "../../../lib/effects";
import {
  applySelectedEnvironmentEffectPreset,
  resetSelectedEnvironmentEffectTuning,
  type EnvironmentEffectPresetChangeHandlers,
  type EnvironmentEffectResetHandlers
} from "./environmentEffectMenuActions";
import { ToolsMenuCategoryRail } from "./ToolsMenuCategoryRail";
import { getToolCategoryLabel, type ToolCategory } from "./toolCategoryLabels";
import {
  getActiveFogShape,
  getActiveToolCategory,
  getCategoryOpenPlan,
  getDrawingToolSelectionPlan,
  getEnvironmentEffectToolSelectionPlan,
  getFogToolForOperation,
  getFogToolSelectionPlan,
  getMouseCategoryTogglePlan,
  getTableToolSelectionPlan,
  getToolButtonClassName,
  getWeatherMaskToolSelectionPlan,
  isToolCategoryActive,
  type CanvasTool,
  type EnvironmentEffectTool,
  type FogOperation,
  type FogToolShape,
  type MouseBehavior,
  type WeatherMaskTool
} from "./toolMenuState";

export type { DrawingTemplateSize, DrawingTemplateWidth } from "../settings/DrawingToolSettings";
export type { SelectorSelectionCounts, SelectorSelectionFilters } from "../settings/SelectorToolControls";
export type { CanvasTool, EnvironmentEffectTool, FogOperation, MouseBehavior, WeatherMaskTool } from "./toolMenuState";

const DEFAULT_ENVIRONMENT_EFFECT_TYPE = ENVIRONMENT_EFFECT_OPTIONS[0]?.value ?? "arcane";

interface ToolsMenuProps {
  activeCanvasTool: CanvasTool | null;
  activeFogTool: FogTool | null;
  activeWeatherMaskTool: WeatherMaskTool | null;
  activeEnvironmentEffectTool: EnvironmentEffectTool | null;
  activeDrawingTool: DrawingTool | null;
  environmentEffectType: EnvironmentEffectType;
  environmentEffectFeather: number;
  acidEffectTuning: AcidEffectTuning;
  coldEffectTuning: ColdEffectTuning;
  darknessEffectTuning: DarknessEffectTuning;
  poisonEffectTuning: PoisonEffectTuning;
  waterEffectTuning: WaterEffectTuning;
  lavaEffectTuning: LavaEffectTuning;
  fireEffectTuning: FireEffectTuning;
  lightningEffectTuning: LightningEffectTuning;
  arcaneEffectTuning: ArcaneEffectTuning;
  chaosEffectTuning: ChaosEffectTuning;
  voidEffectTuning: VoidEffectTuning;
  natureEffectTuning: NatureEffectTuning;
  distortionEffectTuning: DistortionEffectTuning;
  radiantEffectTuning: RadiantEffectTuning;
  forceFieldEffectTuning: ForceFieldEffectTuning;
  shockwaveEffectTuning: ShockwaveEffectTuning;
  smokeEffectTuning: SmokeEffectTuning;
  fogEffectTuning: FogEffectTuning;
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
  onEnvironmentEffectFeatherChange: (feather: number) => void;
  onAcidEffectTuningChange: (tuning: AcidEffectTuning) => void;
  onAcidEffectTuningReset: () => void;
  onColdEffectTuningChange: (tuning: ColdEffectTuning) => void;
  onColdEffectTuningReset: () => void;
  onDarknessEffectTuningChange: (tuning: DarknessEffectTuning) => void;
  onDarknessEffectTuningReset: () => void;
  onPoisonEffectTuningChange: (tuning: PoisonEffectTuning) => void;
  onPoisonEffectTuningReset: () => void;
  onWaterEffectTuningChange: (tuning: WaterEffectTuning) => void;
  onWaterEffectTuningReset: () => void;
  onLavaEffectTuningChange: (tuning: LavaEffectTuning) => void;
  onLavaEffectTuningReset: () => void;
  onFireEffectTuningChange: (tuning: FireEffectTuning) => void;
  onFireEffectTuningReset: () => void;
  onLightningEffectTuningChange: (tuning: LightningEffectTuning) => void;
  onLightningEffectTuningReset: () => void;
  onArcaneEffectTuningChange: (tuning: ArcaneEffectTuning) => void;
  onArcaneEffectTuningReset: () => void;
  onChaosEffectTuningChange: (tuning: ChaosEffectTuning) => void;
  onChaosEffectTuningReset: () => void;
  onVoidEffectTuningChange: (tuning: VoidEffectTuning) => void;
  onVoidEffectTuningReset: () => void;
  onNatureEffectTuningChange: (tuning: NatureEffectTuning) => void;
  onNatureEffectTuningReset: () => void;
  onDistortionEffectTuningChange: (tuning: DistortionEffectTuning) => void;
  onDistortionEffectTuningReset: () => void;
  onRadiantEffectTuningChange: (tuning: RadiantEffectTuning) => void;
  onRadiantEffectTuningReset: () => void;
  onForceFieldEffectTuningChange: (tuning: ForceFieldEffectTuning) => void;
  onForceFieldEffectTuningReset: () => void;
  onShockwaveEffectTuningChange: (tuning: ShockwaveEffectTuning) => void;
  onShockwaveEffectTuningReset: () => void;
  onSmokeEffectTuningChange: (tuning: SmokeEffectTuning) => void;
  onSmokeEffectTuningReset: () => void;
  onFogEffectTuningChange: (tuning: FogEffectTuning) => void;
  onFogEffectTuningReset: () => void;
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

export function ToolsMenu({
  activeCanvasTool,
  activeFogTool,
  activeWeatherMaskTool,
  activeEnvironmentEffectTool,
  activeDrawingTool,
  environmentEffectType,
  environmentEffectFeather,
  acidEffectTuning,
  coldEffectTuning,
  darknessEffectTuning,
  poisonEffectTuning,
  waterEffectTuning,
  lavaEffectTuning,
  fireEffectTuning,
  lightningEffectTuning,
  arcaneEffectTuning,
  chaosEffectTuning,
  voidEffectTuning,
  natureEffectTuning,
  distortionEffectTuning,
  radiantEffectTuning,
  forceFieldEffectTuning,
  shockwaveEffectTuning,
  smokeEffectTuning,
  fogEffectTuning,
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
  onEnvironmentEffectFeatherChange,
  onAcidEffectTuningChange,
  onAcidEffectTuningReset,
  onColdEffectTuningChange,
  onColdEffectTuningReset,
  onDarknessEffectTuningChange,
  onDarknessEffectTuningReset,
  onPoisonEffectTuningChange,
  onPoisonEffectTuningReset,
  onWaterEffectTuningChange,
  onWaterEffectTuningReset,
  onLavaEffectTuningChange,
  onLavaEffectTuningReset,
  onFireEffectTuningChange,
  onFireEffectTuningReset,
  onLightningEffectTuningChange,
  onLightningEffectTuningReset,
  onArcaneEffectTuningChange,
  onArcaneEffectTuningReset,
  onChaosEffectTuningChange,
  onChaosEffectTuningReset,
  onVoidEffectTuningChange,
  onVoidEffectTuningReset,
  onNatureEffectTuningChange,
  onNatureEffectTuningReset,
  onDistortionEffectTuningChange,
  onDistortionEffectTuningReset,
  onRadiantEffectTuningChange,
  onRadiantEffectTuningReset,
  onForceFieldEffectTuningChange,
  onForceFieldEffectTuningReset,
  onShockwaveEffectTuningChange,
  onShockwaveEffectTuningReset,
  onSmokeEffectTuningChange,
  onSmokeEffectTuningReset,
  onFogEffectTuningChange,
  onFogEffectTuningReset,
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
  onRequestClearFog,
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
  const [helpTopic, setHelpTopic] = useState<ToolHelpTopic | null>(null);
  const [drawingSettingsOpen, setDrawingSettingsOpen] = useState(false);
  const [templateSettingsOpen, setTemplateSettingsOpen] = useState(false);
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false);
  const [maskSettingsOpen, setMaskSettingsOpen] = useState(false);
  const [selectorSettingsOpen, setSelectorSettingsOpen] = useState(false);
  const activeFogShape = getActiveFogShape(activeFogTool);
  const [environmentEffectPresetValue, setEnvironmentEffectPresetValue] = useState("custom");

  useEffect(() => {
    setEnvironmentEffectPresetValue("custom");
  }, [environmentEffectType]);

  const environmentEffectPresetHandlers: EnvironmentEffectPresetChangeHandlers = {
    onAcidEffectTuningChange,
    onColdEffectTuningChange,
    onDarknessEffectTuningChange,
    onPoisonEffectTuningChange,
    onWaterEffectTuningChange,
    onLavaEffectTuningChange,
    onFireEffectTuningChange,
    onLightningEffectTuningChange,
    onArcaneEffectTuningChange,
    onChaosEffectTuningChange,
    onVoidEffectTuningChange,
    onNatureEffectTuningChange,
    onDistortionEffectTuningChange,
    onRadiantEffectTuningChange,
    onForceFieldEffectTuningChange,
    onShockwaveEffectTuningChange,
    onSmokeEffectTuningChange,
    onFogEffectTuningChange
  };
  const environmentEffectResetHandlers: EnvironmentEffectResetHandlers = {
    onAcidEffectTuningReset,
    onColdEffectTuningReset,
    onDarknessEffectTuningReset,
    onPoisonEffectTuningReset,
    onWaterEffectTuningReset,
    onLavaEffectTuningReset,
    onFireEffectTuningReset,
    onLightningEffectTuningReset,
    onArcaneEffectTuningReset,
    onChaosEffectTuningReset,
    onVoidEffectTuningReset,
    onNatureEffectTuningReset,
    onDistortionEffectTuningReset,
    onRadiantEffectTuningReset,
    onForceFieldEffectTuningReset,
    onShockwaveEffectTuningReset,
    onSmokeEffectTuningReset,
    onFogEffectTuningReset
  };

  const resetEnvironmentEffectTuning = () => {
    resetSelectedEnvironmentEffectTuning(environmentEffectType, environmentEffectPresetValue, environmentEffectPresetHandlers, environmentEffectResetHandlers);
  };

  useEffect(() => {
    const category = getActiveToolCategory({
      activeCanvasTool,
      activeFogTool,
      activeWeatherMaskTool,
      activeEnvironmentEffectTool,
      activeDrawingTool
    });
    if (category) {
      setActiveCategory(category);
    }
  }, [activeCanvasTool, activeDrawingTool, activeEnvironmentEffectTool, activeFogTool, activeWeatherMaskTool]);

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
    const plan = getCategoryOpenPlan(category, activeCategory, drawingStrokeWidth);
    setActiveCategory(plan.activeCategory);
    if (plan.clearHelp) {
      setHelpTopic(null);
    }
    if (plan.clearCanvasTool) {
      onCanvasToolChange(null);
    }
    if (plan.clearFogTool) {
      onFogToolChange(null);
    }
    if (plan.clearWeatherMaskTool) {
      onWeatherMaskToolChange(null);
    }
    if (plan.clearEnvironmentEffectTool) {
      onEnvironmentEffectToolChange(null);
    }
    if (plan.clearDrawingTool) {
      onDrawingToolChange(null);
    }
    if (plan.drawingColor) {
      onDrawingColorChange(plan.drawingColor);
    }
    if (plan.resetTemplateStrokeWidth) {
      onDrawingStrokeWidthChange(8);
    }
    if (category === "effects") {
      onEnvironmentEffectTypeChange(DEFAULT_ENVIRONMENT_EFFECT_TYPE);
    }
    if (plan.environmentPresetValue) {
      setEnvironmentEffectPresetValue(plan.environmentPresetValue);
    }
    if (plan.toggleDicePanel) {
      onToggleDicePanel();
      return;
    }
    if (plan.toggleTurnOrder) {
      onToggleTurnOrder();
    }
  };

  const setFogToolShape = (shape: FogToolShape) => {
    const plan = getFogToolSelectionPlan(shape, fogOperation, activeFogTool);
    if (plan.clearCanvasTool) {
      onCanvasToolChange(null);
    }
    if (plan.clearDrawingTool) {
      onDrawingToolChange(null);
    }
    if (plan.clearWeatherMaskTool) {
      onWeatherMaskToolChange(null);
    }
    if (plan.clearEnvironmentEffectTool) {
      onEnvironmentEffectToolChange(null);
    }
    onFogToolChange(plan.nextFogTool);
  };

  const setDrawingTool = (tool: DrawingTool) => {
    const plan = getDrawingToolSelectionPlan(tool, activeDrawingTool, drawingStrokeWidth);
    onCanvasToolChange(null);
    onFogToolChange(null);
    onWeatherMaskToolChange(null);
    onEnvironmentEffectToolChange(null);
    onDrawingColorChange(plan.drawingColor);
    if (plan.resetTemplateStrokeWidth) {
      onDrawingStrokeWidthChange(8);
    }
    onDrawingToolChange(plan.nextDrawingTool);
  };

  const setWeatherMaskTool = (tool: WeatherMaskTool) => {
    const plan = getWeatherMaskToolSelectionPlan(tool, activeWeatherMaskTool);
    if (plan.clearCanvasTool) {
      onCanvasToolChange(null);
    }
    if (plan.clearFogTool) {
      onFogToolChange(null);
    }
    if (plan.clearDrawingTool) {
      onDrawingToolChange(null);
    }
    if (plan.clearEnvironmentEffectTool) {
      onEnvironmentEffectToolChange(null);
    }
    onWeatherMaskToolChange(plan.nextWeatherMaskTool);
  };

  const setEnvironmentEffectTool = (tool: EnvironmentEffectTool) => {
    const plan = getEnvironmentEffectToolSelectionPlan(tool, activeEnvironmentEffectTool);
    if (plan.clearCanvasTool) {
      onCanvasToolChange(null);
    }
    if (plan.clearFogTool) {
      onFogToolChange(null);
    }
    if (plan.clearDrawingTool) {
      onDrawingToolChange(null);
    }
    if (plan.clearWeatherMaskTool) {
      onWeatherMaskToolChange(null);
    }
    onEnvironmentEffectToolChange(plan.nextEnvironmentEffectTool);
  };

  const setTableTool = (tool: CanvasTool) => {
    const plan = getTableToolSelectionPlan(tool, activeCanvasTool);
    onFogToolChange(null);
    onDrawingToolChange(null);
    onWeatherMaskToolChange(null);
    onEnvironmentEffectToolChange(null);
    if (plan.clearHelp) {
      setHelpTopic(null);
    }
    if (plan.pingColor) {
      onPingColorChange(plan.pingColor);
    }
    onCanvasToolChange(plan.nextCanvasTool);
  };

  const setFogToolOperation = (operation: FogOperation) => {
    onFogOperationChange(operation);
    const nextFogTool = getFogToolForOperation(operation, activeFogShape);
    if (nextFogTool) {
      onFogToolChange(nextFogTool);
    }
  };

  const toggleMouseCategory = () => {
    const plan = getMouseCategoryTogglePlan(activeCategory);
    setActiveCategory(plan.activeCategory);
    if (plan.clearTools) {
      clearActiveTools();
    }
    if (plan.clearHelp) {
      setHelpTopic(null);
    }
  };

  const isCategoryActive = (category: ToolCategory): boolean => {
    return isToolCategoryActive(category, {
      activeCategory,
      activeCanvasTool,
      activeFogTool,
      activeWeatherMaskTool,
      activeEnvironmentEffectTool,
      activeDrawingTool,
      dicePanelOpen,
      turnOrderModalOpen
    });
  };

  return (
    <div className="tools-menu" aria-label="Tools menu">
      <ToolsMenuCategoryRail
        activeCategory={activeCategory}
        toolsExpanded={toolsExpanded}
        isCategoryActive={isCategoryActive}
        onCategoryOpen={openCategory}
        onMouseCategoryToggle={toggleMouseCategory}
        onToolsExpandedChange={setToolsExpanded}
      />
      {activeCategory && (
        <div className="tools-subpanel" aria-label={`${getToolCategoryLabel(activeCategory)} panel`}>
          <PanelHeader title={getToolCategoryLabel(activeCategory)} />
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
                      <SelectorFilterCheckbox label="Weather Mask" checked={selectorSelectionFilters.weatherMasks} onChange={(checked) => onSelectorSelectionFiltersChange({ ...selectorSelectionFilters, weatherMasks: checked })} />
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
              {tableSettingsOpen && (
                <TableToolSettings
                  activeCanvasTool={activeCanvasTool}
                  pingSize={pingSize}
                  pingColor={pingColor}
                  laserThickness={laserThickness}
                  laserColor={laserColor}
                  pingSizeCustomOpen={pingSizeCustomOpen}
                  laserThicknessCustomOpen={laserThicknessCustomOpen}
                  onPingSizeChange={onPingSizeChange}
                  onPingColorChange={onPingColorChange}
                  onLaserThicknessChange={onLaserThicknessChange}
                  onLaserColorChange={onLaserColorChange}
                  onPingSizeCustomOpenChange={setPingSizeCustomOpen}
                  onLaserThicknessCustomOpenChange={setLaserThicknessCustomOpen}
                />
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
                <ToolButton variant="danger" label="Clear Fog Masks" disabled={fogShapeCount === 0} onClick={onRequestClearFog}>
                  <Trash2 size={17} aria-hidden="true" />
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
                <FogBrushSettings
                  brushSize={brushSize}
                  customOpen={fogBrushCustomOpen}
                  onBrushSizeChange={onBrushSizeChange}
                  onCustomOpenChange={setFogBrushCustomOpen}
                />
              )}
              {helpTopic === "fog" && <ToolHelpCard topic="fog" />}
            </div>
          )}
          {activeCategory === "effects" && (
            <div className="tools-panel-section">
              <HelpButton active={helpTopic === "effects"} label="Effects Tools Help" onClick={() => setHelpTopic((topic) => (topic === "effects" ? null : "effects"))} />
              <div className="tools-section-label">Weather Masks</div>
              {!weatherToolsEnabled && <span className="tools-section-note">Enable scene weather to use weather masks.</span>}
              <div className="tools-button-row">
                <ToolButton active={activeWeatherMaskTool === "rectangle"} label="Rectangle Weather Mask" disabled={!weatherToolsEnabled} onClick={() => setWeatherMaskTool("rectangle")}>
                  <Square size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeWeatherMaskTool === "circle"} label="Circle Weather Mask" disabled={!weatherToolsEnabled} onClick={() => setWeatherMaskTool("circle")}>
                  <Circle size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeWeatherMaskTool === "polygon"} label="Polygon Weather Mask" disabled={!weatherToolsEnabled} onClick={() => setWeatherMaskTool("polygon")}>
                  <Pentagon size={17} aria-hidden="true" />
                </ToolButton>
                <span className="tools-vertical-divider" aria-hidden="true" />
                <ToolButton label="Undo Last Weather Mask" disabled={!weatherToolsEnabled || weatherMaskCount === 0} onClick={onUndoWeatherMask}>
                  <Undo2 size={17} aria-hidden="true" />
                </ToolButton>
              </div>
              <div className="tools-section-divider" />
              <div className="tools-section-label">Animated Effects</div>
              <div className="tools-button-row">
                <ToolButton active={activeEnvironmentEffectTool === "circle"} label="Radius Animated Effect" onClick={() => setEnvironmentEffectTool("circle")}>
                  <Circle size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeEnvironmentEffectTool === "rectangle"} label="Rectangle Animated Effect" onClick={() => setEnvironmentEffectTool("rectangle")}>
                  <Square size={17} aria-hidden="true" />
                </ToolButton>
                <ToolButton active={activeEnvironmentEffectTool === "polygon"} label="Polygon Animated Effect" onClick={() => setEnvironmentEffectTool("polygon")}>
                  <Pentagon size={17} aria-hidden="true" />
                </ToolButton>
                <span className="tools-vertical-divider" aria-hidden="true" />
                <ToolButton label="Undo Last Animated Effect" disabled={environmentEffectCount === 0} onClick={onUndoEnvironmentEffect}>
                  <Undo2 size={17} aria-hidden="true" />
                </ToolButton>
              </div>
              <div className="tools-section-divider" />
              <div className="tools-section-label">Settings</div>
              <div className="tools-effect-select-row">
                <div className="tools-strip-select-field">
                  <strong>Effect</strong>
                  <div>
                    <select
                      aria-label="Animated effect type"
                      title="Animated effect type"
                      value={environmentEffectType}
                      onChange={(event) => onEnvironmentEffectTypeChange(event.target.value as EnvironmentEffectType)}
                    >
                      {ENVIRONMENT_EFFECT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="tools-strip-select-field">
                  <strong>Preset</strong>
                  <div>
                    <select
                      aria-label={`${formatEnvironmentEffectOptionLabel(environmentEffectType)} effect preset`}
                      title={`${formatEnvironmentEffectOptionLabel(environmentEffectType)} effect preset`}
                      value={environmentEffectPresetValue}
                      onChange={(event) => {
                        const nextPreset = event.target.value;
                        setEnvironmentEffectPresetValue(nextPreset);
                        applySelectedEnvironmentEffectPreset(environmentEffectType, nextPreset, environmentEffectPresetHandlers);
                      }}
                    >
                      {getEnvironmentEffectPresetOptions(environmentEffectType).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="tools-effect-select-row tools-effect-select-row-single">
                <div className="tools-strip-select-field">
                  <strong>Feather</strong>
                  <div>
                    <select
                      aria-label="Animated effect feather"
                      title="Animated effect feather"
                      value={getEnvironmentEffectFeatherSelectValue(environmentEffectFeather)}
                      onChange={(event) => onEnvironmentEffectFeatherChange(Number(event.target.value))}
                    >
                      {ENVIRONMENT_EFFECT_FEATHER_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {environmentEffectType === "acid" && (
                <>
                  <div className="tools-section-divider" />
                  <AcidEffectTuningPanel
                    tuning={acidEffectTuning}
                    onChange={onAcidEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "cold" && (
                <>
                  <div className="tools-section-divider" />
                  <ColdEffectTuningPanel
                    tuning={coldEffectTuning}
                    onChange={onColdEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "darkness" && (
                <>
                  <div className="tools-section-divider" />
                  <DarknessEffectTuningPanel
                    tuning={darknessEffectTuning}
                    onChange={onDarknessEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "poison" && (
                <>
                  <div className="tools-section-divider" />
                  <PoisonEffectTuningPanel
                    tuning={poisonEffectTuning}
                    onChange={onPoisonEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "water" && (
                <>
                  <div className="tools-section-divider" />
                  <WaterEffectTuningPanel
                    tuning={waterEffectTuning}
                    onChange={onWaterEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "lava" && (
                <>
                  <div className="tools-section-divider" />
                  <LavaEffectTuningPanel
                    tuning={lavaEffectTuning}
                    onChange={onLavaEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "fire" && (
                <>
                  <div className="tools-section-divider" />
                  <FireEffectTuningPanel
                    tuning={fireEffectTuning}
                    onChange={onFireEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "electric" && (
                <>
                  <div className="tools-section-divider" />
                  <LightningEffectTuningPanel
                    tuning={lightningEffectTuning}
                    onChange={onLightningEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "arcane" && (
                <>
                  <div className="tools-section-divider" />
                  <ArcaneEffectTuningPanel
                    tuning={arcaneEffectTuning}
                    onChange={onArcaneEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "chaos" && (
                <>
                  <div className="tools-section-divider" />
                  <ChaosEffectTuningPanel
                    tuning={chaosEffectTuning}
                    onChange={onChaosEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "void" && (
                <>
                  <div className="tools-section-divider" />
                  <VoidEffectTuningPanel
                    tuning={voidEffectTuning}
                    onChange={onVoidEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "nature" && (
                <>
                  <div className="tools-section-divider" />
                  <NatureEffectTuningPanel
                    tuning={natureEffectTuning}
                    onChange={onNatureEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "distortion" && (
                <>
                  <div className="tools-section-divider" />
                  <DistortionEffectTuningPanel
                    tuning={distortionEffectTuning}
                    onChange={onDistortionEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "radiant" && (
                <>
                  <div className="tools-section-divider" />
                  <RadiantEffectTuningPanel
                    tuning={radiantEffectTuning}
                    onChange={onRadiantEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "field" && (
                <>
                  <div className="tools-section-divider" />
                  <ForceFieldEffectTuningPanel
                    tuning={forceFieldEffectTuning}
                    onChange={onForceFieldEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "shockwave" && (
                <>
                  <div className="tools-section-divider" />
                  <ShockwaveEffectTuningPanel
                    tuning={shockwaveEffectTuning}
                    onChange={onShockwaveEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "smoke" && (
                <>
                  <div className="tools-section-divider" />
                  <SmokeEffectTuningPanel
                    tuning={smokeEffectTuning}
                    onChange={onSmokeEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
                  />
                </>
              )}
              {environmentEffectType === "fog" && (
                <>
                  <div className="tools-section-divider" />
                  <FogEffectTuningPanel
                    tuning={fogEffectTuning}
                    onChange={onFogEffectTuningChange}
                    onReset={resetEnvironmentEffectTuning}
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

function ToolButton({
  active = false,
  disabled = false,
  label,
  variant,
  children,
  onClick
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  variant?: "danger";
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={getToolButtonClassName(active, variant)} aria-label={label} title={label} type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function HelpButton({ active, disabled = false, label, onClick }: { active: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button className={getToolButtonClassName(active, "help")} aria-label={label} title={label} type="button" aria-expanded={active} disabled={disabled} onClick={onClick}>
      <HelpCircle size={14} aria-hidden="true" />
    </button>
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

function Placeholder({ message }: { message: string }) {
  return <div className="tools-placeholder">{message}</div>;
}

