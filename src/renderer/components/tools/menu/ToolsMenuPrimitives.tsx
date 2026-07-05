import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { getToolButtonClassName } from "./toolMenuState";

export function PanelHeader({ title }: { title: string }) {
  return <div className="tools-subpanel-header">{title}</div>;
}

export function ToolButton({
  active = false,
  disabled = false,
  label,
  variant,
  children,
  onClick
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  variant?: "danger";
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={getToolButtonClassName(active, variant)} aria-label={label} title={label} type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function HelpButton({ active, disabled = false, label, onClick }: { active: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button className={getToolButtonClassName(active, "help")} aria-label={label} title={label} type="button" aria-expanded={active} disabled={disabled} onClick={onClick}>
      <HelpCircle size={14} aria-hidden="true" />
    </button>
  );
}

export function SettingsToggle({ open, label, onToggle }: { open: boolean; label: string; onToggle: () => void }) {
  return (
    <button className="tools-settings-toggle" type="button" aria-expanded={open} onClick={onToggle}>
      {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
      <strong>{label}</strong>
    </button>
  );
}

export function Placeholder({ message }: { message: string }) {
  return <div className="tools-placeholder">{message}</div>;
}
