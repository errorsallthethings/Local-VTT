import type { DrawingElement } from "../../shared/localvtt";

export const DUPLICATE_DRAWING_OFFSET_PX = 24;

export function duplicateDrawingElement(sourceDrawing: DrawingElement, drawings: DrawingElement[], duplicateId: string, sourceLabel?: string): DrawingElement {
  return {
    ...sourceDrawing,
    id: duplicateId,
    name: getDuplicateDrawingName(sourceDrawing.name?.trim() || sourceLabel || "Drawing", drawings),
    points: sourceDrawing.points.map((point) => ({
      x: point.x + DUPLICATE_DRAWING_OFFSET_PX,
      y: point.y + DUPLICATE_DRAWING_OFFSET_PX
    }))
  };
}

export function getDuplicateDrawingName(sourceName: string, drawings: DrawingElement[]): string {
  const baseName = sourceName.replace(/\sCopy(?:\s\d+)?$/i, "").trim() || "Drawing";
  const existingNames = new Set(drawings.map((drawing) => (drawing.name ?? "").trim().toLowerCase()).filter(Boolean));
  let candidate = `${baseName} Copy`;
  let index = 2;
  while (existingNames.has(candidate.toLowerCase())) {
    candidate = `${baseName} Copy ${index}`;
    index += 1;
  }
  return candidate;
}
