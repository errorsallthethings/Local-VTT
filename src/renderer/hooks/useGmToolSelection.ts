import { useCallback, useState } from "react";
import type { DrawingTool } from "../canvas/drawings";
import type { FogTool } from "../canvas/fog";
import type { CanvasTool, EnvironmentEffectTool, MouseBehavior, WeatherMaskTool } from "../components/tools";

export function useGmToolSelection() {
  const [activeCanvasTool, setActiveCanvasTool] = useState<CanvasTool | null>(null);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool | null>(null);
  const [activeFogTool, setActiveFogTool] = useState<FogTool | null>(null);
  const [activeWeatherMaskTool, setActiveWeatherMaskTool] = useState<WeatherMaskTool | null>(null);
  const [activeEnvironmentEffectTool, setActiveEnvironmentEffectTool] = useState<EnvironmentEffectTool | null>(null);
  const [mouseBehavior, setMouseBehavior] = useState<MouseBehavior>("selector");

  const clearActiveCanvasTools = useCallback(() => {
    setActiveCanvasTool(null);
    setActiveDrawingTool(null);
    setActiveFogTool(null);
    setActiveWeatherMaskTool(null);
    setActiveEnvironmentEffectTool(null);
  }, []);

  return {
    activeCanvasTool,
    setActiveCanvasTool,
    activeDrawingTool,
    setActiveDrawingTool,
    activeFogTool,
    setActiveFogTool,
    activeWeatherMaskTool,
    setActiveWeatherMaskTool,
    activeEnvironmentEffectTool,
    setActiveEnvironmentEffectTool,
    mouseBehavior,
    setMouseBehavior,
    clearActiveCanvasTools
  };
}
