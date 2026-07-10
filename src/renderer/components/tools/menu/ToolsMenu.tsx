import { useEffect, useState } from "react";
import type { DrawingTool } from "../../../canvas/drawings";
import type { DrawingStrokeStyle, DrawingTemplateEffect, EnvironmentEffectType, PingKind } from "../../../../shared/localvtt";
import type { FogTool } from "../../../canvas/fog";
import type { DrawingTemplateSize, DrawingTemplateWidth } from "../settings/DrawingToolSettings";
import type { SelectorSelectionCounts, SelectorSelectionFilters } from "../settings/SelectorToolControls";
import type { ToolHelpTopic } from "../settings/ToolHelpCard";
import type { AcidEffectTuning, ArcaneEffectTuning, ChaosEffectTuning, ColdEffectTuning, DarknessEffectTuning, DistortionEffectTuning, FireEffectTuning, FogEffectTuning, ForceFieldEffectTuning, LavaEffectTuning, LightningEffectTuning, NatureEffectTuning, PoisonEffectTuning, RadiantEffectTuning, ShockwaveEffectTuning, SmokeEffectTuning, VoidEffectTuning, WaterEffectTuning } from "../../../canvas/effects";
import { ENVIRONMENT_EFFECT_OPTIONS } from "../../../lib/effects";
import {
  applySelectedEnvironmentEffectPreset,
  createEnvironmentEffectPresetChangeHandlers,
  createEnvironmentEffectResetHandlers,
  resetSelectedEnvironmentEffectTuning,
} from "./environmentEffectMenuActions";
import { ToolsMenuCategoryRail } from "./ToolsMenuCategoryRail";
import { DrawingToolsPanel, TemplateToolsPanel, type DrawingPanelSettingsChangeHandlers, type DrawingPanelSettingsState } from "./ToolsMenuDrawingPanels";
import { EnvironmentEffectsPanel, type EnvironmentEffectTuningChangeHandlers, type EnvironmentEffectTuningState } from "./ToolsMenuEffectsPanel";
import { ToolsMenuMousePanel, type ToolsMenuMousePanelActions, type ToolsMenuMousePanelState } from "./ToolsMenuMousePanel";
import { PanelHeader, Placeholder } from "./ToolsMenuPrimitives";
import { FogToolsPanel, TableToolsPanel, type FogToolsPanelActions, type FogToolsPanelState, type TableToolsPanelActions, type TableToolsPanelState } from "./ToolsMenuUtilityPanels";
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
  pingKind: PingKind;
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
  onPingKindChange: (pingKind: PingKind) => void;
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

