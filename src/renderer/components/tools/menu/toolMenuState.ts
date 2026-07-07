import type { DrawingTool } from "../../../canvas/drawings";
import type { FogTool } from "../../../canvas/fog";
import type { ToolCategory } from "./toolCategoryLabels";

export type FogOperation = "reveal" | "hide";
export type CanvasTool = "ruler" | "ping" | "laser";
export type WeatherMaskTool = "rectangle" | "circle" | "polygon";
export type EnvironmentEffectTool = "rectangle" | "circle" | "polygon";
export type FogToolShape = "brush" | "rectangle" | "circle" | "polygon";
export type MouseBehavior = "selector" | "grabber";

export const DEFAULT_DRAWING_COLOR = "#ff0000";
export const DEFAULT_TEMPLATE_COLOR = "#7dd3fc";
export const DEFAULT_SONAR_COLOR = "#ffd84d";

export interface ActiveToolCategoryState {
  activeCanvasTool: CanvasTool | null;
  activeFogTool: FogTool | null;
  activeWeatherMaskTool: WeatherMaskTool | null;
  activeEnvironmentEffectTool: EnvironmentEffectTool | null;
  activeDrawingTool: DrawingTool | null;
}

export interface ToolCategoryActiveState extends ActiveToolCategoryState {
  activeCategory: ToolCategory | null;
  dicePanelOpen: boolean;
  turnOrderModalOpen: boolean;
}

export interface CategoryOpenPlan {
  activeCategory: ToolCategory | null;
  clearCanvasTool: boolean;
  clearFogTool: boolean;
  clearWeatherMaskTool: boolean;
  clearEnvironmentEffectTool: boolean;
  clearDrawingTool: boolean;
  clearHelp: boolean;
  drawingColor: string | null;
  environmentPresetValue: string | null;
  resetTemplateStrokeWidth: boolean;
  toggleDicePanel: boolean;
  toggleTurnOrder: boolean;
}

export interface DrawingToolSelectionPlan {
  clearTools: boolean;
  drawingColor: string;
  resetTemplateStrokeWidth: boolean;
  nextDrawingTool: DrawingTool | null;
}

export interface TableToolSelectionPlan {
  clearTools: boolean;
  clearHelp: boolean;
  pingColor: string | null;
  nextCanvasTool: CanvasTool | null;
}

export interface FogToolSelectionPlan {
  clearCanvasTool: boolean;
  clearDrawingTool: boolean;
  clearWeatherMaskTool: boolean;
  clearEnvironmentEffectTool: boolean;
  nextFogTool: FogTool | null;
}

export interface WeatherMaskToolSelectionPlan {
  clearCanvasTool: boolean;
  clearFogTool: boolean;
  clearDrawingTool: boolean;
  clearEnvironmentEffectTool: boolean;
  nextWeatherMaskTool: WeatherMaskTool | null;
}

export interface EnvironmentEffectToolSelectionPlan {
  clearCanvasTool: boolean;
  clearFogTool: boolean;
  clearDrawingTool: boolean;
  clearWeatherMaskTool: boolean;
  nextEnvironmentEffectTool: EnvironmentEffectTool | null;
}

export interface MouseCategoryTogglePlan {
  activeCategory: ToolCategory | null;
  clearTools: boolean;
  clearHelp: boolean;
}

export function createFogTool(operation: FogOperation, shape: FogToolShape): FogTool {
  return `${operation}-${shape}` as FogTool;
}

