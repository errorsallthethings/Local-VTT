import type { DrawingContextMenu, EnvironmentEffectContextMenu, MaskContextMenu, TokenContextMenu } from "../../../canvas/scene";
import {
  getDrawingContextMenu,
  getEnvironmentEffectContextMenu,
  getFogContextMenu,
  getTokenContextMenu,
  getWeatherMaskContextMenu
} from "../../../canvas/scene";
import type { Point } from "../../../../shared/localvtt";
import type { SceneContextMenuTarget } from "./sceneContextMenuTarget";

export type SceneContextMenuSelection = {
  tokenId?: string | null;
  drawingId?: string | null;
  fogShapeId?: string | null;
  weatherMaskId?: string | null;
  environmentEffectId?: string | null;
};

export type SceneContextMenuOpening = {
  selection: SceneContextMenuSelection;
  tokenContextMenu: TokenContextMenu | null;
  maskContextMenu: MaskContextMenu | null;
  drawingContextMenu: DrawingContextMenu | null;
  environmentEffectContextMenu: EnvironmentEffectContextMenu | null;
};

const CLOSED_CONTEXT_MENUS = {
  tokenContextMenu: null,
  maskContextMenu: null,
  drawingContextMenu: null,
  environmentEffectContextMenu: null
} satisfies Omit<SceneContextMenuOpening, "selection">;

export function getSceneContextMenuOpening(target: SceneContextMenuTarget, position: Point): SceneContextMenuOpening {
  if (target.kind === "token") {
    return {
      ...CLOSED_CONTEXT_MENUS,
      selection: {
        tokenId: target.token.id,
        fogShapeId: null,
        weatherMaskId: null,
        drawingId: null
      },
      tokenContextMenu: getTokenContextMenu(target.token, position)
    };
  }

  if (target.kind === "drawing") {
    return {
      ...CLOSED_CONTEXT_MENUS,
      selection: {
        tokenId: null,
        fogShapeId: null,
        weatherMaskId: null,
        drawingId: target.drawing.id
      },
      drawingContextMenu: getDrawingContextMenu(target.drawing, target.drawingIndex, position)
    };
  }

  if (target.kind === "weather-mask") {
    return {
      ...CLOSED_CONTEXT_MENUS,
      selection: {
        tokenId: null,
        drawingId: null,
        weatherMaskId: target.mask.id,
        fogShapeId: null
      },
      maskContextMenu: getWeatherMaskContextMenu(target.mask, position)
    };
  }

  if (target.kind === "fog") {
    return {
      ...CLOSED_CONTEXT_MENUS,
      selection: {
        tokenId: null,
        drawingId: null,
        fogShapeId: target.shape.id,
        weatherMaskId: null
      },
      maskContextMenu: getFogContextMenu(target.shape, target.shapeIndex, position)
    };
  }

  return {
    ...CLOSED_CONTEXT_MENUS,
    selection: {
      tokenId: null,
      drawingId: null,
      fogShapeId: null,
      weatherMaskId: null,
      environmentEffectId: target.effect.id
    },
    environmentEffectContextMenu: getEnvironmentEffectContextMenu(target.effect, target.effectIndex, position)
  };
}
