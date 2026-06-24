import { useEffect } from "react";

export function useWindowKeyDown(enabled: boolean, onKeyDown: (event: KeyboardEvent) => void) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onKeyDown]);
}
