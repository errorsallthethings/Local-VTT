import { Map } from "lucide-react";
import type { EnvironmentEffectType, Scene } from "../../../shared/localvtt";
import type { DrawingTool } from "../../canvas/drawings";
import { isTemplateDrawingTool } from "../../canvas/drawings";
import type { FogTool } from "../../canvas/fog";
import { getRulerLabel, getTokenMoveLabel } from "../../canvas/live-table";
import type { RulerDrag } from "../../canvas/measurement";
import type { TokenDragPreview } from "../../canvas/tokens";
import { formatEnvironmentEffectOptionLabel as formatEnvironmentEffectLabel } from "../../lib/effects";
import {
  FOG_GRID_SNAP_HINT,
  getDrawingToolHint,
  getDrawingToolLabel,
  getEnvironmentEffectStatusHint,
  getEnvironmentEffectStatusLabel,
  getFogToolHint,
  getFogToolLabel,
  getWeatherMaskStatusHint,
  getWeatherMaskStatusLabel,
  RULER_CLEAR_HINT,
  RULER_GRID_SNAP_HINT,
  SHIFT_WAYPOINT_HINT,
  TOKEN_MOVE_COMPLETE_HINT
} from "../../lib/tools";
import type { DrawingTemplateSize, EnvironmentEffectTool, WeatherMaskTool } from "../tools";

export function MapLoadOverlay({ message, showSpinner }: { message: string; showSpinner: boolean }) {
  return (
    <div className="map-load-overlay" role="status" aria-live="polite">
      {showSpinner && <span className="map-load-spinner" aria-hidden="true" />}
      <span>{message}</span>
    </div>
  );
}

export function FogToolStatusStrip({
  fogTool,
  polygonPointCount,
  brushSize
}: {
  fogTool: FogTool;
  polygonPointCount: number;
  brushSize: number;
}) {
  const primaryHint = getFogToolHint(fogTool, polygonPointCount, brushSize);

  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>{getFogToolLabel(fogTool)}</strong>
      <span>{primaryHint}</span>
      <span>{FOG_GRID_SNAP_HINT}</span>
      <span>Escape cancels active drawing.</span>
      <span>Middle-click drag pans.</span>
    </div>
  );
}

export function DrawingToolStatusStrip({ drawingTool, drawingTemplateSize }: { drawingTool: DrawingTool; drawingTemplateSize: DrawingTemplateSize }) {
  const templateTool = isTemplateDrawingTool(drawingTool);
  const sizeLabel = drawingTemplateSize === "custom" || !templateTool ? "Custom size" : `${drawingTemplateSize} ft preset`;
  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>{getDrawingToolLabel(drawingTool)}</strong>
      <span>{getDrawingToolHint(drawingTool)}</span>
      {templateTool && <span>{sizeLabel}</span>}
      <span>Escape cancels active drawing.</span>
      <span>Middle-click drag pans.</span>
    </div>
  );
}

export function TokenMoveStatusStrip({ scene, tokenDragPreview }: { scene: Scene | null; tokenDragPreview: TokenDragPreview }) {
  const waypointCount = tokenDragPreview.waypoints.length;
  const tokenMoveLabel = scene ? getTokenMoveLabel(scene, tokenDragPreview) : null;
  return (
    <div className="canvas-tool-status" aria-live="polite">
      <strong>Token Move</strong>
      <span>Drag to position.</span>
      <span>{SHIFT_WAYPOINT_HINT}</span>
      <span>{waypointCount === 1 ? "1 waypoint" : `${waypointCount} waypoints`}</span>
      {tokenMoveLabel && <span>{tokenMoveLabel}</span>}
      <span>{TOKEN_MOVE_COMPLETE_HINT}</span>
    </div>
  );
}

export function RulerStatusStrip({ rulerDrag, scene }: { rulerDrag: RulerDrag | null; scene: Scene | null }) {
  const label = rulerDrag && scene ? getRulerLabel(rulerDrag, scene) : null;
  return (
    <div className="canvas-tool-status" aria-live="polite">
      <strong>Ruler</strong>
      <span>Left-drag to measure.</span>
      <span>{RULER_GRID_SNAP_HINT}</span>
      <span>{SHIFT_WAYPOINT_HINT}</span>
      {rulerDrag && <span>{rulerDrag.waypoints.length === 1 ? "1 waypoint" : `${rulerDrag.waypoints.length} waypoints`}</span>}
      {label && <span>{label.secondary ? `${label.primary} (${label.secondary})` : label.primary}</span>}
      <span>{RULER_CLEAR_HINT}</span>
    </div>
  );
}

export function TableToolStatusStrip({ canvasTool }: { canvasTool: "ping" | "laser" }) {
  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>{canvasTool === "ping" ? "Ping" : "Laser Pointer"}</strong>
      <span>{canvasTool === "ping" ? "Click the map to send a ping." : "Drag on the map to show a fading pointer trail."}</span>
    </div>
  );
}

export function MapCalibrationStatusStrip() {
  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong className="canvas-status-title">
        <Map size={14} aria-hidden="true" />
        Advanced Map Calibration
      </strong>
      <span>Drag over one printed grid square, or a larger block such as 5 x 5 squares.</span>
    </div>
  );
}

export function WeatherMaskStatusStrip({ weatherMaskTool, pointCount }: { weatherMaskTool: WeatherMaskTool; pointCount: number }) {
  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>{getWeatherMaskStatusLabel(weatherMaskTool)}</strong>
      <span>{getWeatherMaskStatusHint(weatherMaskTool, pointCount)}</span>
      <span>{FOG_GRID_SNAP_HINT}</span>
    </div>
  );
}

export function EnvironmentEffectStatusStrip({
  environmentEffectTool,
  effect,
  pointCount
}: {
  environmentEffectTool: EnvironmentEffectTool;
  effect: EnvironmentEffectType;
  pointCount: number;
}) {
  return (
    <div className="fog-tool-status" aria-live="polite">
      <strong>{getEnvironmentEffectStatusLabel(formatEnvironmentEffectLabel(effect), environmentEffectTool)}</strong>
      <span>{getEnvironmentEffectStatusHint(environmentEffectTool, pointCount)}</span>
      <span>{FOG_GRID_SNAP_HINT}</span>
    </div>
  );
}
