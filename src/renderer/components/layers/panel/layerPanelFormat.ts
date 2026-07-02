export type EnvironmentShapeKind = "rectangle" | "polygon" | "circle";

export function formatLayerPanelPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatLayerPanelMultiplier(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatEnvironmentShapeLabel(kind: EnvironmentShapeKind): string {
  return kind === "circle" ? "Radius" : kind === "polygon" ? "Polygon" : "Rectangle";
}

export function formatLayerPanelNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
