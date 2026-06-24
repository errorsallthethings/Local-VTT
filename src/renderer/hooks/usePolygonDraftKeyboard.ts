import { useEffect, useRef } from "react";

interface UsePolygonDraftKeyboardOptions {
  active: boolean;
  onCancel: () => void;
  onCommit: () => void;
}

export function usePolygonDraftKeyboard({ active, onCancel, onCommit }: UsePolygonDraftKeyboardOptions) {
  const onCancelRef = useRef(onCancel);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCancelRef.current = onCancel;
    onCommitRef.current = onCommit;
  }, [onCancel, onCommit]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        onCommitRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);
}
