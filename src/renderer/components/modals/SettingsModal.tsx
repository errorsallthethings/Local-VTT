import type { ReactNode } from "react";

interface SettingsModalProps {
  children: ReactNode;
  onClose: () => void;
}

export function SettingsModal({ children, onClose }: SettingsModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal settings-modal" onMouseDown={(event) => event.stopPropagation()}>
        {children}
        <div className="button-row modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
