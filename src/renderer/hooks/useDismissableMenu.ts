import { useEffect } from "react";

interface UseDismissableMenuOptions {
  enabled: boolean;
  menuRootClass: string;
  onDismiss: () => void;
  closeOnEscape?: boolean;
}

export function useDismissableMenu({ enabled, menuRootClass, onDismiss, closeOnEscape = true }: UseDismissableMenuOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const closeMenu = (event: PointerEvent) => {
      if (event.composedPath().some((target) => target instanceof Element && target.classList.contains(menuRootClass))) {
        return;
      }
      onDismiss();
    };
    const closeMenuWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    window.addEventListener("pointerdown", closeMenu, true);
    if (closeOnEscape) {
      window.addEventListener("keydown", closeMenuWithEscape);
    }

    return () => {
      window.removeEventListener("pointerdown", closeMenu, true);
      if (closeOnEscape) {
        window.removeEventListener("keydown", closeMenuWithEscape);
      }
    };
  }, [closeOnEscape, enabled, menuRootClass, onDismiss]);
}
