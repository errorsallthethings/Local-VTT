import type { Point } from "../../../../shared/localvtt";
import { getUpdatedWeatherMaskDrag, getWeatherMaskDragFromPoint, type WeatherMaskDrag } from "../../../canvas/weather";
import type { WeatherMaskTool } from "../../tools";

export type WeatherMaskPointerStart =
  | { kind: "polygon"; point: Point }
  | { kind: "drag"; drag: WeatherMaskDrag };

export interface WeatherMaskPointerStartOptions {
  button: number;
  hasScene: boolean;
  mode: "gm" | "player";
  onSceneChangeAvailable: boolean;
  point: Point;
  pointerId: number;
  tool: WeatherMaskTool | null | undefined;
}

export function getWeatherMaskPointerStart(options: WeatherMaskPointerStartOptions): WeatherMaskPointerStart | null {
  if (options.mode !== "gm" || !options.tool || !options.hasScene || !options.onSceneChangeAvailable || options.button !== 0) {
    return null;
  }

  if (options.tool === "polygon") {
    return { kind: "polygon", point: options.point };
  }

  return {
    kind: "drag",
    drag: getWeatherMaskDragFromPoint(options.pointerId, options.tool, options.point)
  };
}

export function getWeatherMaskPointerMove(activeDrag: WeatherMaskDrag | null, pointerId: number, point: Point, squareConstrained: boolean): WeatherMaskDrag | null {
  if (!activeDrag || activeDrag.pointerId !== pointerId) {
    return null;
  }

  return getUpdatedWeatherMaskDrag(activeDrag, point, squareConstrained);
}

export type WeatherMaskPointerMoveAction =
  | { kind: "set-preview"; drag: WeatherMaskDrag }
  | { kind: "none" };

export function getWeatherMaskPointerMoveAction(drag: WeatherMaskDrag | null): WeatherMaskPointerMoveAction {
  if (!drag) {
    return { kind: "none" };
  }
  return { kind: "set-preview", drag };
}
