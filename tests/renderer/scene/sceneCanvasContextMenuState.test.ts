import { describe, expect, it, vi } from "vitest";
import type { SceneContextMenuOpening } from "../../../src/renderer/components/scene/context-menu/sceneContextMenuOpening";
import {
  EMPTY_SCENE_CANVAS_CONTEXT_MENU_STATE,
  applySceneCanvasContextMenuSelection,
  getSceneCanvasContextMenuStateForOpening,
  hasSceneCanvasContextMenu
} from "../../../src/renderer/components/scene/context-menu/useSceneCanvasContextMenus";

describe("scene canvas context menu state", () => {
  it("detects whether any canvas context menu is open", () => {
    expect(hasSceneCanvasContextMenu(EMPTY_SCENE_CANVAS_CONTEXT_MENU_STATE)).toBe(false);
    expect(hasSceneCanvasContextMenu({
      ...EMPTY_SCENE_CANVAS_CONTEXT_MENU_STATE,
      tokenContextMenu: {
        tokenId: "token-1",
        tokenName: "Token",
        visibleInGm: true,
        visibleInPlayer: true,
        x: 10,
        y: 20
      }
    })).toBe(true);
  });

  it("derives menu state from a context menu opening", () => {
    const opening: SceneContextMenuOpening = {
      selection: { tokenId: "token-1", drawingId: null, fogShapeId: null, weatherMaskId: null },
      tokenContextMenu: {
        tokenId: "token-1",
        tokenName: "Token",
        visibleInGm: true,
        visibleInPlayer: false,
        x: 12,
        y: 24
      },
      maskContextMenu: null,
      drawingContextMenu: null,
      environmentEffectContextMenu: null
    };

    expect(getSceneCanvasContextMenuStateForOpening(opening)).toEqual({
      drawingContextMenu: null,
      environmentEffectContextMenu: null,
      maskContextMenu: null,
      tokenContextMenu: opening.tokenContextMenu
    });
  });

  it("applies selection callbacks carried by a context menu opening", () => {
    const handlers = {
      onSelectDrawing: vi.fn(),
      onSelectEnvironmentEffect: vi.fn(),
      onSelectFogShape: vi.fn(),
      onSelectToken: vi.fn(),
      onSelectWeatherMask: vi.fn()
    };
    const opening: SceneContextMenuOpening = {
      selection: {
        tokenId: null,
        drawingId: "drawing-1",
        fogShapeId: null,
        weatherMaskId: null,
        environmentEffectId: "effect-1"
      },
      tokenContextMenu: null,
      maskContextMenu: null,
      drawingContextMenu: {
        drawingId: "drawing-1",
        label: "Drawing",
        isTemplate: false,
        templateFootprintVisible: false,
        visibleInGm: true,
        visibleInPlayer: true,
        x: 1,
        y: 2
      },
      environmentEffectContextMenu: {
        effectId: "effect-1",
        label: "Effect",
        visibleInGm: true,
        visibleInPlayer: true,
        x: 3,
        y: 4
      }
    };

    applySceneCanvasContextMenuSelection(opening, handlers);

    expect(handlers.onSelectToken).toHaveBeenCalledWith(null);
    expect(handlers.onSelectDrawing).toHaveBeenCalledWith("drawing-1");
    expect(handlers.onSelectFogShape).toHaveBeenCalledWith(null);
    expect(handlers.onSelectWeatherMask).toHaveBeenCalledWith(null);
    expect(handlers.onSelectEnvironmentEffect).toHaveBeenCalledWith("effect-1");
  });
});
