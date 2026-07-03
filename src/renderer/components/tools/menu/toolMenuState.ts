import type { DrawingTool } from "../../../canvas/drawings";
import type { FogTool } from "../../../canvas/fog";
import type { ToolCategory } from "./toolCategoryLabels";

export type FogOperation = "reveal" | "hide";
export type CanvasTool = "ruler" | "ping" | "laser";
export type WeatherMaskTool = "rectangle" | "circle" | "polygon";
export type EnvironmentEffectTool = "rectangle" | "circle" | "polygon";
export type FogToolShape = "brush" | "rectangle" | "circle" | "polygon";
export type MouseBehavior = "selector" | "grabber";

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
