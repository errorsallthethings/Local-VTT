import { formatDefaultDrawingName, type DrawingElement, type DrawingKind, type DrawingTemplateEffect, type Point, type Scene } from "../../shared/localvtt";
import { getDrawingPreviewPoints, type DrawingPreview, type DrawingTool } from "./drawingRenderer";
import { constrainSquarePoint } from "./gridMath";

export type DrawingTemplateSize = "custom" | 5 | 10 | 15 | 20 | 30 | 60 | 100;

export function getDrawingTemplateCurrentPoint(start: Point, current: Point, tool: DrawingTool, scene: Scene | null, templateSize: DrawingTemplateSize): Point {
  if (!isTemplateDrawingTool(tool) || templateSize === "custom") {
    return tool === "template-rectangle" ? constrainSquarePoint(start, current) : current;
  }

  const distancePx = getTemplateDistancePixels(scene, templateSize);
  if (!distancePx) {
    return tool === "template-rectangle" ? constrainSquarePoint(start, current) : current;
  }

  if (tool === "template-rectangle") {
    return {
      x: start.x + distancePx * (current.x >= start.x ? 1 : -1),
      y: start.y + distancePx * (current.y >= start.y ? 1 : -1)
    };
  }

  const distance = Math.max(0.001, Math.hypot(current.x - start.x, current.y - start.y));
  return {
    x: start.x + ((current.x - start.x) / distance) * distancePx,
    y: start.y + ((current.y - start.y) / distance) * distancePx
  };
}

export function getTemplateDistancePixels(scene: Scene | null, templateSize: Exclude<DrawingTemplateSize, "custom">): number | null {
  if (!scene || scene.grid.type === "gridless" || scene.grid.sizePx <= 0 || scene.grid.measurement.unitsPerGridCell <= 0) {
    return null;
  }
  return (templateSize / scene.grid.measurement.unitsPerGridCell) * scene.grid.sizePx;
}

export function getTemplatePreviewDrawing(preview: DrawingPreview): DrawingElement | null {
  if (!isTemplateDrawingTool(preview.kind) || !preview.measurementLabelVisible) {
    return null;
  }
  return {
    id: "template-preview",
    name: "Template Preview",
    kind: getDrawingKindForTool(preview.kind),
    points: getDrawingPreviewPoints(preview),
    color: preview.color,
    opacity: preview.opacity,
    strokeColor: preview.strokeColor ?? preview.color,
    strokeOpacity: preview.strokeOpacity ?? preview.opacity,
    strokeWidth: preview.strokeWidth,
    fill: preview.fillColor ?? preview.color,
    fillColor: preview.fillColor ?? preview.color,
    fillOpacity: 0,
    strokeStyle: "dashed",
    templateEffect: "plain",
    templateWidth: preview.templateWidth ?? 5,
    templateFootprintVisible: true,
    measurementLabelVisible: true,
    visibleInGm: false,
    visibleInPlayer: true
  };
}

export function getDrawingElementFromPreview(preview: DrawingPreview, id: string, index: number): DrawingElement {
  const points = getDrawingPreviewPoints(preview);
  const kind = preview.kind === "circle" && points.length === 2 ? "circle" : getDrawingKindForTool(preview.kind);
  const isTemplate = preview.measurementLabelVisible === true;
  return {
    id,
    name: isTemplateDrawingTool(preview.kind) ? formatDefaultTemplateDrawingName(preview.kind, index, preview.templateEffect ?? "plain") : formatDefaultDrawingName(kind, index),
    kind,
    points,
    color: preview.color,
    opacity: preview.opacity,
    strokeColor: preview.strokeColor ?? preview.color,
    strokeOpacity: preview.strokeOpacity ?? preview.opacity,
    strokeWidth: preview.strokeWidth,
    fill: preview.fillColor,
    fillColor: preview.fillColor,
    fillOpacity: isTemplate ? 0 : (preview.fillOpacity ?? 0),
    strokeStyle: isTemplate ? "dashed" : (preview.strokeStyle ?? "solid"),
    templateEffect: isTemplate ? (preview.templateEffect ?? "plain") : "plain",
    templateWidth: isTemplate ? (preview.templateWidth ?? 5) : 5,
    templateFootprintVisible: isTemplate ? false : undefined,
    measurementLabelVisible: isTemplate,
    visibleInGm: true,
    visibleInPlayer: true
  };
}

export function isTemplateDrawingTool(tool: DrawingTool | null): tool is Extract<DrawingTool, "template-line" | "template-rectangle" | "template-circle" | "template-cone"> {
  return tool === "template-line" || tool === "template-rectangle" || tool === "template-circle" || tool === "template-cone";
}

export function getDrawingKindForTool(tool: DrawingTool): DrawingKind {
  if (tool === "template-line") {
    return "line";
  }
  if (tool === "template-rectangle") {
    return "rectangle";
  }
  if (tool === "template-circle") {
    return "circle";
  }
  if (tool === "template-cone") {
    return "cone";
  }
  if (tool === "circle") {
    return "ellipse";
  }
  return tool;
}

export function formatDefaultTemplateDrawingName(tool: DrawingTool, index: number, effect: DrawingTemplateEffect = "plain"): string {
  const effectLabel = getTemplateEffectNamePart(effect);
  if (tool === "template-line") {
    return `Template Line${effectLabel} ${index + 1}`;
  }
  if (tool === "template-circle") {
    return `Template Radius${effectLabel} ${index + 1}`;
  }
  if (tool === "template-rectangle") {
    return `Template Cube${effectLabel} ${index + 1}`;
  }
  if (tool === "template-cone") {
    return `Template Cone${effectLabel} ${index + 1}`;
  }
  return formatDefaultDrawingName(getDrawingKindForTool(tool), index);
}

export function getTemplateEffectNamePart(effect: DrawingTemplateEffect): string {
  if (effect === "plain") {
    return "";
  }
  const labels: Record<DrawingTemplateEffect, string> = {
    acid: "Acid",
    arcane: "Arcane",
    cold: "Cold",
    darkness: "Darkness",
    fire: "Fire",
    fog: "Fog",
    lightning: "Electric",
    nature: "Nature",
    plain: "Plain",
    poison: "Poison",
    psychic: "Psychic",
    radiant: "Radiant",
    storm: "Storm",
    thunder: "Thunder",
    water: "Water",
    web: "Web"
  };
  return ` - ${labels[effect]}`;
}
