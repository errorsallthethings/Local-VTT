import type { Point, Scene } from "../../../shared/localvtt";
import {
  getDrawingContextLabel,
  getEnvironmentEffectContextLabel,
  getFogShapeContextLabel,
  getWeatherMaskContextLabel
} from "./sceneContextLabels";

export type TokenContextMenu = {
  tokenId: string;
  tokenName: string;
  visibleInGm: boolean;
  visibleInPlayer: boolean;
  x: number;
  y: number;
};

export type MaskContextMenu =
  | {
      kind: "fog";
      shapeId: string;
      label: string;
      visibleInGm: boolean;
      visibleInPlayer: boolean;
      x: number;
      y: number;
    }
  | {
      kind: "effects";
      maskId: string;
      label: string;
      visible: boolean;
      visibleInPlayer: boolean;
      x: number;
      y: number;
    };

export type DrawingContextMenu = {
  drawingId: string;
  label: string;
  isTemplate: boolean;
  templateFootprintVisible: boolean;
  visibleInGm: boolean;
  visibleInPlayer: boolean;
  x: number;
  y: number;
};

export type EnvironmentEffectContextMenu = {
  effectId: string;
  label: string;
  visibleInGm: boolean;
  visibleInPlayer: boolean;
  x: number;
  y: number;
};

export function getTokenContextMenu(token: Scene["tokens"][number], position: Point): TokenContextMenu {
  return {
    tokenId: token.id,
    tokenName: token.name || "Token",
    visibleInGm: token.visibleInGm ?? !token.hidden,
    visibleInPlayer: token.visibleInPlayer,
    x: position.x,
    y: position.y
  };
}

export function getDrawingContextMenu(drawing: Scene["drawings"][number], drawingIndex: number, position: Point): DrawingContextMenu {
  return {
    drawingId: drawing.id,
    label: getDrawingContextLabel(drawing, drawingIndex),
    isTemplate: drawing.measurementLabelVisible === true,
    templateFootprintVisible: drawing.templateFootprintVisible === true,
    visibleInGm: drawing.visibleInGm ?? true,
    visibleInPlayer: drawing.visibleInPlayer,
    x: position.x,
    y: position.y
  };
}

export function getWeatherMaskContextMenu(mask: Scene["weather"]["masks"][number], position: Point): MaskContextMenu {
  return {
    kind: "effects",
    maskId: mask.id,
    label: getWeatherMaskContextLabel(mask),
    visible: mask.visible ?? true,
    visibleInPlayer: mask.visibleInPlayer ?? true,
    x: position.x,
    y: position.y
  };
}

export function getFogContextMenu(shape: Scene["fog"]["shapes"][number], shapeIndex: number, position: Point): MaskContextMenu {
  const visible = shape.visible ?? true;
  return {
    kind: "fog",
    shapeId: shape.id,
    label: getFogShapeContextLabel(shape, shapeIndex),
    visibleInGm: shape.visibleInGm ?? visible,
    visibleInPlayer: shape.visibleInPlayer ?? visible,
    x: position.x,
    y: position.y
  };
}

export function getEnvironmentEffectContextMenu(effect: Scene["environment"]["effects"][number], effectIndex: number, position: Point): EnvironmentEffectContextMenu {
  return {
    effectId: effect.id,
    label: getEnvironmentEffectContextLabel(effect, effectIndex),
    visibleInGm: effect.visibleInGm !== false,
    visibleInPlayer: effect.visibleInPlayer !== false,
    x: position.x,
    y: position.y
  };
}