export function getActiveFogShape(tool: FogTool | null): FogToolShape | null {
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

export function isTemplateDrawingTool(tool: DrawingTool | null): boolean {
  return tool === "template-line" || tool === "template-rectangle" || tool === "template-circle" || tool === "template-cone";
}

export function getActiveToolCategory(state: ActiveToolCategoryState): ToolCategory | null {
  if (state.activeFogTool) {
    return "fog";
  }
  if (state.activeWeatherMaskTool || state.activeEnvironmentEffectTool) {
    return "effects";
  }
  if (state.activeCanvasTool) {
    return "table";
  }
  if (state.activeDrawingTool) {
    return isTemplateDrawingTool(state.activeDrawingTool) ? "templates" : "drawing";
  }
  return null;
}

export function isToolCategoryActive(category: ToolCategory, state: ToolCategoryActiveState): boolean {
  if (state.activeCategory === category) {
    return true;
  }
  if (category === "drawing") {
    return Boolean(state.activeDrawingTool && !isTemplateDrawingTool(state.activeDrawingTool));
  }
  if (category === "templates") {
    return isTemplateDrawingTool(state.activeDrawingTool);
  }
  if (category === "table") {
    return Boolean(state.activeCanvasTool);
  }
  if (category === "fog") {
    return Boolean(state.activeFogTool);
  }
  if (category === "effects") {
    return Boolean(state.activeWeatherMaskTool || state.activeEnvironmentEffectTool);
  }
  if (category === "dice") {
    return state.dicePanelOpen;
  }
  if (category === "turn-order") {
    return state.turnOrderModalOpen;
  }
  return false;
}

export function getCategoryOpenPlan(category: ToolCategory, activeCategory: ToolCategory | null, drawingStrokeWidth: number): CategoryOpenPlan {
  if (activeCategory === category) {
    return createCategoryOpenPlan({ activeCategory: null, ...CLEAR_ALL_TOOLS });
  }
  if (category === "dice") {
    return createCategoryOpenPlan({ activeCategory: null, ...CLEAR_ALL_TOOLS, toggleDicePanel: true });
  }
  if (category === "turn-order") {
    return createCategoryOpenPlan({ activeCategory: null, ...CLEAR_ALL_TOOLS, toggleTurnOrder: true });
  }
  if (category === "drawing" || category === "templates") {
    return createCategoryOpenPlan({
      activeCategory: category,
      clearCanvasTool: true,
      clearFogTool: true,
      clearWeatherMaskTool: true,
      clearEnvironmentEffectTool: true,
      drawingColor: category === "templates" ? DEFAULT_TEMPLATE_COLOR : DEFAULT_DRAWING_COLOR,
      resetTemplateStrokeWidth: category === "templates" && drawingStrokeWidth === 40
    });
  }
  if (category === "table") {
    return createCategoryOpenPlan({
      activeCategory: category,
      clearFogTool: true,
      clearWeatherMaskTool: true,
      clearEnvironmentEffectTool: true,
      clearDrawingTool: true
    });
  }
  if (category === "fog") {
    return createCategoryOpenPlan({
      activeCategory: category,
      clearCanvasTool: true,
      clearWeatherMaskTool: true,
      clearEnvironmentEffectTool: true,
      clearDrawingTool: true
    });
  }
  if (category === "effects") {
    return createCategoryOpenPlan({
      activeCategory: category,
      clearCanvasTool: true,
      clearFogTool: true,
      clearDrawingTool: true,
      environmentPresetValue: "custom"
    });
  }
  return createCategoryOpenPlan({ activeCategory: category, ...CLEAR_ALL_TOOLS });
}

export function getDrawingToolSelectionPlan(
  tool: DrawingTool,
  activeDrawingTool: DrawingTool | null,
  drawingStrokeWidth: number
): DrawingToolSelectionPlan {
  const selectingTemplateTool = isTemplateDrawingTool(tool);
  const enteringTemplateTools = selectingTemplateTool && activeDrawingTool !== tool && !isTemplateDrawingTool(activeDrawingTool);
  return {
    clearTools: true,
    drawingColor: selectingTemplateTool ? DEFAULT_TEMPLATE_COLOR : DEFAULT_DRAWING_COLOR,
    resetTemplateStrokeWidth: enteringTemplateTools && drawingStrokeWidth === 40,
    nextDrawingTool: activeDrawingTool === tool ? null : tool
  };
}

export function getTableToolSelectionPlan(tool: CanvasTool, activeCanvasTool: CanvasTool | null): TableToolSelectionPlan {
  return {
    clearTools: true,
    clearHelp: true,
    pingColor: tool === "ping" ? DEFAULT_SONAR_COLOR : null,
    nextCanvasTool: activeCanvasTool === tool ? null : tool
  };
}

export function getFogToolSelectionPlan(shape: FogToolShape, fogOperation: FogOperation, activeFogTool: FogTool | null): FogToolSelectionPlan {
  const nextTool = createFogTool(fogOperation, shape);
  return {
    clearCanvasTool: true,
    clearDrawingTool: true,
    clearWeatherMaskTool: true,
    clearEnvironmentEffectTool: true,
    nextFogTool: activeFogTool === nextTool ? null : nextTool
  };
}

export function getWeatherMaskToolSelectionPlan(tool: WeatherMaskTool, activeWeatherMaskTool: WeatherMaskTool | null): WeatherMaskToolSelectionPlan {
  return {
    clearCanvasTool: true,
    clearFogTool: true,
    clearDrawingTool: true,
    clearEnvironmentEffectTool: true,
    nextWeatherMaskTool: activeWeatherMaskTool === tool ? null : tool
  };
}

export function getEnvironmentEffectToolSelectionPlan(
  tool: EnvironmentEffectTool,
  activeEnvironmentEffectTool: EnvironmentEffectTool | null
): EnvironmentEffectToolSelectionPlan {
  return {
    clearCanvasTool: true,
    clearFogTool: true,
    clearDrawingTool: true,
    clearWeatherMaskTool: true,
    nextEnvironmentEffectTool: activeEnvironmentEffectTool === tool ? null : tool
  };
}

export function getFogToolForOperation(operation: FogOperation, activeFogShape: FogToolShape | null): FogTool | null {
  return activeFogShape ? createFogTool(operation, activeFogShape) : null;
}

export function getMouseCategoryTogglePlan(activeCategory: ToolCategory | null): MouseCategoryTogglePlan {
  if (activeCategory === "mouse") {
    return { activeCategory: null, clearTools: false, clearHelp: true };
  }
  return {
    activeCategory: "mouse",
    clearTools: Boolean(activeCategory),
    clearHelp: true
  };
}

export function getToolCategoryButtonClassName(active: boolean): string {
  return active ? "tools-category-button tool-active" : "tools-category-button";
}

export function getToolButtonClassName(active: boolean, variant?: "help" | "danger"): string {
  const classNames = ["tool-circle-button"];
  if (variant === "help") {
    classNames.push("tool-help-trigger", "tools-panel-help-button");
  }
  if (variant === "danger") {
    classNames.push("danger");
  }
  if (active) {
    classNames.push("tool-active");
  }
  return classNames.join(" ");
}

function createCategoryOpenPlan(overrides: Partial<CategoryOpenPlan> = {}): CategoryOpenPlan {
  return {
    activeCategory: null,
    clearCanvasTool: false,
    clearFogTool: false,
    clearWeatherMaskTool: false,
    clearEnvironmentEffectTool: false,
    clearDrawingTool: false,
    clearHelp: true,
    drawingColor: null,
    environmentPresetValue: null,
    resetTemplateStrokeWidth: false,
    toggleDicePanel: false,
    toggleTurnOrder: false,
    ...overrides
  };
}

const CLEAR_ALL_TOOLS = {
  clearCanvasTool: true,
  clearFogTool: true,
  clearWeatherMaskTool: true,
  clearEnvironmentEffectTool: true,
  clearDrawingTool: true
} satisfies Partial<CategoryOpenPlan>;
