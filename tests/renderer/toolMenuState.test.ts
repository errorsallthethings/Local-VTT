import { describe, expect, it } from "vitest";
import {
  createFogTool,
  DEFAULT_DRAWING_COLOR,
  DEFAULT_SONAR_COLOR,
  DEFAULT_TEMPLATE_COLOR,
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
  getToolCategoryButtonClassName,
  getWeatherMaskToolSelectionPlan,
  isTemplateDrawingTool,
  isToolCategoryActive
} from "../../src/renderer/components/tools/menu/toolMenuState";

describe("tool menu state helpers", () => {
  it("creates and reads fog tool shapes", () => {
    expect(createFogTool("reveal", "brush")).toBe("reveal-brush");
    expect(createFogTool("hide", "polygon")).toBe("hide-polygon");
    expect(getActiveFogShape("reveal-brush")).toBe("brush");
    expect(getActiveFogShape("hide-polygon")).toBe("polygon");
    expect(getActiveFogShape("reveal-circle")).toBe("circle");
    expect(getActiveFogShape("hide-rectangle")).toBe("rectangle");
    expect(getActiveFogShape(null)).toBeNull();
  });

  it("identifies template drawing tools", () => {
    expect(isTemplateDrawingTool("template-line")).toBe(true);
    expect(isTemplateDrawingTool("template-cone")).toBe(true);
    expect(isTemplateDrawingTool("rectangle")).toBe(false);
    expect(isTemplateDrawingTool(null)).toBe(false);
  });

  it("derives the category for currently active tools", () => {
    expect(
      getActiveToolCategory({
        activeCanvasTool: null,
        activeFogTool: "reveal-brush",
        activeWeatherMaskTool: null,
        activeEnvironmentEffectTool: null,
        activeDrawingTool: null
      })
    ).toBe("fog");
    expect(
      getActiveToolCategory({
        activeCanvasTool: null,
        activeFogTool: null,
        activeWeatherMaskTool: "circle",
        activeEnvironmentEffectTool: null,
        activeDrawingTool: null
      })
    ).toBe("effects");
    expect(
      getActiveToolCategory({
        activeCanvasTool: "ruler",
        activeFogTool: null,
        activeWeatherMaskTool: null,
        activeEnvironmentEffectTool: null,
        activeDrawingTool: null
      })
    ).toBe("table");
    expect(
      getActiveToolCategory({
        activeCanvasTool: null,
        activeFogTool: null,
        activeWeatherMaskTool: null,
        activeEnvironmentEffectTool: null,
        activeDrawingTool: "template-circle"
      })
    ).toBe("templates");
    expect(
      getActiveToolCategory({
        activeCanvasTool: null,
        activeFogTool: null,
        activeWeatherMaskTool: null,
        activeEnvironmentEffectTool: null,
        activeDrawingTool: "line"
      })
    ).toBe("drawing");
  });

  it("resolves active category state from selected tools and open panels", () => {
    const baseState = {
      activeCategory: null,
      activeCanvasTool: null,
      activeFogTool: null,
      activeWeatherMaskTool: null,
      activeEnvironmentEffectTool: null,
      activeDrawingTool: null,
      dicePanelOpen: false,
      turnOrderModalOpen: false
    };

    expect(isToolCategoryActive("mouse", { ...baseState, activeCategory: "mouse" })).toBe(true);
    expect(isToolCategoryActive("drawing", { ...baseState, activeDrawingTool: "rectangle" })).toBe(true);
    expect(isToolCategoryActive("templates", { ...baseState, activeDrawingTool: "template-rectangle" })).toBe(true);
    expect(isToolCategoryActive("table", { ...baseState, activeCanvasTool: "laser" })).toBe(true);
    expect(isToolCategoryActive("fog", { ...baseState, activeFogTool: "hide-circle" })).toBe(true);
    expect(isToolCategoryActive("effects", { ...baseState, activeEnvironmentEffectTool: "polygon" })).toBe(true);
    expect(isToolCategoryActive("dice", { ...baseState, dicePanelOpen: true })).toBe(true);
    expect(isToolCategoryActive("turn-order", { ...baseState, turnOrderModalOpen: true })).toBe(true);
    expect(isToolCategoryActive("lighting", baseState)).toBe(false);
  });

  it("plans category opening without clearing tools that belong to the opened category", () => {
    expect(getCategoryOpenPlan("drawing", null, 40)).toMatchObject({
      activeCategory: "drawing",
      clearCanvasTool: true,
      clearFogTool: true,
      clearWeatherMaskTool: true,
      clearEnvironmentEffectTool: true,
      clearDrawingTool: false,
      drawingColor: DEFAULT_DRAWING_COLOR,
      resetTemplateStrokeWidth: false
    });
    expect(getCategoryOpenPlan("templates", null, 40)).toMatchObject({
      activeCategory: "templates",
      clearDrawingTool: false,
      drawingColor: DEFAULT_TEMPLATE_COLOR,
      resetTemplateStrokeWidth: true
    });
    expect(getCategoryOpenPlan("table", null, 8)).toMatchObject({
      activeCategory: "table",
      clearCanvasTool: false,
      clearDrawingTool: true
    });
    expect(getCategoryOpenPlan("effects", null, 8)).toMatchObject({
      activeCategory: "effects",
      clearWeatherMaskTool: false,
      clearEnvironmentEffectTool: false,
      environmentPresetValue: "custom"
    });
  });

  it("plans modal category toggles and repeated category closes", () => {
    expect(getCategoryOpenPlan("dice", null, 8)).toMatchObject({
      activeCategory: null,
      clearCanvasTool: true,
      clearDrawingTool: true,
      toggleDicePanel: true
    });
    expect(getCategoryOpenPlan("turn-order", null, 8)).toMatchObject({
      activeCategory: null,
      toggleTurnOrder: true
    });
    expect(getCategoryOpenPlan("fog", "fog", 8)).toMatchObject({
      activeCategory: null,
      clearCanvasTool: true,
      clearFogTool: true,
      clearDrawingTool: true
    });
  });

  it("plans drawing and table tool selection side effects", () => {
    expect(getDrawingToolSelectionPlan("template-cone", "rectangle", 40)).toEqual({
      clearTools: true,
      drawingColor: DEFAULT_TEMPLATE_COLOR,
      resetTemplateStrokeWidth: true,
      nextDrawingTool: "template-cone"
    });
    expect(getDrawingToolSelectionPlan("template-cone", "template-cone", 40)).toMatchObject({
      drawingColor: DEFAULT_TEMPLATE_COLOR,
      resetTemplateStrokeWidth: false,
      nextDrawingTool: null
    });
    expect(getDrawingToolSelectionPlan("line", null, 40)).toMatchObject({
      drawingColor: DEFAULT_DRAWING_COLOR,
      resetTemplateStrokeWidth: false,
      nextDrawingTool: "line"
    });
    expect(getTableToolSelectionPlan("ping", null)).toEqual({
      clearTools: true,
      clearHelp: true,
      pingColor: DEFAULT_SONAR_COLOR,
      nextCanvasTool: "ping"
    });
    expect(getTableToolSelectionPlan("laser", "laser")).toMatchObject({
      pingColor: null,
      nextCanvasTool: null
    });
  });

  it("plans fog, weather mask, and animated effect tool selection side effects", () => {
    expect(getFogToolSelectionPlan("circle", "hide", "reveal-brush")).toEqual({
      clearCanvasTool: true,
      clearDrawingTool: true,
      clearWeatherMaskTool: true,
      clearEnvironmentEffectTool: true,
      nextFogTool: "hide-circle"
    });
    expect(getFogToolSelectionPlan("circle", "hide", "hide-circle").nextFogTool).toBeNull();

    expect(getWeatherMaskToolSelectionPlan("polygon", "rectangle")).toEqual({
      clearCanvasTool: true,
      clearFogTool: true,
      clearDrawingTool: true,
      clearEnvironmentEffectTool: true,
      nextWeatherMaskTool: "polygon"
    });
    expect(getWeatherMaskToolSelectionPlan("polygon", "polygon").nextWeatherMaskTool).toBeNull();

    expect(getEnvironmentEffectToolSelectionPlan("rectangle", "circle")).toEqual({
      clearCanvasTool: true,
      clearFogTool: true,
      clearDrawingTool: true,
      clearWeatherMaskTool: true,
      nextEnvironmentEffectTool: "rectangle"
    });
    expect(getEnvironmentEffectToolSelectionPlan("rectangle", "rectangle").nextEnvironmentEffectTool).toBeNull();
  });

  it("plans fog operation and mouse category updates", () => {
    expect(getFogToolForOperation("hide", "polygon")).toBe("hide-polygon");
    expect(getFogToolForOperation("reveal", null)).toBeNull();

    expect(getMouseCategoryTogglePlan(null)).toEqual({
      activeCategory: "mouse",
      clearTools: false,
      clearHelp: true
    });
    expect(getMouseCategoryTogglePlan("drawing")).toEqual({
      activeCategory: "mouse",
      clearTools: true,
      clearHelp: true
    });
    expect(getMouseCategoryTogglePlan("mouse")).toEqual({
      activeCategory: null,
      clearTools: false,
      clearHelp: true
    });
  });

  it("builds menu button class names consistently", () => {
    expect(getToolCategoryButtonClassName(false)).toBe("tools-category-button");
    expect(getToolCategoryButtonClassName(true)).toBe("tools-category-button tool-active");
    expect(getToolButtonClassName(false)).toBe("tool-circle-button");
    expect(getToolButtonClassName(true)).toBe("tool-circle-button tool-active");
    expect(getToolButtonClassName(false, "danger")).toBe("tool-circle-button danger");
    expect(getToolButtonClassName(true, "help")).toBe("tool-circle-button tool-help-trigger tools-panel-help-button tool-active");
  });
});