export function ToolsMenu(props: ToolsMenuProps) {
  const {
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
  pingKind,
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
  onFogEffectTuningChange,
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
  onPingKindChange,
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
  } = props;
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

  const environmentEffectPresetHandlers = createEnvironmentEffectPresetChangeHandlers(props);
  const environmentEffectResetHandlers = createEnvironmentEffectResetHandlers(props);
  const environmentEffectTuning: EnvironmentEffectTuningState = {
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
    fogEffectTuning
  };
  const environmentEffectTuningChangeHandlers: EnvironmentEffectTuningChangeHandlers = {
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
  const drawingPanelSettings: DrawingPanelSettingsState = {
    activeDrawingTool,
    drawingColor,
    drawingOpacity,
    drawingFillColor,
    drawingFillOpacity,
    drawingStrokeStyle,
    drawingStrokeWidth,
    drawingTemplateSize,
    drawingTemplateEffect,
    drawingTemplateWidth,
    drawingThicknessCustomOpen,
    drawingOpacityCustomOpen
  };
  const drawingPanelSettingsChangeHandlers: DrawingPanelSettingsChangeHandlers = {
    onDrawingColorChange,
    onDrawingOpacityChange,
    onDrawingFillColorChange,
    onDrawingFillOpacityChange,
    onDrawingStrokeStyleChange,
    onDrawingStrokeWidthChange,
    onDrawingTemplateSizeChange,
    onDrawingTemplateEffectChange,
    onDrawingTemplateWidthChange,
    onDrawingThicknessCustomOpenChange: setDrawingThicknessCustomOpen,
    onDrawingOpacityCustomOpenChange: setDrawingOpacityCustomOpen
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

  const mousePanelState: ToolsMenuMousePanelState = {
    mouseBehavior,
    selectorSettingsOpen,
    selectorSelectionCounts,
    selectorSelectionFilters
  };
  const mousePanelActions: ToolsMenuMousePanelActions = {
    onClearActiveTools: clearActiveTools,
    onMouseBehaviorChange,
    onSelectorSettingsOpenChange: setSelectorSettingsOpen,
    onSelectorSelectionFiltersChange,
    onShowSelectedOnPlayerView,
    onHideSelectedOnPlayerView,
    onDeleteSelected,
    onClearSelection
  };
  const tableToolsPanelState: TableToolsPanelState = {
    activeCanvasTool,
    tableSettingsOpen,
    tableToolsVisibleInPlayer,
    rulerLinger,
    pingSize,
    pingColor,
    pingKind,
    laserThickness,
    laserColor,
    pingSizeCustomOpen,
    laserThicknessCustomOpen,
    helpTopic
  };
  const tableToolsPanelActions: TableToolsPanelActions = {
    onTableToolChange: setTableTool,
    onTableSettingsOpenChange: setTableSettingsOpen,
    onTableToolsVisibleInPlayerChange,
    onRulerLingerChange,
    onPingSizeChange,
    onPingColorChange,
    onPingKindChange,
    onLaserThicknessChange,
    onLaserColorChange,
    onPingSizeCustomOpenChange: setPingSizeCustomOpen,
    onLaserThicknessCustomOpenChange: setLaserThicknessCustomOpen,
    onHelpTopicChange: setHelpTopic
  };
  const fogToolsPanelState: FogToolsPanelState = {
    activeFogShape,
    fogOperation,
    fogShapeCount,
    maskSettingsOpen,
    brushSize,
    fogBrushCustomOpen,
    helpTopic
  };
  const fogToolsPanelActions: FogToolsPanelActions = {
    onFogToolShapeChange: setFogToolShape,
    onFogToolOperationChange: setFogToolOperation,
    onUndoFogShape,
    onRequestClearFog,
    onMaskSettingsOpenChange: setMaskSettingsOpen,
    onBrushSizeChange,
    onFogBrushCustomOpenChange: setFogBrushCustomOpen,
    onHelpTopicChange: setHelpTopic
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
            <ToolsMenuMousePanel
              state={mousePanelState}
              actions={mousePanelActions}
            />
          )}
          {activeCategory === "drawing" && (
            <DrawingToolsPanel
              settings={drawingPanelSettings}
              onSettingsChange={drawingPanelSettingsChangeHandlers}
              drawingCount={drawingCount}
              drawingSettingsOpen={drawingSettingsOpen}
              helpTopic={helpTopic}
              onDrawingToolChange={setDrawingTool}
              onUndoDrawing={onUndoDrawing}
              onDrawingSettingsOpenChange={setDrawingSettingsOpen}
              onHelpTopicChange={setHelpTopic}
            />
          )}
          {activeCategory === "templates" && (
            <TemplateToolsPanel
              settings={drawingPanelSettings}
              onSettingsChange={drawingPanelSettingsChangeHandlers}
              drawingCount={drawingCount}
              templateSettingsOpen={templateSettingsOpen}
              templatePreviewVisibleInPlayer={templatePreviewVisibleInPlayer}
              helpTopic={helpTopic}
              onDrawingToolChange={setDrawingTool}
              onUndoDrawing={onUndoDrawing}
              onTemplateSettingsOpenChange={setTemplateSettingsOpen}
              onTemplatePreviewVisibleInPlayerChange={onTemplatePreviewVisibleInPlayerChange}
              onHelpTopicChange={setHelpTopic}
            />
          )}
          {activeCategory === "text" && <Placeholder message="Text tools will be added here." />}
          {activeCategory === "table" && (
            <TableToolsPanel
              state={tableToolsPanelState}
              actions={tableToolsPanelActions}
            />
          )}
          {activeCategory === "pin" && <Placeholder message="Pin tools will be added here." />}
          {activeCategory === "fog" && (
            <FogToolsPanel
              state={fogToolsPanelState}
              actions={fogToolsPanelActions}
            />
          )}
          {activeCategory === "effects" && (
            <EnvironmentEffectsPanel
              activeWeatherMaskTool={activeWeatherMaskTool}
              activeEnvironmentEffectTool={activeEnvironmentEffectTool}
              environmentEffectType={environmentEffectType}
              environmentEffectFeather={environmentEffectFeather}
              environmentEffectPresetValue={environmentEffectPresetValue}
              weatherToolsEnabled={weatherToolsEnabled}
              weatherMaskCount={weatherMaskCount}
              environmentEffectCount={environmentEffectCount}
              helpTopic={helpTopic}
              tuning={environmentEffectTuning}
              onWeatherMaskToolChange={setWeatherMaskTool}
              onEnvironmentEffectToolChange={setEnvironmentEffectTool}
              onUndoWeatherMask={onUndoWeatherMask}
              onUndoEnvironmentEffect={onUndoEnvironmentEffect}
              onEnvironmentEffectTypeChange={onEnvironmentEffectTypeChange}
              onEnvironmentEffectFeatherChange={onEnvironmentEffectFeatherChange}
              onEnvironmentEffectPresetValueChange={setEnvironmentEffectPresetValue}
              onEnvironmentEffectPresetApply={(presetValue) => applySelectedEnvironmentEffectPreset(environmentEffectType, presetValue, environmentEffectPresetHandlers)}
              onEnvironmentEffectTuningReset={resetEnvironmentEffectTuning}
              onTuningChange={environmentEffectTuningChangeHandlers}
              onHelpTopicChange={setHelpTopic}
            />
          )}
          {activeCategory === "lighting" && <Placeholder message="Dynamic lighting tools will be added here." />}
        </div>
      )}
    </div>
  );
}

