import type { FogTool } from "../canvas/fogRenderer";
import type { DrawingTool } from "../canvas/drawingRenderer";

export const FOG_GRID_SNAP_HINT = "Ctrl/Cmd snaps to grid corners.";
export const RULER_GRID_SNAP_HINT = "Ctrl/Cmd snaps to square or hex centers.";
export const SHIFT_WAYPOINT_HINT = "Shift adds a waypoint.";
export const RULER_CLEAR_HINT = "Right-click removes last waypoint. Escape clears.";
export const TOKEN_MOVE_COMPLETE_HINT = "Release to move. Right-click removes last waypoint. Escape cancels.";

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

export function getDrawingToolLabel(drawingTool: DrawingTool): string {
  switch (drawingTool) {
    case "line":
      return "Drawing Line";
    case "circle":
      return "Radius Template";
    case "rectangle":
      return "Square Template";
    case "cone":
      return "Cone Template";
    default:
      return "Freehand Drawing";
  }
}

export function getDrawingToolHint(drawingTool: DrawingTool): string {
  switch (drawingTool) {
    case "line":
      return "Left-drag to draw a straight line.";
    case "circle":
      return "Left-drag from center to set radius. Ctrl/Cmd snaps.";
    case "rectangle":
      return "Left-drag to place a square area. Ctrl/Cmd snaps.";
    case "cone":
      return "Left-drag from origin to aim a cone. Ctrl/Cmd snaps.";
    default:
      return "Left-drag to sketch on the scene.";
  }
}

export function getDrawingHelpLines(): string[] {
  return [
    "Freehand: left-drag to sketch a path on the scene.",
    "Line: left-drag to place a straight stroke.",
    "Templates: use radius, square, and cone tools for quick spell areas. Ctrl/Cmd snaps to grid centers.",
    "Drawings are saved as sub-layers under the Drawing layer.",
    "Use the Drawing layer list to reorder, hide, show, or remove individual drawings."
  ];
}

export function getWeatherHelpLines(): string[] {
  return [
    "Weather masks exclude weather from interiors or covered spaces.",
    "Rectangle: left-drag to draw; hold Shift for a square.",
    "Circle: left-drag from the center to set the radius.",
    "Polygon: click points, Enter or double-click to finish, right-click to remove the last point.",
    "Masks apply to every weather pattern on the scene."
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
