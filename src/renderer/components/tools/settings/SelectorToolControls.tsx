import { Eye, EyeOff, Trash2, X } from "lucide-react";

export type SelectorSelectionFilters = {
  tokens: boolean;
  templates: boolean;
  fogMasks: boolean;
  weatherMasks: boolean;
  drawings: boolean;
};

export type SelectorSelectionCounts = {
  tokens: number;
  templates: number;
  fogMasks: number;
  weatherMasks: number;
  drawings: number;
};

export function SelectorFilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="tools-selector-filter">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function SelectorSelectionSummary({ counts }: { counts: SelectorSelectionCounts }) {
  const total = counts.tokens + counts.templates + counts.fogMasks + counts.weatherMasks + counts.drawings;
  return (
    <div className="tools-selector-summary" aria-live="polite">
      <strong>Selected</strong>
      <span>{total > 0 ? formatSelectorSelectionSummary(counts) : "None"}</span>
    </div>
  );
}

export function SelectorSelectionActions({
  counts,
  onShowSelectedOnPlayerView,
  onHideSelectedOnPlayerView,
  onDeleteSelected,
  onClearSelection
}: {
  counts: SelectorSelectionCounts;
  onShowSelectedOnPlayerView: () => void;
  onHideSelectedOnPlayerView: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}) {
  const total = counts.tokens + counts.templates + counts.fogMasks + counts.weatherMasks + counts.drawings;
  const disabled = total === 0;
  return (
    <div className="tools-selector-actions" aria-label="Selected item actions">
      <button type="button" className="tools-selector-action" title="Show selected on Player View" aria-label="Show selected on Player View" disabled={disabled} onClick={onShowSelectedOnPlayerView}>
        <Eye size={15} aria-hidden="true" />
      </button>
      <button type="button" className="tools-selector-action" title="Hide selected from Player View" aria-label="Hide selected from Player View" disabled={disabled} onClick={onHideSelectedOnPlayerView}>
        <EyeOff size={15} aria-hidden="true" />
      </button>
      <button type="button" className="tools-selector-action" title="Delete selected" aria-label="Delete selected" disabled={disabled} onClick={onDeleteSelected}>
        <Trash2 size={15} aria-hidden="true" />
      </button>
      <button type="button" className="tools-selector-action" title="Clear selection" aria-label="Clear selection" disabled={disabled} onClick={onClearSelection}>
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function formatSelectorSelectionSummary(counts: SelectorSelectionCounts): string {
  return [
    formatSelectorSelectionPart(counts.tokens, "Token"),
    formatSelectorSelectionPart(counts.templates, "Template"),
    formatSelectorSelectionPart(counts.drawings, "Drawing"),
    formatSelectorSelectionPart(counts.fogMasks, "Fog Mask"),
    formatSelectorSelectionPart(counts.weatherMasks, "Weather Mask")
  ]
    .filter(Boolean)
    .join(", ");
}

function formatSelectorSelectionPart(count: number, label: string): string | null {
  if (count <= 0) {
    return null;
  }
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}
