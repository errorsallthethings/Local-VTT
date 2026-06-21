import { useState } from "react";
import { DEFAULT_FOG, DEFAULT_TABLE_TOOLS } from "../../shared/localvtt";
import type { DrawingElement, DrawingStrokeStyle, DrawingTemplateEffect } from "../../shared/localvtt";
import type { DrawingTemplateSize, DrawingTemplateWidth, FogOperation } from "../components/tools";

export function useGmToolOptions() {
  const [tableToolsVisibleInPlayer, setTableToolsVisibleInPlayer] = useState(true);
  const [tableTools, setTableTools] = useState(() => ({ ...DEFAULT_TABLE_TOOLS }));
  const [fogOperation, setFogOperation] = useState<FogOperation>("reveal");
  const [fogBrushSize, setFogBrushSize] = useState(DEFAULT_FOG.brushSize);
  const [drawingColor, setDrawingColor] = useState("#ff0000");
  const [drawingOpacity, setDrawingOpacity] = useState(1);
  const [drawingFillColor, setDrawingFillColor] = useState("#ff0000");
  const [drawingFillOpacity, setDrawingFillOpacity] = useState(0);
  const [drawingStrokeStyle, setDrawingStrokeStyle] = useState<DrawingStrokeStyle>("solid");
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(40);
  const [drawingTemplateSize, setDrawingTemplateSize] = useState<DrawingTemplateSize>("custom");
  const [drawingTemplateEffect, setDrawingTemplateEffect] = useState<DrawingTemplateEffect>("plain");
  const [drawingTemplateWidth, setDrawingTemplateWidth] = useState<DrawingTemplateWidth>(5);
  const [templatePreviewVisibleInPlayer, setTemplatePreviewVisibleInPlayer] = useState(false);
  const [playerTemplatePreviewDrawing, setPlayerTemplatePreviewDrawing] = useState<DrawingElement | null>(null);

  const setPingSize = (pingSize: number) => setTableTools((current) => ({ ...current, pingSize }));
  const setPingColor = (pingColor: string) => setTableTools((current) => ({ ...current, pingColor }));
  const setLaserThickness = (laserThickness: number) => setTableTools((current) => ({ ...current, laserThickness }));
  const setLaserColor = (laserColor: string) => setTableTools((current) => ({ ...current, laserColor }));
  const setRulerLinger = (rulerLinger: boolean) => setTableTools((current) => ({ ...current, rulerLinger }));

  return {
    tableToolsVisibleInPlayer,
    setTableToolsVisibleInPlayer,
    tableTools,
    setPingSize,
    setPingColor,
    setLaserThickness,
    setLaserColor,
    setRulerLinger,
    fogOperation,
    setFogOperation,
    fogBrushSize,
    setFogBrushSize,
    drawingColor,
    setDrawingColor,
    drawingOpacity,
    setDrawingOpacity,
    drawingFillColor,
    setDrawingFillColor,
    drawingFillOpacity,
    setDrawingFillOpacity,
    drawingStrokeStyle,
    setDrawingStrokeStyle,
    drawingStrokeWidth,
    setDrawingStrokeWidth,
    drawingTemplateSize,
    setDrawingTemplateSize,
    drawingTemplateEffect,
    setDrawingTemplateEffect,
    drawingTemplateWidth,
    setDrawingTemplateWidth,
    templatePreviewVisibleInPlayer,
    setTemplatePreviewVisibleInPlayer,
    playerTemplatePreviewDrawing,
    setPlayerTemplatePreviewDrawing
  };
}
