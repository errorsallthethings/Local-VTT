import type { FogTool } from "../canvas/fogRenderer";

export const FOG_GRID_SNAP_HINT = "Ctrl/Cmd snaps to grid corners.";
export const RULER_GRID_SNAP_HINT = "Ctrl/Cmd snaps to square or hex centers.";
export const SHIFT_WAYPOINT_HINT = "Shift adds a waypoint.";
export const RULER_CLEAR_HINT = "Right-click removes last waypoint. Escape clears.";
export const TOKEN_MOVE_COMPLETE_HINT = "Release to move. Escape cancels.";

export function getFogToolLabel(fogTool: FogTool): string {
  const action = fogTool.startsWith("reveal") ? "Reveal" : "Hide";
  return `${action} ${getFogToolShapeLabel(fogTool)}`;
}

export function getFogToolHint(fogTool: FogTool, polygonPointCount: number, brushSize: number): string {
  if (fogTool.includes("brush")) {
    return `Left-drag to paint. Brush ${brushSize}px.`;
  }
  if (fogTool.includes("rectangle")) {
    return "Left-drag to draw. Hold Shift for square.";
  }
  if (fogTool.includes("circle")) {
    return "Left-drag from center to set radius.";
  }
  const finishHint = polygonPointCount >= 3 ? " Enter or double-click finishes." : "";
  const undoHint = polygonPointCount > 0 ? " Right-click removes last point." : "";
  return `Click to place points.${finishHint}${undoHint} Escape cancels.`;
}

export function getFogHelpLines(): string[] {
  return [
    "Brush: left-drag to paint reveal or hide shapes.",
    "Rectangle: left-drag to draw; hold Shift for a square.",
    "Circle: left-drag from the center to set the radius.",
    "Polygon: click points, Enter or double-click to finish, right-click to remove the last point.",
    `${FOG_GRID_SNAP_HINT} Escape cancels active drawing.`
  ];
}

export function getRulerHelpLines(): string[] {
  return [
    "Left-drag to measure distance.",
    RULER_GRID_SNAP_HINT,
    "Shift adds a waypoint to the current path.",
    RULER_CLEAR_HINT
  ];
}

function getFogToolShapeLabel(fogTool: FogTool): string {
  if (fogTool.includes("brush")) {
    return "Brush";
  }
  if (fogTool.includes("polygon")) {
    return "Polygon";
  }
  if (fogTool.includes("circle")) {
    return "Circle";
  }
  return "Rectangle";
}
