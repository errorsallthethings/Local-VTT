export interface WindowPointerDragStartEvent {
  preventDefault: () => void;
}

export interface WindowPointerDragBody {
  classList: Pick<DOMTokenList, "add" | "remove">;
}

export interface WindowPointerDragTarget {
  addEventListener: Window["addEventListener"];
  removeEventListener: Window["removeEventListener"];
}

export interface WindowPointerDragOptions {
  startEvent: WindowPointerDragStartEvent;
  bodyClassName: string;
  onPointerMove: (event: PointerEvent) => void;
  body?: WindowPointerDragBody;
  windowTarget?: WindowPointerDragTarget;
}

export type StopWindowPointerDrag = () => void;

export function startWindowPointerDrag({
  startEvent,
  bodyClassName,
  onPointerMove,
  body = document.body,
  windowTarget = window
}: WindowPointerDragOptions): StopWindowPointerDrag {
  startEvent.preventDefault();

  const stopPointerDrag = () => {
    body.classList.remove(bodyClassName);
    windowTarget.removeEventListener("pointermove", onPointerMove);
    windowTarget.removeEventListener("pointerup", stopPointerDrag);
  };

  body.classList.add(bodyClassName);
  windowTarget.addEventListener("pointermove", onPointerMove);
  windowTarget.addEventListener("pointerup", stopPointerDrag, { once: true });

  return stopPointerDrag;
}
