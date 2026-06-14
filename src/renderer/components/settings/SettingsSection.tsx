import { ChevronDown, ChevronRight, CircleHelp } from "lucide-react";
import type { ReactNode } from "react";

export function CollapsibleSettingsSection({
  title,
  meta,
  open,
  onToggle,
  children
}: {
  title: string;
  meta: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="settings-section settings-section-collapsible">
      <button type="button" className="settings-section-heading settings-section-toggle" aria-expanded={open} onClick={onToggle}>
        {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
        <strong>{title}</strong>
        <span>{meta}</span>
      </button>
      {open && <div className="settings-section-body">{children}</div>}
    </div>
  );
}

export function SettingsField({
  label,
  help,
  helpId,
  openHelpId,
  onToggleHelp,
  children
}: {
  label: string;
  help: string;
  helpId: string;
  openHelpId: string | null;
  onToggleHelp: (helpId: string | null) => void;
  children: ReactNode;
}) {
  const helpOpen = openHelpId === helpId;
  return (
    <div className="settings-help-field">
      <div className="setting-row">
        <span className="settings-label-with-help">
          {label}
          <button
            type="button"
            className="icon-button measurement-help-button"
            aria-label={`${label} Help`}
            title={`${label} Help`}
            onClick={() => onToggleHelp(helpOpen ? null : helpId)}
          >
            <CircleHelp size={15} aria-hidden="true" />
          </button>
        </span>
        <div className="settings-field-control">{children}</div>
      </div>
      {helpOpen && (
        <div className="settings-help-panel" role="note">
          <p>{help}</p>
        </div>
      )}
    </div>
  );
}

export function SettingsReadout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="settings-readout-block">
      <span>{label}</span>
      {children}
    </div>
  );
}
