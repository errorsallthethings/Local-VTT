import { Hand, SquareDashedMousePointer } from "lucide-react";
import { SelectorFilterCheckbox, SelectorSelectionActions, SelectorSelectionSummary, type SelectorSelectionCounts, type SelectorSelectionFilters } from "../settings/SelectorToolControls";
import { SettingsToggle, ToolButton } from "./ToolsMenuPrimitives";
import type { MouseBehavior } from "./toolMenuState";

export type SelectorSelectionFilterKey = keyof SelectorSelectionFilters;

export const SELECTOR_SELECTION_FILTER_CONTROLS: Array<{ key: SelectorSelectionFilterKey; label: string }> = [
  { key: "tokens", label: "Token" },
  { key: "templates", label: "Template" },
  { key: "fogMasks", label: "Fog Mask" },
  { key: "weatherMasks", label: "Weather Mask" },
  { key: "drawings", label: "Drawings" }
];

export function getSelectorSelectionFilterControls(filters: SelectorSelectionFilters) {
  return SELECTOR_SELECTION_FILTER_CONTROLS.map((control) => ({
    ...control,
    checked: filters[control.key]
  }));
}

export function updateSelectorSelectionFilter(
  filters: SelectorSelectionFilters,
  key: SelectorSelectionFilterKey,
  checked: boolean
): SelectorSelectionFilters {
  return {
    ...filters,
    [key]: checked
  };
}

export interface ToolsMenuMousePanelState {
  mouseBehavior: MouseBehavior;
  selectorSettingsOpen: boolean;
  selectorSelectionCounts: SelectorSelectionCounts;
  selectorSelectionFilters: SelectorSelectionFilters;
}

export interface ToolsMenuMousePanelActions {
  onClearActiveTools: () => void;
  onMouseBehaviorChange: (behavior: MouseBehavior) => void;
  onSelectorSettingsOpenChange: (open: boolean) => void;
  onSelectorSelectionFiltersChange: (filters: SelectorSelectionFilters) => void;
  onShowSelectedOnPlayerView: () => void;
  onHideSelectedOnPlayerView: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

interface ToolsMenuMousePanelProps {
  state: ToolsMenuMousePanelState;
  actions: ToolsMenuMousePanelActions;
}

export function ToolsMenuMousePanel({ state, actions }: ToolsMenuMousePanelProps) {
  const {
    mouseBehavior,
    selectorSettingsOpen,
    selectorSelectionCounts,
    selectorSelectionFilters
  } = state;
  const {
    onClearActiveTools,
    onMouseBehaviorChange,
    onSelectorSettingsOpenChange,
    onSelectorSelectionFiltersChange,
    onShowSelectedOnPlayerView,
    onHideSelectedOnPlayerView,
    onDeleteSelected,
    onClearSelection
  } = actions;

  const setMouseBehavior = (behavior: MouseBehavior) => {
    onClearActiveTools();
    onMouseBehaviorChange(behavior);
  };

  return (
    <div className="tools-panel-section">
      <div className="tools-button-row">
        <ToolButton active={mouseBehavior === "selector"} label="Selector" onClick={() => setMouseBehavior("selector")}>
          <SquareDashedMousePointer size={17} aria-hidden="true" />
        </ToolButton>
        <ToolButton active={mouseBehavior === "grabber"} label="Grabber" onClick={() => setMouseBehavior("grabber")}>
          <Hand size={17} aria-hidden="true" />
        </ToolButton>
      </div>
      {mouseBehavior === "selector" && (
        <>
          <SelectorSelectionSummary counts={selectorSelectionCounts} />
          <SelectorSelectionActions
            counts={selectorSelectionCounts}
            onShowSelectedOnPlayerView={onShowSelectedOnPlayerView}
            onHideSelectedOnPlayerView={onHideSelectedOnPlayerView}
            onDeleteSelected={onDeleteSelected}
            onClearSelection={onClearSelection}
          />
          <div className="tools-section-divider" />
          <SettingsToggle open={selectorSettingsOpen} label="Selector Settings" onToggle={() => onSelectorSettingsOpenChange(!selectorSettingsOpen)} />
          {selectorSettingsOpen && (
            <div className="tools-selector-settings" aria-label="Selector included layers">
              {getSelectorSelectionFilterControls(selectorSelectionFilters).map((control) => (
                <SelectorFilterCheckbox
                  key={control.key}
                  label={control.label}
                  checked={control.checked}
                  onChange={(checked) => onSelectorSelectionFiltersChange(updateSelectorSelectionFilter(selectorSelectionFilters, control.key, checked))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
