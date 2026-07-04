import type { DrawingElement } from "../../../shared/localvtt";
import { getDrawingPreviewPoints, type DrawingPreview } from "./drawingPreview";
import { getDrawingKindForTool } from "./templateDrawing";

export function getRenderableDrawingElementFromPreview(preview: DrawingPreview): DrawingElement {
  return {
    id: "preview",
    name: "Preview",
    kind: preview.kind === "circle" && !preview.ellipse ? "circle" : getDrawingKindForTool(preview.kind),
    points: getDrawingPreviewPoints(preview),
    color: preview.color,
    opacity: preview.opacity,
    strokeColor: preview.strokeColor ?? preview.color,
    strokeOpacity: preview.strokeOpacity ?? preview.opacity,
    strokeWidth: preview.strokeWidth,
    fillColor: preview.fillColor ?? preview.color,
    fillOpacity: preview.fillOpacity ?? 0,
    strokeStyle: preview.strokeStyle ?? "solid",
    templateEffect: preview.templateEffect,
    templateWidth: preview.templateWidth,
    templateFootprintVisible: preview.measurementLabelVisible === true,
    measurementLabelVisible: preview.measurementLabelVisible,
    visibleInGm: true,
    visibleInPlayer: true
  };
}
