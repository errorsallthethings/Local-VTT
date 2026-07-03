import type { EnvironmentEffectType, Scene } from "../../../shared/localvtt";
import type { DrawingTool } from "../../canvas/drawings";
import type { FogTool } from "../../canvas/fog";
import type { RulerDrag } from "../../canvas/measurement";
import type { TokenDragPreview } from "../../canvas/tokens";
import type { DrawingTemplateSize, EnvironmentEffectTool, WeatherMaskTool } from "../tools";
import {
  DrawingToolStatusStrip,
  EnvironmentEffectStatusStrip,
  FogToolStatusStrip,
  RulerStatusStrip,
  TableToolStatusStrip,
  TokenMoveStatusStrip,
  WeatherMaskStatusStrip
} from "./SceneCanvasStatusStrips";

interface SceneCanvasToolStatusOverlaysProps {
  activeFogBrushSize: number;
  canvasTool: "ruler" | "ping" | "laser" | null | undefined;
  drawingTemplateSize: DrawingTemplateSize;
  drawingTool: DrawingTool | null | undefined;
  environmentEffectTool: EnvironmentEffectTool | null | undefined;
  environmentEffectType: EnvironmentEffectType;
  environmentPolygonPointCount: number;
  fogPolygonPointCount: number;
  fogTool: FogTool | null | undefined;
  mode: "gm" | "player";
  rulerDrag: RulerDrag | null;
  scene: Scene | null;
  tokenDragPreview: TokenDragPreview | null;
  weatherMaskTool: WeatherMaskTool | null | undefined;
  weatherPolygonPointCount: number;
}

export function SceneCanvasToolStatusOverlays({
  activeFogBrushSize,
  canvasTool,
  drawingTemplateSize,
  drawingTool,
  environmentEffectTool,
  environmentEffectType,
  environmentPolygonPointCount,
  fogPolygonPointCount,
  fogTool,
  mode,
  rulerDrag,
  scene,
  tokenDragPreview,
  weatherMaskTool,
  weatherPolygonPointCount
}: SceneCanvasToolStatusOverlaysProps) {
  if (mode !== "gm") {
    return null;
  }

  return (
    <>
      {fogTool && <FogToolStatusStrip fogTool={fogTool} polygonPointCount={fogPolygonPointCount} brushSize={activeFogBrushSize} />}
      {drawingTool && <DrawingToolStatusStrip drawingTool={drawingTool} drawingTemplateSize={drawingTemplateSize} />}
      {canvasTool === "ruler" && <RulerStatusStrip rulerDrag={rulerDrag} scene={scene} />}
      {(canvasTool === "ping" || canvasTool === "laser") && <TableToolStatusStrip canvasTool={canvasTool} />}
      {weatherMaskTool && <WeatherMaskStatusStrip weatherMaskTool={weatherMaskTool} pointCount={weatherPolygonPointCount} />}
      {environmentEffectTool && <EnvironmentEffectStatusStrip environmentEffectTool={environmentEffectTool} effect={environmentEffectType} pointCount={environmentPolygonPointCount} />}
      {tokenDragPreview && <TokenMoveStatusStrip scene={scene} tokenDragPreview={tokenDragPreview} />}
    </>
  );
}

export type SceneCanvasToolStatusKey = "fog" | "drawing" | "ruler" | "table" | "weather-mask" | "environment-effect" | "token-move";

export function getSceneCanvasToolStatusKeys({
  canvasTool,
  drawingTool,
  environmentEffectTool,
  fogTool,
  mode,
  tokenDragPreview,
  weatherMaskTool
}: Pick<
  SceneCanvasToolStatusOverlaysProps,
  "canvasTool" | "drawingTool" | "environmentEffectTool" | "fogTool" | "mode" | "tokenDragPreview" | "weatherMaskTool"
>): SceneCanvasToolStatusKey[] {
  if (mode !== "gm") {
    return [];
  }

  const keys: SceneCanvasToolStatusKey[] = [];
  if (fogTool) {
    keys.push("fog");
  }
  if (drawingTool) {
    keys.push("drawing");
  }
  if (canvasTool === "ruler") {
    keys.push("ruler");
  } else if (canvasTool === "ping" || canvasTool === "laser") {
    keys.push("table");
  }
  if (weatherMaskTool) {
    keys.push("weather-mask");
  }
  if (environmentEffectTool) {
    keys.push("environment-effect");
  }
  if (tokenDragPreview) {
    keys.push("token-move");
  }
  return keys;
}
