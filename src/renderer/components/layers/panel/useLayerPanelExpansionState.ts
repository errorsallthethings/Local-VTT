import { useState } from "react";
import {
  getLayerExpandedToggleState,
  getLayerSettingsToggleIds
} from "./layerPanelState";

export function useLayerPanelExpansionState() {
  const [expandedLayerIds, setExpandedLayerIds] = useState<Set<string>>(() => new Set());
  const [settingsLayerIds, setSettingsLayerIds] = useState<Set<string>>(() => new Set());

  const toggleLayerExpanded = (layerId: string) => {
    const nextState = getLayerExpandedToggleState(layerId, expandedLayerIds, settingsLayerIds);
    setExpandedLayerIds(nextState.expandedLayerIds);
    setSettingsLayerIds(nextState.settingsLayerIds);
  };

  const toggleLayerSettings = (layerId: string) => {
    setSettingsLayerIds((ids) => getLayerSettingsToggleIds(layerId, ids));
  };

  return {
    expandedLayerIds,
    settingsLayerIds,
    toggleLayerExpanded,
    toggleLayerSettings
  };
}
