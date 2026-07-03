import { describe, expect, it } from "vitest";
import {
  createFogTool,
  getActiveFogShape,
  getActiveToolCategory,
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
});
