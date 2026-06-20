import type { FogTool } from "../canvas/fogRenderer";
import type { DrawingTool } from "../canvas/drawingRenderer";

export const FOG_GRID_SNAP_HINT = "Ctrl/Cmd snaps to the nearest grid center, corner, or edge midpoint.";
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
      return "Line";
    case "circle":
      return "Ellipse";
    case "rectangle":
      return "Rectangle";
    case "triangle":
      return "Triangle";
    case "polygon":
      return "Polygon";
    case "template-line":
      return "Line Template";
    case "template-circle":
      return "Radius Template";
    case "template-rectangle":
      return "Cube Template";
    case "template-cone":
      return "Cone Template";
    default:
      return "Brush";
  }
}

export function getDrawingToolHint(drawingTool: DrawingTool): string {
  switch (drawingTool) {
    case "line":
      return "Left-drag to draw a straight line.";
    case "circle":
      return "Left-drag from center to draw an ellipse. Hold Shift for a circle.";
    case "rectangle":
      return "Left-drag to draw a rectangle. Hold Shift for a square. Ctrl/Cmd snaps.";
    case "triangle":
      return "Left-drag to draw a triangle.";
    case "polygon":
      return "Click to place polygon points. Enter or double-click to finish. Right-click removes the last point.";
    case "template-line":
      return "Left-drag to place a measured line. Ctrl/Cmd snaps.";
    case "template-circle":
      return "Left-drag from center to set radius. Ctrl/Cmd snaps.";
    case "template-rectangle":
      return "Left-drag to place a cube footprint. Ctrl/Cmd snaps.";
    case "template-cone":
      return "Left-drag from origin to aim a cone. Ctrl/Cmd snaps.";
    default:
      return "Left-drag to sketch on the scene.";
  }
}

export function getDrawingHelpLines(): string[] {
  return [
    "Brush: left-drag to sketch a path on the scene.",
    "Line: left-drag to place a straight stroke.",
    "Rectangle: left-drag to draw a rectangle; hold Shift for a square.",
    "Ellipse: left-drag from the center to set width and height; hold Shift for a circle.",
    "Triangle: left-drag to place a triangular drawing.",
    "Polygon: click points, Enter or double-click to finish, right-click to remove the last point.",
    "Drawings are saved as sub-layers under the Drawing layer.",
    "Use the Drawing layer list to reorder, hide, show, or remove individual drawings."
  ];
}

export function getTemplateHelpLines(): string[] {
  return [
    "Line Template: left-drag to place a measured line.",
    "Radius Template: left-drag from the center to set a radius.",
    "Cube Template: left-drag to place a measured cube footprint.",
    "Cone Template: left-drag from the origin to aim an area cone.",
    "Templates use dashed strokes and can highlight covered square or hex grid spaces."
  ];
}

export function getTableHelpLines(): string[] {
  return [
    "Ruler: left-drag to measure distance. Shift adds a waypoint.",
    "Sonar: click the scene to send a visible ping.",
    "Laser Pointer: left-drag to point or trace attention on the scene.",
    "The Show/Hide setting controls whether table tool output is shared to Player View."
  ];
}

export function getWeatherHelpLines(): string[] {
  return [
    "Weather masks exclude weather from interiors or covered spaces.",
    "Rectangle: left-drag to draw; hold Shift for a square.",
    "Circle: left-drag from the center to set the radius.",
    "Polygon: click points, Enter or double-click to finish, right-click to remove the last point.",
    "Animated effect shape tools draw visible animated areas inside the Effects layer."
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
