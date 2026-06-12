import { useLayoutEffect, useRef, useState } from "react";
import { calculateFloatingMenuPosition } from "../lib/menuPosition";

interface FloatingMenuPositionOptions {
  open: boolean;
  anchor: HTMLElement | null;
  fallbackWidth?: number;
  fallbackHeight?: number;
  gap?: number;
  viewportPadding?: number;
}

export function useFloatingMenuPosition({
  open,
  anchor,
  fallbackWidth = 160,
  fallbackHeight = 120,
  gap = 6,
  viewportPadding = 6
}: FloatingMenuPositionOptions) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchor) {
      return;
    }

    const updatePosition = () => {
      const anchorRect = anchor.getBoundingClientRect();
      const menuRect = menuRef.current?.getBoundingClientRect();
      const menuWidth = menuRect?.width ?? fallbackWidth;
      const menuHeight = menuRect?.height ?? fallbackHeight;
      setPosition(
        calculateFloatingMenuPosition({
          anchorRect,
          menuWidth,
          menuHeight,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          gap,
          viewportPadding
        })
      );
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchor, fallbackHeight, fallbackWidth, gap, open, viewportPadding]);

  return { menuRef, position };
}
