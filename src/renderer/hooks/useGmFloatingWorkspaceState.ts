import { useState } from "react";
import type { Point } from "../../shared/localvtt";
import type { MapCalibrationBox } from "../components/settings/MapCalibrationAssistant";

export function useGmFloatingWorkspaceState() {
  const [environmentEffectEditorPosition, setEnvironmentEffectEditorPosition] = useState<{ x: number; y: number } | null>(null);
  const [environmentEffectEditorSize, setEnvironmentEffectEditorSize] = useState<{ width: number; height: number } | null>(null);
  const [selectorSelectionFilters, setSelectorSelectionFilters] = useState({
    tokens: true,
    templates: false,
    fogMasks: false,
    weatherMasks: false,
    drawings: true
  });
  const [mapCalibrationBox, setMapCalibrationBox] = useState<MapCalibrationBox | null>(null);
  const [dicePanelOpen, setDicePanelOpen] = useState(false);
  const [tokenLibraryExpanded, setTokenLibraryExpanded] = useState(false);
  const [turnOrderModalOpen, setTurnOrderModalOpen] = useState(false);
  const [turnOrderModalCollapsed, setTurnOrderModalCollapsed] = useState(false);
  const [turnOrderModalPosition, setTurnOrderModalPosition] = useState<{ x: number; y: number } | null>(null);
  const [turnOrderModalSize, setTurnOrderModalSize] = useState<{ width: number; height: number } | null>(null);
  const [turnOrderSettingsOpen, setTurnOrderSettingsOpen] = useState(false);
  const [gmCanvasCenter, setGmCanvasCenter] = useState<Point | null>(null);

  const toggleTurnOrderModal = () => {
    setTurnOrderModalOpen((open) => {
      if (!open) {
        setTurnOrderModalCollapsed(false);
      }
      return !open;
    });
  };

  return {
    dicePanelOpen,
    environmentEffectEditorPosition,
    environmentEffectEditorSize,
    gmCanvasCenter,
    mapCalibrationBox,
    selectorSelectionFilters,
    tokenLibraryExpanded,
    turnOrderModalCollapsed,
    turnOrderModalOpen,
    turnOrderModalPosition,
    turnOrderModalSize,
    turnOrderSettingsOpen,
    setDicePanelOpen,
    setEnvironmentEffectEditorPosition,
    setEnvironmentEffectEditorSize,
    setGmCanvasCenter,
    setMapCalibrationBox,
    setSelectorSelectionFilters,
    setTokenLibraryExpanded,
    setTurnOrderModalCollapsed,
    setTurnOrderModalOpen,
    setTurnOrderModalPosition,
    setTurnOrderModalSize,
    setTurnOrderSettingsOpen,
    toggleTurnOrderModal
  };
}
