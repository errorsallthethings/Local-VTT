import type { DrawingTemplateEffect } from "../../../shared/localvtt";

export type TemplateEffectStyle = {
  stroke: string;
  fill: string;
  fillOpacity: number;
  highlightFill: string;
  highlightStroke: string;
  dash?: number[];
};

export type TemplateInnerGlowStyle = {
  alpha: number;
  strokeStyle: string;
  shadowColor: string;
  shadowBlur: number;
  lineWidth: number;
  highlightAlpha: number;
  highlightLineWidth: number;
  highlightStrokeStyle: string;
};

const TEMPLATE_INNER_GLOW_COLORS: Record<Exclude<DrawingTemplateEffect, "plain">, { stroke: string; shadow: string; highlight: string }> = {
  acid: { stroke: "#bef264", shadow: "#d9f99d", highlight: "#f7fee7" },
  arcane: { stroke: "#c4b5fd", shadow: "#8b5cf6", highlight: "#ede9fe" },
  cold: { stroke: "#f8fafc", shadow: "#e0f2fe", highlight: "#ffffff" },
  darkness: { stroke: "#020617", shadow: "#020617", highlight: "#1e293b" },
  fire: { stroke: "#fb923c", shadow: "#f97316", highlight: "#fed7aa" },
  fog: { stroke: "#e2e8f0", shadow: "#f8fafc", highlight: "#f8fafc" },
  lightning: { stroke: "#facc15", shadow: "#fde047", highlight: "#fef08a" },
  nature: { stroke: "#86efac", shadow: "#22c55e", highlight: "#dcfce7" },
  poison: { stroke: "#a3e635", shadow: "#84cc16", highlight: "#d9f99d" },
  psychic: { stroke: "#f0abfc", shadow: "#db2777", highlight: "#fdf4ff" },
  radiant: { stroke: "#fef3c7", shadow: "#facc15", highlight: "#fff7ed" },
  storm: { stroke: "#93c5fd", shadow: "#60a5fa", highlight: "#dbeafe" },
  thunder: { stroke: "#d8b4fe", shadow: "#9333ea", highlight: "#f3e8ff" },
  water: { stroke: "#5eead4", shadow: "#14b8a6", highlight: "#ccfbf1" },
  web: { stroke: "#f8fafc", shadow: "#e2e8f0", highlight: "#ffffff" }
};

