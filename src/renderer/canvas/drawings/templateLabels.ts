import type { DrawingElement, Point, Scene } from "../../../shared/localvtt";
import { formatMeasurementDistance, getStraightLineMeasurementDistance } from "../measurement/measurement";
import { getConeTriangle } from "./drawingGeometry";

export function getTemplateLabel(drawing: DrawingElement, scene: Scene): string | null {
  const [start, end] = drawing.points;
  if (!start || !end) {
    return null;
  }
  const distance = getStraightLineMeasurementDistance(start, end, scene.grid);
  if (drawing.kind === "rectangle") {
    const squareSideDistance = getTemplateRectangleSideDistance(start, end, scene);
    return `${formatMeasurementDistance(squareSideDistance, scene.grid.measurement, scene.grid.type)} square`;
  }
  if (drawing.kind === "circle") {
    return `${formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type)} radius`;
  }
  if (drawing.kind === "cone") {
    return `${formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type)} cone`;
  }
  if (drawing.kind === "line" && (drawing.templateWidth ?? 5) > 0) {
    const width = formatMeasurementDistance(drawing.templateWidth ?? 5, scene.grid.measurement, scene.grid.type);
    return `${formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type)} x ${width}`;
  }
  return formatMeasurementDistance(distance, scene.grid.measurement, scene.grid.type);
}

export function getTemplateLabelPosition(drawing: DrawingElement): { position: Point; angle: number } {
  const [start, end] = drawing.points;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  if (drawing.kind === "circle") {
    return {
      position: {
        x: start.x,
        y: start.y - 18
      },
      angle: 0
    };
  }
  if (drawing.kind === "rectangle") {
    return {
      position: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2
      },
      angle: 0
    };
  }
  if (drawing.kind === "cone") {
    const triangle = getConeTriangle(drawing.points);
    if (triangle) {
      const oppositeCenter = {
        x: (triangle[1].x + triangle[2].x) / 2,
        y: (triangle[1].y + triangle[2].y) / 2
      };
      return {
        position: {
          x: (triangle[0].x + oppositeCenter.x) / 2,
          y: (triangle[0].y + oppositeCenter.y) / 2
        },
        angle
      };
    }
  }
  return {
    position: {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    },
    angle
  };
}

function getTemplateRectangleSideDistance(start: Point, end: Point, scene: Scene): number {
  const sideLengthPx = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return sideLengthPx;
  }
  return (sideLengthPx / scene.grid.sizePx) * scene.grid.measurement.unitsPerGridCell;
}
