import type { DrawingTemplateEffect } from "../../../shared/localvtt";

export type TemplateEffectStyle = {
  stroke: string;
  fill: string;
  fillOpacity: number;
  highlightFill: string;
  highlightStroke: string;
  dash?: number[];
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
