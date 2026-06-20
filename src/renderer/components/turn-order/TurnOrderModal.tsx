import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef
} from "react";
import { GripVertical, Settings2, X } from "lucide-react";

export function TurnOrderModal({
  children,
  position,
  settingsOpen,
  settingsDisabled,
  collapsed,
  onToggleSettings,
  onToggleCollapsed,
  onPositionChange,
  onClose
}: {
  children: ReactNode;
  position: { x: number; y: number } | null;
  settingsOpen: boolean;
  settingsDisabled: boolean;
  collapsed: boolean;
  onToggleSettings: () => void;
  onToggleCollapsed: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const style = position ? ({ left: position.x, top: position.y } as CSSProperties) : undefined;

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = modalRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top
    };
    onPositionChange(clampTurnOrderModalPosition(bounds.left, bounds.top, bounds));
  };

  const drag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    const bounds = modalRef.current?.getBoundingClientRect();
    if (!dragState || dragState.pointerId !== event.pointerId || !bounds) {
      return;
    }
    onPositionChange(clampTurnOrderModalPosition(event.clientX - dragState.offsetX, event.clientY - dragState.offsetY, bounds));
  };

  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <section
      ref={modalRef}
      className={[
        position ? "turn-order-modal turn-order-modal-positioned" : "turn-order-modal",
        collapsed ? "turn-order-modal-collapsed" : ""
      ].filter(Boolean).join(" ")}
      style={style}
      aria-label="Turn Order"
    >
      <div
        className="turn-order-modal-header"
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onDoubleClick={onToggleCollapsed}
      >
        <div className="turn-order-modal-title">
          <GripVertical size={15} aria-hidden="true" />
          <strong>Turn Order</strong>
        </div>
        <div className="turn-order-modal-actions" onPointerDown={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
          <button
            className={settingsOpen ? "icon-button dice-panel-icon-active" : "icon-button"}
            type="button"
            aria-label="Turn order settings"
            title="Turn order settings"
            aria-expanded={settingsOpen}
            disabled={settingsDisabled}
            onClick={onToggleSettings}
          >
            <Settings2 size={15} aria-hidden="true" />
          </button>
          <button className="icon-button" type="button" aria-label="Close turn order" title="Close turn order" onClick={onClose}>
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
      {!collapsed && <div className="turn-order-modal-body">{children}</div>}
    </section>
  );
}

function clampTurnOrderModalPosition(x: number, y: number, bounds: DOMRect): { x: number; y: number } {
  const margin = 12;
  return {
    x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - bounds.width - margin)),
    y: Math.min(Math.max(margin, y), Math.max(margin, window.innerHeight - bounds.height - margin))
  };
}
