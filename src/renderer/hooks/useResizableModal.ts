import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

export interface ModalSize {
  width: number;
  height: number;
}

interface UseResizableModalOptions<TElement extends HTMLElement> {
  elementRef: RefObject<TElement | null>;
  position: { x: number; y: number } | null;
  size: ModalSize | null;
  minSize: ModalSize;
  maxSize?: Partial<ModalSize>;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: ModalSize) => void;
  margin?: number;
}

interface ResizeState {
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  left: number;
  top: number;
}

export function useResizableModal<TElement extends HTMLElement>({
  elementRef,
  position,
  size,
  minSize,
  maxSize,
  onPositionChange,
  onSizeChange,
  margin = 12
}: UseResizableModalOptions<TElement>) {
  const resizeRef = useRef<ResizeState | null>(null);

  const startResize = (event: ReactPointerEvent<HTMLElement>) => {
    const bounds = elementRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const left = position?.x ?? bounds.left;
    const top = position?.y ?? bounds.top;
    if (!position) {
      onPositionChange(clampModalPosition(left, top, bounds.width, bounds.height, margin));
    }

    resizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: size?.width ?? bounds.width,
      startHeight: size?.height ?? bounds.height,
      left,
      top
    };
  };

  const resize = (event: ReactPointerEvent<HTMLElement>) => {
    const state = resizeRef.current;
    if (!state || state.pointerId !== event.pointerId) {
      return;
    }

    const maxWidth = Math.min(maxSize?.width ?? Number.POSITIVE_INFINITY, Math.max(minSize.width, window.innerWidth - state.left - margin));
    const maxHeight = Math.min(maxSize?.height ?? Number.POSITIVE_INFINITY, Math.max(minSize.height, window.innerHeight - state.top - margin));
    onSizeChange({
      width: clampNumber(state.startWidth + event.clientX - state.startX, minSize.width, maxWidth),
      height: clampNumber(state.startHeight + event.clientY - state.startY, minSize.height, maxHeight)
    });
  };

  const stopResize = (event: ReactPointerEvent<HTMLElement>) => {
    if (resizeRef.current?.pointerId !== event.pointerId) {
      return;
    }
    resizeRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return { resize, startResize, stopResize };
}

export function clampModalPosition(x: number, y: number, width: number, height: number, margin = 12): { x: number; y: number } {
  return {
    x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - width - margin)),
    y: Math.min(Math.max(margin, y), Math.max(margin, window.innerHeight - height - margin))
  };
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(min, value), max);
}