export function getTemplateEffectStyle(effect: DrawingTemplateEffect): TemplateEffectStyle {
  switch (effect) {
    case "acid":
      return { stroke: "#84cc16", fill: "#bef264", fillOpacity: 0, highlightFill: "rgb(132 204 22 / 0.2)", highlightStroke: "rgb(217 249 157 / 0.34)", dash: [12, 8, 3, 8] };
    case "arcane":
      return { stroke: "#a78bfa", fill: "#7c3aed", fillOpacity: 0, highlightFill: "rgb(124 58 237 / 0.2)", highlightStroke: "rgb(221 214 254 / 0.36)", dash: [10, 7] };
    case "cold":
      return { stroke: "#67e8f9", fill: "#f8fafc", fillOpacity: 0, highlightFill: "rgb(207 250 254 / 0.18)", highlightStroke: "rgb(165 243 252 / 0.38)", dash: [16, 6] };
    case "darkness":
      return { stroke: "#64748b", fill: "#020617", fillOpacity: 0, highlightFill: "rgb(15 23 42 / 0.34)", highlightStroke: "rgb(148 163 184 / 0.38)", dash: [7, 7] };
    case "fire":
      return { stroke: "#f97316", fill: "#f97316", fillOpacity: 0, highlightFill: "rgb(250 204 21 / 0.2)", highlightStroke: "rgb(254 215 170 / 0.38)", dash: [18, 7, 5, 7] };
    case "fog":
      return { stroke: "#cbd5e1", fill: "#e2e8f0", fillOpacity: 0, highlightFill: "rgb(226 232 240 / 0.22)", highlightStroke: "rgb(248 250 252 / 0.32)", dash: [5, 10] };
    case "lightning":
      return { stroke: "#fde047", fill: "#fde047", fillOpacity: 0, highlightFill: "rgb(250 204 21 / 0.18)", highlightStroke: "rgb(254 240 138 / 0.45)", dash: [20, 4, 3, 4] };
    case "nature":
      return { stroke: "#22c55e", fill: "#4ade80", fillOpacity: 0, highlightFill: "rgb(74 222 128 / 0.18)", highlightStroke: "rgb(187 247 208 / 0.34)", dash: [6, 5, 2, 5] };
    case "poison":
      return { stroke: "#a3e635", fill: "#a3e635", fillOpacity: 0, highlightFill: "rgb(54 83 20 / 0.28)", highlightStroke: "rgb(217 249 157 / 0.34)", dash: [9, 9] };
    case "psychic":
      return { stroke: "#f0abfc", fill: "#c026d3", fillOpacity: 0, highlightFill: "rgb(192 38 211 / 0.18)", highlightStroke: "rgb(245 208 254 / 0.38)", dash: [3, 7, 14, 7] };
    case "radiant":
      return { stroke: "#facc15", fill: "#fef3c7", fillOpacity: 0, highlightFill: "rgb(254 243 199 / 0.2)", highlightStroke: "rgb(254 240 138 / 0.45)", dash: [14, 5] };
    case "storm":
      return { stroke: "#60a5fa", fill: "#1e3a8a", fillOpacity: 0, highlightFill: "rgb(30 58 138 / 0.24)", highlightStroke: "rgb(147 197 253 / 0.38)", dash: [11, 5, 3, 5] };
    case "thunder":
      return { stroke: "#c084fc", fill: "#4c1d95", fillOpacity: 0, highlightFill: "rgb(76 29 149 / 0.18)", highlightStroke: "rgb(216 180 254 / 0.38)", dash: [22, 5] };
    case "water":
      return { stroke: "#0891b2", fill: "#0ea5e9", fillOpacity: 0, highlightFill: "rgb(14 165 233 / 0.18)", highlightStroke: "rgb(94 234 212 / 0.36)", dash: [12, 5] };
    case "web":
      return { stroke: "#f8fafc", fill: "#cbd5e1", fillOpacity: 0, highlightFill: "rgb(203 213 225 / 0.2)", highlightStroke: "rgb(248 250 252 / 0.45)", dash: [4, 6, 14, 6] };
    case "plain":
    default:
      return { stroke: "#7dd3fc", fill: "#7dd3fc", fillOpacity: 0.08, highlightFill: "rgb(122 162 247 / 0.18)", highlightStroke: "rgb(255 255 255 / 0.34)" };
  }
}

export function getTemplateInnerGlowStyle(effect: DrawingTemplateEffect, strokeWidth: number, layerOpacity: number): TemplateInnerGlowStyle | null {
  const alpha = Math.max(0, Math.min(0.7, layerOpacity * 0.55));
  if (alpha <= 0) {
    return null;
  }
  const colors = effect === "plain" ? { stroke: "#facc15", shadow: "#fde047", highlight: "#fef08a" } : TEMPLATE_INNER_GLOW_COLORS[effect];
  const acid = effect === "acid";
  return {
    alpha,
    strokeStyle: colors.stroke,
    shadowColor: colors.shadow,
    shadowBlur: acid ? Math.max(26, strokeWidth * 1.55) : Math.max(18, strokeWidth * 1.15),
    lineWidth: acid ? Math.max(34, strokeWidth * 3.25) : Math.max(26, strokeWidth * 2.6),
    highlightAlpha: acid ? Math.min(0.56, alpha * 0.96) : Math.min(0.42, alpha * 0.78),
    highlightLineWidth: acid ? Math.max(14, strokeWidth * 1.45) : Math.max(10, strokeWidth * 1.1),
    highlightStrokeStyle: colors.highlight
  };
}
