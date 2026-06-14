import type { ReactNode } from "react";

interface SettingsModalProps {
  children: ReactNode;
  footerStart?: ReactNode;
  onClose: () => void;
}

export function SettingsModal({ children, footerStart, onClose }: SettingsModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal settings-modal managed-settings-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="settings-modal-body">{children}</div>
        <div className="settings-modal-footer">
          <div className="settings-modal-footer-start">{footerStart}</div>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
